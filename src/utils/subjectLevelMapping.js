// Subject Level Mapping Utility
// Defines which subjects are available for each teaching level

export const TEACHING_LEVELS = {
  KG: 'KG',
  LOWER_PRIMARY: 'Lower Primary',
  UPPER_PRIMARY: 'Upper Primary',
  PRIMARY: 'Primary', // Keep for backwards compatibility
  JHS: 'JHS',
  ALL_LEVELS: 'All Levels' // For teachers who teach across all grade levels
};

// Subjects specific to each level based on Ghana Education System
export const LEVEL_SPECIFIC_SUBJECTS = {
  [TEACHING_LEVELS.KG]: [
    'Literacy',
    'Numeracy',
    'Our World and Our People',
    'Creative Arts',
    'Physical Education'
  ],
  [TEACHING_LEVELS.LOWER_PRIMARY]: [
    'English Language',
    'Mathematics',
    'Science',
    'History',
    'Our World Our People',
    'Creative Arts',
    'Religious and Moral Education (R.M.E.)',
    'Ghanaian Language',
    'Physical Education'
  ],
  [TEACHING_LEVELS.UPPER_PRIMARY]: [
    'English Language',
    'Mathematics',
    'Integrated Science',
    'Social Studies',
    'History',
    'Our World Our People',
    'Creative Arts',
    'Religious and Moral Education (R.M.E.)',
    'Ghanaian Language',
    'French',
    'Computing',
    'Physical Education'
  ],
  [TEACHING_LEVELS.PRIMARY]: [ // Keep for backwards compatibility - combines Lower and Upper Primary
    'English Language',
    'Mathematics',
    'Science',
    'Integrated Science',
    'History',
    'Social Studies',
    'Our World Our People',
    'Creative Arts',
    'Physical Education',
    'Religious and Moral Education (R.M.E.)',
    'Ghanaian Language',
    'Computing',
    'French'
  ],
  [TEACHING_LEVELS.JHS]: [
    'English Language',
    'Mathematics',
    'Integrated Science',
    'Social Studies',
    'Ghanaian Language and Culture',
    'French',
    'Computing',
    'Religious and Moral Education (R.M.E.)',
    'Basic Design and Technology (B.D.T.)',
    'Physical Education'
  ]
};

// Subjects that appear across multiple levels (empty for Ghana system as subjects are level-specific)
// Keeping this for code compatibility but subjects are now organized by level
export const CROSS_LEVEL_SUBJECTS = [];

/**
 * Get all subjects available for a specific teaching level
 * @param {string} level - Teaching level (KG, Lower Primary, Upper Primary, Primary, JHS, All Levels)
 * @returns {Array<string>} - Array of subject names available for this level
 */
export const getSubjectsForLevel = (level) => {
  if (!level) return [];

  // If teacher teaches all levels, return all subjects from all levels
  if (level === TEACHING_LEVELS.ALL_LEVELS || level === 'All Levels') {
    const allSubjects = new Set();
    Object.values(LEVEL_SPECIFIC_SUBJECTS).forEach(subjects => {
      subjects.forEach(subject => allSubjects.add(subject));
    });
    return Array.from(allSubjects).sort();
  }

  // Handle string values FIRST before constant lookup
  if (level === 'Lower Primary') return LEVEL_SPECIFIC_SUBJECTS[TEACHING_LEVELS.LOWER_PRIMARY] || [];
  if (level === 'Upper Primary') return LEVEL_SPECIFIC_SUBJECTS[TEACHING_LEVELS.UPPER_PRIMARY] || [];

  // Then try constant-based lookup
  const levelSpecific = LEVEL_SPECIFIC_SUBJECTS[level] || [];
  return levelSpecific.sort();
};

/**
 * Check if a subject is available for a specific level
 * @param {string} subject - Subject name
 * @param {string} level - Teaching level
 * @returns {boolean} - Whether the subject is available for this level
 */
export const isSubjectAvailableForLevel = (subject, level) => {
  if (!level) return true; // No level restriction

  const availableSubjects = getSubjectsForLevel(level);
  return availableSubjects.includes(subject);
};

/**
 * Get the level categorization for a subject
 * @param {string} subject - Subject name
 * @returns {string} - 'KG', 'Lower Primary', 'Upper Primary', 'Primary', 'JHS', or 'Unknown'
 */
export const getSubjectCategory = (subject) => {
  // Check which level(s) this subject belongs to
  const levels = [];

  for (const [level, subjects] of Object.entries(LEVEL_SPECIFIC_SUBJECTS)) {
    if (subjects.includes(subject)) {
      levels.push(level);
    }
  }

  // If subject appears in multiple levels, it's multi-level
  if (levels.length > 1) {
    return 'Multi-Level';
  }

  // Return the single level it belongs to
  if (levels.length === 1) {
    return levels[0];
  }

  return 'Unknown';
};

/**
 * Filter subjects based on teaching level
 * @param {Array<string>} subjects - All subjects
 * @param {string} level - Teaching level to filter by
 * @returns {Array<string>} - Filtered subjects
 */
export const filterSubjectsByLevel = (subjects, level) => {
  if (!level) return subjects;

  return subjects.filter(subject => isSubjectAvailableForLevel(subject, level));
};

/**
 * Get classes available for a specific teaching level
 * @param {string} level - Teaching level (KG, Lower Primary, Upper Primary, Primary, JHS, All Levels)
 * @returns {Array<string>} - Array of class names available for this level
 */
export const getClassesForLevel = (level) => {
  if (!level) return []; // No level specified, return empty

  // If teacher teaches all levels, return all classes
  if (level === TEACHING_LEVELS.ALL_LEVELS || level === 'All Levels') {
    return ['KG1', 'KG2', 'BS1', 'BS2', 'BS3', 'BS4', 'BS5', 'BS6', 'BS7', 'BS8', 'BS9'];
  }

  // Return classes for specific level
  const classMap = {
    [TEACHING_LEVELS.KG]: ['KG1', 'KG2'],
    [TEACHING_LEVELS.LOWER_PRIMARY]: ['BS1', 'BS2', 'BS3'],
    [TEACHING_LEVELS.UPPER_PRIMARY]: ['BS4', 'BS5', 'BS6'],
    [TEACHING_LEVELS.PRIMARY]: ['BS1', 'BS2', 'BS3', 'BS4', 'BS5', 'BS6'], // Keep for backwards compatibility
    [TEACHING_LEVELS.JHS]: ['BS7', 'BS8', 'BS9']
  };

  // Also handle string values directly
  if (level === 'Lower Primary') return ['BS1', 'BS2', 'BS3'];
  if (level === 'Upper Primary') return ['BS4', 'BS5', 'BS6'];

  return classMap[level] || [];
};
