import { getDb } from "./db";

export type WatchlistItem = {
  id: number;
  userEmail: string;
  mediaId: string;
  mediaType: "movies" | "series";
  title: string;
  posterPath: string | null;
  addedAt: string;
};

const rowToItem = (row: any): WatchlistItem => ({
  id: row.id,
  userEmail: row.user_email,
  mediaId: row.media_id,
  mediaType: row.media_type,
  title: row.title,
  posterPath: row.poster_path,
  addedAt:
    row.added_at instanceof Date ? row.added_at.toISOString() : row.added_at,
});

export const listWatchlist = async (
  userEmail: string
): Promise<WatchlistItem[]> => {
  const { pool, ready } = getDb();
  await ready;
  const { rows } = await pool.query(
    "SELECT * FROM watchlist WHERE user_email = $1 ORDER BY added_at DESC",
    [userEmail]
  );
  return rows.map(rowToItem);
};

export const isInWatchlist = async (
  userEmail: string,
  mediaId: string,
  mediaType: string
): Promise<boolean> => {
  const { pool, ready } = getDb();
  await ready;
  const { rows } = await pool.query(
    "SELECT 1 FROM watchlist WHERE user_email = $1 AND media_id = $2 AND media_type = $3",
    [userEmail, mediaId, mediaType]
  );
  return rows.length > 0;
};

export const addToWatchlist = async (item: {
  userEmail: string;
  mediaId: string;
  mediaType: string;
  title: string;
  posterPath: string | null;
}) => {
  const { pool, ready } = getDb();
  await ready;
  await pool.query(
    `INSERT INTO watchlist
      (user_email, media_id, media_type, title, poster_path, added_at)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (user_email, media_id, media_type) DO NOTHING`,
    [
      item.userEmail,
      item.mediaId,
      item.mediaType,
      item.title,
      item.posterPath,
      new Date().toISOString(),
    ]
  );
};

export const removeFromWatchlist = async (
  userEmail: string,
  mediaId: string,
  mediaType: string
) => {
  const { pool, ready } = getDb();
  await ready;
  await pool.query(
    "DELETE FROM watchlist WHERE user_email = $1 AND media_id = $2 AND media_type = $3",
    [userEmail, mediaId, mediaType]
  );
};

/**
 * INTENTIONAL FLAW (kept on purpose for a DevSecOps/CI-CD pipeline demo —
 * see SECURITY_NOTES.md): SQL injection via string interpolation instead of
 * a parameterized query. Do not copy this pattern elsewhere in the app.
 * `userEmail` is bound as a parameter, but `name` is concatenated directly
 * into the SQL text, so a payload like `' OR '1'='1' -- ` short-circuits
 * the whole WHERE clause (including the userEmail check) and leaks every
 * row in the table, not just the caller's own. A UNION-based payload can
 * go further and read arbitrary columns/tables.
 */
export const searchWatchlistByTitle = async (
  userEmail: string,
  name: string
): Promise<WatchlistItem[]> => {
  const { pool, ready } = getDb();
  await ready;
  const query = `SELECT * FROM watchlist WHERE user_email = $1 AND title LIKE '%${name}%'`;
  const { rows } = await pool.query(query, [userEmail]);
  return rows.map(rowToItem);
};
