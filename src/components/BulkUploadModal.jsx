import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { importStudents } from '../api-client';

const BulkUploadModal = ({ isOpen, onClose, onUploadSuccess }) => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleFileUpload = (event) => {
    const selectedFile = event.target.files[0];
    if (!selectedFile) return;

    // Check file type
    const validTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv'
    ];
    
    if (!validTypes.includes(selectedFile.type)) {
      setError('Please upload a valid Excel or CSV file');
      return;
    }

    // Check file size (5MB limit)
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError('File size should be less than 5MB');
      return;
    }

    setError('');
    setSuccess('');
    parseFile(selectedFile);
  };

  const parseFile = (file) => {
    setLoading(true);
    setError('');
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Get the first worksheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        // Validate and process data
        const processedData = jsonData.map((row) => {
          // Normalize column names
          const normalizedRow = {};
          Object.keys(row).forEach(key => {
            const normalizedKey = key.toLowerCase().replace(/\s+/g, '_');
            normalizedRow[normalizedKey] = row[key];
          });
          
          return {
            firstName: normalizedRow.first_name || normalizedRow.firstname || normalizedRow['first name'] || '',
            lastName: normalizedRow.last_name || normalizedRow.lastname || normalizedRow['last name'] || '',
            className: normalizedRow.class_name || normalizedRow.class || normalizedRow.className || '',
            gender: normalizedRow.gender || 'male'
          };
        }).filter(student => 
          student.firstName.trim() !== '' && 
          student.lastName.trim() !== '' && 
          student.className.trim() !== ''
        );
        
        setStudents(processedData);
        setLoading(false);
        setSuccess(`Parsed ${processedData.length} students from file`);
      } catch (err) {
        console.error('Error parsing file:', err);
        setError('Failed to parse file. Please check the file format.');
        setLoading(false);
      }
    };
    
    reader.onerror = () => {
      setError('Error reading file');
      setLoading(false);
    };
    
    reader.readAsArrayBuffer(file);
  };

  const handleUpload = async () => {
    if (students.length === 0) {
      setError('No valid student data to upload');
      return;
    }

    try {
      setUploading(true);
      setError('');
      
      const response = await importStudents(students);
      
      if (response.status === 'success') {
        setSuccess(`Successfully uploaded ${response.importedCount} students`);
        onUploadSuccess(response.importedCount);
        // Clear the form
        setStudents([]);
      } else {
        setError(response.message || 'Failed to upload students');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError('Failed to upload students: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    // Create template data
    const templateData = [
      {
        'First Name': 'John',
        'Last Name': 'Doe',
        'Class': 'BS5',
        'Gender': 'male'
      },
      {
        'First Name': 'Jane',
        'Last Name': 'Smith',
        'Class': 'BS5',
        'Gender': 'female'
      }
    ];
    
    // Create workbook and worksheet
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Students');
    
    // Download the file
    XLSX.writeFile(wb, 'student_upload_template.xlsx');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 overflow-y-auto p-4">
      <div className="glass-card-golden rounded-xl shadow-2xl w-full max-w-full sm:max-w-2xl my-8">
        <div className="p-4 sm:p-6">
          <div className="flex justify-between items-center mb-4 sm:mb-6 pb-4 border-b-4 border-yellow-500/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-yellow-500/90 backdrop-blur-sm flex items-center justify-center text-xl sm:text-2xl shadow-lg border-2 border-white/50">
                📤
              </div>
              <h2 className="text-lg sm:text-2xl font-bold text-white text-shadow">Bulk Student Upload</h2>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-white/80 text-2xl font-bold p-2 hover:bg-white/20 rounded-xl transition-colors"
              style={{ minWidth: '44px', minHeight: '44px' }}
            >
              ×
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border-2 border-red-500/50 text-white rounded-xl backdrop-blur-md">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-500/20 border-2 border-green-500/50 text-white rounded-xl backdrop-blur-md">
              {success}
            </div>
          )}

          <div className="space-y-4 sm:space-y-6">
            {/* Upload Section */}
            <div className="bg-white/10 border-2 border-white/30 rounded-xl p-3 sm:p-4 backdrop-blur-md">
              <h3 className="text-base sm:text-lg font-bold text-white mb-3">Upload Excel/CSV File</h3>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:space-x-4 sm:gap-0">
                <div className="flex-1">
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileUpload}
                    className="w-full px-3 py-3 bg-white/20 border-2 border-white/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-yellow-500/90 file:text-white hover:file:bg-yellow-600 file:cursor-pointer backdrop-blur-md"
                    style={{ minHeight: '44px', fontSize: '16px' }}
                    disabled={loading || uploading}
                  />
                </div>
                <button
                  onClick={downloadTemplate}
                  className="px-4 py-3 bg-white/20 border-2 border-white/30 text-white rounded-xl hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-yellow-500 whitespace-nowrap font-semibold transition-all backdrop-blur-md"
                  style={{ minHeight: '44px' }}
                >
                  Download Template
                </button>
              </div>

              {loading && (
                <div className="mt-3 flex items-center text-white">
                  <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-500 mr-2"></div>
                  <span>Parsing file...</span>
                </div>
              )}

              <p className="mt-2 text-sm text-white/80">
                Supported formats: Excel (.xlsx, .xls) and CSV files. Maximum file size: 5MB.
              </p>
            </div>

            {/* Preview Section */}
            {students.length > 0 && (
              <div className="bg-white/10 border-2 border-white/30 rounded-xl p-3 sm:p-4 backdrop-blur-md">
                <h3 className="text-base sm:text-lg font-bold text-white mb-3">
                  Preview ({students.length} students)
                </h3>

                <div className="overflow-x-auto max-h-60 -mx-3 sm:mx-0 rounded-xl">
                  <table className="min-w-full divide-y divide-white/20">
                    <thead className="bg-white/20">
                      <tr>
                        <th className="px-3 sm:px-4 py-2 text-left text-xs font-bold text-white uppercase">First Name</th>
                        <th className="px-3 sm:px-4 py-2 text-left text-xs font-bold text-white uppercase">Last Name</th>
                        <th className="px-3 sm:px-4 py-2 text-left text-xs font-bold text-white uppercase">Class</th>
                        <th className="px-3 sm:px-4 py-2 text-left text-xs font-bold text-white uppercase">Gender</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white/5 divide-y divide-white/10">
                      {students.slice(0, 10).map((student, index) => (
                        <tr key={index} className="hover:bg-white/10 transition-colors">
                          <td className="px-3 sm:px-4 py-2 text-sm text-white">{student.firstName}</td>
                          <td className="px-3 sm:px-4 py-2 text-sm text-white">{student.lastName}</td>
                          <td className="px-3 sm:px-4 py-2 text-sm text-white">{student.className}</td>
                          <td className="px-3 sm:px-4 py-2 text-sm text-white capitalize">{student.gender}</td>
                        </tr>
                      ))}
                      {students.length > 10 && (
                        <tr>
                          <td colSpan="4" className="px-3 sm:px-4 py-2 text-sm text-white/70 text-center">
                            ... and {students.length - 10} more students
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Upload Button */}
            {students.length > 0 && (
              <div className="flex flex-col sm:flex-row justify-end gap-3 sm:space-x-3 sm:gap-0 pt-4 border-t-2 border-white/30">
                <button
                  onClick={onClose}
                  disabled={uploading}
                  className="px-4 py-3 bg-white/20 border-2 border-white/30 rounded-xl text-white hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-yellow-500 disabled:opacity-50 order-2 sm:order-1 font-semibold transition-all backdrop-blur-md"
                  style={{ minHeight: '44px', minWidth: '100px' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="px-4 py-3 bg-yellow-500/90 border-2 border-white/50 text-white rounded-xl hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 disabled:opacity-50 order-1 sm:order-2 font-bold shadow-lg transition-all"
                  style={{ minHeight: '44px', minWidth: '120px' }}
                >
                  {uploading ? (
                    <span className="flex items-center justify-center">
                      <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Uploading...
                    </span>
                  ) : (
                    `Upload ${students.length} Students`
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkUploadModal;