const express = require("express");
const cors = require("cors");

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

module.exports = app;