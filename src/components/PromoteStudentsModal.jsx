import { useState, useEffect } from 'react';
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
  'BS12': 'Graduated',
  'UNASSIGNED': 'BS1'
};

const PromoteStudentsModal = ({
  isOpen,
  onClose,
  students,
  onPromotionComplete,
  userRole = null,
  currentTerm = 'Third Term'
}) => {
  const { showNotification } = useNotification();
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [targetClass, setTargetClass] = useState('');
  const [useAutoPromotion, setUseAutoPromotion] = useState(true);
  const [academicYear, setAcademicYear] = useState('');
  const [term, setTerm] = useState('First Term');
  const [promoting, setPromoting] = useState(false);

  // Available target classes (loaded dynamically from API)
  const [availableTargetClasses, setAvailableTargetClasses] = useState([]);

  // Check if user is a form master
  const isFormMaster = userRole === 'form_master';

  useEffect(() => {
    if (isOpen) {
      // Load available classes
      loadAvailableClasses();
    }

    if (isOpen && students.length > 0) {
      // Auto-select all students
      setSelectedStudents(students.map(s => s.id));

      // Set suggested target class based on current class
      const firstStudentClass = students[0]?.className;
      if (firstStudentClass && CLASS_PROGRESSION[firstStudentClass]) {
        const nextClass = CLASS_PROGRESSION[firstStudentClass];
        setTargetClass(nextClass);

        // For form masters, only allow the next class in progression
        if (isFormMaster) {
          setAvailableTargetClasses([nextClass]);
        }
      }

      // Set default academic year (current year + 1)
      const currentYear = new Date().getFullYear();
      setAcademicYear(`${currentYear}/${currentYear + 1}`);
    }
  }, [isOpen, students, isFormMaster]);

  const loadAvailableClasses = async () => {
    // For form masters, classes are set in useEffect based on progression
    if (isFormMaster) {
      return;
    }

    try {
      const response = await fetch('/api/classes');
      const result = await response.json();

      if (result.status === 'success') {
        // Get class names from API - only for target (not including UNASSIGNED)
        const classNames = result.data.map(c => c.name).sort();
        const targetClasses = [...classNames, 'Graduated'];
        setAvailableTargetClasses(targetClasses);
        console.log('✅ Loaded target classes:', targetClasses);
      } else {
        console.warn('⚠️ Failed to load classes, using Graduated only');
        setAvailableTargetClasses(['Graduated']);
      }
    } catch (error) {
      console.error('⚠️ Error loading classes:', error);
      setAvailableTargetClasses(['Graduated']);
    }
  };

  const handleSelectAll = () => {
    if (selectedStudents.length === students.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(students.map(s => s.id));
    }
  };

  const handleSelectStudent = (studentId) => {
    setSelectedStudents(prev => {
      if (prev.includes(studentId)) {
        return prev.filter(id => id !== studentId);
      } else {
        return [...prev, studentId];
      }
    });
  };

  const handlePromote = async () => {
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

    if (targetClass === 'Graduated') {
      const confirm = window.confirm(
        `Are you sure you want to mark ${selectedStudents.length} student(s) as graduated? This action cannot be undone.`
      );
      if (!confirm) return;
    }

    setPromoting(true);

    try {
      const response = await fetch('/api/students/promote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          studentIds: selectedStudents,
          targetClass,
          academicYear,
          term
        })
      });

      const data = await response.json();

      if (data.status === 'success') {
        showNotification({
          type: 'success',
          title: 'Promotion Successful',
          message: `Successfully promoted ${data.data.successCount} student(s) to ${targetClass}`
        });

        if (data.data.errorCount > 0) {
          console.warn('Promotion errors:', data.data.errors);
          showNotification({
            type: 'warning',
            title: 'Partial Success',
            message: `${data.data.errorCount} student(s) could not be promoted`
          });
        }

        onPromotionComplete();
        onClose();
      } else {
        throw new Error(data.message || 'Promotion failed');
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

  const selectedCount = selectedStudents.length;
  const totalCount = students.length;

  // Check if form master can promote (only in Third Term)
  const canPromote = !isFormMaster || currentTerm === 'Third Term';

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
      onClick={onClose}
    >
      <div
        className="glass-card-golden rounded-xl shadow-2xl w-full max-w-3xl p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b-4 border-yellow-500/50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500/90 to-blue-600/90 backdrop-blur-sm flex items-center justify-center text-white text-2xl shadow-lg border-2 border-white/50">
              📈
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white text-shadow">Promote Students</h2>
              <p className="text-sm text-white/90">
                Promote students to the next class level
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-white/80 text-2xl font-bold p-2 hover:bg-white/20 rounded-xl transition-colors"
            style={{ minWidth: '44px', minHeight: '44px' }}
            disabled={promoting}
          >
            &times;
          </button>
        </div>

        {/* Third Term Restriction Warning for Form Masters */}
        {isFormMaster && !canPromote && (
          <div className="mb-6 p-4 bg-red-500/20 border-2 border-red-500/50 rounded-xl backdrop-blur-md">
            <div className="flex items-start gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <h3 className="font-bold text-white text-lg mb-2">Promotion Restricted</h3>
                <p className="text-white/90 text-sm mb-2">
                  As a Form Master, you can only promote students during <strong>Third Term</strong>.
                </p>
                <p className="text-white/80 text-sm">
                  Current term: <strong className="text-yellow-300">{currentTerm}</strong>
                </p>
                <p className="text-white/70 text-xs mt-2">
                  Please wait until Third Term or contact an administrator for assistance.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Form Master Restrictions Info */}
        {isFormMaster && canPromote && (
          <div className="mb-6 p-4 bg-blue-500/20 border-2 border-blue-500/50 rounded-xl backdrop-blur-md">
            <div className="flex items-start gap-3">
              <span className="text-2xl">ℹ️</span>
              <div>
                <h3 className="font-bold text-white text-lg mb-2">Form Master Promotion</h3>
                <p className="text-white/90 text-sm">
                  You can only promote students from your assigned class to the next class: <strong className="text-green-300">{targetClass}</strong>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Promotion Settings */}
        <div className="mb-6 p-4 bg-blue-500/20 border-2 border-blue-500/50 rounded-xl backdrop-blur-md space-y-4">
          <h3 className="font-bold text-white text-lg">⚙️ Promotion Settings</h3>

          {/* Target Class - Clickable Buttons */}
          <div>
            <label className="block text-sm font-bold text-white mb-3">
              Target Class <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-4">
              {availableTargetClasses.map(cls => {
                const isSelected = targetClass === cls;
                const isGraduated = cls === 'Graduated';
                return (
                  <button
                    key={cls}
                    onClick={() => setTargetClass(cls)}
                    disabled={promoting || isFormMaster}
                    className={`p-3 rounded-xl border-2 transition-all font-bold backdrop-blur-sm ${isFormMaster ? 'cursor-not-allowed' : 'cursor-pointer'} ${
                      isSelected
                        ? isGraduated
                          ? 'bg-gradient-to-br from-red-500/90 to-orange-600/90 text-white border-white/50 shadow-lg scale-105'
                          : 'bg-gradient-to-br from-green-500/90 to-blue-600/90 text-white border-white/50 shadow-lg scale-105'
                        : isGraduated
                        ? 'bg-red-500/30 text-white border-red-400/50 hover:bg-red-500/40 hover:border-red-400/70 hover:scale-105'
                        : 'bg-white/20 text-white border-white/30 hover:bg-white/30 hover:border-white/50 hover:scale-105'
                    }`}
                    style={{ minHeight: '44px' }}
                  >
                    <div className="text-base">{isGraduated ? '🎓' : cls}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Academic Year */}
            <div>
              <label className="block text-sm font-bold text-white mb-2">
                Academic Year
              </label>
              <input
                type="text"
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                placeholder="2024/2025"
                className="w-full px-4 py-3 bg-white/20 border-2 border-white/30 rounded-xl text-white placeholder-white/60 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 backdrop-blur-md font-medium"
                style={{ minHeight: '44px', fontSize: '16px' }}
                disabled={promoting}
              />
            </div>

            {/* Term */}
            <div>
              <label className="block text-sm font-bold text-white mb-2">
                Term
              </label>
              <select
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                className="w-full px-4 py-3 bg-white/20 border-2 border-white/30 rounded-xl text-white focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 backdrop-blur-md font-medium"
                style={{ minHeight: '44px', fontSize: '16px' }}
                disabled={promoting}
              >
                <option value="First Term" className="bg-gray-800">First Term</option>
                <option value="Second Term" className="bg-gray-800">Second Term</option>
                <option value="Third Term" className="bg-gray-800">Third Term</option>
              </select>
            </div>
          </div>

          {targetClass && (
            <div className="mt-2 p-3 bg-green-500/20 border-2 border-green-500/50 text-white text-sm rounded-xl backdrop-blur-md font-semibold">
              ✅ Will promote {selectedCount} student(s) to <strong>{targetClass}</strong>
            </div>
          )}
        </div>

        {/* Student Selection */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-white text-lg">
              👥 Select Students ({selectedCount}/{totalCount})
            </h3>
            <button
              onClick={handleSelectAll}
              className="px-4 py-2 text-sm bg-yellow-500/90 border-2 border-white/50 text-white rounded-xl hover:bg-yellow-600 transition-colors font-bold shadow-md"
              style={{ minHeight: '44px' }}
              disabled={promoting}
            >
              {selectedCount === totalCount ? '❌ Deselect All' : '✅ Select All'}
            </button>
          </div>

          <div className="max-h-64 overflow-y-auto bg-white/10 border-2 border-white/30 rounded-xl backdrop-blur-md">
            {students.length === 0 ? (
              <p className="p-4 text-center text-white/70">No students to promote</p>
            ) : (
              <div className="divide-y divide-white/20">
                {students.map(student => (
                  <label
                    key={student.id}
                    className="flex items-center p-3 hover:bg-white/10 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedStudents.includes(student.id)}
                      onChange={() => handleSelectStudent(student.id)}
                      className="mr-3 h-5 w-5 text-yellow-600 focus:ring-yellow-500 border-white/30 rounded"
                      disabled={promoting}
                    />
                    <div className="flex-1">
                      <p className="font-bold text-white">
                        {student.firstName} {student.lastName}
                      </p>
                      <p className="text-sm text-white/80 font-medium">
                        ID: {student.idNumber} • Current Class: {student.className}
                      </p>
                    </div>
                    <div className="ml-4 text-right flex items-center gap-2">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-500/30 border border-blue-400/50 text-white backdrop-blur-sm">
                        {student.className}
                      </span>
                      <span className="text-white/60 text-xl">→</span>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-500/30 border border-green-400/50 text-white backdrop-blur-sm">
                        {targetClass || '?'}
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t-2 border-white/30">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-white/20 border-2 border-white/30 hover:bg-white/30 text-white rounded-xl font-semibold transition-all backdrop-blur-md"
            style={{ minHeight: '44px', minWidth: '100px' }}
            disabled={promoting}
          >
            Cancel
          </button>
          <button
            onClick={handlePromote}
            disabled={promoting || selectedCount === 0 || !targetClass || !canPromote}
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
                <span>📈 Promote Students</span>
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

export default PromoteStudentsModal;
