/**
 * Concatenate SQL files by folder order into dist.sql.
 * Keeps a clear, reproducible application order.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const ORDER = ['00_extensions','10_enums','20_tables','30_indexes','40_functions','50_triggers','60_policies','99_views'];

const outPath = path.join(ROOT, 'dist.sql');
const lines = [];

for (const dir of ORDER) {
  const full = path.join(ROOT, dir);
  if (!fs.existsSync(full)) continue;
  const files = fs.readdirSync(full).filter(f => f.endsWith('.sql')).sort();
  for (const f of files) {
    const p = path.join(full, f);
    lines.push(`-- >>> ${dir}/${f}\n` + fs.readFileSync(p, 'utf8') + '\n');
  }
}
fs.writeFileSync(outPath, lines.join('\n'));
console.log('Wrote', outPath, 'with', lines.length, 'chunks');


