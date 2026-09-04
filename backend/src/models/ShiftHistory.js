const mongoose = require("mongoose");

const shiftHistorySchema = new mongoose.Schema(
  {
    shift: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shift",
      required: true,
    },

    type: {
      type: String,
      required: true,
      enum: [
        "SHIFT_CREATED",
        "STATE_CHANGED",
        "SIGNUP_CREATED",
        "SIGNUP_CANCELLED",
        "NOTE_ADDED",
        "SHIFT_CLOSED",
      ],
    },

    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
shiftHistorySchema.index({ shift: 1, createdAt: -1 });
shiftHistorySchema.index({ actor: 1 });
shiftHistorySchema.index({ type: 1 });

module.exports = mongoose.model("ShiftHistory", shiftHistorySchema);