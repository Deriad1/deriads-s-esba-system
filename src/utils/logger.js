/**
 * Production-safe Logger Utility
 *
 * ✅ PERFORMANCE FIX: Replaces 452 console.log statements
 * - Removes console logs in production build (via Vite config)
 * - Keeps error logging for debugging
 * - Provides structured logging interface
 *
 * Usage:
 * import { logger } from './utils/logger';
 *
 * logger.log('Debug info');     // Only in development
 * logger.error('Error message'); // Always logged
 * logger.warn('Warning');        // Only in development
 */

const isDevelopment = import.meta.env.DEV;

export const logger = {
  /**
   * Log general information (development only)
   */
  log: (...args) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },

  /**
   * Log warnings (development only)
   */
  warn: (...args) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },

  /**
   * Log errors (always logged, even in production)
   */
  error: (...args) => {
    console.error(...args);

    // In production, you could send errors to a monitoring service
    // if (!isDevelopment) {
    //   sendToErrorTracking(args);
    // }
  },

  /**
   * Log debug information (development only)
   */
  debug: (...args) => {
    if (isDevelopment) {
      console.debug(...args);
    }
  },

  /**
   * Log table data (development only)
   */
  table: (data) => {
    if (isDevelopment) {
      console.table(data);
    }
  },

  /**
   * Group logs together (development only)
   */
  group: (label, callback) => {
    if (isDevelopment) {
      console.group(label);
      callback();
      console.groupEnd();
    }
  },

  /**
   * Time an operation (development only)
   */
  time: (label) => {
    if (isDevelopment) {
      console.time(label);
    }
  },

  timeEnd: (label) => {
    if (isDevelopment) {
      console.timeEnd(label);
    }
  }
};

export default logger;
