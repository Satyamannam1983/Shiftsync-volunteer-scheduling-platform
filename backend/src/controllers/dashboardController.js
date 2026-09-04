const { getDashboardSummary } = require("../services/dashboardService");
const asyncHandler = require("../utils/asyncHandler");

const getDashboard = asyncHandler(async (req, res) => {
  const summary = await getDashboardSummary(req.user.userId, req.user.role);
  res.status(200).json({
    shiftsThisWeek: summary.shiftsThisWeek,
    openShiftsThisWeek: summary.openShiftsThisWeek,
    signupsThisWeek: summary.signupsThisWeek,
    closedShiftsThisWeek: summary.shiftsClosedThisWeek,
    byState: summary.byState,
    byProgram: summary.byProgram,
    signupsPerWeek: summary.signupsPerWeek,
    upcomingShifts: summary.upcomingShifts,
    summary,
  });
});

module.exports = { getDashboard };
