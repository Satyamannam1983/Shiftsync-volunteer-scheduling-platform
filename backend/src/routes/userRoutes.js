const express = require("express");
const { listVolunteers } = require("../controllers/userController");
const { authenticate, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authenticate);
router.get("/", authorize("coordinator"), listVolunteers);

module.exports = router;
