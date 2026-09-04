const { createSignup, cancelSignup } = require("../services/signupService");
const Signup = require("../models/Signup");
const Shift = require("../models/Shift");
const { calculateShiftState } = require("../utils/stateUtils");

const createShiftSignup = async (req, res) => {
  try {
    const { shiftId } = req.params;
    const { volunteerId } = req.body;

    // Determine volunteer ID based on role
    let targetVolunteerId;
    if (req.user.role === "coordinator" && volunteerId) {
      targetVolunteerId = volunteerId;
    } else if (req.user.role === "volunteer") {
      targetVolunteerId = req.user.userId;
    } else {
      return res.status(400).json({
        message: "Invalid request",
      });
    }

    // Create signup using service
    const result = await createSignup(
      shiftId,
      targetVolunteerId,
      req.user.userId,
      req.user.role
    );

    await result.signup.populate("volunteer", "name email");
    await result.signup.populate("shift", "date startTime location");

    res.status(201).json({
      message: "Signup created successfully",
      signup: result.signup,
      stateChange: {
        previous: result.previousState,
        new: result.newState,
      },
    });
  } catch (error) {
    console.error("Create signup error:", error);

    // Handle specific error messages
    if (error.message.includes("not found")) {
      return res.status(404).json({
        message: error.message,
      });
    }

    if (error.message.includes("already") || error.message.includes("overlap")) {
      return res.status(409).json({
        message: error.message,
      });
    }

    if (error.message.includes("filled") || error.message.includes("closed") || error.message.includes("already occurred")) {
      return res.status(400).json({
        message: error.message,
      });
    }

    res.status(500).json({
      message: "Server error",
    });
  }
};

const cancelShiftSignup = async (req, res) => {
  try {
    const { shiftId, signupId } = req.params;

    // Get signup to check ownership
    const signup = await Signup.findById(signupId);
    if (!signup) {
      return res.status(404).json({
        message: "Signup not found",
      });
    }

    // Check authorization
    if (req.user.role === "volunteer" && signup.volunteer.toString() !== req.user.userId) {
      return res.status(403).json({
        message: "You can only cancel your own signups",
      });
    }

    // Cancel signup using service
    const result = await cancelSignup(signupId, req.user.userId, req.user.role);

    await result.signup.populate("volunteer", "name email");
    await result.signup.populate("shift", "date startTime location");

    res.status(200).json({
      message: "Signup cancelled successfully",
      signup: result.signup,
      stateChange: {
        previous: result.previousState,
        new: result.newState,
      },
    });
  } catch (error) {
    console.error("Cancel signup error:", error);

    // Handle specific error messages
    if (error.message.includes("not found")) {
      return res.status(404).json({
        message: error.message,
      });
    }

    if (error.message.includes("already cancelled")) {
      return res.status(400).json({
        message: error.message,
      });
    }

    if (error.message.includes("closed") || error.message.includes("already occurred")) {
      return res.status(400).json({
        message: error.message,
      });
    }

    res.status(500).json({
      message: "Server error",
    });
  }
};

const getShiftSignups = async (req, res) => {
  try {
    const { shiftId } = req.params;

    const shift = await Shift.findById(shiftId);
    if (!shift) {
      return res.status(404).json({
        message: "Shift not found",
      });
    }

    // Volunteers can only see signups for shifts in their programs
    if (req.user.role === "volunteer") {
      const ProgramMember = require("../models/ProgramMember");
      const membership = await ProgramMember.findOne({
        program: shift.program,
        volunteer: req.user.userId,
      });

      if (!membership) {
        return res.status(403).json({
          message: "You do not have access to this shift",
        });
      }
    }

    const signups = await Signup.find({
      shift: shiftId,
      cancelledAt: null,
    })
      .populate("volunteer", "name email")
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      signups,
    });
  } catch (error) {
    console.error("Get shift signups error:", error);
    res.status(500).json({
      message: "Server error",
    });
  }
};

module.exports = {
  createShiftSignup,
  cancelShiftSignup,
  getShiftSignups,
};