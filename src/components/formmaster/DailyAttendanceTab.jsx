import React from 'react';
import PropTypes from 'prop-types';

/**
 * DailyAttendanceTab Component
 *
 * Handles daily attendance marking for a specific date
 * Allows marking students as present, absent, or late
 */
const DailyAttendanceTab = ({
  students,
  dailyAttendanceDate,
  dailyAttendance,
  onDateChange,
  onAttendanceChange,
  onSave,
  saving,
  syncStatus
}) => {
  return (
    <div className="bg-white shadow rounded-lg p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Daily Attendance</h2>
        {syncStatus === 'draft' && (
          <span className="text-yellow-600 text-sm">● Draft (local only)</span>
        )}
        {syncStatus === 'saved' && (
          <span className="text-green-600 text-sm">✓ Saved to server</span>
        )}
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Date
        </label>
        <input
          type="date"
          value={dailyAttendanceDate}
          onChange={(e) => onDateChange(e.target.value)}
          className="w-full md:w-1/3 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {dailyAttendanceDate && (
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
                const status = dailyAttendance[studentId] || 'present';

                return (
                  <tr key={studentId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {learner.firstName} {learner.lastName}
                      </div>
                      <div className="text-sm text-gray-500">{studentId}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-4">
                        <label className="inline-flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name={`status-${studentId}`}
                            checked={status === 'present'}
                            onChange={() => onAttendanceChange(studentId, 'present')}
                            className="text-green-600 focus:ring-green-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">Present</span>
                        </label>
                        <label className="inline-flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name={`status-${studentId}`}
                            checked={status === 'absent'}
                            onChange={() => onAttendanceChange(studentId, 'absent')}
                            className="text-red-600 focus:ring-red-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">Absent</span>
                        </label>
                        <label className="inline-flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name={`status-${studentId}`}
                            checked={status === 'late'}
                            onChange={() => onAttendanceChange(studentId, 'late')}
                            className="text-yellow-600 focus:ring-yellow-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">Late</span>
                        </label>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="mt-6 flex justify-end">
            <button
              onClick={onSave}
              disabled={saving || !dailyAttendanceDate}
              className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {saving ? "Saving..." : "Save Daily Attendance"}
            </button>
          </div>
        </div>
      )}

      {!dailyAttendanceDate && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <p className="text-blue-700">Please select a date to mark attendance.</p>
        </div>
      )}
    </div>
  );
};

DailyAttendanceTab.propTypes = {
  students: PropTypes.arrayOf(PropTypes.object).isRequired,
  dailyAttendanceDate: PropTypes.string.isRequired,
  dailyAttendance: PropTypes.object.isRequired,
  onDateChange: PropTypes.func.isRequired,
  onAttendanceChange: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  saving: PropTypes.bool,
  syncStatus: PropTypes.string
};

DailyAttendanceTab.defaultProps = {
  saving: false,
  syncStatus: 'draft'
};

export default DailyAttendanceTab;
