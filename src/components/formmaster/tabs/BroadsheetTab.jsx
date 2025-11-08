import PropTypes from 'prop-types';
import LoadingSpinner from '../../LoadingSpinner';

/**
 * BroadsheetTab Component
 *
 * Displays comprehensive broadsheet view for all subjects taught by the form master.
 * Shows detailed breakdown of test scores, exam scores, and final totals for each student.
 *
 * Features:
 * - Per-subject broadsheets
 * - Serial number, ID, full name columns
 * - Individual test scores (Test 1-4)
 * - Tests total and scaled 50%
 * - Exam score and scaled 50%
 * - Final total (out of 100)
 * - Remarks column
 * - Print functionality for each subject
 */
const BroadsheetTab = ({
  students,
  marksData,
  subjects,
  subjectTeachers,
  isLoading,
  onPrintBroadsheet
}) => {
  /**
   * Calculate broadsheet values for a student
   */
  const calculateBroadsheetValues = (studentMarks) => {
    // Note: The original code uses ca1/ca2 fields, but the MarksTab uses test1-test4
    // We'll use the test1-test4 fields for consistency
    const test1 = parseFloat(studentMarks.test1) || 0;
    const test2 = parseFloat(studentMarks.test2) || 0;
    const test3 = parseFloat(studentMarks.test3) || 0;
    const test4 = parseFloat(studentMarks.test4) || 0;

    const testsTotal = test1 + test2 + test3 + test4;
    const scaledTests = (testsTotal / 60) * 50;

    const exam = parseFloat(studentMarks.exam) || 0;
    const scaledExam = (exam / 100) * 50;

    const finalTotal = scaledTests + scaledExam;

    return {
      test1,
      test2,
      test3,
      test4,
      testsTotal,
      scaledTests,
      exam,
      scaledExam,
      finalTotal
    };
  };

  if (!subjects || subjects.length === 0) {
    return (
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl p-6 mb-6 border border-white/30">
        <h2 className="text-xl font-semibold mb-4 text-white drop-shadow-md">Class Broadsheet</h2>
        <div className="text-center py-8 text-white/70">
          <p>No subjects assigned to this form master.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl p-6 mb-6 border border-white/30">
        <h2 className="text-xl font-semibold mb-4 text-white drop-shadow-md">Class Broadsheet</h2>

        {subjects.map(subject => (
          <div key={subject} className="mb-6 p-4 bg-white/5 backdrop-blur-sm border border-white/20 rounded-lg">
            {/* Subject Header with Print Button */}
            <div className="flex justify-between items-center mb-3">
              <div>
                <h3 className="text-lg font-medium text-white drop-shadow-md">{subject}</h3>
                {subjectTeachers && subjectTeachers[subject] && (
                  <p className="text-sm text-white/70 mt-1">
                    Teacher: {subjectTeachers[subject]}
                  </p>
                )}
              </div>
              <button
                onClick={() => onPrintBroadsheet(subject)}
                className="bg-purple-500/80 backdrop-blur-md text-white px-4 py-2 rounded-md hover:bg-purple-600/90 transition-all shadow-lg border border-white/20 flex items-center gap-2"
              >
                <span>🖨️</span>
                Print Broadsheet
              </button>
            </div>

            {isLoading ? (
              <LoadingSpinner message="Loading broadsheet data..." />
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-white/20">
                  <thead className="bg-white/20 backdrop-blur-md">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white/90 uppercase tracking-wider">
                        S/N
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white/90 uppercase tracking-wider">
                        ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white/90 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white/90 uppercase tracking-wider">
                        Test 1
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white/90 uppercase tracking-wider">
                        Test 2
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white/90 uppercase tracking-wider">
                        Test 3
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white/90 uppercase tracking-wider">
                        Test 4
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white/90 uppercase tracking-wider">
                        Tests Total
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white/90 uppercase tracking-wider">
                        50%
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white/90 uppercase tracking-wider">
                        Exam
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white/90 uppercase tracking-wider">
                        50%
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white/90 uppercase tracking-wider">
                        Final Total
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white/90 uppercase tracking-wider">
                        Remarks
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white/5 backdrop-blur-sm divide-y divide-white/10">
                    {students.map((learner, index) => {
                      const studentId = learner.idNumber || learner.LearnerID;
                      const studentMarks = marksData[subject]?.[studentId] || {};

                      const {
                        test1,
                        test2,
                        test3,
                        test4,
                        testsTotal,
                        scaledTests,
                        exam,
                        scaledExam,
                        finalTotal
                      } = calculateBroadsheetValues(studentMarks);

                      return (
                        <tr key={studentId} className="hover:bg-white/10 transition-colors">
                          {/* Serial Number */}
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-white/70">
                            {index + 1}
                          </td>

                          {/* Student ID */}
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-white/70">
                            {studentId}
                          </td>

                          {/* Full Name */}
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white drop-shadow-md">
                            {learner.firstName} {learner.lastName}
                          </td>

                          {/* Test Scores */}
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-white/70">
                            {test1 || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-white/70">
                            {test2 || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-white/70">
                            {test3 || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-white/70">
                            {test4 || '-'}
                          </td>

                          {/* Tests Total */}
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white/90">
                            {testsTotal > 0 ? testsTotal : '-'}
                          </td>

                          {/* Scaled Tests (50%) */}
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-300">
                            {scaledTests > 0 ? scaledTests.toFixed(2) : '-'}
                          </td>

                          {/* Exam Score */}
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-white/70">
                            {exam || '-'}
                          </td>

                          {/* Scaled Exam (50%) */}
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-300">
                            {scaledExam > 0 ? scaledExam.toFixed(2) : '-'}
                          </td>

                          {/* Final Total */}
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-white drop-shadow-md">
                            {finalTotal > 0 ? finalTotal.toFixed(2) : '-'}
                          </td>

                          {/* Remarks */}
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-white/70">
                            {studentMarks.remark || ''}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Summary Stats */}
                {students.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-white/20">
                    <div className="flex justify-between items-center text-sm text-white/80">
                      <span>Total Students: <strong className="text-white">{students.length}</strong></span>
                      <span className="text-xs text-white/60">
                        Note: Scores are calculated as (Tests/60 × 50%) + (Exam/100 × 50%) = Total/100
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

BroadsheetTab.propTypes = {
  /** Array of student objects */
  students: PropTypes.arrayOf(
    PropTypes.shape({
      idNumber: PropTypes.string,
      LearnerID: PropTypes.string,
      firstName: PropTypes.string.isRequired,
      lastName: PropTypes.string.isRequired
    })
  ).isRequired,

  /** Marks data structure: { subject: { studentId: { test1, test2, test3, test4, exam, remark, ... } } } */
  marksData: PropTypes.objectOf(
    PropTypes.objectOf(
      PropTypes.shape({
        test1: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        test2: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        test3: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        test4: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        exam: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        remark: PropTypes.string
      })
    )
  ).isRequired,

  /** Array of subject names */
  subjects: PropTypes.arrayOf(PropTypes.string).isRequired,

  /** Mapping of subject names to teacher names */
  subjectTeachers: PropTypes.objectOf(PropTypes.string),

  /** Whether data is being loaded */
  isLoading: PropTypes.bool,

  /** Callback function to print broadsheet for a specific subject */
  onPrintBroadsheet: PropTypes.func.isRequired
};

BroadsheetTab.defaultProps = {
  isLoading: false
};

export default BroadsheetTab;
