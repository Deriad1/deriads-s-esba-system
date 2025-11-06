import React, { useState, useEffect, useRef } from 'react';
import { formatMockExamResult, getMockExamGradeColorClass } from '../utils/gradeHelpers';

/**
 * Responsive Score Entry Component
 * - Desktop: Table view with all fields visible
 * - Mobile: Card view with numeric keypad and tab/enter navigation
 * - Supports both regular term scores and custom assessments
 */
const ResponsiveScoreEntry = ({
  learners,
  marks,
  onMarkChange,
  onSaveStudent,
  savedStudents,
  saving,
  calculateTotals,
  positions,
  getRemarks,
  assessmentType = 'regular', // 'regular' or 'custom'
  customAssessmentInfo = null // { name, max_score }
}) => {
  const isCustomAssessment = assessmentType === 'custom';
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);
  const [currentStudentIndex, setCurrentStudentIndex] = useState(0);
  const [currentField, setCurrentField] = useState(isCustomAssessment ? 'score' : 'test1');

  const test1Ref = useRef(null);
  const test2Ref = useRef(null);
  const test3Ref = useRef(null);
  const test4Ref = useRef(null);
  const examRef = useRef(null);
  const scoreRef = useRef(null); // For custom assessments

  const fieldRefs = {
    test1: test1Ref,
    test2: test2Ref,
    test3: test3Ref,
    test4: test4Ref,
    exam: examRef,
    score: scoreRef
  };

  // Fields depend on assessment type
  const fields = isCustomAssessment ? ['score'] : ['test1', 'test2', 'test3', 'test4', 'exam'];

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Focus current field when it changes
  useEffect(() => {
    if (isMobileView && fieldRefs[currentField]?.current) {
      fieldRefs[currentField].current.focus();
    }
  }, [currentField, currentStudentIndex, isMobileView]);

  const currentStudent = learners[currentStudentIndex];
  // Support both camelCase (new) and snake_case (cached data) formats
  const studentId = currentStudent?.idNumber || currentStudent?.id_number || currentStudent?.LearnerID;
  const studentMarks = marks[studentId] || {};
  const totals = calculateTotals(studentMarks);
  const position = positions[studentId];
  const remarks = getRemarks(totals.finalTotal);
  const isSaved = savedStudents.has(studentId);

  const moveToNextField = () => {
    const currentFieldIndex = fields.indexOf(currentField);
    if (currentFieldIndex < fields.length - 1) {
      setCurrentField(fields[currentFieldIndex + 1]);
    } else {
      // Last field - move to next student
      nextStudent();
    }
  };

  const moveToPrevField = () => {
    const currentFieldIndex = fields.indexOf(currentField);
    if (currentFieldIndex > 0) {
      setCurrentField(fields[currentFieldIndex - 1]);
    }
  };

  const nextStudent = () => {
    if (currentStudentIndex < learners.length - 1) {
      setCurrentStudentIndex(currentStudentIndex + 1);
      setCurrentField('test1'); // Reset to first field
    }
  };

  const prevStudent = () => {
    if (currentStudentIndex > 0) {
      setCurrentStudentIndex(currentStudentIndex - 1);
      setCurrentField('test1'); // Reset to first field
    }
  };

  const handleKeyDown = (e, field) => {
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      moveToNextField();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      moveToPrevField();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      moveToNextField();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      nextStudent();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      prevStudent();
    }
  };

  const getMaxScore = (field) => {
    if (isCustomAssessment) {
      return customAssessmentInfo?.max_score || 100;
    }
    if (field === 'exam') return 100;
    return 15; // Tests
  };

  const getFieldLabel = (field) => {
    if (isCustomAssessment) {
      return customAssessmentInfo?.name || 'Score';
    }
    if (field === 'exam') return 'Exam Score';
    const testNum = field.replace('test', '');
    return `Test ${testNum}`;
  };

  // Mobile Card View
  if (isMobileView) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Student Progress Bar */}
        <div className="bg-white shadow-sm p-4 sticky top-0 z-10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">
              Student {currentStudentIndex + 1} of {learners.length}
            </span>
            <span className={`text-xs px-2 py-1 rounded-full ${
              isSaved ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
            }`}>
              {isSaved ? '✓ Saved' : 'Not saved'}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStudentIndex + 1) / learners.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Student Card */}
        <div className="p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 mb-4">
            {/* Student Info */}
            <div className="mb-6 pb-4 border-b-2 border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                {currentStudent?.firstName || currentStudent?.first_name} {currentStudent?.lastName || currentStudent?.last_name}
              </h2>
              <p className="text-gray-600 mt-1">ID: {studentId}</p>
            </div>

            {/* Score Entry Fields */}
            <div className="space-y-4">
              {fields.map((field) => (
                <div
                  key={field}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    currentField === field
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {getFieldLabel(field)} (Max: {getMaxScore(field)})
                  </label>
                  <input
                    ref={fieldRefs[field]}
                    type="number"
                    inputMode="decimal"
                    pattern="[0-9]*"
                    value={studentMarks[field] || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '' || /^\d*\.?\d*$/.test(value)) {
                        const numVal = parseFloat(value);
                        if (value === '' || (numVal >= 0 && numVal <= getMaxScore(field))) {
                          onMarkChange(studentId, field, value);
                        }
                      }
                    }}
                    onKeyDown={(e) => handleKeyDown(e, field)}
                    onFocus={() => setCurrentField(field)}
                    className="w-full text-3xl font-bold text-center p-4 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-200 focus:outline-none"
                    placeholder="0"
                    min="0"
                    max={getMaxScore(field)}
                    step="0.01"
                  />
                </div>
              ))}
            </div>

            {/* Totals Summary */}
            {isCustomAssessment ? (
              <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border-2 border-blue-200">
                <div className="text-center">
                  <p className="text-sm text-gray-600">Score</p>
                  <p className="text-4xl font-bold text-green-600">
                    {studentMarks.score || 0} / {customAssessmentInfo?.max_score || 100}
                  </p>
                  {studentMarks.score && (
                    <div className="mt-4 pt-4 border-t-2 border-gray-200">
                      {(() => {
                        const result = formatMockExamResult(
                          parseFloat(studentMarks.score),
                          customAssessmentInfo?.max_score || 100
                        );
                        return (
                          <>
                            <p className="text-sm text-gray-600">Percentage</p>
                            <p className="text-2xl font-bold text-blue-600">{result.percentage}%</p>
                            <p className="text-sm text-gray-600 mt-2">Grade</p>
                            <div className="flex justify-center mt-2">
                              <span className={`inline-flex items-center px-6 py-3 rounded-full text-2xl font-bold border-2 ${getMockExamGradeColorClass(result.grade)}`}>
                                {result.grade}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mt-2">{result.interpretation}</p>
                          </>
                        );
                      })()}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border-2 border-blue-200">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-sm text-gray-600">Tests (50%)</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {totals.testsScaled.toFixed(1)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Exam (50%)</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {totals.examScaled.toFixed(1)}
                    </p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t-2 border-gray-200">
                  <p className="text-sm text-gray-600 text-center">Final Total</p>
                  <p className="text-4xl font-bold text-center text-green-600">
                    {totals.finalTotal.toFixed(1)}
                  </p>
                  {position && (
                    <p className="text-center mt-2">
                      <span className={`inline-flex items-center px-4 py-2 rounded-full text-lg font-bold ${
                        position === 1 ? 'bg-yellow-400 text-yellow-900' :
                        position === 2 ? 'bg-gray-300 text-gray-800' :
                        position === 3 ? 'bg-orange-400 text-orange-900' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {position === 1 ? '🥇 1st' :
                         position === 2 ? '🥈 2nd' :
                         position === 3 ? '🥉 3rd' :
                         `${position}th`}
                      </span>
                    </p>
                  )}
                  {remarks && (
                    <p className="text-center mt-2">
                      <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${
                        totals.finalTotal >= 80 ? 'bg-green-100 text-green-800' :
                        totals.finalTotal >= 70 ? 'bg-blue-100 text-blue-800' :
                        totals.finalTotal >= 60 ? 'bg-yellow-100 text-yellow-800' :
                        totals.finalTotal >= 50 ? 'bg-orange-100 text-orange-800' :
                        totals.finalTotal >= 40 ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {remarks}
                      </span>
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <button
              onClick={prevStudent}
              disabled={currentStudentIndex === 0}
              className="flex items-center justify-center gap-2 px-6 py-4 bg-gray-200 text-gray-700 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed active:bg-gray-300 transition-colors"
            >
              <span>←</span>
              <span>Previous</span>
            </button>
            <button
              onClick={nextStudent}
              disabled={currentStudentIndex === learners.length - 1}
              className="flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed active:bg-blue-700 transition-colors"
            >
              <span>Next</span>
              <span>→</span>
            </button>
          </div>

          {/* Save Button */}
          <button
            onClick={() => onSaveStudent(studentId)}
            disabled={saving}
            className={`w-full py-4 rounded-lg font-bold text-lg transition-colors ${
              isSaved
                ? 'bg-green-500 text-white'
                : 'bg-green-600 text-white hover:bg-green-700'
            } disabled:opacity-50 disabled:cursor-not-allowed active:bg-green-800`}
          >
            {saving ? 'Saving...' : isSaved ? '✓ Saved' : 'Save Student Scores'}
          </button>

          {/* Quick Navigation Hint */}
          <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
            <p className="font-semibold mb-1">💡 Quick Tips:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Press Enter or Tab to move to next field</li>
              <li>Scores auto-advance when complete</li>
              <li>Use arrow keys to navigate</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // Desktop Table View
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse border border-gray-300 text-sm">
        <thead>
          <tr className="bg-gray-50">
            <th className="border border-gray-300 p-3 text-left sticky left-0 bg-gray-50 z-10">Student Name</th>
            {isCustomAssessment ? (
              <>
                <th className="border border-gray-300 p-2">
                  {customAssessmentInfo?.name || 'Score'}<br/>
                  (0-{customAssessmentInfo?.max_score || 100})
                </th>
                <th className="border border-gray-300 p-2">Percentage</th>
                <th className="border border-gray-300 p-2">Grade</th>
                <th className="border border-gray-300 p-2">Interpretation</th>
                <th className="border border-gray-300 p-2 sticky right-0 bg-gray-50">Actions</th>
              </>
            ) : (
              <>
                <th className="border border-gray-300 p-2">Test 1<br/>(0-15)</th>
                <th className="border border-gray-300 p-2">Test 2<br/>(0-15)</th>
                <th className="border border-gray-300 p-2">Test 3<br/>(0-15)</th>
                <th className="border border-gray-300 p-2">Test 4<br/>(0-15)</th>
                <th className="border border-gray-300 p-2">Tests Total</th>
                <th className="border border-gray-300 p-2">50%</th>
                <th className="border border-gray-300 p-2">Exam<br/>(0-100)</th>
                <th className="border border-gray-300 p-2">50%</th>
                <th className="border border-gray-300 p-2">Final Total</th>
                <th className="border border-gray-300 p-2">Position</th>
                <th className="border border-gray-300 p-2">Remarks</th>
                <th className="border border-gray-300 p-2 sticky right-0 bg-gray-50">Actions</th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {learners.map((learner) => {
            // Support both camelCase (new) and snake_case (cached data) formats
            const studentId = learner.idNumber || learner.id_number || learner.LearnerID;
            const studentMarks = marks[studentId] || {};
            const totals = !isCustomAssessment ? calculateTotals(studentMarks) : null;
            const position = positions[studentId];
            const remarks = !isCustomAssessment ? getRemarks(totals?.finalTotal) : null;
            const isSaved = savedStudents.has(studentId);

            return (
              <tr key={studentId} className="hover:bg-gray-50">
                <td className="border border-gray-300 p-3 font-medium sticky left-0 bg-white">
                  {learner.firstName || learner.first_name} {learner.lastName || learner.last_name}
                </td>

                {isCustomAssessment ? (
                  // Custom assessment - single score field with grade
                  <>
                    <td className="border border-gray-300 p-1">
                      <input
                        type="text"
                        value={studentMarks.score || ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === '' || /^\d*\.?\d*$/.test(value)) {
                            const maxScore = customAssessmentInfo?.max_score || 100;
                            const numVal = parseFloat(value);
                            if (value === '' || (numVal >= 0 && numVal <= maxScore)) {
                              onMarkChange(studentId, 'score', value);
                            }
                          }
                        }}
                        className="w-20 p-2 border rounded text-center focus:ring-2 focus:ring-blue-500"
                        placeholder="0"
                        maxLength="5"
                      />
                    </td>
                    {(() => {
                      const result = studentMarks.score
                        ? formatMockExamResult(
                            parseFloat(studentMarks.score),
                            customAssessmentInfo?.max_score || 100
                          )
                        : { percentage: 0, grade: '-', interpretation: '-' };
                      return (
                        <>
                          <td className="border border-gray-300 p-3 text-center font-medium bg-blue-50">
                            {studentMarks.score ? `${result.percentage}%` : '-'}
                          </td>
                          <td className="border border-gray-300 p-3 text-center">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold border-2 ${getMockExamGradeColorClass(result.grade)}`}>
                              {result.grade}
                            </span>
                          </td>
                          <td className="border border-gray-300 p-2 text-center text-xs">
                            {result.interpretation}
                          </td>
                        </>
                      );
                    })()}
                    <td className="border border-gray-300 p-3 text-center sticky right-0 bg-white">
                      <button
                        onClick={() => onSaveStudent(studentId)}
                        disabled={saving}
                        className={`px-3 py-1 rounded text-sm flex items-center justify-center ${
                          isSaved
                            ? 'bg-green-100 text-green-800'
                            : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                        }`}
                        title={isSaved ? "Saved" : "Save student marks"}
                      >
                        {isSaved ? '✓' : 'Save'}
                      </button>
                    </td>
                  </>
                ) : (
                  // Regular term scores
                  <>
                    {['test1', 'test2', 'test3', 'test4'].map((test) => (
                      <td key={test} className="border border-gray-300 p-1">
                        <input
                          type="text"
                          value={studentMarks[test] || ''}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === '' || /^\d*\.?\d*$/.test(value)) {
                              onMarkChange(studentId, test, value);
                            }
                          }}
                          className="w-16 p-2 border rounded text-center focus:ring-2 focus:ring-blue-500"
                          placeholder="0"
                          maxLength="4"
                        />
                      </td>
                    ))}

                    <td className="border border-gray-300 p-3 text-center font-medium bg-gray-50">
                      {totals.testsTotal.toFixed(1)}
                    </td>

                    <td className="border border-gray-300 p-3 text-center bg-gray-50">
                      {totals.testsScaled.toFixed(1)}
                    </td>

                    <td className="border border-gray-300 p-1">
                      <input
                        type="text"
                        value={studentMarks.exam || ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === '' || /^\d*\.?\d*$/.test(value)) {
                            onMarkChange(studentId, 'exam', value);
                          }
                        }}
                        className="w-20 p-2 border rounded text-center focus:ring-2 focus:ring-blue-500"
                        placeholder="0"
                        maxLength="5"
                      />
                    </td>

                    <td className="border border-gray-300 p-3 text-center bg-gray-50">
                      {totals.examScaled.toFixed(1)}
                    </td>

                    <td className="border border-gray-300 p-3 text-center font-bold text-lg bg-blue-50">
                      {totals.finalTotal.toFixed(1)}
                    </td>

                    <td className="border border-gray-300 p-3 text-center">
                      {position && (
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${
                          position === 1 ? 'bg-yellow-400 text-yellow-900' :
                          position === 2 ? 'bg-gray-300 text-gray-800' :
                          position === 3 ? 'bg-orange-400 text-orange-900' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {position === 1 ? '🥇 1st' :
                           position === 2 ? '🥈 2nd' :
                           position === 3 ? '🥉 3rd' :
                           `${position}th`}
                        </span>
                      )}
                    </td>

                    <td className="border border-gray-300 p-2 text-center">
                      {remarks && (
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          totals.finalTotal >= 80 ? 'bg-green-100 text-green-800' :
                          totals.finalTotal >= 70 ? 'bg-blue-100 text-blue-800' :
                          totals.finalTotal >= 60 ? 'bg-yellow-100 text-yellow-800' :
                          totals.finalTotal >= 50 ? 'bg-orange-100 text-orange-800' :
                          totals.finalTotal >= 40 ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {remarks}
                        </span>
                      )}
                    </td>

                    <td className="border border-gray-300 p-3 text-center sticky right-0 bg-white">
                      <button
                        onClick={() => onSaveStudent(studentId)}
                        disabled={saving}
                        className={`px-3 py-1 rounded text-sm flex items-center justify-center ${
                          isSaved
                            ? 'bg-green-100 text-green-800'
                            : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                        }`}
                        title={isSaved ? "Saved" : "Save student marks"}
                      >
                        {isSaved ? '✓' : 'Save'}
                      </button>
                    </td>
                  </>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default ResponsiveScoreEntry;
