/**
 * Helper functions for term-specific storage operations
 */

/**
 * Get current term and year from localStorage
 * @returns {Object} Current term and year
 */
export const getCurrentTermInfo = () => {
  const currentTerm = localStorage.getItem('currentTerm') || 'First Term';
  const currentYear = localStorage.getItem('currentAcademicYear') || '2024/2025';
  return { currentTerm, currentYear };
};

/**
 * Generate term-specific storage key
 * @param {string} term - The term (First Term, Second Term, Third Term)
 * @param {string} year - The academic year (e.g., "2024/2025")
 * @param {string} dataType - The type of data (teachers, learners, etc.)
 * @returns {string} The storage key
 */
export const getTermKey = (term, year, dataType) => {
  const termKey = `${year.replace('/', '_')}_${term.replace(' ', '_')}`;
  return `${termKey}_${dataType}`;
};

/**
 * Get current term-specific storage key
 * @param {string} dataType - The type of data (teachers, learners, etc.)
 * @returns {string} The storage key for current term
 */
export const getCurrentTermKey = (dataType) => {
  const { currentTerm, currentYear } = getCurrentTermInfo();
  return getTermKey(currentTerm, currentYear, dataType);
};