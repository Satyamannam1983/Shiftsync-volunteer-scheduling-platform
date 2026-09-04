const mongoose = require("mongoose");

const signupSchema = new mongoose.Schema(
  {
    shift: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shift",
      required: true,
    },

    volunteer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    cancelledAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Unique compound index to prevent duplicate active signups for the same volunteer/shift
signupSchema.index({ shift: 1, volunteer: 1, cancelledAt: 1 }, {
  unique: true,
  partialFilterExpression: { cancelledAt: null },
});

// Indexes for faster queries
signupSchema.index({ volunteer: 1, cancelledAt: 1 });
signupSchema.index({ shift: 1, cancelledAt: 1 });

module.exports = mongoose.model("Signup", signupSchema);