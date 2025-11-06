/**
 * API Field Mapping Utilities
 * Handles conversion between database snake_case and frontend camelCase
 */

/**
 * Convert snake_case string to camelCase
 * @param {string} str - Snake case string
 * @returns {string} Camel case string
 */
export const snakeToCamel = (str) => {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
};

/**
 * Convert camelCase string to snake_case
 * @param {string} str - Camel case string
 * @returns {string} Snake case string
 */
export const camelToSnake = (str) => {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
};

/**
 * Convert object keys from snake_case to camelCase
 * @param {Object} obj - Object with snake_case keys
 * @returns {Object} Object with camelCase keys
 */
export const mapObjectToCamelCase = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(mapObjectToCamelCase);

  const camelObj = {};
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = snakeToCamel(key);
    camelObj[camelKey] = typeof value === 'object' && value !== null
      ? mapObjectToCamelCase(value)
      : value;
  }
  return camelObj;
};

/**
 * Convert object keys from camelCase to snake_case
 * @param {Object} obj - Object with camelCase keys
 * @returns {Object} Object with snake_case keys
 */
export const mapObjectToSnakeCase = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(mapObjectToSnakeCase);

  const snakeObj = {};
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = camelToSnake(key);
    snakeObj[snakeKey] = typeof value === 'object' && value !== null
      ? mapObjectToSnakeCase(value)
      : value;
  }
  return snakeObj;
};

/**
 * Map marks data from database to frontend format
 * @param {Object} dbMarks - Marks record from database
 * @returns {Object} Marks object in camelCase format
 */
export const mapMarksFromDb = (dbMarks) => {
  if (!dbMarks) return null;

  return {
    id: dbMarks.id,
    studentId: dbMarks.student_id,
    idNumber: dbMarks.id_number,
    subject: dbMarks.subject,
    className: dbMarks.class_name,
    term: dbMarks.term,
    academicYear: dbMarks.academic_year,
    test1: dbMarks.test1,
    test2: dbMarks.test2,
    test3: dbMarks.test3,
    test4: dbMarks.test4,
    exam: dbMarks.exam,
    total: dbMarks.total || dbMarks.total_score,
    remark: dbMarks.remark || dbMarks.remarks,
    position: dbMarks.position,
    createdAt: dbMarks.created_at,
    updatedAt: dbMarks.updated_at
  };
};

/**
 * Map marks data from frontend to database format
 * @param {Object} marks - Marks object from frontend
 * @returns {Object} Marks object in snake_case format for database
 */
export const mapMarksToDb = (marks) => {
  if (!marks) return null;

  const dbMarks = {};

  if (marks.id !== undefined) dbMarks.id = marks.id;
  if (marks.studentId !== undefined) dbMarks.student_id = marks.studentId;
  if (marks.idNumber !== undefined) dbMarks.id_number = marks.idNumber;
  if (marks.subject !== undefined) dbMarks.subject = marks.subject;
  if (marks.className !== undefined) dbMarks.class_name = marks.className;
  if (marks.term !== undefined) dbMarks.term = marks.term;
  if (marks.academicYear !== undefined) dbMarks.academic_year = marks.academicYear;
  if (marks.test1 !== undefined) dbMarks.test1 = marks.test1;
  if (marks.test2 !== undefined) dbMarks.test2 = marks.test2;
  if (marks.test3 !== undefined) dbMarks.test3 = marks.test3;
  if (marks.test4 !== undefined) dbMarks.test4 = marks.test4;
  if (marks.exam !== undefined) dbMarks.exam = marks.exam;
  if (marks.total !== undefined) dbMarks.total = marks.total;
  if (marks.remark !== undefined) dbMarks.remark = marks.remark;
  if (marks.position !== undefined) dbMarks.position = marks.position;

  return dbMarks;
};

/**
 * Standardized field names for marks table
 */
export const MARKS_FIELDS = {
  ID: 'id',
  STUDENT_ID: 'student_id',
  ID_NUMBER: 'id_number',
  SUBJECT: 'subject',
  CLASS_NAME: 'class_name',
  TERM: 'term',
  ACADEMIC_YEAR: 'academic_year',
  TEST1: 'test1',
  TEST2: 'test2',
  TEST3: 'test3',
  TEST4: 'test4',
  EXAM: 'exam',
  TOTAL: 'total',           // Use 'total' as standard
  REMARK: 'remark',         // Use 'remark' (singular) as standard
  POSITION: 'position',
  CREATED_AT: 'created_at',
  UPDATED_AT: 'updated_at'
};

/**
 * Standardized field names for students table
 */
export const STUDENT_FIELDS = {
  ID: 'id',
  ID_NUMBER: 'id_number',
  FIRST_NAME: 'first_name',
  LAST_NAME: 'last_name',
  CLASS_NAME: 'class_name',
  GENDER: 'gender',
  TERM: 'term',
  ACADEMIC_YEAR: 'academic_year',
  DATE_OF_BIRTH: 'date_of_birth',
  GUARDIAN_NAME: 'guardian_name',
  GUARDIAN_CONTACT: 'guardian_contact',
  CREATED_AT: 'created_at',
  UPDATED_AT: 'updated_at'
};
