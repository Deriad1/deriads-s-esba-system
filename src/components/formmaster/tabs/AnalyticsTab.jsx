import PropTypes from 'prop-types';
import LoadingSpinner from '../../LoadingSpinner';

/**
 * AnalyticsTab Component
 *
 * Displays comprehensive performance analytics for all subjects taught by the form master.
 * Shows statistical summaries, performance distributions, and visual representations.
 *
 * Features:
 * - Load analytics data on demand
 * - Average, highest, and lowest scores per subject
 * - Total student count per subject
 * - Performance distribution by grade bands (Excellent, Good, Fair, Poor)
 * - Score range visualization with bar charts
 * - Color-coded performance metrics
 */
const AnalyticsTab = ({
  subjects,
  analyticsData,
  isLoading,
  onLoadAnalytics
}) => {
  return (
    <div>
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Class Performance Analytics</h2>

        {/* Load Analytics Button */}
        <div className="mb-4">
          <button
            onClick={onLoadAnalytics}
            disabled={isLoading}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? "Loading..." : "Load Analytics"}
          </button>
        </div>

        {isLoading ? (
          <LoadingSpinner message="Loading analytics data..." />
        ) : (
          subjects.map(subject => (
            <div key={subject} className="mb-6 p-4 border border-gray-200 rounded-lg">
              <h3 className="text-lg font-medium mb-3">{subject} Performance Trends</h3>

              {analyticsData[subject] ? (
                <div>
                  {/* Summary Stats Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-medium mb-2 text-gray-700">Average Score</h4>
                      <p className="text-2xl font-bold text-blue-600">
                        {analyticsData[subject].average?.toFixed(2) || '0.00'}
                      </p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h4 className="font-medium mb-2 text-gray-700">Highest Score</h4>
                      <p className="text-2xl font-bold text-green-600">
                        {analyticsData[subject].highest || '0'}
                      </p>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <h4 className="font-medium mb-2 text-gray-700">Lowest Score</h4>
                      <p className="text-2xl font-bold text-yellow-600">
                        {analyticsData[subject].lowest || '0'}
                      </p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <h4 className="font-medium mb-2 text-gray-700">Total Students</h4>
                      <p className="text-2xl font-bold text-purple-600">
                        {analyticsData[subject].totalStudents || '0'}
                      </p>
                    </div>
                  </div>

                  {/* Performance Distribution */}
                  <div className="bg-gray-50 p-4 rounded-lg mb-4">
                    <h4 className="font-medium mb-3 text-gray-700">Performance Distribution</h4>
                    <div className="space-y-2">
                      {/* Excellent (80-100) */}
                      <div className="flex items-center">
                        <div className="w-32 text-sm text-gray-700">Excellent (80-100)</div>
                        <div className="flex-1 bg-gray-200 rounded-full h-4">
                          <div
                            className="bg-green-600 h-4 rounded-full transition-all"
                            style={{ width: `${analyticsData[subject].distribution?.excellent || 0}%` }}
                          ></div>
                        </div>
                        <div className="w-12 text-right text-sm font-medium text-gray-700">
                          {analyticsData[subject].distribution?.excellent || 0}%
                        </div>
                      </div>

                      {/* Good (60-79) */}
                      <div className="flex items-center">
                        <div className="w-32 text-sm text-gray-700">Good (60-79)</div>
                        <div className="flex-1 bg-gray-200 rounded-full h-4">
                          <div
                            className="bg-blue-600 h-4 rounded-full transition-all"
                            style={{ width: `${analyticsData[subject].distribution?.good || 0}%` }}
                          ></div>
                        </div>
                        <div className="w-12 text-right text-sm font-medium text-gray-700">
                          {analyticsData[subject].distribution?.good || 0}%
                        </div>
                      </div>

                      {/* Fair (40-59) */}
                      <div className="flex items-center">
                        <div className="w-32 text-sm text-gray-700">Fair (40-59)</div>
                        <div className="flex-1 bg-gray-200 rounded-full h-4">
                          <div
                            className="bg-yellow-600 h-4 rounded-full transition-all"
                            style={{ width: `${analyticsData[subject].distribution?.fair || 0}%` }}
                          ></div>
                        </div>
                        <div className="w-12 text-right text-sm font-medium text-gray-700">
                          {analyticsData[subject].distribution?.fair || 0}%
                        </div>
                      </div>

                      {/* Poor (0-39) */}
                      <div className="flex items-center">
                        <div className="w-32 text-sm text-gray-700">Poor (0-39)</div>
                        <div className="flex-1 bg-gray-200 rounded-full h-4">
                          <div
                            className="bg-red-600 h-4 rounded-full transition-all"
                            style={{ width: `${analyticsData[subject].distribution?.poor || 0}%` }}
                          ></div>
                        </div>
                        <div className="w-12 text-right text-sm font-medium text-gray-700">
                          {analyticsData[subject].distribution?.poor || 0}%
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Score Distribution Bar Chart */}
                  <div className="mt-6">
                    <h4 className="font-medium mb-2 text-gray-700">Score Distribution</h4>
                    <div className="flex items-end h-32 gap-1 border-b border-l border-gray-300 p-2 bg-white rounded">
                      {analyticsData[subject].scoreRanges?.map((range, index) => {
                        const totalStudents = analyticsData[subject].totalStudents || 1;
                        const heightPercentage = (range.count / totalStudents * 100) || 0;

                        return (
                          <div key={index} className="flex flex-col items-center flex-1">
                            <div
                              className="w-full bg-blue-500 rounded-t hover:bg-blue-600 transition-colors relative group"
                              style={{ height: `${heightPercentage}%` }}
                              title={`${range.count} students`}
                            >
                              {/* Tooltip on hover */}
                              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                {range.count} students
                              </div>
                            </div>
                            <div className="text-xs mt-1 text-gray-600">{range.range}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 py-4">
                  No analytics data available for this subject. Click "Load Analytics" to generate data.
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

AnalyticsTab.propTypes = {
  /** Array of subject names */
  subjects: PropTypes.arrayOf(PropTypes.string).isRequired,

  /** Analytics data structure:
   * {
   *   subject: {
   *     average: number,
   *     highest: number,
   *     lowest: number,
   *     totalStudents: number,
   *     distribution: { excellent: %, good: %, fair: %, poor: % },
   *     scoreRanges: [{ range: "0-10", count: 2 }, ...]
   *   }
   * }
   */
  analyticsData: PropTypes.objectOf(
    PropTypes.shape({
      average: PropTypes.number,
      highest: PropTypes.number,
      lowest: PropTypes.number,
      totalStudents: PropTypes.number,
      distribution: PropTypes.shape({
        excellent: PropTypes.number,
        good: PropTypes.number,
        fair: PropTypes.number,
        poor: PropTypes.number
      }),
      scoreRanges: PropTypes.arrayOf(
        PropTypes.shape({
          range: PropTypes.string,
          count: PropTypes.number
        })
      )
    })
  ).isRequired,

  /** Whether data is being loaded */
  isLoading: PropTypes.bool,

  /** Callback function to load analytics data */
  onLoadAnalytics: PropTypes.func.isRequired
};

AnalyticsTab.defaultProps = {
  isLoading: false
};

export default AnalyticsTab;
