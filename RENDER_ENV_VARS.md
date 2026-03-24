# Render Environment Variables

Set these in your Render Web Service:

- `DB_TYPE` = `mysql` or `postgres`
- `BASE_URL` = leave empty if app is served from domain root (example: `https://your-app.onrender.com`)
- `DB_HOST`
- `DB_PORT` (`3306` for MySQL, `5432` for PostgreSQL)
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD` (preferred) or `DB_PASS`
- `DB_CHARSET` (recommended: `utf8mb4`)

Optional:

- `DATABASE_URL` (full connection URL). If set, it can populate DB host/user/pass/name/port.
  - MySQL example: `mysql://USER:PASSWORD@HOST:3306/DB_NAME`
  - PostgreSQL example: `postgres://USER:PASSWORD@HOST:5432/DB_NAME`
  - You can use this alone, or use explicit `DB_*` / `MYSQL*` keys.

## Quick setup

1. In Render, open your service.
2. Go to **Environment**.
3. Add the variables above.
4. Redeploy the service.
