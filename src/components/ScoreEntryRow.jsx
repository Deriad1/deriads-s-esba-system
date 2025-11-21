import React from "react";
import { getRemarksColorClass } from "../utils/gradeHelpers";

/**
 * ScoreEntryRow Component - Memoized for Performance
 *
 * Extracts the individual student score entry row to prevent
 * unnecessary re-renders when other students' scores change.
 *
 * Wrapped with React.memo() to only re-render when props change.
 */
const ScoreEntryRow = React.memo(({
  studentId,
  studentName,
  marks,
  isSaved,
  position,
  remarks,
  onMarkChange,
  onSave,
  saving,
  selectedAssessment
}) => {
  // Calculate total for this student
  // Scoring: 4 tests × 15 marks (60 total → 50%) + exam 100 marks (→ 50%) = 100 total
  const calculateTotal = () => {
    if (!marks) return "";

    // Class work: 4 tests × 15 marks each = 60 total, converted to 50
    const test1 = parseFloat(marks.test1) || 0;
    const test2 = parseFloat(marks.test2) || 0;
    const test3 = parseFloat(marks.test3) || 0;
    const test4 = parseFloat(marks.test4) || 0;
    const testsTotal = test1 + test2 + test3 + test4;
    const classScore50 = (testsTotal / 60) * 50; // Convert 60 marks to 50%

    // Exam: 100 marks converted to 50
    const exam = parseFloat(marks.exam) || 0;
    const examScore50 = exam * 0.5; // Convert 100 marks to 50%

    // Total out of 100
    const total = classScore50 + examScore50;
    return total.toFixed(1);
  };

  // Check if this is a custom assessment
  const isCustomAssessment = selectedAssessment && selectedAssessment.assessment_type !== 'standard';

  return (
    <tr className={`border-b border-gray-200/50 transition-colors ${isSaved ? "bg-green-50/30" : "hover:bg-yellow-50/50"
      }`}>
      <td className="p-4 font-semibold text-gray-900">
        {studentName}
        {isSaved && <span className="ml-2 text-green-600 text-xs font-bold">✓ Saved</span>}
      </td>

      {isCustomAssessment ? (
        // Custom Assessment - Single Score Field
        <>
          <td className="p-2 text-center">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9.]*"
              value={marks?.total || ""}
              onChange={(e) => onMarkChange(studentId, "total", e.target.value)}
              className="w-20 p-2 border-2 border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all font-semibold"
              placeholder="0"
              maxLength="6"
              title={`Max: ${selectedAssessment.max_score} marks`}
            />
          </td>

          {/* Position Column */}
          <td className="p-4 text-center">
            {position ? (
              <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gray-900 text-white font-bold text-sm">
                {position}
              </span>
            ) : (
              <span className="text-gray-400 text-sm">-</span>
            )}
          </td>

          {/* Remarks Column */}
          <td className="p-2 text-center">
            {remarks ? (
              <span className={`inline-block px-3 py-1 rounded-lg text-sm border-2 ${getRemarksColorClass(remarks)}`}>
                {remarks}
              </span>
            ) : (
              <span className="text-gray-400 text-sm">-</span>
            )}
          </td>

          <td className="p-2">
            <button
              onClick={() => onSave(studentId)}
              disabled={saving}
              className={`w-full px-4 py-2 rounded-lg text-white text-sm font-semibold transition-all shadow-sm hover:shadow-md ${isSaved
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-gray-900 hover:bg-gray-800"
                } disabled:bg-gray-400 disabled:cursor-not-allowed`}
            >
              {saving ? "..." : isSaved ? "Update" : "Save"}
            </button>
          </td>
        </>
      ) : (
        // Standard Assessment - Full Score Entry
        <>
          {["test1", "test2", "test3", "test4"].map(test => (
            <td key={test} className="p-2 text-center">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9.]*"
                value={marks?.[test] || ""}
                onChange={(e) => onMarkChange(studentId, test, e.target.value)}
                className="w-16 p-2 border-2 border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all font-semibold"
                placeholder="0"
                maxLength="5"
                title="Max: 15 marks"
              />
            </td>
          ))}

          <td className="p-2 text-center">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9.]*"
              value={marks?.exam || ""}
              onChange={(e) => onMarkChange(studentId, "exam", e.target.value)}
              className="w-20 p-2 border-2 border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all font-semibold"
              placeholder="0"
              maxLength="6"
              title="Max: 100 marks"
            />
          </td>

          <td className="p-4 text-center font-bold text-lg text-blue-600">
            {calculateTotal()}
          </td>

          {/* Position Column */}
          <td className="p-4 text-center">
            {position ? (
              <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gray-900 text-white font-bold text-sm">
                {position}
              </span>
            ) : (
              <span className="text-gray-400 text-sm">-</span>
            )}
          </td>

          {/* Remarks Column */}
          <td className="p-2 text-center">
            {remarks ? (
              <span className={`inline-block px-3 py-1 rounded-lg text-sm border-2 ${getRemarksColorClass(remarks)}`}>
                {remarks}
              </span>
            ) : (
              <span className="text-gray-400 text-sm">-</span>
            )}
          </td>

          <td className="p-2">
            <button
              onClick={() => onSave(studentId)}
              disabled={saving}
              className={`w-full px-4 py-2 rounded-lg text-white text-sm font-semibold transition-all shadow-sm hover:shadow-md ${isSaved
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-gray-900 hover:bg-gray-800"
                } disabled:bg-gray-400 disabled:cursor-not-allowed`}
            >
              {saving ? "..." : isSaved ? "Update" : "Save"}
            </button>
          </td>
        </>
      )}
    </tr>
  );
});

ScoreEntryRow.displayName = "ScoreEntryRow";

export default ScoreEntryRow;
