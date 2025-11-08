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
        <div className="text-sm font-medium text-white drop-shadow-md">
          {learner.firstName} {learner.lastName}
        </div>
        <div className="text-sm text-white/70">{studentId}</div>
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
              className="text-green-500 focus:ring-green-500 h-4 w-4"
            />
            <span className="ml-2 text-sm text-white/80">Present</span>
          </label>
          <label className="inline-flex items-center cursor-pointer">
            <input
              type="radio"
              name={`status-${studentId}`}
              checked={status === 'absent'}
              onChange={() => onStatusChange(studentId, 'absent')}
              className="text-red-500 focus:ring-red-500 h-4 w-4"
            />
            <span className="ml-2 text-sm text-white/80">Absent</span>
          </label>
          <label className="inline-flex items-center cursor-pointer">
            <input
              type="radio"
              name={`status-${studentId}`}
              checked={status === 'late'}
              onChange={() => onStatusChange(studentId, 'late')}
              className="text-yellow-500 focus:ring-yellow-500 h-4 w-4"
            />
            <span className="ml-2 text-sm text-white/80">Late</span>
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
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl p-6 mb-6 border border-white/30">
        <h2 className="text-xl font-semibold mb-4 text-white drop-shadow-md">Daily Attendance</h2>

        {/* Date Picker */}
        <div className="mb-4">
          <label htmlFor="attendance-date" className="block text-sm font-medium text-white/90 mb-2">
            Select Date
          </label>
          <input
            id="attendance-date"
            type="date"
            value={selectedDate}
            onChange={(e) => onDateChange(e.target.value)}
            className="w-full md:w-64 p-2 bg-white/10 backdrop-blur-md border border-white/30 rounded-md text-white focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400"
          />
        </div>

        {selectedDate ? (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-white/20">
                <thead className="bg-white/20 backdrop-blur-md">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/90 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/90 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white/5 backdrop-blur-sm divide-y divide-white/10">
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
              <div className="mt-4 pt-4 border-t border-white/20">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-white/10 backdrop-blur-md p-3 rounded-lg border border-white/20">
                    <div className="text-sm text-white/80">Total Students</div>
                    <div className="text-2xl font-bold text-white drop-shadow-md">{students.length}</div>
                  </div>
                  <div className="bg-green-500/20 backdrop-blur-md p-3 rounded-lg border border-green-400/30">
                    <div className="text-sm text-white/80">Present</div>
                    <div className="text-2xl font-bold text-green-300 drop-shadow-md">
                      {Object.values(dailyAttendanceData).filter(s => s === 'present').length}
                    </div>
                  </div>
                  <div className="bg-red-500/20 backdrop-blur-md p-3 rounded-lg border border-red-400/30">
                    <div className="text-sm text-white/80">Absent</div>
                    <div className="text-2xl font-bold text-red-300 drop-shadow-md">
                      {Object.values(dailyAttendanceData).filter(s => s === 'absent').length}
                    </div>
                  </div>
                  <div className="bg-yellow-500/20 backdrop-blur-md p-3 rounded-lg border border-yellow-400/30">
                    <div className="text-sm text-white/80">Late</div>
                    <div className="text-2xl font-bold text-yellow-300 drop-shadow-md">
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
                className="bg-green-500/80 backdrop-blur-md text-white px-4 py-2 rounded-md hover:bg-green-600/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg border border-white/20"
              >
                {saving ? "Saving..." : "Save Daily Attendance"}
              </button>
            </div>
          </>
        ) : (
          <div className="text-center py-8 text-white/70">
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
