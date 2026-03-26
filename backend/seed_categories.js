const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const categories = ['Kindergarten', 'Primary', 'Junior Secondary', 'Senior Secondary'];
  try {
    for (const cat of categories) {
      await prisma.standardCategory.upsert({
        where: { name: cat },
        update: {},
        create: { name: cat },
      });
    }
    console.log("Categories seeded successfully!");
  } catch (error) {
    console.error("Error seeding categories:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
