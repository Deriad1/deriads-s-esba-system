import React, { useState, useEffect, useCallback } from 'react';
import { assignRole, removeRole, getRoleAssignments } from '../api-client';

const RoleManagementModal = ({ isOpen, onClose, teacher, onRolesUpdated }) => {
  const [roles, setRoles] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [selectedClasses, setSelectedClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const availableRoles = [
    'teacher',
    'class_teacher',
    'subject_teacher',
    'form_master',
    'head_teacher'
  ];

  // Ghana Education System subjects across all levels
  const availableSubjects = [
    // KG
    "Literacy", "Numeracy", "Our World and Our People",
    // Primary & JHS Common
    "English Language", "Mathematics", "Science", "Integrated Science",
    "History", "Our World Our People", "Creative Arts",
    "Religious and Moral Education (R.M.E.)", "Ghanaian Language", "Physical Education",
    // Upper Primary & JHS
    "Social Studies", "Computing", "French",
    // JHS Specific
    "Ghanaian Language and Culture", "Basic Design and Technology (B.D.T.)"
  ];

  const availableClasses = [
    "KG1", "KG2", "BS1", "BS2", "BS3", "BS4", "BS5", "BS6", "BS7", "BS8", "BS9"
  ];

  const loadTeacherRoles = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getRoleAssignments(teacher.id);
      if (response.status === 'success' && response.data.length > 0) {
        const assignments = response.data[0];
        setRoles(assignments.roles || []);
        setSubjects(assignments.subjects || []);
        setClasses(assignments.classes || []);
      }
    } catch (error) {
      console.error('Error loading teacher roles:', error);
      setError('Failed to load teacher roles');
    } finally {
      setLoading(false);
    }
  }, [teacher]);

  useEffect(() => {
    if (teacher && isOpen) {
      loadTeacherRoles();
    }
  }, [teacher, isOpen, loadTeacherRoles]);

  const handleRoleAssign = async () => {
    if (!selectedRole) {
      setError('Please select a role to assign');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const response = await assignRole(
        teacher.id,
        selectedRole,
        selectedSubjects,
        selectedClasses
      );
      
      if (response.status === 'success') {
        // Update local state
        if (!roles.includes(selectedRole)) {
          setRoles([...roles, selectedRole]);
        }
        
        // Update subjects and classes
        const newSubjects = [...subjects];
        selectedSubjects.forEach(subject => {
          if (!newSubjects.includes(subject)) {
            newSubjects.push(subject);
          }
        });
        setSubjects(newSubjects);
        
        const newClasses = [...classes];
        selectedClasses.forEach(cls => {
          if (!newClasses.includes(cls)) {
            newClasses.push(cls);
          }
        });
        setClasses(newClasses);
        
        // Reset form
        setSelectedRole('');
        setSelectedSubjects([]);
        setSelectedClasses([]);
        
        // Notify parent
        onRolesUpdated();
      } else {
        setError(response.message);
      }
    } catch (error) {
      console.error('Error assigning role:', error);
      setError('Failed to assign role');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleRemove = async (role) => {
    try {
      setLoading(true);
      setError('');
      
      const response = await removeRole(teacher.id, role);
      
      if (response.status === 'success') {
        // Update local state
        setRoles(roles.filter(r => r !== role));
        // Notify parent
        onRolesUpdated();
      } else {
        setError(response.message);
      }
    } catch (error) {
      console.error('Error removing role:', error);
      setError('Failed to remove role');
    } finally {
      setLoading(false);
    }
  };

  const handleSubjectToggle = (subject) => {
    setSelectedSubjects(prev => 
      prev.includes(subject)
        ? prev.filter(s => s !== subject)
        : [...prev, subject]
    );
  };

  const handleClassToggle = (cls) => {
    setSelectedClasses(prev => 
      prev.includes(cls)
        ? prev.filter(c => c !== cls)
        : [...prev, cls]
    );
  };

  if (!isOpen || !teacher) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              Manage Roles for {teacher.firstName} {teacher.lastName}
            </h2>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Current Roles */}
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-3">Current Roles</h3>
              {loading ? (
                <p>Loading roles...</p>
              ) : roles.length === 0 ? (
                <p className="text-gray-500">No roles assigned</p>
              ) : (
                <div className="space-y-2">
                  {roles.map(role => (
                    <div key={role} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span className="font-medium capitalize">{role.replace('_', ' ')}</span>
                      <button
                        onClick={() => handleRoleRemove(role)}
                        disabled={loading}
                        className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 disabled:opacity-50"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Assign New Role */}
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-3">Assign New Role</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Role</label>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={loading}
                  >
                    <option value="">Select a role</option>
                    {availableRoles.map(role => (
                      <option key={role} value={role} disabled={roles.includes(role)}>
                        {role.replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedRole && (
                  <>
                    {['subject_teacher', 'class_teacher', 'form_master'].includes(selectedRole) && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Subjects</label>
                        <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 border border-gray-300 rounded">
                          {availableSubjects.map(subject => (
                            <div key={subject} className="flex items-center">
                              <input
                                type="checkbox"
                                id={`subject-${subject}`}
                                checked={selectedSubjects.includes(subject)}
                                onChange={() => handleSubjectToggle(subject)}
                                disabled={loading}
                                className="mr-2"
                              />
                              <label htmlFor={`subject-${subject}`} className="text-sm">
                                {subject}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {['class_teacher', 'form_master', 'subject_teacher'].includes(selectedRole) && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Classes</label>
                        <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 border border-gray-300 rounded">
                          {availableClasses.map(cls => (
                            <div key={cls} className="flex items-center">
                              <input
                                type="checkbox"
                                id={`class-${cls}`}
                                checked={selectedClasses.includes(cls)}
                                onChange={() => handleClassToggle(cls)}
                                disabled={loading}
                                className="mr-2"
                              />
                              <label htmlFor={`class-${cls}`} className="text-sm">
                                {cls}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <button
                      onClick={handleRoleAssign}
                      disabled={loading}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      {loading ? 'Assigning...' : 'Assign Role'}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Role Details */}
          {roles.length > 0 && (
            <div className="mt-6 pt-4 border-t">
              <h3 className="text-lg font-semibold text-gray-700 mb-3">Role Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Subjects</h4>
                  {subjects.length === 0 ? (
                    <p className="text-gray-500 text-sm">No subjects assigned</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {subjects.map(subject => (
                        <span key={subject} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                          {subject}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Classes</h4>
                  {classes.length === 0 ? (
                    <p className="text-gray-500 text-sm">No classes assigned</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {classes.map(cls => (
                        <span key={cls} className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">
                          {cls}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end mt-6 pt-4 border-t">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleManagementModal;