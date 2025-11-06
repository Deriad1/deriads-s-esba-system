import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { formatRoleDisplay } from '../utils/roleHelpers';

const RoleSwitcher = () => {
  const { user, switchRole } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  // Close modal on ESC key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!user) return null;

  const allRoles = user.all_roles || (user.role ? [user.role] : [user.primaryRole]);

  if (!allRoles || allRoles.length <= 1) {
    return null;
  }

  const handleRoleSwitch = (newRole) => {
    const success = switchRole(newRole);

    if (success) {
      setIsOpen(false);

      const roleRoutes = {
        'admin': '/admin',
        'head_teacher': '/head-teacher',
        'form_master': '/form-master',
        'class_teacher': '/class-teacher',
        'subject_teacher': '/subject-teacher'
      };

      const route = roleRoutes[newRole] || '/dashboard';
      navigate(route);
    }
  };

  const currentRoleDisplay = formatRoleDisplay(user.currentRole || user.role, user.gender);

  // Glassmorphism role configuration
  const roleConfig = {
    'admin': {
      icon: '👑',
      color: 'purple',
      description: 'Full system access'
    },
    'head_teacher': {
      icon: '🎓',
      color: 'blue',
      description: 'School leadership'
    },
    'form_master': {
      icon: '📋',
      color: 'green',
      description: 'Class management'
    },
    'class_teacher': {
      icon: '👩‍🏫',
      color: 'orange',
      description: 'Teaching & scores'
    },
    'subject_teacher': {
      icon: '📚',
      color: 'indigo',
      description: 'Subject specialist'
    }
  };

  return (
    <>
      {/* Glassmorphism Role Switcher Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="group relative flex items-center gap-3 px-5 py-3 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md transition-all duration-200 shadow-lg hover:shadow-xl border-2 border-white/30 hover:border-white/50"
        aria-label="Switch role"
      >
        <div className="relative flex items-center gap-3">
          {/* Avatar with badge */}
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-yellow-500/90 backdrop-blur-sm flex items-center justify-center shadow-lg border-2 border-white/50">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 border-2 border-white rounded-full flex items-center justify-center shadow-md">
              <span className="text-[8px] font-bold text-white">{allRoles.length}</span>
            </div>
          </div>

          {/* Role info */}
          <div className="flex flex-col items-start">
            <span className="font-bold text-sm text-gray-900 leading-tight">{currentRoleDisplay}</span>
            <span className="text-xs text-gray-700 font-medium flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
              </svg>
              Switch Role
            </span>
          </div>

          {/* Arrow icon */}
          <svg
            className="w-5 h-5 text-gray-700 group-hover:text-gray-900 transition-colors"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </button>

      {/* Glassmorphism Modal - Rendered via Portal */}
      {isOpen && createPortal(
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 overflow-y-auto animate-fade-in"
          onClick={() => setIsOpen(false)}
        >
          {/* Modal Content - Glassmorphism */}
          <div
            className="glass-card-golden w-full max-w-lg max-h-[85vh] my-8 animate-slide-up overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header - Glassmorphism */}
            <div className="glass-card-golden p-6 border-b-4 border-yellow-500/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-yellow-500/90 backdrop-blur-sm flex items-center justify-center text-3xl shadow-lg border-2 border-white/50">
                    🔄
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Switch Role</h2>
                    <p className="text-sm text-white/90 mt-1">Choose your workspace</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-white/30 rounded-xl transition-colors backdrop-blur-sm"
                  aria-label="Close modal"
                >
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Current Role Badge - Glassmorphism */}
            <div className="px-6 pt-6">
              <div className="flex items-center gap-3 p-4 glass-card-golden border-2 border-yellow-500/30">
                <div className="w-10 h-10 rounded-full bg-yellow-500/90 backdrop-blur-sm flex items-center justify-center text-white text-lg shadow-lg border-2 border-white/50">
                  ✓
                </div>
                <div>
                  <p className="text-xs font-medium text-white/80 uppercase tracking-wide">Current Role</p>
                  <p className="text-lg font-bold text-white">{currentRoleDisplay}</p>
                </div>
              </div>
            </div>

            {/* Roles List - Glassmorphism */}
            <div className="flex-1 px-6 py-6 overflow-y-auto overscroll-contain" style={{scrollbarWidth: 'thin'}}>
              <div className="grid gap-3">
                {allRoles.map((role) => {
                  const isActive = role === (user.currentRole || user.role);
                  const roleDisplay = formatRoleDisplay(role, user.gender);
                  const config = roleConfig[role] || roleConfig['subject_teacher'];

                  return (
                    <button
                      key={role}
                      onClick={() => handleRoleSwitch(role)}
                      disabled={isActive}
                      className={`group relative p-5 rounded-xl border-2 transition-all duration-200 backdrop-blur-md ${
                        isActive
                          ? 'bg-gray-900 border-gray-900 cursor-default shadow-xl'
                          : 'glass-card-golden border-yellow-500/30 hover:border-yellow-500/60 hover:shadow-xl cursor-pointer transform hover:scale-[1.02] active:scale-[0.98]'
                      }`}
                    >
                      <div className="relative flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4 min-w-0">
                          {/* Role Icon - Glassmorphism */}
                          <div className={`w-12 h-12 rounded-xl backdrop-blur-md flex items-center justify-center text-2xl shadow-lg border-2 transition-transform duration-200 ${
                            isActive
                              ? 'bg-white border-white/50'
                              : `bg-${config.color}-500/20 border-${config.color}-500/30 group-hover:scale-110`
                          }`}>
                            <span className="text-2xl">{config.icon}</span>
                          </div>

                          {/* Role Info */}
                          <div className="text-left min-w-0">
                            <p className={`font-bold text-lg truncate ${
                              isActive ? 'text-white' : 'text-white'
                            }`}>
                              {roleDisplay}
                            </p>
                            <p className={`text-sm truncate ${
                              isActive ? 'text-gray-300' : 'text-white/80'
                            }`}>
                              {config.description}
                            </p>
                            {!isActive && (
                              <p className="text-xs text-white/60 mt-1">Click to switch →</p>
                            )}
                          </div>
                        </div>

                        {/* Active Badge - Glassmorphism */}
                        {isActive && (
                          <div className="flex-shrink-0">
                            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold bg-green-500/90 backdrop-blur-sm text-white shadow-lg border-2 border-white/50">
                              <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                              Active
                            </span>
                          </div>
                        )}

                        {/* Arrow Icon */}
                        {!isActive && (
                          <svg className="w-6 h-6 text-white/60 group-hover:text-white group-hover:translate-x-1 transition-all flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Footer - Glassmorphism */}
            <div className="px-6 pb-6 pt-2 border-t-2 border-yellow-500/30 glass-card-golden">
              <div className="flex items-center gap-3 text-sm text-white/90">
                <div className="w-8 h-8 rounded-full bg-yellow-500/90 backdrop-blur-sm flex items-center justify-center text-white flex-shrink-0 shadow-md border-2 border-white/50">
                  💡
                </div>
                <p>
                  Each role has its own dashboard with specific tools and features
                </p>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }

        .animate-slide-up {
          animation: slide-up 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        /* Custom scrollbar - Glassmorphism theme */
        .overflow-y-auto::-webkit-scrollbar {
          width: 8px;
        }

        .overflow-y-auto::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.3);
          backdrop-filter: blur(10px);
          border-radius: 10px;
        }

        .overflow-y-auto::-webkit-scrollbar-thumb {
          background: rgba(234, 179, 8, 0.6);
          backdrop-filter: blur(10px);
          border-radius: 10px;
        }

        .overflow-y-auto::-webkit-scrollbar-thumb:hover {
          background: rgba(234, 179, 8, 0.8);
        }
      `}</style>
    </>
  );
};

export default RoleSwitcher;
