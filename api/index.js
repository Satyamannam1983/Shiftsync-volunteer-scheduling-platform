const connectDB = require("../backend/src/config/db");
const app = require("../backend/src/app");

module.exports = async (req, res) => {
  try {
    await connectDB();
  } catch (error) {
    return res.status(500).json({ message: "Database connection error", error: error.message });
  }
  return app(req, res);
};
