import React, { useEffect } from 'react';
import { NotificationProvider, useNotification } from './context/NotificationContext';
import { LoadingProvider } from './context/LoadingContext';
import { useOnlineOffline } from './context/OnlineOfflineContext';
import Routes from './Routes';
import Notification from './components/Notification';
import GlobalBackground from './components/GlobalBackground';
import useApiClientInit from './hooks/useApiClientInit';
import './App.css';

// ✅ PERFORMANCE FIX: Removed duplicate AuthProvider and GlobalSettingsProvider
// These are already provided in main.jsx - having them twice caused:
// - Double state management overhead
// - Duplicate API calls on mount
// - Memory leaks and sync issues

// Inner component that has access to both contexts
function AppContent() {
  const { showNotification } = useNotification();
  const { setNotificationHandler } = useOnlineOffline();

  // Initialize API client with online/offline context
  useApiClientInit();

  // Inject notification handler into OnlineOfflineContext
  useEffect(() => {
    if (setNotificationHandler && showNotification) {
      setNotificationHandler(() => showNotification);
    }
  }, [setNotificationHandler, showNotification]);

  return (
    <LoadingProvider>
      <GlobalBackground />
      <div className="App">
        <Routes />
        <Notification />
      </div>
    </LoadingProvider>
  );
}

function App() {
  return (
    <NotificationProvider>
      <AppContent />
    </NotificationProvider>
  );
}

export default App;