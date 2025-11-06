import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useNotification } from '../../context/NotificationContext';

const EditTeacherModal = ({ isOpen, onClose, teacher, onTeacherUpdate }) => {
  const { showNotification } = useNotification();
  const [formData, setFormData] = useState({
    id: '',
    firstName: '',
    lastName: '',
    email: '',
    gender: 'male',
    subjects: [],
    classes: [],
    primaryRole: 'Subject Teacher',
    additionalRoles: [], // NEW: Support for multiple roles
    teachingLevel: 'PRIMARY'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Map database role names to UI format (gender-aware for Form Master)
  const mapRoleToUI = (role, gender = 'male') => {
    const roleMap = {
      'admin': 'Admin',
      'head_teacher': 'Head Teacher',
      'subject_teacher': 'Subject Teacher',
      'class_teacher': 'Class Teacher',
      'form_master': gender === 'female' ? 'Form Mistress' : 'Form Master',
      'teacher': 'Subject Teacher' // Legacy support
    };
    return roleMap[role] || role.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  useEffect(() => {
    if (teacher && isOpen) {
      // Map roles from database format to UI format (gender-aware)
      const gender = teacher.gender || 'male';
      const allRolesUI = (teacher.all_roles || []).map(role => mapRoleToUI(role, gender));

      setFormData({
        id: teacher.id,
        firstName: teacher.first_name || '',
        lastName: teacher.last_name || '',
        email: teacher.email || '',
        gender: gender,
        subjects: teacher.subjects || [],
        classes: teacher.classes || [],
        primaryRole: allRolesUI[0] || 'Subject Teacher',
        additionalRoles: allRolesUI.slice(1) || [], // All roles except primary
        teachingLevel: teacher.teaching_level || 'PRIMARY',
        form_class: teacher.form_class || teacher.class_assigned || ''
      });
    }
  }, [teacher, isOpen]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Map UI role names to database format
  const mapRoleToDatabase = (role) => {
    const roleMap = {
      'Admin': 'admin',
      'Head Teacher': 'head_teacher',
      'Subject Teacher': 'subject_teacher',
      'Class Teacher': 'class_teacher',
      'Form Master': 'form_master',
      'Form Mistress': 'form_master' // Both map to form_master in DB
    };
    return roleMap[role] || role.toLowerCase().replace(/\s+/g, '_');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.email.trim()) {
      showNotification({
        type: 'error',
        title: 'Validation Error',
        message: 'Please fill in all required fields'
      });
      return;
    }

    // Validation for Form Master
    if (formData.primaryRole === 'Form Master' && !formData.form_class) {
      showNotification({
        type: 'error',
        title: 'Validation Error',
        message: 'Please assign a class (BS7, BS8, or BS9) for the Form Master role'
      });
      return;
    }

    // Validation for Class Teacher
    if (formData.primaryRole === 'Class Teacher' && !formData.form_class) {
      showNotification({
        type: 'error',
        title: 'Validation Error',
        message: 'Please assign a class for the Class Teacher role'
      });
      return;
    }

    // Convert primary role to database format (snake_case)
    const dbPrimaryRole = mapRoleToDatabase(formData.primaryRole);

    // ✅ MULTI-ROLE SUPPORT: Combine primary role + additional roles
    const dbAdditionalRoles = (formData.additionalRoles || []).map(role => mapRoleToDatabase(role));
    const dbAllRoles = [dbPrimaryRole, ...dbAdditionalRoles];

    setIsSubmitting(true);
    try {
      const updateData = {
        id: formData.id,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        gender: formData.gender,
        primaryRole: dbPrimaryRole,
        teachingLevel: formData.teachingLevel,
        all_roles: dbAllRoles,
        allRoles: dbAllRoles, // Also send camelCase version
        // Preserve existing subjects and classes - managed via TeacherSubjectAssignment
        subjects: teacher?.subjects || [],
        classes: teacher?.classes || [],
        form_class: formData.form_class
      };

      await onTeacherUpdate(updateData);
      showNotification({
        type: 'success',
        title: 'Success',
        message: 'Teacher updated successfully!'
      });
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      showNotification({
        type: 'error',
        title: 'Update Failed',
        message: `Error updating teacher: ${error.message}`
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get gender-aware role display name
  const getRoleDisplayName = (role) => {
    if (role === 'Form Master') {
      return formData.gender === 'female' ? 'Form Mistress' : 'Form Master';
    }
    return role;
  };

  const primaryRoles = ['Admin', 'Head Teacher', 'Subject Teacher', 'Class Teacher', 'Form Master'];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[9999] overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="glass-card-golden rounded-lg p-6 w-full max-w-4xl my-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Edit Teacher</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="glass rounded-lg p-4">
              <h3 className="text-lg font-bold text-gray-800 mb-3">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  placeholder="First Name"
                  className="glass-input w-full px-3 py-2 rounded-md"
                  required
                />
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  placeholder="Last Name"
                  className="glass-input w-full px-3 py-2 rounded-md"
                  required
                />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Email"
                  className="glass-input w-full px-3 py-2 rounded-md"
                  required
                />
                <select
                  value={formData.gender}
                  onChange={(e) => handleInputChange('gender', e.target.value)}
                  className="glass-input w-full px-3 py-2 rounded-md"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
            </div>

            {/* Teaching Level */}
            <div className="glass rounded-lg p-4">
              <h3 className="text-lg font-bold text-gray-800 mb-3">Teaching Level</h3>
              <p className="text-sm text-gray-600 mb-3">
                Select which educational level this teacher will primarily teach
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleInputChange('teachingLevel', 'KG')}
                  className={`p-3 rounded-lg text-sm font-semibold transition-all ${
                    formData.teachingLevel === 'KG'
                      ? 'bg-pink-400 text-white shadow-lg scale-105'
                      : 'glass hover:shadow-md'
                  }`}
                >
                  🎨 KG
                </button>
                <button
                  type="button"
                  onClick={() => handleInputChange('teachingLevel', 'Lower Primary')}
                  className={`p-3 rounded-lg text-sm font-semibold transition-all ${
                    formData.teachingLevel === 'Lower Primary'
                      ? 'bg-blue-300 text-white shadow-lg scale-105'
                      : 'glass hover:shadow-md'
                  }`}
                >
                  📘 Lower Primary
                </button>
                <button
                  type="button"
                  onClick={() => handleInputChange('teachingLevel', 'Upper Primary')}
                  className={`p-3 rounded-lg text-sm font-semibold transition-all ${
                    formData.teachingLevel === 'Upper Primary'
                      ? 'bg-blue-500 text-white shadow-lg scale-105'
                      : 'glass hover:shadow-md'
                  }`}
                >
                  📚 Upper Primary
                </button>
                <button
                  type="button"
                  onClick={() => handleInputChange('teachingLevel', 'JHS')}
                  className={`p-3 rounded-lg text-sm font-semibold transition-all ${
                    formData.teachingLevel === 'JHS'
                      ? 'bg-green-400 text-white shadow-lg scale-105'
                      : 'glass hover:shadow-md'
                  }`}
                >
                  🎓 JHS
                </button>
                <button
                  type="button"
                  onClick={() => handleInputChange('teachingLevel', 'All Levels')}
                  className={`p-3 rounded-lg text-sm font-semibold transition-all ${
                    formData.teachingLevel === 'All Levels'
                      ? 'bg-purple-400 text-white shadow-lg scale-105'
                      : 'glass hover:shadow-md'
                  }`}
                >
                  🌟 All Levels
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                💡 Select "All Levels" for teachers who teach across multiple grade levels
              </p>
            </div>

            {/* Primary Role */}
            <div className="glass rounded-lg p-4">
              <h3 className="text-lg font-bold text-gray-800 mb-3">Primary Role</h3>
              <select
                value={formData.primaryRole}
                onChange={(e) => handleInputChange('primaryRole', e.target.value)}
                className="glass-input w-full px-3 py-2 rounded-md"
              >
                {primaryRoles.map(role => (
                  <option key={role} value={role}>{getRoleDisplayName(role)}</option>
                ))}
              </select>
            </div>

            {/* Additional Roles - Multi-Role Support */}
            <div className="glass rounded-lg p-4 bg-purple-50 border-2 border-purple-300">
              <div className="flex items-start mb-3">
                <span className="text-2xl mr-3">🔄</span>
                <div>
                  <h3 className="text-lg font-bold text-gray-800">Additional Roles (Optional)</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Allow this user to switch between multiple roles. For example, an Admin can also be a Subject Teacher.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                {primaryRoles
                  .filter(role => role !== formData.primaryRole)
                  .map(role => {
                    const isSelected = formData.additionalRoles.includes(role);
                    return (
                      <label
                        key={role}
                        className={`flex items-center p-3 rounded-lg cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-purple-100 border-2 border-purple-400'
                            : 'glass hover:shadow-md'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            const newAdditionalRoles = e.target.checked
                              ? [...formData.additionalRoles, role]
                              : formData.additionalRoles.filter(r => r !== role);
                            handleInputChange('additionalRoles', newAdditionalRoles);
                          }}
                          className="mr-3 w-5 h-5 text-purple-600 focus:ring-purple-500"
                        />
                        <span className={`font-medium ${isSelected ? 'text-purple-900' : 'text-gray-700'}`}>
                          {getRoleDisplayName(role)}
                        </span>
                      </label>
                    );
                  })}
              </div>

              {formData.additionalRoles.length > 0 && (
                <div className="mt-4 p-3 bg-purple-100 rounded-lg">
                  <p className="text-sm font-semibold text-purple-900 mb-2">
                    ✅ This user will have {formData.additionalRoles.length + 1} role{formData.additionalRoles.length > 0 ? 's' : ''}:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-purple-600 text-white text-xs font-bold rounded-full">
                      {getRoleDisplayName(formData.primaryRole)} (Primary)
                    </span>
                    {formData.additionalRoles.map(role => (
                      <span key={role} className="px-3 py-1 bg-purple-400 text-white text-xs font-semibold rounded-full">
                        {getRoleDisplayName(role)}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-purple-700 mt-2">
                    💡 A role switcher will appear in the navbar allowing them to switch between these roles.
                  </p>
                </div>
              )}
            </div>

            {/* Class Assignment - Show for Form Master and Class Teacher */}
            {(formData.primaryRole === 'Form Master' || formData.primaryRole === 'Class Teacher') && (
              <div className="glass rounded-lg p-4 bg-green-50 border-2 border-green-300">
                <h3 className="text-lg font-bold text-gray-800 mb-3">
                  {formData.primaryRole === 'Form Master' ? '📋 Form Master Class Assignment' : '👨‍🏫 Class Teacher Assignment'}
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  {formData.primaryRole === 'Form Master'
                    ? 'Assign a Form Class (BS7, BS8, or BS9) for this Form Master'
                    : 'Assign a class for this Class Teacher'}
                </p>
                <select
                  value={formData.form_class || ''}
                  onChange={(e) => handleInputChange('form_class', e.target.value)}
                  className="glass-input w-full px-3 py-2 rounded-md"
                  required
                >
                  <option value="">-- Select a Class --</option>
                  {formData.primaryRole === 'Form Master' ? (
                    <>
                      <option value="BS7">BS7</option>
                      <option value="BS8">BS8</option>
                      <option value="BS9">BS9</option>
                    </>
                  ) : (
                    <>
                      <option value="KG1">KG1</option>
                      <option value="KG2">KG2</option>
                      <option value="BS1">BS1</option>
                      <option value="BS2">BS2</option>
                      <option value="BS3">BS3</option>
                      <option value="BS4">BS4</option>
                      <option value="BS5">BS5</option>
                      <option value="BS6">BS6</option>
                      <option value="BS7">BS7</option>
                      <option value="BS8">BS8</option>
                      <option value="BS9">BS9</option>
                    </>
                  )}
                </select>
              </div>
            )}

            {/* Info Message - Direct to Teacher Subject Assignment */}
            <div className="glass rounded-lg p-4 bg-blue-50 border-2 border-blue-300">
              <div className="flex items-start">
                <span className="text-3xl mr-4">👨‍🏫</span>
                <div>
                  <h3 className="text-lg font-bold text-blue-900 mb-2">Assign Subjects & Classes</h3>
                  <p className="text-sm text-blue-800 mb-3">
                    To assign or modify subjects and classes for this teacher, please use the dedicated
                    <strong> "Assign Teacher Subjects"</strong> button on the main Admin Dashboard.
                  </p>
                  <p className="text-xs text-blue-700">
                    💡 This centralized interface provides a better experience for managing teacher assignments.
                  </p>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={onClose}
                className="glass-button px-4 py-2 rounded-md"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="glass-button-primary text-white px-4 py-2 rounded-md disabled:opacity-50"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Updating...' : 'Update Teacher'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

EditTeacherModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  teacher: PropTypes.object,
  onTeacherUpdate: PropTypes.func.isRequired,
};

export default EditTeacherModal;
