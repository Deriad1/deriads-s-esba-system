import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useGlobalSettings } from '../context/GlobalSettingsContext';
import { useNotification } from '../context/NotificationContext';
import LogoWatermark from '../components/LogoWatermark';
import { changeTeacherPassword } from '../api-client';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, loading, error, setError } = useAuth();
  const { settings } = useGlobalSettings();
  const { showNotification } = useNotification();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPasswordChangeModal, setShowPasswordChangeModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [tempUserData, setTempUserData] = useState(null);

  useEffect(() => {
    // Check if user email is saved (password is NEVER saved for security)
    const savedEmail = localStorage.getItem('savedEmail');

    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }

    // Clean up any old saved passwords (security fix)
    localStorage.removeItem('savedPassword');
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    try {
      // Save ONLY email if "Remember Me" is checked (NEVER save password for security)
      if (rememberMe) {
        localStorage.setItem('savedEmail', email);
      } else {
        localStorage.removeItem('savedEmail');
      }

      const userData = await login(email, password);

      // Check if password change is required
      if (userData.requiresPasswordChange) {
        setTempUserData(userData);
        setShowPasswordChangeModal(true);
        return;
      }

      // Redirect based on user role
      const currentRole = userData.currentRole || userData.primaryRole || userData.role;

      const roleRoutes = {
        'superadmin': '/admin', // Superadmin gets admin dashboard
        'admin': '/admin',
        'head_teacher': '/head-teacher',
        'form_master': '/form-master',
        'class_teacher': '/class-teacher',
        'subject_teacher': '/subject-teacher',
        'teacher': '/subject-teacher' // Redirect generic teacher to subject teacher page
      };

      const redirectPath = roleRoutes[currentRole] || '/subject-teacher'; // Default to subject teacher
      navigate(redirectPath);

    } catch (err) {
      // The error should be handled in the AuthContext now, but we'll set it here as well for safety
      const errorMessage = err.message || 'Login failed';
      setError(errorMessage);
    }
  };

  const handleForgotPassword = () => {
    // ✅ FIXED: Use notification instead of alert
    showNotification({
      message: 'Password reset functionality would be implemented here. Please contact your system administrator.',
      type: 'info'
    });
  };

  const handleSignUp = () => {
    // ✅ FIXED: Use notification instead of alert
    showNotification({
      message: 'New user registration would be implemented here. Please contact your system administrator to create an account.',
      type: 'info'
    });
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      // ✅ FIXED: Use notification instead of alert
      showNotification({
        message: 'Passwords do not match!',
        type: 'error'
      });
      return;
    }

    if (newPassword.length < 6) {
      // ✅ FIXED: Use notification instead of alert
      showNotification({
        message: 'Password must be at least 6 characters long',
        type: 'error'
      });
      return;
    }

    try {
      await changeTeacherPassword(tempUserData.id, password, newPassword);
      // ✅ FIXED: Use notification instead of alert
      showNotification({
        message: 'Password changed successfully! Please login with your new password.',
        type: 'success'
      });
      setShowPasswordChangeModal(false);
      setNewPassword('');
      setConfirmPassword('');
      setTempUserData(null);
      setPassword(''); // Clear the old password field
    } catch (error) {
      // ✅ FIXED: Use notification instead of alert
      showNotification({
        message: 'Error changing password: ' + error.message,
        type: 'error'
      });
    }
  };

  return (
    // Use dynamic background from global settings
    <div 
      className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative"
      style={{
        backgroundImage: settings.backgroundImage ? `url(${settings.backgroundImage})` : 'url(/group-african-kids-learning-together.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Black transparent overlay */}
      <div
        className="absolute inset-0 bg-black"
        style={{ opacity: 0.5 }}
      ></div>
      
      {/* School Logo Watermark */}
      <LogoWatermark opacity={0.08} size="450px" />
      
      {/* Glass Morphism Login Form with Gold Strip Effect */}
      <div className="glass-modal-transparent max-w-md w-full space-y-8 relative z-10">
        <div>
          <div className="flex justify-center mb-6">
            {settings.schoolLogo ? (
              <img 
                src={settings.schoolLogo} 
                alt="School Logo" 
                className="h-20 w-20 object-contain"
              />
            ) : (
              <div className="bg-gray-200 border-2 border-dashed rounded-xl w-20 h-20" />
            )}
          </div>
          <h1 className="mt-6 text-center text-3xl font-extrabold text-gray-900 text-shadow">
            {settings.schoolName}
          </h1>
          <p className="mt-2 text-center text-lg text-gray-800 text-shadow">
            Electronic School Based Assessment System
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-800 mb-1">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="glass-input appearance-none relative block w-full px-4 py-3 placeholder-gray-600 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-800 mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="glass-input appearance-none relative block w-full px-4 py-3 placeholder-gray-600 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-800">
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <button
                type="button"
                onClick={handleForgotPassword}
                className="font-medium text-blue-700 hover:text-blue-600"
              >
                Forgot password?
              </button>
            </div>
          </div>

          {(error) && (
            <div className="glass rounded-md p-4 bg-red-50 border border-red-200">
              <div className="text-red-800 text-sm font-medium text-center">{error}</div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="glass-button-primary w-full flex justify-center py-3 px-4 text-sm font-medium rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </span>
              ) : 'Sign in'}
            </button>
          </div>
          
          <div className="text-center text-sm text-gray-700">
            <p>Don't have an account? <button
              type="button"
              onClick={handleSignUp}
              className="font-medium text-blue-700 hover:text-blue-600"
            >
              Contact administrator
            </button></p>
          </div>
        </form>
        
        {/* Demo Accounts - Only shown in development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="glass rounded-lg p-4 mt-6 bg-blue-50 border border-blue-200">
            <h3 className="text-sm font-bold text-gray-800 mb-2 text-center">Demo Accounts</h3>
            <div className="text-xs text-gray-700 space-y-1">
              <div className="flex justify-between">
                <span>Admin:</span>
                <span>admin@school.com / admin123</span>
              </div>
              <div className="flex justify-between">
                <span>Teacher:</span>
                <span>teacher1@example.com / teacher123</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Password Change Modal */}
      {showPasswordChangeModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-modal-transparent max-w-md w-full">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">🔒 Change Password Required</h2>
            <p className="text-gray-700 mb-6">
              Your password has been reset by an administrator. Please create a new password to continue.
            </p>

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="glass-input w-full px-4 py-3 rounded-lg"
                  placeholder="Enter new password (min 6 characters)"
                  required
                  minLength="6"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="glass-input w-full px-4 py-3 rounded-lg"
                  placeholder="Confirm new password"
                  required
                  minLength="6"
                />
              </div>

              <button
                type="submit"
                className="glass-button-primary w-full py-3 text-white rounded-lg"
              >
                Change Password
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;