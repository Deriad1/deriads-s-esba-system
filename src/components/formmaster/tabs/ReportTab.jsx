import PropTypes from 'prop-types';
import LoadingSpinner from '../../LoadingSpinner';

/**
 * ReportTab Component
 *
 * Generates and displays attendance reports for a specified date range.
 * Shows comprehensive attendance statistics including present, absent, late counts,
 * total days, and attendance percentage for each student.
 *
 * Features:
 * - Date range selection (start and end dates)
 * - Generate report button
 * - Detailed attendance breakdown per student
 * - Color-coded attendance percentages (green ≥90%, yellow ≥75%, red <75%)
 * - Print functionality for generated reports
 * - Summary statistics
 */
const ReportTab = ({
  reportData,
  startDate,
  endDate,
  isLoading,
  onStartDateChange,
  onEndDateChange,
  onGenerateReport,
  onPrintReport
}) => {
  /**
   * Get color class for attendance percentage
   */
  const getPercentageColor = (percentage) => {
    if (percentage >= 90) return 'text-green-600 font-semibold';
    if (percentage >= 75) return 'text-yellow-600 font-semibold';
    return 'text-red-600 font-semibold';
  };

  return (
    <div>
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Attendance Report</h2>

        {/* Date Range Selection */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label htmlFor="report-start-date" className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <input
              id="report-start-date"
              type="date"
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label htmlFor="report-end-date" className="block text-sm font-medium text-gray-700 mb-2">
              End Date
            </label>
            <input
              id="report-end-date"
              type="date"
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={onGenerateReport}
              disabled={isLoading || !startDate || !endDate}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? "Generating..." : "Generate Report"}
            </button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <LoadingSpinner message="Generating attendance report..." />
        )}

        {/* Report Results */}
        {!isLoading && reportData.length > 0 && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">
                Report Results ({reportData.length} students)
              </h3>
              <button
                onClick={onPrintReport}
                className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors flex items-center gap-2"
              >
                <span>🖨️</span>
                Print Report
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Present
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Absent
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Late
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Days
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Percentage
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reportData.map((student) => (
                    <tr key={student.studentId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {student.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {student.studentId}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                        {student.present}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">
                        {student.absent}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-600 font-medium">
                        {student.late}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-medium">
                        {student.totalDays}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={getPercentageColor(student.percentage)}>
                          {student.percentage}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary Statistics */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Summary Statistics</h4>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-xs text-gray-600">Total Students</div>
                  <div className="text-lg font-bold text-gray-900">{reportData.length}</div>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="text-xs text-gray-600">Avg Present</div>
                  <div className="text-lg font-bold text-green-600">
                    {reportData.length > 0
                      ? (reportData.reduce((sum, s) => sum + s.present, 0) / reportData.length).toFixed(1)
                      : '0'}
                  </div>
                </div>
                <div className="bg-red-50 p-3 rounded-lg">
                  <div className="text-xs text-gray-600">Avg Absent</div>
                  <div className="text-lg font-bold text-red-600">
                    {reportData.length > 0
                      ? (reportData.reduce((sum, s) => sum + s.absent, 0) / reportData.length).toFixed(1)
                      : '0'}
                  </div>
                </div>
                <div className="bg-yellow-50 p-3 rounded-lg">
                  <div className="text-xs text-gray-600">Avg Late</div>
                  <div className="text-lg font-bold text-yellow-600">
                    {reportData.length > 0
                      ? (reportData.reduce((sum, s) => sum + s.late, 0) / reportData.length).toFixed(1)
                      : '0'}
                  </div>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="text-xs text-gray-600">Avg Attendance</div>
                  <div className="text-lg font-bold text-blue-600">
                    {reportData.length > 0
                      ? (reportData.reduce((sum, s) => sum + s.percentage, 0) / reportData.length).toFixed(1)
                      : '0'}%
                  </div>
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Percentage Color Guide</h4>
              <div className="flex gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-green-600 font-semibold">90-100%</span>
                  <span className="text-gray-600">- Excellent</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-yellow-600 font-semibold">75-89%</span>
                  <span className="text-gray-600">- Good</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-red-600 font-semibold">&lt;75%</span>
                  <span className="text-gray-600">- Needs Improvement</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && reportData.length === 0 && startDate && endDate && (
          <div className="text-center py-8 text-gray-500">
            <p>No attendance data found for the selected date range.</p>
            <p className="text-sm mt-2">Please ensure daily attendance has been recorded for the dates in the range.</p>
          </div>
        )}

        {/* Instructions */}
        {!isLoading && reportData.length === 0 && (!startDate || !endDate) && (
          <div className="text-center py-8 text-gray-500">
            <p>Select a date range and click "Generate Report" to view attendance statistics.</p>
          </div>
        )}
      </div>
    </div>
  );
};

ReportTab.propTypes = {
  /** Report data array with attendance statistics per student */
  reportData: PropTypes.arrayOf(
    PropTypes.shape({
      studentId: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      present: PropTypes.number.isRequired,
      absent: PropTypes.number.isRequired,
      late: PropTypes.number.isRequired,
      totalDays: PropTypes.number.isRequired,
      percentage: PropTypes.number.isRequired
    })
  ).isRequired,

  /** Report start date (YYYY-MM-DD format) */
  startDate: PropTypes.string.isRequired,

  /** Report end date (YYYY-MM-DD format) */
  endDate: PropTypes.string.isRequired,

  /** Whether report is being generated */
  isLoading: PropTypes.bool,

  /** Callback when start date changes */
  onStartDateChange: PropTypes.func.isRequired,

  /** Callback when end date changes */
  onEndDateChange: PropTypes.func.isRequired,

  /** Callback to generate the report */
  onGenerateReport: PropTypes.func.isRequired,

  /** Callback to print the report */
  onPrintReport: PropTypes.func.isRequired
};

ReportTab.defaultProps = {
  isLoading: false
};

export default ReportTab;
