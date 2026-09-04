const Program = require("../models/Program");
const ProgramMember = require("../models/ProgramMember");
const Shift = require("../models/Shift");
const Signup = require("../models/Signup");
const { arrayToCSV } = require("../utils/csvUtils");

/**
 * Export program roster as CSV
 */
const exportProgramRoster = async (req, res) => {
  try {
    const { programId } = req.params;

    // Check if program exists
    const program = await Program.findById(programId);
    if (!program) {
      return res.status(404).json({
        message: "Program not found",
      });
    }

    // Get all shifts for this program
    const shifts = await Shift.find({ program: programId });

    if (shifts.length === 0) {
      return res.status(400).json({
        message: "No shifts found for this program",
      });
    }

    // Get all members of this program
    const members = await ProgramMember.find({ program: programId })
      .populate("volunteer", "name email");

    if (members.length === 0) {
      return res.status(400).json({
        message: "No members found for this program",
      });
    }

    // Calculate total hours for each volunteer
    const rosterData = [];

    for (const member of members) {
      const volunteerId = member.volunteer._id;

      // Get all valid signups for this volunteer in this program
      const signups = await Signup.find({
        volunteer: volunteerId,
        cancelledAt: null,
      }).populate("shift");

      // Filter signups for this program and calculate hours
      let totalHours = 0;

      for (const signup of signups) {
        if (signup.shift.program.toString() === programId) {
          const shift = signup.shift;
          // Calculate hours from duration
          totalHours += shift.durationMinutes / 60;
        }
      }

      rosterData.push({
        volunteer: member.volunteer.name,
        email: member.volunteer.email,
        totalHours: totalHours.toFixed(2),
      });
    }

    // Sort by total hours (descending)
    rosterData.sort((a, b) => parseFloat(b.totalHours) - parseFloat(a.totalHours));

    // Convert to CSV
    const headers = ["Volunteer", "Email", "Total Hours"];
    const csv = arrayToCSV(rosterData, headers);

    // Set response headers for CSV download
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${program.name.replace(/[^a-z0-9]/gi, "_")}_roster.csv"`
    );

    res.status(200).send(csv);
  } catch (error) {
    console.error("Export roster error:", error);
    res.status(500).json({
      message: "Server error",
    });
  }
};

module.exports = {
  exportProgramRoster,
};