import PropTypes from 'prop-types';
import {
  AttendanceTab,
  BroadsheetTab,
  AnalyticsTab,
  DailyAttendanceTab,
  ReportTab
} from './tabs';

/**
 * ManageClassView Component
 *
 * Main container for the "Manage Class" view in FormMasterPage.
 * Provides tab navigation and renders the active tab content.
 *
 * This is the primary view for Form Masters to manage their assigned class:
 * - Attendance tracking (term-based)
 * - Class broadsheet
 * - Analytics and performance trends
 * - Daily attendance
 * - Report generation
 *
 * Architecture:
 * - Phase 3 COMPLETE: All tab components extracted and integrated
 * - Each tab is a modular, reusable component with its own props
 *
 * @component
 * @example
 * <ManageClassView
 *   state={formMasterState}
 *   actions={formMasterActions}
 *   formClass="Grade 10A"
 *   students={filteredStudents}
 *   userSubjects={["Math", "Science"]}
 *   loadingStates={loadingStates}
 *   errors={errors}
 *   saving={saving}
 * />
 */
const ManageClassView = ({
  state,
  actions,
  formClass,
  students,
  userSubjects,
  subjectTeachers,
  loadingStates,
  errors,
  saving
}) => {
  // Tab configuration
  const tabs = [
    {
      id: 'attendance',
      label: '📊 Attendance',
      description: 'Track term-based attendance and conduct'
    },
    {
      id: 'broadsheet',
      label: '📄 Broadsheet',
      description: 'Class performance overview'
    },
    {
      id: 'analytics',
      label: '📈 Analytics',
      description: 'Performance trends and insights'
    },
    {
      id: 'daily',
      label: '📅 Daily Attendance',
      description: 'Daily attendance tracking'
    },
    {
      id: 'report',
      label: '🖨️ Report',
      description: 'Generate and print reports'
    }
  ];

  // Get active tab
  const activeTab = state.activeTab || 'attendance';

  return (
    <div className="manage-class-view">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Manage Class: {formClass}
            </h1>
            <p className="text-gray-600 mt-1">
              {students.length} student{students.length !== 1 ? 's' : ''} enrolled
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Active Tab</div>
            <div className="text-lg font-semibold text-blue-600">
              {tabs.find(t => t.id === activeTab)?.label || 'Unknown'}
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-md mb-6 overflow-hidden">
        <div className="flex flex-wrap border-b border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => actions.setActiveTab(tab.id)}
              className={`
                flex-1 min-w-[150px] px-4 py-3 text-sm font-medium
                transition-colors duration-200
                border-b-2 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500
                ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }
              `}
              title={tab.description}
            >
              <div className="flex items-center justify-center gap-2">
                <span>{tab.label}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Tab hint */}
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
          <p className="text-sm text-gray-600">
            {tabs.find(t => t.id === activeTab)?.description}
          </p>
        </div>
      </div>

      {/* Tab Content Area */}
      <div className="tab-content">
        {/* Attendance Tab */}
        {activeTab === 'attendance' && (
          <AttendanceTab
            students={students}
            attendanceData={state.attendance || {}}
            remarksData={state.remarks || {}}
            attitudeData={state.attitude || {}}
            interestData={state.interest || {}}
            commentsData={state.comments || {}}
            footnoteInfo={state.footnoteInfo || ''}
            errors={errors}
            saving={saving}
            isLoading={loadingStates?.learners || false}
            onAttendanceChange={actions.handleAttendanceChange}
            onRemarkChange={actions.handleRemarkChange}
            onAttitudeChange={actions.handleAttitudeChange}
            onInterestChange={actions.handleInterestChange}
            onCommentsChange={actions.handleCommentsChange}
            onFootnoteChange={actions.handleFootnoteChange}
            onSaveAll={actions.confirmSave}
            onSaveFootnote={actions.saveFootnoteInfo}
          />
        )}

        {/* Broadsheet Tab */}
        {activeTab === 'broadsheet' && (
          <BroadsheetTab
            students={students}
            marksData={state.marksData || {}}
            subjects={userSubjects}
            subjectTeachers={subjectTeachers}
            isLoading={loadingStates?.broadsheet || false}
            onPrintBroadsheet={actions.printBroadsheet}
          />
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <AnalyticsTab
            subjects={userSubjects}
            analyticsData={state.analyticsData || {}}
            isLoading={loadingStates?.analytics || false}
            onLoadAnalytics={actions.loadAnalyticsData}
          />
        )}

        {/* Daily Attendance Tab */}
        {activeTab === 'daily' && (
          <DailyAttendanceTab
            students={students}
            selectedDate={state.dailyAttendanceDate || ''}
            dailyAttendanceData={state.dailyAttendance || {}}
            saving={saving}
            onDateChange={actions.setDailyAttendanceDate}
            onStatusChange={actions.handleDailyAttendanceChange}
            onSave={actions.saveDailyAttendance}
          />
        )}

        {/* Report Tab */}
        {activeTab === 'report' && (
          <ReportTab
            reportData={state.attendanceReportData || []}
            startDate={state.reportStartDate || ''}
            endDate={state.reportEndDate || ''}
            isLoading={loadingStates?.report || false}
            onStartDateChange={actions.setReportStartDate}
            onEndDateChange={actions.setReportEndDate}
            onGenerateReport={actions.generateAttendanceReport}
            onPrintReport={actions.printAttendanceReport}
          />
        )}
      </div>

      {/* Debug Info (only in development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-6 p-4 bg-gray-100 rounded-lg text-xs">
          <details>
            <summary className="cursor-pointer font-semibold text-gray-700">
              Debug Info (Development Only)
            </summary>
            <div className="mt-2 space-y-1 text-gray-600">
              <div>Active Tab: {activeTab}</div>
              <div>Form Class: {formClass}</div>
              <div>Students Count: {students.length}</div>
              <div>State Keys: {Object.keys(state).join(', ')}</div>
            </div>
          </details>
        </div>
      )}
    </div>
  );
};

ManageClassView.propTypes = {
  /**
   * FormMaster state object from useFormMasterState hook
   */
  state: PropTypes.shape({
    activeTab: PropTypes.string,
    marksData: PropTypes.object,
    attendance: PropTypes.object,
    remarks: PropTypes.object,
    attitude: PropTypes.object,
    interest: PropTypes.object,
    comments: PropTypes.object,
    footnoteInfo: PropTypes.string,
    dailyAttendance: PropTypes.object,
    dailyAttendanceDate: PropTypes.string,
    analyticsData: PropTypes.object,
    attendanceReportData: PropTypes.array,
    reportStartDate: PropTypes.string,
    reportEndDate: PropTypes.string
  }).isRequired,

  /**
   * FormMaster actions object from useFormMasterState hook
   */
  actions: PropTypes.shape({
    setActiveTab: PropTypes.func.isRequired,
    handleAttendanceChange: PropTypes.func,
    handleRemarkChange: PropTypes.func,
    handleAttitudeChange: PropTypes.func,
    handleInterestChange: PropTypes.func,
    handleCommentsChange: PropTypes.func,
    handleFootnoteChange: PropTypes.func,
    confirmSave: PropTypes.func,
    saveFootnoteInfo: PropTypes.func,
    saveAllMarksData: PropTypes.func,
    printBroadsheet: PropTypes.func,
    loadAnalyticsData: PropTypes.func,
    setDailyAttendanceDate: PropTypes.func,
    handleDailyAttendanceChange: PropTypes.func,
    saveDailyAttendance: PropTypes.func,
    setReportStartDate: PropTypes.func,
    setReportEndDate: PropTypes.func,
    generateAttendanceReport: PropTypes.func,
    printAttendanceReport: PropTypes.func
  }).isRequired,

  /**
   * The form class being managed (e.g., "Grade 10A")
   */
  formClass: PropTypes.string.isRequired,

  /**
   * Array of student objects in the class
   */
  students: PropTypes.arrayOf(
    PropTypes.shape({
      idNumber: PropTypes.string,
      LearnerID: PropTypes.string,
      firstName: PropTypes.string.isRequired,
      lastName: PropTypes.string.isRequired
    })
  ).isRequired,

  /**
   * Array of subjects taught by the form master
   */
  userSubjects: PropTypes.arrayOf(PropTypes.string).isRequired,

  /**
   * Mapping of subject names to teacher names
   */
  subjectTeachers: PropTypes.objectOf(PropTypes.string),

  /**
   * Loading states for different operations
   */
  loadingStates: PropTypes.shape({
    learners: PropTypes.bool,
    marks: PropTypes.bool,
    broadsheet: PropTypes.bool,
    analytics: PropTypes.bool,
    report: PropTypes.bool
  }),

  /**
   * Validation errors object
   */
  errors: PropTypes.object,

  /**
   * Whether a save operation is in progress
   */
  saving: PropTypes.bool
};

export default ManageClassView;
