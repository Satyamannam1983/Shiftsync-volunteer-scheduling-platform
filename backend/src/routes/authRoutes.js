const express = require("express");
const { register, login, getMe } = require("../controllers/authController");
const { authenticate } = require("../middleware/authMiddleware");
const { registerValidators, loginValidators } = require("../validators/authValidators");

const router = express.Router();

router.post("/register", registerValidators, register);
router.post("/login", loginValidators, login);
router.get("/me", authenticate, getMe);

module.exports = router;
