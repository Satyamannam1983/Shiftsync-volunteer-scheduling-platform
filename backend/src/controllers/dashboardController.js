const { getDashboardSummary } = require("../services/dashboardService");

const getDashboard = async (req, res) => {
  try {
    const summary = await getDashboardSummary(req.user.userId, req.user.role);

    res.status(200).json({
      summary,
    });
  } catch (error) {
    console.error("Get dashboard error:", error);
    res.status(500).json({
      message: "Server error",
    });
  }
};

module.exports = {
  getDashboard,
};