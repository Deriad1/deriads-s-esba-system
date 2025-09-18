import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const TeacherNavbar = () => {
  const { user, logout } = useAuth();
  const [schoolName, setSchoolName] = useState('DERIAD\'S eSBA');
  const [schoolLogo, setSchoolLogo] = useState('');
  const [currentTerm, setCurrentTerm] = useState('First Term');
  const [currentYear, setCurrentYear] = useState('2024/2025');
  const [isMobileView, setIsMobileView] = useState(false);

  useEffect(() => {
    // Get school name, logo, and current term from localStorage
    const storedSchoolName = localStorage.getItem('schoolName');
    const storedSchoolLogo = localStorage.getItem('schoolLogo');
    const storedTerm = localStorage.getItem('currentTerm');
    const storedYear = localStorage.getItem('currentAcademicYear');
    
    if (storedSchoolName) {
      setSchoolName(storedSchoolName);
    }
    
    if (storedSchoolLogo) {
      setSchoolLogo(storedSchoolLogo);
    }
    
    if (storedTerm) {
      setCurrentTerm(storedTerm);
    }
    
    if (storedYear) {
      setCurrentYear(storedYear);
    }

    // Check initial screen size
    checkScreenSize();

    // Add event listener for window resize
    window.addEventListener('resize', checkScreenSize);
    
    // Listen for school name updates
    const handleStorageChange = (e) => {
      if (e.key === 'schoolName') {
        setSchoolName(e.newValue || 'DERIAD\'S eSBA');
      }
      if (e.key === 'schoolLogo') {
        setSchoolLogo(e.newValue || '');
      }
      if (e.key === 'currentTerm') {
        setCurrentTerm(e.newValue || 'First Term');
      }
      if (e.key === 'currentAcademicYear') {
        setCurrentYear(e.newValue || '2024/2025');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('resize', checkScreenSize);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const checkScreenSize = () => {
    setIsMobileView(window.innerWidth < 640); // sm breakpoint in Tailwind
  };

  const handleLogout = () => {
    logout();
  };

  // Only show setup and terms buttons for admin users
  const isAdmin = user?.currentRole === 'admin' || user?.primaryRole === 'admin';

  return (
    <header className="bg-white/10 backdrop-blur-xl border-b border-white/40 ring-1 ring-white/20 shadow-2xl relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Title */}
          <div className="flex items-center space-x-4">
            {schoolLogo && (
              <img 
                src={schoolLogo} 
                alt="School Logo" 
                className="h-10 w-10 object-contain"
              />
            )}
            <h1 className="text-xl font-semibold text-gray-900">
              <span className={`transition-all duration-300 ease-in-out ${isMobileView ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 w-auto'}`}>
                {schoolName}
              </span>
            </h1>
          </div>

          {/* User Info and Controls */}
          <div className="flex items-center space-x-4">
            {/* Current Term Display */}
            <div className="hidden md:flex items-center space-x-2 bg-white/20 backdrop-blur-sm px-3 py-2 rounded-lg border border-white/30">
              <span className="text-sm font-medium text-gray-900">{currentTerm}</span>
              <span className="text-xs text-gray-800">{currentYear}</span>
            </div>
            
            {/* User Info */}
            <div className="flex items-center space-x-3">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-medium text-gray-900">
                  {user?.name || 'Teacher'}
                </div>
              </div>
              
              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="bg-red-600/80 hover:bg-red-700 text-white px-3 py-2 rounded text-sm font-medium transition-colors backdrop-blur-sm border border-red-500/30 hover:border-red-300/50"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default TeacherNavbar;