const express = require("express");

const {
  getDashboard,
} = require("../controllers/dashboardController");

const { authenticate } = require("../middleware/authMiddleware");

const router = express.Router();

// All dashboard routes require authentication
router.use(authenticate);

// Dashboard summary
router.get("/summary", getDashboard);

module.exports = router;