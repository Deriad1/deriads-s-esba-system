import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LogoWatermark from '../components/LogoWatermark';

const SchoolSetupPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [schoolLogo, setSchoolLogo] = useState(localStorage.getItem('schoolLogo') || '');
  const [schoolName, setSchoolName] = useState(localStorage.getItem('schoolName') || 'DERIAD\'S eSBA');
  const [logoUploading, setLogoUploading] = useState(false);
  const [setupComplete, setSetupComplete] = useState(false);
  const [showSchoolDetailsView, setShowSchoolDetailsView] = useState(false);

  useEffect(() => {
    // Check if user is admin
    const currentRole = user?.currentRole || user?.primaryRole || user?.role;
    if (currentRole !== 'admin') {
      navigate('/dashboard');
      return;
    }

    // Check if setup is already complete
    const isSetupComplete = localStorage.getItem('schoolSetupComplete') === 'true';
    if (isSetupComplete) {
      setSetupComplete(true);
    }
  }, [user, navigate]);

  // Handle logo upload
  const handleLogoUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (PNG, JPG, JPEG, GIF)');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('File size should be less than 2MB');
      return;
    }

    setLogoUploading(true);

    // Convert to base64 for storage
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64Logo = e.target.result;
      setSchoolLogo(base64Logo);
      localStorage.setItem('schoolLogo', base64Logo);
      
      // Trigger custom event for same-tab updates
      window.dispatchEvent(new CustomEvent('logoUpdated', { detail: base64Logo }));
      
      setLogoUploading(false);
    };
    reader.onerror = () => {
      setLogoUploading(false);
      alert('Error uploading logo. Please try again.');
    };
    reader.readAsDataURL(file);
  };

  // Remove logo
  const handleRemoveLogo = () => {
    if (confirm('Are you sure you want to remove the school logo?')) {
      setSchoolLogo('');
      localStorage.removeItem('schoolLogo');
      
      // Trigger custom event for same-tab updates
      window.dispatchEvent(new CustomEvent('logoUpdated', { detail: '' }));
    }
  };

  // Handle school name change
  const handleSchoolNameChange = (e) => {
    const newName = e.target.value;
    setSchoolName(newName);
    localStorage.setItem('schoolName', newName);
  };

  // Complete setup and mark as done
  const completeSetup = () => {
    if (!schoolName.trim()) {
      alert('Please enter a school name');
      return;
    }

    localStorage.setItem('schoolSetupComplete', 'true');
    setSetupComplete(true);
    alert('School setup completed successfully!');
  };

  // Continue to admin dashboard
  const continueToAdmin = () => {
    navigate('/admin');
  };

  return (
    <div className="min-h-screen bg-gray-100 relative">
      {/* Logo Watermark */}
      <LogoWatermark opacity={0.08} size="500px" />
      
      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">School Management System</h1>
          <p className="text-xl text-gray-600">Welcome, Administrator</p>
          <p className="text-sm text-gray-500 mt-2">Complete your school setup or continue to dashboard</p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          
          {/* Section 1: Set Up School Details Button */}
          <button 
            className="relative bg-white/5 backdrop-blur-2xl text-gray-800 px-8 py-8 rounded-xl border border-white/20 hover:border-white/40 hover:shadow-2xl transition-all duration-300 group overflow-hidden min-h-[220px] flex flex-col items-center justify-center shadow-xl hover:shadow-white/10 hover:scale-105 hover:-translate-y-1 hover:bg-white/8"
            onClick={() => setShowSchoolDetailsView(!showSchoolDetailsView)}
          >
            <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="absolute inset-0 rounded-xl border-2 border-white/30 shadow-[0_0_30px_rgba(255,255,255,0.2)]">
              </div>
            </div>
            <div className="relative z-10 text-center">
              <div className="text-5xl mb-4 group-hover:text-gray-800 transition-colors duration-300 drop-shadow-lg">🏫</div>
              <div className="text-xl font-semibold group-hover:text-gray-800 transition-colors duration-300 mb-2 drop-shadow-sm">
                {showSchoolDetailsView ? 'Hide School Setup' : 'Set Up School Details'}
              </div>
              <div className="text-sm text-gray-600 group-hover:text-gray-700 transition-colors duration-300 drop-shadow-sm">
                Configure school information
              </div>
            </div>
          </button>
          
          {/* Section 2: Continue to Admin Dashboard Button */}
          <button 
            className="relative bg-white/5 backdrop-blur-2xl text-gray-800 px-8 py-8 rounded-xl border border-white/20 hover:border-white/40 hover:shadow-2xl transition-all duration-300 group overflow-hidden min-h-[220px] flex flex-col items-center justify-center shadow-xl hover:shadow-white/10 hover:scale-105 hover:-translate-y-1 hover:bg-white/8"
            onClick={continueToAdmin}
          >
            <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="absolute inset-0 rounded-xl border-2 border-white/30 shadow-[0_0_30px_rgba(255,255,255,0.2)]">
              </div>
            </div>
            <div className="relative z-10 text-center">
              <div className="text-5xl mb-4 group-hover:text-gray-800 transition-colors duration-300 drop-shadow-lg">📊</div>
              <div className="text-xl font-semibold group-hover:text-gray-800 transition-colors duration-300 mb-2 drop-shadow-sm">
                Admin Dashboard
              </div>
              <div className="text-sm text-gray-600 group-hover:text-gray-700 transition-colors duration-300 drop-shadow-sm">
                Continue to administration
              </div>
            </div>
          </button>
        </div>
        {/* School Details Setup Section */}
        {showSchoolDetailsView && (
          <section className="bg-white/3 backdrop-blur-2xl p-6 rounded-lg shadow-2xl border border-white/15 mt-6 ring-1 ring-white/10 animate-in slide-in-from-top-5 duration-500">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800 drop-shadow-sm">School Details Configuration</h2>
              <button 
                className="text-gray-600 hover:text-gray-800 transition-all duration-200 p-1 rounded-full hover:bg-white/20 hover:scale-110"
                onClick={() => setShowSchoolDetailsView(false)}
                title="Hide School Setup"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="bg-blue-500/15 backdrop-blur-sm border border-gray-500/40 rounded p-4 shadow-md">
                <div className="text-sm font-medium text-blue-800 mb-2 drop-shadow-sm">🏫 School Information Setup</div>
                <div className="text-xs text-blue-700 space-y-1">
                  <div>• <strong>School Name:</strong> Configure your institution's official name</div>
                  <div>• <strong>School Logo:</strong> Upload your official logo for branding</div>
                  <div>• <strong>Watermark Integration:</strong> Logo appears on all official documents</div>
                </div>
              </div>

              {/* School Name Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3 drop-shadow-sm">
                  🏦 School Name
                </label>
                <input
                  type="text"
                  value={schoolName}
                  onChange={handleSchoolNameChange}
                  placeholder="Enter your school name"
                  className="w-full p-4 border border-gray-500/40 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg bg-white/25 backdrop-blur-sm placeholder-gray-600 shadow-md transition-all duration-200 hover:border-gray-400/60"
                />
                <p className="text-xs text-gray-600 mt-2 drop-shadow-sm">This will appear on all reports and documents</p>
              </div>

              {/* School Logo Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3 drop-shadow-sm">
                  🖼️ School Logo
                </label>
                
                {schoolLogo ? (
                  /* Current Logo Display */
                  <div className="border-2 border-dashed border-white/40 rounded-lg p-6 text-center bg-white/10 backdrop-blur-sm">
                    <div className="space-y-4">
                      <div className="flex justify-center">
                        <img 
                          src={schoolLogo} 
                          alt="School Logo" 
                          className="max-w-32 max-h-32 object-contain border border-white/30 rounded p-2 bg-white/20 backdrop-blur-sm"
                          style={{ filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.1))' }}
                        />
                      </div>
                      <div className="text-sm text-gray-700 drop-shadow-sm">Current School Logo</div>
                      <div className="flex justify-center gap-3">
                        <button 
                          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors text-sm"
                          onClick={() => document.getElementById('logoInput').click()}
                          disabled={logoUploading}
                        >
                          🔄 Replace Logo
                        </button>
                        <button 
                          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors text-sm"
                          onClick={handleRemoveLogo}
                          disabled={logoUploading}
                        >
                          🗑️ Remove Logo
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Upload Area */
                  <div 
                    className="border-2 border-dashed border-gray-500/50 rounded-lg p-8 text-center hover:border-gray-400/60 transition-all duration-300 cursor-pointer bg-white/15 hover:bg-blue-500/10 backdrop-blur-sm shadow-lg hover:scale-105"
                    onClick={() => document.getElementById('logoInput').click()}
                  >
                    <div className="space-y-3">
                      <div className="text-5xl text-gray-500 drop-shadow-lg">🖼️</div>
                      <div className="text-lg font-medium text-gray-700 drop-shadow-sm">
                        {logoUploading ? 'Uploading Logo...' : 'Upload School Logo'}
                      </div>
                      <div className="text-sm text-gray-600 drop-shadow-sm">
                        Click here or drag and drop your school logo
                      </div>
                      <div className="text-xs text-gray-500 drop-shadow-sm">
                        PNG, JPG, JPEG, GIF | Max 2MB | Transparent background recommended
                      </div>
                      {logoUploading && (
                        <div className="flex justify-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Hidden File Input */}
                <input 
                  id="logoInput"
                  type="file" 
                  accept="image/*" 
                  onChange={handleLogoUpload}
                  className="hidden"
                  disabled={logoUploading}
                />
              </div>

              {/* Watermark Preview */}
              {schoolLogo && (
                <div className="bg-gray-50 border border-gray-200 rounded p-4">
                  <div className="text-sm font-medium text-gray-800 mb-3">🔍 Watermark Preview</div>
                  <div className="relative bg-white border rounded p-4 min-h-24">
                    <div className="relative z-10">
                      <h3 className="text-lg font-bold text-gray-800">{schoolName}</h3>
                      <p className="text-sm text-gray-600">Student Academic Report</p>
                      <p className="text-xs text-gray-500">Watermark appears behind content</p>
                    </div>
                    
                    {/* Watermark */}
                    <div 
                      className="absolute inset-0 flex items-center justify-center pointer-events-none"
                      style={{
                        backgroundImage: `url(${schoolLogo})`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'center',
                        backgroundSize: '80px',
                        opacity: 0.1
                      }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Complete Setup Button */}
              <button 
                onClick={completeSetup}
                className={`w-full py-4 px-6 rounded-lg font-semibold text-lg transition-all duration-300 ${
                  setupComplete 
                    ? 'bg-green-600 text-white cursor-default' 
                    : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg hover:scale-105'
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

              {setupComplete && (
                <div className="bg-green-50 border border-green-200 rounded p-3 text-center">
                  <div className="text-sm text-green-800">
                    ✅ School details have been configured successfully!
                  </div>
                </div>
              )}
            </div>
          </section>
        )}



        {/* Footer */}
        <div className="text-center mt-8 text-gray-500">
          <p className="text-sm">
            {schoolName} - School Management System
          </p>
        </div>
      </div>
    </div>
  );
};

export default SchoolSetupPage;