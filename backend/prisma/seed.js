require("dotenv").config();
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  try {
    // Check if control data already exists
    const existingControl = await prisma.control.findFirst();
    
    if (existingControl) {
      console.log("Control data already exists. Skipping seed.");
      return;
    }

    // Create default control data
    const control = await prisma.control.create({
      data: {
        number_of_hostel_bed: 100,
        Institution_name: "Sacred Heart School",
        Institution_hostel_name: "School Hostel",
        SchoolLogo: "logo-url",
        SchoolAddress: "123 School Street",
        TotalFees: 50000,
        lunchFee: 400,
      },
    });

    console.log("✓ Control data seeded successfully:", control);

    // Create a default session if it doesn't exist
    const existingSession = await prisma.session.findFirst();
    if (!existingSession) {
      const session = await prisma.session.create({
        data: {
          year: "2025-2026",
        },
      });
      console.log("✓ Default session created:", session);
    }

    console.log("\n✓ Database seeding completed successfully!");
  } catch (error) {
    console.error("✗ Error seeding database:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
