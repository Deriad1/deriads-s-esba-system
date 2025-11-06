import React, { useState, useEffect } from 'react';
import { storageCleanup } from '../utils/storageCleanup';
import { useNotification } from '../context/NotificationContext';

/**
 * Storage Manager Component
 * View and manage localStorage usage
 */
const StorageManager = () => {
  const { showNotification } = useNotification();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadStats = () => {
    setLoading(true);
    setTimeout(() => {
      const storageStats = storageCleanup.getStorageStats();
      setStats(storageStats);
      setLoading(false);
    }, 100);
  };

  useEffect(() => {
    loadStats();
  }, []);

  const handleCleanOldData = () => {
    const removedCount = storageCleanup.cleanOldTermData();
    showNotification({
      type: 'success',
      title: 'Cleanup Complete',
      message: `Removed ${removedCount} old term data items`
    });
    loadStats();
  };

  const handleEmergencyCleanup = () => {
    const removedCount = storageCleanup.emergencyCleanup();
    if (removedCount !== false) {
      showNotification({
        type: 'success',
        title: 'Emergency Cleanup Complete',
        message: `Removed ${removedCount} items from storage`
      });
      loadStats();
    }
  };

  const handleExportData = () => {
    const data = {};
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        try {
          data[key] = JSON.parse(localStorage.getItem(key));
        } catch {
          data[key] = localStorage.getItem(key);
        }
      }
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `localStorage_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    showNotification({
      type: 'success',
      title: 'Export Complete',
      message: 'LocalStorage data exported successfully'
    });
  };

  if (loading || !stats) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading storage statistics...</p>
      </div>
    );
  }

  const isNearQuota = parseFloat(stats.percentUsed) > 80;
  const isCritical = parseFloat(stats.percentUsed) > 90;

  return (
    <div className="space-y-6">
      {/* Storage Overview */}
      <div className={`border rounded-lg p-6 ${isCritical ? 'bg-red-50 border-red-300' : isNearQuota ? 'bg-yellow-50 border-yellow-300' : 'bg-white border-gray-200'}`}>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
          </svg>
          Storage Overview
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div>
            <div className="text-sm text-gray-600">Total Size</div>
            <div className="text-2xl font-bold text-gray-900">{stats.totalSizeMB} MB</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Items</div>
            <div className="text-2xl font-bold text-gray-900">{stats.itemCount}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Estimated Usage</div>
            <div className={`text-2xl font-bold ${isCritical ? 'text-red-600' : isNearQuota ? 'text-yellow-600' : 'text-green-600'}`}>
              {stats.percentUsed}%
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Status</div>
            <div className={`text-lg font-bold ${isCritical ? 'text-red-600' : isNearQuota ? 'text-yellow-600' : 'text-green-600'}`}>
              {isCritical ? '🔴 Critical' : isNearQuota ? '⚠️ Warning' : '✅ Good'}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div
            className={`h-4 rounded-full transition-all ${isCritical ? 'bg-red-600' : isNearQuota ? 'bg-yellow-600' : 'bg-green-600'}`}
            style={{ width: `${Math.min(parseFloat(stats.percentUsed), 100)}%` }}
          ></div>
        </div>
        <p className="text-xs text-gray-500 mt-1">Assuming 5MB browser quota (typical limit)</p>

        {(isNearQuota || isCritical) && (
          <div className={`mt-4 p-3 rounded-lg ${isCritical ? 'bg-red-100' : 'bg-yellow-100'}`}>
            <div className="flex items-start gap-2">
              <svg className={`w-5 h-5 flex-shrink-0 ${isCritical ? 'text-red-600' : 'text-yellow-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className={`font-semibold ${isCritical ? 'text-red-900' : 'text-yellow-900'}`}>
                  {isCritical ? 'Storage Critical!' : 'Storage Warning'}
                </p>
                <p className={`text-sm ${isCritical ? 'text-red-800' : 'text-yellow-800'}`}>
                  {isCritical
                    ? 'Your browser storage is almost full. Please clean up old data immediately.'
                    : 'Your browser storage is getting full. Consider cleaning up old term data.'
                  }
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={handleCleanOldData}
          className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Clean Old Term Data
        </button>

        <button
          onClick={handleExportData}
          className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Export Backup
        </button>

        <button
          onClick={handleEmergencyCleanup}
          className="px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          Emergency Cleanup
        </button>
      </div>

      {/* Largest Items Table */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
          <h4 className="font-semibold text-gray-900">Top 10 Largest Items</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">#</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Key</th>
                <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">Size (KB)</th>
                <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">% of Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {stats.items.slice(0, 10).map((item, index) => (
                <tr key={item.key} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-sm text-gray-600">{index + 1}</td>
                  <td className="px-4 py-2 text-sm font-mono text-gray-900 max-w-md truncate">
                    {item.key}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-900 text-right">{item.sizeKB}</td>
                  <td className="px-4 py-2 text-sm text-gray-900 text-right">
                    {((item.size / stats.totalSize) * 100).toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Refresh Button */}
      <button
        onClick={loadStats}
        className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Refresh Statistics
      </button>
    </div>
  );
};

export default StorageManager;
