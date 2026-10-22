import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { getDb } from "./db";

export type User = {
  id: number;
  email: string;
  name: string;
};

const SALT_ROUNDS = 10;
const VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

export const findUserByEmail = async (
  email: string
): Promise<
  (User & { passwordHash: string; emailVerifiedAt: Date | null }) | null
> => {
  const { pool, ready } = getDb();
  await ready;
  const { rows } = await pool.query(
    "SELECT id, email, name, password_hash, email_verified_at FROM users WHERE email = $1",
    [email.toLowerCase()]
  );
  if (!rows[0]) return null;
  return {
    id: rows[0].id,
    email: rows[0].email,
    name: rows[0].name,
    passwordHash: rows[0].password_hash,
    emailVerifiedAt: rows[0].email_verified_at,
  };
};

export const createUser = async (input: {
  email: string;
  name: string;
  password: string;
}): Promise<User> => {
  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
  const { pool, ready } = getDb();
  await ready;
  const { rows } = await pool.query(
    `INSERT INTO users (email, name, password_hash)
     VALUES ($1, $2, $3)
     RETURNING id, email, name`,
    [input.email.toLowerCase(), input.name, passwordHash]
  );
  return rows[0];
};

export const verifyPassword = (passwordHash: string, password: string) =>
  bcrypt.compare(password, passwordHash);

export const createVerificationToken = async (userId: number) => {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS);
  const { pool, ready } = getDb();
  await ready;
  await pool.query(
    "INSERT INTO email_verification_tokens (token, user_id, expires_at) VALUES ($1, $2, $3)",
    [token, userId, expiresAt]
  );
  return token;
};

export const consumeVerificationToken = async (
  token: string
): Promise<User | null> => {
  const { pool, ready } = getDb();
  await ready;

  const { rows } = await pool.query(
    `SELECT users.id, users.email, users.name
       FROM email_verification_tokens
       JOIN users ON users.id = email_verification_tokens.user_id
      WHERE email_verification_tokens.token = $1
        AND email_verification_tokens.expires_at > now()`,
    [token]
  );
  if (!rows[0]) return null;

  await pool.query("DELETE FROM email_verification_tokens WHERE token = $1", [
    token,
  ]);
  await pool.query(
    "UPDATE users SET email_verified_at = now() WHERE id = $1",
    [rows[0].id]
  );

  return { id: rows[0].id, email: rows[0].email, name: rows[0].name };
};
