import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Godmode Developer Panel
 * Allows developers to quickly navigate to any page during development
 *
 * To enable: Set VITE_GODMODE=true in .env file
 * To disable: Remove or set VITE_GODMODE=false
 */
const GodmodePanel = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true);

  // Check if Godmode is enabled
  const isGodmodeEnabled = import.meta.env.VITE_GODMODE === 'true' ||
                          import.meta.env.DEV;

  // Don't render if Godmode is not enabled
  if (!isGodmodeEnabled) {
    return null;
  }

  // All available routes
  const routes = [
    { path: '/', name: '🔐 Login', color: 'gray' },
    { path: '/admin', name: '👑 Admin Dashboard', color: 'purple', role: 'admin' },
    { path: '/manage-users', name: '👥 Manage Users', color: 'blue', role: 'admin' },
    { path: '/school-setup', name: '⚙️ School Setup', color: 'indigo', role: 'admin' },
    { path: '/head-teacher', name: '🎓 Head Teacher', color: 'red', role: 'head_teacher' },
    { path: '/form-master', name: '📋 Form Master', color: 'orange', role: 'form_master' },
    { path: '/class-teacher', name: '🏫 Class Teacher', color: 'green', role: 'class_teacher' },
    { path: '/subject-teacher', name: '📚 Subject Teacher', color: 'blue', role: 'subject_teacher' },
    { path: '/mock-exam-aggregates', name: '📊 Mock Exam Aggregates', color: 'pink', role: 'any' },
    { path: '/notification-demo', name: '🔔 Notification Demo', color: 'yellow', role: 'admin' },
    { path: '/diagnostic', name: '🔧 Diagnostic', color: 'red', role: 'admin' },
  ];

  const handleNavigate = (path) => {
    navigate(path);
    setIsOpen(false);
  };

  const getColorClass = (color) => {
    const colors = {
      gray: 'bg-gray-500 hover:bg-gray-600',
      purple: 'bg-purple-500 hover:bg-purple-600',
      blue: 'bg-blue-500 hover:bg-blue-600',
      indigo: 'bg-indigo-500 hover:bg-indigo-600',
      red: 'bg-red-500 hover:bg-red-600',
      orange: 'bg-orange-500 hover:bg-orange-600',
      green: 'bg-green-500 hover:bg-green-600',
      pink: 'bg-pink-500 hover:bg-pink-600',
      yellow: 'bg-yellow-500 hover:bg-yellow-600',
    };
    return colors[color] || colors.blue;
  };

  return (
    <>
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 right-4 z-[10000] bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 rounded-full shadow-2xl hover:shadow-pink-500/50 transition-all duration-300 hover:scale-110 border-4 border-white/50 backdrop-blur-sm animate-pulse"
          style={{ minWidth: '60px', minHeight: '60px' }}
          title="Open Godmode Panel (Developer Mode)"
        >
          <span className="text-2xl">⚡</span>
        </button>
      )}

      {/* Panel */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 z-[10000] bg-black/95 backdrop-blur-xl border-4 border-purple-500 rounded-2xl shadow-2xl w-96 max-h-[80vh] overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4 flex justify-between items-center border-b-4 border-purple-400">
            <div className="flex items-center gap-2">
              <span className="text-2xl animate-bounce">⚡</span>
              <div>
                <h3 className="text-white font-bold text-lg">GODMODE</h3>
                <p className="text-white/80 text-xs">Developer Panel</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
                style={{ minWidth: '36px', minHeight: '36px' }}
              >
                {isMinimized ? '▼' : '▲'}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
                style={{ minWidth: '36px', minHeight: '36px' }}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Content */}
          {!isMinimized && (
            <div className="p-4 max-h-96 overflow-y-auto">
              {/* Current Info */}
              <div className="bg-white/10 border-2 border-purple-400/50 rounded-xl p-3 mb-4">
                <p className="text-white/70 text-xs mb-1">Current Page:</p>
                <p className="text-white font-bold text-sm">{location.pathname}</p>
                {user && (
                  <>
                    <p className="text-white/70 text-xs mt-2 mb-1">Logged in as:</p>
                    <p className="text-white font-bold text-sm">{user.name} ({user.currentRole || user.primaryRole || user.role})</p>
                  </>
                )}
              </div>

              {/* Navigation Buttons */}
              <div className="space-y-2">
                <p className="text-white/70 text-xs font-bold mb-2">📍 QUICK NAVIGATION:</p>
                {routes.map((route) => (
                  <button
                    key={route.path}
                    onClick={() => handleNavigate(route.path)}
                    disabled={location.pathname === route.path}
                    className={`w-full text-left px-4 py-3 rounded-xl text-white font-bold transition-all shadow-lg border-2 border-white/30 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 ${
                      location.pathname === route.path
                        ? 'bg-green-600 border-green-400'
                        : getColorClass(route.color)
                    }`}
                    style={{ minHeight: '48px' }}
                  >
                    <div className="flex items-center justify-between">
                      <span>{route.name}</span>
                      {location.pathname === route.path && (
                        <span className="text-xs">✓ Current</span>
                      )}
                    </div>
                    {route.role && (
                      <div className="text-xs text-white/70 mt-1">
                        Role: {route.role}
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {/* Warning */}
              <div className="mt-4 bg-red-500/20 border-2 border-red-500/50 rounded-xl p-3">
                <p className="text-red-300 text-xs font-bold">⚠️ DEVELOPMENT ONLY</p>
                <p className="text-red-200/80 text-xs mt-1">
                  This panel bypasses normal access controls. Disable before production by removing VITE_GODMODE from .env
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default GodmodePanel;
