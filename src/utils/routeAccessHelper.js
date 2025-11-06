/**
 * Route Access Helper
 *
 * Centralized logic for determining route access based on user roles.
 * This ensures consistent access control across the application.
 */

/**
 * Determines if a user can access a route based on their roles
 *
 * Rules:
 * 1. Admins can access ANY route (superuser access)
 * 2. Users with the required role in their currentRole can access
 * 3. Users with multiple roles can access routes for any of their roles
 *
 * @param {Object} user - User object with allRoles and currentRole
 * @param {Array<string>} allowedRoles - Roles that can access the route
 * @returns {boolean} - True if user can access the route
 */
export const canAccessRoute = (user, allowedRoles) => {
  if (!user) return false;

  // No role restrictions - allow all authenticated users
  if (!allowedRoles || allowedRoles.length === 0) {
    return true;
  }

  // Get user's all roles
  const allRoles = user.all_roles || user.allRoles || [];
  const currentRole = user.currentRole || user.primaryRole || user.role;

  // Rule 1: Superadmin and Admins can access everything (superuser privilege)
  if (allRoles.includes('superadmin') || allRoles.includes('admin')) {
    return true;
  }

  // Rule 2: Check if current active role is in allowed roles
  if (allowedRoles.includes(currentRole)) {
    return true;
  }

  // Rule 3: Check if user has ANY of the allowed roles (even if not current)
  // This allows users to access routes they're qualified for
  const hasAnyAllowedRole = allRoles.some(role => allowedRoles.includes(role));

  return hasAnyAllowedRole;
};

/**
 * Gets the default/home route for a specific role
 *
 * @param {string} role - The role code
 * @returns {string} - The route path for that role's dashboard
 */
export const getDefaultRouteForRole = (role) => {
  const roleRoutes = {
    'superadmin': '/admin', // Superadmin gets admin dashboard
    'admin': '/admin',
    'head_teacher': '/head-teacher',
    'form_master': '/form-master',
    'class_teacher': '/class-teacher',
    'subject_teacher': '/subject-teacher',
    'teacher': '/subject-teacher' // Legacy role
  };

  return roleRoutes[role] || '/subject-teacher'; // Default to subject teacher
};

/**
 * Determines the best route to redirect a user to based on their roles
 * Prioritizes their current role, then primary role, then first available role
 *
 * @param {Object} user - User object
 * @returns {string} - The best route path for the user
 */
export const getBestRouteForUser = (user) => {
  if (!user) return '/';

  const currentRole = user.currentRole || user.primaryRole || user.role;
  const allRoles = user.all_roles || user.allRoles || [];

  // Try current role first
  if (currentRole) {
    return getDefaultRouteForRole(currentRole);
  }

  // Fallback to first role in allRoles
  if (allRoles.length > 0) {
    return getDefaultRouteForRole(allRoles[0]);
  }

  // Ultimate fallback
  return '/subject-teacher';
};

/**
 * Checks if a user can switch to a specific role
 *
 * @param {Object} user - User object
 * @param {string} targetRole - The role to switch to
 * @returns {boolean} - True if switch is allowed
 */
export const canSwitchToRole = (user, targetRole) => {
  if (!user || !targetRole) return false;

  const allRoles = user.all_roles || user.allRoles || [];

  // User can only switch to roles they actually have
  return allRoles.includes(targetRole);
};

/**
 * Validates if a user has a specific role (in any capacity)
 *
 * @param {Object} user - User object
 * @param {string} role - The role to check for
 * @returns {boolean} - True if user has the role
 */
export const hasRole = (user, role) => {
  if (!user || !role) return false;

  const allRoles = user.all_roles || user.allRoles || [];
  const currentRole = user.currentRole || user.primaryRole || user.role;

  // Check in all roles or current role
  return allRoles.includes(role) || currentRole === role;
};

/**
 * Checks if user is a superadmin
 *
 * @param {Object} user - User object
 * @returns {boolean} - True if user has superadmin role
 */
export const isSuperAdmin = (user) => {
  return hasRole(user, 'superadmin');
};

/**
 * Checks if user is an admin
 *
 * @param {Object} user - User object
 * @returns {boolean} - True if user has admin or superadmin role
 */
export const isAdmin = (user) => {
  return hasRole(user, 'admin') || isSuperAdmin(user);
};

/**
 * Checks if user has multiple roles
 *
 * @param {Object} user - User object
 * @returns {boolean} - True if user has 2+ roles
 */
export const hasMultipleRoles = (user) => {
  if (!user) return false;

  const allRoles = user.all_roles || user.allRoles || [];
  return allRoles.length > 1;
};

/**
 * Gets a list of available routes for a user based on their roles
 *
 * @param {Object} user - User object
 * @returns {Array<Object>} - Array of {role, route, label} objects
 */
export const getAvailableRoutesForUser = (user) => {
  if (!user) return [];

  const allRoles = user.all_roles || user.allRoles || [];
  const routes = [];

  const roleLabels = {
    'superadmin': '⚡ Super Administrator',
    'admin': 'Administrator Dashboard',
    'head_teacher': 'Head Teacher Dashboard',
    'form_master': 'Form Master Dashboard',
    'class_teacher': 'Class Teacher Dashboard',
    'subject_teacher': 'Subject Teacher Dashboard'
  };

  allRoles.forEach(role => {
    const route = getDefaultRouteForRole(role);
    const label = roleLabels[role] || role;

    routes.push({
      role,
      route,
      label,
      isCurrent: role === (user.currentRole || user.primaryRole)
    });
  });

  return routes;
};

/**
 * Determines if route access should be logged/audited
 *
 * @param {string} route - The route being accessed
 * @returns {boolean} - True if access should be audited
 */
export const shouldAuditRouteAccess = (route) => {
  const sensitiveRoutes = [
    '/admin',
    '/manage-users',
    '/school-setup'
  ];

  return sensitiveRoutes.some(sensitive => route.startsWith(sensitive));
};

/**
 * Logs route access for audit purposes
 *
 * @param {Object} user - User object
 * @param {string} route - The route being accessed
 * @param {boolean} granted - Whether access was granted
 */
export const auditRouteAccess = (user, route, granted) => {
  if (!shouldAuditRouteAccess(route)) return;

  const auditLog = {
    timestamp: new Date().toISOString(),
    userId: user?.id,
    userEmail: user?.email,
    currentRole: user?.currentRole || user?.primaryRole,
    route,
    accessGranted: granted
  };

  console.log('🔒 Route Access Audit:', auditLog);

  // TODO: Send to backend audit service
  // await fetch('/api/audit/route-access', {
  //   method: 'POST',
  //   body: JSON.stringify(auditLog)
  // });
};
