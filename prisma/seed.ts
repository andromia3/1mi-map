// @ts-nocheck
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  const users = [
    { username: "vincent", password: "changeme1", displayName: "Vincent" },
    { username: "sergio",  password: "changeme1", displayName: "Sergio" },
    { username: "guest",   password: "changeme1", displayName: "Guest" },
  ]
  
  for (const u of users) {
    const hash = await bcrypt.hash(u.password, 12)
    await prisma.user.upsert({
      where: { username: u.username },
      create: { username: u.username, passwordHash: hash, displayName: u.displayName },
      update: {},
    })
  }
  
  console.log("Seeded users successfully!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
