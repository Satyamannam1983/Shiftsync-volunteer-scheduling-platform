const mongoose = require("mongoose");
const Shift = require("../models/Shift");
const Program = require("../models/Program");
const ProgramMember = require("../models/ProgramMember");
const Signup = require("../models/Signup");
const AppError = require("../utils/AppError");
const { calculateShiftState } = require("../utils/stateUtils");
const { hasShiftTimePassed } = require("../utils/dateUtils");
const { createHistoryEvent } = require("./historyService");

const STATE_SORT_ORDER = {
  OPEN: 1,
  PARTIALLY_FILLED: 2,
  FILLED: 3,
  CLOSED: 4,
};

const volunteerProgramIds = async (userId) => {
  const memberPrograms = await ProgramMember.find({ volunteer: userId }).distinct("program");
  return Program.find({ _id: { $in: memberPrograms }, archived: false }).distinct("_id");
};

const listShifts = async ({ user, query }) => {
  const {
    search,
    programId,
    state,
    dateFrom,
    dateTo,
    sortBy = "date",
    sortOrder = "asc",
    page = 1,
    limit = 10,
  } = query;

  const match = {};

  if (user.role === "volunteer") {
    const programs = await volunteerProgramIds(user.userId);
    match.program = { $in: programs };
  }

  if (programId) {
    if (match.program && match.program.$in) {
      const allowed = match.program.$in.map((id) => id.toString());
      if (!allowed.includes(programId)) {
        match.program = { $in: [] };
      } else {
        match.program = new mongoose.Types.ObjectId(programId);
      }
    } else {
      match.program = new mongoose.Types.ObjectId(programId);
    }
  }

  if (dateFrom || dateTo) {
    match.date = {};
    if (dateFrom) match.date.$gte = new Date(dateFrom);
    if (dateTo) {
      const end = new Date(dateTo);
      end.setHours(23, 59, 59, 999);
      match.date.$lte = end;
    }
  }

  if (search) {
    const searchRegex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    const matchingPrograms = await Program.find({ name: searchRegex }).distinct("_id");
    match.$or = [{ program: { $in: matchingPrograms } }, { location: searchRegex }];
  }

  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);
  const skip = (pageNum - 1) * limitNum;
  const direction = sortOrder === "desc" ? -1 : 1;

  let sortStage = { date: direction, startTime: 1 };
  if (sortBy === "startTime") {
    sortStage = { startTime: direction, date: 1 };
  } else if (sortBy === "date") {
    sortStage = { date: direction, startTime: 1 };
  } else if (sortBy === "state" || sortBy === "fill state") {
    sortStage = { stateRank: direction, date: 1 };
  }

  const pipeline = [
    { $match: match },
    {
      $lookup: {
        from: "signups",
        let: { shiftId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$shift", "$$shiftId"] },
                  { $eq: [{ $ifNull: ["$cancelledAt", null] }, null] },
                ],
              },
            },
          },
        ],
        as: "activeSignups",
      },
    },
    {
      $addFields: {
        currentSignups: { $size: "$activeSignups" },
        state: {
          $cond: [
            "$closed",
            "CLOSED",
            {
              $cond: [
                { $eq: [{ $size: "$activeSignups" }, 0] },
                "OPEN",
                {
                  $cond: [
                    { $lt: [{ $size: "$activeSignups" }, "$requiredHeadcount"] },
                    "PARTIALLY_FILLED",
                    "FILLED",
                  ],
                },
              ],
            },
          ],
        },
      },
    },
    {
      $addFields: {
        stateRank: {
          $switch: {
            branches: [
              { case: { $eq: ["$state", "OPEN"] }, then: STATE_SORT_ORDER.OPEN },
              { case: { $eq: ["$state", "PARTIALLY_FILLED"] }, then: STATE_SORT_ORDER.PARTIALLY_FILLED },
              { case: { $eq: ["$state", "FILLED"] }, then: STATE_SORT_ORDER.FILLED },
              { case: { $eq: ["$state", "CLOSED"] }, then: STATE_SORT_ORDER.CLOSED },
            ],
            default: 99,
          },
        },
      },
    },
  ];

  if (state) {
    pipeline.push({ $match: { state } });
  }

  pipeline.push({
    $facet: {
      items: [
        { $sort: sortStage },
        { $skip: skip },
        { $limit: limitNum },
        {
          $lookup: {
            from: "programs",
            localField: "program",
            foreignField: "_id",
            as: "program",
          },
        },
        { $unwind: "$program" },
        {
          $lookup: {
            from: "users",
            localField: "createdBy",
            foreignField: "_id",
            as: "createdBy",
          },
        },
        { $unwind: { path: "$createdBy", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            activeSignups: 0,
            stateRank: 0,
            "createdBy.passwordHash": 0,
          },
        },
      ],
      total: [{ $count: "count" }],
    },
  });

  const [result] = await Shift.aggregate(pipeline);
  const items = result.items || [];
  const total = result.total[0]?.count || 0;

  return {
    items,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum) || 0,
    },
  };
};

const closeShift = async (shiftId, actorId) => {
  const shift = await Shift.findById(shiftId);
  if (!shift) {
    throw new AppError("Shift not found", 404);
  }

  if (shift.closed) {
    throw new AppError("Shift is already closed", 400);
  }

  if (!hasShiftTimePassed(shift.date, shift.startTime)) {
    throw new AppError("A shift can only be closed after its scheduled start time", 400);
  }

  const signupCount = await Signup.countDocuments({ shift: shiftId, cancelledAt: null });
  const oldState = calculateShiftState(signupCount, shift.requiredHeadcount, false);

  shift.closed = true;
  shift.closedAt = new Date();
  await shift.save();

  await createHistoryEvent(shift._id, "STATE_CHANGED", actorId, {
    oldState,
    newState: "CLOSED",
  });
  await createHistoryEvent(shift._id, "SHIFT_CLOSED", actorId, {
    oldState,
    newState: "CLOSED",
  });

  return shift;
};

const addShiftNote = async (shiftId, actorId, note) => {
  const shift = await Shift.findById(shiftId);
  if (!shift) {
    throw new AppError("Shift not found", 404);
  }

  if (!note || !note.trim()) {
    throw new AppError("Note text is required", 400);
  }

  await createHistoryEvent(shift._id, "NOTE_ADDED", actorId, {
    note: note.trim(),
  });

  return { message: "Note added" };
};

module.exports = {
  listShifts,
  closeShift,
  addShiftNote,
  volunteerProgramIds,
};
