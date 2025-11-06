import { useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for auto-saving data with debounce
 *
 * Implements "save-as-you-type" functionality:
 * - Waits for user to stop typing
 * - Debounces save operations
 * - Prevents race conditions
 * - Provides save status feedback
 *
 * @param {Function} saveFunction - Function to call for saving
 * @param {any} data - Data to watch for changes
 * @param {Object} options - Configuration options
 * @param {number} options.delay - Debounce delay in milliseconds (default: 3000)
 * @param {boolean} options.enabled - Enable auto-save (default: true)
 * @param {Function} options.onSaveStart - Callback when save starts
 * @param {Function} options.onSaveSuccess - Callback when save succeeds
 * @param {Function} options.onSaveError - Callback when save fails
 * @returns {Object} Auto-save utilities
 */
const useAutoSave = (saveFunction, data, options = {}) => {
  const {
    delay = 3000, // 3 seconds default
    enabled = true,
    onSaveStart,
    onSaveSuccess,
    onSaveError
  } = options;

  const timeoutRef = useRef(null);
  const isSavingRef = useRef(false);
  const lastSavedDataRef = useRef(null);

  /**
   * Trigger auto-save after debounce delay
   */
  const triggerAutoSave = useCallback(async () => {
    // Skip if already saving
    if (isSavingRef.current) {
      console.log('⏳ Auto-save skipped - already saving');
      return;
    }

    // Skip if data hasn't changed
    if (JSON.stringify(data) === JSON.stringify(lastSavedDataRef.current)) {
      console.log('⏳ Auto-save skipped - no changes detected');
      return;
    }

    try {
      console.log('💾 Auto-save triggered');
      isSavingRef.current = true;

      if (onSaveStart) {
        onSaveStart();
      }

      await saveFunction(data);

      // Update last saved data
      lastSavedDataRef.current = JSON.parse(JSON.stringify(data));

      console.log('✅ Auto-save successful');

      if (onSaveSuccess) {
        onSaveSuccess();
      }
    } catch (error) {
      console.error('❌ Auto-save failed:', error);

      if (onSaveError) {
        onSaveError(error);
      }
    } finally {
      isSavingRef.current = false;
    }
  }, [data, saveFunction, onSaveStart, onSaveSuccess, onSaveError]);

  /**
   * Set up debounced auto-save
   */
  useEffect(() => {
    // Skip if disabled
    if (!enabled) {
      return;
    }

    // Skip if no data
    if (!data || (typeof data === 'object' && Object.keys(data).length === 0)) {
      return;
    }

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      triggerAutoSave();
    }, delay);

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, delay, enabled, triggerAutoSave]);

  /**
   * Manually trigger save (bypasses debounce)
   */
  const saveNow = useCallback(async () => {
    // Clear any pending auto-save
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    await triggerAutoSave();
  }, [triggerAutoSave]);

  /**
   * Cancel pending auto-save
   */
  const cancelAutoSave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      console.log('🚫 Auto-save cancelled');
    }
  }, []);

  /**
   * Reset the auto-save state
   */
  const resetAutoSave = useCallback(() => {
    cancelAutoSave();
    lastSavedDataRef.current = null;
    isSavingRef.current = false;
    console.log('🔄 Auto-save reset');
  }, [cancelAutoSave]);

  return {
    // Actions
    saveNow,
    cancelAutoSave,
    resetAutoSave,

    // State
    isSaving: isSavingRef.current
  };
};

export default useAutoSave;
