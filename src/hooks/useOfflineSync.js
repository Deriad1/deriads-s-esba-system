import { useState, useEffect, useCallback } from 'react';
import { updateStudentScores, updateFormMasterRemarks } from '../api-client';

/**
 * Custom hook for offline data synchronization
 *
 * Provides offline support by:
 * - Detecting online/offline status
 * - Queueing actions when offline
 * - Auto-syncing when connection is restored
 * - Persisting queue to localStorage
 *
 * @param {Object} options - Configuration options
 * @param {Function} options.onSyncSuccess - Callback when sync succeeds
 * @param {Function} options.onSyncError - Callback when sync fails
 * @param {boolean} options.autoSync - Auto-sync when coming online (default: true)
 * @returns {Object} Offline sync utilities
 */
const useOfflineSync = (options = {}) => {
  const {
    onSyncSuccess,
    onSyncError,
    autoSync = true
  } = options;

  // State
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingSync, setPendingSync] = useState([]);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      console.log('🌐 Connection restored - back online');
      setIsOnline(true);
    };

    const handleOffline = () => {
      console.log('📡 Connection lost - now offline');
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load pending sync data from localStorage on mount
  useEffect(() => {
    try {
      const storedPending = localStorage.getItem('pendingSync');
      if (storedPending) {
        const pendingData = JSON.parse(storedPending);
        setPendingSync(pendingData);
        console.log(`📦 Loaded ${pendingData.length} pending sync items from storage`);
      }

      const storedLastSync = localStorage.getItem('lastSyncTime');
      if (storedLastSync) {
        setLastSyncTime(new Date(parseInt(storedLastSync)));
      }
    } catch (error) {
      console.error('Error loading pending sync data:', error);
    }
  }, []);

  // Save pending sync data to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('pendingSync', JSON.stringify(pendingSync));
    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        console.warn('📦 localStorage quota exceeded in offline sync - clearing old cache');
        // Try to free up space by clearing old marks cache
        try {
          Object.keys(localStorage).forEach(key => {
            if (key.startsWith('marks_') || key.startsWith('classTeacher_marks_') || key.startsWith('subjectTeacher_')) {
              localStorage.removeItem(key);
            }
          });
          // Try again after clearing
          localStorage.setItem('pendingSync', JSON.stringify(pendingSync));
        } catch (retryError) {
          console.error('Still failed after clearing cache:', retryError);
        }
      } else {
        console.error('Error saving pending sync data:', error);
      }
    }
  }, [pendingSync]);

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && autoSync && pendingSync.length > 0 && !isSyncing) {
      console.log('🔄 Auto-syncing pending data...');
      syncPendingData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline, autoSync]);

  /**
   * Queue an action for offline sync
   * @param {string} type - Action type ('scores' or 'remarks')
   * @param {Object} data - Data to sync
   */
  const queueAction = useCallback((type, data) => {
    const pendingItem = {
      id: Date.now() + Math.random(), // Unique ID
      type,
      data,
      timestamp: new Date().toISOString()
    };

    setPendingSync(prev => [...prev, pendingItem]);
    console.log(`💾 Queued ${type} action for offline sync:`, pendingItem.id);

    return pendingItem.id;
  }, []);

  /**
   * Sync all pending data to the server
   */
  const syncPendingData = useCallback(async () => {
    if (pendingSync.length === 0) {
      console.log('✅ No pending data to sync');
      return { success: true, message: 'No pending data to sync' };
    }

    if (!isOnline) {
      console.warn('⚠️ Cannot sync - currently offline');
      return { success: false, message: 'Currently offline. Cannot sync data.' };
    }

    setIsSyncing(true);
    let successCount = 0;
    let errorCount = 0;
    const failedItems = [];

    try {
      console.log(`🔄 Starting sync of ${pendingSync.length} items...`);

      for (const pendingItem of pendingSync) {
        try {
          let response;

          if (pendingItem.type === 'scores') {
            response = await updateStudentScores(pendingItem.data);
          } else if (pendingItem.type === 'remarks') {
            response = await updateFormMasterRemarks(pendingItem.data);
          } else {
            throw new Error(`Unknown sync type: ${pendingItem.type}`);
          }

          if (response.status === 'success') {
            successCount++;
            console.log(`✅ Synced ${pendingItem.type} for student ${pendingItem.data.studentId}`);
          } else {
            errorCount++;
            failedItems.push(pendingItem);
            console.error(`❌ Failed to sync ${pendingItem.type}:`, response.message);
          }
        } catch (error) {
          errorCount++;
          failedItems.push(pendingItem);
          console.error(`❌ Error syncing ${pendingItem.type}:`, error);
        }
      }

      // Update pending sync queue - keep only failed items
      setPendingSync(failedItems);

      // Update last sync time
      const now = new Date();
      setLastSyncTime(now);
      localStorage.setItem('lastSyncTime', now.getTime().toString());

      console.log(`🎉 Sync complete: ${successCount} succeeded, ${errorCount} failed`);

      // Callbacks
      if (successCount > 0 && onSyncSuccess) {
        onSyncSuccess(successCount, errorCount);
      }

      if (errorCount > 0 && onSyncError) {
        onSyncError(errorCount, failedItems);
      }

      return {
        success: errorCount === 0,
        successCount,
        errorCount,
        failedItems,
        message: errorCount === 0
          ? `Successfully synced ${successCount} items`
          : `Synced ${successCount} items, ${errorCount} failed`
      };
    } catch (error) {
      console.error('❌ Sync error:', error);
      if (onSyncError) {
        onSyncError(pendingSync.length, pendingSync);
      }
      return {
        success: false,
        error: error.message,
        message: 'Sync failed: ' + error.message
      };
    } finally {
      setIsSyncing(false);
    }
  }, [pendingSync, isOnline, onSyncSuccess, onSyncError]);

  /**
   * Clear all pending sync data
   */
  const clearPendingData = useCallback(() => {
    setPendingSync([]);
    localStorage.removeItem('pendingSync');
    console.log('🗑️ Cleared all pending sync data');
  }, []);

  /**
   * Remove a specific item from the pending queue
   */
  const removePendingItem = useCallback((itemId) => {
    setPendingSync(prev => prev.filter(item => item.id !== itemId));
    console.log(`🗑️ Removed pending item: ${itemId}`);
  }, []);

  return {
    // State
    isOnline,
    pendingSync,
    pendingCount: pendingSync.length,
    lastSyncTime,
    isSyncing,

    // Actions
    queueAction,
    syncPendingData,
    clearPendingData,
    removePendingItem
  };
};

export default useOfflineSync;
