import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLoading } from '../context/LoadingContext';
import LoadingSpinner from './LoadingSpinner';
import TeacherNavbar from './TeacherNavbar'; // Import the new TeacherNavbar component

const Layout = ({ children }) => {
  const { user, logout, switchUserRole, loading } = useAuth();
  const { isLoading, getLoadingMessage } = useLoading();
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [showSystemSetup, setShowSystemSetup] = useState(false);
  const [showTermManager, setShowTermManager] = useState(false);
  const [schoolName, setSchoolName] = useState('DERIAD\'S eSBA');
  const [tempSchoolName, setTempSchoolName] = useState('');
  const [schoolLogo, setSchoolLogo] = useState('');
  const [backgroundImage, setBackgroundImage] = useState('');
  const [logoUploading, setLogoUploading] = useState(false);
  const [backgroundUploading, setBackgroundUploading] = useState(false);
  
  // Term and Academic Year Management
  const [currentTerm, setCurrentTerm] = useState('First Term');
  const [currentYear, setCurrentYear] = useState('2024/2025');
  const [newAcademicYear, setNewAcademicYear] = useState('');

  // State for responsive school name display
  const [isMobileView, setIsMobileView] = useState(false);

  useEffect(() => {
    // Get school name, logo, and background from localStorage
    const storedSchoolName = localStorage.getItem('schoolName');
    const storedSchoolLogo = localStorage.getItem('schoolLogo');
    const storedBackgroundImage = localStorage.getItem('backgroundImage');
    
    // Get current term and year from localStorage
    const storedTerm = localStorage.getItem('currentTerm');
    const storedYear = localStorage.getItem('currentAcademicYear');
    
    if (storedSchoolName) {
      setSchoolName(storedSchoolName);
      setTempSchoolName(storedSchoolName);
    }
    
    if (storedSchoolLogo) {
      setSchoolLogo(storedSchoolLogo);
    }
    
    if (storedBackgroundImage) {
      setBackgroundImage(storedBackgroundImage);
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
        setTempSchoolName(e.newValue || 'DERIAD\'S eSBA');
      }
      if (e.key === 'schoolLogo') {
        setSchoolLogo(e.newValue || '');
      }
      if (e.key === 'backgroundImage') {
        setBackgroundImage(e.newValue || '');
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

  const handleLogoUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }
      
      setLogoUploading(true);
      const reader = new FileReader();
      reader.onload = (e) => {
        const logoData = e.target.result;
        setSchoolLogo(logoData);
        localStorage.setItem('schoolLogo', logoData);
        setLogoUploading(false);
      };
      reader.onerror = () => {
        alert('Error reading file');
        setLogoUploading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBackgroundUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }
      
      setBackgroundUploading(true);
      const reader = new FileReader();
      reader.onload = (e) => {
        const backgroundData = e.target.result;
        setBackgroundImage(backgroundData);
        localStorage.setItem('backgroundImage', backgroundData);
        setBackgroundUploading(false);
      };
      reader.onerror = () => {
        alert('Error reading file');
        setBackgroundUploading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSchoolNameSubmit = (e) => {
    e.preventDefault();
    if (tempSchoolName.trim()) {
      localStorage.setItem('schoolName', tempSchoolName.trim());
      setSchoolName(tempSchoolName.trim());
      alert('School name updated successfully!');
    }
  };

  const handleRemoveLogo = () => {
    setSchoolLogo('');
    localStorage.removeItem('schoolLogo');
  };

  const handleRemoveBackground = () => {
    setBackgroundImage('');
    localStorage.removeItem('backgroundImage');
  };

  // Term and Academic Year Management Functions

  const switchTerm = (newTerm) => {
    if (newTerm !== currentTerm) {
      const confirmSwitch = confirm(
        `Are you sure you want to switch to ${newTerm}? 

This will:
• Save current term data
• Load ${newTerm} data (fresh if first time)
• Clear any unsaved work`
      );
      
      if (confirmSwitch) {
        setCurrentTerm(newTerm);
        localStorage.setItem('currentTerm', newTerm);
        
        // Trigger a page reload to refresh all data for the new term
        window.location.reload();
      }
    }
  };

  const startNewAcademicYear = () => {
    if (!newAcademicYear.trim()) {
      alert('Please enter a valid academic year (e.g., 2025/2026)');
      return;
    }
    
    const confirmNewYear = confirm(
      `Start new academic year: ${newAcademicYear}?

This will:
• Archive all current year data
• Create fresh system for new year
• Reset to First Term
• Clear all current data

This action cannot be undone!`
    );
    
    if (confirmNewYear) {
      // Archive current year data
      const archiveKey = `archived_${currentYear.replace('/', '_')}`;
      const currentYearData = {
        year: currentYear,
        archivedDate: new Date().toISOString(),
        terms: {}
      };
      
      // Save archive information
      localStorage.setItem(archiveKey, JSON.stringify(currentYearData));
      
      // Clear all current data (teachers, learners, etc.)
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('teachers') || key.includes('learners') || key.includes('students') || key.includes('classes'))) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      // Set new academic year and reset to first term
      setCurrentYear(newAcademicYear.trim());
      setCurrentTerm('First Term');
      localStorage.setItem('currentAcademicYear', newAcademicYear.trim());
      localStorage.setItem('currentTerm', 'First Term');
      
      setNewAcademicYear('');
      setShowTermManager(false);
      
      alert(`New academic year ${newAcademicYear} started successfully!\nSystem reset to First Term with fresh data.`);
      
      // Reload page to refresh all components
      window.location.reload();
    }
  };

  const getAvailableTerms = () => {
    return ['First Term', 'Second Term', 'Third Term'];
  };

  const getTermProgress = () => {
    const terms = getAvailableTerms();
    const currentIndex = terms.indexOf(currentTerm);
    return {
      current: currentIndex + 1,
      total: terms.length,
      percentage: ((currentIndex + 1) / terms.length) * 100
    };
  };

  const handleRoleDropdownToggle = (isOpen) => {
    setShowRoleDropdown(isOpen);
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('roleDropdownToggle', { 
      detail: { isOpen } 
    }));
  };

  const handleRoleSwitch = async (newRole) => {
    // For admins who also have other roles, allow direct access without confirmation
    const isAdminWithMultipleRoles = user?.allRoles?.includes('admin') && user?.allRoles?.length > 1;
    
    // Only show confirmation for non-admin users switching to admin role
    if (newRole === 'admin' && !isAdminWithMultipleRoles && user?.currentRole !== 'admin') {
      const confirmSwitch = window.confirm("Switching to Administrator role. Continue?");
      if (!confirmSwitch) return;
    }
    
    // Always attempt to switch the role, even if it might be the same
    try {
      const success = await switchUserRole(newRole);
      
      // Close the dropdown regardless of success
      handleRoleDropdownToggle(false);
      
      // Provide feedback if the switch failed
      if (!success) {
        console.log('Role switch was not successful');
      }
    } catch (error) {
      console.error('Error during role switch:', error);
      handleRoleDropdownToggle(false);
    }
  };

  // Handle direct access to role in new tab
  const handleDirectRoleAccess = (role) => {
    // Open role-specific page in new tab
    switch(role) {
      case 'head_teacher':
        window.open('/teacher/head-teacher', '_blank');
        break;
      case 'class_teacher':
        window.open('/teacher/class-teacher', '_blank');
        break;
      case 'subject_teacher':
        window.open('/teacher/subject-teacher', '_blank');
        break;
      case 'form_master':
        window.open('/teacher/form-master', '_blank');
        break;
      default:
        // For other roles, just switch normally
        handleRoleSwitch(role);
    }
    
    // Close dropdown
    handleRoleDropdownToggle(false);
  };

  const getCurrentRoleDisplay = () => {
    const currentRole = user?.currentRole || user?.primaryRole || user?.role;
    
    switch(currentRole) {
      case 'admin':
        return 'Administrator';
      case 'head_teacher':
        return 'Head Teacher';
      case 'class_teacher':
        return 'Class Teacher';
      case 'subject_teacher':
        return 'Subject Teacher';
      case 'form_master':
        return 'Form Master';
      default:
        return 'Teacher';
    }
  };

  const getAvailableRoles = () => {
    if (!user?.allRoles) return [];
    
    return user.allRoles.map(role => ({
      value: role,
      label: role === 'admin' ? 'Administrator' :
             role === 'head_teacher' ? 'Head Teacher' :
             role === 'class_teacher' ? 'Class Teacher' :
             role === 'subject_teacher' ? 'Subject Teacher' :
             role === 'form_master' ? 'Form Master' : 'Teacher',
      icon: role === 'admin' ? '🛡️' :
            role === 'head_teacher' ? '🏫' :
            role === 'class_teacher' ? '👨‍🏫' :
            role === 'subject_teacher' ? '📚' :
            role === 'form_master' ? '📋' : '👤'
    }));
  };

  const currentRole = user?.currentRole || user?.primaryRole || user?.role;
  const availableRoles = getAvailableRoles();
  const hasMultipleRoles = availableRoles.length > 1;

  // Get non-admin roles for the admin user
  const nonAdminRoles = user?.allRoles?.filter(role => role !== 'admin') || [];

  // Check if user is admin
  const isAdmin = user?.currentRole === 'admin' || user?.primaryRole === 'admin';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 relative overflow-x-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      {/* Header */}
      {user?.role !== 'teacher' ? (
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
                <span className={`transition-all duration-300 ease-in-out ${isMobileView ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 w-auto'}`}>{schoolName}</span>
              </h1>
            </div>

            {/* User Info and Controls */}
            <div className="flex items-center space-x-4">
              {/* Current Term Display */}
              <div className="hidden md:flex items-center space-x-2 bg-white/20 backdrop-blur-sm px-3 py-2 rounded-lg border border-white/30">
                <span className="text-sm font-medium text-gray-900">{currentTerm}</span>
                <span className="text-xs text-gray-800">{currentYear}</span>
              </div>
              
              {/* Term Manager Button */}
              <button
                onClick={() => setShowTermManager(true)}
                className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-gray-900 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-green-500 backdrop-blur-sm border border-transparent hover:border-white/30"
                title="Term & Year Manager"
              >
                <span className="text-lg">📅</span>
                <span className="hidden sm:inline">Terms</span>
              </button>
              
              {/* System Setup Button */}
              <button
                onClick={() => setShowSystemSetup(true)}
                className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-gray-900 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500 backdrop-blur-sm border border-transparent hover:border-white/30"
                title="System Setup"
              >
                <span className="text-lg">⚙️</span>
                <span className="hidden sm:inline">Setup</span>
              </button>
              
              {/* Role Switcher (if user has multiple roles) */}
              {hasMultipleRoles && (
                <div className="relative">
                  <button
                    onClick={() => handleRoleDropdownToggle(!showRoleDropdown)}
                    disabled={loading}
                    className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-gray-900 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 backdrop-blur-sm border border-transparent hover:border-white/30"
                  >
                    <span className="text-lg">
                      {availableRoles.find(r => r.value === currentRole)?.icon || '👤'}
                    </span>
                    <span>
                      {getCurrentRoleDisplay()}
                    </span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {showRoleDropdown && (
                    <div className="absolute right-0 mt-2 w-64 rounded-lg shadow-2xl bg-white/10 backdrop-blur-xl border border-white/40 ring-1 ring-white/20 z-50">
                      <div className="py-1">
                        <div className="px-4 py-2 text-xs font-semibold text-gray-800 uppercase tracking-wide border-b border-white/30 backdrop-blur-sm">
                          Switch Role
                        </div>
                        {availableRoles.map(role => (
                          <button
                            key={role.value}
                            onClick={() => handleRoleSwitch(role.value)}
                            className={`w-full text-left px-4 py-2 text-sm flex items-center space-x-3 hover:bg-white/20 backdrop-blur-sm ${
                              role.value === currentRole ? 'bg-white/30 text-gray-900 font-medium' : 'text-gray-900'
                            }`}
                          >
                            <span className="text-lg">{role.icon}</span>
                            <span>{role.label}</span>
                            {role.value === currentRole && (
                              <span className="ml-auto text-blue-600">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </span>
                            )}
                          </button>
                        ))}
                        
                        {/* Direct Access Options for Admins with Multiple Roles */}
                        {user?.allRoles?.includes('admin') && 
                         nonAdminRoles.length > 1 && ( // Only show if there are multiple non-admin roles
                          <>
                            <div className="border-t border-white/30 my-1"></div>
                            {nonAdminRoles.map(role => {
                              const roleLabel = role === 'head_teacher' ? 'Head Teacher' :
                                               role === 'class_teacher' ? 'Class Teacher' :
                                               role === 'subject_teacher' ? 'Subject Teacher' :
                                               role === 'form_master' ? 'Form Master' : 'Teacher';
                              const roleIcon = role === 'head_teacher' ? '🏫' :
                                              role === 'class_teacher' ? '👨‍🏫' :
                                              role === 'subject_teacher' ? '📚' :
                                              role === 'form_master' ? '📋' : '👤';
                              
                              return (
                                <button
                                  key={`direct-${role}`}
                                  onClick={() => handleDirectRoleAccess(role)}
                                  className="w-full text-left px-4 py-2 text-sm flex items-center space-x-3 hover:bg-white/20 backdrop-blur-sm text-gray-900"
                                >
                                  <span className="text-lg">{roleIcon}</span>
                                  <span>Access as {roleLabel}</span>
                                  <span className="ml-auto text-gray-500 text-xs">↗</span>
                                </button>
                              );
                            })}
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* User Info */}
              <div className="flex items-center space-x-3">
                <div className="text-right hidden sm:block">
                  <div className="text-sm font-medium text-gray-900">
                    {user?.name || 'User'}
                  </div>
                  <div className="text-xs text-gray-800">
                    {!hasMultipleRoles && getCurrentRoleDisplay()}
                  </div>
                </div>
                
                {/* Logout Button */}
                <button
                  onClick={logout}
                  className="bg-red-600/80 hover:bg-red-700 text-white px-3 py-2 rounded text-sm font-medium transition-colors backdrop-blur-sm border border-red-500/30 hover:border-red-300/50"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>
      ) : (
        <TeacherNavbar />
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Loading Overlay - Only show global loading */}
        {loading && (
          <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-40">
            <LoadingSpinner message="Loading..." size="md" />
          </div>
        )}

        {/* Role Context Alert (optional) */}
        {hasMultipleRoles && (
          <div className={`mb-4 bg-white/10 backdrop-blur-xl border-l-4 border-blue-400 p-4 transition-all duration-300 ease-in-out rounded-lg shadow-2xl border border-white/40 ring-1 ring-white/20 ${
            showRoleDropdown 
              ? 'transform translate-y-full opacity-0 pointer-events-none' 
              : 'transform translate-y-0 opacity-100'
          }`}>
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-900">
                  You are currently acting as <strong>{getCurrentRoleDisplay()}</strong>. 
                  You can switch roles using the dropdown in the top-right corner.
                </p>
              </div>
            </div>
          </div>
        )}

        {children}
      </main>

      {/* Click outside to close dropdown */}
      {showRoleDropdown && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => handleRoleDropdownToggle(false)}
        />
      )}

      {/* Term Manager Modal */}
      {showTermManager && isAdmin && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/10 backdrop-blur-xl rounded-lg shadow-2xl border border-white/40 ring-1 ring-white/20 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Term & Academic Year Manager</h2>
                <button 
                  onClick={() => setShowTermManager(false)} 
                  className="text-4xl text-gray-500 hover:text-gray-800 focus:outline-none"
                >
                  ✕
                </button>
              </div>

              {/* Current Status */}
              <div className="bg-white/20 backdrop-blur-sm border-l-4 border-blue-400 p-4 mb-6 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Current Session</h3>
                    <p className="text-gray-900">
                      <strong>{currentTerm}</strong> - Academic Year <strong>{currentYear}</strong>
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-900 mb-1">Term Progress</div>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 bg-white/30 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${getTermProgress().percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {getTermProgress().current}/{getTermProgress().total}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Term Switching */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Switch Term</h3>
                  <p className="text-sm text-gray-900">
                    Each term maintains separate data. Switching will save current progress and load the selected term's data.
                  </p>
                  
                  <div className="grid gap-33">
                    {getAvailableTerms().map((term) => (
                      <button
                        key={term}
                        onClick={() => switchTerm(term)}
                        disabled={term === currentTerm}
                        className={`p-4 rounded-lg border-2 text-left transition-all duration-200 backdrop-blur-sm ${
                          term === currentTerm
                            ? 'border-blue-500 bg-white/30 text-gray-900 font-medium cursor-not-allowed'
                            : 'border-white/30 hover:border-blue-300 hover:bg-white/20 bg-white/20'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{term}</div>
                            <div className="text-xs text-gray-800">
                              {term === currentTerm ? 'Current Term' : 'Click to switch'}
                            </div>
                          </div>
                          {term === currentTerm && (
                            <span className="text-blue-600">
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* New Academic Year */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Start New Academic Year</h3>
                  <p className="text-sm text-gray-900">
                    Starting a new academic year will archive all current data and create a fresh system.
                  </p>
                  
                  <div className="bg-yellow-500/20 border border-yellow-300/50 rounded-lg p-4 backdrop-blur-sm">
                    <div className="flex items-start space-x-2">
                      <span className="text-yellow-700 mt-0.5">⚠️</span>
                      <div className="text-sm text-yellow-900">
                        <strong>Warning:</strong> This action will:
                        <ul className="list-disc list-inside mt-2 space-y-1">
                          <li>Archive all current year data</li>
                          <li>Clear all teachers, students, and records</li>
                          <li>Reset to First Term</li>
                          <li>Cannot be undone</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-900">New Academic Year</label>
                      <input
                        type="text"
                        value={newAcademicYear}
                        onChange={(e) => setNewAcademicYear(e.target.value)}
                        placeholder="e.g., 2025/2026"
                        className="w-full p-3 border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 bg-white/50 backdrop-blur-sm"
                      />
                    </div>
                    
                    <button
                      onClick={startNewAcademicYear}
                      disabled={!newAcademicYear.trim()}
                      className="w-full bg-red-600/80 text-white py-3 px-4 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors backdrop-blur-sm border border-red-500/30"
                    >
                      Start New Academic Year
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Help Section */}
              <div className="mt-8 bg-white/20 border border-white/30 rounded-lg p-4 backdrop-blur-sm">
                <h4 className="font-medium text-gray-900 mb-2">How It Works</h4>
                <div className="text-sm text-gray-900 space-y-2">
                  <p><strong>Term System:</strong> Each of the 3 terms (First, Second, Third) maintains completely separate data including teachers, students, grades, and reports.</p>
                  <p><strong>Academic Year:</strong> Each academic year is independent. Starting a new year creates a fresh system while archiving the previous year's data.</p>
                  <p><strong>Data Isolation:</strong> Switching terms or years ensures you get a clean environment specific to that period.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* System Setup Modal */}
      {showSystemSetup && isAdmin && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/10 backdrop-blur-xl rounded-lg shadow-2xl border border-white/40 ring-1 ring-white/20 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">System Setup</h2>
                <button 
                  onClick={() => setShowSystemSetup(false)} 
                  className="text-4xl text-gray-500 hover:text-gray-800 focus:outline-none"
                >
                  ✕
                </button>
              </div>

              {/* School Logo Section */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4 text-gray-900">School Logo</h3>
                
                {schoolLogo ? (
                  <div className="flex items-center space-x-4 mb-4">
                    <img 
                      src={schoolLogo} 
                      alt="Current School Logo" 
                      className="h-16 w-16 object-contain border border-white/30 rounded"
                    />
                    <div className="flex-1">
                      <p className="text-sm text-gray-900 mb-2">Current logo uploaded</p>
                      <button
                        onClick={handleRemoveLogo}
                        className="bg-red-600/80 text-white px-4 py-2 rounded text-sm hover:bg-red-700 transition-colors backdrop-blur-sm border border-red-500/30"
                      >
                        Remove Logo
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-900 mb-4">No logo uploaded</p>
                )}
                
                <div className="border-2 border-dashed border-white/30 rounded-lg p-6 text-center backdrop-blur-sm bg-white/20">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    disabled={logoUploading}
                    className="hidden"
                    id="logo-upload"
                  />
                  <label 
                    htmlFor="logo-upload" 
                    className={`cursor-pointer inline-block bg-blue-600/80 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors backdrop-blur-sm border border-blue-500/30 ${
                      logoUploading ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {logoUploading ? 'Uploading...' : 'Choose Logo File'}
                  </label>
                  <p className="text-xs text-gray-900 mt-2">Supported: JPG, PNG, GIF (Max 5MB)</p>
                </div>
              </div>

              {/* Background Image Section */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4 text-gray-900">Background Image</h3>
                
                {backgroundImage ? (
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="relative">
                      <div 
                        className="h-16 w-16 bg-cover bg-center border border-white/30 rounded"
                        style={{ backgroundImage: `url(${backgroundImage})` }}
                      ></div>
                      <div className="absolute inset-0 bg-black bg-opacity-30 rounded flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <span className="text-white text-xs">Preview</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900 mb-2">Current background uploaded</p>
                      <button
                        onClick={handleRemoveBackground}
                        className="bg-red-600/80 text-white px-4 py-2 rounded text-sm hover:bg-red-700 transition-colors backdrop-blur-sm border border-red-500/30"
                      >
                        Remove Background
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-900 mb-4">No background image uploaded</p>
                )}
                
                <div className="border-2 border-dashed border-white/30 rounded-lg p-6 text-center backdrop-blur-sm bg-white/20">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleBackgroundUpload}
                    disabled={backgroundUploading}
                    className="hidden"
                    id="background-upload"
                  />
                  <label 
                    htmlFor="background-upload" 
                    className={`cursor-pointer inline-block bg-blue-600/80 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors backdrop-blur-sm border border-blue-500/30 ${
                      backgroundUploading ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {backgroundUploading ? 'Uploading...' : 'Choose Background Image'}
                  </label>
                  <p className="text-xs text-gray-800 mt-2">Supported: JPG, PNG, GIF (Max 5MB)</p>
                </div>
              </div>

              {/* School Name Section */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-900">School Name</h3>
                <form onSubmit={handleSchoolNameSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-900">Enter School Name</label>
                    <input
                      type="text"
                      value={tempSchoolName}
                      onChange={(e) => setTempSchoolName(e.target.value)}
                      placeholder="e.g., ABC International School"
                      className="w-full p-3 border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 bg-white/50 backdrop-blur-sm"
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowSystemSetup(false)}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50/50 backdrop-blur-sm bg-white/30"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600/80 text-white rounded-lg hover:bg-blue-700 backdrop-blur-sm border border-blue-500/30"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
              
              <div className="text-xs text-gray-900 border-t border-white/30 pt-4 backdrop-blur-sm bg-white/20 p-2 rounded">
                <p><strong>Note:</strong> Changes are saved locally in your browser. Logo will appear in the header and system watermarks will be 3 times larger as per specifications.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;