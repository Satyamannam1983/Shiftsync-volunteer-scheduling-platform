const mongoose = require("mongoose");

const programMemberSchema = new mongoose.Schema(
  {
    program: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Program",
      required: true,
    },

    volunteer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Unique compound index to prevent duplicate memberships
programMemberSchema.index({ program: 1, volunteer: 1 }, { unique: true });

// Index for faster queries
programMemberSchema.index({ volunteer: 1 });
programMemberSchema.index({ program: 1 });

module.exports = mongoose.model("ProgramMember", programMemberSchema);