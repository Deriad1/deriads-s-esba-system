import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';
import { ScoresTable, SyncStatusPanel } from './shared';
import ResponsiveScoreEntry from '../ResponsiveScoreEntry';
import ScoreEntryCard from '../ScoreEntryCard';

/**
 * EnterScoresView Component
 *
 * Score entry view for subject teachers to enter marks for their assigned subjects.
 * Features clean glassmorphism design and mobile-responsive layout.
 */
const EnterScoresView = ({
  state,
  actions,
  userSubjects,
  userClasses,
  students,
  isReadOnly = false
}) => {
  // Extract state values with defaults to prevent undefined errors
  const {
    selectedClass = '',
    selectedSubject = '',
    subjectMarks = {},
    savingScores = false,
    savedStudents = new Set(),
    selectedAssessment = '',
    customAssessments = []
  } = state || {};

  // Mobile navigation state
  const [searchQuery, setSearchQuery] = useState('');
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Scroll detection for floating button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Scroll to top function
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Filter students based on search query
  const filteredStudents = students.filter(student => {
    if (!searchQuery) return true;
    const fullName = `${student.firstName} ${student.lastName}`.toLowerCase();
    const studentId = (student.idNumber || student.LearnerID || '').toLowerCase();
    return fullName.includes(searchQuery.toLowerCase()) ||
           studentId.includes(searchQuery.toLowerCase());
  });

  // Calculate sync stats for SyncStatusPanel
  const calculateSyncStats = () => {
    const total = students.length;
    const saved = savedStudents.size;
    const drafts = total - saved;
    const pending = 0;

    return { drafts, saved, pending };
  };

  // Calculate grade based on total score
  const calculateGrade = (total) => {
    const totalNum = parseFloat(total);
    if (isNaN(totalNum) || totalNum === 0) return '';
    if (totalNum >= 80) return 'Excellent';
    if (totalNum >= 70) return 'Very Good';
    if (totalNum >= 60) return 'Good';
    if (totalNum >= 50) return 'Credit';
    if (totalNum >= 40) return 'Pass';
    return 'Fail';
  };

  // Calculate total score for a student
  const calculateStudentTotal = (studentMarks) => {
    if (!studentMarks) return 0;
    const test1 = parseFloat(studentMarks.test1) || 0;
    const test2 = parseFloat(studentMarks.test2) || 0;
    const test3 = parseFloat(studentMarks.test3) || 0;
    const test4 = parseFloat(studentMarks.test4) || 0;
    const testsTotal = test1 + test2 + test3 + test4;
    const classScore50 = (testsTotal / 60) * 50;
    const exam = parseFloat(studentMarks.exam) || 0;
    const examScore50 = exam * 0.5;
    return classScore50 + examScore50;
  };

  const syncStats = calculateSyncStats();

  return (
    <div className="enter-scores-view space-y-6">
      {/* Header Card - Glass Morphism */}
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-6 md:p-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-4xl drop-shadow-lg">✏️</span>
          <h1 className="text-2xl md:text-3xl font-bold text-white drop-shadow-md">
            Enter Scores
          </h1>
        </div>
        <p className="text-white/90 text-sm md:text-base">
          Select class, subject, and assessment type to begin entering scores
        </p>
      </div>

      {/* Sync Status Panel */}
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

      {/* Selection Controls - Glass Morphism */}
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-6 md:p-8">
        <h2 className="text-lg font-bold text-white mb-4 drop-shadow-md">
          Select Class, Subject & Assessment
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Class Selection */}
          <div>
            <label
              htmlFor="class-select"
              className="block text-sm font-medium text-white mb-2 drop-shadow-md"
            >
              Class
            </label>
            <select
              id="class-select"
              value={selectedClass}
              onChange={(e) => actions.setSelectedClass(e.target.value)}
              className="w-full p-3 md:p-4 border-2 border-white/30 rounded-xl bg-white/90 backdrop-blur-md focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all text-gray-900 font-medium"
            >
              <option value="">-- Choose class --</option>
              {userClasses.map((cls) => (
                <option key={cls} value={cls}>
                  {cls}
                </option>
              ))}
            </select>
          </div>

          {/* Subject Selection */}
          <div>
            <label
              htmlFor="subject-select"
              className="block text-sm font-medium text-white mb-2 drop-shadow-md"
            >
              Subject
            </label>
            <select
              id="subject-select"
              value={selectedSubject}
              onChange={(e) => actions.setSelectedSubject(e.target.value)}
              className="w-full p-3 md:p-4 border-2 border-white/30 rounded-xl bg-white/90 backdrop-blur-md focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all text-gray-900 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!selectedClass}
            >
              <option value="">-- Choose subject --</option>
              {userSubjects.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
            {!selectedClass && (
              <p className="mt-2 text-xs text-white/70 italic">
                Select a class first
              </p>
            )}
          </div>

          {/* Assessment Type Selection */}
          <div>
            <label
              htmlFor="assessment-select"
              className="block text-sm font-medium text-white mb-2 drop-shadow-md"
            >
              Assessment Type
            </label>
            <select
              id="assessment-select"
              value={selectedAssessment}
              onChange={(e) => actions?.setSelectedAssessment?.(e.target.value)}
              className="w-full p-3 md:p-4 border-2 border-white/30 rounded-xl bg-white/90 backdrop-blur-md focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all text-gray-900 font-medium"
            >
              <option value="">-- Choose assessment --</option>
              <option value="regular">Regular Term Scores</option>
              {customAssessments.map((assessment) => (
                <option key={assessment.id} value={assessment.id}>
                  {assessment.name} ({assessment.max_score} marks)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        {selectedClass && selectedSubject && selectedAssessment && (
          <div className="mt-4 flex flex-wrap gap-3 justify-end">
            {/* Refresh Marks Button */}
            <button
              onClick={actions?.loadMarks}
              disabled={savingScores}
              className="px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              title="Refresh marks from database (marks auto-load when selections change)"
            >
              🔄 Refresh Marks
            </button>

            {/* Load from Database Button */}
            <button
              onClick={actions?.loadMarksFromDatabase}
              disabled={savingScores}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              title="Load marks from database with cache"
            >
              📥 Load Marks
            </button>

            {/* Clear Marks Button */}
            <button
              onClick={actions?.clearMarks}
              disabled={savingScores}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              title="Delete all marks for this class, subject, and term"
            >
              🗑️ Clear Marks
            </button>
          </div>
        )}

        {/* Info banner when selections made */}
        {selectedClass && selectedSubject && selectedAssessment && (
          <div className="mt-4 p-4 bg-blue-500/30 backdrop-blur-md border-l-4 border-blue-400 rounded-xl">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="text-2xl">ℹ️</span>
              <div className="flex-1">
                <p className="text-sm text-white font-medium">
                  Entering scores for <strong className="text-blue-100">{selectedSubject}</strong> in{' '}
                  <strong className="text-blue-100">{selectedClass}</strong>
                  {selectedAssessment !== 'regular' && (
                    <> - <strong className="text-blue-100">{customAssessments.find(a => a.id === parseInt(selectedAssessment))?.name}</strong></>
                  )}
                </p>
                {students.length === 0 && (
                  <p className="text-xs text-white/80 mt-1">
                    No students found in this class
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Scores Table/Entry */}
      {selectedClass && selectedSubject && selectedAssessment && students.length > 0 && (
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-4 md:p-6 overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
            <h2 className="text-lg md:text-xl font-semibold text-white drop-shadow-md">
              {selectedSubject} - {selectedClass}
            </h2>
            <div className="text-sm text-white/80 bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full">
              {students.length} student{students.length !== 1 ? 's' : ''}
            </div>
          </div>

          {/* Desktop Table View - Hidden on Mobile */}
          <div className="hidden md:block overflow-x-auto -mx-4 md:mx-0">
            <div className="inline-block min-w-full align-middle">
              <div className="overflow-hidden">
                {selectedAssessment === 'regular' ? (
                  <ScoresTable
                    students={students}
                    marks={subjectMarks}
                    isEditable={!isReadOnly}
                    readOnly={isReadOnly}
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
                    readOnly={isReadOnly}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Mobile Card View - Hidden on Desktop */}
          <div className="block md:hidden">
            {/* Mobile Search Bar */}
            <div className="mb-4 sticky top-0 z-10 bg-white/10 backdrop-blur-xl rounded-xl p-3 border border-white/20">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60">🔍</span>
                <input
                  type="text"
                  placeholder="Search by name or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 bg-white/90 border-2 border-white/30 rounded-xl text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all"
                  style={{ fontSize: '16px' }}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                )}
              </div>
              <div className="mt-2 text-xs text-white/70 text-center">
                Showing {filteredStudents.length} of {students.length} students
              </div>
            </div>

            {/* Student Cards */}
            <div className="space-y-4">
              {filteredStudents.length === 0 ? (
                <div className="text-center py-8 text-white/80">
                  <p className="text-lg">No students found</p>
                  <p className="text-sm mt-2">Try a different search term</p>
                </div>
              ) : (
                filteredStudents.map((student) => {
                  const studentId = student.idNumber || student.LearnerID;
                  const studentName = `${student.firstName} ${student.lastName}`;
                  const studentMarks = subjectMarks?.[studentId] || {};
                  const isSaved = savedStudents.has(studentId);
                  const total = calculateStudentTotal(studentMarks);
                  const remarks = calculateGrade(total);

                  // For custom assessments, use different props
                  const customAssessment = customAssessments.find(a => a.id === parseInt(selectedAssessment));

                  return (
                    <ScoreEntryCard
                      key={studentId}
                      studentId={studentId}
                      studentName={studentName}
                      marks={studentMarks}
                      isSaved={isSaved}
                      position={null}
                      remarks={remarks}
                      onMarkChange={actions.handleScoreChange}
                      onSave={actions.saveScore}
                      saving={savingScores}
                      selectedAssessment={selectedAssessment === 'regular' ? null : customAssessment}
                    />
                  );
                })
              )}
            </div>

            {/* Sticky Save All Button - Mobile Only */}
            {!isReadOnly && actions.saveAllScores && filteredStudents.length > 0 && (
              <div className="sticky bottom-4 mt-6 z-10">
                <button
                  onClick={actions.saveAllScores}
                  disabled={savingScores}
                  className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-bold shadow-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  style={{ minHeight: '48px', fontSize: '16px' }}
                >
                  {savingScores ? (
                    <>
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving All...
                    </>
                  ) : (
                    <>
                      💾 Save All Scores ({filteredStudents.length})
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Floating Scroll to Top Button - Mobile Only */}
          {showScrollTop && (
            <button
              onClick={scrollToTop}
              className="md:hidden fixed bottom-24 right-4 z-20 p-4 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-full shadow-2xl transition-all transform hover:scale-110"
              style={{ minHeight: '56px', minWidth: '56px' }}
              aria-label="Scroll to top"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            </button>
          )}
        </div>
      )}

      {/* Empty State - When selections are incomplete */}
      {(!selectedClass || !selectedSubject || !selectedAssessment) && (
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-8 md:p-12 text-center">
          <span className="text-6xl md:text-7xl mb-4 block drop-shadow-2xl">✏️</span>
          <h3 className="text-xl md:text-2xl font-bold text-white mb-3 drop-shadow-md">
            Ready to Enter Scores
          </h3>
          <p className="text-white/80 max-w-md mx-auto text-sm md:text-base">
            {!selectedClass && !selectedSubject && !selectedAssessment && (
              <>Select a class, subject, and assessment type to begin</>
            )}
            {selectedClass && !selectedSubject && (
              <>
                Class <strong className="text-blue-200">{selectedClass}</strong> selected. Now choose a subject and assessment
              </>
            )}
            {selectedClass && selectedSubject && !selectedAssessment && (
              <>
                Now choose an assessment type to continue
              </>
            )}
          </p>
        </div>
      )}

      {/* Empty State - When no students found */}
      {selectedClass && selectedSubject && selectedAssessment && students.length === 0 && (
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-8 md:p-12 text-center">
          <span className="text-6xl md:text-7xl mb-4 block drop-shadow-2xl">👥</span>
          <h3 className="text-xl md:text-2xl font-bold text-white mb-3 drop-shadow-md">
            No Students Found
          </h3>
          <p className="text-white/80 max-w-md mx-auto text-sm md:text-base">
            No students are enrolled in <strong className="text-blue-200">{selectedClass}</strong>
            <br />
            Please select a different class or contact the administrator
          </p>
        </div>
      )}

      {/* Quick Tips */}
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-6">
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2 drop-shadow-md">
          <span>💡</span>
          Quick Tips
        </h3>
        <ul className="space-y-2 text-sm text-white/90">
          <li className="flex items-start gap-2">
            <span className="text-blue-300 mt-0.5">•</span>
            <span>
              <strong>Test scores</strong> are out of 15 marks each (T1-T4)
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-300 mt-0.5">•</span>
            <span>
              <strong>Exam score</strong> is out of 100 marks
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-300 mt-0.5">•</span>
            <span>
              <strong>Class score</strong> counts for 50% of final grade
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-300 mt-0.5">•</span>
            <span>
              <strong>Exam score</strong> counts for 50% of final grade
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-400 mt-0.5">✓</span>
            <span>
              Green checkmark indicates scores saved successfully
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
};

EnterScoresView.propTypes = {
  state: PropTypes.shape({
    selectedClass: PropTypes.string,
    selectedSubject: PropTypes.string,
    subjectMarks: PropTypes.object.isRequired,
    savingScores: PropTypes.bool.isRequired,
    savedStudents: PropTypes.instanceOf(Set).isRequired,
    selectedAssessment: PropTypes.string,
    customAssessments: PropTypes.array
  }).isRequired,
  actions: PropTypes.shape({
    setSelectedClass: PropTypes.func.isRequired,
    setSelectedSubject: PropTypes.func.isRequired,
    setSelectedAssessment: PropTypes.func.isRequired,
    handleScoreChange: PropTypes.func.isRequired,
    saveScore: PropTypes.func.isRequired,
    saveAllScores: PropTypes.func.isRequired
  }).isRequired,
  userSubjects: PropTypes.arrayOf(PropTypes.string).isRequired,
  userClasses: PropTypes.arrayOf(PropTypes.string).isRequired,
  students: PropTypes.arrayOf(
    PropTypes.shape({
      idNumber: PropTypes.string,
      LearnerID: PropTypes.string,
      firstName: PropTypes.string.isRequired,
      lastName: PropTypes.string.isRequired
    })
  ).isRequired,
  isReadOnly: PropTypes.bool
};

export default EnterScoresView;
