# DB_MIGRATIONS
This folder is the single source of truth for database structure. It is code-first, split by type, and compiled into a single SQL file for review/deployment.

Structure:
- 00_extensions: Required extensions (idempotent)
- 10_enums: Enum types (idempotent)
- 20_tables: Tables (one per file, idempotent)
- 30_indexes: Indexes (optional)
- 40_functions: SQL functions (optional)
- 50_triggers: Triggers (optional)
- 60_policies: Policies (optional)
- 99_views: Views (optional)
- compose: Build helper to concatenate into dist.sql

Build:
- node DB_MIGRATIONS/compose/build.js
- Output: DB_MIGRATIONS/dist.sql (review before applying)

Notes:
- PostGIS and pgcrypto are required.
- Do not create spatial_ref_sys (PostGIS provides it).
- Enums can be extended later with ALTER TYPE ... ADD VALUE.
- All tables use create table if not exists and preserve constraints/foreign keys.


