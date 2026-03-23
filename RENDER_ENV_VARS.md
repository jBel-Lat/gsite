# Render Environment Variables

Set these in your Render Web Service:

- `BASE_URL` = leave empty if app is served from domain root (example: `https://your-app.onrender.com`)
- `DB_HOST`
- `DB_PORT` (usually `3306`)
- `DB_NAME`
- `DB_USER`
- `DB_PASS`
- `DB_CHARSET` (recommended: `utf8mb4`)

Optional:

- `DATABASE_URL` (full MySQL connection URL). If set, it can populate DB host/user/pass/name/port.

## Quick setup

1. In Render, open your service.
2. Go to **Environment**.
3. Add the variables above.
4. Redeploy the service.

