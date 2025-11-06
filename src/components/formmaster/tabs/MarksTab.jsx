import { useMemo } from 'react';
import PropTypes from 'prop-types';
import LoadingSpinner from '../../LoadingSpinner';

/**
 * MarksTab Component
 *
 * Displays student marks for all subjects the form master teaches.
 * Provides a comprehensive view of test scores, exam scores, totals, and grades.
 * Includes validation, automatic calculation, and batch save functionality.
 *
 * This component is read-only and used in the "Manage Class" view.
 * For editable marks entry, see EnterScoresView.jsx
 */
const MarksTab = ({
  students,
  marksData,
  subjects,
  errors,
  saving,
  isLoading,
  onSaveAll
}) => {
  /**
   * Calculate grade based on total score
   */
  const calculateGrade = (total) => {
    const totalNum = parseFloat(total);
    if (totalNum >= 80) return 'A';
    if (totalNum >= 70) return 'B';
    if (totalNum >= 60) return 'C';
    if (totalNum >= 50) return 'D';
    if (totalNum >= 40) return 'E';
    if (totalNum > 0) return 'F';
    return '';
  };

  /**
   * Get CSS classes for grade badge
   */
  const getGradeClasses = (grade) => {
    const baseClasses = 'px-3 py-1 rounded text-sm font-bold';
    const gradeColors = {
      'A': 'bg-green-100 text-green-800',
      'B': 'bg-blue-100 text-blue-800',
      'C': 'bg-yellow-100 text-yellow-800',
      'D': 'bg-orange-100 text-orange-800',
      'E': 'bg-red-100 text-red-800',
      'F': 'bg-red-200 text-red-900'
    };
    return `${baseClasses} ${gradeColors[grade] || 'bg-gray-100 text-gray-800'}`;
  };

  /**
   * Memoize table rows to prevent unnecessary re-renders
   */
  const tableContent = useMemo(() => {
    if (!subjects || subjects.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <p>No subjects assigned to this form master.</p>
        </div>
      );
    }

    return subjects.map(subject => (
      <div key={subject} className="mb-8">
        <h3 className="text-lg font-medium mb-3">{subject}</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th
                  rowSpan="2"
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r"
                >
                  Student
                </th>
                <th
                  colSpan="6"
                  className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r bg-blue-50"
                >
                  Class Score (60 → 50%)
                </th>
                <th
                  colSpan="2"
                  className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r bg-green-50"
                >
                  Exam (100 → 50%)
                </th>
                <th
                  rowSpan="2"
                  className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r"
                >
                  Total (100)
                </th>
                <th
                  rowSpan="2"
                  className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Grade
                </th>
              </tr>
              <tr>
                <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase bg-blue-50">T1 (15)</th>
                <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase bg-blue-50">T2 (15)</th>
                <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase bg-blue-50">T3 (15)</th>
                <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase bg-blue-50">T4 (15)</th>
                <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase bg-blue-50">Total (60)</th>
                <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase bg-blue-50 border-r">50%</th>
                <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase bg-green-50">Score (100)</th>
                <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase bg-green-50 border-r">50%</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {students.map((learner) => {
                const studentId = learner.idNumber || learner.LearnerID;
                const studentMarks = marksData[subject]?.[studentId] || {};

                const test1 = studentMarks.test1 || '';
                const test2 = studentMarks.test2 || '';
                const test3 = studentMarks.test3 || '';
                const test4 = studentMarks.test4 || '';
                const testsTotal = studentMarks.testsTotal || '';
                const classScore50 = studentMarks.classScore50 || '';
                const exam = studentMarks.exam || '';
                const examScore50 = studentMarks.examScore50 || '';
                const total = studentMarks.total || '';
                const grade = calculateGrade(total);

                // Check for validation errors
                const test1Error = errors?.[`${subject}-${studentId}-test1`];
                const test2Error = errors?.[`${subject}-${studentId}-test2`];
                const test3Error = errors?.[`${subject}-${studentId}-test3`];
                const test4Error = errors?.[`${subject}-${studentId}-test4`];
                const examError = errors?.[`${subject}-${studentId}-exam`];

                return (
                  <tr key={`${subject}-${studentId}`}>
                    {/* Student Info */}
                    <td className="px-4 py-3 whitespace-nowrap border-r">
                      <div className="text-sm font-medium text-gray-900">
                        {learner.firstName} {learner.lastName}
                      </div>
                      <div className="text-xs text-gray-500">{studentId}</div>
                    </td>

                    {/* Test 1 (Read-only) */}
                    <td className="px-2 py-3 whitespace-nowrap text-center">
                      <div className="text-sm text-gray-900">{test1 || '-'}</div>
                      {test1Error && <div className="text-red-500 text-xs mt-1">{test1Error}</div>}
                    </td>

                    {/* Test 2 (Read-only) */}
                    <td className="px-2 py-3 whitespace-nowrap text-center">
                      <div className="text-sm text-gray-900">{test2 || '-'}</div>
                      {test2Error && <div className="text-red-500 text-xs mt-1">{test2Error}</div>}
                    </td>

                    {/* Test 3 (Read-only) */}
                    <td className="px-2 py-3 whitespace-nowrap text-center">
                      <div className="text-sm text-gray-900">{test3 || '-'}</div>
                      {test3Error && <div className="text-red-500 text-xs mt-1">{test3Error}</div>}
                    </td>

                    {/* Test 4 (Read-only) */}
                    <td className="px-2 py-3 whitespace-nowrap text-center">
                      <div className="text-sm text-gray-900">{test4 || '-'}</div>
                      {test4Error && <div className="text-red-500 text-xs mt-1">{test4Error}</div>}
                    </td>

                    {/* Tests Total */}
                    <td className="px-2 py-3 whitespace-nowrap text-center bg-blue-50">
                      <div className="font-semibold text-blue-900">{testsTotal || '-'}</div>
                    </td>

                    {/* Class Score 50% */}
                    <td className="px-2 py-3 whitespace-nowrap text-center bg-blue-100 border-r">
                      <div className="font-bold text-blue-900">{classScore50 || '-'}</div>
                    </td>

                    {/* Exam Score */}
                    <td className="px-2 py-3 whitespace-nowrap text-center">
                      <div className="text-sm text-gray-900">{exam || '-'}</div>
                      {examError && <div className="text-red-500 text-xs mt-1">{examError}</div>}
                    </td>

                    {/* Exam 50% */}
                    <td className="px-2 py-3 whitespace-nowrap text-center bg-green-100 border-r">
                      <div className="font-bold text-green-900">{examScore50 || '-'}</div>
                    </td>

                    {/* Final Total */}
                    <td className="px-2 py-3 whitespace-nowrap text-center border-r">
                      <div className="text-lg font-bold text-gray-900">{total || '-'}</div>
                    </td>

                    {/* Grade Badge */}
                    <td className="px-2 py-3 whitespace-nowrap text-center">
                      <span className={getGradeClasses(grade)}>
                        {grade || '-'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    ));
  }, [students, marksData, subjects, errors]);

  return (
    <div>
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Student Marks</h2>

        {isLoading ? (
          <LoadingSpinner message="Loading marks data..." />
        ) : (
          <>
            {tableContent}

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={onSaveAll}
                disabled={saving}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? "Saving..." : "Save All Marks"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

MarksTab.propTypes = {
  /** Array of student objects */
  students: PropTypes.arrayOf(
    PropTypes.shape({
      idNumber: PropTypes.string,
      LearnerID: PropTypes.string,
      firstName: PropTypes.string.isRequired,
      lastName: PropTypes.string.isRequired
    })
  ).isRequired,

  /** Marks data structure: { subject: { studentId: { test1, test2, test3, test4, exam, ... } } } */
  marksData: PropTypes.objectOf(
    PropTypes.objectOf(
      PropTypes.shape({
        test1: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        test2: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        test3: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        test4: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        testsTotal: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        classScore50: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        exam: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        examScore50: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        total: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        grade: PropTypes.string
      })
    )
  ).isRequired,

  /** Array of subject names */
  subjects: PropTypes.arrayOf(PropTypes.string).isRequired,

  /** Validation errors: { "subject-studentId-field": "error message" } */
  errors: PropTypes.objectOf(PropTypes.string),

  /** Whether save operation is in progress */
  saving: PropTypes.bool,

  /** Whether data is being loaded */
  isLoading: PropTypes.bool,

  /** Callback function to save all marks */
  onSaveAll: PropTypes.func.isRequired
};

MarksTab.defaultProps = {
  errors: {},
  saving: false,
  isLoading: false
};

export default MarksTab;
