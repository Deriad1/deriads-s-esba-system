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
 * Enhanced Promotion Modal
 * Complete control over source classes, target classes, and student selection
 */
const EnhancedPromotionModal = ({ isOpen, onClose, onComplete }) => {
  const { showNotification } = useNotification();

  // Step management
  const [step, setStep] = useState(1); // 1: Select source classes, 2: Select students, 3: Select target, 4: Review

  // Source class selection
  const [sourceClasses, setSourceClasses] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);

  // Students by class
  const [studentsByClass, setStudentsByClass] = useState({});
  const [selectedStudents, setSelectedStudents] = useState([]);

  // Target configuration
  const [targetMapping, setTargetMapping] = useState({}); // { studentId: targetClass }
  const [defaultTargetClass, setDefaultTargetClass] = useState('');
  const [academicYear, setAcademicYear] = useState('');
  const [term, setTerm] = useState('First Term');

  // Promotion state
  const [promoting, setPromoting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Set default academic year
      const currentYear = new Date().getFullYear();
      setAcademicYear(`${currentYear}/${currentYear + 1}`);

      // Reset state
      setStep(1);
      setSourceClasses([]);
      setStudentsByClass({});
      setSelectedStudents([]);
      setTargetMapping({});
    }
  }, [isOpen]);

  // Step 1: Load students when source classes change
  useEffect(() => {
    if (sourceClasses.length > 0 && step >= 2) {
      loadStudents();
    }
  }, [sourceClasses, step]);

  const loadStudents = async () => {
    setStudentsLoading(true);
    try {
      const response = await fetch('/api/students');
      const result = await response.json();

      if (result.status === 'success') {
        const students = result.data;

        // Group students by class
        const grouped = {};
        sourceClasses.forEach(className => {
          grouped[className] = students.filter(s => s.class_name === className);
        });

        setStudentsByClass(grouped);

        // Auto-select all students
        const allStudentIds = Object.values(grouped)
          .flat()
          .map(s => s.id);
        setSelectedStudents(allStudentIds);

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
      setStudentsLoading(false);
    }
  };

  const handleSourceClassToggle = (className) => {
    setSourceClasses(prev => {
      if (prev.includes(className)) {
        return prev.filter(c => c !== className);
      } else {
        return [...prev, className].sort((a, b) =>
          ALL_CLASSES.indexOf(a) - ALL_CLASSES.indexOf(b)
        );
      }
    });
  };

  const handleSelectAllSourceClasses = () => {
    if (sourceClasses.length === ALL_CLASSES.length) {
      setSourceClasses([]);
    } else {
      setSourceClasses([...ALL_CLASSES]);
    }
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

  const handleSelectAllStudents = () => {
    const allStudentIds = Object.values(studentsByClass)
      .flat()
      .map(s => s.id);

    if (selectedStudents.length === allStudentIds.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(allStudentIds);
    }
  };

  const handleSelectClassStudents = (className) => {
    const classStudentIds = studentsByClass[className]?.map(s => s.id) || [];
    const allSelected = classStudentIds.every(id => selectedStudents.includes(id));

    if (allSelected) {
      // Deselect all from this class
      setSelectedStudents(prev => prev.filter(id => !classStudentIds.includes(id)));
    } else {
      // Select all from this class
      setSelectedStudents(prev => [...new Set([...prev, ...classStudentIds])]);
    }
  };

  const handleSetDefaultTarget = () => {
    if (!defaultTargetClass) {
      showNotification({
        type: 'warning',
        title: 'No Target Selected',
        message: 'Please select a default target class'
      });
      return;
    }

    const newMapping = {};
    selectedStudents.forEach(studentId => {
      newMapping[studentId] = defaultTargetClass;
    });
    setTargetMapping(newMapping);

    showNotification({
      type: 'success',
      title: 'Target Set',
      message: `Set ${defaultTargetClass} as target for ${selectedStudents.length} students`
    });
  };

  const handleAutoTarget = () => {
    const newMapping = {};

    Object.entries(studentsByClass).forEach(([className, students]) => {
      const targetClass = CLASS_PROGRESSION[className] || className;
      students.forEach(student => {
        if (selectedStudents.includes(student.id)) {
          newMapping[student.id] = targetClass;
        }
      });
    });

    setTargetMapping(newMapping);

    showNotification({
      type: 'success',
      title: 'Auto Target Set',
      message: 'Automatically assigned progression targets for all students'
    });
  };

  const handleIndividualTargetChange = (studentId, targetClass) => {
    setTargetMapping(prev => ({
      ...prev,
      [studentId]: targetClass
    }));
  };

  const handlePromote = async () => {
    // Validate
    const studentsWithoutTarget = selectedStudents.filter(id => !targetMapping[id]);
    if (studentsWithoutTarget.length > 0) {
      showNotification({
        type: 'warning',
        title: 'Missing Targets',
        message: `${studentsWithoutTarget.length} student(s) don't have a target class assigned`
      });
      return;
    }

    // Group by target class for confirmation
    const targetGroups = {};
    selectedStudents.forEach(studentId => {
      const target = targetMapping[studentId];
      if (!targetGroups[target]) targetGroups[target] = [];
      targetGroups[target].push(studentId);
    });

    const summary = Object.entries(targetGroups)
      .map(([target, ids]) => `  • ${ids.length} → ${target}`)
      .join('\n');

    const hasGraduating = Object.keys(targetGroups).includes('Graduated');
    let confirmMessage = `Promote ${selectedStudents.length} student(s)?\n\n${summary}`;

    if (hasGraduating) {
      confirmMessage += '\n\n⚠️ WARNING: Some students will be marked as GRADUATED!';
    }

    if (!confirm(confirmMessage)) return;

    setPromoting(true);

    try {
      // Promote students (group by target for efficiency)
      const promotionPromises = Object.entries(targetGroups).map(([targetClass, studentIds]) => {
        return fetch('/api/students/promote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            studentIds,
            targetClass,
            academicYear,
            term
          })
        });
      });

      const responses = await Promise.all(promotionPromises);
      const results = await Promise.all(responses.map(r => r.json()));

      const totalSuccess = results.reduce((sum, r) => sum + (r.data?.successCount || 0), 0);
      const totalErrors = results.reduce((sum, r) => sum + (r.data?.errorCount || 0), 0);

      if (totalSuccess > 0) {
        showNotification({
          type: 'success',
          title: 'Promotion Successful',
          message: `Successfully promoted ${totalSuccess} student(s)`
        });
      }

      if (totalErrors > 0) {
        showNotification({
          type: 'warning',
          title: 'Partial Success',
          message: `${totalErrors} student(s) could not be promoted`
        });
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

  const getSelectedStudentsList = () => {
    return Object.entries(studentsByClass)
      .flatMap(([className, students]) =>
        students.filter(s => selectedStudents.includes(s.id))
      );
  };

  const canProceedToStep2 = sourceClasses.length > 0;
  const canProceedToStep3 = selectedStudents.length > 0;
  const canProceedToStep4 = selectedStudents.every(id => targetMapping[id]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Student Promotion Wizard</h2>
              <p className="text-purple-100 mt-1">Step {step} of 4: {
                step === 1 ? 'Select Source Classes' :
                step === 2 ? 'Select Students' :
                step === 3 ? 'Assign Target Classes' :
                'Review & Confirm'
              }</p>
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

          {/* Progress Bar */}
          <div className="mt-4 flex gap-2">
            {[1, 2, 3, 4].map(i => (
              <div
                key={i}
                className={`flex-1 h-2 rounded-full transition-all ${
                  i <= step ? 'bg-white' : 'bg-white/30'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* STEP 1: Select Source Classes */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Select Classes to Promote FROM ({sourceClasses.length} selected)
                  </h3>
                  <button
                    onClick={handleSelectAllSourceClasses}
                    className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                  >
                    {sourceClasses.length === ALL_CLASSES.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>

                <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                  {ALL_CLASSES.map(className => {
                    const isSelected = sourceClasses.includes(className);
                    return (
                      <button
                        key={className}
                        onClick={() => handleSourceClassToggle(className)}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          isSelected
                            ? 'bg-blue-50 border-blue-500 text-blue-900'
                            : 'bg-white border-gray-200 text-white/90 hover:border-gray-300'
                        }`}
                      >
                        <div className="font-bold text-xl">{className}</div>
                        {isSelected && (
                          <svg className="w-5 h-5 mx-auto mt-1 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {sourceClasses.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-900">
                    ✓ Selected {sourceClasses.length} class(es): <strong>{sourceClasses.join(', ')}</strong>
                  </p>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Select Students */}
          {step === 2 && (
            <div className="space-y-6">
              {studentsLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading students...</p>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Select Students to Promote ({selectedStudents.length} selected)
                    </h3>
                    <button
                      onClick={handleSelectAllStudents}
                      className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                    >
                      {selectedStudents.length === Object.values(studentsByClass).flat().length ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>

                  {Object.entries(studentsByClass).map(([className, students]) => {
                    const classStudentIds = students.map(s => s.id);
                    const allSelected = classStudentIds.every(id => selectedStudents.includes(id));
                    const someSelected = classStudentIds.some(id => selectedStudents.includes(id));
                    const selectedCount = classStudentIds.filter(id => selectedStudents.includes(id)).length;

                    return (
                      <div key={className} className="border border-gray-200 rounded-lg overflow-hidden">
                        <div className="bg-gray-50 px-4 py-3 flex justify-between items-center border-b border-gray-200">
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={allSelected}
                              ref={input => {
                                if (input) input.indeterminate = someSelected && !allSelected;
                              }}
                              onChange={() => handleSelectClassStudents(className)}
                              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                            />
                            <span className="font-semibold text-gray-900">
                              {className} ({selectedCount}/{students.length})
                            </span>
                          </div>
                        </div>
                        <div className="divide-y divide-gray-200 max-h-64 overflow-y-auto">
                          {students.map(student => (
                            <label
                              key={student.id}
                              className="flex items-center p-3 hover:bg-gray-50 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={selectedStudents.includes(student.id)}
                                onChange={() => handleStudentToggle(student.id)}
                                className="mr-3 h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                              />
                              <div className="flex-1">
                                <p className="font-medium text-white">
                                  {student.first_name} {student.last_name}
                                </p>
                                <p className="text-sm text-white/80">
                                  ID: {student.id_number} • {student.gender}
                                </p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          )}

          {/* STEP 3: Assign Target Classes */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 space-y-4">
                <h3 className="font-semibold text-gray-900">Quick Actions</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Default Target */}
                  <div>
                    <label className="block text-sm font-medium text-white/90 mb-2">
                      Set Same Target for All
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={defaultTargetClass}
                        onChange={(e) => setDefaultTargetClass(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select Class</option>
                        {ALL_CLASSES.map(cls => (
                          <option key={cls} value={cls}>{cls}</option>
                        ))}
                        <option value="Graduated">Graduated</option>
                      </select>
                      <button
                        onClick={handleSetDefaultTarget}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Apply
                      </button>
                    </div>
                  </div>

                  {/* Auto Target */}
                  <div>
                    <label className="block text-sm font-medium text-white/90 mb-2">
                      Auto-Assign Progression
                    </label>
                    <button
                      onClick={handleAutoTarget}
                      className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Auto-Assign (KG1→KG2, BS7→BS8, etc.)
                    </button>
                  </div>
                </div>
              </div>

              {/* Individual Assignment */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Individual Student Targets</h3>
                <div className="border border-gray-200 rounded-lg divide-y divide-gray-200 max-h-96 overflow-y-auto">
                  {getSelectedStudentsList().map(student => (
                    <div key={student.id} className="p-3 flex items-center gap-4">
                      <div className="flex-1">
                        <p className="font-medium text-white">
                          {student.first_name} {student.last_name}
                        </p>
                        <p className="text-sm text-white/80">
                          Current: {student.class_name}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                        <select
                          value={targetMapping[student.id] || ''}
                          onChange={(e) => handleIndividualTargetChange(student.id, e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select Target</option>
                          {ALL_CLASSES.map(cls => (
                            <option key={cls} value={cls}>{cls}</option>
                          ))}
                          <option value="Graduated">Graduated</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Review & Confirm */}
          {step === 4 && (
            <div className="space-y-6">
              {/* Settings */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                <h3 className="font-semibold text-gray-900">Promotion Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white/90 mb-1">
                      Academic Year *
                    </label>
                    <input
                      type="text"
                      value={academicYear}
                      onChange={(e) => setAcademicYear(e.target.value)}
                      placeholder="2025/2026"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/90 mb-1">
                      Starting Term
                    </label>
                    <select
                      value={term}
                      onChange={(e) => setTerm(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="First Term">First Term</option>
                      <option value="Second Term">Second Term</option>
                      <option value="Third Term">Third Term</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Promotion Summary</h3>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-white/90">Target Class</th>
                        <th className="px-4 py-3 text-center text-sm font-medium text-white/90">Students</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-white/90">From Classes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {Object.entries(
                        selectedStudents.reduce((acc, studentId) => {
                          const target = targetMapping[studentId];
                          if (!acc[target]) acc[target] = [];
                          acc[target].push(studentId);
                          return acc;
                        }, {})
                      ).map(([targetClass, studentIds]) => {
                        const students = getSelectedStudentsList().filter(s => studentIds.includes(s.id));
                        const fromClasses = [...new Set(students.map(s => s.class_name))].sort();

                        return (
                          <tr key={targetClass} className={targetClass === 'Graduated' ? 'bg-red-50' : ''}>
                            <td className="px-4 py-3">
                              <span className={`font-semibold ${targetClass === 'Graduated' ? 'text-red-600' : 'text-gray-900'}`}>
                                {targetClass}
                                {targetClass === 'Graduated' && ' 🎓'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center font-bold">{studentIds.length}</td>
                            <td className="px-4 py-3 text-sm text-white/80">{fromClasses.join(', ')}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-gray-50 border-t-2 border-gray-300">
                      <tr>
                        <td className="px-4 py-3 font-bold text-gray-900">TOTAL</td>
                        <td className="px-4 py-3 text-center font-bold text-gray-900">{selectedStudents.length}</td>
                        <td className="px-4 py-3"></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Warnings */}
              {Object.keys(targetMapping).some(id => targetMapping[id] === 'Graduated') && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex gap-3">
                    <svg className="w-6 h-6 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div>
                      <h4 className="font-semibold text-red-900">Graduation Warning</h4>
                      <p className="text-sm text-red-800 mt-1">
                        Some students will be marked as GRADUATED. This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 bg-gray-50 flex justify-between">
          <div>
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                disabled={promoting}
                className="px-6 py-2 border border-gray-300 text-white/90 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                ← Back
              </button>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={promoting}
              className="px-6 py-2 border border-gray-300 text-white/90 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>

            {step < 4 ? (
              <button
                onClick={() => setStep(step + 1)}
                disabled={
                  (step === 1 && !canProceedToStep2) ||
                  (step === 2 && !canProceedToStep3) ||
                  (step === 3 && !canProceedToStep4)
                }
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next →
              </button>
            ) : (
              <button
                onClick={handlePromote}
                disabled={promoting || !academicYear}
                className="px-6 py-2 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:from-green-700 hover:to-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
                    <span>Promote {selectedStudents.length} Students</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedPromotionModal;
