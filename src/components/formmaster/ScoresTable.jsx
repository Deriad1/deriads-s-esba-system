import React from 'react';
import PropTypes from 'prop-types';
import ScoreEntryRow from '../ScoreEntryRow';

/**
 * ScoresTable Component - Reusable Scores Table
 *
 * Eliminates code duplication between:
 * - ManageClass/MarksTab (read-only)
 * - EnterScoresView (editable with save buttons)
 *
 * Supports both read-only and editable modes
 */
const ScoresTable = ({
  students,
  marksData,
  subjectName,
  isEditable = false,
  onMarkChange,
  onSave,
  saving = false,
  savedStudents = new Set(),
  emptyMessage = 'No students found'
}) => {
  if (!students || students.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
        <p className="text-yellow-700">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-300">
        <thead className="bg-gray-100">
          <tr>
            <th className="border border-gray-300 p-3 text-left">Student Name</th>
            <th className="border border-gray-300 p-3 text-center">Test 1<br /><span className="text-xs text-gray-500">(15 marks)</span></th>
            <th className="border border-gray-300 p-3 text-center">Test 2<br /><span className="text-xs text-gray-500">(15 marks)</span></th>
            <th className="border border-gray-300 p-3 text-center">Test 3<br /><span className="text-xs text-gray-500">(15 marks)</span></th>
            <th className="border border-gray-300 p-3 text-center">Test 4<br /><span className="text-xs text-gray-500">(15 marks)</span></th>
            <th className="border border-gray-300 p-3 text-center">Tests Total<br /><span className="text-xs text-gray-500">(60 marks)</span></th>
            <th className="border border-gray-300 p-3 text-center">Class Score<br /><span className="text-xs text-gray-500">(50%)</span></th>
            <th className="border border-gray-300 p-3 text-center">Exam<br /><span className="text-xs text-gray-500">(100 marks)</span></th>
            <th className="border border-gray-300 p-3 text-center">Exam Score<br /><span className="text-xs text-gray-500">(50%)</span></th>
            <th className="border border-gray-300 p-3 text-center">Total<br /><span className="text-xs text-gray-500">(100%)</span></th>
            {isEditable && <th className="border border-gray-300 p-3 text-center">Action</th>}
          </tr>
        </thead>
        <tbody>
          {students.map((student) => {
            const studentId = student.idNumber || student.LearnerID;
            const studentName = student.fullName || `${student.firstName} ${student.lastName}`;
            const marks = marksData[studentId] || {};
            const isSaved = savedStudents.has(studentId);

            if (isEditable) {
              // Use ScoreEntryRow for editable mode
              return (
                <ScoreEntryRow
                  key={studentId}
                  studentId={studentId}
                  studentName={studentName}
                  marks={marks}
                  isSaved={isSaved}
                  onMarkChange={onMarkChange}
                  onSave={onSave}
                  saving={saving}
                />
              );
            }

            // Read-only mode
            return (
              <tr key={studentId} className="hover:bg-gray-50">
                <td className="border border-gray-300 p-3 font-medium">
                  {studentName}
                </td>
                <td className="border border-gray-300 p-3 text-center">
                  {marks.test1 || '-'}
                </td>
                <td className="border border-gray-300 p-3 text-center">
                  {marks.test2 || '-'}
                </td>
                <td className="border border-gray-300 p-3 text-center">
                  {marks.test3 || '-'}
                </td>
                <td className="border border-gray-300 p-3 text-center">
                  {marks.test4 || '-'}
                </td>
                <td className="border border-gray-300 p-3 text-center font-semibold">
                  {marks.testsTotal || '-'}
                </td>
                <td className="border border-gray-300 p-3 text-center font-semibold text-blue-600">
                  {marks.classScore50 || '-'}
                </td>
                <td className="border border-gray-300 p-3 text-center">
                  {marks.exam || '-'}
                </td>
                <td className="border border-gray-300 p-3 text-center font-semibold text-blue-600">
                  {marks.examScore50 || '-'}
                </td>
                <td className="border border-gray-300 p-3 text-center font-bold text-green-600 text-lg">
                  {marks.total || '-'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

ScoresTable.propTypes = {
  students: PropTypes.arrayOf(PropTypes.object).isRequired,
  marksData: PropTypes.object.isRequired,
  subjectName: PropTypes.string,
  isEditable: PropTypes.bool,
  onMarkChange: PropTypes.func,
  onSave: PropTypes.func,
  saving: PropTypes.bool,
  savedStudents: PropTypes.instanceOf(Set),
  emptyMessage: PropTypes.string
};

export default ScoresTable;
