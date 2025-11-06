import React, { useState } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const EnhancedAnalyticsDashboard = ({ analyticsData, className, subject, viewType = "scores" }) => {
  const [activeTab, setActiveTab] = useState('overview');

  if (!analyticsData) {
    return (
      <div className="glass-card-background-visible rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Enhanced Analytics Dashboard</h3>
        <div className="text-center py-8 text-white/70">
          <p>No analytics data available</p>
        </div>
      </div>
    );
  }

  // Prepare data for charts based on view type
  let performanceData = [];
  let trendData = [];
  let scoreDistributionData = [];

  if (viewType === "scores") {
    // For scores view
    performanceData = analyticsData.performanceData || [
      { name: 'Excellent', value: 0 },
      { name: 'Very Good', value: 0 },
      { name: 'Good', value: 0 },
      { name: 'Satisfactory', value: 0 },
      { name: 'Fair', value: 0 },
      { name: 'Needs Improvement', value: 0 }
    ];

    trendData = analyticsData.trendData || [];

    // Score distribution data
    scoreDistributionData = [
      { name: '90-100', count: analyticsData.excellentCount || 0 },
      { name: '80-89', count: analyticsData.veryGoodCount || 0 },
      { name: '70-79', count: analyticsData.goodCount || 0 },
      { name: '60-69', count: analyticsData.satisfactoryCount || 0 },
      { name: '50-59', count: analyticsData.fairCount || 0 },
      { name: '0-49', count: analyticsData.needsImprovementCount || 0 }
    ];
  } else {
    // For attendance/remarks view
    performanceData = [
      { name: 'Present', value: analyticsData.presentCount || 0 },
      { name: 'Absent', value: analyticsData.absentCount || 0 },
      { name: 'Late', value: analyticsData.lateCount || 0 }
    ];

    trendData = analyticsData.attendanceTrend || [];

    // Attendance distribution
    scoreDistributionData = [
      { name: '90-100%', count: analyticsData.highAttendance || 0 },
      { name: '80-89%', count: analyticsData.mediumHighAttendance || 0 },
      { name: '70-79%', count: analyticsData.mediumAttendance || 0 },
      { name: '60-69%', count: analyticsData.lowMediumAttendance || 0 },
      { name: '50-59%', count: analyticsData.lowAttendance || 0 },
      { name: '0-49%', count: analyticsData.veryLowAttendance || 0 }
    ];
  }

  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];
  const PERFORMANCE_COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="glass-card-background-visible rounded-lg p-2 flex flex-wrap gap-2">
        <button
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            activeTab === 'overview'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            activeTab === 'performance'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
          onClick={() => setActiveTab('performance')}
        >
          Performance
        </button>
        <button
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            activeTab === 'trends'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
          onClick={() => setActiveTab('trends')}
        >
          Trends
        </button>
        <button
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            activeTab === 'distribution'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
          onClick={() => setActiveTab('distribution')}
        >
          Distribution
        </button>
      </div>

      {/* Summary Stats */}
      {activeTab === 'overview' && (
        <div className="glass-card-background-visible rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Performance Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {viewType === "scores" ? (
              <>
                <div className="glass rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {analyticsData.highestScore || '0'}
                  </div>
                  <div className="text-sm text-white/80">Highest Score</div>
                </div>
                <div className="glass rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {analyticsData.averageScore || '0'}
                  </div>
                  <div className="text-sm text-white/80">Average Score</div>
                </div>
                <div className="glass rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {analyticsData.lowestScore || '0'}
                  </div>
                  <div className="text-sm text-white/80">Lowest Score</div>
                </div>
                <div className="glass rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {analyticsData.totalStudents || '0'}
                  </div>
                  <div className="text-sm text-white/80">Total Students</div>
                </div>
              </>
            ) : (
              <>
                <div className="glass rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {analyticsData.averageAttendance || '0'}%
                  </div>
                  <div className="text-sm text-white/80">Avg Attendance</div>
                </div>
                <div className="glass rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {analyticsData.presentCount || '0'}
                  </div>
                  <div className="text-sm text-white/80">Present</div>
                </div>
                <div className="glass rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {analyticsData.absentCount || '0'}
                  </div>
                  <div className="text-sm text-white/80">Absent</div>
                </div>
                <div className="glass rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {analyticsData.lateCount || '0'}
                  </div>
                  <div className="text-sm text-white/80">Late</div>
                </div>
              </>
            )}
          </div>

          {/* Additional Insights */}
          {viewType === "scores" && analyticsData.topPerformers && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-4">Top Performers</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {analyticsData.topPerformers.slice(0, 3).map((student, index) => (
                  <div key={index} className="glass rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-white">{student.name}</div>
                    <div className="text-2xl font-bold text-blue-600">{student.score}</div>
                    <div className="text-sm text-white/80">#{index + 1} Position</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Performance Charts */}
      {activeTab === 'performance' && (
        <div className="glass-card-background-visible rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">
            {viewType === "scores" ? "Performance Distribution" : "Attendance Distribution"}
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={performanceData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {performanceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PERFORMANCE_COLORS[index % PERFORMANCE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [value, viewType === "scores" ? "Students" : "Records"]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Trend Analysis */}
      {activeTab === 'trends' && (
        <div className="glass-card-background-visible rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">
            {viewType === "scores" 
              ? `Performance Trend - ${className || 'All Classes'} ${subject || 'All Subjects'}` 
              : `Attendance Trend - ${className || 'All Classes'}`}
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={trendData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey={viewType === "scores" ? "score" : "attendance"} 
                  stroke="#8884d8" 
                  activeDot={{ r: 8 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Distribution Charts */}
      {activeTab === 'distribution' && (
        <div className="space-y-6">
          <div className="glass-card-background-visible rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">
              {viewType === "scores" ? "Score Distribution" : "Attendance Distribution"}
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={scoreDistributionData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Detailed Distribution Table */}
          <div className="glass-card-background-visible rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Detailed Distribution</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">
                      {viewType === "scores" ? "Score Range" : "Attendance Range"}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">
                      Count
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">
                      Percentage
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {scoreDistributionData.map((range, index) => {
                    const total = scoreDistributionData.reduce((sum, item) => sum + item.count, 0);
                    const percentage = total > 0 ? ((range.count / total) * 100).toFixed(1) : 0;
                    return (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                          {range.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white/80">
                          {range.count}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white/80">
                          {percentage}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedAnalyticsDashboard;