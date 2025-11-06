

import React, { useState, useEffect } from 'react';
import { updateTeacher as _updateTeacher } from '../optimized-api.jsx'; // Make sure you import updateTeacher

// Role mapping utilities
const ROLE_DB_TO_DISPLAY = {
  'subject_teacher': 'Subject Teacher',
  'class_teacher': 'Class Teacher',
  'form_master': 'Form Master',
  'head_teacher': 'Head Teacher'
};

const ROLE_DISPLAY_TO_DB = {
  'Subject Teacher': 'subject_teacher',
  'Class Teacher': 'class_teacher',
  'Form Master': 'form_master',
  'Head Teacher': 'head_teacher'
};

// Edit Teacher Modal Component with Form Master Class Assignment
const EditTeacherModal = ({ isOpen, onClose, teacher, allSubjects, classes, onTeacherUpdate }) => {
  const [formData, setFormData] = useState({
    id: '',
    firstName: '',
    lastName: '',
    email: '',
    gender: 'male',
    subjects: [],
    classes: [],
    primaryRole: 'Subject Teacher',
    additionalResponsibilities: [],
    formMasterClass: '' // New field for Form Master assigned class
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (teacher && isOpen) {
      // Convert database roles to display names
      const dbRoles = teacher.all_roles || ['subject_teacher'];
      const displayRoles = dbRoles.map(role => ROLE_DB_TO_DISPLAY[role] || role);

      setFormData({
        id: teacher.id,
        firstName: teacher.first_name || '',
        lastName: teacher.last_name || '',
        email: teacher.email || '',
        gender: teacher.gender || 'male',
        subjects: teacher.subjects || [],
        classes: teacher.classes || [],
        primaryRole: displayRoles[0] || 'Subject Teacher',
        additionalResponsibilities: displayRoles.slice(1) || [],
        formMasterClass: teacher.form_master_class || '' // Load existing form master class
      });
    }
  }, [teacher, isOpen]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleResponsibilityToggle = (responsibility) => {
    setFormData(prev => {
      const newResponsibilities = prev.additionalResponsibilities.includes(responsibility)
        ? prev.additionalResponsibilities.filter(r => r !== responsibility)
        : [...prev.additionalResponsibilities, responsibility];

      // If Form Master is being removed, also clear the assigned class
      let newFormMasterClass = prev.formMasterClass;
      if (responsibility === 'Form Master' && !newResponsibilities.includes('Form Master')) {
        newFormMasterClass = '';
      }

      return {
        ...prev,
        additionalResponsibilities: newResponsibilities,
        formMasterClass: newFormMasterClass
      };
    });
  };

  const handleFormMasterClassChange = (selectedClass) => {
    setFormData(prev => ({
      ...prev,
      formMasterClass: selectedClass,
      // Automatically add the selected class to the teacher's classes if not already included
      classes: selectedClass && !prev.classes.includes(selectedClass) 
        ? [...prev.classes, selectedClass] 
        : prev.classes
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.email.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    // Validate Form Master class assignment
    if (formData.additionalResponsibilities.includes('Form Master') && !formData.formMasterClass) {
      alert('Please assign a class (BS7, BS8, or BS9) for the Form Master role');
      return;
    }

    setIsSubmitting(true);
    try {
      // Combine primary role with additional responsibilities for all_roles (in display format)
      const displayRoles = [formData.primaryRole, ...formData.additionalResponsibilities];

      // Convert display names to database format
      let dbRoles = displayRoles.map(role => ROLE_DISPLAY_TO_DB[role] || role);

      // Remove duplicates
      dbRoles = [...new Set(dbRoles)];

      // Also convert primaryRole to database format
      const dbPrimaryRole = ROLE_DISPLAY_TO_DB[formData.primaryRole] || formData.primaryRole;

      const updateData = {
        id: formData.id,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        gender: formData.gender,
        primaryRole: dbPrimaryRole,
        all_roles: dbRoles,
        allRoles: dbRoles, // Include both formats for compatibility
        form_master_class: formData.formMasterClass, // Include form master class in update
        // Keep existing subjects and classes - they'll be managed via Class Management
        subjects: teacher?.subjects || [],
        classes: teacher?.classes || []
      };

      await onTeacherUpdate(updateData);
    } catch (error) {
      console.error('Error in handleSubmit:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const primaryRoles = ['Subject Teacher', 'Class Teacher', 'Head Teacher'];
  const additionalResponsibilities = ['Form Master'];
  const formMasterClasses = ['BS7', 'BS8', 'BS9']; // Only senior classes for Form Master

  // Check if Form Master is selected
  const isFormMasterSelected = formData.additionalResponsibilities.includes('Form Master');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 overflow-y-auto">
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

            {/* Primary Role */}
            <div className="glass rounded-lg p-4">
              <h3 className="text-lg font-bold text-gray-800 mb-3">Primary Role</h3>
              <select
                value={formData.primaryRole}
                onChange={(e) => handleInputChange('primaryRole', e.target.value)}
                className="glass-input w-full px-3 py-2 rounded-md"
              >
                {primaryRoles.map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>

            {/* Additional Responsibilities */}
            <div className="glass rounded-lg p-4">
              <h3 className="text-lg font-bold text-gray-800 mb-3">Additional Responsibilities</h3>
              <div className="grid grid-cols-1 gap-2">
                {additionalResponsibilities.map(responsibility => (
                  <div key={responsibility} className="flex items-center p-2 glass rounded-md">
                    <input
                      type="checkbox"
                      id={`responsibility-${responsibility}`}
                      checked={formData.additionalResponsibilities.includes(responsibility)}
                      onChange={() => handleResponsibilityToggle(responsibility)}
                      className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor={`responsibility-${responsibility}`} className="text-gray-700">
                      {responsibility}
                    </label>
                  </div>
                ))}
              </div>

              {/* Form Master Class Assignment - Show only if Form Master is selected */}
              {isFormMasterSelected && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="text-md font-semibold text-blue-800 mb-3">
                    Assigned Class for Form Master Role
                  </h4>
                  <select
                    value={formData.formMasterClass}
                    onChange={(e) => handleFormMasterClassChange(e.target.value)}
                    className="glass-input w-full px-3 py-2 rounded-md"
                    required
                  >
                    <option value="">-- Select a Class --</option>
                    {formMasterClasses.map(className => (
                      <option key={className} value={className}>{className}</option>
                    ))}
                  </select>
                  <p className="text-xs text-blue-600 mt-2">
                    Form Masters can only be assigned to senior classes (BS7, BS8, BS9)
                  </p>
                </div>
              )}
            </div>

            {/* Info Message */}
            <div className="glass rounded-lg p-4 bg-blue-50 border border-blue-200">
              <div className="flex items-start">
                <span className="text-2xl mr-3">ℹ️</span>
                <div>
                  <h3 className="text-md font-semibold text-blue-800 mb-1">Class & Subject Assignment</h3>
                  <p className="text-sm text-blue-700">
                    To assign or modify classes and subjects for this teacher, please use the <strong>Class Management</strong> section from the main menu.
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
export default EditTeacherModal;
