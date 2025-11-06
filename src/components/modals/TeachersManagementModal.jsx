import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { addTeacher, deleteTeacher } from '../../api-client';
import { useNotification } from '../../context/NotificationContext';
import { validateRoleAssignment } from '../../utils/teacherRoleValidation';
import MobileTeacherCard from '../MobileTeacherCard';

// Placeholder for resetTeacherPassword until API endpoint is implemented
const resetTeacherPassword = async (teacherId) => {
  console.warn('resetTeacherPassword: API endpoint not yet implemented');
  // Return mock response for now
  return {
    status: 'success',
    temporaryPassword: 'TEMP' + Math.random().toString(36).substr(2, 6).toUpperCase()
  };
};

const DEFAULT_CLASSES = [
  "KG1", "KG2", "BS1", "BS2", "BS3", "BS4", "BS5", "BS6", "BS7", "BS8", "BS9"
];

const TeachersManagementModal = ({ isOpen, onClose, teachers, loadData, onEditTeacher }) => {
  const { showNotification } = useNotification();
  const [showAddTeacherForm, setShowAddTeacherForm] = useState(false);
  const [newTeacher, setNewTeacher] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    gender: 'male',
    primaryRole: 'subject_teacher',
    allRoles: ['subject_teacher'],
    classAssigned: '', // For form masters - the one class they manage
    teachingLevel: 'PRIMARY'
  });
  const [selectedTeacherIds, setSelectedTeacherIds] = useState([]);
  const [teacherFilters, setTeacherFilters] = useState({
    search: '',
    subject: '',
    class: ''
  });
  const [resetPasswordModal, setResetPasswordModal] = useState(null);

  const handleResetPassword = async (teacher) => {
    try {
      const result = await resetTeacherPassword(teacher.id);
      if (result.status === 'success') {
        setResetPasswordModal({
          teacher: teacher,
          temporaryPassword: result.temporaryPassword
        });
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      showNotification({
        type: 'error',
        title: 'Reset Failed',
        message: `Error resetting password: ${error.message}`
      });
    }
  };

  const closeResetPasswordModal = () => {
    setResetPasswordModal(null);
  };

  const handleTeacherFormSubmit = async (e) => {
    e.preventDefault();

    // Ensure allRoles always contains the primaryRole (since we removed Additional Roles)
    const allRoles = [newTeacher.primaryRole];

    // Use centralized validation
    const validation = validateRoleAssignment({
      primaryRole: newTeacher.primaryRole,
      allRoles: allRoles,
      classAssigned: newTeacher.classAssigned,
      teachingLevel: newTeacher.teachingLevel
    });

    if (!validation.valid) {
      showNotification({
        type: 'error',
        title: 'Validation Error',
        message: validation.error
      });
      return;
    }

    try {
      const teacherData = {
        firstName: newTeacher.firstName,
        lastName: newTeacher.lastName,
        email: newTeacher.email,
        password: newTeacher.password,
        gender: newTeacher.gender,
        primaryRole: newTeacher.primaryRole,
        allRoles: allRoles,
        classAssigned: newTeacher.classAssigned || null,
        teachingLevel: newTeacher.teachingLevel
      };

      await addTeacher(teacherData);
      showNotification({
        type: 'success',
        title: 'Success',
        message: 'Teacher added successfully!'
      });
      setShowAddTeacherForm(false);
      setNewTeacher({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        gender: 'male',
        primaryRole: 'subject_teacher',
        allRoles: ['subject_teacher'],
        classAssigned: '',
        teachingLevel: 'PRIMARY'
      });
      loadData();
    } catch (error) {
      console.error("Error adding teacher:", error);
      showNotification({
        type: 'error',
        title: 'Add Failed',
        message: `Error adding teacher: ${error.message}`
      });
    }
  };

  const handlePrimaryRoleChange = (role) => {
    setNewTeacher(prev => ({
      ...prev,
      primaryRole: role,
      allRoles: prev?.allRoles || ['subject_teacher']
    }));
  };

  const handleDeleteTeacher = async (teacherId) => {
    try {
      await deleteTeacher(teacherId);
      loadData();
      showNotification({
        type: 'success',
        title: 'Success',
        message: 'Teacher deleted successfully!'
      });
    } catch (error) {
      console.error("Error deleting teacher:", error);
      showNotification({
        type: 'error',
        title: 'Delete Failed',
        message: `Error deleting teacher: ${error.message}`
      });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedTeacherIds.length === 0) {
      showNotification({
        type: 'warning',
        title: 'Selection Required',
        message: 'Please select teachers to delete.'
      });
      return;
    }

    try {
      await Promise.all(selectedTeacherIds.map(id => deleteTeacher(id)));
      loadData();
      setSelectedTeacherIds([]);
      showNotification({
        type: 'success',
        title: 'Success',
        message: 'Selected teachers deleted successfully!'
      });
    } catch (error) {
      console.error("Error bulk deleting teachers:", error);
      showNotification({
        type: 'error',
        title: 'Delete Failed',
        message: `Error deleting teachers: ${error.message}`
      });
    }
  };

  const handleSelectTeacher = (teacherId) => {
    setSelectedTeacherIds(prev =>
      prev.includes(teacherId)
        ? prev.filter(id => id !== teacherId)
        : [...prev, teacherId]
    );
  };

  const handleSelectAll = (e) => {
    setSelectedTeacherIds(e.target.checked ? teachers.map(t => t.id) : []);
  };

  const filteredTeachers = useMemo(() => {
    return teachers.filter(teacher => {
      const searchLower = teacherFilters.search.toLowerCase();
      const matchesSearch = !searchLower ||
        teacher.first_name?.toLowerCase().includes(searchLower) ||
        teacher.last_name?.toLowerCase().includes(searchLower) ||
        teacher.email?.toLowerCase().includes(searchLower);
      const matchesSubject = !teacherFilters.subject ||
        teacher.subjects?.includes(teacherFilters.subject);
      const matchesClass = !teacherFilters.class ||
        teacher.classes?.includes(teacherFilters.class);
      return matchesSearch && matchesSubject && matchesClass;
    });
  }, [teachers, teacherFilters]);

  const uniqueSubjects = useMemo(() => {
    const allSubjects = new Set();
    teachers.forEach(t => t.subjects?.forEach(s => allSubjects.add(s)));
    return [...allSubjects].sort();
  }, [teachers]);

  const uniqueClasses = useMemo(() => {
    const allClasses = new Set();
    teachers.forEach(t => t.classes?.forEach(c => allClasses.add(c)));
    return [...allClasses].sort();
  }, [teachers]);

  const handleFilterChange = (filterName, value) => {
    setTeacherFilters(prev => ({ ...prev, [filterName]: value }));
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    showNotification({
      type: 'success',
      title: 'Copied',
      message: 'Password copied to clipboard!'
    });
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] overflow-y-auto flex items-start sm:items-center justify-center p-4"
        style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}
      >
        <div
          className="glass-card-golden rounded-xl p-4 sm:p-6 w-full max-w-full sm:max-w-6xl my-8 border-2 border-white/30 shadow-2xl max-h-[90vh] overflow-y-auto"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
        <div className="flex justify-between items-center mb-6 pb-4 border-b-4 border-yellow-500/50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/90 to-indigo-600/90 backdrop-blur-sm flex items-center justify-center text-white text-2xl shadow-lg border-2 border-white/50">
              👩‍🏫
            </div>
            <div>
              <h2 className="text-lg sm:text-2xl font-bold text-white text-shadow">Teachers Management</h2>
              <p className="text-sm text-white/90">Manage teacher accounts and assignments</p>
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

          <div className="mb-6 flex flex-col sm:flex-row sm:flex-wrap justify-between items-stretch sm:items-center gap-3">
            <button
              onClick={() => {
                setShowAddTeacherForm(!showAddTeacherForm);
                setNewTeacher({ firstName: '', lastName: '', email: '', password: '', gender: 'male' });
              }}
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-blue-600 border-2 border-white/70 text-white rounded-xl hover:from-green-600 hover:to-blue-700 transition-all font-bold shadow-2xl backdrop-blur-sm"
              style={{ minHeight: '44px', boxShadow: '0 4px 20px rgba(34, 197, 94, 0.4)' }}
            >
              {showAddTeacherForm ? '❌ Cancel' : '➕ Add New Teacher'}
            </button>
            {selectedTeacherIds.length > 0 && (
              <button
                onClick={handleBulkDelete}
                className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 border-2 border-white/70 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all font-bold shadow-2xl backdrop-blur-sm"
                style={{ minHeight: '44px', boxShadow: '0 4px 20px rgba(239, 68, 68, 0.4)' }}
              >
                🗑️ Delete Selected ({selectedTeacherIds.length})
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="mb-4 bg-white/10 border-2 border-white/30 rounded-xl p-3 sm:p-4 backdrop-blur-md shadow-lg">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500/90 to-pink-600/90 backdrop-blur-sm flex items-center justify-center text-white text-lg shadow-md border-2 border-white/50">
                🔍
              </div>
              <h3 className="text-base font-bold text-white">Filter Teachers</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <input
                type="text"
                value={teacherFilters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="Search by name or email..."
                className="w-full px-4 py-3 bg-white/20 border-2 border-white/30 rounded-xl text-white placeholder-white/60 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 backdrop-blur-md font-medium transition-all"
                style={{ minHeight: '44px', fontSize: '16px' }}
              />
              <select
                value={teacherFilters.subject}
                onChange={(e) => handleFilterChange('subject', e.target.value)}
                className="w-full px-4 py-3 bg-white/20 border-2 border-white/30 rounded-xl text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 backdrop-blur-md font-medium transition-all"
                style={{ minHeight: '44px', fontSize: '16px' }}
              >
                <option value="">All Subjects</option>
                {uniqueSubjects.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <select
                value={teacherFilters.class}
                onChange={(e) => handleFilterChange('class', e.target.value)}
                className="w-full px-4 py-3 bg-white/20 border-2 border-white/30 rounded-xl text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 backdrop-blur-md font-medium transition-all"
                style={{ minHeight: '44px', fontSize: '16px' }}
              >
                <option value="">All Classes</option>
                {uniqueClasses.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <button
                onClick={() => setTeacherFilters({ search: '', subject: '', class: '' })}
                className="px-4 py-3 bg-gradient-to-r from-gray-500/90 to-gray-600/90 border-2 border-white/50 text-white rounded-xl hover:from-gray-600 hover:to-gray-700 transition-all font-bold shadow-lg backdrop-blur-md"
                style={{ minHeight: '44px' }}
              >
                🔄 Clear Filters
              </button>
            </div>
            <div className="mt-3 text-sm text-white font-bold bg-white/10 rounded-lg px-3 py-2 border border-white/20">
              📊 Showing {filteredTeachers.length} of {teachers.length} teachers
            </div>
          </div>

          {/* Add Teacher Form */}
          {showAddTeacherForm && (
            <div className="mb-6 bg-white/10 border-2 border-white/30 rounded-xl p-4 sm:p-6 backdrop-blur-md shadow-lg">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b-2 border-white/30">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500/90 to-blue-600/90 backdrop-blur-sm flex items-center justify-center text-white text-lg shadow-md border-2 border-white/50">
                  ➕
                </div>
                <h3 className="text-lg font-bold text-white">Add New Teacher</h3>
              </div>
              <form onSubmit={handleTeacherFormSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  value={newTeacher.firstName}
                  onChange={(e) => setNewTeacher({...newTeacher, firstName: e.target.value})}
                  className="w-full px-4 py-3 bg-white/20 border-2 border-white/30 rounded-xl text-white placeholder-white/60 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 backdrop-blur-md font-medium transition-all"
                  style={{ minHeight: '44px', fontSize: '16px' }}
                  placeholder="First Name"
                  required
                />
                <input
                  type="text"
                  value={newTeacher.lastName}
                  onChange={(e) => setNewTeacher({...newTeacher, lastName: e.target.value})}
                  className="w-full px-4 py-3 bg-white/20 border-2 border-white/30 rounded-xl text-white placeholder-white/60 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 backdrop-blur-md font-medium transition-all"
                  style={{ minHeight: '44px', fontSize: '16px' }}
                  placeholder="Last Name"
                  required
                />
                <input
                  type="email"
                  value={newTeacher.email}
                  onChange={(e) => setNewTeacher({...newTeacher, email: e.target.value})}
                  className="w-full px-4 py-3 bg-white/20 border-2 border-white/30 rounded-xl text-white placeholder-white/60 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 backdrop-blur-md font-medium transition-all"
                  style={{ minHeight: '44px', fontSize: '16px' }}
                  placeholder="Email"
                  required
                />
                <input
                  type="password"
                  value={newTeacher.password}
                  onChange={(e) => setNewTeacher({...newTeacher, password: e.target.value})}
                  className="w-full px-4 py-3 bg-white/20 border-2 border-white/30 rounded-xl text-white placeholder-white/60 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 backdrop-blur-md font-medium transition-all"
                  style={{ minHeight: '44px', fontSize: '16px' }}
                  placeholder="Password"
                  required
                />
                <select
                  value={newTeacher.gender}
                  onChange={(e) => setNewTeacher({...newTeacher, gender: e.target.value})}
                  className="w-full px-4 py-3 bg-white/20 border-2 border-white/30 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 backdrop-blur-md font-medium transition-all"
                  style={{ minHeight: '44px', fontSize: '16px' }}
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>

                {/* Teaching Level Selection */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-white/90 mb-2">Teaching Level</label>
                  <p className="text-xs text-white/80 mb-2">
                    Select which educational level this teacher will primarily teach
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setNewTeacher({...newTeacher, teachingLevel: 'KG'})}
                      className={`p-3 rounded-lg text-sm font-semibold transition-all ${
                        newTeacher.teachingLevel === 'KG'
                          ? 'bg-pink-400 text-white shadow-lg scale-105'
                          : 'glass hover:shadow-md'
                      }`}
                      style={{ minHeight: '44px' }}
                    >
                      🎨 KG (KG1-KG2)
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewTeacher({...newTeacher, teachingLevel: 'Lower Primary'})}
                      className={`p-3 rounded-lg text-sm font-semibold transition-all ${
                        newTeacher.teachingLevel === 'Lower Primary'
                          ? 'bg-blue-300 text-white shadow-lg scale-105'
                          : 'glass hover:shadow-md'
                      }`}
                      style={{ minHeight: '44px' }}
                    >
                      📘 Lower Primary (BS1-BS3)
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewTeacher({...newTeacher, teachingLevel: 'Upper Primary'})}
                      className={`p-3 rounded-lg text-sm font-semibold transition-all ${
                        newTeacher.teachingLevel === 'Upper Primary'
                          ? 'bg-blue-500 text-white shadow-lg scale-105'
                          : 'glass hover:shadow-md'
                      }`}
                      style={{ minHeight: '44px' }}
                    >
                      📚 Upper Primary (BS4-BS6)
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewTeacher({...newTeacher, teachingLevel: 'JHS'})}
                      className={`p-3 rounded-lg text-sm font-semibold transition-all ${
                        newTeacher.teachingLevel === 'JHS'
                          ? 'bg-green-400 text-white shadow-lg scale-105'
                          : 'glass hover:shadow-md'
                      }`}
                      style={{ minHeight: '44px' }}
                    >
                      🎓 JHS (BS7-BS9)
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewTeacher({...newTeacher, teachingLevel: 'All Levels'})}
                      className={`p-3 rounded-lg text-sm font-semibold transition-all ${
                        newTeacher.teachingLevel === 'All Levels'
                          ? 'bg-purple-400 text-white shadow-lg scale-105'
                          : 'glass hover:shadow-md'
                      }`}
                      style={{ minHeight: '44px' }}
                    >
                      🌟 All Levels
                    </button>
                  </div>
                  <p className="text-xs text-white/70 mt-2">
                    💡 Select "All Levels" for teachers who teach across multiple grade levels
                  </p>
                </div>

                {/* Primary Role Selection */}
                <div>
                  <label className="block text-sm font-bold text-white mb-2">Primary Role</label>
                  <select
                    value={newTeacher?.primaryRole || 'subject_teacher'}
                    onChange={(e) => handlePrimaryRoleChange(e.target.value)}
                    className="w-full px-4 py-3 bg-white/20 border-2 border-white/30 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 backdrop-blur-md font-medium transition-all"
                    style={{ minHeight: '44px', fontSize: '16px' }}
                    required
                  >
                    <option value="admin">Admin</option>
                    <option value="head_teacher">Head Teacher</option>
                    <option value="subject_teacher">Subject Teacher</option>
                    <option value="class_teacher">Class Teacher</option>
                    <option value="form_master">
                      {newTeacher?.gender === 'female' ? 'Form Mistress' : 'Form Master'}
                    </option>
                  </select>
                </div>

                {/* Class Assigned - Only for Form Masters and Class Teachers */}
                {(newTeacher?.primaryRole === 'form_master' || newTeacher?.primaryRole === 'class_teacher') && (
                  <div className="md:col-span-2 bg-blue-500/20 border-2 border-blue-400/50 rounded-xl p-4 backdrop-blur-md shadow-lg">
                    <div className="flex items-start mb-3">
                      <span className="text-2xl mr-3">🎓</span>
                      <div>
                        <label className="block text-sm font-bold text-white mb-1">
                          Form Class Assignment <span className="text-red-300">*</span>
                        </label>
                        {newTeacher.teachingLevel === 'JHS' && (
                          <p className="text-xs text-white/90 mb-2">
                            ℹ️ <strong>JHS Form Masters</strong> are also subject teachers. You can assign subjects and classes later via "Assign Teacher Subjects".
                          </p>
                        )}
                        {newTeacher.teachingLevel !== 'JHS' && (
                          <p className="text-xs text-white mb-2">
                            Select the class this teacher will manage as {newTeacher.teachingLevel === 'KG' ? 'Class Teacher' : 'Form Teacher'}.
                          </p>
                        )}
                      </div>
                    </div>
                    <select
                      value={newTeacher.classAssigned || ''}
                      onChange={(e) => setNewTeacher(prev => ({...prev, classAssigned: e.target.value}))}
                      className="w-full px-4 py-3 bg-white/30 border-2 border-white/50 rounded-xl text-white focus:ring-2 focus:ring-blue-400 focus:border-blue-400 backdrop-blur-md font-medium transition-all"
                      style={{ minHeight: '44px', fontSize: '16px' }}
                      required
                    >
                      <option value="">Select a class to manage as Form {newTeacher.teachingLevel === 'JHS' ? 'Master/Mistress' : 'Teacher'}</option>
                      {(() => {
                        // Filter classes based on teaching level
                        let filteredClasses = [];
                        if (newTeacher.teachingLevel === 'KG') {
                          filteredClasses = DEFAULT_CLASSES.filter(cls => cls.startsWith('KG'));
                        } else if (newTeacher.teachingLevel === 'PRIMARY') {
                          filteredClasses = DEFAULT_CLASSES.filter(cls =>
                            cls.startsWith('BS') && !['BS7', 'BS8', 'BS9'].includes(cls)
                          );
                        } else if (newTeacher.teachingLevel === 'JHS') {
                          filteredClasses = ['BS7', 'BS8', 'BS9'];
                        } else {
                          filteredClasses = DEFAULT_CLASSES;
                        }

                        return filteredClasses.map(cls => (
                          <option key={cls} value={cls}>{cls}</option>
                        ));
                      })()}
                    </select>
                    <div className="mt-2 flex items-center text-xs text-white/90 bg-white/10 rounded p-2">
                      <span className="mr-2">📋</span>
                      <span>
                        Available classes for <strong className="text-white">{newTeacher.teachingLevel}</strong>:
                        <strong className="ml-1 text-white">
                          {newTeacher.teachingLevel === 'KG' && 'KG1, KG2'}
                          {newTeacher.teachingLevel === 'PRIMARY' && 'BS1, BS2, BS3, BS4, BS5, BS6'}
                          {newTeacher.teachingLevel === 'JHS' && 'BS7, BS8, BS9'}
                        </strong>
                      </span>
                    </div>
                  </div>
                )}

                <div className="md:col-span-2 flex justify-end pt-3 border-t-2 border-white/30">
                  <button
                    type="submit"
                    className="px-6 py-3 bg-gradient-to-r from-green-500/90 to-blue-600/90 border-2 border-white/50 text-white rounded-xl hover:from-green-600 hover:to-blue-700 transition-all font-bold shadow-lg backdrop-blur-md"
                    style={{ minHeight: '44px', minWidth: '180px' }}
                  >
                    ✅ Add Teacher
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Teachers List - Mobile Card View */}
          <div className="md:hidden max-h-[500px] overflow-y-auto space-y-0">
            {filteredTeachers.length > 0 ? (
              filteredTeachers.map((teacher) => (
                <MobileTeacherCard
                  key={teacher.id}
                  teacher={teacher}
                  isSelected={selectedTeacherIds.includes(teacher.id)}
                  onSelect={() => handleSelectTeacher(teacher.id)}
                  onEdit={() => onEditTeacher(teacher)}
                  onResetPassword={() => handleResetPassword(teacher)}
                  onDelete={() => handleDeleteTeacher(teacher.id)}
                />
              ))
            ) : (
              <div className="text-center py-8 text-white bg-white/10 border-2 border-white/30 rounded-xl p-4 backdrop-blur-md shadow-lg font-medium">
                No teachers found matching your criteria.
              </div>
            )}
          </div>

          {/* Teachers Table - Desktop View */}
          <div className="hidden md:block bg-white/10 border-2 border-white/30 rounded-xl overflow-hidden backdrop-blur-md shadow-lg">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-white/20">
                <thead className="bg-white/10">
                  <tr>
                    <th className="px-6 py-3">
                      <input
                        type="checkbox"
                        onChange={handleSelectAll}
                        checked={teachers.length > 0 && selectedTeacherIds.length === teachers.length}
                        className="h-5 w-5 rounded border-gray-300 cursor-pointer"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/90 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/90 uppercase">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/90 uppercase">Gender</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/90 uppercase">Subjects</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/90 uppercase">Classes</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/90 uppercase">Primary Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/90 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white/5 divide-y divide-white/20">
                  {filteredTeachers.map((teacher) => (
                    <tr key={teacher.id} className="hover:bg-white/10">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedTeacherIds.includes(teacher.id)}
                          onChange={() => handleSelectTeacher(teacher.id)}
                          className="h-5 w-5 rounded border-gray-300 cursor-pointer"
                        />
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-white">
                        <div className="flex items-center gap-2">
                          <div className="h-10 w-10 rounded-full bg-gray-600 flex items-center justify-center text-white font-bold">
                            {`${teacher.first_name?.[0] || '?'}${teacher.last_name?.[0] || '?'}`.toUpperCase()}
                          </div>
                          <span>{teacher.first_name} {teacher.last_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-white/70">{teacher.email}</td>
                      <td className="px-6 py-4 text-sm text-white/70 capitalize">{teacher.gender || 'Not specified'}</td>
                      <td className="px-6 py-4 text-sm text-white/70">
                        {teacher.subjects?.length > 0 ? teacher.subjects.join(', ') : 'None'}
                      </td>
                      <td className="px-6 py-4 text-sm text-white/70">
                        {teacher.classes?.length > 0 ? teacher.classes.join(', ') : 'None'}
                      </td>
                      <td className="px-6 py-4 text-sm text-white/70">
                        {(() => {
                          const role = teacher.all_roles?.[0] || teacher.teacher_primary_role || 'subject_teacher';
                          const roleMap = {
                            'admin': 'Admin',
                            'head_teacher': 'Head Teacher',
                            'subject_teacher': 'Subject Teacher',
                            'class_teacher': 'Class Teacher',
                            'form_master': teacher.gender === 'female' ? 'Form Mistress' : 'Form Master',
                            'teacher': 'Subject Teacher'
                          };
                          return roleMap[role] || role;
                        })()}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium space-x-2">
                        <button
                          onClick={() => onEditTeacher(teacher)}
                          className="px-3 py-1.5 bg-gradient-to-r from-blue-500/90 to-indigo-600/90 border border-white/50 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all font-bold shadow-md backdrop-blur-sm"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => handleResetPassword(teacher)}
                          className="px-3 py-1.5 bg-gradient-to-r from-orange-500/90 to-orange-600/90 border border-white/50 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all font-bold shadow-md backdrop-blur-sm"
                          title="Reset Password"
                        >
                          🔑 Reset
                        </button>
                        <button
                          onClick={() => handleDeleteTeacher(teacher.id)}
                          className="px-3 py-1.5 bg-gradient-to-r from-red-500/90 to-red-600/90 border border-white/50 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all font-bold shadow-md backdrop-blur-sm"
                        >
                          🗑️ Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredTeachers.length === 0 && (
                <div className="text-center py-8 text-white bg-white/5 border-t-2 border-white/20 font-medium">
                  No teachers found matching your criteria.
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end mt-6 pt-6 border-t-4 border-yellow-500/50">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gradient-to-r from-gray-500/90 to-gray-600/90 border-2 border-white/50 text-white rounded-xl hover:from-gray-600 hover:to-gray-700 transition-all font-bold shadow-lg backdrop-blur-md"
              style={{ minHeight: '44px', minWidth: '120px' }}
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Reset Password Modal */}
      {resetPasswordModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[10000] flex items-center justify-center p-4">
          <div className="glass-card-golden rounded-xl p-6 max-w-md w-full border-2 border-white/30 shadow-2xl">
            <div className="flex items-center gap-3 mb-4 pb-4 border-b-4 border-yellow-500/50">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500/90 to-blue-600/90 backdrop-blur-sm flex items-center justify-center text-white text-2xl shadow-lg border-2 border-white/50">
                🔑
              </div>
              <h3 className="text-xl font-bold text-white text-shadow">Password Reset Successful</h3>
            </div>

            <div className="mb-4">
              <p className="text-white font-bold mb-2">
                Password has been reset for <strong>{resetPasswordModal.teacher.first_name} {resetPasswordModal.teacher.last_name}</strong>
              </p>
              <p className="text-sm text-white/90 mb-4">
                📧 Email: {resetPasswordModal.teacher.email}
              </p>
            </div>

            <div className="bg-yellow-500/20 border-2 border-yellow-400/50 rounded-xl p-4 mb-4 backdrop-blur-md shadow-lg">
              <label className="block text-sm font-bold text-white mb-2">
                🔐 Temporary Password
              </label>
              <div className="flex items-center justify-between gap-2">
                <code className="flex-1 px-4 py-3 rounded-xl font-mono text-lg font-bold bg-white/90 text-gray-900 border-2 border-white/50 backdrop-blur-sm">
                  {resetPasswordModal.temporaryPassword}
                </code>
                <button
                  onClick={() => copyToClipboard(resetPasswordModal.temporaryPassword)}
                  className="px-4 py-3 bg-gradient-to-r from-blue-500/90 to-blue-600/90 border-2 border-white/50 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all font-bold shadow-lg backdrop-blur-md whitespace-nowrap"
                  title="Copy to clipboard"
                >
                  📋 Copy
                </button>
              </div>
            </div>

            <div className="bg-blue-500/20 border-2 border-blue-400/50 rounded-xl p-3 mb-4 backdrop-blur-md shadow-lg">
              <p className="text-sm text-white font-medium">
                ⚠️ <strong>Important:</strong> Please share this temporary password with the teacher securely.
                They will be required to change it upon their next login.
              </p>
            </div>

            <div className="flex justify-end pt-4 border-t-2 border-white/30">
              <button
                onClick={closeResetPasswordModal}
                className="px-6 py-3 bg-gradient-to-r from-green-500/90 to-blue-600/90 border-2 border-white/50 text-white rounded-xl hover:from-green-600 hover:to-blue-700 transition-all font-bold shadow-lg backdrop-blur-md"
                style={{ minHeight: '44px', minWidth: '120px' }}
              >
                ✅ Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

TeachersManagementModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  teachers: PropTypes.array.isRequired,
  loadData: PropTypes.func.isRequired,
  onEditTeacher: PropTypes.func.isRequired,
};

export default TeachersManagementModal;
