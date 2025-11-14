import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useGlobalSettings } from '../context/GlobalSettingsContext';
import printingService from '../services/printingService';
import LoadingSpinner from './LoadingSpinner';

const PrintReportModal = ({ isOpen, onClose, students = [], selectedStudents = [] }) => {
  const { settings } = useGlobalSettings();
  const [printMode, setPrintMode] = useState('single'); // 'single', 'bulk', 'selected'
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [printing, setPrinting] = useState(false);
  const [printProgress, setPrintProgress] = useState(0);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');
  const [useServerSidePDF, setUseServerSidePDF] = useState(true); // Toggle for server-side PDF

  useEffect(() => {
    if (students.length > 0) {
      let filtered = students;

      // Filter by search term
      if (searchTerm) {
        filtered = filtered.filter(s =>
          `${s.firstName} ${s.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.idNumber?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      // Filter by class
      if (selectedClass !== 'all') {
        filtered = filtered.filter(s => s.className === selectedClass);
      }

      setFilteredStudents(filtered);
    }
  }, [students, searchTerm, selectedClass]);

  const handlePrintSingle = async () => {
    if (!selectedStudent) {
      alert('Please select a student');
      return;
    }

    setPrinting(true);
    try {
      const schoolInfo = {
        name: settings.schoolName,
        term: settings.term,
        academicYear: settings.academicYear,
        logo: settings.schoolLogo
      };

      const result = await printingService.printStudentReport(
        selectedStudent,
        settings.term,
        schoolInfo
      );

      if (result.success) {
        alert('Report generated successfully!');
        onClose();
      } else {
        alert(result.message);
      }
    } catch (error) {
      alert('Failed to generate report: ' + error.message);
    } finally {
      setPrinting(false);
    }
  };

  const handlePrintBulk = async () => {
    const studentsToPrint = printMode === 'selected' ? selectedStudents : filteredStudents;

    if (studentsToPrint.length === 0) {
      alert('No students selected');
      return;
    }

    setPrinting(true);
    setPrintProgress(0);

    try {
      const schoolInfo = {
        name: settings.schoolName,
        term: settings.term,
        academicYear: settings.academicYear,
        logo: settings.schoolLogo
      };

      let result;

      // Try server-side PDF generation first if enabled
      if (useServerSidePDF) {
        try {
          result = await printingService.printBulkStudentReportsServerSide(
            studentsToPrint,
            settings.term,
            schoolInfo,
            (progress) => setPrintProgress(progress)
          );

          if (result.success) {
            alert(`Successfully generated high-quality ${studentsToPrint.length} reports!`);
            onClose();
            return;
          } else {
            throw new Error(result.message);
          }
        } catch (serverError) {
          console.error('Server-side PDF generation failed:', serverError);
          // Don't fall back to broken client-side - show the actual error
          throw new Error(`Server-side PDF generation failed: ${serverError.message || serverError}`);
        }
      } else {
        // Use client-side generation directly
        result = await printingService.printBulkStudentReports(
          studentsToPrint,
          settings.term,
          schoolInfo,
          (progress) => setPrintProgress(progress)
        );

        if (result.success) {
          alert(`Successfully generated ${studentsToPrint.length} reports!`);
          onClose();
        } else {
          alert(result.message);
        }
      }
    } catch (error) {
      alert('Failed to generate reports: ' + error.message);
    } finally {
      setPrinting(false);
      setPrintProgress(0);
    }
  };

  const handlePrint = () => {
    if (printMode === 'single') {
      handlePrintSingle();
    } else {
      handlePrintBulk();
    }
  };

  if (!isOpen) return null;

  // Get unique classes
  const classes = ['all', ...new Set(students.map(s => s.className).filter(Boolean))];

  const modalContent = (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-green-600 to-green-700 text-white p-6 rounded-t-lg">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Print Student Reports</h2>
              <p className="text-green-100 text-sm">
                {settings.term} | {settings.academicYear}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Print Mode Selection */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 mb-3">Print Mode</label>
            <div className="flex gap-4">
              <button
                onClick={() => setPrintMode('single')}
                className={`flex-1 p-3 rounded-lg border-2 transition-colors ${
                  printMode === 'single'
                    ? 'border-green-600 bg-green-50 text-green-800'
                    : 'border-gray-300 hover:border-green-400'
                }`}
              >
                <div className="text-center">
                  <div className="text-2xl mb-1">📄</div>
                  <div className="font-medium">Single Report</div>
                  <div className="text-xs text-gray-600">Print one student</div>
                </div>
              </button>

              <button
                onClick={() => setPrintMode('bulk')}
                className={`flex-1 p-3 rounded-lg border-2 transition-colors ${
                  printMode === 'bulk'
                    ? 'border-green-600 bg-green-50 text-green-800'
                    : 'border-gray-300 hover:border-green-400'
                }`}
              >
                <div className="text-center">
                  <div className="text-2xl mb-1">📚</div>
                  <div className="font-medium">Bulk Print</div>
                  <div className="text-xs text-gray-600">Print all filtered</div>
                </div>
              </button>

              {selectedStudents.length > 0 && (
                <button
                  onClick={() => setPrintMode('selected')}
                  className={`flex-1 p-3 rounded-lg border-2 transition-colors ${
                    printMode === 'selected'
                      ? 'border-green-600 bg-green-50 text-green-800'
                      : 'border-gray-300 hover:border-green-400'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-1">✅</div>
                    <div className="font-medium">Selected ({selectedStudents.length})</div>
                    <div className="text-xs text-gray-600">Print selected</div>
                  </div>
                </button>
              )}
            </div>
          </div>

          {/* PDF Generation Method Toggle (for bulk/selected mode) */}
          {printMode !== 'single' && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <label className="flex items-center cursor-pointer">
                    <div className="relative">
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={useServerSidePDF}
                        onChange={(e) => setUseServerSidePDF(e.target.checked)}
                      />
                      <div className={`block w-14 h-8 rounded-full transition ${
                        useServerSidePDF ? 'bg-green-600' : 'bg-gray-400'
                      }`}></div>
                      <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition ${
                        useServerSidePDF ? 'transform translate-x-6' : ''
                      }`}></div>
                    </div>
                    <div className="ml-3">
                      <span className="text-sm font-medium text-blue-900">
                        {useServerSidePDF ? 'Server-Side PDF (High Quality)' : 'Client-Side PDF (Standard)'}
                      </span>
                      <p className="text-xs text-blue-700">
                        {useServerSidePDF
                          ? '✨ Better quality, faster processing. Automatically falls back if unavailable.'
                          : '⚡ Standard quality, processed in browser.'
                        }
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Filters (for bulk/selected mode) */}
          {printMode !== 'single' && (
            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Search Student</label>
                  <input
                    type="text"
                    placeholder="Search by name or ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Class</label>
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    {classes.map(cls => (
                      <option key={cls} value={cls}>
                        {cls === 'all' ? 'All Classes' : cls}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="text-sm text-gray-600">
                {printMode === 'bulk' && `${filteredStudents.length} student(s) will be printed`}
                {printMode === 'selected' && `${selectedStudents.length} selected student(s) will be printed`}
              </div>
            </div>
          )}

          {/* Student Selection (for single mode) */}
          {printMode === 'single' && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-3">Select Student</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <input
                  type="text"
                  placeholder="Search by name or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />

                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  {classes.map(cls => (
                    <option key={cls} value={cls}>
                      {cls === 'all' ? 'All Classes' : cls}
                    </option>
                  ))}
                </select>
              </div>

              <div className="max-h-64 overflow-y-auto space-y-2">
                {filteredStudents.map(student => (
                  <div
                    key={student.id}
                    onClick={() => setSelectedStudent(student)}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                      selectedStudent?.id === student.id
                        ? 'border-green-600 bg-green-50'
                        : 'border-gray-200 hover:border-green-400 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium text-gray-900">
                          {student.firstName} {student.lastName}
                        </div>
                        <div className="text-sm text-gray-600">
                          ID: {student.idNumber} | Class: {student.className}
                        </div>
                      </div>
                      {selectedStudent?.id === student.id && (
                        <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Progress Bar (when printing) */}
          {printing && printProgress > 0 && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-blue-900">Generating Reports...</span>
                <span className="text-sm text-blue-700">{printProgress}%</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${printProgress}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 rounded-b-lg border-t flex justify-between">
          <button
            onClick={onClose}
            disabled={printing}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            onClick={handlePrint}
            disabled={printing || (printMode === 'single' && !selectedStudent)}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {printing ? (
              <>
                <LoadingSpinner size="sm" message="" />
                <span>Printing...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                <span>Print Report{printMode !== 'single' ? 's' : ''}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default PrintReportModal;
