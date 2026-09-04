const express = require("express");

const {
  createShift,
  getShiftById,
  updateShift,
  deleteShift,
  closeShift,
} = require("../controllers/shiftController");

const { authenticate, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

// All shift routes require authentication
router.use(authenticate);

// Shift CRUD
router.post("/", authorize("coordinator"), createShift);
router.get("/:id", getShiftById);
router.patch("/:id", authorize("coordinator"), updateShift);
router.delete("/:id", authorize("coordinator"), deleteShift);
router.post("/:id/close", authorize("coordinator"), closeShift);

module.exports = router;