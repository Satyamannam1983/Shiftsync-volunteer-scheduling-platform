const Program = require("../models/Program");
const ProgramMember = require("../models/ProgramMember");
const User = require("../models/User");
const Signup = require("../models/Signup");
const { generateRecurringShifts } = require("../services/recurringScheduleService");
const { hasShiftTimePassed } = require("../utils/dateUtils");
const { cancelSignup } = require("../services/signupService");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");

const createProgram = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  if (!name) {
    throw new AppError("Program name is required", 400);
  }

  const program = await Program.create({
    name: name.trim(),
    description: description?.trim() || "",
    createdBy: req.user.userId,
  });

  res.status(201).json({ message: "Program created successfully", program });
});

const getPrograms = asyncHandler(async (req, res) => {
  const { archived } = req.query;
  const filter = {};

  if (req.user.role === "volunteer") {
    const memberPrograms = await ProgramMember.find({
      volunteer: req.user.userId,
    }).distinct("program");
    filter._id = { $in: memberPrograms };
    filter.archived = false;
  } else if (archived === "all") {
    // no archived filter
  } else if (archived !== undefined) {
    filter.archived = archived === "true";
  } else {
    filter.archived = false;
  }

  const programs = await Program.find(filter)
    .populate("createdBy", "name email")
    .sort({ createdAt: -1 });

  res.status(200).json({ programs });
});

const getProgramById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const program = await Program.findById(id).populate("createdBy", "name email");
  if (!program) {
    throw new AppError("Program not found", 404);
  }

  if (req.user.role === "volunteer") {
    const membership = await ProgramMember.findOne({
      program: id,
      volunteer: req.user.userId,
    });
    if (!membership || program.archived) {
      throw new AppError("You do not have access to this program", 403);
    }
  }

  res.status(200).json({ program });
});

const updateProgram = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;
  const program = await Program.findById(id);
  if (!program) {
    throw new AppError("Program not found", 404);
  }

  if (name) program.name = name.trim();
  if (description !== undefined) program.description = description.trim();
  await program.save();

  res.status(200).json({ message: "Program updated successfully", program });
});

const archiveProgram = asyncHandler(async (req, res) => {
  const program = await Program.findById(req.params.id);
  if (!program) {
    throw new AppError("Program not found", 404);
  }
  if (program.archived) {
    throw new AppError("Program is already archived", 400);
  }

  program.archived = true;
  await program.save();
  res.status(200).json({ message: "Program archived successfully", program });
});

const restoreProgram = asyncHandler(async (req, res) => {
  const program = await Program.findById(req.params.id);
  if (!program) {
    throw new AppError("Program not found", 404);
  }
  if (!program.archived) {
    throw new AppError("Program is not archived", 400);
  }

  program.archived = false;
  await program.save();
  res.status(200).json({ message: "Program restored successfully", program });
});

const getProgramMembers = asyncHandler(async (req, res) => {
  const { programId } = req.params;
  const program = await Program.findById(programId);
  if (!program) {
    throw new AppError("Program not found", 404);
  }

  if (req.user.role === "volunteer") {
    const membership = await ProgramMember.findOne({
      program: programId,
      volunteer: req.user.userId,
    });
    if (!membership) {
      throw new AppError("You do not have access to this program", 403);
    }
  }

  const members = await ProgramMember.find({ program: programId })
    .populate("volunteer", "name email")
    .populate("addedBy", "name email")
    .sort({ createdAt: -1 });

  res.status(200).json({ members });
});

const addProgramMember = asyncHandler(async (req, res) => {
  const { programId } = req.params;
  const { volunteerId } = req.body;
  if (!volunteerId) {
    throw new AppError("Volunteer ID is required", 400);
  }

  const program = await Program.findById(programId);
  if (!program) {
    throw new AppError("Program not found", 404);
  }

  const volunteer = await User.findById(volunteerId);
  if (!volunteer) {
    throw new AppError("Volunteer not found", 404);
  }
  if (volunteer.role !== "volunteer") {
    throw new AppError("Can only add volunteers to programs", 400);
  }

  try {
    const member = await ProgramMember.create({
      program: programId,
      volunteer: volunteerId,
      addedBy: req.user.userId,
    });
    await member.populate("volunteer", "name email");
    await member.populate("addedBy", "name email");
    res.status(201).json({ message: "Member added successfully", member });
  } catch (error) {
    if (error.code === 11000) {
      throw new AppError("Volunteer is already a member of this program", 409);
    }
    throw error;
  }
});

const removeProgramMember = asyncHandler(async (req, res) => {
  const { programId, volunteerId } = req.params;
  const member = await ProgramMember.findOne({
    program: programId,
    volunteer: volunteerId,
  });
  if (!member) {
    throw new AppError("Membership not found", 404);
  }

  await member.deleteOne();

  const activeSignups = await Signup.find({
    volunteer: volunteerId,
    cancelledAt: null,
  }).populate("shift");

  let cancelledFutureSignups = 0;
  for (const signup of activeSignups) {
    if (!signup.shift || signup.shift.program.toString() !== programId) {
      continue;
    }
    if (!hasShiftTimePassed(signup.shift.date, signup.shift.startTime) && !signup.shift.closed) {
      await cancelSignup(signup._id, req.user.userId, "coordinator");
      cancelledFutureSignups += 1;
    }
  }

  res.status(200).json({
    message: "Member removed successfully",
    cancelledFutureSignups,
    note: "Historical signup records were preserved. Future active signups were cancelled so the volunteer no longer occupies upcoming shifts.",
  });
});

const generateRecurringSchedule = asyncHandler(async (req, res) => {
  const { programId } = req.params;
  const {
    startDate,
    endDate,
    dayOfWeek,
    startTime,
    durationMinutes,
    location,
    requiredHeadcount,
    excludedDates = [],
  } = req.body;

  if (
    !startDate ||
    !endDate ||
    dayOfWeek === undefined ||
    !startTime ||
    !durationMinutes ||
    !location ||
    !requiredHeadcount
  ) {
    throw new AppError("All recurring schedule fields are required", 400);
  }

  const result = await generateRecurringShifts(
    programId,
    startDate,
    endDate,
    Number(dayOfWeek),
    startTime,
    durationMinutes,
    location,
    requiredHeadcount,
    excludedDates,
    req.user.userId
  );

  res.status(200).json({
    message: "Recurring schedule generated successfully",
    ...result,
  });
});

module.exports = {
  createProgram,
  getPrograms,
  getProgramById,
  updateProgram,
  archiveProgram,
  restoreProgram,
  getProgramMembers,
  addProgramMember,
  removeProgramMember,
  generateRecurringSchedule,
};
