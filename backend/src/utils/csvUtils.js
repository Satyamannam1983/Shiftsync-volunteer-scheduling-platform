/**
 * Escape CSV field value
 * @param {string} value - The value to escape
 * @returns {string} - Escaped value
 */
const escapeCSV = (value) => {
  if (value === null || value === undefined) {
    return "";
  }

  const stringValue = String(value);
  
  // If value contains comma, quote, or newline, wrap in quotes and escape quotes
  if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  
  return stringValue;
};

/**
 * Convert array of objects to CSV string
 * @param {Array} data - Array of objects
 * @param {Array} headers - Array of header strings
 * @returns {string} - CSV string
 */
const arrayToCSV = (data, headers) => {
  if (!data || data.length === 0) {
    return headers.join(",");
  }

  // Create header row
  const headerRow = headers.map(escapeCSV).join(",");

  // Create data rows
  const dataRows = data.map((row) => {
    return headers
      .map((header) => {
        const value = row[header];
        return escapeCSV(value);
      })
      .join(",");
  });

  return [headerRow, ...dataRows].join("\n");
};

module.exports = {
  escapeCSV,
  arrayToCSV,
};