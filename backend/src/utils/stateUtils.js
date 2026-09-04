/**
 * Calculate shift state based on signup count and required headcount
 * @param {number} signupCount - Current number of active signups
 * @param {number} requiredHeadcount - Required headcount for the shift
 * @param {boolean} closed - Whether the shift is closed
 * @returns {string} - The calculated state (OPEN, PARTIALLY_FILLED, FILLED, CLOSED)
 */
const calculateShiftState = (signupCount, requiredHeadcount, closed = false) => {
  if (closed) {
    return "CLOSED";
  }

  if (signupCount === 0) {
    return "OPEN";
  }

  if (signupCount < requiredHeadcount) {
    return "PARTIALLY_FILLED";
  }

  return "FILLED";
};

module.exports = {
  calculateShiftState,
};