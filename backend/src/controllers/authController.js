const { registerVolunteer, loginUser, getUserById } = require("../services/authService");
const asyncHandler = require("../utils/asyncHandler");

const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const user = await registerVolunteer({ name, email, password });

  res.status(201).json({
    message: "User registered successfully",
    user,
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const result = await loginUser({ email, password });

  res.status(200).json({
    message: "Login successful",
    ...result,
  });
});

const getMe = asyncHandler(async (req, res) => {
  const user = await getUserById(req.user.userId);
  res.status(200).json({ user });
});

module.exports = {
  register,
  login,
  getMe,
};
