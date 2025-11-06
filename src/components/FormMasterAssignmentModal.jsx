import React, { useState, useEffect } from 'react';
import { getClassesByGroup } from '../utils/classGrouping';

/**
 * FormMasterAssignmentModal Component
 * Modal for assigning Form Master to a JHS class and selecting subjects/classes they teach
 */
const FormMasterAssignmentModal = ({
  isOpen,
  onClose,
  teacher,
  allSubjects = [],
  onSave
}) => {
  const [formClass, setFormClass] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [selectedClasses, setSelectedClasses] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const jhsClasses = getClassesByGroup('JHS'); // BS7, BS8, BS9

  useEffect(() => {
    if (teacher) {
      setFormClass(teacher.form_class || teacher.class_assigned || '');
      setSelectedSubjects(teacher.subjects || []);
      setSelectedClasses(teacher.classes || []);
    }
  }, [teacher]);

  if (!isOpen || !teacher) return null;

  const handleSubjectToggle = (subject) => {
    setSelectedSubjects(prev =>
      prev.includes(subject)
        ? prev.filter(s => s !== subject)
        : [...prev, subject]
    );
  };

  const handleClassToggle = (className) => {
    setSelectedClasses(prev =>
      prev.includes(className)
        ? prev.filter(c => c !== className)
        : [...prev, className]
    );
  };

  const handleSelectAllSubjects = () => {
    if (selectedSubjects.length === allSubjects.length) {
      setSelectedSubjects([]);
    } else {
      setSelectedSubjects([...allSubjects]);
    }
  };

  const handleSelectAllClasses = () => {
    if (selectedClasses.length === jhsClasses.length) {
      setSelectedClasses([]);
    } else {
      setSelectedClasses([...jhsClasses]);
    }
  };

  const handleSave = async () => {
    if (!formClass) {
      alert('Please select a form class for this Form Master');
      return;
    }

    if (selectedSubjects.length === 0) {
      alert('Please select at least one subject');
      return;
    }

    if (selectedClasses.length === 0) {
      alert('Please select at least one class to teach');
      return;
    }

    setIsSubmitting(true);

    try {
      await onSave({
        teacherId: teacher.id,
        formClass,
        subjects: selectedSubjects,
        classes: selectedClasses,
        teachingLevel: 'JHS'
      });

      onClose();
    } catch (error) {
      console.error('Error saving form master assignment:', error);
      alert('Error saving assignment: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="glass-card-golden rounded-lg p-6 w-full max-w-3xl my-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Form Master Assignment</h2>
              <p className="text-gray-600 mt-1">
                {teacher.first_name} {teacher.last_name}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              &times;
            </button>
          </div>

          <div className="space-y-6">
            {/* Form Class Selection */}
            <div className="glass rounded-lg p-4">
              <h3 className="text-lg font-bold text-gray-800 mb-3 text-shadow">
                📚 Select Form Class
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                Choose the JHS class this teacher will manage as Form Master
              </p>
              <div className="grid grid-cols-3 gap-3">
                {jhsClasses.map(className => (
                  <button
                    key={className}
                    onClick={() => setFormClass(className)}
                    className={`p-4 rounded-lg font-semibold transition-all ${
                      formClass === className
                        ? 'bg-green-500 text-white shadow-lg scale-105'
                        : 'glass hover:shadow-md'
                    }`}
                  >
                    {className}
                  </button>
                ))}
              </div>
            </div>

            {/* Subject Selection */}
            <div className="glass rounded-lg p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-bold text-gray-800 text-shadow">
                  📖 Select Subjects to Teach
                </h3>
                <button
                  onClick={handleSelectAllSubjects}
                  className="text-sm glass-button px-3 py-1 rounded"
                >
                  {selectedSubjects.length === allSubjects.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Choose which subjects this teacher will teach in JHS
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-60 overflow-y-auto">
                {allSubjects.map(subject => (
                  <label
                    key={subject}
                    className="flex items-center glass rounded px-3 py-2 cursor-pointer hover:bg-blue-50"
                  >
                    <input
                      type="checkbox"
                      checked={selectedSubjects.includes(subject)}
                      onChange={() => handleSubjectToggle(subject)}
                      className="mr-2"
                    />
                    <span className="text-sm">{subject}</span>
                  </label>
                ))}
              </div>
              {selectedSubjects.length > 0 && (
                <div className="mt-3 text-sm text-gray-600">
                  Selected: {selectedSubjects.length} subject{selectedSubjects.length !== 1 ? 's' : ''}
                </div>
              )}
            </div>

            {/* Class Selection */}
            <div className="glass rounded-lg p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-bold text-gray-800 text-shadow">
                  🎓 Select Classes to Teach
                </h3>
                <button
                  onClick={handleSelectAllClasses}
                  className="text-sm glass-button px-3 py-1 rounded"
                >
                  {selectedClasses.length === jhsClasses.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Choose which JHS classes this teacher will teach
              </p>
              <div className="grid grid-cols-3 gap-3">
                {jhsClasses.map(className => (
                  <label
                    key={className}
                    className={`flex items-center justify-center p-3 rounded-lg cursor-pointer transition-all ${
                      selectedClasses.includes(className)
                        ? 'bg-blue-500 text-white shadow-lg'
                        : 'glass hover:shadow-md'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedClasses.includes(className)}
                      onChange={() => handleClassToggle(className)}
                      className="mr-2"
                    />
                    <span className="font-semibold">{className}</span>
                  </label>
                ))}
              </div>
              {selectedClasses.length > 0 && (
                <div className="mt-3 text-sm text-gray-600">
                  Teaching in: {selectedClasses.join(', ')}
                </div>
              )}
            </div>

            {/* Summary */}
            {formClass && selectedSubjects.length > 0 && selectedClasses.length > 0 && (
              <div className="glass rounded-lg p-4 bg-blue-50">
                <h4 className="font-bold text-gray-800 mb-2">📋 Assignment Summary</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>
                    <strong>Form Class:</strong> {formClass}
                  </li>
                  <li>
                    <strong>Subjects:</strong> {selectedSubjects.join(', ')}
                  </li>
                  <li>
                    <strong>Teaching Classes:</strong> {selectedClasses.join(', ')}
                  </li>
                </ul>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                onClick={onClose}
                className="glass-button px-6 py-2 rounded-md"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSubmitting || !formClass || selectedSubjects.length === 0 || selectedClasses.length === 0}
                className="glass-button-primary text-white px-6 py-2 rounded-md disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Save Assignment'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormMasterAssignmentModal;
