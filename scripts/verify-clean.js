#!/usr/bin/env node

// Verify that the app is completely clean of Prisma
const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying clean Supabase-only deployment...\n');

// Check for any remaining API routes
const appDir = path.join(__dirname, '..', 'app');
if (fs.existsSync(appDir)) {
  const files = fs.readdirSync(appDir, { recursive: true });
  const apiFiles = files.filter(file => 
    typeof file === 'string' && 
    (file.includes('api') || file.includes('login') || file.includes('logout'))
  );
  
  if (apiFiles.length > 0) {
    console.error('❌ Found remaining API files:', apiFiles);
    process.exit(1);
  } else {
    console.log('✅ No API routes found');
  }
}

// Check package.json for Prisma dependencies
const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
const hasPrisma = packageJson.dependencies && (
  packageJson.dependencies['@prisma/client'] || 
  packageJson.dependencies['prisma']
);

if (hasPrisma) {
  console.error('❌ Found Prisma dependencies in package.json');
  process.exit(1);
} else {
  console.log('✅ No Prisma dependencies in package.json');
}

// Check for Supabase dependencies
const hasSupabase = packageJson.dependencies && (
  packageJson.dependencies['@supabase/supabase-js'] && 
  packageJson.dependencies['@supabase/auth-helpers-nextjs']
);

if (hasSupabase) {
  console.log('✅ Supabase dependencies found');
} else {
  console.error('❌ Missing Supabase dependencies');
  process.exit(1);
}

console.log('\n🎉 App is clean and ready for Supabase-only deployment!');
