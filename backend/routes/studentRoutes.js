const express = require("express");
const { PrismaClient } = require("@prisma/client");
const router = express.Router();
const prisma = new PrismaClient();


function jsonBigIntReplacer(key, value) {
    if (typeof value === "bigint") {
        return value.toString();
    }
    return value;
}

// Delete Function
const deleteStudent = async (studentId) => {
    try {
        // Delete related records
        await prisma.parent.deleteMany({ where: { studentId: studentId } });
        await prisma.fee.deleteMany({ where: { studentId: studentId } });
        await prisma.attendance.deleteMany({ where: { studentId: studentId } });
        await prisma.student.delete({ where: { id: parseInt(studentId) } });

        return {
            success: true,
            message: "Student and related records deleted successfully",
        };
    } catch (error) {
        console.error("Error deleting student:", error);
        throw new Error("Failed to delete student");
    }
};

// Create Student
router.post("/students", async (req, res) => {
    const {
        fullName,
        gender,
        dateOfBirth,
        rollNo,
        standard,
        bloodGroup,
        scholarshipApplied,
        lunchAccepted,
        lunchPrice,
        busAccepted,
        busStationId,
        residentialAddress,
        correspondenceAddress,
        nationality,
        religion,
        denomination,
        language,
        motherTongue,
        parents,
        fees,
        photoUrl,
        remark
    } = req.body;
    const session = req.session;
    
    if (!session) {
        return res.status(400).json({ error: "Session not set. Please set a session first." });
    }
    
    try {
        // Fetch bus station price if bus is accepted
        let busPriceValue = null;
        if (busAccepted && busStationId) {
            const busStation = await prisma.busStation.findUnique({
                where: { id: parseInt(busStationId) },
            });
            if (busStation) {
                busPriceValue = busStation.price;
            }
        }

        // Fetch control settings to get global lunch fee if needed
        const controlSettings = await prisma.control.findFirst();
        const globalLunchFee = controlSettings ? controlSettings.lunchFee : null;

        const student = await prisma.student.create({
            data: {
                fullName,
                gender,
                dateOfBirth: new Date(dateOfBirth),
                rollNo: parseInt(rollNo),
                standard,
                bloodGroup,
                scholarshipApplied,
                lunchAccepted: lunchAccepted || false,
                lunchPrice: lunchAccepted ? (globalLunchFee ?? (lunchPrice ? parseFloat(lunchPrice) : null)) : null,
                busAccepted: busAccepted || false,
                busStationId: busAccepted && busStationId ? parseInt(busStationId) : null,
                busPrice: busPriceValue,
                residentialAddress,
                correspondenceAddress,
                photoUrl,
                remark,
                nationality,
                religion,
                denomination,
                language,
                motherTongue,
                session,
                parents: {
                    create: parents.map((parent) => ({
                        fatherName: parent.fatherName,
                        motherName: parent.motherName,
                        fatherContact: parseInt(parent.fatherContact),
                        motherContact: parseInt(parent.motherContact),
                        distanceFromSchool: parent.distanceFromSchool ? parseFloat(parent.distanceFromSchool) : null,
                        preferredPhoneNumber: parent.preferredPhoneNumber ? parseInt(parent.preferredPhoneNumber) : null,
                        address: parent.address,
                    })),
                },
                fees: {
                    create: fees.map((fee) => ({
                        title: fee.installmentType,
                        amount: parseFloat(fee.amount),
                        amountDate: new Date(fee.amountDate),
                        admissionDate: new Date(fee.admissionDate),
                    })),
                },
            },
            include: {
                parents: true,
                fees: true,
                attendanceRecords: true,
            },
        });

        // After creating student, first process any requested inventory selections
        try {
            const { inventorySelections } = req.body; // optional array of { inventoryId, size, quantity }
            if (Array.isArray(inventorySelections) && inventorySelections.length > 0) {
                for (const sel of inventorySelections) {
                    try {
                        const invId = parseInt(sel.inventoryId);
                        const qty = sel.quantity ? parseInt(sel.quantity) : 1;
                        const invItem = await prisma.inventory.findUnique({ where: { id: invId } });
                        if (!invItem) continue;
                        if (typeof invItem.quantity === 'number' && invItem.quantity < qty) {
                            console.warn(`Insufficient inventory for item ${invId}. Available: ${invItem.quantity}, requested: ${qty}`);
                            continue;
                        }

                        await prisma.studentInventory.create({
                            data: {
                                studentId: student.id,
                                inventoryId: invId,
                                quantityPurchased: qty,
                                totalPrice: (invItem.price || 0) * qty,
                            },
                        });

                        // decrement inventory
                        await prisma.inventory.update({ where: { id: invId }, data: { quantity: invItem.quantity ? invItem.quantity - qty : null } });
                    } catch (err) {
                        console.error('Error assigning requested inventory selection:', err);
                    }
                }
            }

            // Then assign default uniform items (compulsory) if any remain to be assigned
            const uniformItemsRaw = await prisma.inventory.findMany({
                where: { category: { equals: "Uniform" } },
            });

            // Normalize item gender and filter by student's gender
            const uniformItems = uniformItemsRaw.filter((it) => {
                const itemGender = it.gender || null;
                if (!itemGender) return true; // if no gender info, include by default
                const normalized = String(itemGender).toLowerCase();
                if (normalized === "all" || normalized === "all classes") return true;
                return normalized === String(student.gender).toLowerCase();
            });

            for (const item of uniformItems) {
                // Only assign if there's stock
                if (typeof item.quantity === 'number' && item.quantity > 0) {
                    try {
                        // Skip if student already has this inventory assigned (from selections)
                        const existing = await prisma.studentInventory.findUnique({ where: { studentId_inventoryId: { studentId: student.id, inventoryId: item.id } } });
                        if (existing) continue;

                        // Create StudentInventory record
                        await prisma.studentInventory.create({
                            data: {
                                studentId: student.id,
                                inventoryId: item.id,
                                quantityPurchased: 1,
                                totalPrice: item.price,
                            },
                        });

                        // Decrement inventory quantity
                        await prisma.inventory.update({
                            where: { id: item.id },
                            data: { quantity: item.quantity - 1 },
                        });
                    } catch (err) {
                        console.error(`Error assigning uniform item ${item.id} to student ${student.id}:`, err);
                    }
                }
            }
        } catch (err) {
            console.error("Error processing uniform assignments:", err);
        }

        // Return student with related records and assigned inventory
        const createdStudent = await prisma.student.findUnique({
            where: { id: student.id },
            include: {
                parents: true,
                fees: true,
                studentInventory: {
                    include: { inventory: true },
                },
                attendanceRecords: true,
            },
        });

        res.status(201).json(JSON.stringify(createdStudent, jsonBigIntReplacer));
    } catch (error) {
        console.error("Error creating student:", error);
        res.status(500).send("Failed to create student");
    }
});

// Delete Student
router.delete("/delete/students", async (req, res) => {
    const { studentId } = req.query;
    try {
        await deleteStudent(parseInt(studentId));
        res.status(200).send({ message: "Student deleted successfully" });
    } catch (error) {
        res.status(500).send({ error: "Failed to delete student" });
    }
});

// Search Students
router.get("/getallstudent", async (req, res) => {
    const { std } = req.query;
    const session = req.session;
    
    if (!session) {
        return res.status(400).json({ error: "Session not set. Please set a session first." });
    }
    
    try {
        const result = await prisma.student.findMany({
            where: {
                standard: std,
                session : session
            }
        });
        res.status(200).json(JSON.parse(JSON.stringify({ result }, jsonBigIntReplacer)));
    } catch (error) {
        res.status(400).json(error);
    }
});


// Get searched student by rollno.:
router.get("/students/rollNo", async (req, res) => {
    const { rollno , standard } = req.query;
    const session = req.session;

    if (!session) {
        return res.status(400).json({ error: "Session not set. Please set a session first." });
    }

    try {
        let student;
        if (/^\d+$/.test(rollno)){
            student = await prisma.student.findFirst({
                where: {
                    rollNo: parseInt(rollno),
                    standard: standard,
                    session: session
                },
                include: {
                    parents: true,
                    fees: true,
                },
            });    
        }else{
            student = await prisma.student.findFirst({
                where: {
                    rollNo: parseInt(rollno),
                    standard: standard,
                    session: session
                },
                include: {
                    parents: true,
                    fees: true,
                },
            });   
        }
        if (student) {
            res.status(200).send(JSON.stringify(student, jsonBigIntReplacer));
        } else {
            res.status(404).json({ message: "Student not found" });
        }
    } catch (error) {
        console.error("Error fetching student:", error.message);
        console.error("Stack trace:", error.stack);
        res.status(500).json({ message: "An error occurred while fetching the student" });
    }
});

// Get student by rollNo only (for TC auto-fill)
router.get("/students/byRollNo/:rollNo", async (req, res) => {
    const { rollNo } = req.params;
    // const session = req.session;

    // if (!session) {
    //     return res.status(400).json({ error: "Session not set. Please set a session first." });
    // }

    try {
        const student = await prisma.student.findFirst({
            where: {
                rollNo: parseInt(rollNo),
                // session: session
            },
            include: {
                parents: true,
                fees: true,
            },
        });
        if (student) {
            res.status(200).send(JSON.stringify(student, jsonBigIntReplacer));
        } else {
            res.status(404).json({ message: "Student not found" });
        }
    } catch (error) {
        console.error("Error fetching student:", error.message);
        res.status(500).json({ message: "An error occurred while fetching the student" });
    }
});

// get all who applied for scholarship
router.get("/getallstudentsc",async (req,res)=>{
    const session = req.session;
    
    if (!session) {
        return res.status(400).json({ error: "Session not set. Please set a session first." });
    }
    
    try{
        const studentsc = await prisma.student.findMany({
            where:{
                scholarshipApplied:true,
                session:session
            }
        })
        if (studentsc) {
            res.status(200).send(JSON.stringify(studentsc, jsonBigIntReplacer));
        } else {
            res.status(404).json({ message: "Student not found" });
        }
    }catch(error){
        console.error("Error fetching student:", error.message);
        console.error("Stack trace:", error.stack);
        res.status(500).json({ message: "An error occurred while fetching the student" });
    }
})

// Update student route
router.put("/update/student/:id", async (req, res) => {
    const studentId = parseInt(req.params.id);
    const {
        fullName,
        gender,
        dateOfBirth,
        nationality,
        religion,
        denomination,
        language,
        motherTongue,
        rollNo,
        standard,
        bloodGroup,
        scholarshipApplied,
        remark,
        residentialAddress,
        correspondenceAddress,
        photoUrl,   
        parents,
    } = req.body;

    try {
        // Update student details
        const updatedStudent = await prisma.student.update({
            where: { id: studentId},
            data: {
                fullName,
                gender,
                dateOfBirth: new Date(dateOfBirth),
                rollNo: parseInt(rollNo),
                nationality,
                religion,
                denomination,
                language,
                motherTongue,
                standard,
                bloodGroup,
                scholarshipApplied,
                remark,
                residentialAddress,
                correspondenceAddress,
                photoUrl,
            },
        });

        // Update parent details
        const updatedParents = await Promise.all(
            parents.map((parent) =>
                prisma.parent.update({
                    where: { id: parent.id },
                    data: {
                        fatherName: parent.fatherName,
                        motherName: parent.motherName,
                        fatherContact: parent.fatherContact,
                        motherContact: parent.motherContact,
                        distanceFromSchool: parent.distanceFromSchool ? parseFloat(parent.distanceFromSchool) : null,
                        preferredPhoneNumber: parent.preferredPhoneNumber ? parseInt(parent.preferredPhoneNumber) : null,
                        address: parent.address,
                    },
                })
            )
        );

        const response = {
            message: "Student updated successfully",
            student: updatedStudent,
            parents: updatedParents,
        };
        res.status(201).json(JSON.stringify(response, jsonBigIntReplacer));
    } catch (error) {
        console.error("Error updating student:", error);
        res.status(500).json({ error: "Failed to update student" });
    }
});

module.exports = router;
