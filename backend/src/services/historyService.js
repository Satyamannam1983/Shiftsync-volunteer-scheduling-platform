const ShiftHistory = require("../models/ShiftHistory");
const AppError = require("../utils/AppError");

const createHistoryEvent = async (shiftId, type, actorId, metadata = {}, session = null) => {
  const doc = {
    shift: shiftId,
    type,
    actor: actorId,
    metadata,
  };

  if (session) {
    const [historyEvent] = await ShiftHistory.create([doc], { session });
    return historyEvent;
  }

  return ShiftHistory.create(doc);
};

const getShiftHistory = async (shiftId) => {
  return ShiftHistory.find({ shift: shiftId })
    .populate("actor", "name email")
    .sort({ createdAt: 1 });
};

const assertHistoryImmutable = () => {
  throw new AppError("Shift history is immutable", 403);
};

module.exports = {
  createHistoryEvent,
  getShiftHistory,
  assertHistoryImmutable,
};
