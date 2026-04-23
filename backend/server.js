require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

// Import routes
const sessionManager = require("./middleware/sessionManager")
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const student = require("./routes/studentRoutes");
const attendance = require("./routes/attendanceRoutes");
const fees = require("./routes/feesRoutes");
const marks = require("./routes/marksRoutes");
const hostel = require("./routes/hostelRoutes");
const control = require("./routes/controlRoutes");
const other = require("./routes/otherRoutes");
const inventory = require("./routes/inventoryRoutes");
const bus = require("./routes/busRoutes");
const dashboard = require("./routes/dashboardRoutes");

const rag = require("./routes/ragRoutes");

const app = express();

app.use(cors(
    {
        origin: "*", // Allow all origins for local network access
        credentials: true
    }
));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 1. Multi-tenancy & Session Middleware (CRITICAL: Define before any routes)
app.use(async (req, res, next) => {
    try {
        // Capture college from header or query param
        const college = req.headers['x-college-name'] || req.query.college || 'st vincent';
        req.college = college;

        // Check query parameter or header for session year
        let session = req.query.session || req.headers['x-session'];

        // If not in query/header, check persisted session
        if (!session) {
            session = sessionManager.getSession();
        }

        // Fallback to latest session from database for THIS college if still not found
        if (!session) {
            const latestSession = await prisma.session.findFirst({
                where: { college: req.college },
                orderBy: { year: 'desc' }
            });
            session = latestSession ? latestSession.year : '2025-2026';
        }

        req.session = session;
        next();
    } catch (error) {
        console.error("Session middleware error:", error);
        req.session = '2025-2026';
        req.college = 'st vincent';
        next();
    }
});

app.post('/session', async (req, res) => {
    const { year, college } = req.body;
    const targetCollege = college || req.college || 'st vincent';

    if (!year) {
        return res.status(400).json({ error: 'Year is required' });
    }

    try {
        // Use req.college set by middleware
        const session = await prisma.session.create({
            data: { year, college: req.college },
        });
        return res.status(200).json({ message: 'Year stored', session });
    } catch (error) {
        console.error("Error storing session:", error);

        // Check if the error is a unique constraint violation
        if (error.code === 'P2002') { // Prisma unique constraint violation error code
            return res.status(409).json({ error: 'Session already exists for this college' });
        }

        return res.status(500).json({ error: 'An error occurred while storing the session' });
    }
});

app.get('/getSessions', async (req, res) => {
    try {
        // Simplify: middleware already sets req.college correctly
        const fetchSession = await prisma.session.findMany({
            where: { college: req.college },
            orderBy: {
                year: 'desc'
            }
        });
        return res.status(200).json(fetchSession)
    } catch (error) {
        console.error("Error fetching session: ", error.message);
        return res.status(500).json({ error: 'An error occurred while fetching sessions', details: error.message });
    }
})
app.get('/setSession', (req, res) => {
    try {
        const { year } = req.query;

        if (!year) {
            return res.status(400).json({ error: "Year parameter is required" });
        }

        // Add further validation for `year` if necessary
        sessionManager.setSession(year);

        res.status(200).json({ message: `Session set to ${year}` });
    } catch (error) {
        console.error("Error in /setSession route:", error);
        res.status(500).json({ error: "An internal server error occurred" });
    }
});

// Use routers with appropriate paths AFTER session is set up
app.use(student);
app.use(attendance);
app.use(fees);
app.use(marks);
app.use(hostel);
app.use(control);
app.use(other);
app.use(inventory);
app.use(bus);
app.use(rag);
app.use("/api", dashboard);

// Start server


// Start server
const HOST = '0.0.0.0';
app.listen(5000, HOST, () => {
    console.log(`Server is running on http://${HOST}:5000 (accessible at http://192.168.137.40:5000)`);
});
