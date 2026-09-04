const mongoose = require("mongoose");

const Shift = require("../models/Shift");
const Signup = require("../models/Signup");
const ProgramMember = require("../models/ProgramMember");
const User = require("../models/User");
const AppError = require("../utils/AppError");
const { calculateShiftState } = require("../utils/stateUtils");
const {
  getShiftDateTime,
  getShiftEndDateTime,
  doTimeWindowsOverlap,
  hasShiftTimePassed,
} = require("../utils/dateUtils");
const { createHistoryEvent } = require("./historyService");

const canUseTransactions = () => {
  const type = mongoose.connection?.client?.topology?.description?.type;
  return ["ReplicaSetWithPrimary", "ReplicaSetNoPrimary", "Sharded", "LoadBalanced"].includes(
    type
  );
};

const runInTransaction = async (work) => {
  if (!canUseTransactions()) {
    return work(null);
  }

  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      result = await work(session);
    });
    return result;
  } finally {
    await session.endSession();
  }
};

const assertVolunteerCanSignup = (actorRole, actorId, volunteerId) => {
  if (actorRole === "volunteer" && actorId !== volunteerId.toString()) {
    throw new AppError("You can only sign yourself up", 403);
  }
};

const createSignup = async (shiftId, volunteerId, actorId, actorRole) => {
  assertVolunteerCanSignup(actorRole, actorId, volunteerId);

  return runInTransaction(async (session) => {
    const query = session ? { session } : {};

    const shift = await Shift.findById(shiftId).session(session || null);
    if (!shift) {
      throw new AppError("Shift not found", 404);
    }

    if (shift.closed) {
      throw new AppError("Shift is closed.", 400);
    }

    if (hasShiftTimePassed(shift.date, shift.startTime)) {
      throw new AppError("Cannot sign up for shifts that have already occurred", 400);
    }

    const volunteer = await User.findById(volunteerId).session(session || null);
    if (!volunteer) {
      throw new AppError("Volunteer not found", 404);
    }

    const membership = await ProgramMember.findOne({
      program: shift.program,
      volunteer: volunteerId,
    }).session(session || null);

    if (!membership) {
      throw new AppError("Volunteer does not belong to this program.", 400);
    }

    const existingSignup = await Signup.findOne({
      shift: shiftId,
      volunteer: volunteerId,
      cancelledAt: null,
    }).session(session || null);

    if (existingSignup) {
      throw new AppError("Volunteer already has an active signup for this shift", 409);
    }

    const currentSignups = await Signup.countDocuments(
      { shift: shiftId, cancelledAt: null },
      query
    );

    const currentState = calculateShiftState(
      currentSignups,
      shift.requiredHeadcount,
      shift.closed
    );

    if (currentState === "FILLED") {
      throw new AppError("Shift is already filled.", 400);
    }

    const shiftStart = getShiftDateTime(shift.date, shift.startTime);
    const shiftEnd = getShiftEndDateTime(shiftStart, shift.durationMinutes);

    const activeSignups = await Signup.find({
      volunteer: volunteerId,
      cancelledAt: null,
    })
      .session(session || null)
      .populate("shift");

    for (const signup of activeSignups) {
      const existingShift = signup.shift;
      if (!existingShift) continue;

      const existingStart = getShiftDateTime(existingShift.date, existingShift.startTime);
      const existingEnd = getShiftEndDateTime(existingStart, existingShift.durationMinutes);

      if (doTimeWindowsOverlap(shiftStart, shiftEnd, existingStart, existingEnd)) {
        throw new AppError("You already have a signup for an overlapping shift.", 409);
      }
    }

    const [createdSignup] = session
      ? await Signup.create(
          [
            {
              shift: shiftId,
              volunteer: volunteerId,
              createdBy: actorId,
            },
          ],
          { session }
        )
      : [await Signup.create({
          shift: shiftId,
          volunteer: volunteerId,
          createdBy: actorId,
        })];

    const signup = createdSignup;

    const newSignups = currentSignups + 1;
    const newState = calculateShiftState(newSignups, shift.requiredHeadcount, shift.closed);

    await createHistoryEvent(
      shiftId,
      "SIGNUP_CREATED",
      actorId,
      { volunteer: volunteerId, action: "signup" },
      session
    );

    if (newState !== currentState) {
      await createHistoryEvent(
        shiftId,
        "STATE_CHANGED",
        actorId,
        { oldState: currentState, newState },
        session
      );
    }

    return {
      signup,
      previousState: currentState,
      newState,
    };
  });
};

const cancelSignup = async (signupId, actorId, actorRole) => {
  return runInTransaction(async (session) => {
    const signup = await Signup.findById(signupId).session(session || null);
    if (!signup) {
      throw new AppError("Signup not found", 404);
    }

    if (signup.cancelledAt) {
      throw new AppError("Signup is already cancelled", 400);
    }

    if (actorRole === "volunteer" && signup.volunteer.toString() !== actorId) {
      throw new AppError("You can only cancel your own signups", 403);
    }

    const shift = await Shift.findById(signup.shift).session(session || null);
    if (!shift) {
      throw new AppError("Shift not found", 404);
    }

    if (shift.closed) {
      throw new AppError("Cannot cancel a signup on a closed shift.", 400);
    }

    if (hasShiftTimePassed(shift.date, shift.startTime)) {
      throw new AppError("Cannot cancel signup for shifts that have already occurred", 400);
    }

    const currentSignups = await Signup.countDocuments(
      { shift: shift._id, cancelledAt: null },
      session ? { session } : {}
    );
    const currentState = calculateShiftState(
      currentSignups,
      shift.requiredHeadcount,
      shift.closed
    );

    signup.cancelledAt = new Date();
    await signup.save(session ? { session } : {});

    const newSignups = currentSignups - 1;
    const newState = calculateShiftState(newSignups, shift.requiredHeadcount, shift.closed);

    await createHistoryEvent(
      shift._id,
      "SIGNUP_CANCELLED",
      actorId,
      { volunteer: signup.volunteer, action: "cancel" },
      session
    );

    if (newState !== currentState) {
      await createHistoryEvent(
        shift._id,
        "STATE_CHANGED",
        actorId,
        { oldState: currentState, newState },
        session
      );

      if (
        currentState === "FILLED" &&
        (newState === "OPEN" || newState === "PARTIALLY_FILLED")
      ) {
        shift.alertCycle = (shift.alertCycle || 0) + 1;
        await shift.save(session ? { session } : {});
      }
    }

    return {
      signup,
      previousState: currentState,
      newState,
    };
  });
};

module.exports = {
  createSignup,
  cancelSignup,
  canUseTransactions,
};
