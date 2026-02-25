const express = require("express");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const router = express.Router();
router.use(express.json());
router.use(express.urlencoded({ extended: true }));

function jsonBigIntReplacer(key, value) {
    if (typeof value === "bigint") {
        return value.toString();
    }
    return value;
}

async function calculateTotalPercentage(recievedData) {
    let sumPercent = 0;
    let count = 0;
    const totalPercentage = recievedData.forEach((subjectWise) => {
        sumPercent += subjectWise.percentage;
        count++;
    });
    return (sumPercent / count).toFixed(2);
}

router.post("/control/standard", async (req, res) => {
  const { std, totalFees, category } = req.body;
  try {
    const result = await prisma.standards.create({
        data: {
            std: std,
            totalFees: totalFees || 0,
            category: category || null,
            // subjects:{create:subjects}
        }
    })
    res.status(200).json(result);

  } catch (error) {
      console.log(error);
      res.status(500).json({ error });
  }
})

router.get('/control/standardsByCategory', async (req, res) => {
  try {
    const standards = await prisma.standards.findMany({
      select: { std: true, category: true, totalFees: true, id: true },
      orderBy: { category: 'asc' }
    });

    const grouped = standards.reduce((acc, s) => {
      const cat = s.category || 'Uncategorized';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push({std: s.std, totalFees: s.totalFees, id: s.id});
      return acc;
    }, {});

    res.status(200).json(grouped);
  } catch (error) {
    console.error('Error fetching standards by category:', error);
    res.status(500).json({ error: 'Failed to fetch standards' });
  }
});

// Get all standards with full details
router.get('/control/standards', async (req, res) => {
  try {
    const standards = await prisma.standards.findMany({
      select: { id: true, std: true, category: true, totalFees: true },
      orderBy: [{ category: 'asc' }, { std: 'asc' }]
    });
    res.status(200).json(standards);
  } catch (error) {
    console.error('Error fetching standards:', error);
    res.status(500).json({ error: 'Failed to fetch standards' });
  }
});

// Update a standard
router.put('/control/standard/:std', async (req, res) => {
  const { std } = req.params;
  const { totalFees, category } = req.body;
  
  try {
    const updated = await prisma.standards.update({
      where: { std },
      data: {
        totalFees: totalFees !== undefined ? totalFees : undefined,
        category: category !== undefined ? category : undefined
      }
    });
    res.status(200).json({ message: 'Standard updated successfully', updated });
  } catch (error) {
    console.error('Error updating standard:', error);
    res.status(500).json({ error: 'Failed to update standard' });
  }
});

// Delete a standard
router.delete('/control/standard/:std', async (req, res) => {
  const { std } = req.params;
  
  try {
    // Check if standard has subjects
    const subjects = await prisma.subject.findMany({
      where: { stdId: std }
    });
    
    if (subjects.length > 0) {
      return res.status(400).json({ error: `Cannot delete standard with ${subjects.length} subjects. Delete subjects first.` });
    }
    
    const deleted = await prisma.standards.delete({
      where: { std }
    });
    res.status(200).json({ message: 'Standard deleted successfully', deleted });
  } catch (error) {
    console.error('Error deleting standard:', error);
    res.status(500).json({ error: 'Failed to delete standard' });
  }
});

router.post("/control/subjects", async (req, res) => {
  const { std, subjects } = req.body;

  if (!std || !Array.isArray(subjects) || subjects.length === 0) {
    return res.status(400).json({ error: "Invalid input data" });
  }

  try {
    // Fetch the standard by `std`
    const standard = await prisma.standards.findUnique({
      where: { std }, // Find by `std`, not `id`
    });

    if (!standard) {
      return res.status(404).json({ error: "Standard not found" });
    }

    // Validate subjects data
    for (const subject of subjects) {
      if (!subject.name || typeof subject.name !== 'string' || !subject.name.trim()) {
        return res.status(400).json({ error: "Subject name is required" });
      }
      if (subject.totalMarks !== undefined) {
        const totalMarks = parseFloat(subject.totalMarks);
        if (isNaN(totalMarks) || totalMarks <= 0) {
          return res.status(400).json({ error: `Total marks for ${subject.name} must be a positive number` });
        }
      }
    }

    // Create subjects linked to the standard
    const result = await prisma.subject.createMany({
      data: subjects.map((subject) => ({
        name: subject.name.trim(),
        stdId: std, // Link by `std` as defined in the schema
        totalMarks: subject.totalMarks ? parseFloat(subject.totalMarks) : 100,
      })),
    });

    res.status(200).json({ message: "Subjects created successfully", result });
  } catch (error) {
    console.error("Error creating subjects:", error);
    res.status(500).json({ error: "An error occurred while creating subjects" });
  }
});

// Get subjects for a standard
router.get("/control/subjects/:std", async (req, res) => {
  const { std } = req.params;
  
  try {
    const subjects = await prisma.subject.findMany({
      where: { stdId: std },
      include: { installment: { select: { id: true, installments: true } } }
    });
    res.status(200).json(subjects);
  } catch (error) {
    console.error("Error fetching subjects:", error);
    res.status(500).json({ error: "Failed to fetch subjects" });
  }
});

// Delete a subject
router.delete("/control/subject/:id", async (req, res) => {
  const { id } = req.params;
  
  try {
    const deleted = await prisma.subject.delete({
      where: { id: parseInt(id) }
    });
    res.status(200).json({ message: "Subject deleted successfully", deleted });
  } catch (error) {
    console.error("Error deleting subject:", error);
    res.status(500).json({ error: "Failed to delete subject" });
  }
});



const promotionData = {
    sessions: {
      first: "2024-2025",
      second: "2025-2026",
      third: "2026-2027"
    },
    standards: [
      "LKG",
      "UKG",
      "1st",
      "2nd",
      "3rd",
      "4th",
      "5th"
    ]
  };
  
  // Function to get the next session based on the current session
  function getNextSession(currentSession) {
    const sessionList = Object.values(promotionData.sessions);
    const currentIndex = sessionList.indexOf(currentSession);
    
    return currentIndex !== -1 && currentIndex < sessionList.length - 1
      ? sessionList[currentIndex + 1]
      : currentSession;  // Stay in the same session if at the end
  }
  
  // Function to get the next standard based on the current standard
  function getNextStandard(currentStandard) {
    const standardList = promotionData.standards;
    const currentIndex = standardList.indexOf(currentStandard);
    
    return currentIndex !== -1 && currentIndex < standardList.length - 1
      ? standardList[currentIndex + 1]
      : currentStandard;  // Stay in the same standard if at the end
  }
  
  // Function to calculate the total percentage
  async function calculateTotalPercentage(recievedData) {
    let sumPercent = 0;
    let count = recievedData.length;  // Count of subjects
  
    recievedData.forEach((subjectWise) => {
      sumPercent += subjectWise.percentage;
    });
  
    return count > 0 ? (sumPercent / count).toFixed(2) : 0;  // Avoid division by zero
  }
  

  router.post("/promotion", async (req, res) => {
    const session = req.session;
    try {
      const studentData = await prisma.student.findMany({
        include: {
          parents: true,
          fees: true,
          marks: true  
        },
        where: {
          session: session,
        },
      });
  
      const promotedStudents = await Promise.all(
        studentData.map(async (oldStudent) => {
          const totalPercentage = await calculateTotalPercentage(oldStudent.marks);
  
          // Check if the student passed (total percentage > 50)
          const passed = totalPercentage > 50;
  
          await prisma.student.update({
            where: { id: oldStudent.id },
            data: {
              status: passed ? "Passed" : "Failed"
            }
          });
  
          // Only promote the student if they passed
          if (passed) {
            const newSession = getNextSession(oldStudent.session);
            const newStandard = getNextStandard(oldStudent.standard);
  
            // Create a new student without unique fields (like id)
            const newStudentData = {
              fullName: oldStudent.fullName,
              gender: oldStudent.gender,
              dateOfBirth: oldStudent.dateOfBirth,
              rollNo: oldStudent.rollNo,  
              standard: newStandard,  
              adhaarCardNo:oldStudent.adhaarCardNo,
              address : oldStudent.address,
              session: newSession,  
              scholarshipApplied: false,  
              remark: "",  
              status: "None",  
              parents: {
                create: oldStudent.parents.map((parent) => ({
                  fatherName: parent.fatherName,
                  fatherOccupation: parent.fatherOccupation,
                  motherName: parent.motherName,
                  motherOccupation: parent.motherOccupation,
                  fatherContact: parent.fatherContact,
                  motherContact: parent.motherContact,
                  address: parent.address,
                })),
              },
            
            };
            
            
            // Create the new student with the modified data
            const existingStudent = await prisma.student.findUnique({
              where: {
                standard_rollNo_session: {
                  standard: newStandard,
                  rollNo: oldStudent.rollNo,
                  session: newSession,
                },
              },
            });
            
            if (!existingStudent) {
              const createdStudent = await prisma.student.create({
                data: newStudentData,
              });
              return createdStudent; // Return the newly created student data
            }
            

            return null;
          }
  
          return null;  // Return null for students who are not promoted
        })
      );
  
      // Filter out null values from promotedStudents (i.e., those who weren't promoted)
      const successfulPromotions = promotedStudents.filter(student => student !== null);
      
      res.status(200).json(JSON.stringify(successfulPromotions, jsonBigIntReplacer));  // Return all promoted students
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "An error occurred during promotion." });
    }
  });

  router.post("/handleInstallments",async(req,res)=>{

       const installments = req.body;
      
      // console.log(installments:installments);
      if(!installments){
        return res.status(400).json({error:"Enter Valid Data"});
      }
      try {
        const existingInstallment = await prisma.installments.findUnique({
          where:installments,
        });
        if (existingInstallment) {
          console.log("karan")
          return res.status(409).json({ error: "Installment already exists" });
        }
        const postResult = await prisma.installments.create({
          data: installments,
        });
    
        return res.status(200).json({ postResult });
      } catch (error) {
        console.error("Error:", error);
        return res.status(500).json({ error: "Server Error" });
      }
    });

 // Update the installment
  router.post("/updateinstallment", async (req, res) => {
    console.log(req.body)
  const { uinstallment,uinstallment2 } = req.body;
  console.log("Update Request:",uinstallment,uinstallment2);

  if (!uinstallment || !uinstallment2) {
    return res.status(400).json({ error: "ID and Installment are required" });
  }
  
  try {
    const existingInstallment = await prisma.installments.findUnique({
      where: {installments:uinstallment },
    });

    if (!existingInstallment) {
      return res.status(404).json({ error: "Installment not found" });
    }

    const updatedInstallment = await prisma.installments.update({
      where: { installments: uinstallment },
       data: { installments: uinstallment2 },
    });

    return res.status(200).json({ updatedInstallment });

  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ error: "Server Error" });
  }
});

  
  router.get("/getInstallments",async(req,res)=>{
    const installmentsData = await prisma.installments.findMany();
    if(!installmentsData){
      return res.status(400).json({error:"No data found"});
    }
    res.status(200).json(installmentsData);
    console.log(installmentsData);
  })

  router.get("/getSessions", async (req, res) => {
    try {
      const sessions = await prisma.session.findMany({
        orderBy: { year: 'desc' }
      });
      res.status(200).json(sessions);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      res.status(500).json({ error: 'Failed to fetch sessions' });
    }
  });

module.exports = router;