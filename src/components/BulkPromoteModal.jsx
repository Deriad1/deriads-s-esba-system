import React, { useState, useEffect } from 'react';
import { useNotification } from '../context/NotificationContext';

const CLASS_PROGRESSION = {
  'KG1': 'KG2',
  'KG2': 'BS1',
  'BS1': 'BS2',
  'BS2': 'BS3',
  'BS3': 'BS4',
  'BS4': 'BS5',
  'BS5': 'BS6',
  'BS6': 'BS7',
  'BS7': 'BS8',
  'BS8': 'BS9',
  'BS9': 'Graduated',
  'BS10': 'Graduated',
  'BS11': 'Graduated',
  'BS12': 'Graduated'
};

const ALL_CLASSES = [
  'KG1', 'KG2', 'BS1', 'BS2', 'BS3', 'BS4', 'BS5', 'BS6',
  'BS7', 'BS8', 'BS9', 'BS10', 'BS11', 'BS12'
];

/**
 * Bulk Promote Modal
 * Promote entire classes at once (end of year)
 */
const BulkPromoteModal = ({ isOpen, onClose, onComplete }) => {
  const { showNotification } = useNotification();
  const [selectedClasses, setSelectedClasses] = useState([]);
  const [academicYear, setAcademicYear] = useState('');
  const [term, setTerm] = useState('First Term');
  const [autoProgress, setAutoProgress] = useState(true);
  const [promoting, setPromoting] = useState(false);
  const [preview, setPreview] = useState([]);

  useEffect(() => {
    if (isOpen) {
      // Set default academic year (current year + 1)
      const currentYear = new Date().getFullYear();
      setAcademicYear(`${currentYear}/${currentYear + 1}`);

      // Generate preview
      updatePreview();
    }
  }, [isOpen, selectedClasses, autoProgress]);

  const updatePreview = () => {
    const previewData = selectedClasses.map(className => ({
      from: className,
      to: autoProgress ? CLASS_PROGRESSION[className] : '?',
      isGraduating: CLASS_PROGRESSION[className] === 'Graduated'
    }));
    setPreview(previewData);
  };

  const handleSelectClass = (className) => {
    setSelectedClasses(prev => {
      if (prev.includes(className)) {
        return prev.filter(c => c !== className);
      } else {
        return [...prev, className].sort((a, b) => {
          return ALL_CLASSES.indexOf(a) - ALL_CLASSES.indexOf(b);
        });
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedClasses.length === ALL_CLASSES.length) {
      setSelectedClasses([]);
    } else {
      setSelectedClasses([...ALL_CLASSES]);
    }
  };

  const handlePromote = async () => {
    if (selectedClasses.length === 0) {
      showNotification({
        type: 'warning',
        title: 'No Classes Selected',
        message: 'Please select at least one class to promote'
      });
      return;
    }

    if (!academicYear) {
      showNotification({
        type: 'warning',
        title: 'Missing Academic Year',
        message: 'Please enter the target academic year'
      });
      return;
    }

    const graduatingClasses = preview.filter(p => p.isGraduating);
    let confirmMessage = `Are you sure you want to promote all students from ${selectedClasses.length} class(es)?\n\n`;

    if (graduatingClasses.length > 0) {
      confirmMessage += `⚠️ WARNING: Students in the following classes will be marked as GRADUATED:\n`;
      confirmMessage += graduatingClasses.map(c => `- ${c.from}`).join('\n');
      confirmMessage += '\n\nThis action cannot be undone!';
    }

    if (!confirm(confirmMessage)) return;

    setPromoting(true);

    try {
      const response = await fetch('/api/students/bulk-promote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sourceClasses: selectedClasses,
          academicYear,
          term,
          autoProgress
        })
      });

      const data = await response.json();

      if (data.status === 'success') {
        showNotification({
          type: 'success',
          title: 'Bulk Promotion Successful',
          message: `Successfully promoted ${data.data.successCount} student(s) from ${selectedClasses.length} class(es)`
        });

        // Show detailed results
        console.log('Promotion details:', data.data.byClass);

        if (onComplete) onComplete();
        onClose();
      } else {
        throw new Error(data.message || 'Bulk promotion failed');
      }
    } catch (error) {
      console.error('Bulk promotion error:', error);
      showNotification({
        type: 'error',
        title: 'Promotion Failed',
        message: error.message || 'An error occurred during bulk promotion'
      });
    } finally {
      setPromoting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-xl">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Bulk Promotion</h2>
              <p className="text-blue-100 mt-1">Promote multiple classes at once (end of academic year)</p>
            </div>
            <button
              onClick={onClose}
              disabled={promoting}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Settings */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
            <h3 className="font-semibold text-gray-900">Promotion Settings</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Academic Year *
                </label>
                <input
                  type="text"
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  placeholder="2025/2026"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  disabled={promoting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Starting Term
                </label>
                <select
                  value={term}
                  onChange={(e) => setTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  disabled={promoting}
                >
                  <option value="First Term">First Term</option>
                  <option value="Second Term">Second Term</option>
                  <option value="Third Term">Third Term</option>
                </select>
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={autoProgress}
                onChange={(e) => setAutoProgress(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                disabled={promoting}
              />
              <span className="text-sm text-gray-700">
                Automatic progression (KG1 → KG2, BS7 → BS8, etc.)
              </span>
            </label>
          </div>

          {/* Class Selection */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-gray-900">
                Select Classes to Promote ({selectedClasses.length}/{ALL_CLASSES.length})
              </h3>
              <button
                onClick={handleSelectAll}
                disabled={promoting}
                className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
              >
                {selectedClasses.length === ALL_CLASSES.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {ALL_CLASSES.map(className => {
                const isSelected = selectedClasses.includes(className);
                const targetClass = CLASS_PROGRESSION[className];
                const isGraduating = targetClass === 'Graduated';

                return (
                  <button
                    key={className}
                    onClick={() => handleSelectClass(className)}
                    disabled={promoting}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      isSelected
                        ? isGraduating
                          ? 'bg-red-50 border-red-500 text-red-900'
                          : 'bg-blue-50 border-blue-500 text-blue-900'
                        : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-bold text-lg">{className}</div>
                    {isSelected && autoProgress && (
                      <div className="text-xs mt-1">→ {targetClass}</div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Preview */}
          {preview.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Promotion Preview</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {preview.map((item, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-2 rounded ${
                      item.isGraduating ? 'bg-red-50' : 'bg-white'
                    }`}
                  >
                    <span className="font-medium">{item.from}</span>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                    <span className={`font-bold ${item.isGraduating ? 'text-red-600' : 'text-green-600'}`}>
                      {item.to}
                      {item.isGraduating && ' 🎓'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Warning */}
          {preview.some(p => p.isGraduating) && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex gap-3">
                <svg className="w-6 h-6 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <h4 className="font-semibold text-red-900">Graduation Warning</h4>
                  <p className="text-sm text-red-800 mt-1">
                    Some classes will be marked as GRADUATED. This action cannot be undone.
                    Make sure you've archived the current term before proceeding.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 rounded-b-xl flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={promoting}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handlePromote}
            disabled={promoting || selectedClasses.length === 0 || !academicYear}
            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {promoting ? (
              <>
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Promoting...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
                <span>Promote All Selected Classes</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkPromoteModal;
