const { createSignup, cancelSignup } = require("../services/signupService");
const Signup = require("../models/Signup");
const Shift = require("../models/Shift");
const ProgramMember = require("../models/ProgramMember");
const { calculateShiftState } = require("../utils/stateUtils");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");

const createShiftSignup = asyncHandler(async (req, res) => {
  const { shiftId } = req.params;
  const { volunteerId } = req.body;

  let targetVolunteerId;
  if (req.user.role === "coordinator") {
    if (!volunteerId) {
      throw new AppError("volunteerId is required when a coordinator creates a signup", 400);
    }
    targetVolunteerId = volunteerId;
  } else if (req.user.role === "volunteer") {
    if (volunteerId && volunteerId !== req.user.userId) {
      throw new AppError("You can only sign yourself up", 403);
    }
    targetVolunteerId = req.user.userId;
  } else {
    throw new AppError("Invalid request", 400);
  }

  const result = await createSignup(shiftId, targetVolunteerId, req.user.userId, req.user.role);

  await result.signup.populate("volunteer", "name email");
  await result.signup.populate("shift", "date startTime location");

  res.status(201).json({
    message: "Signup created successfully",
    signup: result.signup,
    stateChange: {
      previous: result.previousState,
      new: result.newState,
    },
  });
});

const cancelShiftSignup = asyncHandler(async (req, res) => {
  const { signupId } = req.params;
  const result = await cancelSignup(signupId, req.user.userId, req.user.role);

  await result.signup.populate("volunteer", "name email");
  await result.signup.populate("shift", "date startTime location");

  res.status(200).json({
    message: "Signup cancelled successfully",
    signup: result.signup,
    stateChange: {
      previous: result.previousState,
      new: result.newState,
    },
  });
});

const getShiftSignups = asyncHandler(async (req, res) => {
  const { shiftId } = req.params;
  const shift = await Shift.findById(shiftId);
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

  const signups = await Signup.find({
    shift: shiftId,
    cancelledAt: null,
  })
    .populate("volunteer", "name email")
    .populate("createdBy", "name email")
    .sort({ createdAt: -1 });

  const signupCount = signups.length;
  const state = calculateShiftState(signupCount, shift.requiredHeadcount, shift.closed);

  res.status(200).json({ signups, currentSignups: signupCount, state });
});

const getMySignups = asyncHandler(async (req, res) => {
  const signups = await Signup.find({
    volunteer: req.user.userId,
    cancelledAt: null,
  })
    .populate({
      path: "shift",
      populate: { path: "program", select: "name archived" },
    })
    .sort({ createdAt: -1 });

  res.status(200).json({ signups });
});

module.exports = {
  createShiftSignup,
  cancelShiftSignup,
  getShiftSignups,
  getMySignups,
};
