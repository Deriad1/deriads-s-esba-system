import PropTypes from 'prop-types';
import { ScoresTable, SyncStatusPanel } from './shared';
import { useState, useEffect } from 'react';
import { getCustomAssessments } from '../../api-client';
import ResponsiveScoreEntry from '../ResponsiveScoreEntry';

/**
 * EnterScoresView Component
 *
 * Score entry view for subject teachers to enter marks for their assigned subjects.
 * This view allows teachers to:
 * - Select any class they teach (not just their form class)
 * - Select any subject they teach
 * - Enter test scores (Test 1-4) and exam marks
 * - Save individual student scores or bulk save all
 * - See sync status and draft indicators
 *
 * Key Features:
 * - Uses ScoresTable component in editable mode
 * - Shows SyncStatusPanel for data persistence visibility
 * - Supports both individual and bulk save operations
 * - Real-time calculation of totals and grades
 * - Visual feedback for saved vs. pending changes
 *
 * Architecture:
 * - Uses useFormMasterState hook for state management
 * - Delegates table rendering to ScoresTable component
 * - Provides clean separation between data logic and UI
 *
 * @component
 * @example
 * <EnterScoresView
 *   state={formMasterState}
 *   actions={formMasterActions}
 *   userSubjects={['Mathematics', 'Physics']}
 *   userClasses={['Grade 10A', 'Grade 10B']}
 *   students={filteredStudents}
 * />
 */
const EnterScoresView = ({
  state,
  actions,
  userSubjects,
  userClasses,
  students
}) => {
  // Local state for custom assessments
  const [customAssessments, setCustomAssessments] = useState([]);
  const [selectedAssessment, setSelectedAssessment] = useState('');

  // Load custom assessments on mount
  useEffect(() => {
    loadCustomAssessments();
  }, []);

  const loadCustomAssessments = async () => {
    try {
      const response = await getCustomAssessments();
      if (response.status === 'success') {
        setCustomAssessments(response.data || []);
      }
    } catch (error) {
      console.error('Error loading custom assessments:', error);
    }
  };

  // Extract state values
  const {
    selectedClass,
    selectedSubject,
    subjectMarks,
    savingScores,
    savedStudents
  } = state;

  // Calculate sync stats for SyncStatusPanel
  const calculateSyncStats = () => {
    const total = students.length;
    const saved = savedStudents.size;
    const drafts = total - saved;
    const pending = 0; // No separate pending state for now

    return { drafts, saved, pending };
  };

  const syncStats = calculateSyncStats();

  return (
    <div className="enter-scores-view">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Enter Scores
        </h1>
        <p className="text-gray-600">
          Select a class and subject to begin entering student scores
        </p>
      </div>

      {/* Sync Status Panel - Only show when class and subject are selected */}
      {selectedClass && selectedSubject && students.length > 0 && (
        <SyncStatusPanel
          drafts={syncStats.drafts}
          saved={syncStats.saved}
          pending={syncStats.pending}
          onSyncAll={actions.saveAllMarks}
          isSyncing={savingScores}
          showDetails={true}
        />
      )}

      {/* Selection Controls */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Class Selection */}
          <div>
            <label
              htmlFor="class-select"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Select Class
            </label>
            <select
              id="class-select"
              value={selectedClass}
              onChange={(e) => actions.setSelectedClass(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="">-- Choose a class --</option>
              {userClasses.map((cls) => (
                <option key={cls} value={cls}>
                  {cls}
                </option>
              ))}
            </select>
            {selectedClass && (
              <p className="mt-2 text-sm text-gray-600">
                Selected: <strong>{selectedClass}</strong>
              </p>
            )}
          </div>

          {/* Subject Selection */}
          <div>
            <label
              htmlFor="subject-select"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Select Subject
            </label>
            <select
              id="subject-select"
              value={selectedSubject}
              onChange={(e) => actions.setSelectedSubject(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              disabled={!selectedClass}
            >
              <option value="">-- Choose a subject --</option>
              {userSubjects.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
            {selectedSubject && (
              <p className="mt-2 text-sm text-gray-600">
                Selected: <strong>{selectedSubject}</strong>
              </p>
            )}
            {!selectedClass && (
              <p className="mt-2 text-sm text-gray-500 italic">
                Select a class first
              </p>
            )}
          </div>

          {/* Assessment Type Selection */}
          <div>
            <label
              htmlFor="assessment-select"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Assessment Type
            </label>
            <select
              id="assessment-select"
              value={selectedAssessment}
              onChange={(e) => setSelectedAssessment(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="">-- Choose assessment --</option>
              <option value="regular">Regular Term Scores</option>
              {customAssessments.map((assessment) => (
                <option key={assessment.id} value={assessment.id}>
                  {assessment.name} ({assessment.max_score} marks)
                </option>
              ))}
            </select>
            {selectedAssessment && (
              <p className="mt-2 text-sm text-gray-600">
                Selected: <strong>{selectedAssessment === 'regular' ? 'Regular Scores' : customAssessments.find(a => a.id === parseInt(selectedAssessment))?.name}</strong>
              </p>
            )}
          </div>
        </div>

        {/* Info banner when both selected */}
        {selectedClass && selectedSubject && (
          <div className="mt-4 p-4 bg-blue-50 border-l-4 border-blue-400 rounded">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-xl">ℹ️</span>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  Entering scores for <strong>{selectedSubject}</strong> in{' '}
                  <strong>{selectedClass}</strong>
                </p>
                {students.length === 0 && (
                  <p className="text-sm text-blue-600 mt-1">
                    No students found in this class
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Scores Table/Entry - Only show when class, subject, and assessment are selected */}
      {selectedClass && selectedSubject && selectedAssessment && students.length > 0 && (
        <>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                {selectedSubject} - {selectedClass}
              </h2>
              <div className="text-sm text-gray-600">
                {students.length} student{students.length !== 1 ? 's' : ''}
              </div>
            </div>

            {selectedAssessment === 'regular' ? (
              <ScoresTable
                students={students}
                marks={subjectMarks}
                isEditable={true}
                readOnly={false}
                onMarkChange={actions.handleScoreChange}
                onSave={actions.saveScore}
                onSaveAll={actions.saveAllScores}
                showDraftIndicators={true}
                saving={savingScores}
                savedStudents={savedStudents}
              />
            ) : (
              <ResponsiveScoreEntry
                learners={students}
                marks={subjectMarks}
                onMarkChange={actions.handleScoreChange}
                onSaveStudent={actions.saveScore}
                savedStudents={savedStudents}
                saving={savingScores}
                calculateTotals={() => ({})}
                positions={{}}
                getRemarks={() => ''}
                assessmentType="custom"
                customAssessmentInfo={customAssessments.find(a => a.id === parseInt(selectedAssessment))}
              />
            )}
          </div>
        </>
      )}

      {/* Empty State - When selections are incomplete */}
      {(!selectedClass || !selectedSubject || !selectedAssessment) && (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <span className="text-6xl mb-4 block">✏️</span>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Ready to Enter Scores
          </h3>
          <p className="text-gray-600 max-w-md mx-auto">
            {!selectedClass && !selectedSubject && !selectedAssessment && (
              <>Please select a class, subject, and assessment type to begin.</>
            )}
            {selectedClass && !selectedSubject && (
              <>
                Class <strong>{selectedClass}</strong> selected. Now choose a subject and assessment.
              </>
            )}
            {!selectedClass && selectedSubject && (
              <>
                Subject <strong>{selectedSubject}</strong> selected. Now choose a class and assessment.
              </>
            )}
            {selectedClass && selectedSubject && !selectedAssessment && (
              <>
                Class and subject selected. Now choose an assessment type.
              </>
            )}
          </p>
        </div>
      )}

      {/* Empty State - When no students found */}
      {selectedClass && selectedSubject && students.length === 0 && (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <span className="text-6xl mb-4 block">👥</span>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            No Students Found
          </h3>
          <p className="text-gray-600 max-w-md mx-auto">
            No students are enrolled in <strong>{selectedClass}</strong>.
            <br />
            Please select a different class or contact the administrator.
          </p>
        </div>
      )}

      {/* Quick Tips */}
      <div className="mt-6 bg-gray-50 rounded-lg p-6 border border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <span>💡</span>
          Quick Tips
        </h3>
        <ul className="space-y-2 text-sm text-gray-600">
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-0.5">•</span>
            <span>
              <strong>Test scores</strong> are out of 15 marks each (T1-T4)
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-0.5">•</span>
            <span>
              <strong>Exam score</strong> is out of 100 marks
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-0.5">•</span>
            <span>
              <strong>Class score</strong> (tests) counts for 50% of final grade
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-0.5">•</span>
            <span>
              <strong>Exam score</strong> counts for 50% of final grade
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-0.5">•</span>
            <span>
              Use <strong>"Save"</strong> to save individual student scores or{' '}
              <strong>"Save All Scores"</strong> to save the entire class
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 mt-0.5">✓</span>
            <span>
              Green checkmark indicates scores have been saved to the server
            </span>
          </li>
        </ul>
      </div>

      {/* Debug Info (only in development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-6 p-4 bg-gray-100 rounded-lg text-xs">
          <details>
            <summary className="cursor-pointer font-semibold text-gray-700">
              Debug Info (Development Only)
            </summary>
            <div className="mt-2 space-y-1 text-gray-600">
              <div>Selected Class: {selectedClass || 'None'}</div>
              <div>Selected Subject: {selectedSubject || 'None'}</div>
              <div>Students Count: {students.length}</div>
              <div>Saved Students: {savedStudents.size}</div>
              <div>Saving State: {savingScores ? 'Yes' : 'No'}</div>
              <div>User Classes: {userClasses.join(', ')}</div>
              <div>User Subjects: {userSubjects.join(', ')}</div>
            </div>
          </details>
        </div>
      )}
    </div>
  );
};

EnterScoresView.propTypes = {
  /**
   * FormMaster state object from useFormMasterState hook
   */
  state: PropTypes.shape({
    selectedClass: PropTypes.string,
    selectedSubject: PropTypes.string,
    subjectMarks: PropTypes.object.isRequired,
    savingScores: PropTypes.bool.isRequired,
    savedStudents: PropTypes.instanceOf(Set).isRequired
  }).isRequired,

  /**
   * FormMaster actions object from useFormMasterState hook
   */
  actions: PropTypes.shape({
    setSelectedClass: PropTypes.func.isRequired,
    setSelectedSubject: PropTypes.func.isRequired,
    handleScoreChange: PropTypes.func.isRequired,
    saveScore: PropTypes.func.isRequired,
    saveAllScores: PropTypes.func.isRequired
  }).isRequired,

  /**
   * Array of subjects the user is assigned to teach
   */
  userSubjects: PropTypes.arrayOf(PropTypes.string).isRequired,

  /**
   * Array of classes the user is assigned to teach
   */
  userClasses: PropTypes.arrayOf(PropTypes.string).isRequired,

  /**
   * Array of student objects in the selected class
   */
  students: PropTypes.arrayOf(
    PropTypes.shape({
      idNumber: PropTypes.string,
      LearnerID: PropTypes.string,
      firstName: PropTypes.string.isRequired,
      lastName: PropTypes.string.isRequired
    })
  ).isRequired
};

export default EnterScoresView;
