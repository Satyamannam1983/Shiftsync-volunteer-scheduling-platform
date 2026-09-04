/**
 * Convert shift date and time to full datetime object
 * @param {Date} date - The shift date
 * @param {string} startTime - The shift start time (HH:MM format)
 * @returns {Date} - Full datetime object
 */
const getShiftDateTime = (date, startTime) => {
  const [hours, minutes] = startTime.split(":").map(Number);
  const shiftDate = new Date(date);
  shiftDate.setHours(hours, minutes, 0, 0);
  return shiftDate;
};

/**
 * Calculate shift end datetime
 * @param {Date} startDateTime - The shift start datetime
 * @param {number} durationMinutes - Duration in minutes
 * @returns {Date} - End datetime
 */
const getShiftEndDateTime = (startDateTime, durationMinutes) => {
  const endDateTime = new Date(startDateTime);
  endDateTime.setMinutes(endDateTime.getMinutes() + durationMinutes);
  return endDateTime;
};

/**
 * Check if two time windows overlap
 * @param {Date} newStart - New shift start time
 * @param {Date} newEnd - New shift end time
 * @param {Date} existingStart - Existing shift start time
 * @param {Date} existingEnd - Existing shift end time
 * @returns {boolean} - True if windows overlap
 */
const doTimeWindowsOverlap = (newStart, newEnd, existingStart, existingEnd) => {
  return newStart < existingEnd && newEnd > existingStart;
};

/**
 * Check if shift has already passed
 * @param {Date} shiftDate - The shift date
 * @param {string} startTime - The shift start time
 * @returns {boolean} - True if shift time has passed
 */
const hasShiftTimePassed = (shiftDate, startTime) => {
  const shiftDateTime = getShiftDateTime(shiftDate, startTime);
  return shiftDateTime < new Date();
};

/**
 * Check if shift is within the next N days
 * @param {Date} shiftDate - The shift date
 * @param {string} startTime - The shift start time
 * @param {number} days - Number of days
 * @returns {boolean} - True if shift is within the next N days
 */
const isShiftWithinDays = (shiftDate, startTime, days) => {
  const shiftDateTime = getShiftDateTime(shiftDate, startTime);
  const now = new Date();
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);
  return shiftDateTime >= now && shiftDateTime <= futureDate;
};

module.exports = {
  getShiftDateTime,
  getShiftEndDateTime,
  doTimeWindowsOverlap,
  hasShiftTimePassed,
  isShiftWithinDays,
};