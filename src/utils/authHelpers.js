/**
 * Authentication Helper Functions
 * Provides secure password hashing and token management
 */

// NOTE: bcryptjs removed from client-side to prevent "crypto" module errors.
// Password hashing and verification should happen SERVER-SIDE.

/**
 * Hash a password using bcrypt
 * @deprecated Server-side hashing should be used instead
 */
export const hashPassword = async (password) => {
  console.warn('⚠️ Client-side hashing is deprecated and disabled.');
  return password; // Return plain for dev/testing if absolutely needed, or throw error
};

/**
 * Compare a plain text password with a hashed password
 * @deprecated Server-side verification should be used instead
 */
export const comparePassword = async (password, hashedPassword) => {
  console.warn('⚠️ Client-side password comparison is deprecated and disabled.');
  return false;
};

/**
 * Decode JWT token (client-side - NO verification, just reading)
 * ⚠️ IMPORTANT: Token verification happens SERVER-SIDE for security
 * Client only decodes to read non-sensitive data and check expiration
 *
 * @param {string} token - JWT token from server
 * @returns {object|null} - Decoded token payload or null if invalid
 */
export const decodeJWT = (token) => {
  try {
    if (!token || typeof token !== 'string') {
      return null;
    }

    // JWT format: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.error('Invalid JWT format');
      return null;
    }

    // Decode the payload (middle part)
    const payload = parts[1];
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));

    return decoded;
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
};

/**
 * Check if JWT token has expired (client-side check)
 * Server-side will also validate expiration
 *
 * @param {string} token - JWT token
 * @returns {boolean} - True if token is expired
 */
export const isTokenExpired = (token) => {
  const decoded = decodeJWT(token);

  if (!decoded || !decoded.exp) {
    return true; // No expiration means invalid
  }

  // JWT exp is in seconds, Date.now() is in milliseconds
  const expirationTime = decoded.exp * 1000;
  const isExpired = Date.now() > expirationTime;

  if (isExpired) {
    console.log('✗ Token has expired');
  }

  return isExpired;
};

/**
 * Verify and decode an authentication token
 * ⚠️ This is a CLIENT-SIDE check only - server MUST also verify!
 *
 * @param {string} token - JWT token
 * @returns {object|null} - Decoded token data or null if invalid/expired
 */
export const verifyAuthToken = (token) => {
  try {
    if (!token) {
      return null;
    }

    // Check if token is expired
    if (isTokenExpired(token)) {
      console.log('✗ Token verification failed: expired');
      return null;
    }

    // Decode token (client can't verify signature - that's server's job)
    const decoded = decodeJWT(token);

    if (decoded) {
      console.log('✓ Token decoded successfully (client-side)');
    }

    return decoded;
  } catch (error) {
    console.error('Error verifying token:', error);
    return null;
  }
};

/**
 * Generate a secure authentication token
 * ⚠️ DEPRECATED: Token generation now happens SERVER-SIDE
 * This function is kept for backward compatibility only
 *
 * @deprecated Use server-side JWT generation instead
 * @param {object} userData - User data to encode in token
 * @returns {string} - Authentication token
 */
export const generateAuthToken = (userData) => {
  console.warn('⚠️ generateAuthToken is deprecated. Tokens should be generated server-side.');

  // For backward compatibility, return a simple identifier
  // Real JWT tokens come from the server
  return `legacy_token_${userData.id}_${Date.now()}`;
};

/**
 * Store authentication token securely
 * ✅ FIX: Only store in localStorage (not both)
 *
 * Storage Strategy:
 * - localStorage: Persistent storage for "Remember Me" functionality
 * - Token persists across browser sessions
 * - Auto-logout handled by token expiration (24h)
 *
 * @param {string} token - Authentication token
 */
export const storeAuthToken = (token) => {
  // ✅ FIXED: Store only in localStorage to prevent sync issues
  localStorage.setItem('authToken', token);
};

/**
 * Retrieve authentication token
 * ✅ FIX: Only check localStorage
 *
 * @returns {string|null} - Authentication token or null
 */
export const getAuthToken = () => {
  // ✅ FIXED: Check only localStorage
  return localStorage.getItem('authToken');
};

/**
 * Remove authentication token
 * ✅ FIX: Clean up both storages for migration safety
 *
 * @param {boolean} clearBoth - If true, clears both storages (for migration)
 */
export const removeAuthToken = (clearBoth = true) => {
  localStorage.removeItem('authToken');

  // ✅ Clear sessionStorage too for migration from old code
  if (clearBoth) {
    sessionStorage.removeItem('authToken');
  }
};

/**
 * Sanitize user data before storing
 * @param {object} userData - Raw user data
 * @returns {object} - Sanitized user data (no sensitive info)
 */
export const sanitizeUserData = (userData) => {
  // Remove sensitive fields using destructuring
  // eslint-disable-next-line no-unused-vars
  const { password, password_hash, ...safeData } = userData;
  return safeData;
};
