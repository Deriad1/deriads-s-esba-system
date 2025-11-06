import React, { useState, useEffect } from 'react';
import { useNotification } from '../context/NotificationContext';

// Default progression logic (can be used if classes are not loaded)
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
  'BS12': 'Graduated',
  'UNASSIGNED': 'BS1' // Default progression for unassigned students
};

/**
 * Class Promotion With Students
 * Select class → see all students (auto-selected) → deselect who shouldn't be promoted → assign target
 */
const ClassPromotionWithStudents = ({ isOpen, onClose, onComplete }) => {
  const { showNotification } = useNotification();

  // Selected source class
  const [selectedClass, setSelectedClass] = useState('');

  // Students in selected class
  const [students, setStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [loading, setLoading] = useState(false);

  // Target class
  const [targetClass, setTargetClass] = useState('');

  // Settings
  const [academicYear, setAcademicYear] = useState('');
  const [term, setTerm] = useState('First Term');
  const [promoting, setPromoting] = useState(false);

  // Class counts for display
  const [classCounts, setClassCounts] = useState({});

  // Available classes (loaded dynamically from API)
  const [availableClasses, setAvailableClasses] = useState([]);
  const [availableTargetClasses, setAvailableTargetClasses] = useState([]);

  useEffect(() => {
    if (isOpen) {
      // Set default academic year
      const currentYear = new Date().getFullYear();
      setAcademicYear(`${currentYear}/${currentYear + 1}`);

      // Load available classes
      loadAvailableClasses();

      // Load class counts
      loadClassCounts();

      // Reset
      setSelectedClass('');
      setStudents([]);
      setSelectedStudents([]);
      setTargetClass('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedClass) {
      loadStudentsForClass(selectedClass);
    }
  }, [selectedClass]);

  const loadAvailableClasses = async () => {
    try {
      const response = await fetch('/api/classes');
      const result = await response.json();

      if (result.status === 'success') {
        // Get class names from API
        const classNames = result.data.map(c => c.name).sort();

        // Add UNASSIGNED as a source class option
        const sourceClasses = ['UNASSIGNED', ...classNames];
        setAvailableClasses(sourceClasses);

        // Target classes = all classes + Graduated (but not UNASSIGNED)
        const targetClasses = [...classNames, 'Graduated'];
        setAvailableTargetClasses(targetClasses);

        console.log('✅ Loaded classes - Source:', sourceClasses, 'Target:', targetClasses);
      } else {
        console.warn('⚠️ Failed to load classes, using defaults');
        setAvailableClasses(['UNASSIGNED']);
        setAvailableTargetClasses(['Graduated']);
      }
    } catch (error) {
      console.error('⚠️ Error loading classes:', error);
      setAvailableClasses(['UNASSIGNED']);
      setAvailableTargetClasses(['Graduated']);
    }
  };

  const loadClassCounts = async () => {
    try {
      const response = await fetch('/api/students');
      const result = await response.json();

      if (result.status === 'success') {
        const students = result.data;
        const counts = {};

        // Count students for each class (including UNASSIGNED)
        students.forEach(student => {
          const className = student.className || 'UNASSIGNED';
          counts[className] = (counts[className] || 0) + 1;
        });

        console.log('✅ Class counts loaded:', counts);
        setClassCounts(counts);
      } else {
        console.warn('⚠️ Failed to load class counts:', result.message);
        // No fallback needed - counts will be empty object
        setClassCounts({});
      }
    } catch (error) {
      console.warn('⚠️ Error loading class counts:', error);
      // No fallback needed - counts will be empty object
      setClassCounts({});
    }
  };

  const loadStudentsForClass = async (className) => {
    setLoading(true);
    try {
      const response = await fetch('/api/students');
      const result = await response.json();

      if (result.status === 'success') {
        // Filter by className (camelCase) - API uses camelCase mapping
        const classStudents = result.data.filter(s => s.className === className);
        console.log(`📚 Loading students for ${className}:`, classStudents.length);
        setStudents(classStudents);

        // Auto-select all students
        setSelectedStudents(classStudents.map(s => s.id));

        // Auto-suggest target class
        setTargetClass(CLASS_PROGRESSION[className] || '');
      } else {
        throw new Error(result.message || 'Failed to load students');
      }
    } catch (error) {
      console.error('Error loading students:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load students: ' + error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClassChange = (className) => {
    setSelectedClass(className);
  };

  const handleStudentToggle = (studentId) => {
    setSelectedStudents(prev => {
      if (prev.includes(studentId)) {
        return prev.filter(id => id !== studentId);
      } else {
        return [...prev, studentId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedStudents.length === students.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(students.map(s => s.id));
    }
  };

  const handlePromote = async () => {
    if (!selectedClass) {
      showNotification({
        type: 'warning',
        title: 'No Class Selected',
        message: 'Please select a class'
      });
      return;
    }

    if (selectedStudents.length === 0) {
      showNotification({
        type: 'warning',
        title: 'No Students Selected',
        message: 'Please select at least one student to promote'
      });
      return;
    }

    if (!targetClass) {
      showNotification({
        type: 'warning',
        title: 'No Target Class',
        message: 'Please select a target class'
      });
      return;
    }

    if (!academicYear) {
      showNotification({
        type: 'warning',
        title: 'Missing Academic Year',
        message: 'Please enter the academic year'
      });
      return;
    }

    const confirmMessage = targetClass === 'Graduated'
      ? `Mark ${selectedStudents.length} student(s) from ${selectedClass} as GRADUATED?\n\nAcademic Year: ${academicYear}\n\nThis cannot be undone!`
      : `Promote ${selectedStudents.length} student(s) from ${selectedClass} to ${targetClass}?\n\nAcademic Year: ${academicYear}\nTerm: ${term}`;

    if (!confirm(confirmMessage)) return;

    setPromoting(true);

    try {
      const response = await fetch('/api/students/promote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentIds: selectedStudents,
          targetClass,
          academicYear,
          term
        })
      });

      const result = await response.json();

      if (result.status === 'success') {
        showNotification({
          type: 'success',
          title: 'Promotion Successful',
          message: `Successfully promoted ${result.data.successCount} student(s) to ${targetClass}`
        });

        if (result.data.errorCount > 0) {
          showNotification({
            type: 'warning',
            title: 'Partial Success',
            message: `${result.data.errorCount} student(s) could not be promoted`
          });
        }

        if (onComplete) onComplete();
        onClose();
      } else {
        throw new Error(result.message || 'Promotion failed');
      }
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

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass-card-golden rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="border-b-4 border-yellow-500/50 p-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500/90 to-blue-600/90 backdrop-blur-sm flex items-center justify-center text-white text-2xl shadow-lg border-2 border-white/50">
                📈
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white text-shadow">Promote Students</h2>
                <p className="text-white/90 mt-1 font-medium">Select class → Review students → Assign target class</p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={promoting}
              className="text-white hover:text-white/80 text-2xl font-bold p-2 hover:bg-white/20 rounded-xl transition-colors"
              style={{ minWidth: '44px', minHeight: '44px' }}
            >
              &times;
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Step 1: Select Class */}
          <div className="p-4 bg-white/10 border-2 border-white/30 rounded-xl backdrop-blur-md">
            <h3 className="font-bold text-white text-lg mb-4 flex items-center gap-2">
              <span>1️⃣</span>
              Step 1: Select Source Class
            </h3>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {availableClasses.map(className => {
                const isSelected = selectedClass === className;
                const count = classCounts[className];
                const isCountUnknown = count === undefined || count === -1;
                const isEmpty = count === 0;
                const shouldDisable = isEmpty && !isCountUnknown; // Only disable if we KNOW it's empty

                // Debug logging for first class only to avoid spam
                if (className === 'KG1') {
                  console.log('🔍 Button state:', {
                    className,
                    count,
                    isCountUnknown,
                    isEmpty,
                    shouldDisable,
                    promoting,
                    finalDisabled: shouldDisable || promoting
                  });
                }

                return (
                  <button
                    key={className}
                    onClick={() => handleClassChange(className)}
                    disabled={shouldDisable || promoting}
                    className={`p-3 rounded-xl border-2 transition-all font-bold backdrop-blur-sm ${
                      isSelected
                        ? 'bg-gradient-to-br from-green-500/90 to-blue-600/90 text-white border-white/50 shadow-lg'
                        : shouldDisable
                        ? 'bg-white/10 text-white/40 border-white/20 cursor-not-allowed'
                        : 'bg-white/20 text-white border-white/30 hover:bg-white/30 hover:border-white/50 hover:scale-105 cursor-pointer'
                    }`}
                    style={{ minHeight: '44px' }}
                  >
                    <div className="font-bold text-lg">{className}</div>
                    <div className="text-xs mt-1 opacity-90">
                      {isCountUnknown ? '?' : `${count} student${count !== 1 ? 's' : ''}`}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Review Students */}
          {selectedClass && (
            <div className="p-4 bg-white/10 border-2 border-white/30 rounded-xl backdrop-blur-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-white text-lg flex items-center gap-2">
                  <span>2️⃣</span>
                  Step 2: Review Students in {selectedClass} ({selectedStudents.length}/{students.length} selected)
                </h3>
                <button
                  onClick={handleSelectAll}
                  disabled={promoting}
                  className="px-4 py-2 text-sm bg-yellow-500/90 border-2 border-white/50 text-white rounded-xl hover:bg-yellow-600 transition-colors font-bold shadow-md"
                  style={{ minHeight: '44px' }}
                >
                  {selectedStudents.length === students.length ? '❌ Deselect All' : '✅ Select All'}
                </button>
              </div>

              {loading ? (
                <div className="text-center py-8 bg-white/10 rounded-xl backdrop-blur-sm">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white mx-auto"></div>
                  <p className="mt-2 text-white font-medium">Loading students...</p>
                </div>
              ) : students.length === 0 ? (
                <div className="text-center py-8 bg-white/10 rounded-xl backdrop-blur-sm text-white/70 font-medium">
                  No students found in {selectedClass}
                </div>
              ) : (
                <div className="bg-white/10 border-2 border-white/30 rounded-xl divide-y divide-white/20 max-h-64 overflow-y-auto backdrop-blur-sm">
                  {students.map(student => {
                    const isSelected = selectedStudents.includes(student.id);

                    return (
                      <label
                        key={student.id}
                        className={`flex items-center p-3 hover:bg-white/10 cursor-pointer transition-colors ${
                          isSelected ? 'bg-white/10' : ''
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleStudentToggle(student.id)}
                          disabled={promoting}
                          className="mr-3 h-5 w-5 text-yellow-600 focus:ring-yellow-500 border-white/30 rounded"
                        />
                        <div className="flex-1">
                          <p className="font-bold text-white">
                            {student.firstName} {student.lastName}
                          </p>
                          <p className="text-sm text-white/80 font-medium">
                            ID: {student.idNumber} • {student.gender}
                          </p>
                        </div>
                        {isSelected && (
                          <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Select Target Class */}
          {selectedClass && students.length > 0 && (
            <div className="p-4 bg-white/10 border-2 border-white/30 rounded-xl backdrop-blur-md">
              <h3 className="font-bold text-white text-lg mb-4 flex items-center gap-2">
                <span>3️⃣</span>
                Step 3: Select Target Class
              </h3>
              <div className="bg-blue-500/20 border-2 border-blue-500/50 rounded-xl p-4 backdrop-blur-sm">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-white text-lg px-4 py-2 bg-white/20 rounded-xl border-2 border-white/30 backdrop-blur-sm">{selectedClass}</span>
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </div>
                  <select
                    value={targetClass}
                    onChange={(e) => setTargetClass(e.target.value)}
                    disabled={promoting}
                    className={`flex-1 px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 backdrop-blur-md font-bold text-white ${
                      targetClass === 'Graduated'
                        ? 'border-red-400/50 bg-red-500/30'
                        : 'border-white/30 bg-white/20'
                    }`}
                    style={{ minHeight: '44px', fontSize: '16px' }}
                  >
                    <option value="" className="bg-gray-800">Select Target Class</option>
                    {availableTargetClasses.map(cls => (
                      <option key={cls} value={cls} className="bg-gray-800">
                        {cls === 'Graduated' ? '🎓 Graduated' : cls}
                      </option>
                    ))}
                  </select>
                </div>

                {targetClass && (
                  <div className="mt-3 p-3 bg-green-500/20 border-2 border-green-500/50 text-white text-sm rounded-xl backdrop-blur-md font-semibold">
                    ✅ Will promote <strong>{selectedStudents.length} student(s)</strong> from{' '}
                    <strong>{selectedClass}</strong> to <strong>{targetClass}</strong>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 4: Settings */}
          {selectedClass && targetClass && (
            <div className="p-4 bg-white/10 border-2 border-white/30 rounded-xl backdrop-blur-md">
              <h3 className="font-bold text-white text-lg mb-4 flex items-center gap-2">
                <span>4️⃣</span>
                Step 4: Promotion Settings
              </h3>
              <div className="bg-blue-500/20 border-2 border-blue-500/50 rounded-xl p-4 backdrop-blur-sm space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-white mb-2">
                      Academic Year <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={academicYear}
                      onChange={(e) => setAcademicYear(e.target.value)}
                      placeholder="2025/2026"
                      disabled={promoting}
                      className="w-full px-4 py-3 bg-white/20 border-2 border-white/30 rounded-xl text-white placeholder-white/60 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 backdrop-blur-md font-medium"
                      style={{ minHeight: '44px', fontSize: '16px' }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-white mb-2">
                      Starting Term
                    </label>
                    <select
                      value={term}
                      onChange={(e) => setTerm(e.target.value)}
                      disabled={promoting}
                      className="w-full px-4 py-3 bg-white/20 border-2 border-white/30 rounded-xl text-white focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 backdrop-blur-md font-medium"
                      style={{ minHeight: '44px', fontSize: '16px' }}
                    >
                      <option value="First Term" className="bg-gray-800">First Term</option>
                      <option value="Second Term" className="bg-gray-800">Second Term</option>
                      <option value="Third Term" className="bg-gray-800">Third Term</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Warning */}
          {targetClass === 'Graduated' && (
            <div className="bg-red-500/30 border-2 border-red-400/50 rounded-xl p-4 backdrop-blur-md">
              <div className="flex gap-3">
                <svg className="w-6 h-6 text-red-200 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <h4 className="font-bold text-white">⚠️ Graduation Warning</h4>
                  <p className="text-sm text-white/90 mt-1 font-medium">
                    Students will be marked as GRADUATED. Make sure you've archived the current term first.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t-2 border-white/30 p-6 flex flex-col sm:flex-row justify-end gap-3">
          <button
            onClick={onClose}
            disabled={promoting}
            className="px-6 py-3 bg-white/20 border-2 border-white/30 hover:bg-white/30 text-white rounded-xl font-semibold transition-all backdrop-blur-md disabled:opacity-50"
            style={{ minHeight: '44px', minWidth: '100px' }}
          >
            Cancel
          </button>
          <button
            onClick={handlePromote}
            disabled={promoting || !selectedClass || selectedStudents.length === 0 || !targetClass || !academicYear}
            className="px-6 py-3 bg-gradient-to-r from-green-500/90 to-blue-600/90 border-2 border-white/50 text-white rounded-xl hover:from-green-600 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-bold shadow-lg"
            style={{ minHeight: '44px', minWidth: '180px' }}
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
                <span>📈 Promote {selectedStudents.length} Student{selectedStudents.length !== 1 ? 's' : ''}</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClassPromotionWithStudents;
