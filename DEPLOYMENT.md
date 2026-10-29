# Deployment

## Docker Compose

1. Copy `.env.example` to `.env` and set every placeholder. Use the same
   `POSTGRES_PASSWORD` in `DATABASE_URL`; URL-encode special characters in the
   database URL password.
2. Set `CORS_ORIGINS` to the exact origins serving the frontend.
3. Start the services with `docker compose up --build -d`.
4. Confirm readiness with `docker compose ps` and `curl http://localhost/health`.

PostgreSQL is only published on `127.0.0.1:5433`. Do not expose it directly to
the public internet.

## Secrets and database

- On a hosting platform, configure the variables from `.env.example` in its
  secret/environment settings. Never commit `.env`.
- Credentials and a database dump were present in earlier Git commits. Rotate
  the affected credentials and purge those files from Git history before
  pushing this branch to a shared remote.
- `SUPABASE_KEY` is a server-side service-role JWT. Keep it out of frontend
  code. The `bookly` Storage bucket can remain private.
- `bookly_dump.sql` contains database rows and is intentionally excluded from
  source control and Docker images. Do not use it as production seed data.
- The current Alembic history assumes core tables already exist; it is not yet
  a clean-database bootstrap. Provision and verify the database schema before
  deploying to a new empty PostgreSQL database.
