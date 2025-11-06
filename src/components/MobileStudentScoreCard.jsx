import React, { useState } from 'react';
import MobileScoreEntry from './MobileScoreEntry';

/**
 * Mobile-optimized student score card
 * Card-based layout for entering scores on mobile devices
 */
const MobileStudentScoreCard = ({
  student,
  marks = {},
  onMarkChange,
  onNext,
  showClassScore = false,
  showExamScore = false,
  maxClassScore = 50,
  maxExamScore = 50
}) => {
  const [focusedField, setFocusedField] = useState('class_score');

  const studentId = student.id || student.student_id;
  const studentName = student.name || student.student_name || 'Unknown Student';
  const studentClass = student.className || student.class_name || '';

  const classScore = marks[studentId]?.class_score || '';
  const examScore = marks[studentId]?.exam_score || '';
  const totalScore = (parseFloat(classScore) || 0) + (parseFloat(examScore) || 0);

  const handleClassScoreChange = (value) => {
    onMarkChange(studentId, { class_score: value });
  };

  const handleExamScoreChange = (value) => {
    onMarkChange(studentId, { exam_score: value });
  };

  const moveToExamScore = () => {
    setFocusedField('exam_score');
  };

  const moveToNext = () => {
    if (onNext) {
      setFocusedField('class_score'); // Reset for next student
      onNext();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-3 border-l-4 border-blue-500">
      {/* Student Info */}
      <div className="mb-4">
        <h3 className="text-lg font-bold text-gray-800">{studentName}</h3>
        {studentClass && (
          <p className="text-sm text-gray-600">Class: {studentClass}</p>
        )}
      </div>

      {/* Score Entry Fields */}
      <div className="space-y-3">
        {/* Class Score */}
        {showClassScore && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Class Score (max: {maxClassScore})
            </label>
            <MobileScoreEntry
              student={student}
              value={classScore}
              onChange={handleClassScoreChange}
              onNext={showExamScore ? moveToExamScore : moveToNext}
              autoFocus={focusedField === 'class_score'}
              maxScore={maxClassScore}
              placeholder="0"
            />
          </div>
        )}

        {/* Exam Score */}
        {showExamScore && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Exam Score (max: {maxExamScore})
            </label>
            <MobileScoreEntry
              student={student}
              value={examScore}
              onChange={handleExamScoreChange}
              onNext={moveToNext}
              autoFocus={focusedField === 'exam_score'}
              maxScore={maxExamScore}
              placeholder="0"
            />
          </div>
        )}

        {/* Total Score Display */}
        {(showClassScore || showExamScore) && (
          <div className="pt-2 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Total Score:</span>
              <span className="text-xl font-bold text-blue-600">
                {totalScore.toFixed(2)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Next Button (optional, for manual navigation) */}
      <button
        onClick={moveToNext}
        className="mt-4 w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors active:bg-blue-700"
      >
        Next Student →
      </button>
    </div>
  );
};

export default MobileStudentScoreCard;
