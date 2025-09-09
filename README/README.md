# 1MI Members' Club – Documentation

This folder centralizes human-readable documentation for the project.

- See `database/` for the database schema index and per-concern notes
- The code-first source of truth for DDL remains in `DB_MIGRATIONS/`

## Contents

- `database/` – schema bundle, plus folders for functions, triggers, enums, indexes, and more

## How to build the schema bundle

The project uses a code-first migrations workspace under `DB_MIGRATIONS/`.

1) Compose the SQL bundle:

```bash
node DB_MIGRATIONS/compose/build.js
```

2) The composed SQL is written to `DB_MIGRATIONS/dist.sql`. You can paste it into the Supabase SQL editor or run with `psql`.

3) Optionally copy that file into `README/database/schema/` for reference when sharing outside the repo.

> Note: Do not execute SQL directly from the `README/` directory. Treat it as documentation.
