# Schema Snapshot

This directory can contain a copy of the composed schema bundle for reference (not for execution).

To generate a fresh bundle:

```bash
node DB_MIGRATIONS/compose/build.js
cp DB_MIGRATIONS/dist.sql README/database/schema/dist.sql
```

> Treat `dist.sql` here as documentation only.
