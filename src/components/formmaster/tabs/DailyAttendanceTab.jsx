import { memo } from 'react';
import PropTypes from 'prop-types';

/**
 * DailyAttendanceRow Component (Memoized)
 * Prevents unnecessary re-renders when other students' attendance changes
 */
const DailyAttendanceRow = memo(({
  learner,
  status,
  onStatusChange
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

      {/* Attendance Status Radio Buttons */}
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex space-x-4">
          <label className="inline-flex items-center cursor-pointer">
            <input
              type="radio"
              name={`status-${studentId}`}
              checked={status === 'present'}
              onChange={() => onStatusChange(studentId, 'present')}
              className="text-green-600 focus:ring-green-500 h-4 w-4"
            />
            <span className="ml-2 text-sm text-gray-700">Present</span>
          </label>
          <label className="inline-flex items-center cursor-pointer">
            <input
              type="radio"
              name={`status-${studentId}`}
              checked={status === 'absent'}
              onChange={() => onStatusChange(studentId, 'absent')}
              className="text-red-600 focus:ring-red-500 h-4 w-4"
            />
            <span className="ml-2 text-sm text-gray-700">Absent</span>
          </label>
          <label className="inline-flex items-center cursor-pointer">
            <input
              type="radio"
              name={`status-${studentId}`}
              checked={status === 'late'}
              onChange={() => onStatusChange(studentId, 'late')}
              className="text-yellow-600 focus:ring-yellow-500 h-4 w-4"
            />
            <span className="ml-2 text-sm text-gray-700">Late</span>
          </label>
        </div>
      </td>
    </tr>
  );
});

DailyAttendanceRow.displayName = 'DailyAttendanceRow';

DailyAttendanceRow.propTypes = {
  learner: PropTypes.shape({
    idNumber: PropTypes.string,
    LearnerID: PropTypes.string,
    firstName: PropTypes.string.isRequired,
    lastName: PropTypes.string.isRequired
  }).isRequired,
  status: PropTypes.oneOf(['present', 'absent', 'late']).isRequired,
  onStatusChange: PropTypes.func.isRequired
};

/**
 * DailyAttendanceTab Component
 *
 * Allows form masters to mark daily attendance for their class.
 * Records present, absent, or late status for each student on a specific date.
 *
 * Features:
 * - Date selection for attendance marking
 * - Radio buttons for Present/Absent/Late status
 * - Real-time status updates
 * - Memoized rows for performance
 * - Saves to localStorage with date-specific keys
 * - Auto-aggregates attendance data for reporting
 */
const DailyAttendanceTab = ({
  students,
  selectedDate,
  dailyAttendanceData,
  saving,
  onDateChange,
  onStatusChange,
  onSave
}) => {
  return (
    <div>
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Daily Attendance</h2>

        {/* Date Picker */}
        <div className="mb-4">
          <label htmlFor="attendance-date" className="block text-sm font-medium text-gray-700 mb-2">
            Select Date
          </label>
          <input
            id="attendance-date"
            type="date"
            value={selectedDate}
            onChange={(e) => onDateChange(e.target.value)}
            className="w-full md:w-64 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {selectedDate ? (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {students.map((learner) => {
                    const studentId = learner.idNumber || learner.LearnerID;
                    const status = dailyAttendanceData[studentId] || 'present';

                    return (
                      <DailyAttendanceRow
                        key={studentId}
                        learner={learner}
                        status={status}
                        onStatusChange={onStatusChange}
                      />
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Summary Stats */}
            {students.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-sm text-gray-600">Total Students</div>
                    <div className="text-2xl font-bold text-gray-900">{students.length}</div>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <div className="text-sm text-gray-600">Present</div>
                    <div className="text-2xl font-bold text-green-600">
                      {Object.values(dailyAttendanceData).filter(s => s === 'present').length}
                    </div>
                  </div>
                  <div className="bg-red-50 p-3 rounded-lg">
                    <div className="text-sm text-gray-600">Absent</div>
                    <div className="text-2xl font-bold text-red-600">
                      {Object.values(dailyAttendanceData).filter(s => s === 'absent').length}
                    </div>
                  </div>
                  <div className="bg-yellow-50 p-3 rounded-lg">
                    <div className="text-sm text-gray-600">Late</div>
                    <div className="text-2xl font-bold text-yellow-600">
                      {Object.values(dailyAttendanceData).filter(s => s === 'late').length}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className="mt-6 flex justify-end">
              <button
                onClick={onSave}
                disabled={saving}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? "Saving..." : "Save Daily Attendance"}
              </button>
            </div>
          </>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>Please select a date to mark attendance.</p>
          </div>
        )}
      </div>
    </div>
  );
};

DailyAttendanceTab.propTypes = {
  /** Array of student objects */
  students: PropTypes.arrayOf(
    PropTypes.shape({
      idNumber: PropTypes.string,
      LearnerID: PropTypes.string,
      firstName: PropTypes.string.isRequired,
      lastName: PropTypes.string.isRequired
    })
  ).isRequired,

  /** Selected date for attendance (YYYY-MM-DD format) */
  selectedDate: PropTypes.string.isRequired,

  /** Daily attendance data: { studentId: "present" | "absent" | "late" } */
  dailyAttendanceData: PropTypes.objectOf(
    PropTypes.oneOf(['present', 'absent', 'late'])
  ).isRequired,

  /** Whether save operation is in progress */
  saving: PropTypes.bool,

  /** Callback when date changes */
  onDateChange: PropTypes.func.isRequired,

  /** Callback when attendance status changes */
  onStatusChange: PropTypes.func.isRequired,

  /** Callback to save attendance data */
  onSave: PropTypes.func.isRequired
};

DailyAttendanceTab.defaultProps = {
  saving: false
};

export default DailyAttendanceTab;
