const Shift = require("../models/Shift");
const Program = require("../models/Program");

/**
 * Generate recurring shifts for a program
 */
const generateRecurringShifts = async (
  programId,
  startDate,
  endDate,
  dayOfWeek,
  startTime,
  durationMinutes,
  location,
  requiredHeadcount,
  excludedDates = [],
  createdBy
) => {
  // Validation
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (end < start) {
    throw new Error("End date must be after start date");
  }

  if (dayOfWeek < 0 || dayOfWeek > 6) {
    throw new Error("Day of week must be between 0 (Sunday) and 6 (Saturday)");
  }

  if (durationMinutes <= 0) {
    throw new Error("Duration must be greater than 0");
  }

  if (requiredHeadcount <= 0) {
    throw new Error("Required headcount must be greater than 0");
  }

  // Check if program exists
  const program = await Program.findById(programId);
  if (!program) {
    throw new Error("Program not found");
  }

  if (program.archived) {
    throw new Error("Cannot create shifts for archived programs");
  }

  // Helper function to format date as YYYY-MM-DD
  const formatDateKey = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Parse excluded dates
  const excludedDateSet = new Set(
    excludedDates.map((date) => formatDateKey(date))
  );

  // Find all matching dates
  const matchingDates = [];
  const currentDate = new Date(start);
  currentDate.setHours(0, 0, 0, 0);
  
  const endDateMidnight = new Date(end);
  endDateMidnight.setHours(23, 59, 59, 999);

  while (currentDate <= endDateMidnight) {
    if (currentDate.getDay() === dayOfWeek) {
      const dateKey = formatDateKey(currentDate);
      if (!excludedDateSet.has(dateKey)) {
        matchingDates.push(new Date(currentDate));
      }
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Process each date
  const created = [];
  const skipped = [];

  for (const date of matchingDates) {
    const dateKey = formatDateKey(date);

    // Check if shift already exists at this date/time for this program
    const existingShift = await Shift.findOne({
      program: programId,
      date: {
        $gte: new Date(new Date(date).setHours(0, 0, 0, 0)),
        $lt: new Date(new Date(date).setHours(23, 59, 59, 999)),
      },
      startTime,
    });

    if (existingShift) {
      skipped.push({
        date: dateKey,
        reason: "existing shift",
      });
      continue;
    }

    // Create the shift
    const shift = await Shift.create({
      program: programId,
      date: new Date(dateKey),
      startTime,
      durationMinutes,
      location: location.trim(),
      requiredHeadcount,
      createdBy,
    });

    created.push({
      date: dateKey,
      shiftId: shift._id,
    });
  }

  // Also add excluded dates to skipped list
  for (const excludedDate of excludedDates) {
    const date = new Date(excludedDate);
    date.setHours(0, 0, 0, 0);
    
    if (date >= start && date <= endDateMidnight && date.getDay() === dayOfWeek) {
      const dateKey = formatDateKey(date);
      // Avoid duplicates in skipped list
      if (!skipped.some(s => s.date === dateKey)) {
        skipped.push({
          date: dateKey,
          reason: "holiday",
        });
      }
    }
  }

  return {
    created,
    skipped,
  };
};

module.exports = {
  generateRecurringShifts,
};