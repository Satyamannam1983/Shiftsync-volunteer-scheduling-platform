const { getUnderstaffedAlerts, dismissAlert } = require("../services/alertService");
const asyncHandler = require("../utils/asyncHandler");

const getAlerts = asyncHandler(async (req, res) => {
  const alerts = await getUnderstaffedAlerts(req.user.userId);
  res.status(200).json({ alerts, count: alerts.length });
});

const dismissAlertController = asyncHandler(async (req, res) => {
  const dismissal = await dismissAlert(req.params.shiftId, req.user.userId);
  res.status(200).json({
    message: "Alert dismissed successfully",
    dismissal,
  });
});

module.exports = {
  getAlerts,
  dismissAlert: dismissAlertController,
};
