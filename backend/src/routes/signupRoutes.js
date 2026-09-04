const express = require("express");
const { getMySignups } = require("../controllers/signupController");
const { authenticate } = require("../middleware/authMiddleware");

const router = express.Router();
router.use(authenticate);
router.get("/me", getMySignups);

module.exports = router;
