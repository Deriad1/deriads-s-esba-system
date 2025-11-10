import { createContext, useContext, useState, useEffect } from 'react';
import { DEFAULT_TERM } from '../constants/terms';

const GlobalSettingsContext = createContext();

const API_BASE_URL = 'http://localhost:3000/api';

const getInitialSettings = () => {
  const storedSettings = localStorage.getItem('globalSettings');
  if (storedSettings) {
    try {
      return JSON.parse(storedSettings);
    } catch (e) {
      console.error('Error parsing stored settings:', e);
    }
  }

  // Return defaults only if nothing in localStorage
  const currentYear = new Date().getFullYear();
  const nextYear = currentYear + 1;
  return {
    schoolName: '',
    schoolLogo: '',
    backgroundImage: '',
    term: DEFAULT_TERM, // 'Third Term' from constants
    academicYear: `${currentYear}/${nextYear}`,
    archivedTerms: []
  };
};

export const GlobalSettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(getInitialSettings);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch settings from backend on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/settings`);
        if (response.ok) {
          const result = await response.json();

          if (result.status === 'success' && result.data) {
            const backendSettings = result.data;

            // Map backend field names to our context format
            const mergedSettings = {
              schoolName: backendSettings.schoolName || '',
              schoolLogo: backendSettings.schoolLogo || '',
              backgroundImage: backendSettings.backgroundImage || '',
              term: backendSettings.term || DEFAULT_TERM,
              academicYear: backendSettings.academicYear || '',
              archivedTerms: [] // Keep archivedTerms in localStorage for now
            };

            // Get archivedTerms from localStorage
            const localSettings = getInitialSettings();
            if (localSettings.archivedTerms) {
              mergedSettings.archivedTerms = localSettings.archivedTerms;
            }

            setSettings(mergedSettings);
            localStorage.setItem('globalSettings', JSON.stringify(mergedSettings));
            console.log('✅ Settings loaded from backend');
          }
        }
      } catch (error) {
        console.error('Error fetching settings from backend:', error);
        // Use localStorage settings as fallback
      } finally {
        setIsLoading(false);
        setIsInitialized(true);
      }
    };

    fetchSettings();
  }, []);

  // Save settings to localStorage and backend whenever they change
  useEffect(() => {
    if (!isInitialized || isLoading) return; // Don't save during initialization

    // Save to localStorage
    localStorage.setItem('globalSettings', JSON.stringify(settings));

    // Save to backend
    const syncToBackend = async () => {
      try {
        // Send settings to backend API
        const settingsToSync = {
          schoolName: settings.schoolName || '',
          schoolLogo: settings.schoolLogo || '',
          backgroundImage: settings.backgroundImage || '',
          term: settings.term || DEFAULT_TERM,
          academicYear: settings.academicYear || ''
        };

        const response = await fetch(`${API_BASE_URL}/settings`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(settingsToSync)
        });

        if (response.ok) {
          const result = await response.json();
          if (result.status === 'success') {
            console.log('✅ Settings synced to backend');
          }
        } else {
          // If settings don't exist yet, create them
          if (response.status === 404) {
            const createResponse = await fetch(`${API_BASE_URL}/settings`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(settingsToSync)
            });

            if (createResponse.ok) {
              console.log('✅ Settings created in backend');
            }
          }
        }
      } catch (error) {
        console.error('⚠️ Error syncing settings to backend:', error);
      }
    };

    syncToBackend();

    // Trigger event for other components to react
    window.dispatchEvent(new CustomEvent('settingsChanged', { detail: settings }));
  }, [settings, isInitialized, isLoading]);

  const updateSettings = (newSettings) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const updateSchoolName = (name) => {
    setSettings(prev => ({ ...prev, schoolName: name }));
  };

  const updateSchoolLogo = (logo) => {
    setSettings(prev => ({ ...prev, schoolLogo: logo }));
  };

  const updateBackgroundImage = (image) => {
    setSettings(prev => ({ ...prev, backgroundImage: image }));
  };

  const updateTerm = (term) => {
    setSettings(prev => ({ ...prev, term }));
  };

  const updateAcademicYear = (year) => {
    setSettings(prev => ({ ...prev, academicYear: year }));
  };

  // Archive current term data
  const archiveCurrentTerm = async () => {
    const archiveKey = `${settings.term}_${settings.academicYear}`;
    
    // Get all current data from localStorage
    const dataToArchive = {
      term: settings.term,
      academicYear: settings.academicYear,
      archivedDate: new Date().toISOString(),
      // Store copies of current term data
      marks: localStorage.getItem('marks') || '{}',
      remarks: localStorage.getItem('remarks') || '{}',
      attendance: localStorage.getItem('attendance') || '{}'
    };

    // Save to archived terms
    localStorage.setItem(`archive_${archiveKey}`, JSON.stringify(dataToArchive));

    // Update archived terms list
    const newArchivedTerms = [
      ...(settings.archivedTerms || []),
      {
        key: archiveKey,
        term: settings.term,
        academicYear: settings.academicYear,
        archivedDate: dataToArchive.archivedDate
      }
    ];

    setSettings(prev => ({ ...prev, archivedTerms: newArchivedTerms }));

    return true;
  };

  // Load archived term data
  const loadArchivedTerm = (archiveKey) => {
    const archived = localStorage.getItem(`archive_${archiveKey}`);
    if (archived) {
      try {
        return JSON.parse(archived);
      } catch (e) {
        console.error('Error loading archived term:', e);
        return null;
      }
    }
    return null;
  };

  // Get list of all archived terms
  const getArchivedTerms = () => {
    return settings.archivedTerms || [];
  };

  // Delete archived term
  const deleteArchivedTerm = (archiveKey) => {
    localStorage.removeItem(`archive_${archiveKey}`);
    
    const newArchivedTerms = settings.archivedTerms.filter(
      term => term.key !== archiveKey
    );
    
    setSettings(prev => ({ ...prev, archivedTerms: newArchivedTerms }));
  };

  const value = {
    settings,
    isLoading,
    updateSettings,
    updateSchoolName,
    updateSchoolLogo,
    updateBackgroundImage,
    updateTerm,
    updateAcademicYear,
    archiveCurrentTerm,
    loadArchivedTerm,
    getArchivedTerms,
    deleteArchivedTerm
  };

  return (
    <GlobalSettingsContext.Provider value={value}>
      {children}
    </GlobalSettingsContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useGlobalSettings = () => {
  const context = useContext(GlobalSettingsContext);
  if (!context) {
    throw new Error('useGlobalSettings must be used within GlobalSettingsProvider');
  }
  return context;
};