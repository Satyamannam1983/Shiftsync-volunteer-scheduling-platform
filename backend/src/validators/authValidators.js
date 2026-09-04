const { body } = require("express-validator");
const { handleValidation } = require("../middleware/validationMiddleware");

const registerValidators = [
  body("name").trim().notEmpty().withMessage("Name is required").isLength({ min: 2, max: 80 }),
  body("email").isEmail().withMessage("A valid email is required").normalizeEmail(),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters"),
  body("role")
    .optional()
    .isIn(["volunteer", "coordinator"])
    .withMessage("Role must be either volunteer or coordinator"),
  handleValidation,
];

const loginValidators = [
  body("email").isEmail().withMessage("A valid email is required").normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required"),
  handleValidation,
];

module.exports = { registerValidators, loginValidators };
