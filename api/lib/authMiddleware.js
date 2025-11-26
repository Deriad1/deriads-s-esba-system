import jwt from 'jsonwebtoken';

/**
 * JWT Authentication and Authorization Middleware
 * Extracts and verifies JWT tokens from Authorization header
 * Validates teacher access to requested resources
 */

/**
 * Extract and verify JWT token from request
 * @param {Object} req - Request object
 * @returns {Object|null} - Decoded user data or null if invalid
 */
export function extractUser(req) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify and decode the JWT
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'CHANGE_THIS_SECRET_IN_PRODUCTION'
    );

    return decoded;
  } catch (error) {
    console.error('JWT verification failed:', error.message);
    return null;
  }
}

/**
 * Check if user has access to a specific class
 * @param {Object} user - User object from JWT
 * @param {string} className - Class name to check
 * @returns {boolean}
 */
export function hasClassAccess(user, className) {
  if (!user) return false;

  // Admin and head_teacher have access to all classes
  if (user.primaryRole === 'admin' ||
      user.all_roles?.includes('admin') ||
      user.all_roles?.includes('head_teacher')) {
    return true;
  }

  // Check if teacher is assigned to this class
  const classes = user.classes || [];
  return classes.includes(className);
}

/**
 * Check if user has READ access to a specific subject in a specific class
 * Form Masters and Class Teachers can VIEW all subjects in their class (read-only for subjects they don't teach)
 * @param {Object} user - User object from JWT
 * @param {string} className - Class name to check
 * @param {string} subject - Subject name to check
 * @returns {boolean}
 */
export function hasSubjectReadAccess(user, className, subject) {
  if (!user) return false;

  // Admin and head_teacher have READ access to all subjects
  if (user.primaryRole === 'admin' ||
      user.all_roles?.includes('admin') ||
      user.all_roles?.includes('head_teacher')) {
    return true;
  }

  // Must have access to the class
  if (!hasClassAccess(user, className)) {
    return false;
  }

  // Class teachers can READ all subjects in their assigned class
  if (user.primaryRole === 'class_teacher' ||
      user.all_roles?.includes('class_teacher')) {
    return true;
  }

  // Form masters can READ all subjects in their form class (for class management purposes)
  if (user.primaryRole === 'form_master' ||
      user.all_roles?.includes('form_master')) {
    return true;
  }

  // Subject teachers can only READ subjects they teach
  const subjects = user.subjects || [];
  return subjects.includes(subject);
}

/**
 * Check if user has WRITE access to a specific subject in a specific class
 * Form Masters can only EDIT subjects they teach (read-only for other subjects)
 * @param {Object} user - User object from JWT
 * @param {string} className - Class name to check
 * @param {string} subject - Subject name to check
 * @returns {boolean}
 */
export function hasSubjectWriteAccess(user, className, subject) {
  if (!user) return false;

  // Admin has WRITE access to all subjects
  if (user.primaryRole === 'admin' ||
      user.all_roles?.includes('admin')) {
    return true;
  }

  // Head teacher has NO write access (supervisor only)
  if (user.primaryRole === 'head_teacher' ||
      user.all_roles?.includes('head_teacher')) {
    return false;
  }

  // Must have access to the class
  if (!hasClassAccess(user, className)) {
    return false;
  }

  // Class teachers can WRITE all subjects in their assigned class
  if (user.primaryRole === 'class_teacher' ||
      user.all_roles?.includes('class_teacher')) {
    return true;
  }

  // Form masters and subject teachers can only WRITE subjects they teach
  const subjects = user.subjects || [];
  return subjects.includes(subject);
}

/**
 * Check if user has access to a specific subject in a specific class
 * @deprecated Use hasSubjectReadAccess or hasSubjectWriteAccess instead
 * @param {Object} user - User object from JWT
 * @param {string} className - Class name to check
 * @param {string} subject - Subject name to check
 * @returns {boolean}
 */
export function hasSubjectAccess(user, className, subject) {
  // Default to READ access for backward compatibility
  return hasSubjectReadAccess(user, className, subject);
}

/**
 * Filter classes based on user access
 * @param {Object} user - User object from JWT
 * @param {Array<string>} classes - Array of class names
 * @returns {Array<string>} - Filtered array of classes user has access to
 */
export function filterClassesByAccess(user, classes) {
  if (!user) return [];

  // Admin and head_teacher see all classes
  if (user.primaryRole === 'admin' ||
      user.all_roles?.includes('admin') ||
      user.all_roles?.includes('head_teacher')) {
    return classes;
  }

  // Filter to only classes the teacher is assigned to
  const userClasses = user.classes || [];
  return classes.filter(className => userClasses.includes(className));
}

/**
 * Get SQL WHERE clause for filtering by user's assigned classes
 * @param {Object} user - User object from JWT
 * @param {string} classColumnName - Name of the class column (default: 'class_name')
 * @returns {Object} - Object with { hasRestriction: boolean, classes: Array }
 */
export function getClassFilterForUser(user, classColumnName = 'class_name') {
  if (!user) {
    return { hasRestriction: true, classes: [] };
  }

  // Admin and head_teacher have no restrictions
  if (user.primaryRole === 'admin' ||
      user.all_roles?.includes('admin') ||
      user.all_roles?.includes('head_teacher')) {
    return { hasRestriction: false, classes: [] };
  }

  // Return the teacher's assigned classes for filtering
  return {
    hasRestriction: true,
    classes: user.classes || []
  };
}

/**
 * Require authentication - sends 401 if user not authenticated
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @returns {Object|null} - User object or null (with response sent)
 */
export function requireAuth(req, res) {
  const user = extractUser(req);

  if (!user) {
    res.status(401).json({
      status: 'error',
      message: 'Authentication required. Please log in.'
    });
    return null;
  }

  return user;
}

/**
 * Require class access - sends 403 if user doesn't have access
 * @param {Object} user - User object from JWT
 * @param {string} className - Class name to check
 * @param {Object} res - Response object
 * @returns {boolean} - true if has access, false if forbidden (with response sent)
 */
export function requireClassAccess(user, className, res) {
  if (!hasClassAccess(user, className)) {
    res.status(403).json({
      status: 'error',
      message: `Access denied. You are not assigned to class ${className}.`
    });
    return false;
  }
  return true;
}

/**
 * Require subject READ access - sends 403 if user doesn't have access
 * @param {Object} user - User object from JWT
 * @param {string} className - Class name to check
 * @param {string} subject - Subject name to check
 * @param {Object} res - Response object
 * @returns {boolean} - true if has access, false if forbidden (with response sent)
 */
export function requireSubjectReadAccess(user, className, subject, res) {
  if (!hasSubjectReadAccess(user, className, subject)) {
    res.status(403).json({
      status: 'error',
      message: `Access denied. You do not have permission to view ${subject} in class ${className}.`
    });
    return false;
  }
  return true;
}

/**
 * Require subject WRITE access - sends 403 if user doesn't have access
 * @param {Object} user - User object from JWT
 * @param {string} className - Class name to check
 * @param {string} subject - Subject name to check
 * @param {Object} res - Response object
 * @returns {boolean} - true if has access, false if forbidden (with response sent)
 */
export function requireSubjectWriteAccess(user, className, subject, res) {
  if (!hasSubjectWriteAccess(user, className, subject)) {
    res.status(403).json({
      status: 'error',
      message: `Access denied. You are not assigned to teach ${subject} in class ${className}.`
    });
    return false;
  }
  return true;
}

/**
 * Require subject access - sends 403 if user doesn't have access
 * @deprecated Use requireSubjectReadAccess or requireSubjectWriteAccess instead
 * @param {Object} user - User object from JWT
 * @param {string} className - Class name to check
 * @param {string} subject - Subject name to check
 * @param {Object} res - Response object
 * @returns {boolean} - true if has access, false if forbidden (with response sent)
 */
export function requireSubjectAccess(user, className, subject, res) {
  // Default to READ access for backward compatibility
  return requireSubjectReadAccess(user, className, subject, res);
}
