import React, { useState, useEffect } from 'react';
import { useNotification } from '../context/NotificationContext';

const ALL_CLASSES = [
  'KG1', 'KG2', 'BS1', 'BS2', 'BS3', 'BS4', 'BS5', 'BS6',
  'BS7', 'BS8', 'BS9', 'BS10', 'BS11', 'BS12'
];

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

/**
 * Class-Based Promotion Modal
 * Promote entire classes: select source class → select target class → promote all students
 */
const ClassBasedPromotionModal = ({ isOpen, onClose, onComplete }) => {
  const { showNotification } = useNotification();

  // Class mappings: { 'BS7': 'BS8', 'BS8': 'BS9' }
  const [classMappings, setClassMappings] = useState({});

  // Student counts per class
  const [classCounts, setClassCounts] = useState({});
  const [loading, setLoading] = useState(false);

  // Settings
  const [academicYear, setAcademicYear] = useState('');
  const [term, setTerm] = useState('First Term');
  const [promoting, setPromoting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Set default academic year
      const currentYear = new Date().getFullYear();
      setAcademicYear(`${currentYear}/${currentYear + 1}`);

      // Load student counts
      loadClassCounts();

      // Reset mappings
      setClassMappings({});
    }
  }, [isOpen]);

  const loadClassCounts = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/students');
      const result = await response.json();

      if (result.status === 'success') {
        const students = result.data;

        // Count students per class
        const counts = {};
        ALL_CLASSES.forEach(className => {
          counts[className] = students.filter(s => s.class_name === className).length;
        });

        setClassCounts(counts);
      } else {
        throw new Error(result.message || 'Failed to load students');
      }
    } catch (error) {
      console.error('Error loading class counts:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load class data: ' + error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleClass = (sourceClass) => {
    setClassMappings(prev => {
      const newMappings = { ...prev };

      if (newMappings[sourceClass]) {
        // Remove mapping
        delete newMappings[sourceClass];
      } else {
        // Add with suggested target
        newMappings[sourceClass] = CLASS_PROGRESSION[sourceClass] || '';
      }

      return newMappings;
    });
  };

  const handleTargetChange = (sourceClass, targetClass) => {
    setClassMappings(prev => ({
      ...prev,
      [sourceClass]: targetClass
    }));
  };

  const handleAutoAssign = () => {
    const newMappings = {};
    ALL_CLASSES.forEach(className => {
      if (classCounts[className] > 0) {
        newMappings[className] = CLASS_PROGRESSION[className] || '';
      }
    });
    setClassMappings(newMappings);

    showNotification({
      type: 'success',
      title: 'Auto-Assigned',
      message: 'Automatically assigned progression for all classes with students'
    });
  };

  const handleClearAll = () => {
    setClassMappings({});
  };

  const handlePromote = async () => {
    const mappingsCount = Object.keys(classMappings).length;

    if (mappingsCount === 0) {
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

    // Validate all mappings have targets
    const missingTargets = Object.entries(classMappings).filter(([_, target]) => !target);
    if (missingTargets.length > 0) {
      showNotification({
        type: 'warning',
        title: 'Missing Targets',
        message: `${missingTargets.length} class(es) don't have a target assigned`
      });
      return;
    }

    // Build summary for confirmation
    const totalStudents = Object.keys(classMappings).reduce(
      (sum, sourceClass) => sum + (classCounts[sourceClass] || 0),
      0
    );

    const hasGraduating = Object.values(classMappings).includes('Graduated');
    const summary = Object.entries(classMappings)
      .map(([source, target]) => `  ${source} (${classCounts[source]} students) → ${target}`)
      .join('\n');

    let confirmMessage = `Promote ${totalStudents} student(s) from ${mappingsCount} class(es)?\n\n${summary}\n\nAcademic Year: ${academicYear}\nTerm: ${term}`;

    if (hasGraduating) {
      confirmMessage += '\n\n⚠️ WARNING: Some students will be marked as GRADUATED!';
    }

    if (!confirm(confirmMessage)) return;

    setPromoting(true);

    try {
      const results = [];
      const errors = [];

      // Promote each class
      for (const [sourceClass, targetClass] of Object.entries(classMappings)) {
        try {
          // Get students in this class
          const studentsResponse = await fetch('/api/students');
          const studentsResult = await studentsResponse.json();

          if (studentsResult.status === 'success') {
            const classStudents = studentsResult.data.filter(s => s.class_name === sourceClass);
            const studentIds = classStudents.map(s => s.id);

            if (studentIds.length > 0) {
              // Promote these students
              const response = await fetch('/api/students/promote', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  studentIds,
                  targetClass,
                  academicYear,
                  term
                })
              });

              const result = await response.json();

              if (result.status === 'success') {
                results.push({
                  sourceClass,
                  targetClass,
                  count: result.data.successCount
                });
              } else {
                errors.push({
                  sourceClass,
                  error: result.message
                });
              }
            }
          }
        } catch (error) {
          console.error(`Error promoting ${sourceClass}:`, error);
          errors.push({
            sourceClass,
            error: error.message
          });
        }
      }

      // Show results
      const totalPromoted = results.reduce((sum, r) => sum + r.count, 0);

      if (totalPromoted > 0) {
        showNotification({
          type: 'success',
          title: 'Promotion Successful',
          message: `Successfully promoted ${totalPromoted} student(s) from ${results.length} class(es)`
        });

        console.log('Promotion details:', results);
      }

      if (errors.length > 0) {
        showNotification({
          type: 'warning',
          title: 'Some Classes Failed',
          message: `${errors.length} class(es) could not be promoted`
        });

        console.error('Promotion errors:', errors);
      }

      if (onComplete) onComplete();
      onClose();

    } catch (error) {
      console.error('Promotion error:', error);
      showNotification({
        type: 'error',
        title: 'Promotion Failed',
        message: error.message || 'An error occurred during promotion'
      });
    } finally {
      setPromoting(false);
    }
  };

  if (!isOpen) return null;

  const selectedCount = Object.keys(classMappings).length;
  const totalStudents = Object.keys(classMappings).reduce(
    (sum, sourceClass) => sum + (classCounts[sourceClass] || 0),
    0
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass-card-golden w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Class-Based Promotion</h2>
              <p className="text-gray-600 mt-1">Promote entire classes: select class → assign target → done!</p>
            </div>
            <button
              onClick={onClose}
              disabled={promoting}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Stats */}
          <div className="mt-4 flex gap-4 text-sm">
            <div className="bg-gray-100 rounded-lg px-3 py-1 text-gray-700">
              <span className="font-semibold">{selectedCount}</span> classes selected
            </div>
            <div className="bg-gray-100 rounded-lg px-3 py-1 text-gray-700">
              <span className="font-semibold">{totalStudents}</span> students total
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading class data...</p>
            </div>
          ) : (
            <>
              {/* Quick Actions */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Quick Actions</h3>
                <div className="flex gap-3">
                  <button
                    onClick={handleAutoAssign}
                    disabled={promoting}
                    className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Auto-Assign All (Standard Progression)
                  </button>
                  <button
                    onClick={handleClearAll}
                    disabled={promoting || selectedCount === 0}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              {/* Class Mapping Table */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Class Promotion Mapping</h3>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Select</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Source Class</th>
                        <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Students</th>
                        <th className="px-4 py-3 text-center text-sm font-medium text-gray-700"></th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Target Class</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {ALL_CLASSES.map(className => {
                        const isSelected = className in classMappings;
                        const targetClass = classMappings[className] || '';
                        const studentCount = classCounts[className] || 0;
                        const isGraduating = targetClass === 'Graduated';

                        return (
                          <tr
                            key={className}
                            className={`${
                              isSelected
                                ? isGraduating
                                  ? 'bg-red-50'
                                  : 'bg-gray-100'
                                : studentCount === 0
                                ? 'bg-gray-50 opacity-50'
                                : ''
                            }`}
                          >
                            <td className="px-4 py-3">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleToggleClass(className)}
                                disabled={promoting || studentCount === 0}
                                className="w-5 h-5 text-gray-900 rounded focus:ring-gray-500"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <span className="font-semibold text-gray-900">{className}</span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                studentCount > 0 ? 'bg-gray-200 text-gray-800' : 'bg-gray-100 text-gray-600'
                              }`}>
                                {studentCount}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              {isSelected && (
                                <svg className="w-6 h-6 text-gray-900 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                </svg>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {isSelected ? (
                                <select
                                  value={targetClass}
                                  onChange={(e) => handleTargetChange(className, e.target.value)}
                                  disabled={promoting}
                                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-gray-500 ${
                                    isGraduating
                                      ? 'border-red-300 bg-red-50'
                                      : 'border-gray-300'
                                  }`}
                                >
                                  <option value="">Select Target</option>
                                  {ALL_CLASSES.map(cls => (
                                    <option key={cls} value={cls}>{cls}</option>
                                  ))}
                                  <option value="Graduated">Graduated 🎓</option>
                                </select>
                              ) : (
                                <span className="text-sm text-gray-400">
                                  {studentCount === 0 ? 'No students' : 'Not selected'}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Settings */}
              {selectedCount > 0 && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
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
                        disabled={promoting}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Starting Term
                      </label>
                      <select
                        value={term}
                        onChange={(e) => setTerm(e.target.value)}
                        disabled={promoting}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500"
                      >
                        <option value="First Term">First Term</option>
                        <option value="Second Term">Second Term</option>
                        <option value="Third Term">Third Term</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Warnings */}
              {Object.values(classMappings).includes('Graduated') && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex gap-3">
                    <svg className="w-6 h-6 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div>
                      <h4 className="font-semibold text-red-900">Graduation Warning</h4>
                      <p className="text-sm text-red-800 mt-1">
                        Some classes will be marked as GRADUATED. Make sure you've archived the current term before proceeding.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 bg-gray-50 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {selectedCount > 0 && (
              <span>
                Will promote <strong>{totalStudents} students</strong> from <strong>{selectedCount} class(es)</strong>
              </span>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={promoting}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handlePromote}
              disabled={promoting || selectedCount === 0 || !academicYear}
              className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Promote {selectedCount} Class{selectedCount !== 1 ? 'es' : ''}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClassBasedPromotionModal;
