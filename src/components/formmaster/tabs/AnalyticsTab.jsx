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
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl p-6 mb-6 border border-white/30">
        <h2 className="text-xl font-semibold mb-4 text-white drop-shadow-md">Class Performance Analytics</h2>

        {/* Load Analytics Button */}
        <div className="mb-4">
          <button
            onClick={onLoadAnalytics}
            disabled={isLoading}
            className="bg-blue-500/80 backdrop-blur-md text-white px-4 py-2 rounded-md hover:bg-blue-600/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg border border-white/20"
          >
            {isLoading ? "Loading..." : "Load Analytics"}
          </button>
        </div>

        {isLoading ? (
          <LoadingSpinner message="Loading analytics data..." />
        ) : (
          subjects.map(subject => (
            <div key={subject} className="mb-6 p-4 bg-white/5 backdrop-blur-sm border border-white/20 rounded-lg">
              <h3 className="text-lg font-medium mb-3 text-white drop-shadow-md">{subject} Performance Trends</h3>

              {analyticsData[subject] ? (
                <div>
                  {/* Summary Stats Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="bg-blue-500/20 backdrop-blur-md p-4 rounded-lg border border-blue-400/30">
                      <h4 className="font-medium mb-2 text-white/90">Average Score</h4>
                      <p className="text-2xl font-bold text-blue-300 drop-shadow-md">
                        {analyticsData[subject].average?.toFixed(2) || '0.00'}
                      </p>
                    </div>
                    <div className="bg-green-500/20 backdrop-blur-md p-4 rounded-lg border border-green-400/30">
                      <h4 className="font-medium mb-2 text-white/90">Highest Score</h4>
                      <p className="text-2xl font-bold text-green-300 drop-shadow-md">
                        {analyticsData[subject].highest || '0'}
                      </p>
                    </div>
                    <div className="bg-yellow-500/20 backdrop-blur-md p-4 rounded-lg border border-yellow-400/30">
                      <h4 className="font-medium mb-2 text-white/90">Lowest Score</h4>
                      <p className="text-2xl font-bold text-yellow-300 drop-shadow-md">
                        {analyticsData[subject].lowest || '0'}
                      </p>
                    </div>
                    <div className="bg-purple-500/20 backdrop-blur-md p-4 rounded-lg border border-purple-400/30">
                      <h4 className="font-medium mb-2 text-white/90">Total Students</h4>
                      <p className="text-2xl font-bold text-purple-300 drop-shadow-md">
                        {analyticsData[subject].totalStudents || '0'}
                      </p>
                    </div>
                  </div>

                  {/* Performance Distribution */}
                  <div className="bg-white/5 backdrop-blur-sm p-4 rounded-lg mb-4 border border-white/20">
                    <h4 className="font-medium mb-3 text-white/90">Performance Distribution</h4>
                    <div className="space-y-2">
                      {/* Excellent (80-100) */}
                      <div className="flex items-center">
                        <div className="w-32 text-sm text-white/80">Excellent (80-100)</div>
                        <div className="flex-1 bg-white/10 rounded-full h-4">
                          <div
                            className="bg-green-500 h-4 rounded-full transition-all shadow-lg"
                            style={{ width: `${analyticsData[subject].distribution?.excellent || 0}%` }}
                          ></div>
                        </div>
                        <div className="w-12 text-right text-sm font-medium text-white/90">
                          {analyticsData[subject].distribution?.excellent || 0}%
                        </div>
                      </div>

                      {/* Good (60-79) */}
                      <div className="flex items-center">
                        <div className="w-32 text-sm text-white/80">Good (60-79)</div>
                        <div className="flex-1 bg-white/10 rounded-full h-4">
                          <div
                            className="bg-blue-500 h-4 rounded-full transition-all shadow-lg"
                            style={{ width: `${analyticsData[subject].distribution?.good || 0}%` }}
                          ></div>
                        </div>
                        <div className="w-12 text-right text-sm font-medium text-white/90">
                          {analyticsData[subject].distribution?.good || 0}%
                        </div>
                      </div>

                      {/* Fair (40-59) */}
                      <div className="flex items-center">
                        <div className="w-32 text-sm text-white/80">Fair (40-59)</div>
                        <div className="flex-1 bg-white/10 rounded-full h-4">
                          <div
                            className="bg-yellow-500 h-4 rounded-full transition-all shadow-lg"
                            style={{ width: `${analyticsData[subject].distribution?.fair || 0}%` }}
                          ></div>
                        </div>
                        <div className="w-12 text-right text-sm font-medium text-white/90">
                          {analyticsData[subject].distribution?.fair || 0}%
                        </div>
                      </div>

                      {/* Poor (0-39) */}
                      <div className="flex items-center">
                        <div className="w-32 text-sm text-white/80">Poor (0-39)</div>
                        <div className="flex-1 bg-white/10 rounded-full h-4">
                          <div
                            className="bg-red-500 h-4 rounded-full transition-all shadow-lg"
                            style={{ width: `${analyticsData[subject].distribution?.poor || 0}%` }}
                          ></div>
                        </div>
                        <div className="w-12 text-right text-sm font-medium text-white/90">
                          {analyticsData[subject].distribution?.poor || 0}%
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Score Distribution Bar Chart */}
                  <div className="mt-6">
                    <h4 className="font-medium mb-2 text-white/90">Score Distribution</h4>
                    <div className="flex items-end h-32 gap-1 border-b border-l border-white/30 p-2 bg-white/5 backdrop-blur-sm rounded">
                      {analyticsData[subject].scoreRanges?.map((range, index) => {
                        const totalStudents = analyticsData[subject].totalStudents || 1;
                        const heightPercentage = (range.count / totalStudents * 100) || 0;

                        return (
                          <div key={index} className="flex flex-col items-center flex-1">
                            <div
                              className="w-full bg-blue-500/80 backdrop-blur-md rounded-t hover:bg-blue-600/90 transition-colors relative group shadow-lg"
                              style={{ height: `${heightPercentage}%` }}
                              title={`${range.count} students`}
                            >
                              {/* Tooltip on hover */}
                              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900/90 backdrop-blur-md text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                {range.count} students
                              </div>
                            </div>
                            <div className="text-xs mt-1 text-white/70">{range.range}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-white/70 py-4">
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
