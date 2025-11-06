/**
 * User Data Normalizer
 *
 * ✅ FIX for inconsistent role data structure
 *
 * This module provides functions to normalize user data from various sources
 * into a consistent structure with standardized property names.
 *
 * Problem: User objects have inconsistent property names:
 * - all_roles vs allRoles
 * - role vs currentRole vs primaryRole
 *
 * Solution: Normalize all user data to use camelCase consistently
 */

/**
 * Normalize user data to consistent structure
 *
 * @param {Object} userData - Raw user data from API or storage
 * @returns {Object} - Normalized user data with consistent property names
 */
export const normalizeUserData = (userData) => {
  if (!userData) {
    return null;
  }

  // Extract all possible role fields and normalize to allRoles (camelCase)
  const allRoles =
    userData.allRoles ||
    userData.all_roles ||
    (userData.role ? [userData.role] : null) ||
    (userData.primaryRole ? [userData.primaryRole] : null) ||
    [];

  // Extract current/primary role
  const primaryRole =
    userData.primaryRole ||
    userData.teacher_primary_role ||
    userData.role ||
    (allRoles.length > 0 ? allRoles[0] : 'teacher');

  // Current active role defaults to primary role
  const currentRole =
    userData.currentRole ||
    primaryRole;

  // Return normalized user object with CONSISTENT camelCase naming
  return {
    // Identity fields
    id: userData.id,
    email: userData.email,
    firstName: userData.firstName || userData.first_name || '',
    lastName: userData.lastName || userData.last_name || '',
    name: userData.name || `${userData.firstName || userData.first_name || ''} ${userData.lastName || userData.last_name || ''}`.trim(),
    gender: userData.gender || 'other',

    // ✅ STANDARDIZED: All role fields use camelCase
    allRoles: Array.isArray(allRoles) ? allRoles : [allRoles].filter(Boolean),
    primaryRole: primaryRole,
    currentRole: currentRole,

    // Teaching assignments
    classes: Array.isArray(userData.classes) ? userData.classes : [],
    subjects: Array.isArray(userData.subjects) ? userData.subjects : [],
    classAssigned: userData.classAssigned || userData.class_assigned || null,
    formClass: userData.formClass || userData.form_class || userData.classAssigned || userData.class_assigned || null,

    // Security flags
    requiresPasswordChange: userData.requiresPasswordChange || userData.requires_password_change || false,

    // Preserve any additional fields
    ...userData,

    // Override with normalized versions
    all_roles: undefined, // Remove snake_case version
    teacher_primary_role: undefined, // Remove snake_case version
    first_name: undefined,
    last_name: undefined,
    class_assigned: undefined,
    form_class: undefined,
    requires_password_change: undefined
  };
};

/**
 * Check if user has a specific role (in any capacity)
 *
 * @param {Object} user - Normalized user object
 * @param {string} role - Role to check for
 * @returns {boolean} - True if user has the role
 */
export const userHasRole = (user, role) => {
  if (!user || !role) {
    return false;
  }

  const normalized = normalizeUserData(user);
  return normalized.allRoles.includes(role);
};

/**
 * Check if user has ANY of the specified roles
 *
 * @param {Object} user - Normalized user object
 * @param {Array<string>} roles - Roles to check for
 * @returns {boolean} - True if user has any of the roles
 */
export const userHasAnyRole = (user, roles) => {
  if (!user || !Array.isArray(roles)) {
    return false;
  }

  const normalized = normalizeUserData(user);
  return roles.some(role => normalized.allRoles.includes(role));
};

/**
 * Check if user has ALL of the specified roles
 *
 * @param {Object} user - Normalized user object
 * @param {Array<string>} roles - Roles to check for
 * @returns {boolean} - True if user has all of the roles
 */
export const userHasAllRoles = (user, roles) => {
  if (!user || !Array.isArray(roles)) {
    return false;
  }

  const normalized = normalizeUserData(user);
  return roles.every(role => normalized.allRoles.includes(role));
};

/**
 * Check if user is an admin
 *
 * @param {Object} user - User object
 * @returns {boolean} - True if user has admin role
 */
export const isAdmin = (user) => {
  return userHasRole(user, 'admin');
};

/**
 * Get user's display name based on role and gender
 *
 * @param {Object} user - User object
 * @param {string} role - Optional specific role to display
 * @returns {string} - Display name for the role
 */
export const getUserRoleDisplayName = (user, role = null) => {
  const normalized = normalizeUserData(user);
  const targetRole = role || normalized.currentRole;
  const gender = normalized.gender;

  const roleMap = {
    'admin': 'Administrator',
    'head_teacher': 'Head Teacher',
    'subject_teacher': 'Subject Teacher',
    'class_teacher': 'Class Teacher',
    'form_master': gender === 'female' ? 'Form Mistress' : 'Form Master',
    'teacher': 'Teacher'
  };

  return roleMap[targetRole] || targetRole?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
};

/**
 * Validate that user data has required fields
 *
 * @param {Object} userData - User data to validate
 * @returns {Object} - { isValid: boolean, errors: string[] }
 */
export const validateUserData = (userData) => {
  const errors = [];

  if (!userData) {
    errors.push('User data is null or undefined');
    return { isValid: false, errors };
  }

  if (!userData.id) {
    errors.push('User ID is missing');
  }

  if (!userData.email) {
    errors.push('Email is missing');
  }

  const normalized = normalizeUserData(userData);

  if (!normalized.allRoles || normalized.allRoles.length === 0) {
    errors.push('No roles assigned to user');
  }

  if (!normalized.primaryRole) {
    errors.push('Primary role is missing');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};
