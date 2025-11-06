import React, { createContext, useContext, useState, useEffect } from 'react';

const OnlineOfflineContext = createContext();

export const useOnlineOffline = () => {
  const context = useContext(OnlineOfflineContext);
  if (!context) {
    throw new Error('useOnlineOffline must be used within OnlineOfflineProvider');
  }
  return context;
};

export const OnlineOfflineProvider = ({ children }) => {
  // Optional notification support - will be undefined if NotificationContext is not available
  const [notificationHandler, setNotificationHandler] = useState(null);

  // Helper to show notification if available
  const showNotification = (notification) => {
    if (notificationHandler) {
      notificationHandler(notification);
    } else {
      console.log('[OnlineOffline]', notification.title, '-', notification.message);
    }
  };
  const [isOnline, setIsOnline] = useState(() => {
    // Check localStorage for saved preference, default to true (online)
    const saved = localStorage.getItem('isOnlineMode');
    return saved === null ? true : saved === 'true';
  });
  const [syncQueue, setSyncQueue] = useState(() => {
    // Load sync queue from localStorage
    const saved = localStorage.getItem('syncQueue');
    return saved ? JSON.parse(saved) : [];
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(() => {
    const saved = localStorage.getItem('lastSyncTime');
    return saved ? new Date(saved) : null;
  });

  // Detect browser online/offline status
  const [browserOnline, setBrowserOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setBrowserOnline(true);
      showNotification({
        type: 'success',
        title: 'Connection Restored',
        message: 'You are back online'
      });
      // Auto-sync when connection is restored
      if (isOnline && syncQueue.length > 0) {
        syncOfflineChanges();
      }
    };

    const handleOffline = () => {
      setBrowserOnline(false);
      showNotification({
        type: 'warning',
        title: 'No Internet Connection',
        message: 'You are now offline. Changes will be synced when connection is restored.'
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isOnline, syncQueue]);

  // Save isOnline preference to localStorage
  useEffect(() => {
    localStorage.setItem('isOnlineMode', isOnline.toString());
  }, [isOnline]);

  // Save sync queue to localStorage
  useEffect(() => {
    localStorage.setItem('syncQueue', JSON.stringify(syncQueue));
  }, [syncQueue]);

  // Toggle online/offline mode
  const toggleOnlineMode = () => {
    const newMode = !isOnline;
    setIsOnline(newMode);

    if (newMode) {
      showNotification({
        type: 'success',
        title: 'Online Mode Enabled',
        message: 'You are now in online mode. Changes will be saved to the server.'
      });
      // Auto-sync when switching to online mode
      if (syncQueue.length > 0) {
        syncOfflineChanges();
      }
    } else {
      showNotification({
        type: 'info',
        title: 'Offline Mode Enabled',
        message: 'You are now in offline mode. Changes will be saved locally and synced when you go online.'
      });
    }
  };

  // Add an action to the sync queue
  const addToSyncQueue = (action) => {
    const queueItem = {
      id: Date.now() + Math.random(), // Unique ID
      timestamp: new Date().toISOString(),
      action: action.type, // 'UPDATE_MARKS', 'UPDATE_REMARKS', 'ADD_STUDENT', etc.
      data: action.data,
      endpoint: action.endpoint,
      method: action.method || 'POST',
      status: 'pending' // 'pending', 'syncing', 'success', 'failed'
    };

    setSyncQueue(prev => [...prev, queueItem]);

    showNotification({
      type: 'info',
      title: 'Saved Locally',
      message: 'Your changes have been saved locally and will sync when online.'
    });

    return queueItem.id;
  };

  // Remove an item from sync queue
  const removeFromSyncQueue = (itemId) => {
    setSyncQueue(prev => prev.filter(item => item.id !== itemId));
  };

  // Sync all offline changes to server
  const syncOfflineChanges = async () => {
    if (syncQueue.length === 0) {
      showNotification({
        type: 'info',
        title: 'Nothing to Sync',
        message: 'All changes are up to date.'
      });
      return;
    }

    if (!browserOnline) {
      showNotification({
        type: 'warning',
        title: 'Cannot Sync',
        message: 'No internet connection. Please check your network.'
      });
      return;
    }

    setIsSyncing(true);
    let successCount = 0;
    let failCount = 0;

    showNotification({
      type: 'info',
      title: 'Syncing...',
      message: `Syncing ${syncQueue.length} changes to server...`
    });

    for (const item of syncQueue) {
      try {
        // Update status to syncing
        setSyncQueue(prev =>
          prev.map(i => i.id === item.id ? { ...i, status: 'syncing' } : i)
        );

        // Make API call
        const response = await fetch(item.endpoint, {
          method: item.method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(item.data)
        });

        if (!response.ok) {
          throw new Error(`Server returned ${response.status}`);
        }

        const result = await response.json();

        if (result.status === 'success' || result.success) {
          // Remove from queue on success
          removeFromSyncQueue(item.id);
          successCount++;
        } else {
          throw new Error(result.message || 'Sync failed');
        }
      } catch (error) {
        console.error(`Failed to sync item ${item.id}:`, error);
        // Mark as failed
        setSyncQueue(prev =>
          prev.map(i => i.id === item.id ? { ...i, status: 'failed', error: error.message } : i)
        );
        failCount++;
      }
    }

    setIsSyncing(false);
    setLastSyncTime(new Date());
    localStorage.setItem('lastSyncTime', new Date().toISOString());

    // Show sync results
    if (failCount === 0) {
      showNotification({
        type: 'success',
        title: 'Sync Complete',
        message: `Successfully synced ${successCount} changes to server.`
      });
    } else if (successCount > 0) {
      showNotification({
        type: 'warning',
        title: 'Partial Sync',
        message: `Synced ${successCount} changes. ${failCount} failed and will be retried.`
      });
    } else {
      showNotification({
        type: 'error',
        title: 'Sync Failed',
        message: `Failed to sync ${failCount} changes. Will retry when connection improves.`
      });
    }
  };

  // Clear all failed items from queue
  const clearFailedItems = () => {
    setSyncQueue(prev => prev.filter(item => item.status !== 'failed'));
    showNotification({
      type: 'info',
      title: 'Failed Items Cleared',
      message: 'Failed sync items have been removed from the queue.'
    });
  };

  // Retry failed items
  const retryFailedItems = async () => {
    const failedItems = syncQueue.filter(item => item.status === 'failed');
    if (failedItems.length === 0) {
      showNotification({
        type: 'info',
        title: 'No Failed Items',
        message: 'There are no failed items to retry.'
      });
      return;
    }

    // Reset failed items to pending
    setSyncQueue(prev =>
      prev.map(item => item.status === 'failed' ? { ...item, status: 'pending' } : item)
    );

    // Trigger sync
    await syncOfflineChanges();
  };

  const value = {
    isOnline,
    browserOnline,
    toggleOnlineMode,
    syncQueue,
    addToSyncQueue,
    removeFromSyncQueue,
    syncOfflineChanges,
    isSyncing,
    lastSyncTime,
    clearFailedItems,
    retryFailedItems,
    setNotificationHandler,
    // Helper to check if truly online (both mode and browser)
    isFullyOnline: isOnline && browserOnline,
    pendingChanges: syncQueue.length,
    failedChanges: syncQueue.filter(item => item.status === 'failed').length
  };

  return (
    <OnlineOfflineContext.Provider value={value}>
      {children}
    </OnlineOfflineContext.Provider>
  );
};

export default OnlineOfflineContext;
