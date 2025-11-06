/**
 * Standardized term constants
 * USE THESE EVERYWHERE - Never hardcode term values!
 */

export const TERMS = {
  FIRST: 'First Term',
  SECOND: 'Second Term',
  THIRD: 'Third Term'
};

export const AVAILABLE_TERMS = [
  TERMS.FIRST,
  TERMS.SECOND,
  TERMS.THIRD
];

export const DEFAULT_TERM = TERMS.THIRD;

/**
 * Get term display name (already in correct format)
 */
export const getTermName = (term) => {
  // If term is already in correct format, return it
  if (AVAILABLE_TERMS.includes(term)) {
    return term;
  }

  // Convert old format to new format
  const termMap = {
    'Term 1': TERMS.FIRST,
    'Term 2': TERMS.SECOND,
    'Term 3': TERMS.THIRD
  };

  return termMap[term] || term;
};

/**
 * Validate if term value is correct
 */
export const isValidTerm = (term) => {
  return AVAILABLE_TERMS.includes(term);
};
