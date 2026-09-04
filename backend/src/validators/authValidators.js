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
    .custom((value) => {
      if (value && value !== "volunteer") {
        throw new Error("Public registration can only create volunteer accounts");
      }
      return true;
    }),
  handleValidation,
];

const loginValidators = [
  body("email").isEmail().withMessage("A valid email is required").normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required"),
  handleValidation,
];

module.exports = { registerValidators, loginValidators };
