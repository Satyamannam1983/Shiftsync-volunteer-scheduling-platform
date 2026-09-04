const mongoose = require("mongoose");

const shiftSchema = new mongoose.Schema(
  {
    program: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Program",
      required: true,
    },

    date: {
      type: Date,
      required: true,
    },

    startTime: {
      type: String,
      required: true,
    },

    durationMinutes: {
      type: Number,
      required: true,
      min: 1,
    },

    location: {
      type: String,
      required: true,
      trim: true,
    },

    requiredHeadcount: {
      type: Number,
      required: true,
      min: 1,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    closed: {
      type: Boolean,
      default: false,
    },

    closedAt: {
      type: Date,
    },

    alertCycle: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Virtual for endTime
shiftSchema.virtual("endTime").get(function () {
  const [hours, minutes] = this.startTime.split(":").map(Number);
  const endMinutes = hours * 60 + minutes + this.durationMinutes;
  const endHours = Math.floor(endMinutes / 60);
  const endMins = endMinutes % 60;
  return `${String(endHours).padStart(2, "0")}:${String(endMins).padStart(2, "0")}`;
});

// Indexes for faster queries
shiftSchema.index({ program: 1, date: 1 });
shiftSchema.index({ date: 1, startTime: 1 });
shiftSchema.index({ closed: 1 });
shiftSchema.index({ createdBy: 1 });

// Ensure virtuals are included in JSON
shiftSchema.set("toJSON", { virtuals: true });
shiftSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Shift", shiftSchema);