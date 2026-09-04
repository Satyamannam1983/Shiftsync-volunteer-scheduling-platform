const Shift = require("../models/Shift");
const Signup = require("../models/Signup");
const ProgramMember = require("../models/ProgramMember");
const { calculateShiftState } = require("../utils/stateUtils");
const { volunteerProgramIds } = require("./shiftService");

const startOfWeek = (date) => {
  const weekStart = new Date(date);
  const day = weekStart.getUTCDay();
  weekStart.setUTCDate(weekStart.getUTCDate() - day);
  weekStart.setUTCHours(0, 0, 0, 0);
  return weekStart;
};

const endOfWeek = (weekStart) => {
  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(weekStart.getUTCDate() + 6);
  weekEnd.setUTCHours(23, 59, 59, 999);
  return weekEnd;
};

const getDashboardSummary = async (userId, userRole) => {
  const now = new Date();
  const weekStart = startOfWeek(now);
  const weekEnd = endOfWeek(weekStart);

  let programIds = null;
  if (userRole === "volunteer") {
    programIds = await volunteerProgramIds(userId);
  }

  const programMatch = programIds ? { program: { $in: programIds } } : {};

  const shiftsThisWeekData = await Shift.find({
    ...programMatch,
    date: { $gte: weekStart, $lte: weekEnd },
  });

  const byState = { OPEN: 0, PARTIALLY_FILLED: 0, FILLED: 0, CLOSED: 0 };
  let openShiftsThisWeek = 0;

  for (const shift of shiftsThisWeekData) {
    const signupCount = await Signup.countDocuments({
      shift: shift._id,
      cancelledAt: null,
    });
    const state = calculateShiftState(signupCount, shift.requiredHeadcount, shift.closed);
    byState[state] += 1;
    if (state === "OPEN" || state === "PARTIALLY_FILLED") {
      openShiftsThisWeek += 1;
    }
  }

  const signupMatch = {
    createdAt: { $gte: weekStart, $lte: weekEnd },
    cancelledAt: null,
  };

  if (programIds) {
    const volunteerShifts = await Shift.find({ program: { $in: programIds } }).distinct("_id");
    signupMatch.shift = { $in: volunteerShifts };
  }

  const signupsThisWeek = await Signup.countDocuments(signupMatch);

  const shiftsClosedThisWeek = await Shift.countDocuments({
    ...programMatch,
    closedAt: { $gte: weekStart, $lte: weekEnd },
  });

  const byProgram = await Shift.aggregate([
    { $match: programMatch },
    { $group: { _id: "$program", count: { $sum: 1 } } },
    {
      $lookup: {
        from: "programs",
        localField: "_id",
        foreignField: "_id",
        as: "program",
      },
    },
    { $unwind: "$program" },
    { $project: { programName: "$program.name", count: 1 } },
    { $sort: { count: -1 } },
  ]);

  const signupsPerWeek = [];
  for (let i = 7; i >= 0; i -= 1) {
    const currentWeekStart = new Date(weekStart);
    currentWeekStart.setUTCDate(weekStart.getUTCDate() - i * 7);
    const currentWeekEnd = endOfWeek(currentWeekStart);

    const weekSignupMatch = {
      createdAt: { $gte: currentWeekStart, $lte: currentWeekEnd },
      cancelledAt: null,
    };
    if (signupMatch.shift) {
      weekSignupMatch.shift = signupMatch.shift;
    }

    const weekSignups = await Signup.countDocuments(weekSignupMatch);

    signupsPerWeek.push({
      week: i === 0 ? "This Week" : `${i} week${i > 1 ? "s" : ""} ago`,
      count: weekSignups,
      startDate: currentWeekStart.toISOString().split("T")[0],
      endDate: currentWeekEnd.toISOString().split("T")[0],
    });
  }

  const upcoming = await Shift.find({
    ...programMatch,
    date: { $gte: now },
    closed: false,
  })
    .sort({ date: 1, startTime: 1 })
    .limit(5)
    .populate("program", "name");

  const upcomingShifts = await Promise.all(
    upcoming.map(async (shift) => {
      const signupCount = await Signup.countDocuments({
        shift: shift._id,
        cancelledAt: null,
      });
      return {
        ...shift.toObject(),
        currentSignups: signupCount,
        state: calculateShiftState(signupCount, shift.requiredHeadcount, shift.closed),
      };
    })
  );

  return {
    shiftsThisWeek: shiftsThisWeekData.length,
    openShiftsThisWeek,
    signupsThisWeek,
    shiftsClosedThisWeek,
    byState,
    byProgram,
    signupsPerWeek,
    upcomingShifts,
  };
};

module.exports = {
  getDashboardSummary,
};
