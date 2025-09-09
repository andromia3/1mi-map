# Database Documentation

Human-friendly notes about the database. The executable source of truth lives in `DB_MIGRATIONS/` (idempotent SQL files composed into `dist.sql`).

## Structure here

- `schema/` – snapshot of composed schema SQL for reference (do not execute from here)
- `functions/` – notes and references for SQL functions
- `triggers/` – notes and references for triggers
- `enums/` – documented enum values
- `indexes/` – rationale for key indexes

## Build the SQL bundle

Run:

```bash
node DB_MIGRATIONS/compose/build.js
```

This writes `DB_MIGRATIONS/dist.sql`. You may copy that file into `README/database/schema/dist.sql` for sharing.

> Note: The runtime app reads/writes via Supabase clients. DDL changes belong in `DB_MIGRATIONS/` only.
