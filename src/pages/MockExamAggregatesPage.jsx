import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { getCustomAssessments } from '../api-client';
import MockExamAggregates from '../components/MockExamAggregates';

/**
 * Mock Exam Aggregates Page
 * Allows teachers and admins to view aggregate scores for mock exams
 */
const MockExamAggregatesPage = () => {
  const { user } = useAuth();
  const [customAssessments, setCustomAssessments] = useState([]);
  const [selectedAssessment, setSelectedAssessment] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [loading, setLoading] = useState(false);

  // Get user's classes (for teachers) or all classes (for admin)
  const getUserClasses = () => {
    if (user?.role === 'admin' || user?.currentRole === 'head_teacher') {
      // Admin and head teacher can see all classes - need to get from API
      // For now, return common classes
      return ['BS7', 'BS8', 'BS9', 'BS10'];
    }

    if (Array.isArray(user?.classes)) {
      return user.classes.filter(cls => cls !== 'ALL');
    }
    return [];
  };

  useEffect(() => {
    loadCustomAssessments();
  }, []);

  const loadCustomAssessments = async () => {
    setLoading(true);
    try {
      const response = await getCustomAssessments();
      if (response.status === 'success') {
        setCustomAssessments(response.data || []);
      }
    } catch (error) {
      console.error('Error loading custom assessments:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedAssessmentInfo = customAssessments.find(
    a => a.id === parseInt(selectedAssessment)
  );

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="glass-strong rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-white">Mock Exam Aggregates</h1>
          <p className="text-white/80 mt-1">
            View aggregate scores based on 4 core subjects + best 2 electives
          </p>
        </div>

        {/* Selection Filters */}
        <div className="glass-ultra rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4 text-white">Select Assessment and Class</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Select Assessment
              </label>
              <select
                className="w-full p-3 glass-light border border-white/30 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white bg-white/10"
                value={selectedAssessment}
                onChange={(e) => setSelectedAssessment(e.target.value)}
              >
                <option value="">Choose Assessment</option>
                {customAssessments.map((assessment) => (
                  <option key={assessment.id} value={assessment.id}>
                    {assessment.name} ({assessment.max_score} marks)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Class
              </label>
              <select
                className="w-full p-3 glass-light border border-white/30 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white bg-white/10"
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
              >
                <option value="">Choose Class</option>
                {getUserClasses().map((cls) => (
                  <option key={cls} value={cls}>
                    {cls}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Info Box */}
          {selectedAssessment && selectedClass && (
            <div className="mt-4 p-4 glass-light border border-blue-300/50 rounded-lg shadow-md">
              <p className="text-sm font-semibold text-white">
                Viewing: {selectedAssessmentInfo?.name} - {selectedClass}
              </p>
              <p className="text-xs text-white/80 mt-1">
                Aggregate calculation: English Language + Mathematics + Integrated Science + Social Studies + Best 2 from other subjects
              </p>
            </div>
          )}
        </div>

        {/* Aggregates Display */}
        {selectedAssessment && selectedClass ? (
          <MockExamAggregates
            assessmentId={parseInt(selectedAssessment)}
            className={selectedClass}
            assessmentName={selectedAssessmentInfo?.name}
          />
        ) : (
          <div className="glass-ultra rounded-lg p-6">
            <div className="text-center py-12 text-white">
              <svg
                className="mx-auto h-12 w-12 text-white/60"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              <p className="mt-4 text-lg font-medium text-white">Select an assessment and class to view aggregates</p>
              <p className="mt-2 text-sm text-white/80">
                Choose an assessment and class from the dropdowns above
              </p>
            </div>
          </div>
        )}

        {/* Help Section */}
        <div className="glass-ultra rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-3">
            Understanding Aggregates
          </h3>
          <div className="space-y-2 text-sm text-white/90">
            <p>
              <strong>What is an Aggregate?</strong> The aggregate is calculated by adding the grades from:
            </p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>4 Core Subjects: English Language, Mathematics, Integrated Science, Social Studies</li>
              <li>Best 2 grades from remaining (elective) subjects</li>
            </ul>
            <p className="mt-3">
              <strong>How to read aggregates:</strong>
            </p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Lower aggregate is better (e.g., 6 is excellent, 54 is poor)</li>
              <li>Best possible aggregate: 6 (all Grade 1s)</li>
              <li>Students need all 4 core subjects + at least 2 electives to be eligible</li>
            </ul>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default MockExamAggregatesPage;
