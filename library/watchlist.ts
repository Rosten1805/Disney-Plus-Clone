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
 * [test/pipeline-full-green] Fixed: `name` is now bound as a parameter
 * ($2) instead of interpolated into the SQL text, closing the SQL
 * injection described in SECURITY_NOTES.md. Not merged to main — this
 * branch exists only to verify the pipeline deploys when the app is clean.
 */
export const searchWatchlistByTitle = async (
  userEmail: string,
  name: string
): Promise<WatchlistItem[]> => {
  const { pool, ready } = getDb();
  await ready;
  const { rows } = await pool.query(
    "SELECT * FROM watchlist WHERE user_email = $1 AND title LIKE $2",
    [userEmail, `%${name}%`]
  );
  return rows.map(rowToItem);
};
