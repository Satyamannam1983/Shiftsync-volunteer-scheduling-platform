const express = require("express");

const {
  createProgram,
  getPrograms,
  getProgramById,
  updateProgram,
  archiveProgram,
  restoreProgram,
  getProgramMembers,
  addProgramMember,
  removeProgramMember,
  generateRecurringSchedule,
} = require("../controllers/programController");
const { exportProgramRoster } = require("../controllers/rosterController");
const { authenticate, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authenticate);

router.post("/", authorize("coordinator"), createProgram);
router.get("/", getPrograms);
router.get("/:id", getProgramById);
router.patch("/:id", authorize("coordinator"), updateProgram);
router.post("/:id/archive", authorize("coordinator"), archiveProgram);
router.post("/:id/restore", authorize("coordinator"), restoreProgram);

router.get("/:programId/members", getProgramMembers);
router.post("/:programId/members", authorize("coordinator"), addProgramMember);
router.delete(
  "/:programId/members/:volunteerId",
  authorize("coordinator"),
  removeProgramMember
);

router.post(
  "/:programId/shifts/recurring",
  authorize("coordinator"),
  generateRecurringSchedule
);

router.get(
  "/:programId/roster/export",
  authorize("coordinator"),
  exportProgramRoster
);

module.exports = router;
