import React, { useState, useEffect, useMemo } from 'react';
import { updateTeacher } from '../api-client';
import { getSubjectsForLevel, getSubjectCategory, getClassesForLevel, TEACHING_LEVELS } from '../utils/subjectLevelMapping';
import { isJuniorClass, isSeniorClass } from '../utils/roleHelpers';

/**
 * Teacher Subject & Class Assignment Component
 * Allows admin to assign subjects and classes to teachers
 */
const TeacherSubjectAssignment = ({ isOpen, onClose, teachers, allSubjects, allClasses, onUpdate }) => {
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [teacherSubjects, setTeacherSubjects] = useState([]);
  const [teacherClasses, setTeacherClasses] = useState([]);
  const [formClass, setFormClass] = useState(''); // For Form Masters - their administrative class
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Reset when modal opens/closes or teacher changes
  useEffect(() => {
    if (selectedTeacher) {
      setTeacherSubjects(selectedTeacher.subjects || []);
      setTeacherClasses(selectedTeacher.classes || []);
      setFormClass(selectedTeacher.formClass || selectedTeacher.form_class || '');
    } else {
      setTeacherSubjects([]);
      setTeacherClasses([]);
      setFormClass('');
    }
  }, [selectedTeacher]);

  const handleTeacherSelect = (teacher) => {
    setSelectedTeacher(teacher);
  };

  const handleSubjectToggle = (subject) => {
    setTeacherSubjects(prev =>
      prev.includes(subject)
        ? prev.filter(s => s !== subject)
        : [...prev, subject]
    );
  };

  const handleClassToggle = (className) => {
    // Check if we're adding or removing the class
    const isRemoving = teacherClasses.includes(className);

    if (isRemoving) {
      // Allow removal
      setTeacherClasses(prev => prev.filter(c => c !== className));
      return;
    }

    // VALIDATION: Class Teachers (KG-BS6) can only handle ONE class
    if (isJuniorClass(className)) {
      // Check if they already have a junior class assigned
      const hasJuniorClass = teacherClasses.some(c => isJuniorClass(c));

      if (hasJuniorClass) {
        alert('⚠️ Class Teacher Rule:\n\nA Class Teacher (KG-BS6) can only be assigned to ONE class.\n\nThey handle multiple subjects for that specific class.\n\nPlease remove the existing class assignment first.');
        return;
      }
    }

    // Allow adding the class
    setTeacherClasses(prev => [...prev, className]);
  };

  const handleSave = async () => {
    if (!selectedTeacher) return;

    setSaving(true);
    try {
      // Determine roles based on assignments
      const currentPrimaryRole = selectedTeacher.teacher_primary_role || selectedTeacher.primaryRole || 'subject_teacher';
      let updatedRoles = [...(selectedTeacher.all_roles || [currentPrimaryRole])];

      // Ensure primary role is always in the roles list
      if (!updatedRoles.includes(currentPrimaryRole)) {
        updatedRoles.push(currentPrimaryRole);
      }

      // Add subject_teacher role if they have subjects
      if (teacherSubjects.length > 0 && !updatedRoles.includes('subject_teacher')) {
        updatedRoles.push('subject_teacher');
      }

      // Remove subject_teacher role if they have no subjects (unless it's their primary role)
      if (teacherSubjects.length === 0 && currentPrimaryRole !== 'subject_teacher') {
        updatedRoles = updatedRoles.filter(r => r !== 'subject_teacher');
      }

      // Ensure required fields have valid values
      const firstName = selectedTeacher.first_name || selectedTeacher.firstName || '';
      const lastName = selectedTeacher.last_name || selectedTeacher.lastName || '';
      const email = selectedTeacher.email || '';
      const gender = selectedTeacher.gender || 'male';

      // Validate before sending
      if (!firstName.trim()) {
        alert('Error: Teacher first name is missing');
        return;
      }
      if (!lastName.trim()) {
        alert('Error: Teacher last name is missing');
        return;
      }
      if (!email.trim()) {
        alert('Error: Teacher email is missing');
        return;
      }

      const updateData = {
        id: selectedTeacher.id,
        firstName: firstName,
        lastName: lastName,
        email: email,
        gender: gender,
        teachingLevel: selectedTeacher.teaching_level || selectedTeacher.teachingLevel || 'PRIMARY', // Preserve teaching level
        subjects: teacherSubjects,
        classes: teacherClasses,
        formClass: formClass || null, // Form Master's administrative class
        primaryRole: currentPrimaryRole, // Use the determined primary role
        all_roles: updatedRoles,
        allRoles: updatedRoles
      };

      console.log('Sending teacher update:', updateData);

      await updateTeacher(updateData);
      alert('Teacher assignments updated successfully!');
      onUpdate();
      setSelectedTeacher(null);
    } catch (error) {
      console.error('Error updating teacher assignments:', error);
      console.error('Error response:', error.response);
      console.error('Error details:', error.details);

      // Show detailed error message if available
      let errorMessage = 'Error updating teacher: ' + error.message;
      if (error.response && error.response.errors) {
        const errorFields = Object.keys(error.response.errors);
        const errorDetails = errorFields.map(field =>
          `${field}: ${error.response.errors[field]}`
        ).join('\n');
        errorMessage += '\n\nValidation errors:\n' + errorDetails;
      }

      alert(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  // Filter subjects based on teacher's teaching level
  const availableSubjects = useMemo(() => {
    if (!selectedTeacher || !selectedTeacher.teaching_level) {
      return allSubjects; // Show all subjects if no level specified
    }

    const levelSubjects = getSubjectsForLevel(selectedTeacher.teaching_level);

    // Filter allSubjects to only include subjects available for this level
    return allSubjects.filter(subject => levelSubjects.includes(subject));
  }, [selectedTeacher, allSubjects]);

  // Group subjects by category for better organization
  const groupedSubjects = useMemo(() => {
    const groups = {
      multiLevel: [],
      levelSpecific: []
    };

    availableSubjects.forEach(subject => {
      const category = getSubjectCategory(subject);
      if (category === 'Multi-Level') {
        groups.multiLevel.push(subject);
      } else {
        groups.levelSpecific.push(subject);
      }
    });

    return groups;
  }, [availableSubjects]);

  // Filter classes based on teacher's teaching level
  const availableClasses = useMemo(() => {
    if (!selectedTeacher || !selectedTeacher.teaching_level) {
      return allClasses; // Show all classes if no level specified
    }

    const levelClasses = getClassesForLevel(selectedTeacher.teaching_level);

    // Filter allClasses to only include classes available for this level
    return allClasses.filter(className => levelClasses.includes(className));
  }, [selectedTeacher, allClasses]);

  // Get senior classes (BS7-BS9) that the teacher is assigned to
  const seniorClassesAssigned = useMemo(() => {
    return teacherClasses.filter(className => isSeniorClass(className));
  }, [teacherClasses]);

  // Check if teacher should have a form class (has BS7-BS9 classes)
  const shouldShowFormClass = seniorClassesAssigned.length > 0;

  if (!isOpen) return null;

  const filteredTeachers = teachers.filter(t =>
    `${t.first_name} ${t.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-4 py-20">
        <div className="glass-card-golden rounded-xl shadow-2xl p-4 sm:p-6 w-full max-w-full sm:max-w-6xl my-8">
          <div className="flex justify-between items-center mb-4 sm:mb-6 pb-4 border-b-4 border-yellow-500/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-yellow-500/90 backdrop-blur-sm flex items-center justify-center text-xl sm:text-2xl shadow-lg border-2 border-white/50">
                📚
              </div>
              <h2 className="text-lg sm:text-2xl font-bold text-white text-shadow">Assign Subjects & Classes</h2>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-white/80 text-2xl font-bold p-2 hover:bg-white/20 rounded-xl transition-colors"
              style={{ minWidth: '44px', minHeight: '44px' }}
            >
              &times;
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Teachers List */}
            <div className="lg:col-span-1 bg-white/10 border-2 border-white/30 rounded-xl p-4 backdrop-blur-md">
              <h3 className="text-lg font-bold text-white mb-3">Select Teacher</h3>

              {/* Search */}
              <input
                type="text"
                placeholder="Search teachers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-3 bg-white/20 border-2 border-white/30 rounded-xl text-white placeholder-white/60 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 mb-3 backdrop-blur-md"
                style={{ minHeight: '44px', fontSize: '16px' }}
              />

              {/* Teachers List */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredTeachers.map(teacher => (
                  <button
                    key={teacher.id}
                    onClick={() => handleTeacherSelect(teacher)}
                    className={`w-full text-left p-3 rounded-xl transition-all backdrop-blur-md ${
                      selectedTeacher?.id === teacher.id
                        ? 'bg-yellow-500/90 text-white shadow-lg border-2 border-white/50'
                        : 'bg-white/20 hover:bg-white/30 border-2 border-white/30 text-white'
                    }`}
                    style={{ minHeight: '44px' }}
                  >
                    <div className="font-semibold">{teacher.first_name} {teacher.last_name}</div>
                    <div className="text-xs opacity-80">{teacher.email}</div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {teacher.all_roles?.map(role => (
                        <span
                          key={role}
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            selectedTeacher?.id === teacher.id
                              ? 'bg-white/30'
                              : 'bg-white/20'
                          }`}
                        >
                          {role.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Assignment Section */}
            {selectedTeacher ? (
              <div className="lg:col-span-2 space-y-6">
                {/* Teacher Info */}
                <div className="bg-white/10 border-2 border-white/30 text-white rounded-xl p-4 backdrop-blur-md">
                  <h3 className="text-xl font-bold">{selectedTeacher.first_name} {selectedTeacher.last_name}</h3>
                  <p className="text-sm opacity-90">{selectedTeacher.email}</p>
                  <div className="flex flex-wrap gap-2 mt-2 items-center">
                    {selectedTeacher.teaching_level && (
                      <span className="bg-yellow-500/90 border-2 border-white/50 text-white px-3 py-1 rounded-full text-xs font-bold shadow-md">
                        {selectedTeacher.teaching_level === 'KG' && '🎨 '}
                        {selectedTeacher.teaching_level === 'Lower Primary' && '📘 '}
                        {selectedTeacher.teaching_level === 'Upper Primary' && '📚 '}
                        {selectedTeacher.teaching_level === 'PRIMARY' && '📚 '}
                        {selectedTeacher.teaching_level === 'JHS' && '🎓 '}
                        {selectedTeacher.teaching_level === 'All Levels' && '🌟 '}
                        {selectedTeacher.teaching_level}
                      </span>
                    )}
                    {selectedTeacher.all_roles?.map(role => (
                      <span key={role} className="bg-white/30 px-3 py-1 rounded-full text-xs font-medium">
                        {role.replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Subjects Assignment */}
                <div className="bg-white/10 border-2 border-white/30 rounded-xl p-4 backdrop-blur-md">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-lg font-bold text-white">📖 Assign Subjects</h4>
                    {selectedTeacher?.teaching_level && (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-500/90 text-white border-2 border-white/50 shadow-md">
                        {selectedTeacher.teaching_level} Level
                      </span>
                    )}
                  </div>

                  {/* Info message about level-based filtering */}
                  {selectedTeacher?.teaching_level && (
                    <div className="mb-3 p-3 bg-blue-500/20 rounded-xl border-2 border-blue-500/50 backdrop-blur-md">
                      <p className="text-xs text-white">
                        ℹ️ Showing subjects available for <strong>{selectedTeacher.teaching_level}</strong> teachers.
                        Cross-level subjects are available to all teachers.
                      </p>
                    </div>
                  )}

                  <div className="max-h-80 overflow-y-auto">
                    {/* All Subjects for Selected Level */}
                    {availableSubjects.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {availableSubjects.map(subject => (
                          <label
                            key={subject}
                            className={`flex items-center p-3 rounded-xl border-2 cursor-pointer transition-all backdrop-blur-md ${
                              teacherSubjects.includes(subject)
                                ? 'bg-green-500/20 border-green-500/50'
                                : 'bg-white/10 border-white/30 hover:bg-white/20'
                            }`}
                            style={{ minHeight: '44px' }}
                          >
                            <input
                              type="checkbox"
                              checked={teacherSubjects.includes(subject)}
                              onChange={() => handleSubjectToggle(subject)}
                              className="mr-2 h-5 w-5 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                            />
                            <span className="text-sm font-medium text-white">{subject}</span>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-white/70">
                        <p className="text-sm">No subjects available for this teaching level.</p>
                        <p className="text-xs mt-2">Please assign a teaching level to this teacher first.</p>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 pt-3 border-t-2 border-white/30 text-sm text-white">
                    <strong>{teacherSubjects.length}</strong> subject{teacherSubjects.length !== 1 ? 's' : ''} selected
                  </div>
                </div>

                {/* Classes Assignment */}
                <div className="bg-white/10 border-2 border-white/30 rounded-xl p-4 backdrop-blur-md">
                  <h4 className="text-lg font-bold text-white mb-3">🎓 Assign Classes</h4>
                  {selectedTeacher?.teaching_level && (
                    <p className="text-sm text-white mb-3 bg-blue-500/20 p-2 rounded-xl border-2 border-blue-500/50">
                      📌 Showing classes for <strong>{selectedTeacher.teaching_level}</strong> level
                      {selectedTeacher.teaching_level === 'All Levels' && ' (Cross-Level Teacher - All classes available)'}
                    </p>
                  )}

                  {/* Class Teacher Rule Info */}
                  <div className="mb-3 p-3 bg-yellow-500/20 border-2 border-yellow-500/50 rounded-xl">
                    <p className="text-xs text-white font-semibold mb-2">📝 Assignment Rules:</p>
                    <ul className="text-xs text-white/90 space-y-1 list-disc list-inside">
                      <li><strong>Class Teachers (KG-BS6):</strong> Can only handle ONE class with multiple subjects</li>
                      <li><strong>Form Masters (BS7-BS9):</strong> Can teach multiple classes but admin for ONE specific form class</li>
                      <li><strong>Subject Teachers:</strong> Can teach multiple classes, specific subjects only</li>
                    </ul>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {availableClasses.map(className => (
                      <label
                        key={className}
                        className={`flex items-center justify-center p-3 rounded-xl border-2 cursor-pointer transition-all backdrop-blur-md ${
                          teacherClasses.includes(className)
                            ? 'bg-blue-500/20 border-blue-500/50'
                            : 'bg-white/10 border-white/30 hover:bg-white/20'
                        }`}
                        style={{ minHeight: '44px' }}
                      >
                        <input
                          type="checkbox"
                          checked={teacherClasses.includes(className)}
                          onChange={() => handleClassToggle(className)}
                          className="mr-2 h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="text-sm font-medium text-white">{className}</span>
                      </label>
                    ))}
                  </div>
                  <div className="mt-3 pt-3 border-t-2 border-white/30 text-sm text-white">
                    <strong>{teacherClasses.length}</strong> class{teacherClasses.length !== 1 ? 'es' : ''} selected
                  </div>
                </div>

                {/* Form Class Selection - For Form Masters (BS7-BS9) */}
                {shouldShowFormClass && (
                  <div className="bg-gradient-to-br from-purple-500/20 to-blue-500/20 border-2 border-purple-400/50 rounded-xl p-4 backdrop-blur-md">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-2xl">🎓</span>
                      <h4 className="text-lg font-bold text-white">Form Master Administrative Class</h4>
                    </div>

                    <p className="text-xs text-white/90 mb-3 bg-white/10 p-2 rounded-lg">
                      <strong>Form Masters</strong> can teach multiple BS7-BS9 classes but are <strong>administratively responsible</strong> for ONE specific class (their "form class"). Select which class they will manage:
                    </p>

                    <div className="space-y-2">
                      {seniorClassesAssigned.length === 0 ? (
                        <p className="text-sm text-white/70 italic">No senior classes (BS7-BS9) assigned yet. Assign classes above first.</p>
                      ) : (
                        <>
                          <label className="block text-sm font-semibold text-white mb-2">Select Form Class:</label>
                          <select
                            value={formClass}
                            onChange={(e) => setFormClass(e.target.value)}
                            className="w-full px-4 py-3 bg-white/20 border-2 border-white/30 rounded-xl text-white font-medium focus:ring-2 focus:ring-purple-500 focus:border-purple-500 backdrop-blur-md"
                            style={{ minHeight: '48px', fontSize: '16px' }}
                          >
                            <option value="" className="bg-gray-800">-- Select Form Class --</option>
                            {seniorClassesAssigned.map(className => (
                              <option key={className} value={className} className="bg-gray-800">
                                {className}
                              </option>
                            ))}
                          </select>

                          {formClass && (
                            <p className="text-xs text-green-300 mt-2 font-semibold flex items-center gap-1">
                              ✅ This teacher will be the Form Master for <strong>{formClass}</strong> with full administrative responsibilities
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t-2 border-white/30">
                  <button
                    onClick={() => setSelectedTeacher(null)}
                    className="px-6 py-3 bg-white/20 border-2 border-white/30 hover:bg-white/30 text-white rounded-xl font-semibold transition-all backdrop-blur-md"
                    style={{ minHeight: '44px', minWidth: '100px' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-6 py-3 bg-green-500/90 border-2 border-white/50 hover:bg-green-600 text-white rounded-xl font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    style={{ minHeight: '44px', minWidth: '120px' }}
                  >
                    {saving ? 'Saving...' : 'Save Assignments'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="lg:col-span-2 flex items-center justify-center bg-white/10 border-2 border-white/30 rounded-xl backdrop-blur-md">
                <div className="text-center p-12">
                  <span className="text-6xl mb-4 block">👈</span>
                  <h3 className="text-xl font-bold text-white mb-2">Select a Teacher</h3>
                  <p className="text-white/80">Choose a teacher from the list to assign subjects and classes</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherSubjectAssignment;
