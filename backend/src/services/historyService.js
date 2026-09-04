const ShiftHistory = require("../models/ShiftHistory");

/**
 * Create a shift history event
 */
const createHistoryEvent = async (shiftId, type, actorId, metadata = {}) => {
  try {
    const historyEvent = await ShiftHistory.create({
      shift: shiftId,
      type,
      actor: actorId,
      metadata,
    });

    return historyEvent;
  } catch (error) {
    console.error("Error creating history event:", error);
    // Don't throw error - history events should not break main operations
    return null;
  }
};

/**
 * Get shift history
 */
const getShiftHistory = async (shiftId) => {
  try {
    const history = await ShiftHistory.find({ shift: shiftId })
      .populate("actor", "name email")
      .sort({ createdAt: -1 });

    return history;
  } catch (error) {
    console.error("Error getting shift history:", error);
    throw error;
  }
};

module.exports = {
  createHistoryEvent,
  getShiftHistory,
};