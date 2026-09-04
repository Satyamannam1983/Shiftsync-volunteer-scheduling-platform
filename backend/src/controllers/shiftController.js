const Shift = require("../models/Shift");
const Program = require("../models/Program");
const Signup = require("../models/Signup");
const { calculateShiftState } = require("../utils/stateUtils");

const createShift = async (req, res) => {
  try {
    const {
      program,
      date,
      startTime,
      durationMinutes,
      location,
      requiredHeadcount,
    } = req.body;

    if (!program || !date || !startTime || !durationMinutes || !location || !requiredHeadcount) {
      return res.status(400).json({
        message: "All shift fields are required",
      });
    }

    if (requiredHeadcount <= 0) {
      return res.status(400).json({
        message: "Required headcount must be greater than 0",
      });
    }

    if (durationMinutes <= 0) {
      return res.status(400).json({
        message: "Duration must be greater than 0",
      });
    }

    const programExists = await Program.findById(program);
    if (!programExists) {
      return res.status(404).json({
        message: "Program not found",
      });
    }

    if (programExists.archived) {
      return res.status(400).json({
        message: "Cannot create shifts for archived programs",
      });
    }

    const shift = await Shift.create({
      program,
      date: new Date(date),
      startTime,
      durationMinutes,
      location: location.trim(),
      requiredHeadcount,
      createdBy: req.user.userId,
    });

    await shift.populate("program", "name");
    await shift.populate("createdBy", "name email");

    res.status(201).json({
      message: "Shift created successfully",
      shift,
    });
  } catch (error) {
    console.error("Create shift error:", error);
    res.status(500).json({
      message: "Server error",
    });
  }
};

const getShiftById = async (req, res) => {
  try {
    const { id } = req.params;

    const shift = await Shift.findById(id)
      .populate("program", "name description archived")
      .populate("createdBy", "name email");

    if (!shift) {
      return res.status(404).json({
        message: "Shift not found",
      });
    }

    // Volunteers can only see shifts in their programs
    if (req.user.role === "volunteer") {
      const ProgramMember = require("../models/ProgramMember");
      const membership = await ProgramMember.findOne({
        program: shift.program._id,
        volunteer: req.user.userId,
      });

      if (!membership) {
        return res.status(403).json({
          message: "You do not have access to this shift",
        });
      }

      // Volunteers cannot see shifts in archived programs
      if (shift.program.archived) {
        return res.status(403).json({
          message: "This program is archived",
        });
      }
    }

    // Get signup count for state calculation
    const signupCount = await Signup.countDocuments({
      shift: id,
      cancelledAt: null,
    });

    const state = calculateShiftState(
      signupCount,
      shift.requiredHeadcount,
      shift.closed
    );

    const shiftData = shift.toObject();
    shiftData.state = state;
    shiftData.currentSignups = signupCount;

    res.status(200).json({
      shift: shiftData,
    });
  } catch (error) {
    console.error("Get shift error:", error);
    res.status(500).json({
      message: "Server error",
    });
  }
};

const updateShift = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      date,
      startTime,
      durationMinutes,
      location,
      requiredHeadcount,
    } = req.body;

    const shift = await Shift.findById(id);

    if (!shift) {
      return res.status(404).json({
        message: "Shift not found",
      });
    }

    if (shift.closed) {
      return res.status(400).json({
        message: "Cannot update closed shifts",
      });
    }

    // Update only provided fields
    if (date) shift.date = new Date(date);
    if (startTime) shift.startTime = startTime;
    if (durationMinutes) shift.durationMinutes = durationMinutes;
    if (location) shift.location = location.trim();
    if (requiredHeadcount) shift.requiredHeadcount = requiredHeadcount;

    await shift.save();

    await shift.populate("program", "name");
    await shift.populate("createdBy", "name email");

    res.status(200).json({
      message: "Shift updated successfully",
      shift,
    });
  } catch (error) {
    console.error("Update shift error:", error);
    res.status(500).json({
      message: "Server error",
    });
  }
};

const deleteShift = async (req, res) => {
  try {
    const { id } = req.params;

    const shift = await Shift.findById(id);

    if (!shift) {
      return res.status(404).json({
        message: "Shift not found",
      });
    }

    // Check if shift has active signups
    const activeSignups = await Signup.countDocuments({
      shift: id,
      cancelledAt: null,
    });

    if (activeSignups > 0) {
      return res.status(400).json({
        message: "Cannot delete shift with active signups",
      });
    }

    await shift.deleteOne();

    res.status(200).json({
      message: "Shift deleted successfully",
    });
  } catch (error) {
    console.error("Delete shift error:", error);
    res.status(500).json({
      message: "Server error",
    });
  }
};

const closeShift = async (req, res) => {
  try {
    const { id } = req.params;

    const shift = await Shift.findById(id);

    if (!shift) {
      return res.status(404).json({
        message: "Shift not found",
      });
    }

    if (shift.closed) {
      return res.status(400).json({
        message: "Shift is already closed",
      });
    }

    shift.closed = true;
    shift.closedAt = new Date();
    await shift.save();

    await shift.populate("program", "name");
    await shift.populate("createdBy", "name email");

    res.status(200).json({
      message: "Shift closed successfully",
      shift,
    });
  } catch (error) {
    console.error("Close shift error:", error);
    res.status(500).json({
      message: "Server error",
    });
  }
};

module.exports = {
  createShift,
  getShiftById,
  updateShift,
  deleteShift,
  closeShift,
};