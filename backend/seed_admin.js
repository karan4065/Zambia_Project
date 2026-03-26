const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  try {
    const admin = await prisma.user.upsert({
      where: { username: "admin" },
      update: {
        college: "St Vincent"
      },
      create: {
        username: "admin",
        password: "adminpassword", // In a real app, use hashing!
        role: "admin",
        college: "St Vincent"
      }
    });
    console.log("✓ Admin user created/updated:", admin.username, "at", admin.college);
  } catch (error) {
    console.error("✗ Error creating admin:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
