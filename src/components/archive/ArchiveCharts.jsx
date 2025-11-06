import React, { useState, useEffect } from 'react';
import { useNotification } from '../../context/NotificationContext';

/**
 * Archive Charts Component
 * Visual performance analytics for archived terms
 */
const ArchiveCharts = ({ archive, details, onBack }) => {
  const { showNotification } = useNotification();
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [chartType, setChartType] = useState('grades'); // 'grades', 'subjects', 'classes', 'distribution'

  const getUniqueClasses = () => {
    return [...new Set(details.marks.map(m => m.className))].sort();
  };

  const getUniqueSubjects = () => {
    return [...new Set(details.marks.map(m => m.subject))].sort();
  };

  const getFilteredMarks = () => {
    let filtered = details.marks;
    if (selectedClass !== 'all') {
      filtered = filtered.filter(m => m.className === selectedClass);
    }
    if (selectedSubject !== 'all') {
      filtered = filtered.filter(m => m.subject === selectedSubject);
    }
    return filtered;
  };

  // Calculate grade distribution
  const getGradeDistribution = () => {
    const marks = getFilteredMarks();
    const distribution = { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0 };

    marks.forEach(mark => {
      const grade = mark.grade || 'F';
      distribution[grade] = (distribution[grade] || 0) + 1;
    });

    return distribution;
  };

  // Calculate subject performance
  const getSubjectPerformance = () => {
    const marks = getFilteredMarks();
    const subjectStats = {};

    marks.forEach(mark => {
      const subject = mark.subject;
      if (!subjectStats[subject]) {
        subjectStats[subject] = { total: 0, count: 0, scores: [] };
      }
      const score = parseFloat(mark.classScore || 0) + parseFloat(mark.examsScore || 0);
      subjectStats[subject].total += score;
      subjectStats[subject].count += 1;
      subjectStats[subject].scores.push(score);
    });

    return Object.entries(subjectStats).map(([subject, stats]) => ({
      subject,
      average: (stats.total / stats.count).toFixed(1),
      highest: Math.max(...stats.scores).toFixed(1),
      lowest: Math.min(...stats.scores).toFixed(1),
      count: stats.count
    })).sort((a, b) => b.average - a.average);
  };

  // Calculate class performance
  const getClassPerformance = () => {
    const marks = getFilteredMarks();
    const classStats = {};

    marks.forEach(mark => {
      const className = mark.className;
      if (!classStats[className]) {
        classStats[className] = { total: 0, count: 0, scores: [] };
      }
      const score = parseFloat(mark.classScore || 0) + parseFloat(mark.examsScore || 0);
      classStats[className].total += score;
      classStats[className].count += 1;
      classStats[className].scores.push(score);
    });

    return Object.entries(classStats).map(([className, stats]) => ({
      className,
      average: (stats.total / stats.count).toFixed(1),
      highest: Math.max(...stats.scores).toFixed(1),
      lowest: Math.min(...stats.scores).toFixed(1),
      count: stats.count
    })).sort((a, b) => b.average - a.average);
  };

  // Calculate score distribution (0-40, 41-50, 51-60, etc.)
  const getScoreDistribution = () => {
    const marks = getFilteredMarks();
    const ranges = {
      '0-40': 0,
      '41-50': 0,
      '51-60': 0,
      '61-70': 0,
      '71-80': 0,
      '81-90': 0,
      '91-100': 0
    };

    marks.forEach(mark => {
      const score = parseFloat(mark.classScore || 0) + parseFloat(mark.examsScore || 0);
      if (score <= 40) ranges['0-40']++;
      else if (score <= 50) ranges['41-50']++;
      else if (score <= 60) ranges['51-60']++;
      else if (score <= 70) ranges['61-70']++;
      else if (score <= 80) ranges['71-80']++;
      else if (score <= 90) ranges['81-90']++;
      else ranges['91-100']++;
    });

    return ranges;
  };

  const gradeDistribution = getGradeDistribution();
  const subjectPerformance = getSubjectPerformance();
  const classPerformance = getClassPerformance();
  const scoreDistribution = getScoreDistribution();

  // Calculate max values for bar chart scaling
  const maxGradeCount = Math.max(...Object.values(gradeDistribution));
  const maxSubjectAvg = Math.max(...subjectPerformance.map(s => parseFloat(s.average)));
  const maxClassAvg = Math.max(...classPerformance.map(c => parseFloat(c.average)));
  const maxScoreCount = Math.max(...Object.values(scoreDistribution));

  const getGradeColor = (grade) => {
    const colors = {
      A: 'bg-green-500',
      B: 'bg-blue-500',
      C: 'bg-yellow-500',
      D: 'bg-orange-500',
      E: 'bg-red-400',
      F: 'bg-red-600'
    };
    return colors[grade] || 'bg-gray-500';
  };

  const exportChartData = async () => {
    try {
      const XLSX = await import('xlsx');
      const wb = XLSX.utils.book_new();

      // Grade distribution sheet
      const gradeData = Object.entries(gradeDistribution).map(([grade, count]) => ({
        Grade: grade,
        Count: count,
        Percentage: ((count / getFilteredMarks().length) * 100).toFixed(1) + '%'
      }));
      const gradeWS = XLSX.utils.json_to_sheet(gradeData);
      XLSX.utils.book_append_sheet(wb, gradeWS, 'Grade Distribution');

      // Subject performance sheet
      const subjectWS = XLSX.utils.json_to_sheet(subjectPerformance);
      XLSX.utils.book_append_sheet(wb, subjectWS, 'Subject Performance');

      // Class performance sheet
      const classWS = XLSX.utils.json_to_sheet(classPerformance);
      XLSX.utils.book_append_sheet(wb, classWS, 'Class Performance');

      // Score distribution sheet
      const scoreData = Object.entries(scoreDistribution).map(([range, count]) => ({
        'Score Range': range,
        Count: count,
        Percentage: ((count / getFilteredMarks().length) * 100).toFixed(1) + '%'
      }));
      const scoreWS = XLSX.utils.json_to_sheet(scoreData);
      XLSX.utils.book_append_sheet(wb, scoreWS, 'Score Distribution');

      XLSX.writeFile(wb, `Charts_${archive.term}_${archive.academicYear}.xlsx`);

      showNotification({
        type: 'success',
        title: 'Export Successful',
        message: 'Chart data exported to Excel'
      });
    } catch (error) {
      console.error('Export error:', error);
      showNotification({
        type: 'error',
        title: 'Export Failed',
        message: 'Failed to export chart data: ' + error.message
      });
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900">
            Performance Analytics - {archive.term} {archive.academicYear}
          </h3>
          <p className="text-sm text-gray-600 mt-1">Visual performance data for archived term</p>
        </div>
        <button
          onClick={exportChartData}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Export Data
        </button>
      </div>

      {/* Filters */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Chart Type</label>
            <select
              value={chartType}
              onChange={(e) => setChartType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="grades">Grade Distribution</option>
              <option value="subjects">Subject Performance</option>
              <option value="classes">Class Performance</option>
              <option value="distribution">Score Distribution</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Classes</option>
              {getUniqueClasses().map(className => (
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
              {getUniqueSubjects().map(subject => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Grade Distribution Chart */}
      {chartType === 'grades' && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Grade Distribution</h3>
          <div className="space-y-4">
            {Object.entries(gradeDistribution).map(([grade, count]) => {
              const percentage = maxGradeCount > 0 ? (count / maxGradeCount) * 100 : 0;
              const totalMarks = getFilteredMarks().length;
              const gradePercentage = totalMarks > 0 ? ((count / totalMarks) * 100).toFixed(1) : 0;

              return (
                <div key={grade}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">Grade {grade}</span>
                    <span className="text-sm text-gray-600">{count} students ({gradePercentage}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-8">
                    <div
                      className={`${getGradeColor(grade)} h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    >
                      {count > 0 && count}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Subject Performance Chart */}
      {chartType === 'subjects' && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Subject Performance (Average Scores)</h3>
          <div className="space-y-4">
            {subjectPerformance.map((subject, index) => {
              const percentage = maxSubjectAvg > 0 ? (parseFloat(subject.average) / maxSubjectAvg) * 100 : 0;

              return (
                <div key={index}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{subject.subject}</span>
                    <div className="flex gap-4 text-xs text-gray-600">
                      <span>Avg: {subject.average}%</span>
                      <span>High: {subject.highest}%</span>
                      <span>Low: {subject.lowest}%</span>
                      <span>({subject.count} marks)</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-8">
                    <div
                      className="bg-blue-500 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    >
                      {subject.average}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Class Performance Chart */}
      {chartType === 'classes' && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Class Performance (Average Scores)</h3>
          <div className="space-y-4">
            {classPerformance.map((classData, index) => {
              const percentage = maxClassAvg > 0 ? (parseFloat(classData.average) / maxClassAvg) * 100 : 0;

              return (
                <div key={index}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{classData.className}</span>
                    <div className="flex gap-4 text-xs text-gray-600">
                      <span>Avg: {classData.average}%</span>
                      <span>High: {classData.highest}%</span>
                      <span>Low: {classData.lowest}%</span>
                      <span>({classData.count} marks)</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-8">
                    <div
                      className="bg-purple-500 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    >
                      {classData.average}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Score Distribution Chart */}
      {chartType === 'distribution' && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Score Distribution</h3>
          <div className="space-y-4">
            {Object.entries(scoreDistribution).map(([range, count]) => {
              const percentage = maxScoreCount > 0 ? (count / maxScoreCount) * 100 : 0;
              const totalMarks = getFilteredMarks().length;
              const rangePercentage = totalMarks > 0 ? ((count / totalMarks) * 100).toFixed(1) : 0;

              return (
                <div key={range}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{range}%</span>
                    <span className="text-sm text-gray-600">{count} students ({rangePercentage}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-8">
                    <div
                      className="bg-indigo-500 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    >
                      {count > 0 && count}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Summary Statistics */}
      <div className="mt-6 bg-blue-50 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-3">Summary Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-xs text-blue-600">Total Marks</div>
            <div className="text-lg font-bold text-blue-900">{getFilteredMarks().length}</div>
          </div>
          <div>
            <div className="text-xs text-blue-600">Subjects</div>
            <div className="text-lg font-bold text-blue-900">{subjectPerformance.length}</div>
          </div>
          <div>
            <div className="text-xs text-blue-600">Classes</div>
            <div className="text-lg font-bold text-blue-900">{classPerformance.length}</div>
          </div>
          <div>
            <div className="text-xs text-blue-600">Overall Average</div>
            <div className="text-lg font-bold text-blue-900">
              {getFilteredMarks().length > 0
                ? (getFilteredMarks().reduce((sum, m) => sum + parseFloat(m.classScore || 0) + parseFloat(m.examsScore || 0), 0) / getFilteredMarks().length).toFixed(1)
                : 0}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArchiveCharts;
