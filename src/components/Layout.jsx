import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useGlobalSettings } from '../context/GlobalSettingsContext';
import { useOnlineOffline } from '../context/OnlineOfflineContext';
import RoleSwitcher from './RoleSwitcher';
import LogoWatermark from './LogoWatermark';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const { settings } = useGlobalSettings();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  // Online/Offline mode management
  const {
    isOnline,
    browserOnline,
    toggleOnlineMode,
    pendingChanges,
    syncOfflineChanges,
    isSyncing
  } = useOnlineOffline();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const currentRole = user?.currentRole || user?.primaryRole || user?.role;

  return (
    <div className="min-h-screen relative">
      {/* Removed duplicate background - GlobalBackground handles this now */}

      <LogoWatermark opacity={0.05} size="600px" />

      {/* Navbar */}
      <nav className="glass-card-golden sticky top-0 z-40 shadow-lg">
        <div className="container mx-auto px-2 sm:px-4">
          <div className="flex items-center justify-between h-16">

            {/* Mobile menu button */}
            <button
              onClick={toggleMobileMenu}
              className="md:hidden p-2 rounded-lg hover:bg-white/20 transition-colors"
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>

            {/* Left: School Logo & Name */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              {settings.schoolLogo && (
                <img
                  src={settings.schoolLogo}
                  alt="School Logo"
                  className="h-8 w-8 sm:h-10 sm:w-10 object-contain"
                />
              )}
              <div>
                <h1 className="text-sm sm:text-lg font-bold text-white">
                  {settings.schoolName || "DERIAD'S eSBA"}
                </h1>
                <div className="hidden sm:flex items-center space-x-2 mt-1">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                    {settings.term || "Term 1"}
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                    {settings.academicYear || "Not Set"}
                  </span>
                </div>
              </div>
            </div>

            {/* Center: Role Switcher (Desktop only) */}
            <div className="hidden md:flex flex-1 justify-center">
              <RoleSwitcher />
            </div>

            {/* Right: Settings & User Menu */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Online/Offline Toggle */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={toggleOnlineMode}
                  disabled={!browserOnline}
                  className={`relative inline-flex items-center justify-center h-7 rounded-full w-14 transition-all duration-300 flex-shrink-0 shadow-md border-2 ${
                    isOnline
                      ? 'bg-green-500 border-green-400'
                      : 'bg-gray-500 border-gray-400'
                  } ${!browserOnline ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-lg active:scale-95'}`}
                  style={{ minWidth: '56px', minHeight: '28px', borderRadius: '14px' }}
                  title={!browserOnline ? 'No internet connection' : isOnline ? 'Switch to Offline Mode' : 'Switch to Online Mode'}
                  aria-label={isOnline ? 'Switch to Offline Mode' : 'Switch to Online Mode'}
                >
                  <span
                    className={`absolute w-5 h-5 transform transition-all duration-300 bg-white rounded-full shadow-lg ${
                      isOnline ? 'translate-x-3.5' : '-translate-x-3.5'
                    }`}
                    style={{ left: '50%', marginLeft: '-10px' }}
                  />
                </button>
                {pendingChanges > 0 && (
                  <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                    {pendingChanges} pending
                  </span>
                )}
              </div>

              {/* Settings Button (admin only) - School Setup */}
              {(currentRole === 'admin' || user?.allRoles?.includes('admin') || user?.all_roles?.includes('admin')) && (
                <button
                  onClick={() => navigate('/school-setup')}
                  className="p-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/40 border-2 border-blue-400/50 transition-all active:scale-95 shadow-md backdrop-blur-sm"
                  style={{ minWidth: '44px', minHeight: '44px' }}
                  title="School Settings & Configuration"
                  aria-label="Open School Setup"
                >
                  <svg className="w-6 h-6 text-white drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
              )}

              {/* User Info & Logout */}
              <div className="flex items-center space-x-2 sm:space-x-3 pl-2 sm:pl-4 border-l border-gray-300">
                <div className="text-right hidden lg:block">
                  <p className="text-sm font-semibold text-white">{user?.name}</p>
                  <p className="text-xs text-white/80">{user?.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/40 border-2 border-red-400/50 transition-all active:scale-95 shadow-md backdrop-blur-sm"
                  style={{ minWidth: '44px', minHeight: '44px' }}
                  title="Logout"
                  aria-label="Logout"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Mobile menu (Term/Year info) */}
          {isMobileMenuOpen && (
            <div className="md:hidden pb-4 border-t border-gray-200 mt-2 pt-4">
              <div className="flex items-center justify-center space-x-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                  {settings.term || "Term 1"}
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                  {settings.academicYear || "Not Set"}
                </span>
              </div>
              {/* Role switcher button is now rendered at root level */}
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 relative z-10">
        {children}
      </main>
    </div>
  );
};

export default Layout;