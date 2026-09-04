const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const programRoutes = require("./routes/programRoutes");
const shiftRoutes = require("./routes/shiftRoutes");
const rosterRoutes = require("./routes/rosterRoutes");
const errorHandler = require("./middleware/errorMiddleware");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "Volunteer Scheduling API is running",
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/programs", programRoutes);
app.use("/api/shifts", shiftRoutes);
app.use("/api/roster", rosterRoutes);

// Error handling middleware (must be last)
app.use(errorHandler);

module.exports = app;