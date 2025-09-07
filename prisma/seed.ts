// @ts-nocheck
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Starting database seeding...")
  
  // Test database connection first
  try {
    await prisma.$queryRaw`SELECT 1`
    console.log("✅ Database connection successful")
  } catch (error) {
    console.error("❌ Database connection failed:", error.message)
    throw error
  }

  const users = [
    { username: "vincent", password: "changeme1", displayName: "Vincent" },
    { username: "sergio",  password: "changeme1", displayName: "Sergio" },
    { username: "guest",   password: "changeme1", displayName: "Guest" },
  ]
  
  console.log(`📝 Seeding ${users.length} users...`)
  
  for (const u of users) {
    console.log(`  - Creating user: ${u.username}`)
    const hash = await bcrypt.hash(u.password, 12)
    await prisma.user.upsert({
      where: { username: u.username },
      create: { username: u.username, passwordHash: hash, displayName: u.displayName },
      update: {},
    })
  }
  
  // Verify seeding
  const userCount = await prisma.user.count()
  console.log(`✅ Seeding completed! Total users in database: ${userCount}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
