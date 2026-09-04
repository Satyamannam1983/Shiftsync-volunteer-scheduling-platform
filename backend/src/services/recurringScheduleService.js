const Shift = require("../models/Shift");
const Program = require("../models/Program");
const AppError = require("../utils/AppError");
const { createHistoryEvent } = require("./historyService");

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
  const parseLocalDate = (value) => {
    const [year, month, day] = String(value).slice(0, 10).split("-").map(Number);
    return new Date(year, month - 1, day);
  };

  const start = parseLocalDate(startDate);
  const end = parseLocalDate(endDate);

  if (end < start) {
    throw new AppError("End date must be on or after start date", 400);
  }

  if (dayOfWeek < 0 || dayOfWeek > 6) {
    throw new AppError("Day of week must be between 0 (Sunday) and 6 (Saturday)", 400);
  }

  if (durationMinutes <= 0) {
    throw new AppError("Duration must be greater than 0", 400);
  }

  if (requiredHeadcount <= 0) {
    throw new AppError("Required headcount must be greater than 0", 400);
  }

  // Check if program exists
  const program = await Program.findById(programId);
  if (!program) {
    throw new AppError("Program not found", 404);
  }

  if (program.archived) {
    throw new AppError("Cannot create shifts for archived programs", 400);
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
    excludedDates.map((date) => formatDateKey(parseLocalDate(date)))
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
      date: parseLocalDate(dateKey),
      startTime,
      durationMinutes,
      location: location.trim(),
      requiredHeadcount,
      createdBy,
    });

    await createHistoryEvent(shift._id, "SHIFT_CREATED", createdBy);

    created.push({
      date: dateKey,
      shiftId: shift._id,
    });
  }

  for (const excludedDate of excludedDates) {
    const date = parseLocalDate(excludedDate);
    if (date >= start && date <= endDateMidnight && date.getDay() === dayOfWeek) {
      const dateKey = formatDateKey(date);
      if (!skipped.some((s) => s.date === dateKey)) {
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