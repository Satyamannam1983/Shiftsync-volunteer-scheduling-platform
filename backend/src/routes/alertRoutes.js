const express = require("express");

const {
  getAlerts,
  dismissAlert,
} = require("../controllers/alertController");

const { authenticate, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

// All alert routes require authentication and coordinator role
router.use(authenticate);
router.use(authorize("coordinator"));

// Alert operations
router.get("/", getAlerts);
router.post("/:shiftId/dismiss", dismissAlert);

module.exports = router;