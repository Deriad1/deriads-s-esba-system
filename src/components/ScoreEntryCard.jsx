import React from "react";
import { getRemarksColorClass } from "../utils/gradeHelpers";

/**
 * ScoreEntryCard Component - Mobile-Friendly Card Layout
 *
 * Displays student score entry in a card format optimized for mobile devices.
 * Each student gets their own card with all input fields arranged vertically.
 *
 * Wrapped with React.memo() to only re-render when props change.
 */
const ScoreEntryCard = React.memo(({
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
  const calculateTotal = () => {
    if (!marks) return "";

    // Class work: 4 tests × 15 marks each = 60 total, converted to 50
    const test1 = parseFloat(marks.test1) || 0;
    const test2 = parseFloat(marks.test2) || 0;
    const test3 = parseFloat(marks.test3) || 0;
    const test4 = parseFloat(marks.test4) || 0;
    const testsTotal = test1 + test2 + test3 + test4;
    const classScore50 = (testsTotal / 60) * 50;

    // Exam: 100 marks converted to 50
    const exam = parseFloat(marks.exam) || 0;
    const examScore50 = exam * 0.5;

    // Total out of 100
    const total = classScore50 + examScore50;
    return total.toFixed(1);
  };

  const isCustomAssessment = selectedAssessment && selectedAssessment.assessment_type !== 'standard';

  return (
    <div className={`glass-light border-2 rounded-xl p-4 shadow-lg transition-all ${
      isSaved
        ? "border-green-400 bg-green-50/20"
        : "border-yellow-400/50 hover:border-yellow-400"
    }`}>
      {/* Student Name Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/20">
        <div>
          <h3 className="text-base font-bold text-white">{studentName}</h3>
          {isSaved && (
            <span className="inline-flex items-center gap-1 mt-1 text-xs font-semibold text-green-400">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
              Saved
            </span>
          )}
        </div>
        {position && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/70">Position</span>
            <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 text-white font-bold text-sm shadow-lg">
              {position}
            </span>
          </div>
        )}
      </div>

      {isCustomAssessment ? (
        // Custom Assessment Layout
        <div className="space-y-4">
          {/* Score Input */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
            <label className="block text-xs font-semibold text-white/80 mb-2">
              Score (Max: {selectedAssessment.max_score})
            </label>
            <input
              type="text"
              value={marks?.total || ""}
              onChange={(e) => onMarkChange(studentId, "total", e.target.value)}
              className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl text-gray-900 text-center text-lg font-bold focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all"
              style={{ minHeight: '44px', fontSize: '16px' }}
              placeholder="0"
              maxLength="6"
            />
          </div>

          {/* Remarks */}
          {remarks && (
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
              <label className="block text-xs font-semibold text-white/80 mb-2">Remark</label>
              <span className={`inline-block px-4 py-2 rounded-lg text-sm font-bold border-2 ${getRemarksColorClass(remarks)}`}>
                {remarks}
              </span>
            </div>
          )}
        </div>
      ) : (
        // Standard Assessment Layout
        <div className="space-y-4">
          {/* Tests Grid */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
            <label className="block text-xs font-semibold text-white/80 mb-3">Class Tests (15 marks each)</label>
            <div className="grid grid-cols-2 gap-3">
              {["test1", "test2", "test3", "test4"].map((test, idx) => (
                <div key={test}>
                  <label className="block text-xs text-white/70 mb-1">Test {idx + 1}</label>
                  <input
                    type="text"
                    value={marks?.[test] || ""}
                    onChange={(e) => onMarkChange(studentId, test, e.target.value)}
                    className="w-full px-3 py-2 bg-white border-2 border-gray-300 rounded-lg text-gray-900 text-center font-bold focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all"
                    style={{ minHeight: '44px', fontSize: '16px' }}
                    placeholder="0"
                    maxLength="5"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Exam Input */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
            <label className="block text-xs font-semibold text-white/80 mb-2">Exam (100 marks)</label>
            <input
              type="text"
              value={marks?.exam || ""}
              onChange={(e) => onMarkChange(studentId, "exam", e.target.value)}
              className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl text-gray-900 text-center text-lg font-bold focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all"
              style={{ minHeight: '44px', fontSize: '16px' }}
              placeholder="0"
              maxLength="6"
            />
          </div>

          {/* Total & Remarks */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-blue-500/20 backdrop-blur-sm rounded-lg p-3 border-2 border-blue-400/50">
              <label className="block text-xs font-semibold text-white/80 mb-1">Total</label>
              <div className="text-2xl font-bold text-blue-300">{calculateTotal()}</div>
              <div className="text-xs text-white/60">out of 100</div>
            </div>
            {remarks && (
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                <label className="block text-xs font-semibold text-white/80 mb-1">Remark</label>
                <span className={`inline-block px-3 py-1 rounded-lg text-xs font-bold border-2 ${getRemarksColorClass(remarks)}`}>
                  {remarks}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Save Button */}
      <button
        onClick={() => onSave(studentId)}
        disabled={saving}
        className={`w-full mt-4 px-4 py-3 rounded-xl text-white font-bold transition-all shadow-lg ${
          isSaved
            ? "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
            : "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
        } disabled:bg-gray-400 disabled:cursor-not-allowed`}
        style={{ minHeight: '44px', fontSize: '16px' }}
      >
        {saving ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Saving...
          </span>
        ) : isSaved ? (
          "💾 Update Score"
        ) : (
          "💾 Save Score"
        )}
      </button>
    </div>
  );
});

ScoreEntryCard.displayName = "ScoreEntryCard";

export default ScoreEntryCard;
