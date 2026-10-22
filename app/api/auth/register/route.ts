import { NextRequest, NextResponse } from "next/server";
import {
  createUser,
  createVerificationToken,
  findUserByEmail,
} from "../../../../library/users";
import { sendVerificationEmail } from "../../../../library/mailer";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const POST = async (request: NextRequest) => {
  const body = await request.json().catch(() => null);
  const { name, email, password } = body ?? {};

  if (
    typeof name !== "string" ||
    typeof email !== "string" ||
    typeof password !== "string" ||
    !name.trim() ||
    !EMAIL_RE.test(email) ||
    password.length < 8
  ) {
    return NextResponse.json(
      {
        error:
          "A valid name, email and a password of at least 8 characters are required",
      },
      { status: 400 }
    );
  }

  const existing = await findUserByEmail(email);
  if (existing) {
    return NextResponse.json(
      { error: "An account with this email already exists" },
      { status: 409 }
    );
  }

  const user = await createUser({ name: name.trim(), email, password });
  const token = await createVerificationToken(user.id);

  const verifyUrl = `${process.env.NEXTAUTH_URL}/api/auth/verify?token=${token}`;
  const { previewUrl } = await sendVerificationEmail(user.email, verifyUrl);

  return NextResponse.json(
    {
      user,
      message: "Check your email to confirm your account",
      // Only present when no real SMTP is configured (local Ethereal test
      // inbox) — lets the demo flow be exercised without a real mailbox.
      previewUrl,
    },
    { status: 201 }
  );
};
