/**
 * Class Grouping Utilities for Ghana Education System
 *
 * Ghana's basic education is divided into three levels:
 * - KG (Kindergarten): KG1, KG2
 * - Primary School: BS1, BS2, BS3, BS4, BS5, BS6
 * - JHS (Junior High School): BS7, BS8, BS9
 */

export const CLASS_GROUPS = {
  KG: {
    name: 'Kindergarten',
    shortName: 'KG',
    classes: ['KG1', 'KG2'],
    description: 'Early Childhood Education',
    color: '#FFB6C1', // Light pink
    icon: '🎨'
  },
  PRIMARY: {
    name: 'Primary School',
    shortName: 'Primary',
    classes: ['BS1', 'BS2', 'BS3', 'BS4', 'BS5', 'BS6'],
    description: 'Basic School (Lower Primary & Upper Primary)',
    color: '#87CEEB', // Sky blue
    icon: '📚'
  },
  JHS: {
    name: 'Junior High School',
    shortName: 'JHS',
    classes: ['BS7', 'BS8', 'BS9', 'BS10', 'BS11', 'BS12'],
    description: 'Junior Secondary Education',
    color: '#90EE90', // Light green
    icon: '🎓'
  }
};

/**
 * Get the group for a specific class
 * @param {string} className - The class name (e.g., 'KG1', 'BS3', 'BS7')
 * @returns {object|null} The class group object or null if not found
 */
export const getClassGroup = (className) => {
  if (!className) return null;

  for (const [key, group] of Object.entries(CLASS_GROUPS)) {
    if (group.classes.includes(className)) {
      return { ...group, key };
    }
  }
  return null;
};

/**
 * Get the group key for a specific class
 * @param {string} className - The class name
 * @returns {string|null} The group key ('KG', 'PRIMARY', 'JHS') or null
 */
export const getClassGroupKey = (className) => {
  const group = getClassGroup(className);
  return group ? group.key : null;
};

/**
 * Group classes by their educational level
 * @param {Array<string>} classes - Array of class names
 * @returns {object} Classes grouped by KG, PRIMARY, and JHS
 */
export const groupClasses = (classes) => {
  const grouped = {
    KG: [],
    PRIMARY: [],
    JHS: [],
    OTHER: [] // For any custom classes that don't fit the standard groups
  };

  classes.forEach(className => {
    const groupKey = getClassGroupKey(className);
    if (groupKey) {
      grouped[groupKey].push(className);
    } else {
      grouped.OTHER.push(className);
    }
  });

  return grouped;
};

/**
 * Get all classes in a specific group
 * @param {string} groupKey - The group key ('KG', 'PRIMARY', 'JHS')
 * @returns {Array<string>} Array of class names in the group
 */
export const getClassesByGroup = (groupKey) => {
  return CLASS_GROUPS[groupKey]?.classes || [];
};

/**
 * Check if a class belongs to a specific group
 * @param {string} className - The class name
 * @param {string} groupKey - The group key to check against
 * @returns {boolean}
 */
export const isClassInGroup = (className, groupKey) => {
  const group = CLASS_GROUPS[groupKey];
  return group ? group.classes.includes(className) : false;
};

/**
 * Get all available class groups
 * @returns {Array<object>} Array of all class groups with their metadata
 */
export const getAllClassGroups = () => {
  return Object.entries(CLASS_GROUPS).map(([key, group]) => ({
    key,
    ...group
  }));
};

/**
 * Sort classes by their educational level (KG → Primary → JHS)
 * @param {Array<string>} classes - Array of class names to sort
 * @returns {Array<string>} Sorted array of class names
 */
export const sortClassesByLevel = (classes) => {
  const order = ['KG1', 'KG2', 'BS1', 'BS2', 'BS3', 'BS4', 'BS5', 'BS6', 'BS7', 'BS8', 'BS9', 'BS10', 'BS11', 'BS12'];

  return classes.sort((a, b) => {
    const indexA = order.indexOf(a);
    const indexB = order.indexOf(b);

    // If both are in the standard order, sort by their position
    if (indexA !== -1 && indexB !== -1) {
      return indexA - indexB;
    }

    // If only one is in the standard order, it comes first
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;

    // Otherwise, sort alphabetically with numeric awareness
    return a.localeCompare(b, undefined, {numeric: true});
  });
};

/**
 * Get display name for a class group
 * @param {string} groupKey - The group key
 * @returns {string} The display name
 */
export const getGroupDisplayName = (groupKey) => {
  return CLASS_GROUPS[groupKey]?.name || groupKey;
};

/**
 * Get color for a class group (useful for UI)
 * @param {string} groupKey - The group key
 * @returns {string} The color hex code
 */
export const getGroupColor = (groupKey) => {
  return CLASS_GROUPS[groupKey]?.color || '#cccccc';
};

/**
 * Get icon for a class group
 * @param {string} groupKey - The group key
 * @returns {string} The icon emoji
 */
export const getGroupIcon = (groupKey) => {
  return CLASS_GROUPS[groupKey]?.icon || '📖';
};

/**
 * Filter students by class group
 * @param {Array<object>} students - Array of student objects with className property
 * @param {string} groupKey - The group key to filter by
 * @returns {Array<object>} Filtered array of students
 */
export const filterStudentsByGroup = (students, groupKey) => {
  if (!groupKey || groupKey === 'ALL') return students;

  const classesInGroup = getClassesByGroup(groupKey);
  return students.filter(student =>
    classesInGroup.includes(student.className || student.class)
  );
};

/**
 * Get statistics for each class group
 * @param {Array<object>} students - Array of student objects
 * @returns {object} Statistics for each group (count, percentage, etc.)
 */
export const getGroupStatistics = (students) => {
  const stats = {
    KG: { count: 0, students: [] },
    PRIMARY: { count: 0, students: [] },
    JHS: { count: 0, students: [] },
    OTHER: { count: 0, students: [] },
    total: students.length
  };

  students.forEach(student => {
    const className = student.className || student.class;
    const groupKey = getClassGroupKey(className);

    if (groupKey) {
      stats[groupKey].count++;
      stats[groupKey].students.push(student);
    } else {
      stats.OTHER.count++;
      stats.OTHER.students.push(student);
    }
  });

  // Calculate percentages
  Object.keys(stats).forEach(key => {
    if (key !== 'total' && stats.total > 0) {
      stats[key].percentage = ((stats[key].count / stats.total) * 100).toFixed(1);
    }
  });

  return stats;
};

export default {
  CLASS_GROUPS,
  getClassGroup,
  getClassGroupKey,
  groupClasses,
  getClassesByGroup,
  isClassInGroup,
  getAllClassGroups,
  sortClassesByLevel,
  getGroupDisplayName,
  getGroupColor,
  getGroupIcon,
  filterStudentsByGroup,
  getGroupStatistics
};
