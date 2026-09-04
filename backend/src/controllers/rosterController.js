const Program = require("../models/Program");
const ProgramMember = require("../models/ProgramMember");
const Shift = require("../models/Shift");
const Signup = require("../models/Signup");
const { arrayToCSV } = require("../utils/csvUtils");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");

const exportProgramRoster = asyncHandler(async (req, res) => {
  const { programId } = req.params;
  const program = await Program.findById(programId);
  if (!program) {
    throw new AppError("Program not found", 404);
  }

  const members = await ProgramMember.find({ program: programId }).populate(
    "volunteer",
    "name email"
  );
  const programShifts = await Shift.find({ program: programId }).distinct("_id");

  const hoursByVolunteer = new Map();

  const validSignups = await Signup.find({
    shift: { $in: programShifts },
    cancelledAt: null,
  }).populate("shift").populate("volunteer", "name email");

  for (const signup of validSignups) {
    if (!signup.shift || !signup.volunteer) continue;
    const id = signup.volunteer._id.toString();
    const current = hoursByVolunteer.get(id) || {
      volunteer: signup.volunteer.name,
      email: signup.volunteer.email,
      totalHours: 0,
    };
    current.totalHours += signup.shift.durationMinutes / 60;
    hoursByVolunteer.set(id, current);
  }

  for (const member of members) {
    if (!member.volunteer) continue;
    const id = member.volunteer._id.toString();
    if (!hoursByVolunteer.has(id)) {
      hoursByVolunteer.set(id, {
        volunteer: member.volunteer.name,
        email: member.volunteer.email,
        totalHours: 0,
      });
    }
  }

  const rosterData = Array.from(hoursByVolunteer.values())
    .map((row) => ({
      Volunteer: row.volunteer,
      Email: row.email,
      "Total Hours": Number(row.totalHours.toFixed(2)),
    }))
    .sort((a, b) => b["Total Hours"] - a["Total Hours"]);

  const csv = arrayToCSV(rosterData, ["Volunteer", "Email", "Total Hours"]);
  const filename = `${program.name.replace(/[^a-z0-9]/gi, "_")}_roster.csv`;

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.status(200).send(csv);
});

module.exports = { exportProgramRoster };
