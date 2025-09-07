#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Post-build verification starting...');

const nextServerDir = path.join(__dirname, '..', '.next', 'server');
if (!fs.existsSync(nextServerDir)) {
  console.error('❌ .next/server directory not found. Did the build run?');
  process.exit(1);
}

// Collect all files under .next/server
/** @type {string[]} */
const files = [];
/** @param {string} dir */
const walk = (dir) => {
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) walk(full);
    else files.push(full);
  }
};
walk(nextServerDir);

// 1) Ensure no legacy API routes exist in compiled output
const forbiddenRouteSegments = [
  `${path.sep}app${path.sep}api${path.sep}login${path.sep}`,
  `${path.sep}app${path.sep}api${path.sep}logout${path.sep}`,
  `${path.sep}app${path.sep}api${path.sep}change-password${path.sep}`,
];
const forbiddenRoutes = files.filter((f) =>
  forbiddenRouteSegments.some((seg) => f.includes(seg))
);

if (forbiddenRoutes.length > 0) {
  console.error('❌ Forbidden legacy routes present in compiled output:', forbiddenRoutes);
  process.exit(1);
}

// 2) Ensure @prisma/client is not referenced in compiled server files
const jsFiles = files.filter((f) => f.endsWith('.js'));
let prismaReferenced = [];
for (const file of jsFiles) {
  const content = fs.readFileSync(file, 'utf8');
  if (content.includes('@prisma/client') || content.includes('prisma.user.findUnique')) {
    prismaReferenced.push(file);
  }
}

if (prismaReferenced.length > 0) {
  console.error('❌ @prisma/client referenced in compiled output:', prismaReferenced);
  process.exit(1);
}

console.log('✅ Post-build verification passed. No legacy routes or Prisma references found.');


