const mongoose = require("mongoose");

const alertDismissalSchema = new mongoose.Schema(
  {
    shift: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shift",
      required: true,
    },

    coordinator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    dismissedAt: {
      type: Date,
      required: true,
    },

    stateVersion: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
alertDismissalSchema.index({ shift: 1, coordinator: 1 });
alertDismissalSchema.index({ coordinator: 1 });

module.exports = mongoose.model("AlertDismissal", alertDismissalSchema);