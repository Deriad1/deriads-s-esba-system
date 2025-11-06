/**
 * Storage Cleanup Utility
 * Helps manage and clean localStorage to prevent quota exceeded errors
 */

export const storageCleanup = {
  /**
   * Get storage usage statistics
   */
  getStorageStats() {
    let totalSize = 0;
    const items = [];

    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        const value = localStorage.getItem(key);
        const size = new Blob([value]).size;
        totalSize += size;
        items.push({
          key,
          size,
          sizeKB: (size / 1024).toFixed(2),
          sizeMB: (size / 1024 / 1024).toFixed(2)
        });
      }
    }

    // Sort by size (largest first)
    items.sort((a, b) => b.size - a.size);

    return {
      totalSize,
      totalSizeKB: (totalSize / 1024).toFixed(2),
      totalSizeMB: (totalSize / 1024 / 1024).toFixed(2),
      itemCount: items.length,
      items,
      // Typical browser quota is 5-10MB
      percentUsed: ((totalSize / (5 * 1024 * 1024)) * 100).toFixed(2)
    };
  },

  /**
   * Print storage report to console
   */
  printStorageReport() {
    const stats = this.getStorageStats();

    console.group('📊 LocalStorage Usage Report');
    console.log(`Total Size: ${stats.totalSizeMB} MB (${stats.totalSizeKB} KB)`);
    console.log(`Items: ${stats.itemCount}`);
    console.log(`Estimated Usage: ${stats.percentUsed}% (assuming 5MB quota)`);
    console.log('\nTop 10 Largest Items:');

    stats.items.slice(0, 10).forEach((item, index) => {
      console.log(`${index + 1}. ${item.key}: ${item.sizeKB} KB`);
    });

    console.groupEnd();

    return stats;
  },

  /**
   * Clean old term data (keep only current and previous term)
   */
  cleanOldTermData() {
    const currentTerm = localStorage.getItem('currentTerm');
    const currentYear = localStorage.getItem('currentAcademicYear');

    const keysToRemove = [];
    const termsToKeep = ['First Term', 'Second Term', 'Third Term'];
    const yearsToKeep = [currentYear]; // Only keep current year

    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        // Check if key matches term data pattern
        const termMatch = key.match(/(First Term|Second Term|Third Term)_([\d\/]+)/);

        if (termMatch) {
          const [, term, year] = termMatch;

          // Remove if not current year
          if (!yearsToKeep.includes(year)) {
            keysToRemove.push(key);
          }
        }
      }
    }

    console.log(`🧹 Cleaning ${keysToRemove.length} old term data items...`);
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      console.log(`   Removed: ${key}`);
    });

    return keysToRemove.length;
  },

  /**
   * Remove specific large items that might not be needed
   */
  cleanLargeItems(minSizeKB = 100) {
    const stats = this.getStorageStats();
    const largeItems = stats.items.filter(item => item.size > minSizeKB * 1024);

    console.log(`Found ${largeItems.length} items larger than ${minSizeKB}KB:`);
    largeItems.forEach(item => {
      console.log(`- ${item.key}: ${item.sizeKB} KB`);
    });

    return largeItems;
  },

  /**
   * Emergency cleanup - remove all term-specific data
   */
  emergencyCleanup() {
    const confirm = window.confirm(
      '⚠️ EMERGENCY CLEANUP\n\n' +
      'This will remove ALL term-specific data from localStorage.\n' +
      'User settings and authentication will be preserved.\n\n' +
      'Continue?'
    );

    if (!confirm) return false;

    const keysToKeep = [
      'currentTerm',
      'currentAcademicYear',
      'authToken',
      'currentUser',
      'schoolInfo',
      'onlineMode'
    ];

    let removedCount = 0;

    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key) && !keysToKeep.includes(key)) {
        localStorage.removeItem(key);
        removedCount++;
      }
    }

    console.log(`🧹 Emergency cleanup completed. Removed ${removedCount} items.`);
    return removedCount;
  },

  /**
   * Check if storage is near quota
   */
  isStorageNearQuota(thresholdPercent = 80) {
    const stats = this.getStorageStats();
    return parseFloat(stats.percentUsed) > thresholdPercent;
  },

  /**
   * Auto cleanup if storage is getting full
   */
  autoCleanup() {
    if (this.isStorageNearQuota(80)) {
      console.warn('⚠️ Storage is getting full. Running auto cleanup...');
      const removed = this.cleanOldTermData();

      if (this.isStorageNearQuota(90)) {
        console.error('❌ Storage still too full after cleanup!');
        return false;
      }

      console.log('✅ Auto cleanup successful');
      return true;
    }
    return true;
  }
};

// Make it available globally for debugging
if (typeof window !== 'undefined') {
  window.storageCleanup = storageCleanup;
}

export default storageCleanup;
