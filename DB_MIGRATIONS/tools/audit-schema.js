// Static audit of split SQL. Pure text parsing, no DB connections.
// Reports undefined enums, missing FK targets, and extension needs.

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const ORDER = ['00_extensions','10_enums','20_tables','30_indexes','40_functions','50_triggers','60_policies','99_views'];

function readSqlFiles() {
  const files = [];
  for (const dir of ORDER) {
    const full = path.join(ROOT, dir);
    if (!fs.existsSync(full)) continue;
    for (const f of fs.readdirSync(full).filter(f => f.endsWith('.sql')).sort()) {
      const p = path.join(full, f);
      files.push({ dir, file: f, path: p, content: fs.readFileSync(p, 'utf8') });
    }
  }
  return files;
}

function audit(files) {
  const definedEnums = new Set();
  const usedEnums = new Map(); // enum -> [{file,line,context}]
  const definedTables = new Set();
  const fkRefs = []; // {table, target, file, line}
  let needsPostGIS = false;
  let needsPgcrypto = false;

  const builtinTypes = new Set([
    'uuid','text','integer','int','bigint','smallint','numeric','real','double','double precision','boolean','json','jsonb','timestamp','timestamptz','time','date','geometry','tsvector','tstzrange','serial','bigserial','double',
    'text[]','uuid[]','jsonb[]','integer[]','boolean[]','numeric[]'
  ]);

  for (const f of files) {
    const lines = f.content.split(/\r?\n/);

    if (f.dir === '10_enums') {
      const enumRe = /create\s+type\s+if\s+not\s+exists\s+(\w+)\s+as\s+enum/i;
      for (let i=0;i<lines.length;i++) {
        const m = lines[i].match(enumRe);
        if (m) definedEnums.add(m[1]);
      }
    }

    if (f.dir === '20_tables') {
      // Tables defined
      const tableRe = /create\s+table\s+if\s+not\s+exists\s+public\.(\w+)/ig;
      let tm;
      while ((tm = tableRe.exec(f.content))) {
        definedTables.add(tm[1]);
      }

      // Column types used (heuristic)
      const createBlocks = [...f.content.matchAll(/create\s+table[\s\S]*?\((([\s\S]*?))\);/ig)];
      for (const block of createBlocks) {
        const body = block[1] || '';
        const bodyLines = body.split(/\r?\n/);
        for (let i=0;i<bodyLines.length;i++) {
          const line = bodyLines[i].trim();
          if (!line || line.startsWith('--')) continue;
          // skip constraints/foreign keys lines
          if (/^constraint\b/i.test(line) || /references\s+(public|auth)\./i.test(line) || /^primary\s+key/i.test(line)) continue;
          // match: colname typename ...
          const m = line.match(/^[a-z_][a-z0-9_]*\s+([a-z_][a-z0-9_]*(?:\[\])?)/i);
          if (m) {
            let t = m[1].toLowerCase();
            if (t === 'timestamp') t = 'timestamp'; // treat as builtin
            if (t === 'double') t = 'double precision';
            if (!builtinTypes.has(t)) {
              const arr = usedEnums.get(t) || [];
              arr.push({ file: f.file, line: i+1, context: line });
              usedEnums.set(t, arr);
            }
          }
        }
      }

      // Foreign keys
      for (let i=0;i<lines.length;i++) {
        const line = lines[i];
        const fk = line.match(/references\s+public\.(\w+)/i);
        if (fk) {
          fkRefs.push({ target: fk[1], file: f.file, line: i+1 });
        }
      }

      // Extensions hints
      if (/\bgeometry\b|st_setsrid|st_makepoint/i.test(f.content)) needsPostGIS = true;
      if (/gen_random_uuid\s*\(/i.test(f.content)) needsPgcrypto = true;
    }
  }

  // Compute missing enums and tables
  const missingEnums = [];
  for (const [enm, places] of usedEnums.entries()) {
    if (!definedEnums.has(enm)) missingEnums.push({ name: enm, places });
  }
  const missingTables = [];
  for (const ref of fkRefs) {
    if (!definedTables.has(ref.target)) missingTables.push(ref);
  }

  // Report
  const errors = [];
  if (missingEnums.length) {
    errors.push(`Undefined enums: ${missingEnums.map(e => e.name).join(', ')}`);
  }
  // Allow auth.users silently, we only check public.* refs which we already collected
  const missingByTable = missingTables;
  if (missingByTable.length) {
    errors.push(`Missing FK targets: ${missingByTable.map(m => m.target).join(', ')}`);
  }

  // Print report
  console.log('=== DB_MIGRATIONS Audit ===');
  console.log('Defined enums:', Array.from(definedEnums).join(', ') || '(none)');
  console.log('Tables:', Array.from(definedTables).join(', ') || '(none)');
  if (missingEnums.length) {
    console.log('\nErrors: Undefined enums:');
    for (const e of missingEnums) {
      for (const p of e.places) console.log(`  - ${e.name} at ${p.file}:${p.line} :: ${p.context}`);
    }
  }
  if (missingByTable.length) {
    console.log('\nErrors: Missing FK targets:');
    for (const m of missingByTable) console.log(`  - ${m.target} referenced in ${m.file}:${m.line}`);
  }
  console.log(`\nRequires PostGIS: ${needsPostGIS ? 'yes' : 'no'}`);
  console.log(`Requires pgcrypto: ${needsPgcrypto ? 'yes' : 'no'}`);

  if (errors.length) process.exit(1);
  console.log('\nAudit OK');
}

audit(readSqlFiles());


