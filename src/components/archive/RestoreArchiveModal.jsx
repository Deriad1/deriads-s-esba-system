import React, { useState } from 'react';
import { useNotification } from '../../context/NotificationContext';
import { useTermContext } from '../../context/TermContext';

/**
 * Restore Archive Modal
 * Allows restoring archived data to current or different term
 */
const RestoreArchiveModal = ({ archive, onClose, onRestoreComplete }) => {
  const { showNotification } = useNotification();
  const { currentTerm, currentYear } = useTermContext();
  const [restoring, setRestoring] = useState(false);
  const [targetTerm, setTargetTerm] = useState(currentTerm);
  const [targetYear, setTargetYear] = useState(currentYear);
  const [overwriteMode, setOverwriteMode] = useState('merge'); // 'merge', 'replace', 'skip'

  const handleRestore = async () => {
    if (!targetTerm || !targetYear) {
      showNotification({
        type: 'error',
        title: 'Missing Information',
        message: 'Please select target term and year'
      });
      return;
    }

    // Confirm action
    const confirmMessage = overwriteMode === 'replace'
      ? `This will DELETE all existing marks and remarks for ${targetTerm} ${targetYear} and replace them with archived data. Continue?`
      : overwriteMode === 'merge'
      ? `This will merge archived data into ${targetTerm} ${targetYear}, overwriting any conflicts. Continue?`
      : `This will restore archived data to ${targetTerm} ${targetYear}, skipping any conflicts. Continue?`;

    if (!confirm(confirmMessage)) {
      return;
    }

    setRestoring(true);
    try {
      const response = await fetch('/api/restore-archive', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          archiveId: archive.id,
          targetTerm,
          targetYear,
          overwriteMode
        })
      });

      const result = await response.json();

      if (result.status === 'success') {
        showNotification({
          type: 'success',
          title: 'Restore Successful',
          message: `Restored ${result.data.restoredMarks} marks and ${result.data.restoredRemarks} remarks to ${targetTerm} ${targetYear}`
        });
        onRestoreComplete();
        onClose();
      } else {
        throw new Error(result.message || 'Restore failed');
      }
    } catch (error) {
      console.error('Restore error:', error);
      showNotification({
        type: 'error',
        title: 'Restore Failed',
        message: 'Failed to restore archive: ' + error.message
      });
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl border border-gray-200">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Restore Archive</h3>
            <p className="text-sm text-gray-600 mt-1">
              Restore data from: {archive.term} ({archive.academicYear})
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Warning Notice */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex gap-3">
              <svg className="w-6 h-6 text-yellow-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <h4 className="font-semibold text-yellow-900">Caution: Data Overwrite</h4>
                <p className="text-sm text-yellow-800 mt-1">
                  Restoring an archive may overwrite existing data in the target term.
                  Please review your settings carefully before proceeding.
                </p>
              </div>
            </div>
          </div>

          {/* Target Term Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Term
              </label>
              <select
                value={targetTerm}
                onChange={(e) => setTargetTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="First Term">First Term</option>
                <option value="Second Term">Second Term</option>
                <option value="Third Term">Third Term</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Academic Year
              </label>
              <input
                type="text"
                value={targetYear}
                onChange={(e) => setTargetYear(e.target.value)}
                placeholder="e.g., 2024/2025"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Overwrite Mode */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Restore Mode
            </label>
            <div className="space-y-3">
              <label className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="overwriteMode"
                  value="merge"
                  checked={overwriteMode === 'merge'}
                  onChange={(e) => setOverwriteMode(e.target.value)}
                  className="mt-1"
                />
                <div>
                  <div className="font-medium text-gray-900">Merge (Recommended)</div>
                  <div className="text-sm text-gray-600">
                    Restore archived data and overwrite any conflicts. Keeps non-conflicting existing data.
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="overwriteMode"
                  value="replace"
                  checked={overwriteMode === 'replace'}
                  onChange={(e) => setOverwriteMode(e.target.value)}
                  className="mt-1"
                />
                <div>
                  <div className="font-medium text-gray-900 text-red-600">Replace All (Dangerous)</div>
                  <div className="text-sm text-gray-600">
                    DELETE all existing marks and remarks for the target term and replace with archived data.
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="overwriteMode"
                  value="skip"
                  checked={overwriteMode === 'skip'}
                  onChange={(e) => setOverwriteMode(e.target.value)}
                  className="mt-1"
                />
                <div>
                  <div className="font-medium text-gray-900">Skip Conflicts</div>
                  <div className="text-sm text-gray-600">
                    Only restore data that doesn't conflict with existing records. Safest option.
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Current vs Target Comparison */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">Restore Summary</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-blue-600 font-medium">Source</div>
                <div className="text-blue-900">
                  {archive.term} ({archive.academicYear})
                </div>
              </div>
              <div>
                <div className="text-blue-600 font-medium">Target</div>
                <div className="text-blue-900">
                  {targetTerm} ({targetYear})
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            disabled={restoring}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleRestore}
            disabled={restoring}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {restoring ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Restoring...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Restore Archive
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RestoreArchiveModal;
