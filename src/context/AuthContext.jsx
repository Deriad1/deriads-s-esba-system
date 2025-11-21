import { createContext, useContext, useState, useEffect } from 'react';
import { loginUser as authenticateUser } from '../api-client';
import { storeAuthToken, getAuthToken, removeAuthToken, verifyAuthToken } from '../utils/authHelpers';
import { normalizeUserData, getUserRoleDisplayName } from '../utils/userDataNormalizer';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Start with true to prevent premature redirects
  const [error, setError] = useState(null);

  useEffect(() => {
    // ✅ SECURITY FIX: Verify token on app load
    const validateSession = async () => {
      const storedUser = localStorage.getItem('user');
      const token = getAuthToken();

      if (storedUser && token) {
        try {
          // 1. Parse stored user data
          const parsedUser = JSON.parse(storedUser);

          // 2. Verify token is still valid (not expired)
          const tokenData = verifyAuthToken(token);

          if (!tokenData) {
            // Token is invalid or expired - clear session
            console.log('🔒 Token expired or invalid. Logging out...');
            localStorage.removeItem('user');
            removeAuthToken();
            setUser(null);
          } else {
            // ✅ CONSISTENCY FIX: Normalize user data structure
            const normalizedUser = normalizeUserData(parsedUser);
            console.log('✓ Session restored successfully');
            setUser(normalizedUser);
          }
        } catch (e) {
          console.error('Error validating session:', e);
          // Clear invalid session data
          localStorage.removeItem('user');
          removeAuthToken();
          setUser(null);
        }
      } else if (storedUser || token) {
        // Partial session data - clear everything
        console.log('⚠️ Incomplete session data. Clearing...');
        localStorage.removeItem('user');
        removeAuthToken();
        setUser(null);
      }

      setLoading(false); // Mark loading as complete
    };

    validateSession();

    // Listen for 401 Unauthorized events from api-client
    const handleUnauthorized = () => {
      console.log('🔒 Received unauthorized signal. Logging out...');
      localStorage.removeItem('user');
      removeAuthToken();
      setUser(null);
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);

    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    setError(null);

    try {
      const response = await authenticateUser(email, password);

      if (response.status === 'success') {
        // ✅ CONSISTENCY FIX: Normalize user data structure
        const normalizedUserData = normalizeUserData(response.data);

        // Store auth token securely (if provided)
        if (response.token) {
          storeAuthToken(response.token);
        }

        setUser(normalizedUserData);
        // Store normalized user data WITHOUT sensitive information
        localStorage.setItem('user', JSON.stringify(normalizedUserData));

        console.log('✅ Login successful');
        return normalizedUserData;
      } else {
        throw new Error(response.message || 'Authentication failed');
      }
    } catch (err) {
      const errorMessage = err.message || 'Login failed';
      setError(errorMessage);
      console.error('❌ Login error:', errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    removeAuthToken(); // Remove secure token
    console.log('👋 Logout successful');
  };

  const switchRole = (newRole) => {
    if (!user) {
      console.error('No user logged in');
      return false;
    }

    // ✅ CONSISTENCY FIX: Use normalized user data
    const normalized = normalizeUserData(user);

    if (!normalized.allRoles.includes(newRole)) {
      console.error('Invalid role switch attempt:', newRole);
      return false;
    }

    const updatedUser = {
      ...normalized,
      currentRole: newRole
    };

    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));

    window.dispatchEvent(new CustomEvent('roleChanged', {
      detail: { newRole, previousRole: normalized.currentRole }
    }));

    return true;
  };

  // ✅ CONSISTENCY FIX: Use centralized role display name function
  const getRoleDisplayName = (role, gender) => {
    return getUserRoleDisplayName({ gender }, role);
  };

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    switchRole,
    getRoleDisplayName,
    setError
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};