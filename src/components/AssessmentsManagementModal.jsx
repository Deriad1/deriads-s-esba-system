import { useState, useEffect } from 'react';
import { useNotification } from '../context/NotificationContext';
import { useGlobalSettings } from '../context/GlobalSettingsContext';
import { DEFAULT_TERM, AVAILABLE_TERMS } from '../constants/terms';

const API_BASE = import.meta.env.VITE_API_BASE || '/api';

const ASSESSMENT_TYPES = [
  { value: 'midterm', label: 'Midterm Exam', description: 'Mid-term examination' },
  { value: 'mock', label: 'Mock Exam', description: 'Mock/Practice examination' },
  { value: 'quiz', label: 'Quiz', description: 'Short quiz assessment' },
  { value: 'assignment', label: 'Assignment', description: 'Take-home assignment' },
  { value: 'project', label: 'Project', description: 'Project-based assessment' },
  { value: 'practical', label: 'Practical', description: 'Practical/Lab assessment' },
  { value: 'other', label: 'Other', description: 'Other assessment type' }
];

const DEFAULT_CLASSES = [
  "KG1", "KG2", "BS1", "BS2", "BS3", "BS4", "BS5", "BS6",
  "BS7", "BS8", "BS9", "BS10", "BS11", "BS12"
];

const DEFAULT_SUBJECTS = [
  "English Language", "Mathematics", "Science", "Integrated Science",
  "Social Studies", "Computing", "French", "Ghanaian Language",
  "Creative Arts", "Religious and Moral Education (R.M.E.)",
  "Physical Education", "History", "Our World Our People",
  "Literacy", "Numeracy", "Basic Design and Technology (B.D.T.)"
];

const AssessmentsManagementModal = ({ isOpen, onClose }) => {
  const { showNotification } = useNotification();
  const { settings } = useGlobalSettings();

  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    assessmentType: 'midterm',
    maxScore: 100,
    term: settings.term || DEFAULT_TERM,
    academicYear: settings.academicYear || '',
    applicableClasses: [],
    applicableSubjects: [],
    startDate: '',
    endDate: '',
    isActive: true
  });

  useEffect(() => {
    if (isOpen) {
      fetchAssessments();
    }
  }, [isOpen]);

  const fetchAssessments = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/assessments`);
      const data = await response.json();

      if (data.status === 'success') {
        setAssessments(data.data);
      } else {
        showNotification({
          type: 'error',
          title: 'Load Failed',
          message: 'Failed to load assessments'
        });
      }
    } catch (error) {
      console.error('Error fetching assessments:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Error loading assessments'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = editingAssessment
        ? `${API_BASE}/assessments?id=${editingAssessment.id}`
        : `${API_BASE}/assessments`;

      const method = editingAssessment ? 'PUT' : 'POST';

      const payload = {
        ...formData,
        applicableClasses: formData.applicableClasses.length > 0 ? formData.applicableClasses : null,
        applicableSubjects: formData.applicableSubjects.length > 0 ? formData.applicableSubjects : null
      };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (data.status === 'success') {
        showNotification({
          type: 'success',
          title: 'Success',
          message: editingAssessment ? 'Assessment updated successfully' : 'Assessment created successfully'
        });
        resetForm();
        fetchAssessments();
      } else {
        showNotification({
          type: 'error',
          title: 'Save Failed',
          message: data.message || 'Failed to save assessment'
        });
      }
    } catch (error) {
      console.error('Error saving assessment:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Error saving assessment'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (assessment) => {
    setEditingAssessment(assessment);
    setFormData({
      name: assessment.name,
      description: assessment.description || '',
      assessmentType: assessment.assessment_type,
      maxScore: assessment.max_score,
      term: assessment.term,
      academicYear: assessment.academic_year,
      applicableClasses: assessment.applicable_classes || [],
      applicableSubjects: assessment.applicable_subjects || [],
      startDate: assessment.start_date ? assessment.start_date.split('T')[0] : '',
      endDate: assessment.end_date ? assessment.end_date.split('T')[0] : '',
      isActive: assessment.is_active
    });
    setShowCreateForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this assessment? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/assessments?id=${id}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.status === 'success') {
        showNotification({
          type: 'success',
          title: 'Deleted',
          message: 'Assessment deleted successfully'
        });
        fetchAssessments();
      } else {
        showNotification({
          type: 'error',
          title: 'Delete Failed',
          message: data.message || 'Failed to delete assessment'
        });
      }
    } catch (error) {
      console.error('Error deleting assessment:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Error deleting assessment'
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (assessment) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/assessments?id=${assessment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !assessment.is_active })
      });

      const data = await response.json();

      if (data.status === 'success') {
        showNotification({
          type: 'success',
          title: 'Updated',
          message: `Assessment ${!assessment.is_active ? 'activated' : 'deactivated'} successfully`
        });
        fetchAssessments();
      } else {
        showNotification({
          type: 'error',
          title: 'Update Failed',
          message: data.message || 'Failed to update assessment'
        });
      }
    } catch (error) {
      console.error('Error toggling assessment:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Error updating assessment'
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      assessmentType: 'midterm',
      maxScore: 100,
      term: settings.term || DEFAULT_TERM,
      academicYear: settings.academicYear || '',
      applicableClasses: [],
      applicableSubjects: [],
      startDate: '',
      endDate: '',
      isActive: true
    });
    setEditingAssessment(null);
    setShowCreateForm(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-card-golden rounded-lg shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="glass-card-golden px-6 py-4 flex justify-between items-center border-b-4 border-yellow-500/50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-yellow-500/90 backdrop-blur-sm flex items-center justify-center text-2xl shadow-lg border-2 border-white/50">
              📝
            </div>
            <h2 className="text-2xl font-bold text-white text-shadow">Manage Assessments</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-white/80 text-2xl font-bold p-2 hover:bg-white/20 rounded-xl transition-colors"
            style={{ minWidth: '44px', minHeight: '44px' }}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {!showCreateForm ? (
            <>
              {/* Action Buttons */}
              <div className="mb-6 flex justify-between items-center">
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="glass-card-golden hover:bg-white/30 text-white px-6 py-3 rounded-xl font-semibold shadow-lg border-2 border-green-500/50 hover:border-green-500/80 transition-all"
                  style={{ minHeight: '44px' }}
                >
                  + Create New Assessment
                </button>
                <button
                  onClick={fetchAssessments}
                  disabled={loading}
                  className="glass-card-golden hover:bg-white/30 text-white px-4 py-3 rounded-xl disabled:opacity-50 shadow-lg border-2 border-white/30 transition-all"
                  style={{ minHeight: '44px' }}
                >
                  {loading ? 'Loading...' : '↻ Refresh'}
                </button>
              </div>

              {/* Assessments List */}
              {loading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
                  <p className="mt-4 text-white">Loading assessments...</p>
                </div>
              ) : assessments.length === 0 ? (
                <div className="glass-card-golden text-center py-12 rounded-xl">
                  <p className="text-white text-lg font-semibold">No assessments created yet</p>
                  <p className="text-white/80 mt-2">Click "Create New Assessment" to get started</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {assessments.map((assessment) => (
                    <div
                      key={assessment.id}
                      className={`glass-card-golden rounded-xl p-5 border-2 ${
                        assessment.is_active ? 'border-green-500/50' : 'border-white/30'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 flex-wrap">
                            <h3 className="text-lg font-semibold text-white">{assessment.name}</h3>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-bold shadow-md ${
                                assessment.is_active
                                  ? 'bg-green-500/90 text-white border-2 border-white/50'
                                  : 'bg-gray-400/90 text-white border-2 border-white/50'
                              }`}
                            >
                              {assessment.is_active ? 'Active' : 'Inactive'}
                            </span>
                            <span className="px-3 py-1 bg-blue-500/90 text-white rounded-full text-xs font-bold shadow-md border-2 border-white/50">
                              {ASSESSMENT_TYPES.find(t => t.value === assessment.assessment_type)?.label || assessment.assessment_type}
                            </span>
                          </div>
                          {assessment.description && (
                            <p className="text-white/90 mt-2">{assessment.description}</p>
                          )}
                          <div className="mt-3 flex flex-wrap gap-4 text-sm text-white/90">
                            <span>📅 {assessment.term} - {assessment.academic_year}</span>
                            <span>📊 Max Score: {assessment.max_score}</span>
                            {assessment.applicable_classes && (
                              <span>🎓 Classes: {assessment.applicable_classes.join(', ')}</span>
                            )}
                            {assessment.applicable_subjects && (
                              <span>📚 Subjects: {assessment.applicable_subjects.join(', ')}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => handleEdit(assessment)}
                            className="bg-blue-500/90 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-md border-2 border-white/50 transition-all"
                            style={{ minHeight: '40px' }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => toggleActive(assessment)}
                            className={`px-4 py-2 rounded-lg text-sm font-semibold shadow-md border-2 border-white/50 transition-all ${
                              assessment.is_active
                                ? 'bg-gray-400/90 hover:bg-gray-500 text-white'
                                : 'bg-green-500/90 hover:bg-green-600 text-white'
                            }`}
                            style={{ minHeight: '40px' }}
                          >
                            {assessment.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                          {assessment.assessment_type !== 'standard' && (
                            <button
                              onClick={() => handleDelete(assessment.id)}
                              className="bg-red-500/90 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-md border-2 border-white/50 transition-all"
                              style={{ minHeight: '40px' }}
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            /* Create/Edit Form */
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white">
                  {editingAssessment ? 'Edit Assessment' : 'Create New Assessment'}
                </h3>
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-white hover:text-white/80 font-semibold px-4 py-2 rounded-xl hover:bg-white/20 transition-all"
                >
                  ← Back to List
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-bold text-white mb-2">
                    Assessment Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-white/20 border-2 border-white/30 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 text-white placeholder-white/60 backdrop-blur-md"
                    placeholder="e.g., Midterm Exam 2025"
                    style={{ minHeight: '44px' }}
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-bold text-white mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 bg-white/20 border-2 border-white/30 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 text-white placeholder-white/60 backdrop-blur-md"
                    rows="2"
                    placeholder="Optional description"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-white mb-2">
                    Assessment Type *
                  </label>
                  <select
                    required
                    value={formData.assessmentType}
                    onChange={(e) => setFormData({ ...formData, assessmentType: e.target.value })}
                    className="w-full px-4 py-3 bg-white/20 border-2 border-white/30 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 text-white backdrop-blur-md"
                    style={{ minHeight: '44px' }}
                  >
                    {ASSESSMENT_TYPES.map(type => (
                      <option key={type.value} value={type.value} className="bg-gray-800">
                        {type.label} - {type.description}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-white mb-2">
                    Maximum Score *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="1000"
                    value={formData.maxScore}
                    onChange={(e) => setFormData({ ...formData, maxScore: parseFloat(e.target.value) })}
                    className="w-full px-4 py-3 bg-white/20 border-2 border-white/30 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 text-white placeholder-white/60 backdrop-blur-md"
                    style={{ minHeight: '44px' }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-white mb-2">
                    Term *
                  </label>
                  <select
                    required
                    value={formData.term}
                    onChange={(e) => setFormData({ ...formData, term: e.target.value })}
                    className="w-full px-4 py-3 bg-white/20 border-2 border-white/30 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 text-white backdrop-blur-md"
                    style={{ minHeight: '44px' }}
                  >
                    {AVAILABLE_TERMS.map(term => (
                      <option key={term} value={term} className="bg-gray-800">{term}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-white mb-2">
                    Academic Year *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.academicYear}
                    onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                    className="w-full px-4 py-3 bg-white/20 border-2 border-white/30 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 text-white placeholder-white/60 backdrop-blur-md"
                    placeholder="e.g., 2025/2026"
                    style={{ minHeight: '44px' }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-white mb-2">
                    Start Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-4 py-3 bg-white/20 border-2 border-white/30 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 text-white backdrop-blur-md"
                    style={{ minHeight: '44px' }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-white mb-2">
                    End Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-4 py-3 bg-white/20 border-2 border-white/30 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 text-white backdrop-blur-md"
                    style={{ minHeight: '44px' }}
                  />
                </div>

                <div className="col-span-2">
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-bold text-white">
                      Applicable Classes (Leave empty for all classes)
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        if (formData.applicableClasses.length === DEFAULT_CLASSES.length) {
                          setFormData({ ...formData, applicableClasses: [] });
                        } else {
                          setFormData({ ...formData, applicableClasses: DEFAULT_CLASSES });
                        }
                      }}
                      className="text-xs text-white/90 hover:text-white px-3 py-1 rounded-lg bg-white/20 hover:bg-white/30 transition-all"
                    >
                      {formData.applicableClasses.length === DEFAULT_CLASSES.length ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 p-4 bg-white/20 border-2 border-white/30 rounded-xl backdrop-blur-md max-h-40 overflow-y-auto">
                    {DEFAULT_CLASSES.map(cls => (
                      <label
                        key={cls}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 cursor-pointer transition-all"
                      >
                        <input
                          type="checkbox"
                          checked={formData.applicableClasses.includes(cls)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({
                                ...formData,
                                applicableClasses: [...formData.applicableClasses, cls]
                              });
                            } else {
                              setFormData({
                                ...formData,
                                applicableClasses: formData.applicableClasses.filter(c => c !== cls)
                              });
                            }
                          }}
                          className="w-4 h-4 rounded border-2 border-white/50 bg-white/20 checked:bg-yellow-500 focus:ring-2 focus:ring-yellow-500"
                        />
                        <span className="text-white text-sm font-medium">{cls}</span>
                      </label>
                    ))}
                  </div>
                  <p className="text-sm text-white/80 mt-2">
                    {formData.applicableClasses.length > 0
                      ? `${formData.applicableClasses.length} class${formData.applicableClasses.length > 1 ? 'es' : ''} selected`
                      : 'No classes selected (applies to all classes)'}
                  </p>
                </div>

                <div className="col-span-2">
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-bold text-white">
                      Applicable Subjects (Leave empty for all subjects)
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        if (formData.applicableSubjects.length === DEFAULT_SUBJECTS.length) {
                          setFormData({ ...formData, applicableSubjects: [] });
                        } else {
                          setFormData({ ...formData, applicableSubjects: DEFAULT_SUBJECTS });
                        }
                      }}
                      className="text-xs text-white/90 hover:text-white px-3 py-1 rounded-lg bg-white/20 hover:bg-white/30 transition-all"
                    >
                      {formData.applicableSubjects.length === DEFAULT_SUBJECTS.length ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-4 bg-white/20 border-2 border-white/30 rounded-xl backdrop-blur-md max-h-60 overflow-y-auto">
                    {DEFAULT_SUBJECTS.map(subj => (
                      <label
                        key={subj}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 cursor-pointer transition-all"
                      >
                        <input
                          type="checkbox"
                          checked={formData.applicableSubjects.includes(subj)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({
                                ...formData,
                                applicableSubjects: [...formData.applicableSubjects, subj]
                              });
                            } else {
                              setFormData({
                                ...formData,
                                applicableSubjects: formData.applicableSubjects.filter(s => s !== subj)
                              });
                            }
                          }}
                          className="w-4 h-4 rounded border-2 border-white/50 bg-white/20 checked:bg-yellow-500 focus:ring-2 focus:ring-yellow-500 flex-shrink-0"
                        />
                        <span className="text-white text-sm font-medium">{subj}</span>
                      </label>
                    ))}
                  </div>
                  <p className="text-sm text-white/80 mt-2">
                    {formData.applicableSubjects.length > 0
                      ? `${formData.applicableSubjects.length} subject${formData.applicableSubjects.length > 1 ? 's' : ''} selected`
                      : 'No subjects selected (applies to all subjects)'}
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t-2 border-white/30">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-3 glass-card-golden border-2 border-white/30 rounded-xl hover:bg-white/30 text-white font-semibold transition-all"
                  style={{ minHeight: '44px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-yellow-500/90 hover:bg-yellow-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg border-2 border-white/50 disabled:opacity-50 transition-all"
                  style={{ minHeight: '44px' }}
                >
                  {loading ? 'Saving...' : editingAssessment ? 'Update Assessment' : 'Create Assessment'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssessmentsManagementModal;
