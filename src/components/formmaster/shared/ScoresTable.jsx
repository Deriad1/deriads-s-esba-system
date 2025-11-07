import PropTypes from 'prop-types';
import ScoreEntryRow from '../../ScoreEntryRow';

/**
 * ScoresTable Component
 *
 * Reusable scores table that eliminates duplication between:
 * - ManageClassView > MarksTab (read-only mode)
 * - EnterScoresView (editable mode)
 *
 * This component consolidates ~400 lines of duplicated table markup into
 * a single, configurable component that works in both contexts.
 *
 * Features:
 * - Editable mode: Uses ScoreEntryRow component for input
 * - Read-only mode: Displays data in simple table rows
 * - Draft indicators: Shows save status per student
 * - Bulk save: "Save All Scores" button
 * - Responsive design: Horizontal scroll for mobile
 * - Grade calculation and color coding
 *
 * @component
 * @example
 * // Editable mode (Enter Scores view)
 * <ScoresTable
 *   students={filteredStudents}
 *   marks={subjectMarks}
 *   isEditable={true}
 *   onMarkChange={handleMarkChange}
 *   onSave={handleSave}
 *   onSaveAll={handleSaveAll}
 *   showDraftIndicators={true}
 *   saving={savingScores}
 *   savedStudents={savedStudents}
 * />
 *
 * @example
 * // Read-only mode (Manage Class view)
 * <ScoresTable
 *   students={filteredStudents}
 *   marks={marksData[subject]}
 *   isEditable={false}
 *   readOnly={true}
 * />
 */
const ScoresTable = ({
  students,
  marks,
  isEditable = false,
  readOnly = false,
  onMarkChange,
  onSave,
  onSaveAll,
  showDraftIndicators = false,
  saving = false,
  savedStudents = new Set()
}) => {
  /**
   * Calculate grade based on total score
   */
  const calculateGrade = (total) => {
    const totalNum = parseFloat(total);
    if (isNaN(totalNum) || totalNum === 0) return '';
    if (totalNum >= 80) return 'A';
    if (totalNum >= 70) return 'B';
    if (totalNum >= 60) return 'C';
    if (totalNum >= 50) return 'D';
    if (totalNum >= 40) return 'E';
    return 'F';
  };

  /**
   * Get grade styling classes
   */
  const getGradeClass = (grade) => {
    const gradeMap = {
      'A': 'bg-green-100 text-green-800',
      'B': 'bg-blue-100 text-blue-800',
      'C': 'bg-yellow-100 text-yellow-800',
      'D': 'bg-orange-100 text-orange-800',
      'E': 'bg-red-100 text-red-800',
      'F': 'bg-red-200 text-red-900'
    };
    return gradeMap[grade] || 'bg-gray-100 text-gray-800';
  };

  /**
   * Calculate totals for a student (for read-only mode)
   */
  const calculateTotals = (studentMarks) => {
    if (!studentMarks) {
      return {
        testsTotal: '',
        classScore50: '',
        examScore50: '',
        total: '',
        grade: ''
      };
    }

    const test1 = parseFloat(studentMarks.test1) || 0;
    const test2 = parseFloat(studentMarks.test2) || 0;
    const test3 = parseFloat(studentMarks.test3) || 0;
    const test4 = parseFloat(studentMarks.test4) || 0;
    const testsTotal = test1 + test2 + test3 + test4;
    const classScore50 = (testsTotal / 60) * 50;

    const exam = parseFloat(studentMarks.exam) || 0;
    const examScore50 = exam * 0.5;

    const total = classScore50 + examScore50;
    const grade = calculateGrade(total);

    return {
      testsTotal: testsTotal > 0 ? testsTotal.toFixed(1) : '',
      classScore50: classScore50 > 0 ? classScore50.toFixed(1) : '',
      examScore50: examScore50 > 0 ? examScore50.toFixed(1) : '',
      total: total > 0 ? total.toFixed(1) : '',
      grade
    };
  };

  if (!students || students.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No students found
      </div>
    );
  }

  return (
    <div>
      {/* Save All Button - Only in editable mode */}
      {isEditable && onSaveAll && (
        <div className="mb-4 flex justify-end">
          <button
            onClick={onSaveAll}
            disabled={saving}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'Saving...' : 'Save All Scores'}
          </button>
        </div>
      )}

      {/* Scores Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
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
                style={{ minWidth: isEditable ? '100px' : '80px' }}
              >
                {isEditable ? 'Grade / Action' : 'Grade'}
              </th>
            </tr>
            <tr>
              <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase bg-blue-50">
                T1 (15)
              </th>
              <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase bg-blue-50">
                T2 (15)
              </th>
              <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase bg-blue-50">
                T3 (15)
              </th>
              <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase bg-blue-50">
                T4 (15)
              </th>
              <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase bg-blue-50">
                Total (60)
              </th>
              <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase bg-blue-50 border-r">
                50%
              </th>
              <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase bg-green-50">
                Score (100)
              </th>
              <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase bg-green-50 border-r">
                50%
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {students.map((student) => {
              const studentId = student.idNumber || student.LearnerID;
              const studentMarks = marks?.[studentId] || {};
              const isSaved = savedStudents.has(studentId);

              // For read-only mode, use stored values or calculate
              const {
                testsTotal,
                classScore50,
                examScore50,
                total,
                grade
              } = readOnly
                ? {
                    testsTotal: studentMarks.testsTotal || '',
                    classScore50: studentMarks.classScore50 || '',
                    examScore50: studentMarks.examScore50 || '',
                    total: studentMarks.total || '',
                    grade: studentMarks.grade || calculateGrade(studentMarks.total)
                  }
                : calculateTotals(studentMarks);

              // Editable mode - use ScoreEntryRow
              if (isEditable && !readOnly) {
                return (
                  <tr key={studentId} className={isSaved ? 'bg-green-50' : ''}>
                    <td className="px-4 py-3 whitespace-nowrap border-r">
                      <div className="text-sm font-medium text-gray-900">
                        {student.firstName} {student.lastName}
                      </div>
                      <div className="text-xs text-gray-500">{studentId}</div>
                      {showDraftIndicators && isSaved && (
                        <span className="text-xs text-green-600">✓ Saved</span>
                      )}
                    </td>

                    {/* Test 1 */}
                    <td className="px-2 py-3">
                      <input
                        type="number"
                        min="0"
                        max="15"
                        step="0.5"
                        value={studentMarks.test1 ?? ''}
                        onChange={(e) => onMarkChange(studentId, 'test1', e.target.value)}
                        className="w-16 p-1 border border-gray-300 rounded text-center focus:ring-2 focus:ring-blue-500"
                        placeholder="0-15"
                      />
                    </td>

                    {/* Test 2 */}
                    <td className="px-2 py-3">
                      <input
                        type="number"
                        min="0"
                        max="15"
                        step="0.5"
                        value={studentMarks.test2 ?? ''}
                        onChange={(e) => onMarkChange(studentId, 'test2', e.target.value)}
                        className="w-16 p-1 border border-gray-300 rounded text-center focus:ring-2 focus:ring-blue-500"
                        placeholder="0-15"
                      />
                    </td>

                    {/* Test 3 */}
                    <td className="px-2 py-3">
                      <input
                        type="number"
                        min="0"
                        max="15"
                        step="0.5"
                        value={studentMarks.test3 ?? ''}
                        onChange={(e) => onMarkChange(studentId, 'test3', e.target.value)}
                        className="w-16 p-1 border border-gray-300 rounded text-center focus:ring-2 focus:ring-blue-500"
                        placeholder="0-15"
                      />
                    </td>

                    {/* Test 4 */}
                    <td className="px-2 py-3">
                      <input
                        type="number"
                        min="0"
                        max="15"
                        step="0.5"
                        value={studentMarks.test4 ?? ''}
                        onChange={(e) => onMarkChange(studentId, 'test4', e.target.value)}
                        className="w-16 p-1 border border-gray-300 rounded text-center focus:ring-2 focus:ring-blue-500"
                        placeholder="0-15"
                      />
                    </td>

                    {/* Tests Total */}
                    <td className="px-2 py-3 text-center bg-blue-50">
                      <div className="font-semibold text-blue-900">{testsTotal}</div>
                    </td>

                    {/* Class Score 50% */}
                    <td className="px-2 py-3 text-center bg-blue-100 border-r">
                      <div className="font-bold text-blue-900">{classScore50}</div>
                    </td>

                    {/* Exam */}
                    <td className="px-2 py-3">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        value={studentMarks.exam ?? ''}
                        onChange={(e) => onMarkChange(studentId, 'exam', e.target.value)}
                        className="w-20 p-1 border border-gray-300 rounded text-center focus:ring-2 focus:ring-blue-500"
                        placeholder="0-100"
                      />
                    </td>

                    {/* Exam 50% */}
                    <td className="px-2 py-3 text-center bg-green-100 border-r">
                      <div className="font-bold text-green-900">{examScore50}</div>
                    </td>

                    {/* Final Total */}
                    <td className="px-2 py-3 text-center border-r">
                      <div className="text-lg font-bold text-gray-900">{total}</div>
                    </td>

                    {/* Grade and Save Button */}
                    <td className="px-2 py-3 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <span className={`px-3 py-1 rounded text-sm font-bold ${getGradeClass(grade)}`}>
                          {grade || '-'}
                        </span>
                        <button
                          onClick={() => onSave(studentId)}
                          disabled={saving}
                          className={`px-3 py-1 rounded text-xs font-medium ${
                            isSaved
                              ? 'bg-green-600 text-white'
                              : 'bg-blue-600 hover:bg-blue-700 text-white'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          {isSaved ? '✓ Saved' : 'Save'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }

              // Read-only mode - simple display rows
              return (
                <tr key={studentId}>
                  <td className="px-4 py-3 whitespace-nowrap border-r">
                    <div className="text-sm font-medium text-gray-900">
                      {student.firstName} {student.lastName}
                    </div>
                    <div className="text-xs text-gray-500">{studentId}</div>
                  </td>

                  {/* Test 1 */}
                  <td className="px-2 py-3 whitespace-nowrap text-center">
                    {studentMarks.test1 || '-'}
                  </td>

                  {/* Test 2 */}
                  <td className="px-2 py-3 whitespace-nowrap text-center">
                    {studentMarks.test2 || '-'}
                  </td>

                  {/* Test 3 */}
                  <td className="px-2 py-3 whitespace-nowrap text-center">
                    {studentMarks.test3 || '-'}
                  </td>

                  {/* Test 4 */}
                  <td className="px-2 py-3 whitespace-nowrap text-center">
                    {studentMarks.test4 || '-'}
                  </td>

                  {/* Tests Total */}
                  <td className="px-2 py-3 whitespace-nowrap text-center bg-blue-50">
                    <div className="font-semibold text-blue-900">{testsTotal || '-'}</div>
                  </td>

                  {/* Class Score 50% */}
                  <td className="px-2 py-3 whitespace-nowrap text-center bg-blue-100 border-r">
                    <div className="font-bold text-blue-900">{classScore50 || '-'}</div>
                  </td>

                  {/* Exam */}
                  <td className="px-2 py-3 whitespace-nowrap text-center">
                    {studentMarks.exam || '-'}
                  </td>

                  {/* Exam 50% */}
                  <td className="px-2 py-3 whitespace-nowrap text-center bg-green-100 border-r">
                    <div className="font-bold text-green-900">{examScore50 || '-'}</div>
                  </td>

                  {/* Final Total */}
                  <td className="px-2 py-3 whitespace-nowrap text-center border-r">
                    <div className="text-lg font-bold text-gray-900">{total || '-'}</div>
                  </td>

                  {/* Grade */}
                  <td className="px-2 py-3 whitespace-nowrap text-center">
                    <span className={`px-3 py-1 rounded text-sm font-bold ${getGradeClass(grade)}`}>
                      {grade || '-'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Optional footer info */}
      {isEditable && students.length > 0 && (
        <div className="mt-4 text-sm text-gray-600 text-center">
          {students.length} student{students.length !== 1 ? 's' : ''} •{' '}
          {savedStudents.size} saved •{' '}
          {students.length - savedStudents.size} pending
        </div>
      )}
    </div>
  );
};

ScoresTable.propTypes = {
  /**
   * Array of student objects
   */
  students: PropTypes.arrayOf(
    PropTypes.shape({
      idNumber: PropTypes.string,
      LearnerID: PropTypes.string,
      firstName: PropTypes.string.isRequired,
      lastName: PropTypes.string.isRequired
    })
  ).isRequired,

  /**
   * Object containing marks data keyed by student ID
   * Format: { studentId: { test1, test2, test3, test4, exam, ... } }
   */
  marks: PropTypes.object.isRequired,

  /**
   * Whether the table is in editable mode
   */
  isEditable: PropTypes.bool,

  /**
   * Whether the table is read-only (display only)
   */
  readOnly: PropTypes.bool,

  /**
   * Callback for mark changes (required if isEditable=true)
   * Signature: (studentId, field, value) => void
   */
  onMarkChange: PropTypes.func,

  /**
   * Callback for saving individual student (required if isEditable=true)
   * Signature: (studentId) => void
   */
  onSave: PropTypes.func,

  /**
   * Callback for saving all students
   * Signature: () => void
   */
  onSaveAll: PropTypes.func,

  /**
   * Whether to show draft/saved indicators
   */
  showDraftIndicators: PropTypes.bool,

  /**
   * Whether save operation is in progress
   */
  saving: PropTypes.bool,

  /**
   * Set of student IDs that have been saved
   */
  savedStudents: PropTypes.instanceOf(Set)
};

ScoresTable.defaultProps = {
  isEditable: false,
  readOnly: false,
  onMarkChange: null,
  onSave: null,
  onSaveAll: null,
  showDraftIndicators: false,
  saving: false,
  savedStudents: new Set()
};

export default ScoresTable;
