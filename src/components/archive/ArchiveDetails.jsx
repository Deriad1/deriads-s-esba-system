import React, { useState } from 'react';
import { useNotification } from '../../context/NotificationContext';
import printingService from '../../services/printingService';

/**
 * Archive Details Component with PDF Export and Restore
 */
const ArchiveDetails = ({ archive, details, onBack, onDelete }) => {
  const { showNotification } = useNotification();
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [searchStudent, setSearchStudent] = useState('');
  const [exporting, setExporting] = useState(false);

  const getFilteredMarks = () => {
    let filtered = details.marks;

    if (selectedClass !== 'all') {
      filtered = filtered.filter(mark => mark.className === selectedClass);
    }

    if (selectedSubject !== 'all') {
      filtered = filtered.filter(mark => mark.subject === selectedSubject);
    }

    if (searchStudent) {
      filtered = filtered.filter(mark =>
        mark.studentName.toLowerCase().includes(searchStudent.toLowerCase()) ||
        mark.idNumber.toLowerCase().includes(searchStudent.toLowerCase())
      );
    }

    return filtered;
  };

  const getUniqueClasses = () => {
    return [...new Set(details.marks.map(m => m.className))].sort();
  };

  const getUniqueSubjects = () => {
    return [...new Set(details.marks.map(m => m.subject))].sort();
  };

  const calculateStats = (marks) => {
    if (marks.length === 0) return null;

    const totals = marks.map(m => parseFloat(m.classScore || 0) + parseFloat(m.examsScore || 0));
    const average = totals.reduce((a, b) => a + b, 0) / totals.length;
    const highest = Math.max(...totals);
    const lowest = Math.min(...totals);

    return {
      average: average.toFixed(1),
      highest: highest.toFixed(1),
      lowest: lowest.toFixed(1),
      count: marks.length
    };
  };

  const exportToExcel = async () => {
    setExporting(true);
    try {
      const XLSX = await import('xlsx');

      const marksData = details.marks.map(mark => ({
        'Student ID': mark.idNumber,
        'Student Name': mark.studentName,
        'Class': mark.className,
        'Subject': mark.subject,
        'Class Score': mark.classScore,
        'Exam Score': mark.examsScore,
        'Total': (parseFloat(mark.classScore || 0) + parseFloat(mark.examsScore || 0)).toFixed(1),
        'Grade': mark.grade
      }));

      const remarksData = details.remarks.map(remark => ({
        'Student ID': remark.idNumber,
        'Student Name': remark.studentName,
        'Conduct': remark.conduct,
        'Attitude': remark.attitude,
        'Interest': remark.interest,
        'Remarks': remark.remarks
      }));

      const wb = XLSX.utils.book_new();
      const marksWS = XLSX.utils.json_to_sheet(marksData);
      XLSX.utils.book_append_sheet(wb, marksWS, 'Marks');

      const remarksWS = XLSX.utils.json_to_sheet(remarksData);
      XLSX.utils.book_append_sheet(wb, remarksWS, 'Remarks');

      const summaryData = [
        { Field: 'Term', Value: archive.term },
        { Field: 'Academic Year', Value: archive.academicYear },
        { Field: 'Archived Date', Value: new Date(archive.archivedDate).toLocaleDateString() },
        { Field: 'Total Marks', Value: details.marks.length },
        { Field: 'Total Remarks', Value: details.remarks.length },
        { Field: 'Total Students', Value: details.students.length }
      ];
      const summaryWS = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, summaryWS, 'Summary');

      XLSX.writeFile(wb, `Archive_${archive.term}_${archive.academicYear}.xlsx`);

      showNotification({
        type: 'success',
        title: 'Export Successful',
        message: 'Archive data exported to Excel'
      });
    } catch (error) {
      console.error('Export error:', error);
      showNotification({
        type: 'error',
        title: 'Export Failed',
        message: 'Failed to export: ' + error.message
      });
    } finally {
      setExporting(false);
    }
  };

  const exportToPDF = async () => {
    setExporting(true);
    try {
      showNotification({
        type: 'info',
        title: 'Generating PDF',
        message: 'This may take a moment...'
      });

      // Use the existing printing service
      const schoolInfo = {
        term: archive.term,
        academicYear: archive.academicYear,
        schoolName: 'Archive Export',
        schoolLogo: ''
      };

      // Generate PDF for all students in this archive
      await printingService.printBulkStudentReportsServerSide(
        details.students,
        schoolInfo.term,
        schoolInfo,
        (progress) => console.log(`PDF Progress: ${progress}%`)
      );

      showNotification({
        type: 'success',
        title: 'PDF Generated',
        message: 'Archive reports exported to PDF successfully'
      });
    } catch (error) {
      console.error('PDF export error:', error);
      showNotification({
        type: 'error',
        title: 'PDF Export Failed',
        message: 'Failed to generate PDF: ' + error.message
      });
    } finally {
      setExporting(false);
    }
  };

  const filteredMarks = getFilteredMarks();
  const stats = calculateStats(filteredMarks);

  return (
    <div>
      {/* Action Bar */}
      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={exportToExcel}
          disabled={exporting}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          {exporting ? 'Exporting...' : 'Export to Excel'}
        </button>

        <button
          onClick={exportToPDF}
          disabled={exporting}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          {exporting ? 'Generating...' : 'Export to PDF'}
        </button>

        <button
          onClick={onDelete}
          className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 flex items-center gap-2 ml-auto"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Delete Archive
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="text-sm text-blue-600 mb-1">Total Marks</div>
          <div className="text-2xl font-bold text-blue-900">{details.marks.length}</div>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <div className="text-sm text-green-600 mb-1">Total Remarks</div>
          <div className="text-2xl font-bold text-green-900">{details.remarks.length}</div>
        </div>
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="text-sm text-purple-600 mb-1">Students</div>
          <div className="text-2xl font-bold text-purple-900">{details.students.length}</div>
        </div>
        <div className="bg-orange-50 rounded-lg p-4">
          <div className="text-sm text-orange-600 mb-1">Classes</div>
          <div className="text-2xl font-bold text-orange-900">{getUniqueClasses().length}</div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h3 className="font-semibold mb-3">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search Student</label>
            <input
              type="text"
              value={searchStudent}
              onChange={(e) => setSearchStudent(e.target.value)}
              placeholder="Name or ID..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
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

        {/* Statistics for filtered data */}
        {stats && (
          <div className="mt-4 grid grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-xs text-gray-600">Count</div>
              <div className="text-lg font-bold">{stats.count}</div>
            </div>
            <div>
              <div className="text-xs text-gray-600">Average</div>
              <div className="text-lg font-bold text-blue-600">{stats.average}%</div>
            </div>
            <div>
              <div className="text-xs text-gray-600">Highest</div>
              <div className="text-lg font-bold text-green-600">{stats.highest}%</div>
            </div>
            <div>
              <div className="text-xs text-gray-600">Lowest</div>
              <div className="text-lg font-bold text-orange-600">{stats.lowest}%</div>
            </div>
          </div>
        )}
      </div>

      {/* Marks Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Marks Records ({filteredMarks.length})</h3>
        </div>
        <div className="overflow-x-auto max-h-96 overflow-y-auto">
          <table className="w-full">
            <thead className="bg-gray-100 sticky top-0">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Student</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">ID</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Class</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Subject</th>
                <th className="px-4 py-2 text-center text-xs font-semibold text-gray-700">Class Score</th>
                <th className="px-4 py-2 text-center text-xs font-semibold text-gray-700">Exam Score</th>
                <th className="px-4 py-2 text-center text-xs font-semibold text-gray-700">Total</th>
                <th className="px-4 py-2 text-center text-xs font-semibold text-gray-700">Grade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredMarks.map((mark, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-sm">{mark.studentName}</td>
                  <td className="px-4 py-2 text-sm text-gray-600">{mark.idNumber}</td>
                  <td className="px-4 py-2 text-sm">{mark.className}</td>
                  <td className="px-4 py-2 text-sm">{mark.subject}</td>
                  <td className="px-4 py-2 text-sm text-center">{mark.classScore}</td>
                  <td className="px-4 py-2 text-sm text-center">{mark.examsScore}</td>
                  <td className="px-4 py-2 text-sm text-center font-semibold">
                    {(parseFloat(mark.classScore || 0) + parseFloat(mark.examsScore || 0)).toFixed(1)}
                  </td>
                  <td className="px-4 py-2 text-sm text-center">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      mark.grade === 'A' ? 'bg-green-100 text-green-800' :
                      mark.grade === 'B' ? 'bg-blue-100 text-blue-800' :
                      mark.grade === 'C' ? 'bg-yellow-100 text-yellow-800' :
                      mark.grade === 'D' ? 'bg-orange-100 text-orange-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {mark.grade}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredMarks.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No marks found for the selected filters
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ArchiveDetails;
