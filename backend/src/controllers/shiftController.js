const Shift = require("../models/Shift");
const Program = require("../models/Program");
const ProgramMember = require("../models/ProgramMember");
const Signup = require("../models/Signup");
const { calculateShiftState } = require("../utils/stateUtils");
const { createHistoryEvent, getShiftHistory: getShiftHistoryService } = require("../services/historyService");
const { listShifts, closeShift: closeShiftService, addShiftNote } = require("../services/shiftService");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");

const createShift = asyncHandler(async (req, res) => {
  const { program, date, startTime, durationMinutes, location, requiredHeadcount } = req.body;

  if (!program || !date || !startTime || !durationMinutes || !location || !requiredHeadcount) {
    throw new AppError("All shift fields are required", 400);
  }

  if (Number(requiredHeadcount) <= 0) {
    throw new AppError("Required headcount must be greater than 0", 400);
  }

  if (Number(durationMinutes) <= 0) {
    throw new AppError("Duration must be greater than 0", 400);
  }

  if (!/^\d{2}:\d{2}$/.test(startTime)) {
    throw new AppError("Start time must be in HH:MM format", 400);
  }

  const programExists = await Program.findById(program);
  if (!programExists) {
    throw new AppError("Program not found", 404);
  }

  if (programExists.archived) {
    throw new AppError("Cannot create shifts for archived programs", 400);
  }

  const shift = await Shift.create({
    program,
    date: new Date(date),
    startTime,
    durationMinutes,
    location: location.trim(),
    requiredHeadcount,
    createdBy: req.user.userId,
  });

  await createHistoryEvent(shift._id, "SHIFT_CREATED", req.user.userId);
  await shift.populate("program", "name");
  await shift.populate("createdBy", "name email");

  res.status(201).json({
    message: "Shift created successfully",
    shift,
  });
});

const getShifts = asyncHandler(async (req, res) => {
  const result = await listShifts({ user: req.user, query: req.query });
  res.status(200).json(result);
});

const getShiftById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const shift = await Shift.findById(id)
    .populate("program", "name description archived")
    .populate("createdBy", "name email");

  if (!shift) {
    throw new AppError("Shift not found", 404);
  }

  if (req.user.role === "volunteer") {
    const membership = await ProgramMember.findOne({
      program: shift.program._id,
      volunteer: req.user.userId,
    });

    if (!membership || shift.program.archived) {
      throw new AppError("You do not have access to this shift", 403);
    }
  }

  const signupCount = await Signup.countDocuments({
    shift: id,
    cancelledAt: null,
  });

  const shiftData = shift.toObject();
  shiftData.state = calculateShiftState(signupCount, shift.requiredHeadcount, shift.closed);
  shiftData.currentSignups = signupCount;

  res.status(200).json({ shift: shiftData });
});

const updateShift = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { date, startTime, durationMinutes, location, requiredHeadcount } = req.body;

  const shift = await Shift.findById(id);
  if (!shift) {
    throw new AppError("Shift not found", 404);
  }

  if (shift.closed) {
    throw new AppError("Cannot update closed shifts", 400);
  }

  if (date) shift.date = new Date(date);
  if (startTime) {
    if (!/^\d{2}:\d{2}$/.test(startTime)) {
      throw new AppError("Start time must be in HH:MM format", 400);
    }
    shift.startTime = startTime;
  }
  if (durationMinutes) {
    if (Number(durationMinutes) <= 0) {
      throw new AppError("Duration must be greater than 0", 400);
    }
    shift.durationMinutes = durationMinutes;
  }
  if (location) shift.location = location.trim();
  if (requiredHeadcount) {
    if (Number(requiredHeadcount) <= 0) {
      throw new AppError("Required headcount must be greater than 0", 400);
    }
    shift.requiredHeadcount = requiredHeadcount;
  }

  await shift.save();
  await shift.populate("program", "name");
  await shift.populate("createdBy", "name email");

  res.status(200).json({
    message: "Shift updated successfully",
    shift,
  });
});

const deleteShift = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const shift = await Shift.findById(id);
  if (!shift) {
    throw new AppError("Shift not found", 404);
  }

  const activeSignups = await Signup.countDocuments({
    shift: id,
    cancelledAt: null,
  });

  if (activeSignups > 0) {
    throw new AppError("Cannot delete shift with active signups", 400);
  }

  await shift.deleteOne();
  res.status(200).json({ message: "Shift deleted successfully" });
});

const closeShift = asyncHandler(async (req, res) => {
  const shift = await closeShiftService(req.params.id, req.user.userId);
  await shift.populate("program", "name");
  await shift.populate("createdBy", "name email");

  res.status(200).json({
    message: "Shift closed successfully",
    shift,
  });
});

const getShiftHistoryController = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const shift = await Shift.findById(id);
  if (!shift) {
    throw new AppError("Shift not found", 404);
  }

  if (req.user.role === "volunteer") {
    const membership = await ProgramMember.findOne({
      program: shift.program,
      volunteer: req.user.userId,
    });
    if (!membership) {
      throw new AppError("You do not have access to this shift", 403);
    }
  }

  const history = await getShiftHistoryService(id);
  res.status(200).json({ history });
});

const addNote = asyncHandler(async (req, res) => {
  const result = await addShiftNote(req.params.id, req.user.userId, req.body.note);
  res.status(201).json(result);
});

module.exports = {
  createShift,
  getShifts,
  getShiftById,
  updateShift,
  deleteShift,
  closeShift,
  getShiftHistory: getShiftHistoryController,
  addNote,
};
