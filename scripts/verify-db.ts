#!/usr/bin/env ts-node

/**
 * Database Verification Script
 * 
 * This script verifies the database connection and returns connection details.
 * Used by /api/dbtest endpoint to confirm environment wiring.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function verifyDatabase() {
  try {
    console.log("🔍 Verifying database connection...");
    
    // Test basic connection
    const result = await prisma.$queryRaw`SELECT current_user, current_database()`;
    
    console.log("✅ Database connection successful!");
    console.log("📊 Connection details:", result);
    
    // Test if tables exist
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    `;
    
    console.log("📋 Available tables:", tables);
    
    // Test User table specifically
    try {
      const userCount = await prisma.user.count();
      console.log(`👥 Users in database: ${userCount}`);
    } catch (error) {
      console.log("⚠️  User table not found or not accessible");
    }
    
    return {
      ok: true,
      connection: result,
      tables: tables,
      timestamp: new Date().toISOString()
    };
    
  } catch (error: any) {
    console.error("❌ Database verification failed:", error.message);
    return {
      ok: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  verifyDatabase()
    .then((result) => {
      console.log("\n📋 Final result:", JSON.stringify(result, null, 2));
      process.exit(result.ok ? 0 : 1);
    })
    .catch((error) => {
      console.error("💥 Script failed:", error);
      process.exit(1);
    });
}

export { verifyDatabase };
