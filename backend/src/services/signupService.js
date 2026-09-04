const Shift = require("../models/Shift");
const Signup = require("../models/Signup");
const ProgramMember = require("../models/ProgramMember");
const { calculateShiftState } = require("../utils/stateUtils");
const {
  getShiftDateTime,
  getShiftEndDateTime,
  doTimeWindowsOverlap,
  hasShiftTimePassed,
} = require("../utils/dateUtils");

/**
 * Create a signup for a shift
 */
const createSignup = async (shiftId, volunteerId, actorId, actorRole) => {
  // 1. Check if shift exists
  const shift = await Shift.findById(shiftId);
  if (!shift) {
    throw new Error("Shift not found");
  }

  // 2. Check if shift is closed
  if (shift.closed) {
    throw new Error("Cannot sign up for closed shifts");
  }

  // 3. Check if shift time has passed
  if (hasShiftTimePassed(shift.date, shift.startTime)) {
    throw new Error("Cannot sign up for shifts that have already occurred");
  }

  // 4. Check if volunteer exists
  const User = require("../models/User");
  const volunteer = await User.findById(volunteerId);
  if (!volunteer) {
    throw new Error("Volunteer not found");
  }

  // 5. Check if volunteer belongs to the program
  const membership = await ProgramMember.findOne({
    program: shift.program,
    volunteer: volunteerId,
  });

  if (!membership) {
    throw new Error("Volunteer does not belong to this program");
  }

  // 6. Check if volunteer already has an active signup for this shift
  const existingSignup = await Signup.findOne({
    shift: shiftId,
    volunteer: volunteerId,
    cancelledAt: null,
  });

  if (existingSignup) {
    throw new Error("Volunteer already has an active signup for this shift");
  }

  // 7. Check current signup count and shift state
  const currentSignups = await Signup.countDocuments({
    shift: shiftId,
    cancelledAt: null,
  });

  const currentState = calculateShiftState(currentSignups, shift.requiredHeadcount, shift.closed);

  if (currentState === "FILLED") {
    throw new Error("Shift is already filled");
  }

  // 8. Check for overlapping shifts
  const shiftStart = getShiftDateTime(shift.date, shift.startTime);
  const shiftEnd = getShiftEndDateTime(shiftStart, shift.durationMinutes);

  const activeSignups = await Signup.find({
    volunteer: volunteerId,
    cancelledAt: null,
  }).populate("shift");

  for (const signup of activeSignups) {
    const existingShift = signup.shift;
    const existingStart = getShiftDateTime(existingShift.date, existingShift.startTime);
    const existingEnd = getShiftEndDateTime(existingStart, existingShift.durationMinutes);

    if (doTimeWindowsOverlap(shiftStart, shiftEnd, existingStart, existingEnd)) {
      throw new Error("Volunteer already has a signup for an overlapping shift");
    }
  }

  // 9. Create the signup
  const signup = await Signup.create({
    shift: shiftId,
    volunteer: volunteerId,
    createdBy: actorId,
  });

  // 10. Recalculate state
  const newSignups = currentSignups + 1;
  const newState = calculateShiftState(newSignups, shift.requiredHeadcount, shift.closed);

  return {
    signup,
    previousState: currentState,
    newState,
  };
};

/**
 * Cancel a signup
 */
const cancelSignup = async (signupId, actorId, actorRole) => {
  // 1. Check if signup exists
  const signup = await Signup.findById(signupId);
  if (!signup) {
    throw new Error("Signup not found");
  }

  // 2. Check if already cancelled
  if (signup.cancelledAt) {
    throw new Error("Signup is already cancelled");
  }

  // 3. Get shift details
  const shift = await Shift.findById(signup.shift);
  if (!shift) {
    throw new Error("Shift not found");
  }

  // 4. Check if shift is closed
  if (shift.closed) {
    throw new Error("Cannot cancel signup for closed shifts");
  }

  // 5. Check if shift time has passed
  if (hasShiftTimePassed(shift.date, shift.startTime)) {
    throw new Error("Cannot cancel signup for shifts that have already occurred");
  }

  // 6. Get current signup count before cancellation
  const currentSignups = await Signup.countDocuments({
    shift: shift._id,
    cancelledAt: null,
  });

  const currentState = calculateShiftState(currentSignups, shift.requiredHeadcount, shift.closed);

  // 7. Cancel the signup
  signup.cancelledAt = new Date();
  await signup.save();

  // 8. Recalculate state
  const newSignups = currentSignups - 1;
  const newState = calculateShiftState(newSignups, shift.requiredHeadcount, shift.closed);

  return {
    signup,
    previousState: currentState,
    newState,
  };
};

module.exports = {
  createSignup,
  cancelSignup,
};