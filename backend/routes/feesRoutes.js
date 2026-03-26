/* Fees Model */
const express = require("express");
const { PrismaClient } = require("@prisma/client");
const router = express.Router();
const ExcelJS = require("exceljs");

const path = require("path");
const prisma = new PrismaClient();

const formatMoney = (val) => (typeof val === 'number' ? val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : val);


router.use(express.json());
router.use(express.urlencoded({ extended: true }));
router.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// Get Fees Details with Lunch and Inventory Info
router.get("/fees/details", async (req, res) => {
    const { standard, roll_no } = req.query;
    const session = req.session;
    if (!standard || isNaN(parseInt(roll_no))) {
      return res.status(400).json({ error: "Invalid query parameters" });
    }
  
    try {
      const result = await prisma.student.findFirst({
        where: {
          session: session,
          standard: standard.toString(),
          rollNo: parseInt(roll_no),
          college: req.college
        },
        select: {
          id: true,
          fullName: true,
          rollNo: true,
          standard: true,
          lunchAccepted: true,
          lunchPrice: true,
          busAccepted: true,
          busStationId: true,
          busPrice: true,
          fees: {
            where :{

            },
            select: {
              title: true,
              amount: true,
              amountDate: true,
              admissionDate: true,
            },
          },
          studentInventory: {
            select: {
              inventory: {
                select: {
                  itemName: true,
                  gender: true,
                  price: true,
                },
              },
              quantityPurchased: true,
              totalPrice: true,
            },
          },
        },
      });
  
      if (!result) {
        return res.status(404).json({ error: "Student not found" });
      }

      // Format fee amounts and inventory prices for frontend display (readable strings)
      const formatted = {
        ...result,
        lunchPriceFormatted: formatMoney(result.lunchPrice ?? 700),
        busPriceFormatted: formatMoney(result.busPrice),
        fees: result.fees.map(f => ({
          ...f,
          amountFormatted: formatMoney(f.amount),
          amountDate: f.amountDate,
          admissionDate: f.admissionDate,
        })),
        studentInventory: result.studentInventory.map(si => ({
          ...si,
          totalPriceFormatted: formatMoney(si.totalPrice),
          inventory: {
            ...si.inventory,
            priceFormatted: formatMoney(si.inventory.price),
          }
        }))
      };

      res.status(200).json(formatted);
    } catch (error) {
      console.error("Error fetching fees details:", error);
      res.status(500).json({ error: "An error occurred" });
    }
  });
  
  // Get student fees details including lunch, bus, and inventory
  router.get("/feetable", async(req,res)=>{
    const { standard, id } = req.query;
    try{
      // allow lookup by `id` or by `standard` when `id` is not provided
      const whereClause = id ? { id: parseInt(id) } : (standard ? { standard: standard.toString() } : {});

      const student = await prisma.student.findFirst({
        where: { ...whereClause, college: req.college },
        select: {
          id: true,
          fullName: true,
          rollNo: true,
          standard: true,
          lunchAccepted: true,
          lunchPrice: true,
          busAccepted: true,
          busStationId: true,
          busPrice: true,
          fees: {
            // no `title` filter — frontend provides `standard` or `id` to select student
            where: {},
            select: {
              title: true,
              amount: true,
              amountDate: true,
              admissionDate: true,
            },
          },
          studentInventory: {
            select: {
              inventory: {
                select: {
                  itemName: true,
                  gender: true,
                  price: true,
                },
              },
              quantityPurchased: true,
              totalPrice: true,
            },
          },
        },
      });
      
      if (!student) {
        return res.status(404).json({ error: "Student not found" });
      }

      // Fetch the standard to get totalFees. If the DB doesn't have the column (migration not applied),
      // catch the Prisma P2022 error and default to 0 so the endpoint remains functional.
      let standardTotalFees = 0;
      if (student.standard) {
        try {
          const standardData = await prisma.standards.findFirst({
            where: { std: student.standard, college: req.college },
            select: { totalFees: true }
          });
          standardTotalFees = standardData?.totalFees || 0;
        } catch (err) {
          // P2022: column does not exist on the DB side — default to 0 and log a warning
          if (err && err.code === 'P2022') {
            console.warn('Standards.totalFees column missing in DB; defaulting standardTotalFees to 0. Run Prisma migrations to add this column.');
            standardTotalFees = 0;
          } else {
            // rethrow unexpected errors
            throw err;
          }
        }
      }

      // Format amounts for display; default lunch price to 700 when missing
      const formattedStudent = {
        ...student,
        standardTotalFees: standardTotalFees,
        lunchPriceFormatted: formatMoney(student.lunchPrice ?? 700),
        busPriceFormatted: formatMoney(student.busPrice),
        fees: student.fees.map(f => ({ ...f, amountFormatted: formatMoney(f.amount) })),
        studentInventory: student.studentInventory.map(si => ({
          ...si,
          totalPriceFormatted: formatMoney(si.totalPrice),
          inventory: { ...si.inventory, priceFormatted: formatMoney(si.inventory.price) }
        }))
      };

      // Return array with single element for compatibility with existing frontend
      res.status(200).json([formattedStudent]);
    }catch(error){
      console.log(error);
      res.status(500).json({ error: "Failed to fetch fee details" });
    }
  })
  
  //Add Fees Details
  router.post("/fees/add", async (req, res) => {
    const { title, amount, amountDate, admissionDate, studentId } =
      req.body;
  
    if (!title || !amount || !amountDate || !admissionDate || !studentId) {
      return res.status(400).json({ error: "Invalid data" });
    }
  
    try {
      const fee = await prisma.fee.create({
        data: {
          title,
          amount: parseFloat(amount),
          amountDate: new Date(amountDate),
          admissionDate: new Date(),
          studentId: parseInt(studentId),
          college: req.college
        },
      });
  
      res.status(201).json(fee);
    } catch (error) {
      console.error("Error adding fee:", error);
      res.status(500).json({ error: "An error occurred" });
    }
  });



  router.get("/downloadfeedata", async (req, res) => {
    try {
      const feeRecord = await prisma.fee.findMany({ where: { college: req.college } });
  
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Fees");
  
      worksheet.columns = [
        { header: "id", key: "id", width: 30 },
        { header: "title", key: "title", width: 15 },
        { header: "amount", key: "amount", width: 30 },
        { header: "amountDate", key: "amountDate", width: 20 },
        { header: "admissionDate", key: "admissionDate", width: 10 },
        { header: "studentId ", key: "studentId", width: 10 },
      ];
  
      feeRecord.forEach((record) => {
        worksheet.addRow({
          id                  : record.id,
          title               : record.title,
          amount              : record.amount,
          amountDate          : record.amountDate,
          admissionDate       : record.admissionDate,
          studentId           : record.studentId
      })});
  
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=Fees.xlsx"
      );
     
      await workbook.xlsx.write(res);
      res.end();
    }catch (error) {
      console.error("Error generating attendance Excel file:", error);
      res.status(500).send("Failed to generate Excel file");
    }
  });

  module.exports = router;