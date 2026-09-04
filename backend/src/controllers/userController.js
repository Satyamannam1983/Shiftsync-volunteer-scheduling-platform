const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");

const listVolunteers = asyncHandler(async (req, res) => {
  const search = req.query.search || "";
  const filter = { role: "volunteer" };

  if (search) {
    filter.$or = [
      { name: new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") },
      { email: new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") },
    ];
  }

  const volunteers = await User.find(filter).select("name email role createdAt").sort({ name: 1 });
  res.status(200).json({ volunteers });
});

module.exports = { listVolunteers };
