const dotenv = require("dotenv");

dotenv.config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const authRoutes = require("./routes/authRoutes");
const programRoutes = require("./routes/programRoutes");
const shiftRoutes = require("./routes/shiftRoutes");
const rosterRoutes = require("./routes/rosterRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const alertRoutes = require("./routes/alertRoutes");
const userRoutes = require("./routes/userRoutes");
const signupRoutes = require("./routes/signupRoutes");
const errorHandler = require("./middleware/errorMiddleware");

const app = express();

const corsOrigins = (process.env.FRONTEND_URL || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(helmet());
app.use(
  cors({
    origin: corsOrigins.length ? corsOrigins : true,
    credentials: true,
  })
);
app.use(express.json({ limit: "100kb" }));

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
app.use("/api/users", userRoutes);
app.use("/api/programs", programRoutes);
app.use("/api/shifts", shiftRoutes);
app.use("/api/signups", signupRoutes);
app.use("/api/roster", rosterRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/alerts", alertRoutes);

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use(errorHandler);

module.exports = app;
