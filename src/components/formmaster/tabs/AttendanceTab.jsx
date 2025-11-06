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
  remarks,
  attitude,
  interest,
  comments,
  error,
  onAttendanceChange,
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
        <div className="text-sm font-medium text-gray-900">
          {learner.firstName} {learner.lastName}
        </div>
        <div className="text-sm text-gray-500">{studentId}</div>
      </td>

      {/* Attendance Input */}
      <td className="px-6 py-4 whitespace-nowrap">
        <input
          type="number"
          min="0"
          max="365"
          value={attendance || ""}
          onChange={(e) => onAttendanceChange(studentId, e.target.value)}
          className="w-24 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="0-365"
        />
        {error && (
          <div className="text-red-500 text-sm mt-1">{error}</div>
        )}
      </td>

      {/* Remarks Dropdown */}
      <td className="px-6 py-4 whitespace-nowrap">
        <select
          value={remarks || ""}
          onChange={(e) => onRemarkChange(studentId, e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select remark</option>
          <option value="RESPECTFUL">RESPECTFUL</option>
          <option value="WELL-BEHAVED">WELL-BEHAVED</option>
          <option value="DISRESPECTFUL">DISRESPECTFUL</option>
          <option value="CALM">CALM</option>
          <option value="HUMBLE">HUMBLE</option>
          <option value="APPROACHABLE">APPROACHABLE</option>
          <option value="BULLY">BULLY</option>
          <option value="TRUANT">TRUANT</option>
        </select>
      </td>

      {/* Attitude Input with Datalist */}
      <td className="px-6 py-4 whitespace-nowrap">
        <input
          type="text"
          list={`attitude-options-${studentId}`}
          value={attitude || ""}
          onChange={(e) => onAttitudeChange(studentId, e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
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
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
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
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
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
  remarks: PropTypes.string,
  attitude: PropTypes.string,
  interest: PropTypes.string,
  comments: PropTypes.string,
  error: PropTypes.string,
  onAttendanceChange: PropTypes.func.isRequired,
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
  remarksData,
  attitudeData,
  interestData,
  commentsData,
  footnoteInfo,
  errors,
  saving,
  isLoading,
  onAttendanceChange,
  onRemarkChange,
  onAttitudeChange,
  onInterestChange,
  onCommentsChange,
  onFootnoteChange,
  onSaveAll,
  onSaveFootnote
}) => {
  return (
    <div>
      {/* Main Attendance & Remarks Table */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Attendance & Remarks</h2>

        {isLoading ? (
          <LoadingSpinner message="Loading students..." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Attendance
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Remarks
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Attitude
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Interest
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Comments
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {students.map((learner) => {
                    const studentId = learner.idNumber || learner.LearnerID;
                    return (
                      <StudentRow
                        key={studentId}
                        learner={learner}
                        attendance={attendanceData[studentId]}
                        remarks={remarksData[studentId]}
                        attitude={attitudeData[studentId]}
                        interest={interestData[studentId]}
                        comments={commentsData[studentId]}
                        error={errors[studentId]}
                        onAttendanceChange={onAttendanceChange}
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
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? "Saving..." : "Save All"}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Footnote Section */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Footnote Information</h2>
        <p className="text-sm text-gray-600 mb-3">
          Enter any additional information or notes for this class (appears on reports).
        </p>
        <textarea
          value={footnoteInfo}
          onChange={(e) => onFootnoteChange(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          rows="3"
          placeholder="Enter any additional information for reports..."
        />
        <div className="mt-3 flex justify-end">
          <button
            onClick={onSaveFootnote}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
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

  /** Validation errors: { studentId: "error message" } */
  errors: PropTypes.objectOf(PropTypes.string),

  /** Whether save operation is in progress */
  saving: PropTypes.bool,

  /** Whether data is being loaded */
  isLoading: PropTypes.bool,

  /** Callback when attendance changes */
  onAttendanceChange: PropTypes.func.isRequired,

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

  /** Callback to save all attendance data */
  onSaveAll: PropTypes.func.isRequired,

  /** Callback to save footnote separately */
  onSaveFootnote: PropTypes.func.isRequired
};

AttendanceTab.defaultProps = {
  footnoteInfo: '',
  errors: {},
  saving: false,
  isLoading: false
};

export default AttendanceTab;
