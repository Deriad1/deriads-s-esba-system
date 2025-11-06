/**
 * Student ID Helper Utilities
 * Handles conversion between different student ID formats used across the system
 *
 * Standardization:
 * - Database uses: id (numeric primary key), id_number (string like "eSBA001")
 * - Frontend uses: id (numeric), idNumber (string)
 * - API responses should map: id_number -> idNumber, id -> id
 */

/**
 * Check if a value is a numeric student ID (database primary key)
 * @param {*} value - The value to check
 * @returns {boolean} True if the value is a numeric ID
 */
export const isNumericStudentId = (value) => {
  if (typeof value === 'number') return true;
  if (typeof value === 'string') {
    return /^\d+$/.test(value) && !isNaN(parseInt(value));
  }
  return false;
};

/**
 * Check if a value is an ID number format (e.g., "eSBA001")
 * @param {*} value - The value to check
 * @returns {boolean} True if the value is an ID number
 */
export const isIdNumberFormat = (value) => {
  if (typeof value !== 'string') return false;
  // Match patterns like eSBA001, ESBA123, etc.
  return /^[a-zA-Z]+\d+$/.test(value);
};

/**
 * Normalize student ID for API requests
 * Determines whether to use numeric ID or id_number based on the value
 * @param {string|number} studentId - The student identifier
 * @returns {Object} { type: 'id' | 'id_number', value: string|number }
 */
export const normalizeStudentId = (studentId) => {
  if (isNumericStudentId(studentId)) {
    return {
      type: 'id',
      value: typeof studentId === 'string' ? parseInt(studentId) : studentId
    };
  }

  if (isIdNumberFormat(studentId)) {
    return {
      type: 'id_number',
      value: studentId
    };
  }

  // Default to treating as id_number
  return {
    type: 'id_number',
    value: String(studentId)
  };
};

/**
 * Map database student record to frontend format
 * Converts snake_case to camelCase
 * @param {Object} dbStudent - Student record from database
 * @returns {Object} Student object in camelCase format
 */
export const mapStudentFromDb = (dbStudent) => {
  if (!dbStudent) return null;

  return {
    id: dbStudent.id,
    idNumber: dbStudent.id_number,
    firstName: dbStudent.first_name,
    lastName: dbStudent.last_name,
    className: dbStudent.class_name,
    gender: dbStudent.gender,
    term: dbStudent.term,
    academicYear: dbStudent.academic_year,
    createdAt: dbStudent.created_at,
    updatedAt: dbStudent.updated_at,
    // Include any additional fields
    ...(dbStudent.date_of_birth && { dateOfBirth: dbStudent.date_of_birth }),
    ...(dbStudent.guardian_name && { guardianName: dbStudent.guardian_name }),
    ...(dbStudent.guardian_contact && { guardianContact: dbStudent.guardian_contact })
  };
};

/**
 * Map frontend student data to database format
 * Converts camelCase to snake_case
 * @param {Object} student - Student object from frontend
 * @returns {Object} Student object in snake_case format for database
 */
export const mapStudentToDb = (student) => {
  if (!student) return null;

  const dbStudent = {};

  if (student.id !== undefined) dbStudent.id = student.id;
  if (student.idNumber !== undefined) dbStudent.id_number = student.idNumber;
  if (student.firstName !== undefined) dbStudent.first_name = student.firstName;
  if (student.lastName !== undefined) dbStudent.last_name = student.lastName;
  if (student.className !== undefined) dbStudent.class_name = student.className;
  if (student.gender !== undefined) dbStudent.gender = student.gender;
  if (student.term !== undefined) dbStudent.term = student.term;
  if (student.academicYear !== undefined) dbStudent.academic_year = student.academicYear;
  if (student.dateOfBirth !== undefined) dbStudent.date_of_birth = student.dateOfBirth;
  if (student.guardianName !== undefined) dbStudent.guardian_name = student.guardianName;
  if (student.guardianContact !== undefined) dbStudent.guardian_contact = student.guardianContact;

  return dbStudent;
};

/**
 * Get student display name
 * @param {Object} student - Student object (can be camelCase or snake_case)
 * @returns {string} Full name of the student
 */
export const getStudentDisplayName = (student) => {
  if (!student) return 'Unknown Student';

  const firstName = student.firstName || student.first_name || '';
  const lastName = student.lastName || student.last_name || '';

  return `${firstName} ${lastName}`.trim() || 'Unknown Student';
};

/**
 * Get student identifier for display
 * @param {Object} student - Student object (can be camelCase or snake_case)
 * @returns {string} ID number for display
 */
export const getStudentIdForDisplay = (student) => {
  if (!student) return '';
  return student.idNumber || student.id_number || String(student.id || '');
};
