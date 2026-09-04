const Shift = require("../models/Shift");
const Signup = require("../models/Signup");
const Program = require("../models/Program");
const { calculateShiftState } = require("../utils/stateUtils");

/**
 * Get dashboard summary metrics
 */
const getDashboardSummary = async (userId, userRole) => {
  // Calculate week start and end
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
  weekStart.setHours(0, 0, 0, 0);
  
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  // Build base filter based on role
  let programFilter = {};
  if (userRole === "volunteer") {
    const ProgramMember = require("../models/ProgramMember");
    const memberPrograms = await ProgramMember.find({
      volunteer: userId,
    }).distinct("program");
    
    programFilter._id = { $in: memberPrograms };
  }

  // Get shifts this week
  const shiftsThisWeek = await Shift.countDocuments({
    ...programFilter,
    date: { $gte: weekStart, $lte: weekEnd },
  });

  // Get all shifts this week with state calculation
  const shiftsThisWeekData = await Shift.find({
    ...programFilter,
    date: { $gte: weekStart, $lte: weekEnd },
  });

  let openShiftsThisWeek = 0;
  const byState = { OPEN: 0, PARTIALLY_FILLED: 0, FILLED: 0, CLOSED: 0 };

  for (const shift of shiftsThisWeekData) {
    const signupCount = await Signup.countDocuments({
      shift: shift._id,
      cancelledAt: null,
    });

    const state = calculateShiftState(
      signupCount,
      shift.requiredHeadcount,
      shift.closed
    );

    byState[state] = (byState[state] || 0) + 1;

    if (state === "OPEN" || state === "PARTIALLY_FILLED") {
      openShiftsThisWeek++;
    }
  }

  // Get signups this week
  const signupsThisWeek = await Signup.countDocuments({
    createdAt: { $gte: weekStart, $lte: weekEnd },
    cancelledAt: null,
  });

  // Get shifts closed this week
  const shiftsClosedThisWeek = await Shift.countDocuments({
    ...programFilter,
    closedAt: { $gte: weekStart, $lte: weekEnd },
  });

  // Get shifts by program
  const byProgram = await Shift.aggregate([
    {
      $match: programFilter,
    },
    {
      $group: {
        _id: "$program",
        count: { $sum: 1 },
      },
    },
    {
      $lookup: {
        from: "programs",
        localField: "_id",
        foreignField: "_id",
        as: "program",
      },
    },
    {
      $unwind: "$program",
    },
    {
      $project: {
        programName: "$program.name",
        count: 1,
      },
    },
    {
      $sort: { count: -1 },
    },
  ]);

  // Get signups per week for last 8 weeks
  const signupsPerWeek = [];
  for (let i = 7; i >= 0; i--) {
    const currentWeekStart = new Date(now);
    currentWeekStart.setDate(now.getDate() - now.getDay() - (i * 7));
    currentWeekStart.setHours(0, 0, 0, 0);
    
    const currentWeekEnd = new Date(currentWeekStart);
    currentWeekEnd.setDate(currentWeekStart.getDate() + 6);
    currentWeekEnd.setHours(23, 59, 59, 999);

    const weekSignups = await Signup.countDocuments({
      createdAt: { $gte: currentWeekStart, $lte: currentWeekEnd },
      cancelledAt: null,
    });

    const weekLabel = i === 0 ? "This Week" : `${i} week${i > 1 ? 's' : ''} ago`;

    signupsPerWeek.push({
      week: weekLabel,
      count: weekSignups,
      startDate: currentWeekStart.toISOString().split("T")[0],
      endDate: currentWeekEnd.toISOString().split("T")[0],
    });
  }

  return {
    shiftsThisWeek,
    openShiftsThisWeek,
    signupsThisWeek,
    shiftsClosedThisWeek,
    byState,
    byProgram,
    signupsPerWeek,
  };
};

module.exports = {
  getDashboardSummary,
};