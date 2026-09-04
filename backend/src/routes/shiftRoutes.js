const express = require("express");

const {
  createShift,
  getShifts,
  getShiftById,
  updateShift,
  deleteShift,
  closeShift,
} = require("../controllers/shiftController");

const {
  createShiftSignup,
  cancelShiftSignup,
  getShiftSignups,
} = require("../controllers/signupController");

const { authenticate, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

// All shift routes require authentication
router.use(authenticate);

// Shift CRUD
router.post("/", authorize("coordinator"), createShift);
router.get("/", getShifts);
router.get("/:id", getShiftById);
router.patch("/:id", authorize("coordinator"), updateShift);
router.delete("/:id", authorize("coordinator"), deleteShift);
router.post("/:id/close", authorize("coordinator"), closeShift);

// Signup operations (nested under shift routes)
router.post("/:shiftId/signups", createShiftSignup);
router.delete("/:shiftId/signups/:signupId", cancelShiftSignup);
router.get("/:shiftId/signups", getShiftSignups);

module.exports = router;