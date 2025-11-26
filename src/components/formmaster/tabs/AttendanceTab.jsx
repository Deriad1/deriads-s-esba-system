import { memo } from 'react';
import PropTypes from 'prop-types';
import LoadingSpinner from '../../LoadingSpinner';

/**
 * StudentRow Component (Memoized)
 * Prevents unnecessary re-renders when other students' data changes
 */
const StudentRow = memo(({
  learner,
  attendance,
  attendanceTotal,
  remarks,
  attitude,
  interest,
  comments,
  error,
  onAttendanceChange,
  onAttendanceTotalChange,
  onRemarkChange,
  onAttitudeChange,
  onInterestChange,
  onCommentsChange
}) => {
  const studentId = learner.idNumber || learner.LearnerID;

  return (
    <tr>
      {/* Student Info */}
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-white drop-shadow-md">
          {learner.firstName} {learner.lastName}
        </div>
        <div className="text-sm text-white/70">{studentId}</div>
      </td>

      {/* Days Present Input */}
      <td className="px-6 py-4 whitespace-nowrap">
        <input
          type="number"
          min="0"
          max="365"
          value={attendance || ""}
          onChange={(e) => onAttendanceChange(studentId, e.target.value)}
          className="w-20 p-2 bg-white/10 backdrop-blur-md border border-white/30 rounded-md text-white placeholder-white/50 focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400 text-center"
          placeholder="45"
        />
        {error && (
          <div className="text-red-400 text-sm mt-1 drop-shadow-md">{error}</div>
        )}
      </td>

      {/* Total Days Input */}
      <td className="px-6 py-4 whitespace-nowrap">
        <input
          type="number"
          min="0"
          max="365"
          value={attendanceTotal || ""}
          onChange={(e) => onAttendanceTotalChange(studentId, e.target.value)}
          className="w-20 p-2 bg-white/10 backdrop-blur-md border border-white/30 rounded-md text-white placeholder-white/50 focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400 text-center"
          placeholder="50"
        />
      </td>

      {/* Remarks Dropdown */}
      <td className="px-6 py-4 whitespace-nowrap">
        <select
          value={remarks || ""}
          onChange={(e) => onRemarkChange(studentId, e.target.value)}
          className="w-full p-2 bg-white/10 backdrop-blur-md border border-white/30 rounded-md text-white focus:ring-2 focus:ring-blue-400/50"
        >
          <option value="" className="bg-gray-800">Select remark</option>
          <option value="RESPECTFUL" className="bg-gray-800">RESPECTFUL</option>
          <option value="WELL-BEHAVED" className="bg-gray-800">WELL-BEHAVED</option>
          <option value="DISRESPECTFUL" className="bg-gray-800">DISRESPECTFUL</option>
          <option value="CALM" className="bg-gray-800">CALM</option>
          <option value="HUMBLE" className="bg-gray-800">HUMBLE</option>
          <option value="APPROACHABLE" className="bg-gray-800">APPROACHABLE</option>
          <option value="BULLY" className="bg-gray-800">BULLY</option>
          <option value="TRUANT" className="bg-gray-800">TRUANT</option>
        </select>
      </td>

      {/* Attitude Input with Datalist */}
      <td className="px-6 py-4 whitespace-nowrap">
        <input
          type="text"
          list={`attitude-options-${studentId}`}
          value={attitude || ""}
          onChange={(e) => onAttitudeChange(studentId, e.target.value)}
          className="w-full p-2 bg-white/10 backdrop-blur-md border border-white/30 rounded-md text-white placeholder-white/50 focus:ring-2 focus:ring-blue-400/50"
          placeholder="Select or type attitude"
        />
        <datalist id={`attitude-options-${studentId}`}>
          <option value="HARDWORKING" />
          <option value="DEPENDABLE" />
          <option value="NOT SERIOUS IN CLASS" />
          <option value="LAZY" />
          <option value="SLOW" />
        </datalist>
      </td>

      {/* Interest Input with Datalist */}
      <td className="px-6 py-4 whitespace-nowrap">
        <input
          type="text"
          list={`interest-options-${studentId}`}
          value={interest || ""}
          onChange={(e) => onInterestChange(studentId, e.target.value)}
          className="w-full p-2 bg-white/10 backdrop-blur-md border border-white/30 rounded-md text-white placeholder-white/50 focus:ring-2 focus:ring-blue-400/50"
          placeholder="Select or type interest"
        />
        <datalist id={`interest-options-${studentId}`}>
          <option value="SPORTS" />
          <option value="READING" />
          <option value="DRUMMING" />
          <option value="SINGING" />
        </datalist>
      </td>

      {/* Comments Input with Datalist */}
      <td className="px-6 py-4 whitespace-nowrap">
        <input
          type="text"
          list={`comments-options-${studentId}`}
          value={comments || ""}
          onChange={(e) => onCommentsChange(studentId, e.target.value)}
          className="w-full p-2 bg-white/10 backdrop-blur-md border border-white/30 rounded-md text-white placeholder-white/50 focus:ring-2 focus:ring-blue-400/50"
          placeholder="Select or type comments"
        />
        <datalist id={`comments-options-${studentId}`}>
          <option value="Has Improved" />
          <option value="Keep it up!" />
          <option value="More room For Improvement" />
          <option value="Hardworking" />
          <option value="Must Buck-Up" />
        </datalist>
      </td>
    </tr>
  );
});

StudentRow.displayName = 'StudentRow';

StudentRow.propTypes = {
  learner: PropTypes.shape({
    idNumber: PropTypes.string,
    LearnerID: PropTypes.string,
    firstName: PropTypes.string.isRequired,
    lastName: PropTypes.string.isRequired
  }).isRequired,
  attendance: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  attendanceTotal: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  remarks: PropTypes.string,
  attitude: PropTypes.string,
  interest: PropTypes.string,
  comments: PropTypes.string,
  error: PropTypes.string,
  onAttendanceChange: PropTypes.func.isRequired,
  onAttendanceTotalChange: PropTypes.func.isRequired,
  onRemarkChange: PropTypes.func.isRequired,
  onAttitudeChange: PropTypes.func.isRequired,
  onInterestChange: PropTypes.func.isRequired,
  onCommentsChange: PropTypes.func.isRequired
};

/**
 * AttendanceTab Component
 *
 * Comprehensive form for managing student attendance, remarks, attitude, interests, and comments.
 * Includes a footnote section for additional class-level information.
 *
 * Features:
 * - Term attendance tracking (0-365 days)
 * - Predefined remarks dropdown (RESPECTFUL, WELL-BEHAVED, etc.)
 * - Attitude, Interest, and Comments fields with autocomplete suggestions
 * - Validation for attendance field
 * - Footnote section for class-level notes
 * - Memoized student rows for performance
 */
const AttendanceTab = ({
  students,
  attendanceData,
  attendanceTotalData,
  remarksData,
  attitudeData,
  interestData,
  commentsData,
  footnoteInfo,
  vacationDate,
  reopeningDate,
  errors,
  saving,
  isLoading,
  onAttendanceChange,
  onAttendanceTotalChange,
  onRemarkChange,
  onAttitudeChange,
  onInterestChange,
  onCommentsChange,
  onFootnoteChange,
  onVacationDateChange,
  onReopeningDateChange,
  onSaveAll,
  onSaveFootnote
}) => {
  return (
    <div>
      {/* Term Dates Section */}
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl p-6 mb-6 border border-white/30">
        <h2 className="text-xl font-semibold mb-4 text-white drop-shadow-md">📅 Term Dates</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="vacationDate" className="block text-sm font-medium text-white mb-2">
              Vacation Date
            </label>
            <input
              type="date"
              id="vacationDate"
              value={vacationDate || ''}
              onChange={(e) => onVacationDateChange(e.target.value)}
              className="w-full p-2 bg-white/10 backdrop-blur-md border border-white/30 rounded-md text-white focus:ring-2 focus:ring-blue-400/50"
            />
            <p className="text-xs text-white/70 mt-1">
              Will appear on student reports
            </p>
          </div>
          <div>
            <label htmlFor="reopeningDate" className="block text-sm font-medium text-white mb-2">
              Next Term Begins
            </label>
            <input
              type="date"
              id="reopeningDate"
              value={reopeningDate || ''}
              onChange={(e) => onReopeningDateChange(e.target.value)}
              className="w-full p-2 bg-white/10 backdrop-blur-md border border-white/30 rounded-md text-white focus:ring-2 focus:ring-blue-400/50"
            />
            <p className="text-xs text-white/70 mt-1">
              Will appear on student reports
            </p>
          </div>
        </div>
      </div>

      {/* Main Attendance & Remarks Table */}
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl p-6 mb-6 border border-white/30">
        <h2 className="text-xl font-semibold mb-4 text-white drop-shadow-md">Attendance & Remarks</h2>

        {isLoading ? (
          <LoadingSpinner message="Loading students..." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-white/20">
                <thead className="bg-white/20 backdrop-blur-md">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/90 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/90 uppercase tracking-wider">
                      Days Present
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/90 uppercase tracking-wider">
                      Total Days
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/90 uppercase tracking-wider">
                      Remarks
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/90 uppercase tracking-wider">
                      Attitude
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/90 uppercase tracking-wider">
                      Interest
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/90 uppercase tracking-wider">
                      Comments
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white/5 backdrop-blur-sm divide-y divide-white/10">
                  {students.map((learner) => {
                    const studentId = learner.idNumber || learner.LearnerID;
                    return (
                      <StudentRow
                        key={studentId}
                        learner={learner}
                        attendance={attendanceData[studentId]}
                        attendanceTotal={attendanceTotalData?.[studentId]}
                        remarks={remarksData[studentId]}
                        attitude={attitudeData[studentId]}
                        interest={interestData[studentId]}
                        comments={commentsData[studentId]}
                        error={errors[studentId]}
                        onAttendanceChange={onAttendanceChange}
                        onAttendanceTotalChange={onAttendanceTotalChange}
                        onRemarkChange={onRemarkChange}
                        onAttitudeChange={onAttitudeChange}
                        onInterestChange={onInterestChange}
                        onCommentsChange={onCommentsChange}
                      />
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={onSaveAll}
                disabled={saving}
                className="bg-blue-500/80 backdrop-blur-md text-white px-4 py-2 rounded-md hover:bg-blue-600/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg border border-white/20"
              >
                {saving ? "Saving..." : "Save All"}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Footnote Section */}
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl p-6 mb-6 border border-white/30">
        <h2 className="text-xl font-semibold mb-4 text-white drop-shadow-md">Footnote Information</h2>
        <p className="text-sm text-white/80 mb-3">
          Enter any additional information or notes for this class (appears on reports).
        </p>
        <textarea
          value={footnoteInfo}
          onChange={(e) => onFootnoteChange(e.target.value)}
          className="w-full p-2 bg-white/10 backdrop-blur-md border border-white/30 rounded-md text-white placeholder-white/50 focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400"
          rows="3"
          placeholder="Enter any additional information for reports..."
        />
        <div className="mt-3 flex justify-end">
          <button
            onClick={onSaveFootnote}
            className="bg-green-500/80 backdrop-blur-md text-white px-4 py-2 rounded-md hover:bg-green-600/90 transition-all shadow-lg border border-white/20"
          >
            Save Footnote
          </button>
        </div>
      </div>
    </div>
  );
};

AttendanceTab.propTypes = {
  /** Array of student objects */
  students: PropTypes.arrayOf(
    PropTypes.shape({
      idNumber: PropTypes.string,
      LearnerID: PropTypes.string,
      firstName: PropTypes.string.isRequired,
      lastName: PropTypes.string.isRequired
    })
  ).isRequired,

  /** Attendance data: { studentId: "120" } (number of days attended) */
  attendanceData: PropTypes.objectOf(
    PropTypes.oneOfType([PropTypes.string, PropTypes.number])
  ).isRequired,

  /** Attendance total data: { studentId: "150" } (total school days) */
  attendanceTotalData: PropTypes.objectOf(
    PropTypes.oneOfType([PropTypes.string, PropTypes.number])
  ),

  /** Remarks data: { studentId: "RESPECTFUL" } */
  remarksData: PropTypes.objectOf(PropTypes.string).isRequired,

  /** Attitude data: { studentId: "HARDWORKING" } */
  attitudeData: PropTypes.objectOf(PropTypes.string).isRequired,

  /** Interest data: { studentId: "SPORTS" } */
  interestData: PropTypes.objectOf(PropTypes.string).isRequired,

  /** Comments data: { studentId: "Keep it up!" } */
  commentsData: PropTypes.objectOf(PropTypes.string).isRequired,

  /** Footnote text for the entire class */
  footnoteInfo: PropTypes.string,

  /** Vacation date for reports */
  vacationDate: PropTypes.string,

  /** Reopening date for reports */
  reopeningDate: PropTypes.string,

  /** Validation errors: { studentId: "error message" } */
  errors: PropTypes.objectOf(PropTypes.string),

  /** Whether save operation is in progress */
  saving: PropTypes.bool,

  /** Whether data is being loaded */
  isLoading: PropTypes.bool,

  /** Callback when attendance changes */
  onAttendanceChange: PropTypes.func.isRequired,

  /** Callback when attendance total changes */
  onAttendanceTotalChange: PropTypes.func.isRequired,

  /** Callback when remark changes */
  onRemarkChange: PropTypes.func.isRequired,

  /** Callback when attitude changes */
  onAttitudeChange: PropTypes.func.isRequired,

  /** Callback when interest changes */
  onInterestChange: PropTypes.func.isRequired,

  /** Callback when comments change */
  onCommentsChange: PropTypes.func.isRequired,

  /** Callback when footnote changes */
  onFootnoteChange: PropTypes.func.isRequired,

  /** Callback when vacation date changes */
  onVacationDateChange: PropTypes.func.isRequired,

  /** Callback when reopening date changes */
  onReopeningDateChange: PropTypes.func.isRequired,

  /** Callback to save all attendance data */
  onSaveAll: PropTypes.func.isRequired,

  /** Callback to save footnote separately */
  onSaveFootnote: PropTypes.func.isRequired
};

AttendanceTab.defaultProps = {
  footnoteInfo: '',
  vacationDate: '',
  reopeningDate: '',
  attendanceTotalData: {},
  errors: {},
  saving: false,
  isLoading: false
};

export default AttendanceTab;
