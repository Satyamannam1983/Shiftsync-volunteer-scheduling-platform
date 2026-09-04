const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const AppError = require("../utils/AppError");
const { loadEnv } = require("../config/env");

const toPublicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const registerVolunteer = async ({ name, email, password, role = "volunteer" }) => {
  const normalizedEmail = email.toLowerCase().trim();

  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    throw new AppError("User with this email already exists", 409);
  }

  const userRole = role === "coordinator" ? "coordinator" : "volunteer";
  const passwordHash = await bcrypt.hash(password, 10);

  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    passwordHash,
    role: userRole,
  });

  return toPublicUser(user);
};

const loginUser = async ({ email, password }) => {
  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    throw new AppError("Invalid email or password", 401);
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) {
    throw new AppError("Invalid email or password", 401);
  }

  const env = loadEnv();
  const token = jwt.sign(
    {
      userId: user._id.toString(),
      role: user.role,
    },
    env.jwtSecret || process.env.JWT_SECRET,
    { expiresIn: env.jwtExpiresIn }
  );

  return {
    token,
    user: toPublicUser(user),
  };
};

const getUserById = async (userId) => {
  const user = await User.findById(userId).select("-passwordHash");
  if (!user) {
    throw new AppError("User not found", 404);
  }
  return toPublicUser(user);
};

module.exports = {
  toPublicUser,
  registerVolunteer,
  loginUser,
  getUserById,
};
