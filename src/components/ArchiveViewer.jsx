import React, { useState, useEffect } from 'react';
import { useNotification } from '../context/NotificationContext';

/**
 * Archive Viewer Component
 *
 * Allows viewing and exporting historical term data including:
 * - List of all archived terms
 * - Detailed view of marks and remarks
 * - Export to Excel/PDF
 * - Performance comparison across terms
 */
const ArchiveViewer = ({ isOpen, onClose }) => {
  const { showNotification } = useNotification();
  const [archives, setArchives] = useState([]);
  const [selectedArchive, setSelectedArchive] = useState(null);
  const [archiveDetails, setArchiveDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list', 'details', 'compare'
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedSubject, setSelectedSubject] = useState('all');

  // Load archives on mount
  useEffect(() => {
    if (isOpen) {
      loadArchives();
    }
  }, [isOpen]);

  const loadArchives = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/archives');
      const result = await response.json();

      if (result.status === 'success') {
        setArchives(result.data);
      } else {
        throw new Error(result.message || 'Failed to load archives');
      }
    } catch (error) {
      console.error('Error loading archives:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load archived terms: ' + error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const loadArchiveDetails = async (archiveId) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/archives?archiveId=${archiveId}`);
      const result = await response.json();

      if (result.status === 'success') {
        setArchiveDetails(result.data);
        setViewMode('details');
      } else {
        throw new Error(result.message || 'Failed to load archive details');
      }
    } catch (error) {
      console.error('Error loading archive details:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load archive details: ' + error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewArchive = (archive) => {
    setSelectedArchive(archive);
    loadArchiveDetails(archive.id);
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedArchive(null);
    setArchiveDetails(null);
  };

  const exportToExcel = async () => {
    if (!archiveDetails) return;

    try {
      // Import xlsx dynamically
      const XLSX = await import('xlsx');

      // Prepare marks data
      const marksData = archiveDetails.marks.map(mark => ({
        'Student ID': mark.idNumber,
        'Student Name': mark.studentName,
        'Class': mark.className,
        'Subject': mark.subject,
        'Class Score': mark.classScore,
        'Exam Score': mark.examsScore,
        'Total': (parseFloat(mark.classScore || 0) + parseFloat(mark.examsScore || 0)).toFixed(1),
        'Grade': mark.grade,
        'Remarks': mark.remarks
      }));

      // Prepare remarks data
      const remarksData = archiveDetails.remarks.map(remark => ({
        'Student ID': remark.idNumber,
        'Student Name': remark.studentName,
        'Conduct': remark.conduct,
        'Attitude': remark.attitude,
        'Interest': remark.interest,
        'Remarks': remark.remarks
      }));

      // Create workbook
      const wb = XLSX.utils.book_new();

      // Add marks sheet
      const marksWS = XLSX.utils.json_to_sheet(marksData);
      XLSX.utils.book_append_sheet(wb, marksWS, 'Marks');

      // Add remarks sheet
      const remarksWS = XLSX.utils.json_to_sheet(remarksData);
      XLSX.utils.book_append_sheet(wb, remarksWS, 'Remarks');

      // Add summary sheet
      const summaryData = [
        { Field: 'Term', Value: selectedArchive.term },
        { Field: 'Academic Year', Value: selectedArchive.academicYear },
        { Field: 'Archived Date', Value: new Date(selectedArchive.archivedDate).toLocaleDateString() },
        { Field: 'Total Marks Records', Value: archiveDetails.marks.length },
        { Field: 'Total Remarks Records', Value: archiveDetails.remarks.length },
        { Field: 'Total Students', Value: archiveDetails.students.length }
      ];
      const summaryWS = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, summaryWS, 'Summary');

      // Download file
      XLSX.writeFile(wb, `Archive_${selectedArchive.term}_${selectedArchive.academicYear}.xlsx`);

      showNotification({
        type: 'success',
        title: 'Export Successful',
        message: 'Archive data exported to Excel successfully'
      });
    } catch (error) {
      console.error('Export error:', error);
      showNotification({
        type: 'error',
        title: 'Export Failed',
        message: 'Failed to export data: ' + error.message
      });
    }
  };

  const getFilteredMarks = () => {
    if (!archiveDetails) return [];

    let filtered = archiveDetails.marks;

    if (selectedClass !== 'all') {
      filtered = filtered.filter(mark => mark.className === selectedClass);
    }

    if (selectedSubject !== 'all') {
      filtered = filtered.filter(mark => mark.subject === selectedSubject);
    }

    return filtered;
  };

  const getUniqueClasses = () => {
    if (!archiveDetails) return [];
    return [...new Set(archiveDetails.marks.map(m => m.className))].sort();
  };

  const getUniqueSubjects = () => {
    if (!archiveDetails) return [];
    return [...new Set(archiveDetails.marks.map(m => m.subject))].sort();
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 overflow-y-auto">
      <div className="flex items-start justify-center min-h-screen p-4 pt-10">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl my-8 border border-gray-200">
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-gray-200">
            <div>
              <h2 className="text-2xl font-bold text-white">
                {viewMode === 'list' ? 'Archived Terms' : `Archive: ${selectedArchive?.term} (${selectedArchive?.academicYear})`}
              </h2>
              <p className="text-sm text-white/80 mt-1">
                {viewMode === 'list'
                  ? 'View and export historical term data'
                  : 'Viewing archived marks and remarks'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white/70 hover:text-white text-2xl transition-colors"
            >
              ×
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-white/80">Loading...</p>
                </div>
              </div>
            ) : viewMode === 'list' ? (
              /* Archive List View */
              <div>
                {archives.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">📦</div>
                    <h3 className="text-xl font-semibold text-white/90 mb-2">No Archives Found</h3>
                    <p className="text-white/80">No terms have been archived yet.</p>
                    <p className="text-sm text-white/70 mt-2">
                      Go to School Setup to archive completed terms.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {archives.map(archive => (
                      <div
                        key={archive.id}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer"
                        onClick={() => handleViewArchive(archive)}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-bold text-lg text-white">{archive.term}</h3>
                            <p className="text-sm text-white/80">{archive.academicYear}</p>
                          </div>
                          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                            Archive
                          </span>
                        </div>

                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-white/80">Marks:</span>
                            <span className="font-semibold">{archive.counts.marks}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-white/80">Remarks:</span>
                            <span className="font-semibold">{archive.counts.remarks}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-white/80">Students:</span>
                            <span className="font-semibold">{archive.counts.students}</span>
                          </div>
                          <div className="border-t pt-2 mt-2">
                            <span className="text-white/80 text-xs">
                              Archived: {new Date(archive.archivedDate).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        <button className="mt-3 w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition-colors text-sm">
                          View Archive →
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* Archive Details View */
              <div>
                {/* Back button and actions */}
                <div className="flex justify-between items-center mb-6">
                  <button
                    onClick={handleBackToList}
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
                  >
                    ← Back to Archives
                  </button>
                  <button
                    onClick={exportToExcel}
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Export to Excel
                  </button>
                </div>

                {/* Statistics Cards */}
                {archiveDetails && (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="text-sm text-blue-600 mb-1">Total Marks</div>
                      <div className="text-2xl font-bold text-blue-900">{archiveDetails.marks.length}</div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="text-sm text-green-600 mb-1">Total Remarks</div>
                      <div className="text-2xl font-bold text-green-900">{archiveDetails.remarks.length}</div>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4">
                      <div className="text-sm text-purple-600 mb-1">Students</div>
                      <div className="text-2xl font-bold text-purple-900">{archiveDetails.students.length}</div>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-4">
                      <div className="text-sm text-orange-600 mb-1">Classes</div>
                      <div className="text-2xl font-bold text-orange-900">{getUniqueClasses().length}</div>
                    </div>
                  </div>
                )}

                {/* Filters */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h3 className="font-semibold mb-3">Filters</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-white/90 mb-1">Class</label>
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
                      <label className="block text-sm font-medium text-white/90 mb-1">Subject</label>
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
                  {(() => {
                    const filteredMarks = getFilteredMarks();
                    const stats = calculateStats(filteredMarks);
                    return stats ? (
                      <div className="mt-4 grid grid-cols-4 gap-4 text-center">
                        <div>
                          <div className="text-xs text-white/80">Count</div>
                          <div className="text-lg font-bold">{stats.count}</div>
                        </div>
                        <div>
                          <div className="text-xs text-white/80">Average</div>
                          <div className="text-lg font-bold text-blue-600">{stats.average}%</div>
                        </div>
                        <div>
                          <div className="text-xs text-white/80">Highest</div>
                          <div className="text-lg font-bold text-green-600">{stats.highest}%</div>
                        </div>
                        <div>
                          <div className="text-xs text-white/80">Lowest</div>
                          <div className="text-lg font-bold text-orange-600">{stats.lowest}%</div>
                        </div>
                      </div>
                    ) : null;
                  })()}
                </div>

                {/* Marks Table */}
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                    <h3 className="font-semibold text-white">Marks Records</h3>
                  </div>
                  <div className="overflow-x-auto max-h-96 overflow-y-auto">
                    <table className="w-full">
                      <thead className="bg-gray-100 sticky top-0">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-white">Student</th>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-white">ID</th>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-white">Class</th>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-white">Subject</th>
                          <th className="px-4 py-2 text-center text-xs font-semibold text-white">Class Score</th>
                          <th className="px-4 py-2 text-center text-xs font-semibold text-white">Exam Score</th>
                          <th className="px-4 py-2 text-center text-xs font-semibold text-white">Total</th>
                          <th className="px-4 py-2 text-center text-xs font-semibold text-white">Grade</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {getFilteredMarks().map((mark, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 py-2 text-sm">{mark.studentName}</td>
                            <td className="px-4 py-2 text-sm text-white/80">{mark.idNumber}</td>
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
                    {getFilteredMarks().length === 0 && (
                      <div className="text-center py-8 text-white/80">
                        No marks found for the selected filters
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-white rounded-lg hover:bg-white/10 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArchiveViewer;
