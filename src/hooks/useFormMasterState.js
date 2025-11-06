import { useReducer, useCallback } from 'react';

/**
 * Form Master State Management Hook
 *
 * Consolidates all form master state into a single reducer pattern
 * to replace 20+ individual useState hooks
 */

const initialState = {
  // View state
  mainView: 'manageClass', // 'manageClass' or 'enterScores'
  activeTab: 'attendance', // Tab in manage class view

  // Form data (for Manage Class - Remarks Tab)
  formData: {
    remarks: {},
    attitude: {},
    interest: {},
    comments: {},
    attendance: {} // Term attendance (days present)
  },

  // Daily attendance tracking
  dailyAttendance: {},
  dailyAttendanceDate: '',

  // Marks data (all subjects)
  marksData: {},

  // Subject teaching (for Enter Scores view)
  selectedSubject: '',
  subjectMarks: {},

  // Analytics
  analyticsData: {},

  // Attendance report
  reportStartDate: '',
  reportEndDate: '',
  attendanceReportData: [],

  // Footnote info
  footnoteInfo: '',

  // UI state
  errors: {},
  savedStudents: new Set(),

  // Sync status tracking (for draft indicators)
  syncStatus: {
    remarks: 'draft', // 'draft' | 'saved' | 'syncing'
    attitude: 'draft',
    interest: 'draft',
    comments: 'draft',
    attendance: 'draft'
  }
};

const formMasterReducer = (state, action) => {
  switch (action.type) {
    // View navigation
    case 'SET_MAIN_VIEW':
      return { ...state, mainView: action.payload };

    case 'SET_ACTIVE_TAB':
      return { ...state, activeTab: action.payload };

    // Remarks and form data
    case 'UPDATE_REMARK':
      return {
        ...state,
        formData: {
          ...state.formData,
          remarks: {
            ...state.formData.remarks,
            [action.payload.studentId]: action.payload.value
          }
        },
        syncStatus: {
          ...state.syncStatus,
          remarks: 'draft'
        },
        errors: {
          ...state.errors,
          [action.payload.studentId]: ''
        }
      };

    case 'UPDATE_ATTITUDE':
      return {
        ...state,
        formData: {
          ...state.formData,
          attitude: {
            ...state.formData.attitude,
            [action.payload.studentId]: action.payload.value
          }
        },
        syncStatus: {
          ...state.syncStatus,
          attitude: 'draft'
        }
      };

    case 'UPDATE_INTEREST':
      return {
        ...state,
        formData: {
          ...state.formData,
          interest: {
            ...state.formData.interest,
            [action.payload.studentId]: action.payload.value
          }
        },
        syncStatus: {
          ...state.syncStatus,
          interest: 'draft'
        }
      };

    case 'UPDATE_COMMENT':
      return {
        ...state,
        formData: {
          ...state.formData,
          comments: {
            ...state.formData.comments,
            [action.payload.studentId]: action.payload.value
          }
        },
        syncStatus: {
          ...state.syncStatus,
          comments: 'draft'
        }
      };

    case 'UPDATE_ATTENDANCE':
      return {
        ...state,
        formData: {
          ...state.formData,
          attendance: {
            ...state.formData.attendance,
            [action.payload.studentId]: action.payload.value
          }
        },
        syncStatus: {
          ...state.syncStatus,
          attendance: 'draft'
        },
        errors: {
          ...state.errors,
          [action.payload.studentId]: ''
        }
      };

    // Bulk update form data (when loading from server)
    case 'SET_FORM_DATA':
      return {
        ...state,
        formData: {
          remarks: action.payload.remarks || {},
          attitude: action.payload.attitude || {},
          interest: action.payload.interest || {},
          comments: action.payload.comments || {},
          attendance: action.payload.attendance || {}
        },
        syncStatus: {
          remarks: 'saved',
          attitude: 'saved',
          interest: 'saved',
          comments: 'saved',
          attendance: 'saved'
        }
      };

    // Marks data
    case 'SET_MARKS_DATA':
      return {
        ...state,
        marksData: action.payload
      };

    case 'UPDATE_MARK':
      const { subject, studentId, field, value } = action.payload;
      const currentMarks = state.marksData[subject]?.[studentId] || {};
      const updatedMarks = { ...currentMarks, [field]: value };

      // Calculate totals
      const test1 = parseFloat(updatedMarks.test1 || 0);
      const test2 = parseFloat(updatedMarks.test2 || 0);
      const test3 = parseFloat(updatedMarks.test3 || 0);
      const test4 = parseFloat(updatedMarks.test4 || 0);
      const testsTotal = test1 + test2 + test3 + test4;
      const classScore50 = (testsTotal / 60) * 50;
      const examScore = parseFloat(updatedMarks.exam || 0);
      const examScore50 = (examScore / 100) * 50;
      const finalTotal = classScore50 + examScore50;

      return {
        ...state,
        marksData: {
          ...state.marksData,
          [subject]: {
            ...state.marksData[subject],
            [studentId]: {
              ...updatedMarks,
              testsTotal: testsTotal.toFixed(1),
              classScore50: classScore50.toFixed(1),
              examScore50: examScore50.toFixed(1),
              total: finalTotal.toFixed(1)
            }
          }
        }
      };

    // Subject marks (for Enter Scores view)
    case 'SET_SELECTED_SUBJECT':
      return { ...state, selectedSubject: action.payload };

    case 'SET_SUBJECT_MARKS':
      return { ...state, subjectMarks: action.payload };

    case 'UPDATE_SUBJECT_MARK':
      const { studentId: sid, field: f, value: v } = action.payload;
      const currentSubjectMarks = state.subjectMarks[sid] || {};
      const updatedSubjectMarks = { ...currentSubjectMarks, [f]: v };

      // Calculate totals
      const t1 = parseFloat(updatedSubjectMarks.test1 || 0);
      const t2 = parseFloat(updatedSubjectMarks.test2 || 0);
      const t3 = parseFloat(updatedSubjectMarks.test3 || 0);
      const t4 = parseFloat(updatedSubjectMarks.test4 || 0);
      const tTotal = t1 + t2 + t3 + t4;
      const cScore50 = (tTotal / 60) * 50;
      const eScore = parseFloat(updatedSubjectMarks.exam || 0);
      const eScore50 = (eScore / 100) * 50;
      const fTotal = cScore50 + eScore50;

      return {
        ...state,
        subjectMarks: {
          ...state.subjectMarks,
          [sid]: {
            ...updatedSubjectMarks,
            testsTotal: tTotal.toFixed(1),
            classScore50: cScore50.toFixed(1),
            examScore50: eScore50.toFixed(1),
            total: fTotal.toFixed(1)
          }
        }
      };

    // Daily attendance
    case 'SET_DAILY_ATTENDANCE_DATE':
      return { ...state, dailyAttendanceDate: action.payload };

    case 'SET_DAILY_ATTENDANCE':
      return { ...state, dailyAttendance: action.payload };

    case 'UPDATE_DAILY_ATTENDANCE':
      return {
        ...state,
        dailyAttendance: {
          ...state.dailyAttendance,
          [action.payload.studentId]: action.payload.status
        }
      };

    // Analytics
    case 'SET_ANALYTICS_DATA':
      return { ...state, analyticsData: action.payload };

    // Attendance report
    case 'SET_REPORT_START_DATE':
      return { ...state, reportStartDate: action.payload };

    case 'SET_REPORT_END_DATE':
      return { ...state, reportEndDate: action.payload };

    case 'SET_ATTENDANCE_REPORT_DATA':
      return { ...state, attendanceReportData: action.payload };

    // Footnote
    case 'SET_FOOTNOTE_INFO':
      return {
        ...state,
        footnoteInfo: action.payload,
        syncStatus: {
          ...state.syncStatus,
          footnote: 'draft'
        }
      };

    // Errors
    case 'SET_ERROR':
      return {
        ...state,
        errors: {
          ...state.errors,
          [action.payload.studentId]: action.payload.message
        }
      };

    case 'CLEAR_ERRORS':
      return { ...state, errors: {} };

    // Saved students tracking
    case 'ADD_SAVED_STUDENT':
      return {
        ...state,
        savedStudents: new Set([...state.savedStudents, action.payload])
      };

    case 'REMOVE_SAVED_STUDENT':
      const newSavedStudents = new Set(state.savedStudents);
      newSavedStudents.delete(action.payload);
      return { ...state, savedStudents: newSavedStudents };

    case 'CLEAR_SAVED_STUDENTS':
      return { ...state, savedStudents: new Set() };

    // Sync status
    case 'SET_SYNC_STATUS':
      return {
        ...state,
        syncStatus: {
          ...state.syncStatus,
          [action.payload.field]: action.payload.status
        }
      };

    case 'SET_ALL_SYNC_STATUS':
      return {
        ...state,
        syncStatus: {
          remarks: action.payload,
          attitude: action.payload,
          interest: action.payload,
          comments: action.payload,
          attendance: action.payload
        }
      };

    // Reset state
    case 'RESET_STATE':
      return initialState;

    default:
      return state;
  }
};

/**
 * Custom hook to manage form master state
 */
export const useFormMasterState = () => {
  const [state, dispatch] = useReducer(formMasterReducer, initialState);

  // Action creators
  const actions = {
    // View navigation
    setMainView: useCallback((view) => {
      dispatch({ type: 'SET_MAIN_VIEW', payload: view });
    }, []),

    setActiveTab: useCallback((tab) => {
      dispatch({ type: 'SET_ACTIVE_TAB', payload: tab });
    }, []),

    // Form data updates
    updateRemark: useCallback((studentId, value) => {
      dispatch({ type: 'UPDATE_REMARK', payload: { studentId, value } });
    }, []),

    updateAttitude: useCallback((studentId, value) => {
      dispatch({ type: 'UPDATE_ATTITUDE', payload: { studentId, value } });
    }, []),

    updateInterest: useCallback((studentId, value) => {
      dispatch({ type: 'UPDATE_INTEREST', payload: { studentId, value } });
    }, []),

    updateComment: useCallback((studentId, value) => {
      dispatch({ type: 'UPDATE_COMMENT', payload: { studentId, value } });
    }, []),

    updateAttendance: useCallback((studentId, value) => {
      dispatch({ type: 'UPDATE_ATTENDANCE', payload: { studentId, value } });
    }, []),

    setFormData: useCallback((formData) => {
      dispatch({ type: 'SET_FORM_DATA', payload: formData });
    }, []),

    // Marks
    setMarksData: useCallback((marksData) => {
      dispatch({ type: 'SET_MARKS_DATA', payload: marksData });
    }, []),

    updateMark: useCallback((subject, studentId, field, value) => {
      dispatch({ type: 'UPDATE_MARK', payload: { subject, studentId, field, value } });
    }, []),

    // Subject marks
    setSelectedSubject: useCallback((subject) => {
      dispatch({ type: 'SET_SELECTED_SUBJECT', payload: subject });
    }, []),

    setSubjectMarks: useCallback((marks) => {
      dispatch({ type: 'SET_SUBJECT_MARKS', payload: marks });
    }, []),

    updateSubjectMark: useCallback((studentId, field, value) => {
      dispatch({ type: 'UPDATE_SUBJECT_MARK', payload: { studentId, field, value } });
    }, []),

    // Daily attendance
    setDailyAttendanceDate: useCallback((date) => {
      dispatch({ type: 'SET_DAILY_ATTENDANCE_DATE', payload: date });
    }, []),

    setDailyAttendance: useCallback((attendance) => {
      dispatch({ type: 'SET_DAILY_ATTENDANCE', payload: attendance });
    }, []),

    updateDailyAttendance: useCallback((studentId, status) => {
      dispatch({ type: 'UPDATE_DAILY_ATTENDANCE', payload: { studentId, status } });
    }, []),

    // Analytics
    setAnalyticsData: useCallback((data) => {
      dispatch({ type: 'SET_ANALYTICS_DATA', payload: data });
    }, []),

    // Attendance report
    setReportStartDate: useCallback((date) => {
      dispatch({ type: 'SET_REPORT_START_DATE', payload: date });
    }, []),

    setReportEndDate: useCallback((date) => {
      dispatch({ type: 'SET_REPORT_END_DATE', payload: date });
    }, []),

    setAttendanceReportData: useCallback((data) => {
      dispatch({ type: 'SET_ATTENDANCE_REPORT_DATA', payload: data });
    }, []),

    // Footnote
    setFootnoteInfo: useCallback((info) => {
      dispatch({ type: 'SET_FOOTNOTE_INFO', payload: info });
    }, []),

    // Errors
    setError: useCallback((studentId, message) => {
      dispatch({ type: 'SET_ERROR', payload: { studentId, message } });
    }, []),

    clearErrors: useCallback(() => {
      dispatch({ type: 'CLEAR_ERRORS' });
    }, []),

    // Saved students
    addSavedStudent: useCallback((studentId) => {
      dispatch({ type: 'ADD_SAVED_STUDENT', payload: studentId });
    }, []),

    removeSavedStudent: useCallback((studentId) => {
      dispatch({ type: 'REMOVE_SAVED_STUDENT', payload: studentId });
    }, []),

    clearSavedStudents: useCallback(() => {
      dispatch({ type: 'CLEAR_SAVED_STUDENTS' });
    }, []),

    // Sync status
    setSyncStatus: useCallback((field, status) => {
      dispatch({ type: 'SET_SYNC_STATUS', payload: { field, status } });
    }, []),

    setAllSyncStatus: useCallback((status) => {
      dispatch({ type: 'SET_ALL_SYNC_STATUS', payload: status });
    }, []),

    // Reset
    resetState: useCallback(() => {
      dispatch({ type: 'RESET_STATE' });
    }, [])
  };

  return { state, actions };
};
