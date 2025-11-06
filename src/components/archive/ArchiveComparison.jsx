import React, { useState, useEffect } from 'react';
import { useNotification } from '../../context/NotificationContext';

/**
 * Archive Comparison Component
 * Compare performance across multiple terms
 */
const ArchiveComparison = ({ selectedArchives, onBack }) => {
  const { showNotification } = useNotification();
  const [comparisonData, setComparisonData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedSubject, setSelectedSubject] = useState('all');

  useEffect(() => {
    loadComparisonData();
  }, [selectedArchives]);

  const loadComparisonData = async () => {
    setLoading(true);
    try {
      // Load details for each selected archive
      const dataPromises = selectedArchives.map(async (archive) => {
        const response = await fetch(`/api/archives?archiveId=${archive.id}`);
        const result = await response.json();

        if (result.status === 'success') {
          return {
            archive,
            details: result.data
          };
        }
        return null;
      });

      const results = await Promise.all(dataPromises);
      setComparisonData(results.filter(r => r !== null));
    } catch (error) {
      console.error('Error loading comparison data:', error);
      showNotification({
        type: 'error',
        title: 'Loading Failed',
        message: 'Failed to load comparison data: ' + error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const getAllClasses = () => {
    const classes = new Set();
    comparisonData.forEach(data => {
      data.details.marks.forEach(mark => classes.add(mark.className));
    });
    return Array.from(classes).sort();
  };

  const getAllSubjects = () => {
    const subjects = new Set();
    comparisonData.forEach(data => {
      data.details.marks.forEach(mark => subjects.add(mark.subject));
    });
    return Array.from(subjects).sort();
  };

  const getFilteredMarks = (data) => {
    let marks = data.details.marks;

    if (selectedClass !== 'all') {
      marks = marks.filter(m => m.className === selectedClass);
    }

    if (selectedSubject !== 'all') {
      marks = marks.filter(m => m.subject === selectedSubject);
    }

    return marks;
  };

  const calculateStats = (marks) => {
    if (marks.length === 0) return { average: 0, highest: 0, lowest: 0, count: 0 };

    const totals = marks.map(m => parseFloat(m.classScore || 0) + parseFloat(m.examsScore || 0));
    const average = totals.reduce((a, b) => a + b, 0) / totals.length;
    const highest = Math.max(...totals);
    const lowest = Math.min(...totals);

    return {
      average: parseFloat(average.toFixed(1)),
      highest: parseFloat(highest.toFixed(1)),
      lowest: parseFloat(lowest.toFixed(1)),
      count: marks.length
    };
  };

  const exportComparison = async () => {
    try {
      const XLSX = await import('xlsx');

      const comparisonSheet = [];

      // Add header row
      const headers = ['Metric', ...comparisonData.map(d => `${d.archive.term} ${d.archive.academicYear}`)];
      comparisonSheet.push(headers);

      // Add statistics rows
      const metrics = ['Average Score', 'Highest Score', 'Lowest Score', 'Number of Marks', 'Number of Students'];

      metrics.forEach(metric => {
        const row = [metric];
        comparisonData.forEach(data => {
          const marks = getFilteredMarks(data);
          const stats = calculateStats(marks);

          let value;
          switch(metric) {
            case 'Average Score': value = stats.average; break;
            case 'Highest Score': value = stats.highest; break;
            case 'Lowest Score': value = stats.lowest; break;
            case 'Number of Marks': value = stats.count; break;
            case 'Number of Students': value = data.details.students.length; break;
            default: value = '-';
          }
          row.push(value);
        });
        comparisonSheet.push(row);
      });

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(comparisonSheet);
      XLSX.utils.book_append_sheet(wb, ws, 'Comparison');

      XLSX.writeFile(wb, `Term_Comparison.xlsx`);

      showNotification({
        type: 'success',
        title: 'Export Successful',
        message: 'Comparison data exported to Excel'
      });
    } catch (error) {
      console.error('Export error:', error);
      showNotification({
        type: 'error',
        title: 'Export Failed',
        message: 'Failed to export: ' + error.message
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading comparison data...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Action Bar */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold">Comparing {comparisonData.length} Terms</h3>
        <button
          onClick={exportComparison}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Export Comparison
        </button>
      </div>

      {/* Filters */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h3 className="font-semibold mb-3">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Classes</option>
              {getAllClasses().map(className => (
                <option key={className} value={className}>{className}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Subjects</option>
              {getAllSubjects().map(subject => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {comparisonData.map((data, index) => {
          const marks = getFilteredMarks(data);
          const stats = calculateStats(marks);

          return (
            <div key={index} className="border border-gray-200 rounded-lg p-4 bg-white">
              <div className="text-center mb-4">
                <h4 className="font-bold text-lg text-gray-900">{data.archive.term}</h4>
                <p className="text-sm text-gray-600">{data.archive.academicYear}</p>
              </div>

              <div className="space-y-3">
                <div className="bg-blue-50 rounded p-3">
                  <div className="text-xs text-blue-600 mb-1">Average Score</div>
                  <div className="text-2xl font-bold text-blue-900">{stats.average}%</div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-green-50 rounded p-2">
                    <div className="text-xs text-green-600">Highest</div>
                    <div className="text-lg font-bold text-green-900">{stats.highest}%</div>
                  </div>
                  <div className="bg-orange-50 rounded p-2">
                    <div className="text-xs text-orange-600">Lowest</div>
                    <div className="text-lg font-bold text-orange-900">{stats.lowest}%</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <div className="text-gray-600">Marks:</div>
                    <div className="font-semibold">{stats.count}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Students:</div>
                    <div className="font-semibold">{data.details.students.length}</div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Comparison Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Detailed Comparison</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Metric</th>
                {comparisonData.map((data, index) => (
                  <th key={index} className="px-4 py-2 text-center text-xs font-semibold text-gray-700">
                    {data.archive.term}<br/>{data.archive.academicYear}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr>
                <td className="px-4 py-2 text-sm font-medium">Average Score</td>
                {comparisonData.map((data, index) => {
                  const stats = calculateStats(getFilteredMarks(data));
                  return (
                    <td key={index} className="px-4 py-2 text-sm text-center font-semibold text-blue-600">
                      {stats.average}%
                    </td>
                  );
                })}
              </tr>
              <tr>
                <td className="px-4 py-2 text-sm font-medium">Highest Score</td>
                {comparisonData.map((data, index) => {
                  const stats = calculateStats(getFilteredMarks(data));
                  return (
                    <td key={index} className="px-4 py-2 text-sm text-center font-semibold text-green-600">
                      {stats.highest}%
                    </td>
                  );
                })}
              </tr>
              <tr>
                <td className="px-4 py-2 text-sm font-medium">Lowest Score</td>
                {comparisonData.map((data, index) => {
                  const stats = calculateStats(getFilteredMarks(data));
                  return (
                    <td key={index} className="px-4 py-2 text-sm text-center font-semibold text-orange-600">
                      {stats.lowest}%
                    </td>
                  );
                })}
              </tr>
              <tr>
                <td className="px-4 py-2 text-sm font-medium">Number of Marks</td>
                {comparisonData.map((data, index) => {
                  const stats = calculateStats(getFilteredMarks(data));
                  return (
                    <td key={index} className="px-4 py-2 text-sm text-center">
                      {stats.count}
                    </td>
                  );
                })}
              </tr>
              <tr>
                <td className="px-4 py-2 text-sm font-medium">Number of Students</td>
                {comparisonData.map((data, index) => (
                  <td key={index} className="px-4 py-2 text-sm text-center">
                    {data.details.students.length}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Performance Trend Indicator */}
      <div className="mt-6 bg-blue-50 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Performance Trend</h3>
        <div className="flex items-center gap-4">
          {comparisonData.map((data, index) => {
            if (index === 0) return null;
            const prevStats = calculateStats(getFilteredMarks(comparisonData[index - 1]));
            const currStats = calculateStats(getFilteredMarks(data));
            const diff = currStats.average - prevStats.average;
            const isImprovement = diff > 0;

            return (
              <div key={index} className="flex items-center gap-2">
                {isImprovement ? (
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                  </svg>
                )}
                <span className={`text-sm font-semibold ${isImprovement ? 'text-green-600' : 'text-red-600'}`}>
                  {isImprovement ? '+' : ''}{diff.toFixed(1)}%
                </span>
                <span className="text-sm text-gray-600">
                  vs {comparisonData[index - 1].archive.term}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ArchiveComparison;
