# Security notes

This app stores a per-user "My List" watchlist in Neon Postgres (connection
pool set up in `library/db.ts`, schema created on first query).

## Known intentional flaws (for CI/CD pipeline SAST/DAST demo purposes)

| # | Flaw | Location | Status |
|---|------|----------|--------|
| 1 | SQL injection via string interpolation instead of a parameterized query | `library/watchlist.ts` → `searchWatchlistByTitle()`, exposed at `GET /api/watchlist/search?name=` | Still present (intentional) |
| 2 | Stored XSS via `dangerouslySetInnerHTML` on unsanitized user input | `components/sections/collection/portrait/card.tsx`, rendered on `/my-list` (`showTitle` prop) | Still present (intentional) |
| 3 | Hardcoded secret fallback (fake Google OAuth client secret) | `pages/api/auth/[...nextauth].ts` → `GoogleProvider({ clientSecret: ... })` | Still present (intentional) |

`searchWatchlistByTitle()` builds its `LIKE` clause with a template string
(`'%${name}%'`) instead of binding `name` as a parameter. `user_email` is
still bound as a parameter, but because `name` is concatenated directly into
the SQL text, a payload closing the string and adding a tautology defeats
*both* filters at once. Verified locally: calling
`GET /api/watchlist/search?name=' OR '1'='1' -- ` as `alice@example.com`
returns every row in the table, including other users' watchlist items —
`user_email = ?` never actually gets evaluated because the injected
`OR '1'='1'` short-circuits the whole `WHERE` clause. A `UNION SELECT`
payload can go further and read arbitrary columns/tables entirely.

This is left in on purpose as a real target for a SAST tool (e.g. Semgrep's
`p/sql-injection` ruleset) to catch, mirroring how a demo pipeline is meant
to prove its gates actually work rather than just run successfully. Fixing
it is a one-line change — bind `name` as a parameter instead of
interpolating it:

```ts
const { rows } = await pool.query(
  "SELECT * FROM watchlist WHERE user_email = $1 AND title LIKE $2",
  [userEmail, `%${name}%`]
);
```

Every other watchlist query (`listWatchlist`, `isInWatchlist`,
`addToWatchlist`, `removeFromWatchlist`) already uses parameterized
queries and is not affected. The credentials auth queries in
`library/users.ts` (login, registration, email verification tokens) are
also fully parameterized — not injectable.

### #2 — Stored XSS on `/my-list`

`POST /api/watchlist` accepts any client-supplied `title` string with no
validation and stores it verbatim in Postgres (`library/watchlist.ts` →
`addToWatchlist`). `components/sections/collection/portrait/card.tsx`
renders that title with `dangerouslySetInnerHTML` instead of as plain
JSX text, gated behind a `showTitle` prop that only `/my-list`
(`app/my-list/page.tsx`) turns on — every other page using this shared
`Card` (home, search, originals, etc.) only ever feeds it trusted TMDB
titles and never shows a caption, so they're unaffected.

Verified locally: `POST /api/watchlist` with
`title: "<b style=\"color:red\">INJECTED</b>"` persists, and visiting
`/my-list` renders it as live bold red HTML instead of the literal
text — confirming the sink executes attacker-controlled markup instead
of escaping it. A real payload (`<img src=x onerror=...>`) would run
arbitrary JS in that viewer's session. Fixing it is dropping
`dangerouslySetInnerHTML` for plain JSX interpolation (React escapes by
default):

```tsx
<p className="mt-1 truncate text-xs font-semibold">{media.title}</p>
```

### #3 — Hardcoded secret fallback

`GoogleProvider({ clientSecret: ... })` in
`pages/api/auth/[...nextauth].ts` falls back to a hardcoded string
(`"GOCSPX-..."`, matching the real format Google issues) when
`GOOGLE_SECRET` isn't set. The fake value is harmless by itself — it's
not registered with Google and nothing authenticates with it while
`.env` has a real secret — but it's exactly the pattern a secrets
scanner (gitleaks, trufflehog, GitHub secret scanning) is built to flag:
a credential-shaped string committed to source instead of living only
in env vars or a secret manager. Fixing it means removing the fallback
entirely so a missing env var fails loudly instead of silently:

```ts
clientSecret: process.env.GOOGLE_SECRET!,
```

## Real findings fixed during development

These were not staged — they showed up from normal `npm audit` /
dependency-review checks while building the email/password + email
verification feature, and were fixed immediately rather than left in:

| # | Finding | Fix |
|---|---------|-----|
| 1 | `nodemailer@7.0.13` had several real advisories (SSRF / arbitrary file read via the `raw` message option — GHSA-p6gq-j5cr-w38f, plus ReDoS and TLS-validation issues in OAuth2 token fetch) | Upgraded to `nodemailer@10.2.1`, the first patched release; confirmed `npm audit` no longer flags it and the verification-email flow still works end to end |
| 2 | No baseline HTTP security headers (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`) | Added in `next.config.js` via `headers()`, applied to every route |

## Known gaps (not fixed — tracked here instead)

Left as-is for now; a DAST/config-review step in the pipeline should
still be able to surface these:

- **No Content-Security-Policy.** Skipped deliberately — getting a CSP
  right for Next.js + Google OAuth + TMDB/Google-avatar images without
  breaking the app needs real testing, not a copy-pasted header.
- **User enumeration on registration.** `POST /api/auth/register`
  replies "An account with this email already exists" (409), which
  confirms whether an email is registered.
- **No rate limiting** on `/api/auth/register`, `/api/auth/verify`, or
  the credentials login — nothing currently throttles brute-force or
  mass account-creation attempts.
- **Dev-toolchain-only `npm audit` findings** (`tailwindcss`'s
  `braces`/`micromatch`, `eslint-config-next`'s `fast-glob`) — ReDoS/CPU
  issues in build-time tooling, not shipped to users. Left alone because
  the fix requires a major-version bump of Tailwind/ESLint config, which
  is a separate piece of work from this feature.
