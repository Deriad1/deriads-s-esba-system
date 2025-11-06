/**
 * Teacher Role Validation Utilities
 * Centralized validation logic for teacher role assignments
 */

/**
 * Available teacher roles
 */
export const TEACHER_ROLES = {
  SUBJECT_TEACHER: 'subject_teacher',
  CLASS_TEACHER: 'class_teacher',
  FORM_MASTER: 'form_master',
  HEAD_TEACHER: 'head_teacher'
};

/**
 * Role display names
 */
export const ROLE_DISPLAY_NAMES = {
  [TEACHER_ROLES.SUBJECT_TEACHER]: 'Subject Teacher',
  [TEACHER_ROLES.CLASS_TEACHER]: 'Class Teacher',
  [TEACHER_ROLES.FORM_MASTER]: 'Form Master/Mistress',
  [TEACHER_ROLES.HEAD_TEACHER]: 'Head Teacher'
};

/**
 * Teaching levels
 */
export const TEACHING_LEVELS = {
  KG: 'KG',
  PRIMARY: 'PRIMARY',
  JHS: 'JHS'
};

/**
 * Validate role assignment rules
 * @param {Object} params - Validation parameters
 * @param {string} params.primaryRole - The primary role of the teacher
 * @param {Array<string>} params.allRoles - All roles assigned to the teacher
 * @param {string} params.classAssigned - The class assigned to the teacher (for form masters)
 * @param {string} params.teachingLevel - The teaching level (KG, PRIMARY, JHS)
 * @returns {Object} Validation result with { valid: boolean, error?: string }
 */
export const validateRoleAssignment = ({ primaryRole, allRoles = [], classAssigned, teachingLevel }) => {
  // Ensure allRoles is an array
  const roles = Array.isArray(allRoles) ? allRoles : [allRoles].filter(Boolean);

  // Rule 1: At least one role must be selected
  if (roles.length === 0) {
    return {
      valid: false,
      error: 'At least one role must be selected'
    };
  }

  // Rule 2: Primary role must be in allRoles
  if (primaryRole && !roles.includes(primaryRole)) {
    return {
      valid: false,
      error: 'Primary role must be one of the selected roles'
    };
  }

  // Rule 3: Head Teachers cannot be Form Masters
  if (roles.includes(TEACHER_ROLES.HEAD_TEACHER) && roles.includes(TEACHER_ROLES.FORM_MASTER)) {
    return {
      valid: false,
      error: 'Head Teachers cannot be assigned as Form Masters'
    };
  }

  // Rule 4: Form Masters must have a class assigned (only for JHS)
  if (roles.includes(TEACHER_ROLES.FORM_MASTER)) {
    // Form Master role should only be validated for JHS teachers
    if (teachingLevel === 'JHS' || teachingLevel === TEACHING_LEVELS.JHS) {
      if (!classAssigned) {
        return {
          valid: false,
          error: 'Form Masters must have a class assigned to manage'
        };
      }

      // Also validate that the class matches the teaching level
      const formMasterValidation = validateFormMasterAssignment({ className: classAssigned, teachingLevel });
      if (!formMasterValidation.valid) {
        return formMasterValidation;
      }
    }
  }

  // Rule 5: Form Master role is only for JHS teachers (optional constraint)
  // Commented out as it may not be needed based on current system
  // if (roles.includes(TEACHER_ROLES.FORM_MASTER) && teachingLevel !== TEACHING_LEVELS.JHS) {
  //   return {
  //     valid: false,
  //     error: 'Form Master/Mistress role is only available for JHS teachers'
  //   };
  // }

  return { valid: true };
};

/**
 * Check if a role change is allowed
 * @param {string} roleToAdd - The role being added
 * @param {Array<string>} currentRoles - Current roles
 * @returns {Object} Result with { allowed: boolean, error?: string }
 */
export const canAddRole = (roleToAdd, currentRoles = []) => {
  const roles = Array.isArray(currentRoles) ? currentRoles : [currentRoles].filter(Boolean);

  // Check if adding this role would violate head_teacher + form_master rule
  if (roleToAdd === TEACHER_ROLES.FORM_MASTER && roles.includes(TEACHER_ROLES.HEAD_TEACHER)) {
    return {
      allowed: false,
      error: 'Cannot add Form Master role to a Head Teacher'
    };
  }

  if (roleToAdd === TEACHER_ROLES.HEAD_TEACHER && roles.includes(TEACHER_ROLES.FORM_MASTER)) {
    return {
      allowed: false,
      error: 'Cannot add Head Teacher role to a Form Master'
    };
  }

  return { allowed: true };
};

/**
 * Check if a role can be removed
 * @param {string} roleToRemove - The role being removed
 * @param {Array<string>} currentRoles - Current roles
 * @param {string} primaryRole - The primary role
 * @returns {Object} Result with { allowed: boolean, error?: string }
 */
export const canRemoveRole = (roleToRemove, currentRoles = [], primaryRole) => {
  const roles = Array.isArray(currentRoles) ? currentRoles : [currentRoles].filter(Boolean);

  // Cannot remove the last role
  if (roles.length === 1) {
    return {
      allowed: false,
      error: 'Cannot remove the last role. Teacher must have at least one role.'
    };
  }

  // Warn if removing the primary role (should prompt to select new primary)
  if (roleToRemove === primaryRole) {
    return {
      allowed: true,
      warning: 'Removing the primary role. A new primary role will be automatically selected.'
    };
  }

  return { allowed: true };
};

/**
 * Get the next valid primary role when current primary is removed
 * @param {string} removedRole - The role being removed
 * @param {Array<string>} remainingRoles - Roles that will remain after removal
 * @returns {string} The new primary role
 */
export const getNextPrimaryRole = (removedRole, remainingRoles) => {
  const roles = Array.isArray(remainingRoles) ? remainingRoles : [remainingRoles].filter(Boolean);

  if (roles.length === 0) {
    return TEACHER_ROLES.SUBJECT_TEACHER;
  }

  // Priority order for primary role selection
  const priorityOrder = [
    TEACHER_ROLES.HEAD_TEACHER,
    TEACHER_ROLES.FORM_MASTER,
    TEACHER_ROLES.CLASS_TEACHER,
    TEACHER_ROLES.SUBJECT_TEACHER
  ];

  for (const role of priorityOrder) {
    if (roles.includes(role)) {
      return role;
    }
  }

  return roles[0];
};

/**
 * Validate form master assignment
 * @param {Object} params - Assignment parameters
 * @param {string} params.className - The class name
 * @param {string} params.teachingLevel - The teaching level
 * @returns {Object} Validation result
 */
export const validateFormMasterAssignment = ({ className, teachingLevel }) => {
  if (!className) {
    return {
      valid: false,
      error: 'Class name is required for Form Master assignment'
    };
  }

  // Check if class matches teaching level
  if (teachingLevel === TEACHING_LEVELS.KG && !className.startsWith('KG')) {
    return {
      valid: false,
      error: 'KG teachers can only be Form Masters for KG classes (KG1-KG2)'
    };
  }

  if (teachingLevel === TEACHING_LEVELS.PRIMARY) {
    const isPrimaryClass = className.startsWith('BS') && !['BS7', 'BS8', 'BS9'].includes(className);
    if (!isPrimaryClass) {
      return {
        valid: false,
        error: 'Primary teachers can only be Form Masters for Primary classes (BS1-BS6)'
      };
    }
  }

  if (teachingLevel === TEACHING_LEVELS.JHS && !['BS7', 'BS8', 'BS9'].includes(className)) {
    return {
      valid: false,
      error: 'JHS teachers can only be Form Masters for JHS classes (BS7-BS9)'
    };
  }

  return { valid: true };
};

/**
 * Get role compatibility message
 * @param {string} role1 - First role
 * @param {string} role2 - Second role
 * @returns {string|null} Compatibility message or null if compatible
 */
export const getRoleCompatibilityMessage = (role1, role2) => {
  if (
    (role1 === TEACHER_ROLES.HEAD_TEACHER && role2 === TEACHER_ROLES.FORM_MASTER) ||
    (role1 === TEACHER_ROLES.FORM_MASTER && role2 === TEACHER_ROLES.HEAD_TEACHER)
  ) {
    return '⚠️ Head Teachers and Form Masters are mutually exclusive roles';
  }

  return null;
};

/**
 * Initialize teacher role data with safe defaults
 * @param {Object} teacher - Teacher object
 * @returns {Object} Initialized role data
 */
export const initializeTeacherRoles = (teacher = {}) => {
  const allRoles = Array.isArray(teacher.all_roles)
    ? teacher.all_roles
    : (teacher.all_roles ? [teacher.all_roles] : [TEACHER_ROLES.SUBJECT_TEACHER]);

  const primaryRole = teacher.teacher_primary_role
    || teacher.primaryRole
    || allRoles[0]
    || TEACHER_ROLES.SUBJECT_TEACHER;

  return {
    allRoles,
    primaryRole,
    classAssigned: teacher.class_assigned || teacher.classAssigned || '',
    teachingLevel: teacher.teaching_level || teacher.teachingLevel || TEACHING_LEVELS.PRIMARY
  };
};
