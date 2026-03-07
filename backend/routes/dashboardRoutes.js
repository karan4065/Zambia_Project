const express = require("express");
const { PrismaClient } = require("@prisma/client");
const router = express.Router();
const prisma = new PrismaClient();

// GET /api/dashboard/summary
router.get("/dashboard/summary", async (req, res) => {
  try {
    const session = req.session;

    // Students
    const studentData = await prisma.student.findMany({
      where: { session: session },
      include: { fees: true }
    });
    const totalStudents = studentData.length;

    // Total Teachers (if we have a user role mapping, or we just mock/count users. There is a User model? The prompt asks for total teachers if available). 
    // Wait, let's see if Teacher model exists. In schema.prisma there isn't one. Let's return 0.
    const totalTeachers = 0; 

    // Hostel Beds
    const hostelData = await prisma.hostel.count();
    let controlData = await prisma.control.findFirst();
    const totalBeds = controlData?.number_of_hostel_bed ?? 0;
    const availableBeds = Math.max(0, totalBeds - hostelData);

    // Fees
    let totalFeesCollected = 0;
    studentData.forEach(student => {
      student.fees.forEach(fee => {
        totalFeesCollected += fee.amount;
      });
    });

    // Approximate pending fees (Requires linking standards to students if standards has totalFee)
    let pendingFees = 0;
    const standards = await prisma.standards.findMany();
    const stdFeeMap = {};
    standards.forEach(s => {
      stdFeeMap[s.std] = s.totalFees || 0;
    });

    studentData.forEach(student => {
       const stdTotal = stdFeeMap[student.standard] || 0;
       let paid = 0;
       student.fees.forEach(fee => { paid += fee.amount; });
       if (stdTotal > paid) {
           pendingFees += (stdTotal - paid);
       }
    });

    // Bus stations
    const totalBusStations = await prisma.busStation.count();

    // Inventory Items
    const totalInventoryItems = await prisma.inventory.count();

    res.status(200).json({
      totalStudents,
      totalTeachers,
      totalBeds,
      availableBeds,
      totalFeesCollected,
      pendingFees,
      totalBusStations,
      totalInventoryItems
    });
  } catch (error) {
    console.error("Error in dashboard summary:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// GET /api/dashboard/student-performance
router.get("/dashboard/student-performance", async (req, res) => {
    try {
        const session = req.session;
        const passedStudents = await prisma.student.count({
            where: { session: session, status: "Passed" }
        });
        const failedStudents = await prisma.student.count({
            where: { session: session, status: "Failed" }
        });
        
        let totalStudents = passedStudents + failedStudents;
        
        // If no one is explicitly passed/failed yet, maybe total students that exist
        if (totalStudents === 0) {
           totalStudents = await prisma.student.count({ where: { session: session }});
        }
        
        let passingPercentage = 0;
        if (totalStudents > 0) {
            passingPercentage = (passedStudents / totalStudents) * 100;
        }
        
        res.status(200).json({
            totalStudents,
            passedStudents,
            failedStudents,
            passingPercentage: passingPercentage.toFixed(2)
        });
    } catch(error) {
       console.error(error);
       res.status(500).json({ error: "Internal Server Error" });
    }
});

// GET /api/dashboard/class-stats
router.get("/dashboard/class-stats", async (req, res) => {
    try {
        const session = req.session;
        const students = await prisma.student.groupBy({
            by: ['standard'],
            where: { session: session },
            _count: {
                id: true
            }
        });
        
        const result = students.map(s => ({
            className: s.standard,
            studentCount: s._count.id
        }));
        
        // Sort
        result.sort((a,b) => parseInt(a.className) - parseInt(b.className));
        
        res.status(200).json(result);
    } catch(error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

module.exports = router;
