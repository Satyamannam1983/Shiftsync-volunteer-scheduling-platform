const Shift = require("../models/Shift");
const Signup = require("../models/Signup");
const AlertDismissal = require("../models/AlertDismissal");
const { calculateShiftState } = require("../utils/stateUtils");
const { isShiftWithinDays } = require("../utils/dateUtils");
const AppError = require("../utils/AppError");

const getUnderstaffedAlerts = async (coordinatorId) => {
  const now = new Date();
  const threeDaysFromNow = new Date();
  threeDaysFromNow.setDate(now.getDate() + 3);

  const shifts = await Shift.find({
    date: { $gte: now, $lte: threeDaysFromNow },
    closed: false,
  }).populate("program", "name");

  const alerts = [];

  for (const shift of shifts) {
    if (!isShiftWithinDays(shift.date, shift.startTime, 3)) {
      continue;
    }

    const signupCount = await Signup.countDocuments({
      shift: shift._id,
      cancelledAt: null,
    });

    const state = calculateShiftState(signupCount, shift.requiredHeadcount, shift.closed);

    if (state !== "OPEN" && state !== "PARTIALLY_FILLED") {
      continue;
    }

    const dismissal = await AlertDismissal.findOne({
      shift: shift._id,
      coordinator: coordinatorId,
    }).sort({ dismissedAt: -1 });

    const currentCycle = shift.alertCycle || 0;
    const shouldShowAlert = !dismissal || dismissal.stateVersion !== currentCycle;

    if (shouldShowAlert) {
      alerts.push({
        shiftId: shift._id,
        program: shift.program?._id,
        programName: shift.program?.name,
        date: shift.date.toISOString().split("T")[0],
        startTime: shift.startTime,
        location: shift.location,
        currentSignups: signupCount,
        requiredHeadcount: shift.requiredHeadcount,
        state,
      });
    }
  }

  return alerts;
};

const dismissAlert = async (shiftId, coordinatorId) => {
  const shift = await Shift.findById(shiftId);
  if (!shift) {
    throw new AppError("Shift not found", 404);
  }

  const signupCount = await Signup.countDocuments({
    shift: shiftId,
    cancelledAt: null,
  });
  const state = calculateShiftState(signupCount, shift.requiredHeadcount, shift.closed);

  if (shift.closed || (state !== "OPEN" && state !== "PARTIALLY_FILLED")) {
    throw new AppError("Shift is not currently understaffed", 400);
  }

  return AlertDismissal.create({
    shift: shiftId,
    coordinator: coordinatorId,
    dismissedAt: new Date(),
    stateVersion: shift.alertCycle || 0,
  });
};

module.exports = {
  getUnderstaffedAlerts,
  dismissAlert,
};
