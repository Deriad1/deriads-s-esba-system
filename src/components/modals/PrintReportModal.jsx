import React from 'react';
import PropTypes from 'prop-types';
import GroupedClassList from '../GroupedClassList';
import { useNotification } from '../../context/NotificationContext';

const PrintReportModal = ({
  isOpen,
  onClose,
  classes,
  selectedClass,
  handleClassChange,
  printing,
  printClassReports,
  classStudents,
  selectedStudents,
  handleSelectAllStudents,
  handleStudentSelection,
  printSelectedStudents,
  printClassBroadsheet,
  classSubjects,
  selectedSubject,
  handleSubjectChange,
  printSubjectBroadsheet,
}) => {
  const { showNotification } = useNotification();
  const [showSubjectDropdown, setShowSubjectDropdown] = React.useState(false);

  if (!isOpen) return null;

  const handlePrintClassReports = async () => {
    if (!selectedClass) {
      showNotification({
        type: 'warning',
        title: 'Selection Required',
        message: 'Please select a class first'
      });
      return;
    }
    await printClassReports();
  };

  const handlePrintSelectedStudents = async () => {
    if (selectedStudents.length === 0) {
      showNotification({
        type: 'warning',
        title: 'Selection Required',
        message: 'Please select at least one student'
      });
      return;
    }
    await printSelectedStudents();
  };

  const handlePrintClassBroadsheet = async () => {
    if (!selectedClass) {
      showNotification({
        type: 'warning',
        title: 'Selection Required',
        message: 'Please select a class first'
      });
      return;
    }
    await printClassBroadsheet();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] overflow-y-auto">
      <div className="min-h-screen flex items-center justify-center p-4 py-8">
        <div className="glass-card-golden rounded-xl p-6 w-full max-w-6xl border-2 border-white/30 shadow-2xl my-auto">
        <div className="flex justify-between items-center mb-6 pb-4 border-b-4 border-yellow-500/50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/90 to-blue-600/90 backdrop-blur-sm flex items-center justify-center text-white text-2xl shadow-lg border-2 border-white/50">
              🖨️
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white text-shadow">Print Reports & Broadsheets</h2>
              <p className="text-sm text-white/90">Select a class and choose students to print</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-white/80 text-2xl font-bold p-2 hover:bg-white/20 rounded-xl transition-colors"
            style={{ minWidth: '44px', minHeight: '44px' }}
          >
            &times;
          </button>
        </div>

        {/* Class Selection with Grouped Display */}
        <div className="bg-white/10 border-2 border-white/30 rounded-xl p-4 mb-6 backdrop-blur-md shadow-lg">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/90 to-indigo-600/90 backdrop-blur-sm flex items-center justify-center text-white text-lg shadow-md border-2 border-white/50">
              🎓
            </div>
            <h3 className="text-lg font-bold text-white">Select Class</h3>
          </div>
          <GroupedClassList
            classes={classes}
            onClassSelect={handleClassChange}
            selectedClass={selectedClass}
            showCounts={false}
          />
        </div>

          {/* Action Buttons and Student Selection */}
          {selectedClass && (
            <div className="space-y-6">
              {/* Print Actions */}
              <div className="bg-white/10 border-2 border-white/30 rounded-xl p-4 backdrop-blur-md shadow-lg">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500/90 to-blue-600/90 backdrop-blur-sm flex items-center justify-center text-white text-lg shadow-md border-2 border-white/50">
                    🖨️
                  </div>
                  <h3 className="text-lg font-bold text-white">Quick Print Actions for {selectedClass}</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={handlePrintClassReports}
                    disabled={printing}
                    className="px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 border-2 border-white/70 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all font-bold shadow-2xl backdrop-blur-sm disabled:opacity-50"
                    style={{ minHeight: '44px', boxShadow: '0 4px 20px rgba(59, 130, 246, 0.4)' }}
                  >
                    {printing ? "⏳ Printing..." : `📄 Print All Reports (${classStudents.length})`}
                  </button>
                  <button
                    onClick={handlePrintClassBroadsheet}
                    disabled={printing}
                    className="px-4 py-3 bg-gradient-to-r from-purple-500 to-purple-600 border-2 border-white/70 text-white rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all font-bold shadow-2xl backdrop-blur-sm disabled:opacity-50"
                    style={{ minHeight: '44px', boxShadow: '0 4px 20px rgba(168, 85, 247, 0.4)' }}
                  >
                    {printing ? "⏳ Printing..." : `📊 Complete Broadsheet`}
                  </button>
                  <button
                    onClick={() => setShowSubjectDropdown(!showSubjectDropdown)}
                    disabled={printing}
                    className="px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 border-2 border-white/70 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all font-bold shadow-2xl backdrop-blur-sm disabled:opacity-50"
                    style={{ minHeight: '44px', boxShadow: '0 4px 20px rgba(34, 197, 94, 0.4)' }}
                  >
                    📋 Subject Broadsheet
                  </button>
                </div>

                {/* Subject Selection Dropdown */}
                {showSubjectDropdown && (
                  <div className="mt-4 bg-white/10 border-2 border-green-400/50 rounded-xl p-4 backdrop-blur-md shadow-lg">
                    <h4 className="text-md font-bold text-white mb-3">📚 Select Subject</h4>
                    <div className="max-h-48 overflow-y-auto bg-white/5 rounded-lg p-2">
                      {classSubjects && classSubjects.length > 0 ? (
                        classSubjects.map((subject) => (
                          <button
                            key={subject}
                            onClick={() => {
                              handleSubjectChange(subject);
                              printSubjectBroadsheet(subject);
                              setShowSubjectDropdown(false);
                            }}
                            disabled={printing}
                            className="w-full text-left px-4 py-3 mb-2 bg-white/20 border-2 border-white/30 text-white rounded-xl hover:bg-gradient-to-r hover:from-green-500 hover:to-green-600 hover:border-white/70 transition-all disabled:opacity-50 font-medium backdrop-blur-sm active:scale-98"
                            style={{ minHeight: '48px' }}
                          >
                            {subject}
                          </button>
                        ))
                      ) : (
                        <div className="text-white/90 text-sm font-medium p-4 bg-white/5 rounded-lg border border-white/20">
                          <p className="mb-2">⚠️ No subjects found for {selectedClass}</p>
                          <p className="text-xs text-white/70">
                            Subjects will appear here when:
                            <br />• Teachers are assigned to teach subjects in this class, OR
                            <br />• Marks have been entered for students in this class
                            <br /><br />
                            Please assign teachers to this class via "Assign Teacher Subjects" or enter marks.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Student Selection */}
              <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 border-2 border-white/40 rounded-xl p-5 backdrop-blur-md shadow-2xl">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b-2 border-white/30">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 backdrop-blur-sm flex items-center justify-center text-white text-xl shadow-lg border-2 border-white/50">
                    👥
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white text-shadow">Select Individual Students</h3>
                    <p className="text-sm text-white/90">Choose specific students to print their reports</p>
                  </div>
                </div>

                {/* Select All Checkbox */}
                <div className="bg-white/20 border-2 border-white/40 rounded-xl p-3 mb-4 backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="selectAll"
                      checked={selectedStudents.length === classStudents.length && classStudents.length > 0}
                      onChange={handleSelectAllStudents}
                      className="w-6 h-6 rounded border-2 border-white/50 cursor-pointer flex-shrink-0"
                      style={{ minWidth: '24px', minHeight: '24px' }}
                    />
                    <label htmlFor="selectAll" className="text-white font-bold cursor-pointer flex-1">
                      ✅ Select All Students ({classStudents.length})
                    </label>
                  </div>
                </div>

                {/* Students List */}
                <div className="max-h-60 overflow-y-auto bg-white/10 border-2 border-white/30 rounded-xl p-3 backdrop-blur-sm">
                  {classStudents.map((student, index) => (
                    <div
                      key={student.id}
                      className="flex items-center gap-3 mb-2 p-4 md:p-3 bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 transition-all cursor-pointer active:bg-white/30"
                      style={{ minHeight: '56px' }}
                      onClick={() => handleStudentSelection(student.id)}
                    >
                      <input
                        type="checkbox"
                        id={`student-${student.id}`}
                        checked={selectedStudents.includes(student.id)}
                        onChange={() => handleStudentSelection(student.id)}
                        className="w-5 h-5 rounded border-2 border-white/50 cursor-pointer flex-shrink-0"
                        style={{ minWidth: '20px', minHeight: '20px' }}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <label
                        htmlFor={`student-${student.id}`}
                        className="text-white font-medium cursor-pointer flex-1"
                      >
                        <span className="font-bold">{index + 1}.</span> {student.firstName || student.first_name} {student.lastName || student.last_name}
                        <span className="text-white/70 ml-2 text-sm">({student.idNumber || student.id_number})</span>
                      </label>
                    </div>
                  ))}
                </div>

                {/* Print Selected Button */}
                <div className="mt-4 pt-4 border-t-2 border-white/30">
                  <button
                    onClick={handlePrintSelectedStudents}
                    disabled={printing || selectedStudents.length === 0}
                    className="w-full px-6 py-4 bg-gradient-to-r from-orange-500 to-red-600 border-2 border-white/70 text-white rounded-xl hover:from-orange-600 hover:to-red-700 transition-all font-bold shadow-2xl backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ minHeight: '50px', boxShadow: selectedStudents.length > 0 ? '0 4px 20px rgba(249, 115, 22, 0.5)' : 'none' }}
                  >
                    {printing ? "⏳ Printing..." : `🖨️ Print Selected Reports (${selectedStudents.length} student${selectedStudents.length !== 1 ? 's' : ''})`}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

PrintReportModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  classes: PropTypes.array.isRequired,
  selectedClass: PropTypes.string.isRequired,
  handleClassChange: PropTypes.func.isRequired,
  printing: PropTypes.bool.isRequired,
  printClassReports: PropTypes.func.isRequired,
  classStudents: PropTypes.array.isRequired,
  selectedStudents: PropTypes.array.isRequired,
  handleSelectAllStudents: PropTypes.func.isRequired,
  handleStudentSelection: PropTypes.func.isRequired,
  printSelectedStudents: PropTypes.func.isRequired,
  printClassBroadsheet: PropTypes.func.isRequired,
  classSubjects: PropTypes.array,
  selectedSubject: PropTypes.string,
  handleSubjectChange: PropTypes.func,
  printSubjectBroadsheet: PropTypes.func,
};

export default PrintReportModal;
