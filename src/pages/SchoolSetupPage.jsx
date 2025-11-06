import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useGlobalSettings } from '../context/GlobalSettingsContext';
import LogoWatermark from '../components/LogoWatermark';
import { DEFAULT_TERM } from "../constants/terms";

const SchoolSetupPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { 
    settings, 
    updateSchoolName, 
    updateSchoolLogo, 
    updateBackgroundImage,
    updateTerm,
    updateAcademicYear,
    archiveCurrentTerm,
    getArchivedTerms,
    deleteArchivedTerm
  } = useGlobalSettings();

  const [schoolLogo, setSchoolLogo] = useState(settings.schoolLogo || '');
  const [schoolName, setSchoolName] = useState(settings.schoolName || "DERIAD'S eSBA");
  const [backgroundImage, setBackgroundImage] = useState(settings.backgroundImage || '');
  const [currentTerm, setCurrentTerm] = useState(settings.term || 'Term 1');
  const [currentAcademicYear, setCurrentAcademicYear] = useState(settings.academicYear || '');
  
  const [logoUploading, setLogoUploading] = useState(false);
  const [backgroundUploading, setBackgroundUploading] = useState(false);
  const [setupComplete, setSetupComplete] = useState(false);
  const [showSchoolDetailsView, setShowSchoolDetailsView] = useState(false);
  const [showTermManagementView, setShowTermManagementView] = useState(false);
  const [showArchiveView, setShowArchiveView] = useState(false);
  const [archivedTerms, setArchivedTerms] = useState([]);

  const terms = ['Term 1', 'Term 2', 'Term 3'];

  useEffect(() => {
    const currentRole = user?.currentRole || user?.primaryRole || user?.role;
    const allRoles = user?.all_roles || user?.allRoles || [];

    // Allow admin, head_teacher, and superadmin roles
    const allowedRoles = ['admin', 'head_teacher', 'superadmin'];
    const hasAccess = allowedRoles.includes(currentRole) || allRoles.some(role => allowedRoles.includes(role));

    if (!hasAccess) {
      console.log('❌ Access denied to School Setup. Redirecting...');
      navigate('/dashboard');
      return;
    }

    const isSetupComplete = localStorage.getItem('schoolSetupComplete') === 'true';
    if (isSetupComplete) {
      setSetupComplete(true);
    }

    // Load archived terms
    setArchivedTerms(getArchivedTerms());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, navigate]);

  // Generate academic year options
  const generateAcademicYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = -5; i <= 5; i++) {
      const startYear = currentYear + i;
      const endYear = startYear + 1;
      years.push(`${startYear}/${endYear}`);
    }
    return years;
  };

  const handleLogoUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (PNG, JPG, JPEG, GIF)');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert('File size should be less than 2MB');
      return;
    }

    setLogoUploading(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64Logo = e.target.result;
      setSchoolLogo(base64Logo);
      updateSchoolLogo(base64Logo);
      window.dispatchEvent(new CustomEvent('logoUpdated', { detail: base64Logo }));
      setLogoUploading(false);
    };
    reader.onerror = () => {
      setLogoUploading(false);
      alert('Error uploading logo. Please try again.');
    };
    reader.readAsDataURL(file);
  };

  const handleBackgroundUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('File size should be less than 5MB');
      return;
    }

    setBackgroundUploading(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64Image = e.target.result;
      setBackgroundImage(base64Image);
      updateBackgroundImage(base64Image);
      setBackgroundUploading(false);
      alert('Background image uploaded successfully!');
    };
    reader.onerror = () => {
      setBackgroundUploading(false);
      alert('Error uploading background. Please try again.');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    if (confirm('Are you sure you want to remove the school logo?')) {
      setSchoolLogo('');
      updateSchoolLogo('');
      window.dispatchEvent(new CustomEvent('logoUpdated', { detail: '' }));
    }
  };

  const handleRemoveBackground = () => {
    if (confirm('Are you sure you want to remove the background image?')) {
      setBackgroundImage('');
      updateBackgroundImage('');
    }
  };

  const handleSchoolNameChange = (e) => {
    const newName = e.target.value;
    setSchoolName(newName);
    updateSchoolName(newName);
  };

  const handleTermChange = (e) => {
    const newTerm = e.target.value;
    setCurrentTerm(newTerm);
    updateTerm(newTerm);
  };

  const handleAcademicYearChange = (e) => {
    const newYear = e.target.value;
    setCurrentAcademicYear(newYear);
    updateAcademicYear(newYear);
  };

  const handleArchiveTerm = async () => {
    if (!currentTerm || !currentAcademicYear) {
      alert('Please set current term and academic year first');
      return;
    }

    const confirmArchive = confirm(
      `Archive ${currentTerm} (${currentAcademicYear})?\n\n` +
      'This will save all current data and allow you to start fresh for a new term.'
    );

    if (!confirmArchive) return;

    try {
      await archiveCurrentTerm();
      alert(`${currentTerm} (${currentAcademicYear}) archived successfully!`);
      
      // Reload archived terms list
      setArchivedTerms(getArchivedTerms());
      
      // Clear current data for new term
      localStorage.removeItem('marks');
      localStorage.removeItem('remarks');
      localStorage.removeItem('attendance');
      
    } catch (error) {
      console.error('Archive error:', error);
      alert('Error archiving term: ' + error.message);
    }
  };

  const handleDeleteArchive = (archiveKey) => {
    const archive = archivedTerms.find(t => t.key === archiveKey);
    if (!archive) return;

    const confirmDelete = confirm(
      `Delete archived data for ${archive.term} (${archive.academicYear})?\n\n` +
      'This action cannot be undone.'
    );

    if (!confirmDelete) return;

    deleteArchivedTerm(archiveKey);
    setArchivedTerms(getArchivedTerms());
    alert('Archive deleted successfully');
  };

  const completeSetup = () => {
    if (!schoolName.trim()) {
      alert('Please enter a school name');
      return;
    }

    if (!currentTerm || !currentAcademicYear) {
      alert('Please set current term and academic year');
      return;
    }

    // Force save all current settings
    updateSchoolName(schoolName);
    updateSchoolLogo(schoolLogo);
    updateBackgroundImage(backgroundImage);
    updateTerm(currentTerm);
    updateAcademicYear(currentAcademicYear);

    localStorage.setItem('schoolSetupComplete', 'true');
    setSetupComplete(true);

    // Show detailed confirmation
    const summary = `✅ School Setup Complete!\n\n` +
      `School Name: ${schoolName}\n` +
      `Logo: ${schoolLogo ? 'Uploaded ✓' : 'Not uploaded'}\n` +
      `Background: ${backgroundImage ? 'Uploaded ✓' : 'Not uploaded'}\n` +
      `Current Term: ${currentTerm}\n` +
      `Academic Year: ${currentAcademicYear}\n\n` +
      `All settings have been saved!`;

    alert(summary);
  };

  const continueToAdmin = () => {
    navigate('/admin');
  };

  return (
    <div className="min-h-screen relative">
      <LogoWatermark opacity={0.08} size="500px" />
      
      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">School Management System</h1>
          <p className="text-xl text-white/80">Welcome, Administrator</p>
          <p className="text-sm text-white/70 mt-2">Complete your school setup or continue to dashboard</p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          
          {/* School Details Button */}
          <button 
            className="glass-card flex flex-col items-center justify-center min-h-[220px]"
            onClick={() => setShowSchoolDetailsView(!showSchoolDetailsView)}
          >
            <div className="text-5xl mb-4">🏫</div>
            <div className="text-xl font-bold mb-2 text-shadow">
              {showSchoolDetailsView ? 'Hide School Details' : 'School Details'}
            </div>
            <div className="text-sm text-white/80 text-shadow">
              Logo, name, background
            </div>
          </button>

          {/* Term Management Button */}
          <button 
            className="glass-card flex flex-col items-center justify-center min-h-[220px]"
            onClick={() => setShowTermManagementView(!showTermManagementView)}
          >
            <div className="text-5xl mb-4">📅</div>
            <div className="text-xl font-bold mb-2 text-shadow">
              {showTermManagementView ? 'Hide Term Settings' : 'Term Management'}
            </div>
            <div className="text-sm text-white/80 text-shadow">
              Set term & academic year
            </div>
          </button>
          
          {/* Admin Dashboard Button */}
          <button 
            className="glass-card flex flex-col items-center justify-center min-h-[220px]"
            onClick={continueToAdmin}
          >
            <div className="text-5xl mb-4">📊</div>
            <div className="text-xl font-bold mb-2 text-shadow">
              Admin Dashboard
            </div>
            <div className="text-sm text-white/80 text-shadow">
              Continue to administration
            </div>
          </button>
        </div>

        {/* School Details Section */}
        {showSchoolDetailsView && (
          <section className="glass-card mt-6 max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white text-shadow">School Details Configuration</h2>
              <button
                className="glass-button text-white/80 hover:text-white p-1 rounded-full"
                onClick={() => setShowSchoolDetailsView(false)}
                title="Hide School Setup"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-6">
              {/* School Name */}
              <div>
                <label className="block text-sm font-medium text-white mb-3">
                  🏛️ School Name
                </label>
                <input
                  type="text"
                  value={schoolName}
                  onChange={handleSchoolNameChange}
                  placeholder="Enter your school name"
                  className="glass-input w-full p-4 rounded-lg text-lg placeholder-white/70"
                />
                <p className="text-xs text-white/80 mt-2">This will appear on all reports and documents</p>
              </div>

              {/* School Logo */}
              <div>
                <label className="block text-sm font-medium text-white mb-3">
                  🖼️ School Logo
                </label>
                
                {schoolLogo ? (
                  <div className="glass rounded-lg p-6 text-center">
                    <div className="space-y-4">
                      <div className="flex justify-center">
                        <img 
                          src={schoolLogo} 
                          alt="School Logo" 
                          className="max-w-32 max-h-32 object-contain rounded p-2"
                          style={{ filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.1))' }}
                        />
                      </div>
                      <div className="text-sm text-white font-medium">Current School Logo</div>
                      <div className="flex justify-center gap-3">
                        <button 
                          className="glass-button-primary text-white px-4 py-2 rounded"
                          onClick={() => document.getElementById('logoInput').click()}
                          disabled={logoUploading}
                        >
                          🔄 Replace Logo
                        </button>
                        <button 
                          className="glass-button-danger text-white px-4 py-2 rounded"
                          onClick={handleRemoveLogo}
                          disabled={logoUploading}
                        >
                          🗑️ Remove Logo
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div 
                    className="glass border-2 border-dashed rounded-lg p-8 text-center cursor-pointer"
                    onClick={() => document.getElementById('logoInput').click()}
                  >
                    <div className="space-y-3">
                      <div className="text-5xl text-white/70">🖼️</div>
                      <div className="text-lg font-bold text-white text-shadow">
                        {logoUploading ? 'Uploading Logo...' : 'Upload School Logo'}
                      </div>
                      <div className="text-sm text-white/80 text-shadow">
                        Click here or drag and drop your school logo
                      </div>
                      <div className="text-xs text-white/70">
                        PNG, JPG, JPEG, GIF | Max 2MB
                      </div>
                      {logoUploading && (
                        <div className="flex justify-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                <input 
                  id="logoInput"
                  type="file" 
                  accept="image/*" 
                  onChange={handleLogoUpload}
                  className="hidden"
                  disabled={logoUploading}
                />
              </div>

              {/* Background Image */}
              <div>
                <label className="block text-sm font-medium text-white mb-3">
                  🎨 Background Image (Login Page)
                </label>
                
                {backgroundImage ? (
                  <div className="glass rounded-lg p-6">
                    <div className="space-y-4">
                      <div className="flex justify-center">
                        <img 
                          src={backgroundImage} 
                          alt="Background" 
                          className="max-w-full h-48 object-cover rounded"
                        />
                      </div>
                      <div className="flex justify-center gap-3">
                        <button 
                          className="glass-button-primary text-white px-4 py-2 rounded"
                          onClick={() => document.getElementById('backgroundInput').click()}
                          disabled={backgroundUploading}
                        >
                          🔄 Replace Background
                        </button>
                        <button 
                          className="glass-button-danger text-white px-4 py-2 rounded"
                          onClick={handleRemoveBackground}
                          disabled={backgroundUploading}
                        >
                          🗑️ Remove Background
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div 
                    className="glass border-2 border-dashed rounded-lg p-8 text-center cursor-pointer"
                    onClick={() => document.getElementById('backgroundInput').click()}
                  >
                    <div className="space-y-3">
                      <div className="text-5xl text-white/70">🎨</div>
                      <div className="text-lg font-bold text-white">
                        {backgroundUploading ? 'Uploading...' : 'Upload Background Image'}
                      </div>
                      <div className="text-xs text-white/70">
                        PNG, JPG, JPEG | Max 5MB
                      </div>
                    </div>
                  </div>
                )}
                
                <input 
                  id="backgroundInput"
                  type="file" 
                  accept="image/*" 
                  onChange={handleBackgroundUpload}
                  className="hidden"
                  disabled={backgroundUploading}
                />
              </div>
            </div>
          </section>
        )}

        {/* Term Management Section */}
        {showTermManagementView && (
          <section className="glass-card mt-6 max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white text-shadow">Term & Academic Year Management</h2>
              <button
                className="glass-button text-white/80 hover:text-white p-1 rounded-full"
                onClick={() => setShowTermManagementView(false)}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              {/* Current Term Selection */}
              <div className="glass rounded-lg p-4">
                <h3 className="text-lg font-bold text-white mb-3">Current Term</h3>
                <select
                  value={currentTerm}
                  onChange={handleTermChange}
                  className="glass-input w-full p-3 rounded-lg"
                >
                  {terms.map(term => (
                    <option key={term} value={term}>{term}</option>
                  ))}
                </select>
              </div>

              {/* Academic Year Selection */}
              <div className="glass rounded-lg p-4">
                <h3 className="text-lg font-bold text-white mb-3">Academic Year</h3>
                <select
                  value={currentAcademicYear}
                  onChange={handleAcademicYearChange}
                  className="glass-input w-full p-3 rounded-lg"
                >
                  <option value="">Select Academic Year</option>
                  {generateAcademicYears().map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>

              {/* Current Status Display */}
              <div className="glass rounded-lg p-4 bg-blue-50">
                <h3 className="text-lg font-bold text-blue-900 mb-2">Active Period</h3>
                <p className="text-blue-800 text-xl font-semibold">
                  {currentTerm} - {currentAcademicYear || 'Not Set'}
                </p>
                <p className="text-blue-700 text-sm mt-2">
                  All data entry and reports will use this term and year
                </p>
              </div>

              {/* Archive Current Term */}
              <div className="glass rounded-lg p-4">
                <h3 className="text-lg font-bold text-white mb-3">Archive Current Term</h3>
                <p className="text-sm text-white/80 mb-4">
                  Archive the current term's data before moving to a new term. This saves all marks, remarks, and attendance data.
                </p>
                <button
                  onClick={handleArchiveTerm}
                  className="glass-button-primary text-white px-4 py-2 rounded w-full"
                  disabled={!currentTerm || !currentAcademicYear}
                >
                  📦 Archive {currentTerm} ({currentAcademicYear})
                </button>
              </div>

              {/* View Archived Terms */}
              <div className="glass rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-bold text-white">Archived Terms</h3>
                  <button
                    onClick={() => setShowArchiveView(!showArchiveView)}
                    className="glass-button px-3 py-1 rounded text-sm"
                  >
                    {showArchiveView ? 'Hide' : 'Show'} Archives ({archivedTerms.length})
                  </button>
                </div>

                {showArchiveView && (
                  <div className="space-y-2 mt-4">
                    {archivedTerms.length === 0 ? (
                      <p className="text-white/70 text-sm">No archived terms yet</p>
                    ) : (
                      archivedTerms.map(archive => (
                        <div key={archive.key} className="glass-ultra-light rounded p-3 flex justify-between items-center">
                          <div>
                            <p className="font-semibold text-white">
                              {archive.term} ({archive.academicYear})
                            </p>
                            <p className="text-xs text-white/70">
                              Archived: {new Date(archive.archivedDate).toLocaleDateString()}
                            </p>
                          </div>
                          <button
                            onClick={() => handleDeleteArchive(archive.key)}
                            className="glass-button-danger text-white px-3 py-1 rounded text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Complete Setup Button */}
        <div className="max-w-6xl mx-auto mt-6">
          <button 
            onClick={completeSetup}
            className={`w-full py-4 px-6 rounded-lg font-semibold text-lg ${
              setupComplete 
                ? 'glass-button-success text-white cursor-default' 
                : 'glass-button-primary text-white'
            }`}
            disabled={setupComplete}
          >
            {setupComplete ? (
              <span className="flex items-center justify-center">
                <span className="mr-2">✅</span>
                Setup Complete
              </span>
            ) : (
              <span className="flex items-center justify-center">
                <span className="mr-2">💾</span>
                Complete School Setup
              </span>
            )}
          </button>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-white/70">
          <p className="text-sm">
            {schoolName} - School Management System
          </p>
        </div>
      </div>
    </div>
  );
};

export default SchoolSetupPage;