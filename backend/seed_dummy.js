const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
    try {
        const student = await prisma.student.create({
            data: {
                fullName: "Test Dummy Student",
                gender: "Male",
                dateOfBirth: new Date("2015-05-20"),
                rollNo: 9999,
                standard: "1st",
                adhaarCardNo: 123456789012n,
                scholarshipApplied: false,
                address: "123 Test Avenue",
                session: "2025-2026",
                status: "None",
                category: "General",
                caste: "General",
                parents: {
                    create: [
                        {
                            fatherName: "Mr. Test Parent",
                            fatherOccupation: "Testing",
                            motherName: "Mrs. Test Parent",
                            motherOccupation: "Testing",
                            fatherContact: 9876543210n,
                            motherContact: 8765432109n,
                            address: "123 Test Avenue",
                        }
                    ]
                },
                fees: {
                    create: [
                        {
                            title: "Admission Fee",
                            amount: 5000,
                            amountDate: new Date(),
                            admissionDate: new Date()
                        }
                    ]
                }
            }
        });
        console.log("Successfully created dummy student:", JSON.stringify(student, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
            , 2));
    } catch (error) {
        console.error("Full Error details:");
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
