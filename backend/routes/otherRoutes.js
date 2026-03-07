const express = require("express");
const { PrismaClient } = require("@prisma/client");
const router = express.Router();
const ExcelJS = require("exceljs");
const multer = require("multer");
const fs = require("fs");
const crypto = require("crypto");
const path = require("path");

const { exec } = require("child_process");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/photos/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

router.get("/api/backup", async (req, res) => {
  try {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      return res.status(500).json({ error: "DATABASE_URL not found in .env" });
    }

    const urlRegex = /postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)/;
    const match = dbUrl.match(urlRegex);

    if (!match) {
      return res.status(500).json({ error: "Invalid DATABASE_URL format" });
    }

    const [_, user, password, host, port, dbname] = match;
    const backupFile = path.join(__dirname, `../backup_${Date.now()}.sql`);

    const env = { ...process.env, PGPASSWORD: password };
    const command = `pg_dump -h ${host} -p ${port} -U ${user} -d ${dbname} -f "${backupFile}"`;

    exec(command, { env }, (error, stdout, stderr) => {
      if (error) {
        console.error(`pg_dump error: ${error.message}`);
        return res.status(500).json({ error: "Backup failed", details: error.message });
      }

      res.download(backupFile, "erp_backup.sql", (err) => {
        if (err) {
          console.error(`Download error: ${err.message}`);
        }
        if (fs.existsSync(backupFile)) {
          fs.unlinkSync(backupFile);
        }
      });
    });
  } catch (error) {
    console.error("Backup route error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

const prisma = new PrismaClient();
//Get all student information in excel file 
router.get('/excelstudents', async (req, res) => {
  const session = req.session;
  try {
    const studentsInfo = await prisma.student.findMany({
      where: { session: session },
      include: {
        parents: true,
        fees: true,
        marks: true,
      },
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Students');

    // Define columns for the worksheet
    worksheet.columns = [

      // { header: 'StudentId', key: 'sid', width: 10 },
      { header: 'Full Name', key: 'fullName', width: 30 },
      { header: 'Gender', key: 'gender', width: 10 },
      { header: 'Date of Birth', key: 'dateOfBirth', width: 15 },
      { header: 'Roll No', key: 'rollNo', width: 10 },
      { header: 'Standard', key: 'standard', width: 10 },
      { header: 'Blood Group', key: 'bloodGroup', width: 15 },
      { header: 'Scholarship Applied', key: 'scholarshipApplied', width: 15 },
      { header: 'Residential Address', key: 'residentialAddress', width: 30 },
      { header: 'Correspondence Address', key: 'correspondenceAddress', width: 30 },
      { header: 'Nationality', key: 'nationality', width: 15 },
      { header: 'Religion', key: 'religion', width: 15 },
      { header: 'Denomination', key: 'denomination', width: 15 },
      { header: 'Language', key: 'language', width: 15 },
      { header: 'Mother Tongue', key: 'motherTongue', width: 15 },
      { header: 'Photo URL', key: 'photoUrl', width: 30 },
      { header: 'Father Name', key: 'fatherName', width: 20 },
      { header: 'Mother Name', key: 'motherName', width: 20 },
      { header: 'Father Contact', key: 'fatherContact', width: 15 },
      { header: 'Mother Contact', key: 'motherContact', width: 15 },
      { header: 'Distance from School (kms)', key: 'distanceFromSchool', width: 20 },
      { header: 'Preferred Phone Number for School', key: 'preferredPhoneNumber', width: 25 },
      { header: 'Parent Address', key: 'parentAddress', width: 30 },
      { header: 'Fee Title', key: 'feeTitle', width: 15 },
      { header: 'Fee Amount', key: 'feeAmount', width: 15 },
      { header: 'Amount Date', key: 'feeAmountDate', width: 15 },
      { header: 'Admission Date', key: 'admissionDate', width: 15 },
      { header: 'Remark', key: 'remark', width: 15 },
      { header: 'Session', key: 'session', width: 10 },
      { header: 'Nationality', key: 'nationality', width: 15 },
      { header: 'Religion', key: 'religion', width: 15 },
    ];

    // Add student data to worksheet
    studentsInfo.forEach((student) => {
      const feesPaid = student.fees.reduce((sum, fee) => sum + fee.amount, 0);
      worksheet.addRow({

        // sid: student.id,
        fullName: student.fullName,
        gender: student.gender,
        dateOfBirth: student.dateOfBirth.toISOString().split('T')[0],
        rollNo: student.rollNo,
        standard: student.standard,
        bloodGroup: student.bloodGroup || '',
        scholarshipApplied: student.scholarshipApplied,
        residentialAddress: student.residentialAddress,
        correspondenceAddress: student.correspondenceAddress,
        nationality: student.nationality || '',
        religion: student.religion || '',
        denomination: student.denomination || '',
        language: student.language || '',
        motherTongue: student.motherTongue || '',
        photoUrl: student.photoUrl,
        fatherName: student.parents[0]?.fatherName || '',
        motherName: student.parents[0]?.motherName || '',
        fatherContact: student.parents[0]?.fatherContact?.toString() || '',
        motherContact: student.parents[0]?.motherContact?.toString() || '',
        distanceFromSchool: student.parents[0]?.distanceFromSchool || '',
        preferredPhoneNumber: student.parents[0]?.preferredPhoneNumber?.toString() || '',
        parentAddress: student.parents[0]?.address || '',
        feeTitle: student.fees[0]?.title || '',
        feeAmount: student.fees[0]?.amount,
        feeAmountDate: student.fees[0]?.amountDate,
        admissionDate: student.fees[0]?.admissionDate,
        remark: student.remark || '',
        session: student.session,
      });
    });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="students_data.xlsx"'
    );

    // Send Excel file as response
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error fetching students data:', error);
    res.status(500).json({ error: 'An error occurred' });
  }
});

//Upload Photo
router.post('/uploadPhoto', upload.single('file'), async (req, res) => {
  try {
    const fileUrl = 'http://localhost:5000/uploads/photos/' + req.file.filename;
    res.status(200).send(fileUrl);
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).send('Error uploading file');
  }
});

// Upload Student In Bulk with Excel
router.post("/upload", upload.single("file"), async (req, res) => {
  const filePath = req.file.path;

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const worksheet = workbook.getWorksheet(1);

  const students = [];

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber !== 1) {
      // Skip header row
      const student = {
        fullName: row.getCell(1).value,
        gender: row.getCell(2).value,
        dateOfBirth: row.getCell(3).value,
        rollNo: parseInt(row.getCell(4).value),
        standard: row.getCell(5).value,
        bloodGroup: row.getCell(6).value,
        scholarshipApplied: row.getCell(7).value.toString().toLowerCase() === "true" || row.getCell(7).value.toString().toLowerCase() === "yes",
        residentialAddress: row.getCell(8).value,
        correspondenceAddress: row.getCell(9).value,
        nationality: row.getCell(10).value,
        religion: row.getCell(11).value,
        denomination: row.getCell(12).value,
        language: row.getCell(13).value,
        motherTongue: row.getCell(14).value,
        photoUrl: row.getCell(15).value,
        parents: [
          {
            fatherName: row.getCell(16).value,
            motherName: row.getCell(17).value,
            fatherContact: BigInt(row.getCell(18).value),
            motherContact: BigInt(row.getCell(19).value),
            distanceFromSchool: row.getCell(20).value ? parseFloat(row.getCell(20).value) : null,
            preferredPhoneNumber: row.getCell(21).value ? BigInt(row.getCell(21).value) : null,
            address: row.getCell(22).value,
          },
        ],
        fees: [
          {
            title: row.getCell(23).value,
            amount: parseFloat(row.getCell(24).value),
            amountDate: row.getCell(25).value,
            admissionDate: row.getCell(26).value,

          },
        ],
        remark: row.getCell(27).value,
        session: row.getCell(28).value,
      };
      students.push(student);
    }
  });

  try {
    // Create students with mapped class ids
    for (const student of students) {
      await prisma.student.create({
        data: {
          fullName: student.fullName,
          gender: student.gender,
          dateOfBirth: new Date(student.dateOfBirth),
          rollNo: student.rollNo,
          standard: student.standard,
          bloodGroup: student.bloodGroup,
          scholarshipApplied: student.scholarshipApplied,
          residentialAddress: student.residentialAddress,
          correspondenceAddress: student.correspondenceAddress,
          photoUrl: student.photoUrl,
          remark: student.remark,
          session: student.session,
          nationality: student.nationality,
          religion: student.religion,
          parents: {
            create: student.parents,
          },
          fees: {
            create: student.fees,
          },
        },
      });
    }

    fs.unlinkSync(filePath);
    res.status(200).send("File uploaded and data imported successfully");
  } catch (error) {
    console.error("Error importing data:", error);
    res.status(500).send("Failed to import data");
  }
});


router.get('/reportsdata', async (req, res) => {
  const session = req.session;
  try {
    // Fetch all required student data (including fees) in one query
    const studentData = await prisma.student.findMany({
      where: {
        session: session,
      },
      include: {
        fees: true,  // Include the related fees data
      },
    });

    // Count of students
    const len = studentData.length;

    // Calculate the total fee amount
    let sumFee = 0;
    studentData.forEach(student => {
      student.fees.forEach(fee => {
        sumFee += fee.amount;
      });
    });

    // Get hostel count and bed-related data
    const hostelData = await prisma.hostel.count();
    let totalBed = await prisma.control.findFirst();
    totalBed = totalBed?.number_of_hostel_bed ?? 0;
    const sumBed = totalBed - hostelData;

    // Send the result
    res.send({ len, sumFee, sumBed });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'Internal Server Error' });
  }
});


router.post("/changesFromControlPanel", async (req, res) => {
  const { number_of_hostel_bed, institutioName, hostelName, schoolAddress, totalFee, schoolLogo, year, lunchFee } = req.body;

  if (!year) {
    return res.status(400).json({ error: 'Session year is required' });
  }

  try {
    // Find the session by year
    const sessionRecord = await prisma.session.findUnique({
      where: { year }
    });

    if (!sessionRecord) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Check if control record exists for this session
    let existingRecord = await prisma.control.findUnique({
      where: { sessionId: sessionRecord.id }
    });

    const payload = {
      sessionId: sessionRecord.id,
      number_of_hostel_bed: number_of_hostel_bed ? parseInt(number_of_hostel_bed) : undefined,
      Institution_name: institutioName,
      Institution_hostel_name: hostelName,
      SchoolAddress: schoolAddress,
      TotalFees: totalFee ? parseInt(totalFee) : undefined,
      SchoolLogo: schoolLogo,
      lunchFee: lunchFee ? parseFloat(lunchFee) : undefined,
    };

    if (!existingRecord) {
      // look for a legacy control record with null sessionId
      existingRecord = await prisma.control.findFirst({ where: { sessionId: null } });
    }

    if (!existingRecord) {
      const newRecord = await prisma.control.create({ data: payload });
      return res.status(201).json(newRecord);
    }

    // if we found a legacy record and it didn't have sessionId, ensure we set it
    const updatedRecord = await prisma.control.update({
      where: { id: existingRecord.id },
      data: {
        sessionId: sessionRecord.id,
        number_of_hostel_bed: payload.number_of_hostel_bed,
        Institution_name: payload.Institution_name,
        Institution_hostel_name: payload.Institution_hostel_name,
        SchoolAddress: payload.SchoolAddress,
        TotalFees: payload.TotalFees,
        SchoolLogo: payload.SchoolLogo,
        lunchFee: payload.lunchFee,
      }
    });
    return res.status(200).json(updatedRecord);
  } catch (error) {
    console.error('Error in changesFromControlPanel:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

router.get("/getChanges", async (req, res) => {
  try {
    const { year } = req.query;

    if (!year) {
      // If no year is provided, return the first control record for backward compatibility
      const controlData = await prisma.control.findFirst();
      if (controlData) return res.status(200).json(controlData);
      return res.status(404).json({ message: "Data not found" });
    }

    // Find the session by year
    const sessionRecord = await prisma.session.findUnique({
      where: { year }
    });

    if (!sessionRecord) {
      return res.status(404).json({ message: "Session not found" });
    }

    // Get control record for this session
    let controlData = await prisma.control.findUnique({
      where: { sessionId: sessionRecord.id }
    });

    if (controlData) {
      return res.status(200).json(controlData);
    }

    // if no session-specific record, look for a default record without a sessionId
    controlData = await prisma.control.findFirst({
      where: { sessionId: null }
    });
    if (controlData) {
      return res.status(200).json(controlData);
    }

    // If still no config for this session, return blank defaults
    return res.status(200).json({
      id: null,
      sessionId: sessionRecord.id,
      number_of_hostel_bed: null,
      Institution_name: "School",
      Institution_hostel_name: "Hostel",
      SchoolLogo: null,
      SchoolAddress: null,
      TotalFees: null,
      lunchFee: null,
    });
  } catch (error) {
    console.error('Error in getChanges:', error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
});


router.post("/uploadAttendance", upload.single("file"), async (req, res) => {
  const filePath = req.file.path;

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const worksheet = workbook.getWorksheet(1);

  const Attendance = [];

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber !== 1) {
      // Skip header row
      let dateValue = row.getCell(4).value;

      // If the date is a serial number in Excel, convert it
      if (typeof dateValue === 'number') {
        dateValue = new Date(Math.round((dateValue - 25569) * 86400 * 1000)); // Convert Excel serial date
      } else {
        // Parse date string and convert to UTC
        dateValue = new Date(dateValue);
        // Normalize to UTC by stripping local timezone offset
        dateValue = new Date(Date.UTC(
          dateValue.getFullYear(),
          dateValue.getMonth(),
          dateValue.getDate()
        ));
      }


      const attendance = {

        studentName: row.getCell(1).value,
        standard: row.getCell(2).value,
        subjectName: row.getCell(3).value,
        date: dateValue,
        status: row.getCell(5).value,
        rollNo: row.getCell(6).value,
        session: row.getCell(7).value,
        studentId: row.getCell(8).value,
      };
      Attendance.push(attendance);
    }
  });

  try {
    // Create students with mapped class ids
    for (const at of Attendance) {
      await prisma.attendance.create({
        data: {
          studentName: at.studentName,
          date: at.date,
          status: at.status == "Absent" ? false : true,
          subjectName: at.subjectName,
          rollNo: at.rollNo,
          standard: at.standard,
          subjectId: at.subjectId ? parseInt(at.subjectId) : null,
          session: at.session,
          studentId: at.studentId,
        },
      });
    }

    fs.unlinkSync(filePath);
    res.status(200).send("File uploaded and data imported successfully");
  } catch (error) {
    console.error("Error importing data:", error);
    res.status(500).send("Failed to import data");
  }
});

router.post("/uploadFee", upload.single("file"), async (req, res) => {
  const filePath = req.file.path;

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const worksheet = workbook.getWorksheet(1);

  const fees = [];

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber !== 1) {

      const fee = {
        id: row.getCell(1).value,
        title: row.getCell(2).value,
        amount: row.getCell(3).value,
        amountDate: row.getCell(4).value,
        admissionDate: row.getCell(5).value,
        studentId: row.getCell(6).value,
      };
      fees.push(fee);
    }
  });

  try {
    // Create students with mapped class ids
    for (const at of fees) {
      await prisma.fee.create({
        data: {
          title: at.title,
          amount: at.amount,
          amountDate: at.amountDate,
          admissionDate: at.admissionDate,
          studentId: at.studentId
        },
      });
    }

    fs.unlinkSync(filePath);
    res.status(200).send("File uploaded and data imported successfully");
  } catch (error) {
    console.error("Error importing data:", error);
    res.status(500).send("Failed to import data");
  }
});


router.post("/uploadHostel", upload.single("file"), async (req, res) => {
  const filePath = req.file.path;

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const worksheet = workbook.getWorksheet(1);

  const Hostel = [];

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber !== 1) {

      const hostel = {
        id: row.getCell(1).value,
        name: row.getCell(2).value,
        rollNo: row.getCell(3).value,
        standard: row.getCell(4).value,
        gender: row.getCell(5).value,
        bed_number: row.getCell(6).value,
      };
      Hostel.push(hostel);
    }
  });

  try {
    // Create students with mapped class ids
    for (const at of Hostel) {
      await prisma.hostel.create({
        data: {
          name: at.name,
          rollNo: at.rollNo,
          standard: at.standard,
          gender: at.gender,
          bed_number: at.bed_number
        },
      });
    }

    fs.unlinkSync(filePath);
    res.status(200).send("File uploaded and data imported successfully");
  } catch (error) {
    console.error("Error importing data:", error);
    res.status(500).send("Failed to import data");
  }
});

router.post("/uploadMarks", upload.single("file"), async (req, res) => {
  const filePath = req.file.path;

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const worksheet = workbook.getWorksheet(1);

  const Marks = [];

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber !== 1) {

      const mark = {
        id: row.getCell(1).value,
        studentId: row.getCell(2).value,
        subjectId: row.getCell(3).value,
        subjectName: row.getCell(4).value,
        examinationType: row.getCell(5).value,
        obtainedMarks: row.getCell(6).value,
        totalMarks: row.getCell(7).value,
        percentage: row.getCell(8).value,
      };
      Marks.push(mark);
    }
  });

  try {
    // Create students with mapped class ids
    for (const at of Marks) {
      await prisma.marks.create({
        data: {
          studentId: at.studentId,
          subjectId: at.subjectId,
          subjectName: at.subjectName,
          examinationType: at.examinationType,
          obtainedMarks: at.obtainedMarks,
          totalMarks: at.totalMarks,
          percentage: at.percentage
        },
      });
    }

    fs.unlinkSync(filePath);
    res.status(200).send("File uploaded and data imported successfully");
  } catch (error) {
    console.error("Error importing data:", error);
    res.status(500).send("Failed to import data");
  }
});



router.get('/scholarshipStudents', async (req, res) => {
  const session = req.session;
  try {
    const studentsInfo = await prisma.student.findMany({
      where: {
        session: session,
        scholarshipApplied: true,
      },
      include: {
        parents: true,
        fees: true,
        marks: true,
      },
    });

    console.log()

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Scholarship');

    // Define columns for the worksheet
    worksheet.columns = [

      // { header: 'StudentId', key: 'sid', width: 10 },
      { header: 'Full Name', key: 'fullName', width: 30 },
      { header: 'Gender', key: 'gender', width: 10 },
      { header: 'Date of Birth', key: 'dateOfBirth', width: 15 },
      { header: 'Roll No', key: 'rollNo', width: 10 },
      { header: 'Standard', key: 'standard', width: 10 },
      { header: 'Scholarship Applied', key: 'scholarshipApplied', width: 15 },
      { header: 'Address', key: 'address', width: 30 },
      { header: 'Photo URL', key: 'photoUrl', width: 30 },
      { header: 'Father Name', key: 'fatherName', width: 20 },
      { header: 'Father Occupation', key: 'fatherOccupation', width: 20 },
      { header: 'Mother Name', key: 'motherName', width: 20 },
      { header: 'Mother Occupation', key: 'motherOccupation', width: 20 },
      { header: 'Father Contact', key: 'fatherContact', width: 15 },
      { header: 'Mother Contact', key: 'motherContact', width: 15 },
      { header: 'Fee Title', key: 'feeTitle', width: 15 },
      { header: 'Fee Amount', key: 'feeAmount', width: 15 },
      { header: 'Amount Date', key: 'feeAmountDate', width: 15 },
      { header: 'Admission Date', key: 'admissionDate', width: 15 },
      { header: 'Remark', key: 'remark', width: 15 },
      { header: 'Session', key: 'session', width: 10 },
    ];

    // Add student data to worksheet
    studentsInfo.forEach((student) => {

      worksheet.addRow({

        // sid: student.id,
        fullName: student.fullName || 'N/A',  // Handle missing names
        gender: student.gender || 'N/A',
        dateOfBirth: student.dateOfBirth ? student.dateOfBirth.toISOString().split('T')[0] : 'N/A',
        rollNo: student.rollNo || 'N/A',
        standard: student.standard || 'N/A',
        scholarshipApplied: student.scholarshipApplied ? 'Yes' : 'No',
        address: student.address || 'N/A',
        photoUrl: student.photoUrl || '',
        fatherName: student.parents[0]?.fatherName || 'N/A',
        fatherOccupation: student.parents[0]?.fatherOccupation || 'N/A',
        motherName: student.parents[0]?.motherName || 'N/A',
        motherOccupation: student.parents[0]?.motherOccupation || 'N/A',
        fatherContact: student.parents[0]?.fatherContact?.toString() || '',
        motherContact: student.parents[0]?.motherContact?.toString() || '',
        feeTitle: student.fees[0]?.title || 'N/A',
        feeAmount: student.fees[0]?.amount || 0,
        feeAmountDate: student.fees[0]?.amountDate ? student.fees[0].amountDate.toISOString().split('T')[0] : 'N/A',
        admissionDate: student.fees[0]?.admissionDate ? student.fees[0].admissionDate.toISOString().split('T')[0] : 'N/A',
        remark: student.remark || '',
        session: student.session || 'N/A',
      });
    });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="Scholarship.xlsx"'
    );

    // Send Excel file as response
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error fetching students data:', error);
    res.status(500).json({ error: 'An error occurred' });
  }
});

router.post("/credentials", async (req, res) => {
  const { username, password } = req.body;
  const hashedUsername = crypto.createHash("sha256").update(username).digest("hex");
  const hashedPassword = crypto.createHash("sha256").update(password).digest("hex");
  const adminStoredUsername = process.env.ADMIN_HASH ?? "";
  const userStoredUsername = process.env.USER_HASH ?? "";
  const token = crypto.randomBytes(16).toString("hex");

  if (hashedUsername == adminStoredUsername) {
    const adminStoredPassword = process.env.ADMINPASSWORD_HASH;
    if (hashedPassword == adminStoredPassword) {
      tokenRoleMap[token] = "admin"; // Store token-role mapping
      return res.status(200).json({ token, role: "admin" });
    }
  } else if (hashedUsername == userStoredUsername) {
    const userStoredPassword = process.env.USERPASSWORD_HASH;
    if (hashedPassword == userStoredPassword) {
      tokenRoleMap[token] = "teacher"; // Store token-role mapping
      return res.status(200).json({ token, role: "teacher" });
    }
  }
  return res.status(401).json({ message: "Invalid credentials" });
});

const tokenRoleMap = {};
router.post("/validate-token", (req, res) => {
  const { token } = req.body;
  const role = tokenRoleMap[token]; // Retrieve role for the token
  if (role) {
    return res.status(200).json({ token, role });
  }
  return res.status(401).json({ message: "Invalid or expired token" });
});

router.get("/standards", async (req, res) => {
  const standard = await prisma.standards.findMany();
  if (!standard) {
    return res.status(500).json({ error: "Error fetching standard" })
  }
  return res.status(200).json({ standard });
})

router.get("/standard/:std", async (req, res) => {
  try {
    const { std } = req.params;
    const standard = await prisma.standards.findUnique({
      where: { std: std },
    });
    if (!standard) {
      return res.status(404).json({ error: "Standard not found" });
    }
    return res.status(200).json(standard);
  } catch (error) {
    console.error("Error fetching standard:", error);
    res.status(500).json({ error: "Error fetching standard" });
  }
});


router.post('/uploadSchoolLogo', upload.single('file'), async (req, res) => {
  try {
    const fileUrl = 'http://localhost:5000/uploads/photos/' + req.file.filename;
    res.status(200).send(fileUrl);
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).send('Error uploading file');
  }
});

// Dashboard: Get all students data
router.get("/dashboard/students", async (req, res) => {
  const session = req.session;
  if (!session) {
    return res.status(400).json({ error: "Session not set" });
  }
  try {
    const students = await prisma.student.findMany({
      where: { session },
      select: {
        id: true,
        fullName: true,
        rollNo: true,
        standard: true,
        gender: true,
      },
    });
    res.status(200).json(students);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch students" });
  }
});

// Dashboard: Get all fees data
router.get("/dashboard/fees", async (req, res) => {
  const session = req.session;
  if (!session) {
    return res.status(400).json({ error: "Session not set" });
  }
  try {
    // Optional filters
    const { class: filterClass, category: filterCategory } = req.query;

    // Fetch students in session (apply class/category filters)
    let students = await prisma.student.findMany({
      where: { session },
      include: { fees: true },
    });

    if (filterClass) {
      students = students.filter(s => s.standard === filterClass);
    }

    if (filterCategory) {
      // fetch standards to map categories
      const standards = await prisma.standards.findMany({ select: { std: true, category: true, totalFees: true } });
      const stdMap = Object.fromEntries(standards.map(s => [s.std, s]));
      students = students.filter(s => stdMap[s.standard]?.category === filterCategory);
    }

    // Fetch standards fees map
    const standardFees = await prisma.standards.findMany({ select: { std: true, totalFees: true } });
    const stdFeeMap = Object.fromEntries(standardFees.map(s => [s.std, s.totalFees || 0]));

    // Aggregate per-student totals
    const aggregated = students.map(student => {
      const totalPaid = (student.fees || []).reduce((sum, f) => sum + (f.amount || 0), 0);
      const totalFee = stdFeeMap[student.standard] || 0;
      const remaining = totalFee - totalPaid;
      return {
        studentId: student.id,
        studentName: student.fullName,
        rollNo: student.rollNo,
        standard: student.standard,
        totalFee,
        totalPaid,
        remainingFee: remaining,
      };
    }).sort((a, b) => {
      const sa = parseInt(a.standard) || 0;
      const sb = parseInt(b.standard) || 0;
      return sa - sb;
    });

    res.status(200).json(aggregated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch fees" });
  }
});

// Dashboard: Get all transport (bus) data
router.get("/dashboard/transport", async (req, res) => {
  const session = req.session;
  if (!session) {
    return res.status(400).json({ error: "Session not set" });
  }
  try {
    const transport = await prisma.student.findMany({
      where: { session, busAccepted: true },
      select: {
        id: true,
        fullName: true,
        rollNo: true,
        standard: true,
        busStationId: true,
        busPrice: true,
        busStation: { select: { stationName: true } },
      },
    });
    res.status(200).json(transport);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch transport data" });
  }
});

// Dashboard: Get all lunch data
router.get("/dashboard/lunch", async (req, res) => {
  const session = req.session;
  if (!session) {
    return res.status(400).json({ error: "Session not set" });
  }
  try {
    const lunch = await prisma.student.findMany({
      where: { session, lunchAccepted: true },
      select: {
        id: true,
        fullName: true,
        rollNo: true,
        standard: true,
        lunchPrice: true,
      },
    });
    res.status(200).json(lunch);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch lunch data" });
  }
});

// Dashboard: Get all teachers data (empty for now)
router.get("/dashboard/teachers", async (req, res) => {
  try {
    res.status(200).json([]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch teachers" });
  }
});

// Dashboard: Get all sections data (fetching from standards as sections)
router.get("/dashboard/sections", async (req, res) => {
  try {
    const sections = await prisma.standards.findMany({
      select: { id: true, std: true, category: true, totalFees: true },
    });
    res.status(200).json(sections);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch sections" });
  }
});

// Dashboard: Get fees pending students
router.get("/dashboard/fees-pending", async (req, res) => {
  const session = req.session;
  const { class: filterClass, category: filterCategory } = req.query;

  if (!session) {
    return res.status(400).json({ error: "Session not set" });
  }

  try {
    let students = await prisma.student.findMany({
      where: { session },
      include: {
        fees: true,
      },
    });

    // Get all standards with their categories
    const standards = await prisma.standards.findMany({
      select: { std: true, category: true, totalFees: true },
    });
    const stdMap = Object.fromEntries(standards.map(s => [s.std, s]));

    // Filter by category if provided
    if (filterCategory) {
      students = students.filter(s => stdMap[s.standard]?.category === filterCategory);
    }

    // Filter by class if provided
    if (filterClass) {
      students = students.filter(s => s.standard === filterClass);
    }

    const studentFeesPending = students.map(student => {
      const stdData = stdMap[student.standard] || { totalFees: 0, category: '' };
      const totalFee = stdData.totalFees || 0;
      const paidFee = student.fees.reduce((sum, fee) => sum + fee.amount, 0);
      const remainingFee = totalFee - paidFee;

      return {
        id: student.id,
        studentName: student.fullName,
        rollNo: student.rollNo,
        standard: student.standard,
        category: stdData.category,
        totalFee,
        paidFee,
        remainingFee,
      };
    }).sort((a, b) => {
      // Sort by standard number (ascending)
      const stdA = parseInt(a.standard) || 0;
      const stdB = parseInt(b.standard) || 0;
      return stdA - stdB;
    });

    res.status(200).json(studentFeesPending);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch fees-pending data" });
  }
});

// Dashboard: Get backup data for all relations
router.get("/dashboard/backup", async (req, res) => {
  const session = req.session;

  if (!session) {
    return res.status(400).json({ error: "Session not set" });
  }

  try {
    // Fetch all data
    const studentsData = await prisma.student.findMany({
      where: { session },
      include: {
        busStation: { select: { stationName: true } },
        fees: true,
        parents: true,
      },
      orderBy: { standard: 'asc' }
    });

    const feesData = await prisma.fee.findMany({
      where: {
        student: { session }
      },
      include: {
        student: {
          select: { fullName: true, standard: true, rollNo: true }
        },
      },
    });

    const transportData = await prisma.student.findMany({
      where: { session, busAccepted: true },
      select: {
        fullName: true,
        rollNo: true,
        standard: true,
        busStationId: true,
        busStation: { select: { stationName: true } },
        busPrice: true,
      },
    });

    const lunchData = await prisma.student.findMany({
      where: { session, lunchAccepted: true },
      select: {
        fullName: true,
        rollNo: true,
        standard: true,
        lunchPrice: true,
      },
    });

    const sectionsData = await prisma.standards.findMany({
      select: { std: true, category: true, totalFees: true },
    });

    // Get fees pending data
    const studentFeesPending = studentsData.map(student => {
      const stdData = sectionsData.find(s => s.std === student.standard);
      const totalFee = stdData?.totalFees || 0;
      const paidFee = student.fees.reduce((sum, fee) => sum + fee.amount, 0);
      const remainingFee = totalFee - paidFee;

      return {
        studentName: student.fullName,
        rollNo: student.rollNo,
        standard: student.standard,
        category: stdData?.category,
        totalFee,
        paidFee,
        remainingFee,
      };
    }).sort((a, b) => {
      const stdA = parseInt(a.standard) || 0;
      const stdB = parseInt(b.standard) || 0;
      return stdA - stdB;
    });

    // Format fees with student info
    const formattedFees = feesData.map(fee => ({
      studentName: fee.student.fullName,
      rollNo: fee.student.rollNo,
      standard: fee.student.standard,
      amount: fee.amount,
      amountDate: fee.amountDate,
      remark: fee.remark,
    }));

    // Prepare backup data
    const backupData = {
      session,
      exportDate: new Date().toISOString(),
      students: {
        count: studentsData.length,
        data: studentsData.map(s => ({
          fullName: s.fullName,
          rollNo: s.rollNo,
          standard: s.standard,
          gender: s.gender,
          dateOfBirth: s.dateOfBirth,
          busStation: s.busStation?.stationName || 'N/A',
          busPrice: s.busPrice,
          lunchPrice: s.lunchPrice,
          lunchAccepted: s.lunchAccepted,
          busAccepted: s.busAccepted,
        }))
      },
      fees: {
        count: feesData.length,
        data: formattedFees
      },
      transport: {
        count: transportData.length,
        data: transportData.map(t => ({
          fullName: t.fullName,
          rollNo: t.rollNo,
          standard: t.standard,
          busStation: t.busStation?.stationName,
          busPrice: t.busPrice,
        }))
      },
      lunch: {
        count: lunchData.length,
        data: lunchData
      },
      sections: {
        count: sectionsData.length,
        data: sectionsData
      },
      feesPending: {
        count: studentFeesPending.length,
        data: studentFeesPending
      },
    };

    res.status(200).json(backupData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch backup data" });
  }
});

module.exports = router;