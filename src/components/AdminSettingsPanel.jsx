import React, { useState, useRef, useEffect } from 'react';
import { useGlobalSettings } from '../context/GlobalSettingsContext';
import { useOnlineOffline } from '../context/OnlineOfflineContext';
import { useNotification } from '../context/NotificationContext';

const AdminSettingsPanel = ({ isOpen, onClose, onSave }) => {
  const { settings, updateSettings } = useGlobalSettings();
  const { showNotification } = useNotification();
  const {
    isOnline,
    browserOnline,
    toggleOnlineMode,
    pendingChanges,
    failedChanges,
    syncOfflineChanges,
    isSyncing,
    lastSyncTime
  } = useOnlineOffline();
  const [schoolName, setSchoolName] = useState('');
  const [schoolLogo, setSchoolLogo] = useState('');
  const [backgroundImage, setBackgroundImage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const logoInputRef = useRef(null);
  const bgInputRef = useRef(null);

  // Update local state when settings change
  useEffect(() => {
    if (settings) {
      setSchoolName(settings.schoolName || '');
      setSchoolLogo(settings.schoolLogo || '');
      setBackgroundImage(settings.backgroundImage || '');
    }
  }, [settings]);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await updateSettings({
        schoolName: schoolName.trim(),
        schoolLogo,
        backgroundImage
      });

      // Show success message
      showNotification({
        type: 'success',
        title: 'Settings Saved',
        message: 'Settings saved successfully! Changes will be applied immediately.'
      });
      onSave();
    } catch (error) {
      console.error('Error saving settings:', error);
      showNotification({
        type: 'error',
        title: 'Error Saving Settings',
        message: 'Error saving settings. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e, setter) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showNotification({
          type: 'warning',
          title: 'File Too Large',
          message: 'File size must be less than 5MB'
        });
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        showNotification({
          type: 'warning',
          title: 'Invalid File Type',
          message: 'Please select an image file'
        });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setter(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setSchoolLogo('');
    if (logoInputRef.current) {
      logoInputRef.current.value = '';
    }
  };

  const handleRemoveBackground = () => {
    setBackgroundImage('');
    if (bgInputRef.current) {
      bgInputRef.current.value = '';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="glass-card-golden rounded-xl shadow-2xl p-6 w-full max-w-2xl my-8 border-2 border-white/30">
          <div className="flex justify-between items-center mb-6 pb-4 border-b-4 border-yellow-500/50">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500/90 to-orange-600/90 backdrop-blur-sm flex items-center justify-center text-white text-2xl shadow-lg border-2 border-white/50">
                ⚙️
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white text-shadow">School Settings</h2>
                <p className="text-sm text-white/90">Customize your school's appearance and branding</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-white/80 text-2xl font-bold p-2 hover:bg-white/20 rounded-xl transition-colors"
              style={{ minWidth: '44px', minHeight: '44px' }}
            >
              ×
            </button>
          </div>
          
          <div className="space-y-6">
            {/* School Name */}
            <div>
              <label className="block text-sm font-bold text-white mb-2">
                📝 School Name
              </label>
              <input
                type="text"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                placeholder="Enter your school name"
                className="w-full px-4 py-3 bg-white/20 border-2 border-white/30 rounded-xl text-white placeholder-white/60 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 backdrop-blur-md font-medium transition-all"
                style={{ minHeight: '44px', fontSize: '16px' }}
              />
              <p className="text-xs text-white/90 mt-2 font-medium">This will appear in the navigation bar and reports</p>
            </div>

            {/* School Logo */}
            <div>
              <label className="block text-sm font-bold text-white mb-2">
                🏫 School Logo
              </label>
              <input
                type="file"
                accept="image/*"
                ref={logoInputRef}
                onChange={(e) => handleFileChange(e, setSchoolLogo)}
                className="hidden"
              />
              <div className="flex items-center gap-3">
                <button
                  onClick={() => logoInputRef.current.click()}
                  className="px-4 py-3 bg-gradient-to-r from-blue-500/90 to-blue-600/90 border-2 border-white/50 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all font-bold shadow-lg backdrop-blur-md"
                  style={{ minHeight: '44px' }}
                >
                  {schoolLogo ? '🔄 Change Logo' : '📤 Upload Logo'}
                </button>
                {schoolLogo && (
                  <button
                    onClick={handleRemoveLogo}
                    className="px-4 py-3 bg-gradient-to-r from-red-500/90 to-red-600/90 border-2 border-white/50 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all font-bold shadow-lg backdrop-blur-md"
                    style={{ minHeight: '44px' }}
                  >
                    🗑️ Remove
                  </button>
                )}
              </div>
              {schoolLogo && (
                <div className="mt-3 p-4 bg-white/10 border-2 border-white/30 rounded-xl backdrop-blur-md">
                  <img
                    src={schoolLogo}
                    alt="School Logo Preview"
                    className="h-16 w-16 object-contain border-2 border-white/50 rounded-lg bg-white/20 p-2 backdrop-blur-sm"
                  />
                  <p className="text-xs text-white/90 mt-2 font-medium">Logo preview (recommended: square image, max 5MB)</p>
                </div>
              )}
            </div>

            {/* Background Image */}
            <div>
              <label className="block text-sm font-bold text-white mb-2">
                🖼️ Background Image
              </label>
              <input
                type="file"
                accept="image/*"
                ref={bgInputRef}
                onChange={(e) => handleFileChange(e, setBackgroundImage)}
                className="hidden"
              />
              <div className="flex items-center gap-3">
                <button
                  onClick={() => bgInputRef.current.click()}
                  className="px-4 py-3 bg-gradient-to-r from-purple-500/90 to-purple-600/90 border-2 border-white/50 text-white rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all font-bold shadow-lg backdrop-blur-md"
                  style={{ minHeight: '44px' }}
                >
                  {backgroundImage ? '🔄 Change Background' : '📤 Upload Background'}
                </button>
                {backgroundImage && (
                  <button
                    onClick={handleRemoveBackground}
                    className="px-4 py-3 bg-gradient-to-r from-red-500/90 to-red-600/90 border-2 border-white/50 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all font-bold shadow-lg backdrop-blur-md"
                    style={{ minHeight: '44px' }}
                  >
                    🗑️ Remove
                  </button>
                )}
              </div>
              {backgroundImage && (
                <div className="mt-3 p-4 bg-white/10 border-2 border-white/30 rounded-xl backdrop-blur-md">
                  <img
                    src={backgroundImage}
                    alt="Background Preview"
                    className="h-32 w-full object-cover border-2 border-white/50 rounded-lg backdrop-blur-sm"
                  />
                  <p className="text-xs text-white/90 mt-2 font-medium">Background preview (recommended: landscape image, max 5MB)</p>
                </div>
              )}
              <p className="text-xs text-white/90 mt-2 font-medium">This background will be applied to all pages in the system</p>
            </div>

            {/* Online/Offline Mode Section */}
            <div className="border-t-4 border-yellow-500/50 pt-6">
              <div className="flex items-start sm:items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500/90 to-blue-600/90 backdrop-blur-sm flex items-center justify-center text-white text-xl shadow-lg border-2 border-white/50 flex-shrink-0">
                    🌐
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-white">Offline Mode</h3>
                    <p className="text-xs sm:text-sm text-white/90 mt-1">Work without internet connection and sync later</p>
                  </div>
                </div>

                {/* Toggle Switch */}
                <button
                  onClick={toggleOnlineMode}
                  disabled={!browserOnline}
                  className={`relative inline-flex items-center h-8 sm:h-10 rounded-full w-14 sm:w-20 transition-colors flex-shrink-0 shadow-lg border-2 border-white/50 ${
                    isOnline ? 'bg-green-600' : 'bg-gray-600'
                  } ${!browserOnline ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  title={!browserOnline ? 'No internet connection' : isOnline ? 'Switch to Offline Mode' : 'Switch to Online Mode'}
                  aria-label={isOnline ? 'Switch to Offline Mode' : 'Switch to Online Mode'}
                >
                  <span
                    className={`inline-block w-6 sm:w-8 h-6 sm:h-8 transform transition-transform bg-white rounded-full shadow-md ${
                      isOnline ? 'translate-x-7 sm:translate-x-11' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Status Indicator */}
              <div className="bg-white/10 border-2 border-white/30 rounded-xl backdrop-blur-md p-3 sm:p-4 space-y-3">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className={`w-3 h-3 rounded-full flex-shrink-0 shadow-md ${
                    !browserOnline ? 'bg-red-500' : isOnline ? 'bg-green-500' : 'bg-yellow-500'
                  }`}></div>
                  <span className="text-xs sm:text-sm font-bold text-white">
                    Status: {!browserOnline ? 'No Connection' : isOnline ? 'Online' : 'Offline Mode'}
                  </span>
                </div>

                {/* Pending Changes */}
                {pendingChanges > 0 && (
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 p-3 bg-blue-500/20 border-2 border-blue-500/50 rounded-xl backdrop-blur-md">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-xs sm:text-sm font-bold text-white">
                        {pendingChanges} pending change{pendingChanges !== 1 ? 's' : ''}
                        {failedChanges > 0 && (
                          <span className="text-red-300 ml-1">({failedChanges} failed)</span>
                        )}
                      </span>
                    </div>
                    <button
                      onClick={syncOfflineChanges}
                      disabled={!browserOnline || isSyncing}
                      className={`px-3 sm:px-4 py-2 text-xs sm:text-sm rounded-xl font-bold shadow-md whitespace-nowrap ${
                        isSyncing
                          ? 'bg-gray-400/50 cursor-not-allowed text-white/70'
                          : 'bg-gradient-to-r from-blue-500/90 to-blue-600/90 hover:from-blue-600 hover:to-blue-700 text-white border-2 border-white/50 backdrop-blur-md'
                      }`}
                      style={{ minHeight: '36px' }}
                    >
                      {isSyncing ? '⏳ Syncing...' : '🔄 Sync Now'}
                    </button>
                  </div>
                )}

                {/* Last Sync Time */}
                {lastSyncTime && (
                  <div className="text-xs text-white/90 font-medium">
                    ✅ Last sync: {new Date(lastSyncTime).toLocaleString()}
                  </div>
                )}

                {/* Help Text */}
                <p className="text-xs text-white/90 leading-relaxed font-medium">
                  <strong className="text-white">💡 Offline Mode:</strong> When enabled, you can enter marks and make changes without internet.
                  All changes are saved locally and will automatically sync when you go back online or when you click "Sync Now".
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-8 pt-6 border-t-4 border-yellow-500/50">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-white/20 border-2 border-white/30 hover:bg-white/30 text-white rounded-xl font-semibold transition-all backdrop-blur-md shadow-md"
              style={{ minHeight: '44px', minWidth: '100px' }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="px-6 py-3 bg-gradient-to-r from-green-500/90 to-blue-600/90 border-2 border-white/50 text-white rounded-xl hover:from-green-600 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-bold shadow-lg backdrop-blur-md"
              style={{ minHeight: '44px', minWidth: '180px' }}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <span>💾 Save Changes</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettingsPanel;