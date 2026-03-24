# Render Environment Variables

Set these in your Render Web Service:

- `DB_TYPE` = `mysql`
- `BASE_URL` = leave empty if app is served from domain root (example: `https://your-app.onrender.com`)
- `DB_HOST` = `centerbeam.proxy.rlwy.net`
- `DB_PORT` = `54756`
- `DB_NAME` = `railway`
- `DB_USER` = `root`
- `DB_PASSWORD` (preferred) or `DB_PASS`
- `DB_SSL` = `true`
- `DB_CHARSET` (recommended: `utf8mb4`)
- `SESSION_SECRET` = long random value
- `JWT_SECRET` = long random value (required for Bearer token auth)
- `UPLOADS_DIR` = `/var/data/uploads` (if using Render persistent disk)

Optional:

- `DATABASE_URL` (full connection URL). If set, it can populate DB host/user/pass/name/port.
  - MySQL example: `mysql://USER:PASSWORD@HOST:3306/DB_NAME`
  - PostgreSQL example: `postgres://USER:PASSWORD@HOST:5432/DB_NAME`
  - You can use this alone, or use explicit `DB_*` / `MYSQL*` keys.

## Quick setup

1. In Render, open your service.
2. Go to **Environment**.
3. Add the variables above.
4. Click **Manual Deploy** and redeploy the latest commit.
