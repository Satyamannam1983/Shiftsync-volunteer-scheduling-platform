const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const request = require("supertest");
const User = require("../src/models/User");

const createUser = async ({ name, email, password, role }) => {
  const passwordHash = await bcrypt.hash(password, 10);
  return User.create({ name, email: email.toLowerCase(), passwordHash, role });
};

const tokenFor = (user) =>
  jwt.sign({ userId: user._id.toString(), role: user.role }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });

const auth = (app, user) => {
  const token = tokenFor(user);
  return {
    get: (url) => request(app).get(url).set("Authorization", `Bearer ${token}`),
    post: (url) => request(app).post(url).set("Authorization", `Bearer ${token}`),
    patch: (url) => request(app).patch(url).set("Authorization", `Bearer ${token}`),
    delete: (url) => request(app).delete(url).set("Authorization", `Bearer ${token}`),
  };
};

module.exports = { createUser, tokenFor, auth };
