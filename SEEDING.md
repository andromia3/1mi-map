# Database Seeding Guide

This guide explains how to properly seed the 1MI Members' Club database using different connection types.

## Connection Types

### Direct Connection (Port 5432)
- **Use for**: Local development, migrations, and seeding
- **User**: `postgres`
- **Port**: `5432`
- **URL Format**: `postgresql://postgres:<password>@aws-1-eu-west-2.pooler.supabase.com:5432/postgres?sslmode=require`

### Transaction Pooler (Port 6543)
- **Use for**: Runtime (Netlify, production, .env.local)
- **User**: `postgres.<project_ref>`
- **Port**: `6543`
- **URL Format**: `postgresql://postgres.<project_ref>:<password>@aws-1-eu-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require`

## Environment Files

### .env (for Prisma CLI)
Used by `prisma migrate deploy` and `prisma db seed` commands.

```env
# Direct connection for migrations and seeding
DATABASE_URL="postgresql://postgres:<password>@aws-1-eu-west-2.pooler.supabase.com:5432/postgres?sslmode=require"
```

### .env.local (for Next.js runtime)
Used by the application at runtime (Netlify, local dev server).

```env
# Transaction pooler for runtime
DATABASE_URL="postgresql://postgres.fleomqtjdvdkhojqkvax:<password>@aws-1-eu-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require"
MAPBOX_TOKEN="pk.your_mapbox_token_here"
NEXT_PUBLIC_MAPBOX_TOKEN="pk.your_mapbox_token_here"
SESSION_PASSWORD="your-super-secret-session-password-at-least-32-characters-long"
```

## Seeding Process

### First-time Setup

1. **Set up environment files**:
   ```bash
   # Copy .env.local to .env for Prisma CLI
   Copy-Item .env.local .env
   
   # Edit .env to use Direct connection (port 5432, user "postgres")
   # Edit .env.local to use Transaction Pooler (port 6543, user "postgres.<project_ref>")
   ```

2. **Create database schema**:
   ```bash
   npx prisma migrate deploy
   # OR for development:
   npx prisma db push
   ```

3. **Seed the database**:
   ```bash
   npx prisma db seed
   ```

4. **Verify seeding**:
   ```bash
   # Check /api/dbtest endpoint
   # Should return: {"ok": true, "rows": [{"current_user": "postgres", "current_database": "postgres"}]}
   ```

### Troubleshooting

#### "Table does not exist" error
- Ensure you're using the Direct connection (port 5432) in `.env`
- Run `npx prisma db push` or `npx prisma migrate deploy` first

#### "Tenant or user not found" error
- Check that the password in your DATABASE_URL is correct
- Verify you're using the right connection type for the operation

#### Connection timeout
- For seeding: Use Direct connection (port 5432)
- For runtime: Use Transaction Pooler (port 6543)

## Verification

### Database Connection Test
Visit `/api/dbtest` to verify your database connection:

- **Success**: `{"ok": true, "rows": [{"current_user": "...", "current_database": "postgres"}]}`
- **Failure**: `{"ok": false, "error": "..."}`

### Manual Verification
```bash
# Test Prisma connection
npx prisma db execute --stdin
# Then run: SELECT current_user, current_database();
```

## Common Issues

1. **Wrong connection type**: Using pooler for migrations or direct for runtime
2. **Incorrect password**: Supabase password needs to be URL-encoded if it contains special characters
3. **Missing environment file**: Prisma CLI only reads `.env`, not `.env.local`
4. **Schema not created**: Run migrations before seeding

## Production Deployment

For Netlify deployment:
- Use Transaction Pooler connection in environment variables
- Ensure `npx prisma generate` runs during build
- Test with `/api/dbtest` after deployment
