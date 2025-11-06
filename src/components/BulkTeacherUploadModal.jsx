import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { importTeachers } from '../api-client';

const BulkTeacherUploadModal = ({ isOpen, onClose, onUploadSuccess }) => {
  const [teachers, setTeachers] = useState([]);
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

          // Parse subjects and classes if they're comma-separated strings
          const parseArray = (value) => {
            if (!value) return [];
            if (Array.isArray(value)) return value;
            return value.toString().split(',').map(item => item.trim()).filter(item => item);
          };

          // Parse roles
          const parseRoles = (value) => {
            if (!value) return ['subject_teacher'];
            if (Array.isArray(value)) return value;
            return value.toString().split(',').map(item => item.trim().toLowerCase().replace(/\s+/g, '_')).filter(item => item);
          };

          return {
            firstName: normalizedRow.first_name || normalizedRow.firstname || normalizedRow['first_name'] || '',
            lastName: normalizedRow.last_name || normalizedRow.lastname || normalizedRow['last_name'] || '',
            email: normalizedRow.email || '',
            password: normalizedRow.password || 'teacher123',
            gender: normalizedRow.gender || 'male',
            subjects: parseArray(normalizedRow.subjects || normalizedRow.subject),
            classes: parseArray(normalizedRow.classes || normalizedRow.class),
            teacherPrimaryRole: normalizedRow.primary_role || normalizedRow.role || normalizedRow.teacher_primary_role || 'subject_teacher',
            allRoles: parseRoles(normalizedRow.all_roles || normalizedRow.roles || normalizedRow.primary_role || normalizedRow.role),
            classAssigned: normalizedRow.class_assigned || normalizedRow.form_class || ''
          };
        }).filter(teacher =>
          teacher.firstName.trim() !== '' &&
          teacher.lastName.trim() !== '' &&
          teacher.email.trim() !== ''
        );

        setTeachers(processedData);
        setLoading(false);
        setSuccess(`Parsed ${processedData.length} teachers from file`);
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
    if (teachers.length === 0) {
      setError('No valid teacher data to upload');
      return;
    }

    try {
      setUploading(true);
      setError('');

      const response = await importTeachers(teachers);

      if (response.status === 'success') {
        setSuccess(`Successfully uploaded ${response.importedCount || teachers.length} teachers`);
        onUploadSuccess(response.importedCount || teachers.length);
        // Clear the form after a delay
        setTimeout(() => {
          setTeachers([]);
          onClose();
        }, 2000);
      } else {
        setError(response.message || 'Failed to upload teachers');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError('Failed to upload teachers: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    // Create template data with comprehensive examples
    const templateData = [
      {
        'First Name': 'John',
        'Last Name': 'Doe',
        'Email': 'john.doe@school.com',
        'Password': 'teacher123',
        'Gender': 'male',
        'Subjects': 'Mathematics, Integrated Science',
        'Classes': 'BS7, BS8',
        'Primary Role': 'subject_teacher',
        'All Roles': 'subject_teacher',
        'Class Assigned': ''
      },
      {
        'First Name': 'Jane',
        'Last Name': 'Smith',
        'Email': 'jane.smith@school.com',
        'Password': 'teacher123',
        'Gender': 'female',
        'Subjects': 'English Language, Social Studies',
        'Classes': 'BS8, BS9',
        'Primary Role': 'class_teacher',
        'All Roles': 'subject_teacher, class_teacher',
        'Class Assigned': ''
      },
      {
        'First Name': 'Michael',
        'Last Name': 'Johnson',
        'Email': 'michael.johnson@school.com',
        'Password': 'teacher123',
        'Gender': 'male',
        'Subjects': 'Mathematics, Integrated Science',
        'Classes': 'BS7',
        'Primary Role': 'form_master',
        'All Roles': 'subject_teacher, class_teacher, form_master',
        'Class Assigned': 'BS7'
      }
    ];

    // Create workbook and worksheet
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Teachers');

    // Add instructions sheet
    const instructions = [
      { Field: 'First Name', Required: 'Yes', Description: 'Teacher first name', Example: 'John' },
      { Field: 'Last Name', Required: 'Yes', Description: 'Teacher last name', Example: 'Doe' },
      { Field: 'Email', Required: 'Yes', Description: 'Teacher email address', Example: 'john.doe@school.com' },
      { Field: 'Password', Required: 'No', Description: 'Default password (if empty, uses "teacher123")', Example: 'teacher123' },
      { Field: 'Gender', Required: 'No', Description: 'male or female (default: male)', Example: 'male' },
      { Field: 'Subjects', Required: 'No', Description: 'Comma-separated list of subjects', Example: 'Mathematics, Science' },
      { Field: 'Classes', Required: 'No', Description: 'Comma-separated list of classes', Example: 'BS7, BS8, BS9' },
      { Field: 'Primary Role', Required: 'No', Description: 'subject_teacher, class_teacher, form_master, or head_teacher', Example: 'subject_teacher' },
      { Field: 'All Roles', Required: 'No', Description: 'Comma-separated list of roles', Example: 'subject_teacher, class_teacher' },
      { Field: 'Class Assigned', Required: 'No', Description: 'Form class (only for form masters)', Example: 'BS7' }
    ];

    const wsInstructions = XLSX.utils.json_to_sheet(instructions);
    XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instructions');

    // Download the file
    XLSX.writeFile(wb, 'teacher_upload_template.xlsx');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">Bulk Teacher Upload</h2>
            <button
              onClick={onClose}
              className="text-white/70 hover:text-white text-2xl"
            >
              ×
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
              {success}
            </div>
          )}

          <div className="space-y-6">
            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">📋 Instructions</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Download the template Excel file</li>
                <li>• Fill in teacher information (First Name, Last Name, and Email are required)</li>
                <li>• For multiple subjects or classes, separate them with commas</li>
                <li>• Valid roles: subject_teacher, class_teacher, form_master, head_teacher</li>
                <li>• Upload the completed file</li>
              </ul>
            </div>

            {/* Upload Section */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-medium text-white mb-3">Upload Excel/CSV File</h3>

              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileUpload}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={loading || uploading}
                  />
                </div>
                <button
                  onClick={downloadTemplate}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Download Template
                </button>
              </div>

              {loading && (
                <div className="mt-3 flex items-center text-blue-600">
                  <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                  <span>Parsing file...</span>
                </div>
              )}

              <p className="mt-2 text-sm text-white/80">
                Supported formats: Excel (.xlsx, .xls) and CSV files. Maximum file size: 5MB.
              </p>
            </div>

            {/* Preview Section */}
            {teachers.length > 0 && (
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-white mb-3">
                  Preview ({teachers.length} teachers)
                </h3>

                <div className="overflow-x-auto max-h-96">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-white/80 uppercase">First Name</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-white/80 uppercase">Last Name</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-white/80 uppercase">Email</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-white/80 uppercase">Gender</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-white/80 uppercase">Subjects</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-white/80 uppercase">Classes</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-white/80 uppercase">Role</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {teachers.slice(0, 10).map((teacher, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-2 text-sm text-white">{teacher.firstName}</td>
                          <td className="px-4 py-2 text-sm text-white">{teacher.lastName}</td>
                          <td className="px-4 py-2 text-sm text-white">{teacher.email}</td>
                          <td className="px-4 py-2 text-sm text-white capitalize">{teacher.gender}</td>
                          <td className="px-4 py-2 text-sm text-white">
                            {teacher.subjects?.length > 0 ? teacher.subjects.join(', ') : 'None'}
                          </td>
                          <td className="px-4 py-2 text-sm text-white">
                            {teacher.classes?.length > 0 ? teacher.classes.join(', ') : 'None'}
                          </td>
                          <td className="px-4 py-2 text-sm text-white">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                              {teacher.teacherPrimaryRole?.replace('_', ' ')}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {teachers.length > 10 && (
                        <tr>
                          <td colSpan="7" className="px-4 py-2 text-sm text-white/70 text-center">
                            ... and {teachers.length - 10} more teachers
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Upload Button */}
            {teachers.length > 0 && (
              <div className="flex justify-end space-x-3">
                <button
                  onClick={onClose}
                  disabled={uploading}
                  className="px-4 py-2 border border-gray-300 rounded-md text-white/90 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                >
                  {uploading ? (
                    <span className="flex items-center">
                      <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Uploading...
                    </span>
                  ) : (
                    `Upload ${teachers.length} Teachers`
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

export default BulkTeacherUploadModal;
