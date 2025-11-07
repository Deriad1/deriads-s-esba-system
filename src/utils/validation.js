/**
 * Data validation utilities for all user inputs
 * Provides type checking, range validation, and format validation
 *
 * This module follows best practices:
 * - Named exports for tree-shaking optimization
 * - Constants for magic values (maintainability)
 * - Consistent validation result format: { isValid, errors }
 * - Reusable primitive validators composed into object validators
 */

// ============================================================================
// CONSTANTS - Magic Values Extracted for Consistency and Maintainability
// ============================================================================

/**
 * Allowed gender values across the application
 * Export this constant to ensure consistency wherever gender is used
 */
export const ALLOWED_GENDERS = ['male', 'female', 'other'];

/**
 * Allowed teacher roles in the system
 * Export this constant to ensure role validation is consistent
 */
export const ALLOWED_TEACHER_ROLES = [
  'teacher',
  'head_teacher',
  'class_teacher',
  'subject_teacher',
  'form_master',
  'admin'
];

/**
 * Validation constraints for various fields
 * Centralize all numeric constraints here for easy updates
 */
export const VALIDATION_CONSTRAINTS = {
  // Score constraints
  MAX_TEST_SCORE: 15,
  MAX_EXAM_SCORE: 100,
  MIN_SCORE: 0,

  // String length constraints
  MAX_STUDENT_ID_LENGTH: 20,
  MAX_SUBJECT_NAME_LENGTH: 50,
  MAX_REMARKS_LENGTH: 1000,
  MIN_PASSWORD_LENGTH: 6,

  // Number constraints
  MIN_CLASS_SIZE: 1,
  MAX_CLASS_SIZE: 100,
  MIN_ATTENDANCE_DAYS: 0,
  MAX_ATTENDANCE_DAYS: 365
};

/**
 * Regular expressions for format validation
 * Centralize regex patterns for consistency
 */
export const VALIDATION_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^[+]?[1-9][\d]{0,15}$/
};

// ============================================================================
// PRIMITIVE VALIDATORS - Reusable Building Blocks
// ============================================================================

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} - Whether email is valid
 */
export const validateEmail = (email) => {
  if (!email) return false;
  return VALIDATION_PATTERNS.EMAIL.test(email);
};

/**
 * Validate phone number format
 * @param {string} phone - Phone number to validate
 * @returns {boolean} - Whether phone number is valid
 */
export const validatePhone = (phone) => {
  if (!phone) return true; // Phone is optional
  return VALIDATION_PATTERNS.PHONE.test(phone.replace(/[\s\-()]/g, ''));
};

/**
 * Validate that value is a number within range
 * @param {*} value - Value to validate
 * @param {number} min - Minimum value (inclusive)
 * @param {number} max - Maximum value (inclusive)
 * @returns {boolean} - Whether value is valid
 */
export const validateNumberRange = (value, min, max) => {
  if (value === undefined || value === null || value === '') return false;
  const num = parseFloat(value);
  return !isNaN(num) && num >= min && num <= max;
};

/**
 * Validate that value is a non-empty string
 * @param {*} value - Value to validate
 * @returns {boolean} - Whether value is valid
 */
export const validateRequiredString = (value) => {
  return typeof value === 'string' && value.trim().length > 0;
};

/**
 * Validate that value is a valid gender
 * @param {*} value - Value to validate
 * @returns {boolean} - Whether value is valid
 */
export const validateGender = (value) => {
  return ALLOWED_GENDERS.includes(value);
};

/**
 * Validate student data before saving
 * @param {Object} studentData - Student data to validate
 * @returns {Object} - Validation result with isValid and errors
 */
export const validateStudentData = (studentData) => {
  const errors = {};
  
  // Required fields
  if (!validateRequiredString(studentData.firstName)) {
    errors.firstName = 'First name is required';
  }
  
  if (!validateRequiredString(studentData.lastName)) {
    errors.lastName = 'Last name is required';
  }
  
  if (!validateRequiredString(studentData.className)) {
    errors.className = 'Class is required';
  }
  
  if (!validateGender(studentData.gender)) {
    errors.gender = 'Valid gender is required';
  }
  
  // Optional fields validation
  if (studentData.idNumber && studentData.idNumber.length > VALIDATION_CONSTRAINTS.MAX_STUDENT_ID_LENGTH) {
    errors.idNumber = `Student ID must be less than ${VALIDATION_CONSTRAINTS.MAX_STUDENT_ID_LENGTH} characters`;
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Validate teacher data before saving
 * @param {Object} teacherData - Teacher data to validate
 * @returns {Object} - Validation result with isValid and errors
 */
export const validateTeacherData = (teacherData) => {
  const errors = {};
  
  // Required fields
  if (!validateRequiredString(teacherData.firstName)) {
    errors.firstName = 'First name is required';
  }
  
  if (!validateRequiredString(teacherData.lastName)) {
    errors.lastName = 'Last name is required';
  }
  
  if (!validateEmail(teacherData.email)) {
    errors.email = 'Valid email is required';
  }
  
  if (!validateGender(teacherData.gender)) {
    errors.gender = 'Valid gender is required';
  }
  
  if (!validateRequiredString(teacherData.primaryRole)) {
    errors.primaryRole = 'Primary role is required';
  }
  
  // Optional fields validation
  if (teacherData.phone && !validatePhone(teacherData.phone)) {
    errors.phone = 'Phone number format is invalid';
  }
  
  if (teacherData.password && teacherData.password.length < VALIDATION_CONSTRAINTS.MIN_PASSWORD_LENGTH) {
    errors.password = `Password must be at least ${VALIDATION_CONSTRAINTS.MIN_PASSWORD_LENGTH} characters`;
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Validate student scores data before saving
 * @param {Object} scoreData - Score data to validate
 * @returns {Object} - Validation result with isValid and errors
 */
export const validateScoreData = (scoreData) => {
  const errors = {};
  
  // Required fields
  if (!validateRequiredString(scoreData.studentId)) {
    errors.studentId = 'Student ID is required';
  }
  
  if (!validateRequiredString(scoreData.subject)) {
    errors.subject = 'Subject is required';
  }
  
  if (!validateRequiredString(scoreData.term)) {
    errors.term = 'Term is required';
  }
  
  // Score validation (all scores are optional but if provided, must be valid numbers)
  const scoreFields = ['test1', 'test2', 'test3', 'test4', 'exam', 'ca1', 'ca2'];

  scoreFields.forEach(field => {
    if (scoreData[field] !== undefined && scoreData[field] !== '') {
      const value = parseFloat(scoreData[field]);
      if (isNaN(value)) {
        errors[field] = `${field} must be a valid number`;
      } else if (value < VALIDATION_CONSTRAINTS.MIN_SCORE) {
        errors[field] = `${field} cannot be negative`;
      } else if (field === 'exam' && value > VALIDATION_CONSTRAINTS.MAX_EXAM_SCORE) {
        errors[field] = `Exam score cannot exceed ${VALIDATION_CONSTRAINTS.MAX_EXAM_SCORE}`;
      } else if (['test1', 'test2', 'test3', 'test4'].includes(field) && value > VALIDATION_CONSTRAINTS.MAX_TEST_SCORE) {
        errors[field] = `Test score cannot exceed ${VALIDATION_CONSTRAINTS.MAX_TEST_SCORE}`;
      } else if (['ca1', 'ca2'].includes(field) && value > (VALIDATION_CONSTRAINTS.MAX_TEST_SCORE * 2)) {
        errors[field] = `${field} cannot exceed ${VALIDATION_CONSTRAINTS.MAX_TEST_SCORE * 2}`;
      }
    }
  });
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Validate form master remarks data
 * @param {Object} remarkData - Remark data to validate
 * @returns {Object} - Validation result with isValid and errors
 */
export const validateRemarkData = (remarkData) => {
  const errors = {};
  
  // Required fields
  if (!validateRequiredString(remarkData.studentId)) {
    errors.studentId = 'Student ID is required';
  }
  
  if (!validateRequiredString(remarkData.className)) {
    errors.className = 'Class is required';
  }
  
  if (!validateRequiredString(remarkData.term)) {
    errors.term = 'Term is required';
  }
  
  // Optional validation - remarks should not exceed reasonable length
  if (remarkData.remarks && remarkData.remarks.length > VALIDATION_CONSTRAINTS.MAX_REMARKS_LENGTH) {
    errors.remarks = `Remarks cannot exceed ${VALIDATION_CONSTRAINTS.MAX_REMARKS_LENGTH} characters`;
  }

  // Attendance validation
  if (remarkData.attendance !== undefined && remarkData.attendance !== '') {
    const attendance = parseInt(remarkData.attendance);
    if (isNaN(attendance)) {
      errors.attendance = 'Attendance must be a valid number';
    } else if (attendance < VALIDATION_CONSTRAINTS.MIN_ATTENDANCE_DAYS || attendance > VALIDATION_CONSTRAINTS.MAX_ATTENDANCE_DAYS) {
      errors.attendance = `Attendance must be between ${VALIDATION_CONSTRAINTS.MIN_ATTENDANCE_DAYS} and ${VALIDATION_CONSTRAINTS.MAX_ATTENDANCE_DAYS}`;
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Generic type validation helper
 * @param {*} value - Value to validate
 * @param {string} type - Expected type ('string', 'number', 'boolean', 'array', 'object')
 * @returns {boolean} - Whether value matches expected type
 */
export const validateType = (value, type) => {
  switch (type) {
    case 'string':
      return typeof value === 'string';
    case 'number':
      return typeof value === 'number' && !isNaN(value);
    case 'boolean':
      return typeof value === 'boolean';
    case 'array':
      return Array.isArray(value);
    case 'object':
      return typeof value === 'object' && value !== null && !Array.isArray(value);
    default:
      return false;
  }
};

/**
 * Validate that a value is within an allowed set of values
 * @param {*} value - Value to validate
 * @param {Array} allowedValues - Array of allowed values
 * @returns {boolean} - Whether value is in allowed set
 */
export const validateInSet = (value, allowedValues) => {
  return allowedValues.includes(value);
};

/**
 * Validate class configuration data
 * @param {Object} configData - Class configuration data
 * @returns {Object} - Validation result with isValid and errors
 */
export const validateClassConfig = (configData) => {
  const errors = {};
  
  if (!validateRequiredString(configData.className)) {
    errors.className = 'Class name is required';
  }
  
  if (configData.maxStudents !== undefined) {
    if (!validateType(configData.maxStudents, 'number')) {
      errors.maxStudents = 'Max students must be a number';
    } else if (configData.maxStudents < VALIDATION_CONSTRAINTS.MIN_CLASS_SIZE || configData.maxStudents > VALIDATION_CONSTRAINTS.MAX_CLASS_SIZE) {
      errors.maxStudents = `Max students must be between ${VALIDATION_CONSTRAINTS.MIN_CLASS_SIZE} and ${VALIDATION_CONSTRAINTS.MAX_CLASS_SIZE}`;
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Validate subject data
 * @param {Object} subjectData - Subject data to validate
 * @returns {Object} - Validation result with isValid and errors
 */
export const validateSubjectData = (subjectData) => {
  const errors = {};
  
  if (!validateRequiredString(subjectData.name)) {
    errors.name = 'Subject name is required';
  }
  
  if (subjectData.name && subjectData.name.length > VALIDATION_CONSTRAINTS.MAX_SUBJECT_NAME_LENGTH) {
    errors.name = `Subject name cannot exceed ${VALIDATION_CONSTRAINTS.MAX_SUBJECT_NAME_LENGTH} characters`;
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Validate role assignment data
 * @param {Object} roleData - Role assignment data to validate
 * @returns {Object} - Validation result with isValid and errors
 */
export const validateRoleData = (roleData) => {
  const errors = {};
  
  if (!validateRequiredString(roleData.teacherId)) {
    errors.teacherId = 'Teacher ID is required';
  }
  
  if (!validateRequiredString(roleData.role)) {
    errors.role = 'Role is required';
  }
  
  // Validate role is in allowed set
  if (roleData.role && !validateInSet(roleData.role, ALLOWED_TEACHER_ROLES)) {
    errors.role = 'Invalid role specified';
  }
  
  // className is required for class_teacher and form_master roles
  if ((roleData.role === 'class_teacher' || roleData.role === 'form_master') && 
      !validateRequiredString(roleData.className)) {
    errors.className = 'Class is required for this role';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// ============================================================================
// NO DEFAULT EXPORT
// ============================================================================
// This module uses named exports only for better tree-shaking and explicit imports.
// Import specific functions: import { validateEmail, validateStudentData } from './validation';
// Or import all: import * as validation from './validation';