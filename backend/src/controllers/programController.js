const Program = require("../models/Program");
const ProgramMember = require("../models/ProgramMember");
const User = require("../models/User");
const { generateRecurringShifts } = require("../services/recurringScheduleService");

const createProgram = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({
        message: "Program name is required",
      });
    }

    const program = await Program.create({
      name: name.trim(),
      description: description?.trim() || "",
      createdBy: req.user.userId,
    });

    res.status(201).json({
      message: "Program created successfully",
      program,
    });
  } catch (error) {
    console.error("Create program error:", error);
    res.status(500).json({
      message: "Server error",
    });
  }
};

const getPrograms = async (req, res) => {
  try {
    const { archived } = req.query;

    const filter = {};
    
    // Volunteers can only see active programs they belong to
    if (req.user.role === "volunteer") {
      const memberPrograms = await ProgramMember.find({
        volunteer: req.user.userId,
      }).distinct("program");
      
      filter._id = { $in: memberPrograms };
      filter.archived = false;
    } else {
      // Coordinators can see all programs, optionally filtered by archived status
      if (archived !== undefined) {
        filter.archived = archived === "true";
      }
    }

    const programs = await Program.find(filter)
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      programs,
    });
  } catch (error) {
    console.error("Get programs error:", error);
    res.status(500).json({
      message: "Server error",
    });
  }
};

const getProgramById = async (req, res) => {
  try {
    const { id } = req.params;

    const program = await Program.findById(id).populate(
      "createdBy",
      "name email"
    );

    if (!program) {
      return res.status(404).json({
        message: "Program not found",
      });
    }

    // Volunteers can only view programs they belong to
    if (req.user.role === "volunteer") {
      const membership = await ProgramMember.findOne({
        program: id,
        volunteer: req.user.userId,
      });

      if (!membership) {
        return res.status(403).json({
          message: "You do not have access to this program",
        });
      }

      // Volunteers cannot see archived programs
      if (program.archived) {
        return res.status(403).json({
          message: "This program is archived",
        });
      }
    }

    res.status(200).json({
      program,
    });
  } catch (error) {
    console.error("Get program error:", error);
    res.status(500).json({
      message: "Server error",
    });
  }
};

const updateProgram = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const program = await Program.findById(id);

    if (!program) {
      return res.status(404).json({
        message: "Program not found",
      });
    }

    // Only allow updating name and description
    if (name) program.name = name.trim();
    if (description !== undefined) program.description = description.trim();

    await program.save();

    res.status(200).json({
      message: "Program updated successfully",
      program,
    });
  } catch (error) {
    console.error("Update program error:", error);
    res.status(500).json({
      message: "Server error",
    });
  }
};

const archiveProgram = async (req, res) => {
  try {
    const { id } = req.params;

    const program = await Program.findById(id);

    if (!program) {
      return res.status(404).json({
        message: "Program not found",
      });
    }

    if (program.archived) {
      return res.status(400).json({
        message: "Program is already archived",
      });
    }

    program.archived = true;
    await program.save();

    res.status(200).json({
      message: "Program archived successfully",
      program,
    });
  } catch (error) {
    console.error("Archive program error:", error);
    res.status(500).json({
      message: "Server error",
    });
  }
};

const restoreProgram = async (req, res) => {
  try {
    const { id } = req.params;

    const program = await Program.findById(id);

    if (!program) {
      return res.status(404).json({
        message: "Program not found",
      });
    }

    if (!program.archived) {
      return res.status(400).json({
        message: "Program is not archived",
      });
    }

    program.archived = false;
    await program.save();

    res.status(200).json({
      message: "Program restored successfully",
      program,
    });
  } catch (error) {
    console.error("Restore program error:", error);
    res.status(500).json({
      message: "Server error",
    });
  }
};

const getProgramMembers = async (req, res) => {
  try {
    const { programId } = req.params;

    const program = await Program.findById(programId);

    if (!program) {
      return res.status(404).json({
        message: "Program not found",
      });
    }

    const members = await ProgramMember.find({ program: programId })
      .populate("volunteer", "name email")
      .populate("addedBy", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      members,
    });
  } catch (error) {
    console.error("Get program members error:", error);
    res.status(500).json({
      message: "Server error",
    });
  }
};

const addProgramMember = async (req, res) => {
  try {
    const { programId } = req.params;
    const { volunteerId } = req.body;

    if (!volunteerId) {
      return res.status(400).json({
        message: "Volunteer ID is required",
      });
    }

    const program = await Program.findById(programId);

    if (!program) {
      return res.status(404).json({
        message: "Program not found",
      });
    }

    const volunteer = await User.findById(volunteerId);

    if (!volunteer) {
      return res.status(404).json({
        message: "Volunteer not found",
      });
    }

    if (volunteer.role !== "volunteer") {
      return res.status(400).json({
        message: "Can only add volunteers to programs",
      });
    }

    const member = await ProgramMember.create({
      program: programId,
      volunteer: volunteerId,
      addedBy: req.user.userId,
    });

    await member.populate("volunteer", "name email");
    await member.populate("addedBy", "name email");

    res.status(201).json({
      message: "Member added successfully",
      member,
    });
  } catch (error) {
    console.error("Add program member error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        message: "Volunteer is already a member of this program",
      });
    }

    res.status(500).json({
      message: "Server error",
    });
  }
};

const removeProgramMember = async (req, res) => {
  try {
    const { programId, volunteerId } = req.params;

    const member = await ProgramMember.findOne({
      program: programId,
      volunteer: volunteerId,
    });

    if (!member) {
      return res.status(404).json({
        message: "Membership not found",
      });
    }

    await member.deleteOne();

    res.status(200).json({
      message: "Member removed successfully",
    });
  } catch (error) {
    console.error("Remove program member error:", error);
    res.status(500).json({
      message: "Server error",
    });
  }
};

const generateRecurringSchedule = async (req, res) => {
  try {
    const { programId } = req.params;
    const {
      startDate,
      endDate,
      dayOfWeek,
      startTime,
      durationMinutes,
      location,
      requiredHeadcount,
      excludedDates = [],
    } = req.body;

    if (!startDate || !endDate || !dayOfWeek || !startTime || !durationMinutes || !location || !requiredHeadcount) {
      return res.status(400).json({
        message: "All recurring schedule fields are required",
      });
    }

    const result = await generateRecurringShifts(
      programId,
      startDate,
      endDate,
      dayOfWeek,
      startTime,
      durationMinutes,
      location,
      requiredHeadcount,
      excludedDates,
      req.user.userId
    );

    res.status(200).json({
      message: "Recurring schedule generated successfully",
      ...result,
    });
  } catch (error) {
    console.error("Generate recurring schedule error:", error);

    if (error.message.includes("not found")) {
      return res.status(404).json({
        message: error.message,
      });
    }

    if (error.message.includes("archived") || error.message.includes("must be")) {
      return res.status(400).json({
        message: error.message,
      });
    }

    res.status(500).json({
      message: "Server error",
    });
  }
};

module.exports = {
  createProgram,
  getPrograms,
  getProgramById,
  updateProgram,
  archiveProgram,
  restoreProgram,
  getProgramMembers,
  addProgramMember,
  removeProgramMember,
  generateRecurringSchedule,
};