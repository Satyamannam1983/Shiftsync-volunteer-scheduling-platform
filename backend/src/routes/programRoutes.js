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
} = require("../controllers/programController");

const { authenticate, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

// All program routes require authentication
router.use(authenticate);

// Program CRUD
router.post("/", authorize("coordinator"), createProgram);
router.get("/", getPrograms);
router.get("/:id", getProgramById);
router.patch("/:id", authorize("coordinator"), updateProgram);
router.post("/:id/archive", authorize("coordinator"), archiveProgram);
router.post("/:id/restore", authorize("coordinator"), restoreProgram);

// Program membership
router.get("/:programId/members", getProgramMembers);
router.post("/:programId/members", authorize("coordinator"), addProgramMember);
router.delete(
  "/:programId/members/:volunteerId",
  authorize("coordinator"),
  removeProgramMember
);

module.exports = router;