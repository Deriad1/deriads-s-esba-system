import React, { useState, useEffect } from 'react';
import { getSubjects, addSubject, assignSubjectToClass, removeSubjectFromClass, assignClassRole, updateTeacher, deleteClass, updateLearner, deleteLearner, saveClass, addLearner } from '../api-client';
import MobileStudentCard from './MobileStudentCard';

const ClassManagementModal = ({ isOpen, onClose, classes, onClassAdded, allSubjects, onSubjectAdded, teachers, onAssignmentChange, learners }) => {
  const [activeTab, setActiveTab] = useState('classes'); // 'classes' or 'students'
  const [selectedClassFilter, setSelectedClassFilter] = useState(''); // For students tab
  const [newClassName, setNewClassName] = useState('');
  const [newSubjectName, setNewSubjectName] = useState('');
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedClassForAssignment, setSelectedClassForAssignment] = useState(null);
  const [selectedClassForSubjects, setSelectedClassForSubjects] = useState(null);
  const [expandedClassStudents, setExpandedClassStudents] = useState(null); // Track which class has student list expanded
  const [editingStudent, setEditingStudent] = useState(null);
  const [editFormData, setEditFormData] = useState({
    firstName: '',
    lastName: '',
    className: '',
    gender: '',
    idNumber: '',
    email: '',
    phoneNumber: ''
  });
  const [addingStudent, setAddingStudent] = useState(false);
  const [addFormData, setAddFormData] = useState({
    firstName: '',
    lastName: '',
    className: '',
    gender: '',
    idNumber: '',
    email: '',
    phoneNumber: ''
  });

  // Helper to get teacher assigned to a class
  const getAssignedTeacher = (className) => {
    const isSeniorClass = ['BS7', 'BS8', 'BS9'].includes(className);
    const roleToCheck = isSeniorClass ? 'form_master' : 'class_teacher';
    return teachers?.find(t =>
      t.all_roles?.includes(roleToCheck) && t.classes?.includes(className)
    );
  };

  // Helper to get subjects for a class
  const getClassSubjects = (className) => {
    const teachersInClass = teachers?.filter(t => t.classes?.includes(className)) || [];
    return [...new Set(teachersInClass.flatMap(t => t.subjects || []))];
  };

  const handleAddClass = async (e) => {
    e.preventDefault();
    const trimmedClassName = newClassName.trim();
    if (!trimmedClassName) {
      alert("Please enter a class name");
      return;
    }
    if (classes.includes(trimmedClassName)) {
      alert(`Class "${trimmedClassName}" already exists.`);
      return;
    }

    setIsSubmitting(true);
    try {
      // Save class to database via API
      const response = await saveClass({ name: trimmedClassName });

      if (response.status === 'success') {
        onClassAdded(trimmedClassName); // Update local state
        setNewClassName('');
        alert("Class added successfully!");
      } else {
        alert("Error adding class: " + response.message);
      }
    } catch (error) {
      console.error("Error adding class:", error);
      alert("Error adding class: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClass = async (className) => {
    // Check if class has students
    const studentsInClass = learners?.filter(s => (s.class_name || s.className) === className).length || 0;

    if (studentsInClass > 0) {
      if (!window.confirm(`⚠️ WARNING: Class ${className} has ${studentsInClass} student(s).\n\nDeleting this class will NOT delete the students, but they will need to be reassigned to another class.\n\nAre you sure you want to delete this class?`)) {
        return;
      }
    } else {
      if (!window.confirm(`Are you sure you want to delete class ${className}?`)) {
        return;
      }
    }

    setIsSubmitting(true);
    try {
      // Make direct API call bypassing offline mode to ensure immediate deletion
      const response = await fetch(`/api/classes?name=${encodeURIComponent(className)}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      if (result.status === 'success') {
        alert(`Class ${className} deleted successfully!${result.data?.studentsAffected ? ` ${result.data.studentsAffected} student(s) need to be reassigned.` : ''}`);
        onAssignmentChange(); // Reload data
      } else {
        alert("Error deleting class: " + result.message);
      }
    } catch (error) {
      console.error("Error deleting class:", error);
      alert("Error deleting class: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddSubject = async (e) => {
    e.preventDefault();
    if (!newSubjectName.trim()) {
      alert("Please enter a subject name");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await addSubject(newSubjectName.trim());
      if (response.status === 'success') {
        onSubjectAdded(newSubjectName.trim());
        setNewSubjectName('');
        alert("Subject added successfully!");
      } else {
        alert("Error adding subject: " + response.message);
      }
    } catch (error) {
      console.error("Error adding subject:", error);
      alert("Error adding subject: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAssignSubject = async (className, subject, isChecked) => {
    setIsSubmitting(true);
    try {
      if (isChecked) {
        await assignSubjectToClass(subject, className);
        alert(`Assigned ${subject} to ${className}`);
      } else {
        await removeSubjectFromClass(subject, className);
        alert(`Removed ${subject} from ${className}`);
      }
      onAssignmentChange();
    } catch (error) {
      console.error("Error toggling subject:", error);
      alert("Error: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditStudent = (student) => {
    setEditingStudent(student);
    setEditFormData({
      firstName: student.first_name || student.firstName || '',
      lastName: student.last_name || student.lastName || '',
      className: student.class_name || student.className || '',
      gender: student.gender || student.Gender || '',
      idNumber: student.id_number || student.idNumber || student.LearnerID || '',
      email: student.email || '',
      phoneNumber: student.phone_number || student.phoneNumber || student.phone || ''
    });
  };

  const handleUpdateStudent = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const updateData = {
        id: editingStudent.id,
        firstName: editFormData.firstName,
        lastName: editFormData.lastName,
        className: editFormData.className,
        gender: editFormData.gender,
        idNumber: editFormData.idNumber,
        email: editFormData.email,
        phoneNumber: editFormData.phoneNumber
      };

      const response = await updateLearner(updateData);
      if (response.status === 'success') {
        alert('Student updated successfully!');
        setEditingStudent(null);
        onAssignmentChange(); // Reload data
      } else {
        alert('Error updating student: ' + response.message);
      }
    } catch (error) {
      console.error('Error updating student:', error);
      alert('Error updating student: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteStudent = async (student) => {
    const studentName = `${student.first_name || student.firstName} ${student.last_name || student.lastName}`;
    if (!window.confirm(`Are you sure you want to delete ${studentName}? This action cannot be undone.`)) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await deleteLearner(student.id);
      if (response.status === 'success') {
        alert('Student deleted successfully!');
        onAssignmentChange(); // Reload data
      } else {
        alert('Error deleting student: ' + response.message);
      }
    } catch (error) {
      console.error('Error deleting student:', error);
      alert('Error deleting student: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await addLearner(addFormData);
      if (response.status === 'success') {
        alert('Student added successfully!');
        setAddingStudent(false);
        // Reset form
        setAddFormData({
          firstName: '',
          lastName: '',
          className: '',
          gender: '',
          idNumber: '',
          email: '',
          phoneNumber: ''
        });
        onAssignmentChange(); // Reload data
      } else {
        alert('Error adding student: ' + response.message);
      }
    } catch (error) {
      console.error('Error adding student:', error);
      alert('Error adding student: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAssignTeacher = async (className, teacherId) => {
    if (!teacherId) {
      setSelectedClassForAssignment(null);
      return;
    }

    const isSeniorClass = ['BS7', 'BS8', 'BS9'].includes(className);
    const roleToAssign = isSeniorClass ? 'form_master' : 'class_teacher';

    // Check if teacher is already assigned as Form Master/Class Teacher to another class
    const teacherToAssign = teachers.find(t => t.id === teacherId);
    if (teacherToAssign) {
      const existingFormMasterClasses = classes.filter(cls => {
        const isClsSenior = ['BS7', 'BS8', 'BS9'].includes(cls);
        const clsRoleToCheck = isClsSenior ? 'form_master' : 'class_teacher';
        const assignedTeacher = teachers.find(t =>
          t.all_roles?.includes(clsRoleToCheck) && t.classes?.includes(cls)
        );
        return assignedTeacher?.id === teacherId && cls !== className;
      });

      if (existingFormMasterClasses.length > 0) {
        alert(`${teacherToAssign.first_name} ${teacherToAssign.last_name} is already assigned as ${isSeniorClass ? 'Form Master' : 'Class Teacher'} to ${existingFormMasterClasses.join(', ')}. A teacher can only be Form Master/Class Teacher for one class at a time.`);
        setSelectedClassForAssignment(null);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      // First assign the role (this updates all_roles and classes in the database)
      await assignClassRole(teacherId, roleToAssign, className);

      // If lower class, auto-assign all subjects
      if (!isSeniorClass) {
        const teacherToUpdate = teachers.find(t => t.id === teacherId);
        if (teacherToUpdate) {
          const subjectsForLevel = allSubjects.filter(s => !['History', 'French', 'Arabic'].includes(s));

          // Build updated roles - preserve existing roles and add subject_teacher if subjects are being assigned
          const currentRoles = teacherToUpdate.all_roles || [];
          const updatedRoles = [...new Set([...currentRoles, roleToAssign])];

          // If we're assigning subjects, ensure subject_teacher role is included
          if (subjectsForLevel.length > 0 && !updatedRoles.includes('subject_teacher')) {
            updatedRoles.push('subject_teacher');
          }

          const updatedTeacher = {
            id: teacherToUpdate.id,
            firstName: teacherToUpdate.first_name,
            lastName: teacherToUpdate.last_name,
            email: teacherToUpdate.email,
            gender: teacherToUpdate.gender || 'male',
            subjects: [...new Set([...(teacherToUpdate.subjects || []), ...subjectsForLevel])],
            classes: [...new Set([...(teacherToUpdate.classes || []), className])],
            primaryRole: roleToAssign, // Keep the assigned role as primary
            all_roles: updatedRoles // Include both roles
          };
          await updateTeacher(updatedTeacher);
          alert(`${teacherToUpdate.first_name} assigned to ${className} as ${isSeniorClass ? 'Form Master' : 'Class Teacher'} with all relevant subjects`);
        }
      } else {
        alert(`${isSeniorClass ? 'Form Master' : 'Class Teacher'} assigned successfully`);
      }

      setSelectedClassForAssignment(null);
      onAssignmentChange();
    } catch (error) {
      console.error("Error assigning teacher:", error);
      alert("Error: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-2 sm:p-4">
        <div className="glass-card-golden rounded-lg p-4 sm:p-6 w-full max-w-full sm:max-w-6xl my-4 sm:my-8 max-h-[95vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg sm:text-2xl font-bold text-white">Manage Classes & Students</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Close"
            >
              &times;
            </button>
          </div>

          {/* Tab Switcher - Mobile Optimized */}
          <div className="flex gap-1 sm:gap-2 mb-4 sm:mb-6 border-b border-gray-200 overflow-x-auto">
            <button
              onClick={() => setActiveTab('classes')}
              className={`px-4 sm:px-6 py-3 font-semibold transition-all whitespace-nowrap text-sm sm:text-base min-h-[44px] ${
                activeTab === 'classes'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-white/70 hover:text-white/90'
              }`}
            >
              📚 <span className="hidden sm:inline">Manage </span>Classes
            </button>
            <button
              onClick={() => setActiveTab('students')}
              className={`px-4 sm:px-6 py-3 font-semibold transition-all whitespace-nowrap text-sm sm:text-base min-h-[44px] ${
                activeTab === 'students'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-white/70 hover:text-white/90'
              }`}
            >
              🎓 <span className="hidden sm:inline">View </span>Students
            </button>
          </div>

          {/* Classes Tab Content */}
          {activeTab === 'classes' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
            {/* Add Class Form - Mobile Optimized */}
            <div className="glass rounded-lg p-3 sm:p-4">
              <h3 className="text-base sm:text-lg font-medium text-white mb-2 sm:mb-3">Add New Class</h3>
              <form onSubmit={handleAddClass} className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  placeholder="e.g., BS1, BS7"
                  className="glass-input flex-1 px-3 py-3 rounded-md text-base"
                  style={{ minHeight: '44px' }}
                />
                <button
                  type="submit"
                  className="glass-button-primary text-white px-6 py-3 rounded-md whitespace-nowrap font-medium"
                  style={{ minHeight: '44px', minWidth: '100px' }}
                >
                  Add Class
                </button>
              </form>
            </div>

            {/* Add Subject Form - Mobile Optimized */}
            <div className="glass rounded-lg p-3 sm:p-4">
              <h3 className="text-base sm:text-lg font-medium text-white mb-2 sm:mb-3">Add New Subject</h3>
              <form onSubmit={handleAddSubject} className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                  placeholder="e.g., History"
                  className="glass-input flex-1 px-3 py-3 rounded-md text-base"
                  disabled={isSubmitting}
                  style={{ minHeight: '44px' }}
                />
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="glass-button-primary text-white px-6 py-3 rounded-md disabled:opacity-50 whitespace-nowrap font-medium"
                  style={{ minHeight: '44px', minWidth: '100px' }}
                >
                  {isSubmitting ? 'Adding...' : 'Add Subject'}
                </button>
              </form>
            </div>
          </div>

          {/* All Subjects List */}
          <div className="glass rounded-lg p-4 mb-6">
            <h3 className="text-lg font-medium text-white mb-3">All Available Subjects ({allSubjects?.length || 0})</h3>
            <div className="max-h-40 overflow-y-auto">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {allSubjects?.map((subject, index) => (
                  <div key={index} className="flex items-center justify-between p-2 glass rounded text-sm">
                    <span className="text-white">{subject}</span>
                  </div>
                ))}
              </div>
              {(!allSubjects || allSubjects.length === 0) && (
                <p className="text-white/70 text-sm text-center py-4">No subjects added yet. Add a subject above.</p>
              )}
            </div>
          </div>

          {/* Classes Grid - Cards Layout - Mobile Optimized */}
          <div>
            <h3 className="text-base sm:text-lg font-medium text-white mb-3 sm:mb-4">Classes ({classes.length})</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 max-h-[400px] sm:max-h-[500px] overflow-y-auto">
              {classes.map((className, index) => {
                const isSeniorClass = ['BS7', 'BS8', 'BS9'].includes(className);
                const assignedTeacher = getAssignedTeacher(className);
                const classSubjects = getClassSubjects(className);
                const studentCount = learners?.filter(s => (s.class_name || s.className) === className).length || 0;

                return (
                  <div key={index} className="glass rounded-lg p-3 sm:p-4 hover:shadow-lg transition-shadow cursor-pointer active:bg-white/20" onClick={() => {
                    // Toggle the student list for this class
                    setExpandedClassStudents(expandedClassStudents === className ? null : className);
                  }}>
                    {/* Class Header - Mobile Optimized */}
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="text-lg sm:text-xl font-bold text-white">{className}</h4>
                        <span className="text-xs text-white/80 bg-white/20 px-2 py-1 rounded-full mt-1 inline-block">
                          {isSeniorClass ? 'JHS' : 'Lower Primary'}
                        </span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClass(className);
                        }}
                        className="text-red-500 hover:text-red-700 text-lg sm:text-xl min-w-[44px] min-h-[44px] flex items-center justify-center"
                        title="Delete class"
                        aria-label="Delete class"
                      >
                        🗑️
                      </button>
                    </div>

                    {/* Student Count - Clickable to expand student list */}
                    <div className="mb-3 flex items-center gap-2 text-sm">
                      <span className="text-2xl">👥</span>
                      <span className="font-bold text-white">{studentCount} Student{studentCount !== 1 ? 's' : ''}</span>
                      {studentCount > 0 && (
                        <span className="text-white/70 text-xs ml-auto">
                          {expandedClassStudents === className ? '▼' : '▶'} {expandedClassStudents === className ? 'Hide' : 'Show'} students
                        </span>
                      )}
                    </div>

                    {/* Student Names List - Only show when class is expanded */}
                    {studentCount > 0 && expandedClassStudents === className && (
                      <div className="mb-3 pb-3 border-b border-white/20">
                        <div className="text-xs font-bold text-white/90 mb-2">Students:</div>
                        <div className="max-h-32 overflow-y-auto bg-white/5 rounded-lg p-2 space-y-1">
                          {learners
                            ?.filter(s => (s.class_name || s.className) === className)
                            .map((student, idx) => (
                              <div key={student.id || idx} className="flex items-center gap-2 text-xs text-white/90 hover:bg-white/10 rounded px-2 py-1 transition-colors">
                                <span className="font-bold text-white/70">#{idx + 1}</span>
                                <span className="font-medium">
                                  {student.first_name || student.firstName} {student.last_name || student.lastName}
                                </span>
                                <span className="text-white/60 text-[10px] ml-auto">
                                  ({student.id_number || student.idNumber || 'N/A'})
                                </span>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Subjects */}
                    <div>
                      <div className="text-xs font-bold text-white mb-2">
                        Subjects ({classSubjects.length})
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {classSubjects.map((subject) => (
                          <span key={subject} className="text-xs bg-blue-500/30 border border-blue-400/50 text-white font-semibold px-2 py-1 rounded-full backdrop-blur-sm">
                            {subject}
                          </span>
                        ))}
                        {classSubjects.length === 0 && (
                          <span className="text-xs text-white/80 italic font-medium">No subjects assigned</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
            </>
          )}

          {/* Students Tab Content */}
          {activeTab === 'students' && (
            <>
              {/* Header with Class Filter and Add Button */}
              <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                {/* Class Filter */}
                <div className="flex-1 w-full sm:w-auto">
                  <label className="block text-sm font-medium text-white/90 mb-2">Filter by Class</label>
                  <select
                    value={selectedClassFilter}
                    onChange={(e) => setSelectedClassFilter(e.target.value)}
                    className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-medium transition-all md:w-64"
                    style={{ minHeight: '44px', fontSize: '16px' }}
                  >
                    <option value="" className="bg-white text-gray-900">All Students ({learners?.length || 0})</option>
                    {classes.map(className => {
                      const count = learners?.filter(s => (s.class_name || s.className) === className).length || 0;
                      return (
                        <option key={className} value={className} className="bg-white text-gray-900">
                          {className} ({count} students)
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Add Student Button */}
                <div className="w-full sm:w-auto">
                  <button
                    onClick={() => setAddingStudent(true)}
                    className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 border-2 border-white/70 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all font-bold shadow-2xl backdrop-blur-sm active:scale-95"
                    style={{ minHeight: '44px', boxShadow: '0 4px 20px rgba(34, 197, 94, 0.4)' }}
                  >
                    ➕ Add New Student
                  </button>
                </div>
              </div>

              {/* Mobile Card View - Only on small screens with scrolling */}
              <div className="md:hidden max-h-[60vh] overflow-y-auto space-y-2 pr-2 scroll-smooth" style={{ scrollbarWidth: 'thin' }}>
                {(selectedClassFilter
                  ? learners?.filter(s => (s.class_name || s.className) === selectedClassFilter)
                  : learners || []
                ).map((student, index) => (
                  <MobileStudentCard
                    key={student.id || student.idNumber || index}
                    student={student}
                    index={index}
                    onEdit={handleEditStudent}
                    onDelete={handleDeleteStudent}
                    isSubmitting={isSubmitting}
                  />
                ))}
              </div>

              {/* Desktop Table View - Hidden on mobile */}
              <div className="hidden md:block glass-card-golden rounded-xl overflow-hidden border-2 border-white/30 shadow-2xl">
                <div className="overflow-x-auto max-h-[60vh] overflow-y-auto scroll-smooth" style={{ scrollbarWidth: 'thin' }}>
                  <table className="min-w-full divide-y divide-white/20">
                    <thead className="bg-white/20 sticky top-0 z-10 backdrop-blur-md">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">#</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Student ID</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Full Name</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Class</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Gender</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Guardian Contact</th>
                        <th className="px-6 py-3 text-right text-xs font-bold text-white uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white/5 divide-y divide-white/10">
                      {(selectedClassFilter
                        ? learners?.filter(s => (s.class_name || s.className) === selectedClassFilter)
                        : learners || []
                      ).map((student, index) => (
                        <tr key={student.id || student.idNumber || index} className="hover:bg-white/10 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-bold">
                            {index + 1}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-bold text-white">
                              {student.id_number || student.idNumber || student.LearnerID || 'N/A'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <div className="h-10 w-10 rounded-full bg-yellow-500/90 border-2 border-white/50 flex items-center justify-center text-white font-bold shadow-md">
                                  {(student.first_name || student.firstName || '?')[0].toUpperCase()}
                                  {(student.last_name || student.lastName || '?')[0].toUpperCase()}
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-bold text-white">
                                  {student.first_name || student.firstName} {student.last_name || student.lastName}
                                </div>
                                <div className="text-sm text-white/80 font-medium">
                                  {student.email || 'No email'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-3 inline-flex text-xs leading-5 font-bold rounded-full bg-blue-500/30 border border-blue-400/50 text-white backdrop-blur-sm">
                              {student.class_name || student.className || 'N/A'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-3 inline-flex text-xs leading-5 font-bold rounded-full backdrop-blur-sm ${
                              (student.gender || student.Gender || '').toLowerCase() === 'male'
                                ? 'bg-blue-500/30 border border-blue-400/50 text-white'
                                : (student.gender || student.Gender || '').toLowerCase() === 'female'
                                ? 'bg-pink-500/30 border border-pink-400/50 text-white'
                                : 'bg-gray-500/30 border border-gray-400/50 text-white'
                            }`}>
                              {student.gender || student.Gender || 'N/A'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-white font-bold">
                            <div className="flex flex-col gap-1">
                              {student.phone_number || student.phoneNumber || student.phone ? (
                                <div className="flex items-center gap-2">
                                  <span>📱</span>
                                  <span>{student.phone_number || student.phoneNumber || student.phone}</span>
                                </div>
                              ) : null}
                              {student.email ? (
                                <div className="flex items-center gap-2 text-xs">
                                  <span>✉️</span>
                                  <span className="truncate max-w-[150px]" title={student.email}>{student.email}</span>
                                </div>
                              ) : null}
                              {!student.phone_number && !student.phoneNumber && !student.phone && !student.email && (
                                <span className="text-white/50">N/A</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => handleEditStudent(student)}
                                disabled={isSubmitting}
                                className="bg-blue-500/90 hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold border-2 border-white/50 shadow-md transition-all disabled:opacity-50"
                                style={{ minHeight: '32px' }}
                              >
                                ✏️ Edit
                              </button>
                              <button
                                onClick={() => handleDeleteStudent(student)}
                                disabled={isSubmitting}
                                className="bg-red-500/90 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold border-2 border-white/50 shadow-md transition-all disabled:opacity-50"
                                style={{ minHeight: '32px' }}
                              >
                                🗑️ Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Empty State */}
                {(!learners || learners.length === 0 || (selectedClassFilter && learners.filter(s => (s.class_name || s.className) === selectedClassFilter).length === 0)) && (
                  <div className="text-center py-12">
                    <span className="text-6xl mb-4 block">🎓</span>
                    <h3 className="text-xl font-bold text-white mb-2">No Students Found</h3>
                    <p className="text-white/80">
                      {selectedClassFilter
                        ? `No students found in ${selectedClassFilter}`
                        : 'No students have been added to the system yet'
                      }
                    </p>
                  </div>
                )}
              </div>

              {/* Summary Stats */}
              {learners && learners.length > 0 && (
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="glass rounded-xl p-4 text-center border-2 border-white/30">
                    <div className="text-3xl font-bold text-white">
                      {selectedClassFilter
                        ? learners.filter(s => (s.class_name || s.className) === selectedClassFilter).length
                        : learners.length
                      }
                    </div>
                    <div className="text-sm text-white font-semibold mt-1">Total Students</div>
                  </div>
                  <div className="glass rounded-xl p-4 text-center border-2 border-blue-400/50">
                    <div className="text-3xl font-bold text-white">
                      {selectedClassFilter
                        ? learners.filter(s => (s.class_name || s.className) === selectedClassFilter && (s.gender || s.Gender || '').toLowerCase() === 'male').length
                        : learners.filter(s => (s.gender || s.Gender || '').toLowerCase() === 'male').length
                      }
                    </div>
                    <div className="text-sm text-white font-semibold mt-1">Male</div>
                  </div>
                  <div className="glass rounded-xl p-4 text-center border-2 border-pink-400/50">
                    <div className="text-3xl font-bold text-white">
                      {selectedClassFilter
                        ? learners.filter(s => (s.class_name || s.className) === selectedClassFilter && (s.gender || s.Gender || '').toLowerCase() === 'female').length
                        : learners.filter(s => (s.gender || s.Gender || '').toLowerCase() === 'female').length
                      }
                    </div>
                    <div className="text-sm text-white font-semibold mt-1">Female</div>
                  </div>
                </div>
              )}
            </>
          )}

          <div className="flex justify-end mt-6">
            <button
              onClick={onClose}
              className="glass-button px-4 py-2 rounded-md"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Nested Modal: Class Subjects Details */}
      {selectedClassForSubjects && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] overflow-y-auto flex items-center justify-center p-4">
          <div className="glass-card-golden rounded-xl p-6 w-full max-w-4xl my-8 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-2xl font-bold text-white">{selectedClassForSubjects} - Subject Management</h3>
                <p className="text-sm text-white/90 mt-1">Assign or remove subjects for this class</p>
              </div>
              <button
                onClick={() => setSelectedClassForSubjects(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                &times;
              </button>
            </div>

            {/* Subjects Grid with Checkboxes */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {allSubjects?.map((subject, index) => {
                const classSubjects = getClassSubjects(selectedClassForSubjects);
                const isAssigned = classSubjects.includes(subject);

                return (
                  <div
                    key={index}
                    className={`glass rounded-lg p-4 transition-all ${
                      isAssigned ? 'bg-blue-50/50 border-2 border-blue-300' : 'border-2 border-transparent'
                    }`}
                  >
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isAssigned}
                        onChange={(e) => handleAssignSubject(selectedClassForSubjects, subject, e.target.checked)}
                        disabled={isSubmitting}
                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50"
                      />
                      <span className="ml-3 text-sm font-medium text-white">{subject}</span>
                    </label>
                    {isAssigned && (
                      <div className="mt-2 text-xs text-blue-700 flex items-center">
                        <span className="mr-1">✓</span>
                        <span>Assigned</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {(!allSubjects || allSubjects.length === 0) && (
              <div className="text-center py-8">
                <p className="text-white/70">No subjects available. Add subjects first.</p>
              </div>
            )}

            {/* Summary */}
            <div className="mt-6 p-4 glass rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-white/90">
                  Assigned Subjects:
                </span>
                <span className="text-lg font-bold text-blue-600">
                  {getClassSubjects(selectedClassForSubjects).length} / {allSubjects?.length || 0}
                </span>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setSelectedClassForSubjects(null)}
                className="glass-button-primary text-white px-6 py-2 rounded-md"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Nested Modal: Add Student */}
      {addingStudent && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] overflow-y-auto flex items-center justify-center p-4">
          <div className="glass-card-golden rounded-xl p-6 w-full max-w-2xl my-8 max-h-[90vh] overflow-y-auto scroll-smooth shadow-2xl" style={{ scrollbarWidth: 'thin' }}>
            <div className="flex justify-between items-center mb-6 pb-4 border-b-4 border-green-500/50">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-green-500/90 backdrop-blur-sm flex items-center justify-center text-2xl shadow-lg border-2 border-white/50">
                  ➕
                </div>
                <h3 className="text-2xl font-bold text-white text-shadow">Add New Student</h3>
              </div>
              <button
                onClick={() => setAddingStudent(false)}
                className="text-white hover:text-white/80 text-2xl font-bold p-2 hover:bg-white/20 rounded-xl transition-colors"
                style={{ minWidth: '44px', minHeight: '44px' }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAddStudent} className="space-y-4">
              {/* Name Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-white mb-2">
                    First Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={addFormData.firstName}
                    onChange={(e) => setAddFormData({ ...addFormData, firstName: e.target.value })}
                    required
                    className="w-full px-4 py-3 bg-white/20 border-2 border-white/30 rounded-xl text-white placeholder-white/60 focus:ring-2 focus:ring-green-500 focus:border-green-500 backdrop-blur-md font-medium"
                    style={{ minHeight: '44px', fontSize: '16px' }}
                    placeholder="Enter first name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-white mb-2">
                    Last Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={addFormData.lastName}
                    onChange={(e) => setAddFormData({ ...addFormData, lastName: e.target.value })}
                    required
                    className="w-full px-4 py-3 bg-white/20 border-2 border-white/30 rounded-xl text-white placeholder-white/60 focus:ring-2 focus:ring-green-500 focus:border-green-500 backdrop-blur-md font-medium"
                    style={{ minHeight: '44px', fontSize: '16px' }}
                    placeholder="Enter last name"
                  />
                </div>
              </div>

              {/* Class and Gender */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-white mb-2">
                    Class <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={addFormData.className}
                    onChange={(e) => setAddFormData({ ...addFormData, className: e.target.value })}
                    required
                    className="w-full px-4 py-3 bg-white/20 border-2 border-white/30 rounded-xl text-white focus:ring-2 focus:ring-green-500 focus:border-green-500 backdrop-blur-md font-medium"
                    style={{ minHeight: '44px', fontSize: '16px' }}
                  >
                    <option value="">Select Class</option>
                    {classes.map(className => (
                      <option key={className} value={className} className="bg-gray-800">
                        {className}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-white mb-2">
                    Gender <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={addFormData.gender}
                    onChange={(e) => setAddFormData({ ...addFormData, gender: e.target.value })}
                    required
                    className="w-full px-4 py-3 bg-white/20 border-2 border-white/30 rounded-xl text-white focus:ring-2 focus:ring-green-500 focus:border-green-500 backdrop-blur-md font-medium"
                    style={{ minHeight: '44px', fontSize: '16px' }}
                  >
                    <option value="">Select Gender</option>
                    <option value="male" className="bg-gray-800">Male</option>
                    <option value="female" className="bg-gray-800">Female</option>
                  </select>
                </div>
              </div>

              {/* ID Number */}
              <div>
                <label className="block text-sm font-bold text-white mb-2">
                  Student ID Number
                </label>
                <input
                  type="text"
                  value={addFormData.idNumber}
                  onChange={(e) => setAddFormData({ ...addFormData, idNumber: e.target.value })}
                  className="w-full px-4 py-3 bg-white/20 border-2 border-white/30 rounded-xl text-white placeholder-white/60 focus:ring-2 focus:ring-green-500 focus:border-green-500 backdrop-blur-md font-medium"
                  style={{ minHeight: '44px', fontSize: '16px' }}
                  placeholder="Enter student ID (optional)"
                />
              </div>

              {/* Guardian/Parent Contact Information */}
              <div className="bg-blue-500/20 border-2 border-blue-500/50 rounded-xl p-4 mb-2">
                <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <span>👨‍👩‍👧</span>
                  Guardian/Parent Contact Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-white mb-2">
                      Guardian Email Address
                    </label>
                    <input
                      type="email"
                      value={addFormData.email}
                      onChange={(e) => setAddFormData({ ...addFormData, email: e.target.value })}
                      className="w-full px-4 py-3 bg-white/20 border-2 border-white/30 rounded-xl text-white placeholder-white/60 focus:ring-2 focus:ring-green-500 focus:border-green-500 backdrop-blur-md font-medium"
                      style={{ minHeight: '44px', fontSize: '16px' }}
                      placeholder="parent@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-white mb-2">
                      Guardian Phone Number
                    </label>
                    <input
                      type="tel"
                      value={addFormData.phoneNumber}
                      onChange={(e) => setAddFormData({ ...addFormData, phoneNumber: e.target.value })}
                      className="w-full px-4 py-3 bg-white/20 border-2 border-white/30 rounded-xl text-white placeholder-white/60 focus:ring-2 focus:ring-green-500 focus:border-green-500 backdrop-blur-md font-medium"
                      style={{ minHeight: '44px', fontSize: '16px' }}
                      placeholder="0XX XXX XXXX"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t-2 border-white/30">
                <button
                  type="button"
                  onClick={() => setAddingStudent(false)}
                  disabled={isSubmitting}
                  className="px-6 py-3 bg-white/20 border-2 border-white/30 hover:bg-white/30 text-white rounded-xl font-semibold transition-all backdrop-blur-md disabled:opacity-50"
                  style={{ minHeight: '44px', minWidth: '100px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-3 bg-green-500/90 border-2 border-white/50 hover:bg-green-600 text-white rounded-xl font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  style={{ minHeight: '44px', minWidth: '120px' }}
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center">
                      <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Adding...
                    </span>
                  ) : (
                    '➕ Add Student'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Nested Modal: Edit Student */}
      {editingStudent && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] overflow-y-auto flex items-center justify-center p-4">
          <div className="glass-card-golden rounded-xl p-6 w-full max-w-2xl my-8 max-h-[90vh] overflow-y-auto scroll-smooth shadow-2xl" style={{ scrollbarWidth: 'thin' }}>
            <div className="flex justify-between items-center mb-6 pb-4 border-b-4 border-yellow-500/50">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-yellow-500/90 backdrop-blur-sm flex items-center justify-center text-2xl shadow-lg border-2 border-white/50">
                  ✏️
                </div>
                <h3 className="text-2xl font-bold text-white text-shadow">Edit Student</h3>
              </div>
              <button
                onClick={() => setEditingStudent(null)}
                className="text-white hover:text-white/80 text-2xl font-bold p-2 hover:bg-white/20 rounded-xl transition-colors"
                style={{ minWidth: '44px', minHeight: '44px' }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleUpdateStudent} className="space-y-4">
              {/* Name Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-white mb-2">
                    First Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={editFormData.firstName}
                    onChange={(e) => setEditFormData({ ...editFormData, firstName: e.target.value })}
                    required
                    className="w-full px-4 py-3 bg-white/20 border-2 border-white/30 rounded-xl text-white placeholder-white/60 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 backdrop-blur-md font-medium"
                    style={{ minHeight: '44px', fontSize: '16px' }}
                    placeholder="Enter first name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-white mb-2">
                    Last Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={editFormData.lastName}
                    onChange={(e) => setEditFormData({ ...editFormData, lastName: e.target.value })}
                    required
                    className="w-full px-4 py-3 bg-white/20 border-2 border-white/30 rounded-xl text-white placeholder-white/60 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 backdrop-blur-md font-medium"
                    style={{ minHeight: '44px', fontSize: '16px' }}
                    placeholder="Enter last name"
                  />
                </div>
              </div>

              {/* Class and Gender */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-white mb-2">
                    Class <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={editFormData.className}
                    onChange={(e) => setEditFormData({ ...editFormData, className: e.target.value })}
                    required
                    className="w-full px-4 py-3 bg-white/20 border-2 border-white/30 rounded-xl text-white focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 backdrop-blur-md font-medium"
                    style={{ minHeight: '44px', fontSize: '16px' }}
                  >
                    <option value="">Select Class</option>
                    {classes.map(className => (
                      <option key={className} value={className} className="bg-gray-800">
                        {className}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-white mb-2">
                    Gender <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={editFormData.gender}
                    onChange={(e) => setEditFormData({ ...editFormData, gender: e.target.value })}
                    required
                    className="w-full px-4 py-3 bg-white/20 border-2 border-white/30 rounded-xl text-white focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 backdrop-blur-md font-medium"
                    style={{ minHeight: '44px', fontSize: '16px' }}
                  >
                    <option value="">Select Gender</option>
                    <option value="male" className="bg-gray-800">Male</option>
                    <option value="female" className="bg-gray-800">Female</option>
                  </select>
                </div>
              </div>

              {/* ID Number */}
              <div>
                <label className="block text-sm font-bold text-white mb-2">
                  Student ID Number
                </label>
                <input
                  type="text"
                  value={editFormData.idNumber}
                  onChange={(e) => setEditFormData({ ...editFormData, idNumber: e.target.value })}
                  className="w-full px-4 py-3 bg-white/20 border-2 border-white/30 rounded-xl text-white placeholder-white/60 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 backdrop-blur-md font-medium"
                  style={{ minHeight: '44px', fontSize: '16px' }}
                  placeholder="Enter student ID (optional)"
                />
              </div>

              {/* Guardian/Parent Contact Information */}
              <div className="bg-blue-500/20 border-2 border-blue-500/50 rounded-xl p-4 mb-2">
                <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <span>👨‍👩‍👧</span>
                  Guardian/Parent Contact Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-white mb-2">
                      Guardian Email Address
                    </label>
                    <input
                      type="email"
                      value={editFormData.email}
                      onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                      className="w-full px-4 py-3 bg-white/20 border-2 border-white/30 rounded-xl text-white placeholder-white/60 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 backdrop-blur-md font-medium"
                      style={{ minHeight: '44px', fontSize: '16px' }}
                      placeholder="parent@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-white mb-2">
                      Guardian Phone Number
                    </label>
                    <input
                      type="tel"
                      value={editFormData.phoneNumber}
                      onChange={(e) => setEditFormData({ ...editFormData, phoneNumber: e.target.value })}
                      className="w-full px-4 py-3 bg-white/20 border-2 border-white/30 rounded-xl text-white placeholder-white/60 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 backdrop-blur-md font-medium"
                      style={{ minHeight: '44px', fontSize: '16px' }}
                      placeholder="0XX XXX XXXX"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t-2 border-white/30">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  disabled={isSubmitting}
                  className="px-6 py-3 bg-white/20 border-2 border-white/30 hover:bg-white/30 text-white rounded-xl font-semibold transition-all backdrop-blur-md disabled:opacity-50"
                  style={{ minHeight: '44px', minWidth: '100px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-3 bg-yellow-500/90 border-2 border-white/50 hover:bg-yellow-600 text-white rounded-xl font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  style={{ minHeight: '44px', minWidth: '120px' }}
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center">
                      <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </span>
                  ) : (
                    '💾 Save Changes'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassManagementModal;