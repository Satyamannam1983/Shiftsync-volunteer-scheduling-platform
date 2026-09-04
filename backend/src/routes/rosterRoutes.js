const express = require("express");

const {
  exportProgramRoster,
} = require("../controllers/rosterController");

const { authenticate, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

// All roster routes require authentication
router.use(authenticate);

// Roster export
router.get(
  "/:programId/export",
  authorize("coordinator"),
  exportProgramRoster
);

module.exports = router;