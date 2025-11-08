/**
 * API Client - Secure HTTP-based API calls with Offline Support
 *
 * ⚠️ This file replaces direct database connections
 * ✅ All database queries happen server-side
 * ✅ No database credentials exposed to browser
 * ✅ Supports offline mode with IndexedDB caching
 * ✅ Automatic sync queue for offline changes
 *
 * Migration: Gradually replace imports from './api.js' with './api-client.js'
 */

import { getCurrentTermInfo } from "./utils/termHelpers.js";
import { sanitizeInput } from "./utils/sanitizeInput.js";
import offlineStorage, { STORES } from "./services/offlineStorageService.js";
import { mapObjectToCamelCase } from "./utils/apiFieldMapper.js";

// API base URL (defaults to same origin for Vercel)
const API_BASE = '/api';

// Global reference to OnlineOfflineContext (will be set by a hook)
let onlineOfflineContext = null;

/**
 * Set the online/offline context reference
 * This should be called from a component that has access to the context
 */
export const setOnlineOfflineContext = (context) => {
  onlineOfflineContext = context;
};

/**
 * Check if we're in offline mode
 */
const isOfflineMode = () => {
  if (!onlineOfflineContext) return false;
  return !onlineOfflineContext.isFullyOnline;
};

/**
 * Generic API call wrapper with error handling
 */
async function apiCall(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    // Check if response is empty
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      // Response is not JSON
      const text = await response.text();
      console.error('Non-JSON response:', text);

      // If it's an HTML error page, it means the API endpoint doesn't exist or Vercel dev isn't running
      if (text.includes('<!DOCTYPE') || text.includes('<html')) {
        throw new Error('API server not running. Please start the Vercel dev server with: vercel dev');
      }

      throw new Error(`Server returned non-JSON response: ${text.substring(0, 100)}`);
    }

    const data = await response.json();

    if (!response.ok) {
      // Create error with message and attach full response data
      const error = new Error(data.message || `API error: ${response.status}`);
      error.response = data; // Attach full response data including errors/details
      error.status = response.status;
      throw error;
    }

    return data;
  } catch (error) {
    console.error(`API call failed: ${endpoint}`, error);

    // More specific error messages
    if (error.name === 'SyntaxError' && error.message.includes('JSON')) {
      throw new Error('API server returned invalid response. Make sure Vercel dev server is running.');
    }

    if (error.message.includes('Failed to fetch')) {
      throw new Error('Cannot connect to API server. Please check if the server is running.');
    }

    throw error;
  }
}

/**
 * API call wrapper with offline support
 * - In online mode: Makes regular API call and caches response
 * - In offline mode: Returns cached data if available
 * - For mutations in offline mode: Queues changes for later sync
 */
async function apiCallWithOfflineSupport(endpoint, options = {}, cacheConfig = {}) {
  const {
    storeName = null,
    cacheKey = null,
    cacheable = true,
    mutation = false,
    syncAction = null
  } = cacheConfig;

  // Check if we're offline
  if (isOfflineMode()) {
    console.log(`[Offline Mode] Handling request: ${endpoint}`);

    // For mutations (POST, PUT, DELETE), queue them for sync
    if (mutation && onlineOfflineContext) {
      console.log(`[Offline Mode] Queueing mutation for sync: ${endpoint}`);

      const queueId = onlineOfflineContext.addToSyncQueue({
        type: syncAction || 'GENERIC_MUTATION',
        endpoint: endpoint,
        method: options.method || 'POST',
        data: options.body ? JSON.parse(options.body) : {}
      });

      // Note: We don't cache mutations to IndexedDB immediately because:
      // 1. The data might not have the required keyPath (e.g., 'id' field)
      // 2. Mutations are already queued for sync
      // 3. They'll be properly cached when the sync completes successfully

      return {
        status: 'success',
        message: 'Changes saved locally and queued for sync',
        offline: true,
        queueId
      };
    }

    // For read operations, try to get from cache
    if (cacheable && storeName) {
      console.log(`[Offline Mode] Retrieving from cache: ${storeName}`);

      let cachedData;
      if (cacheKey) {
        cachedData = await offlineStorage.get(storeName, cacheKey);
      } else {
        cachedData = await offlineStorage.getAll(storeName);
      }

      if (cachedData) {
        return {
          status: 'success',
          data: cachedData,
          offline: true,
          cached: true
        };
      }

      throw new Error('No cached data available for offline use');
    }

    throw new Error('Cannot perform this operation while offline');
  }

  // Online mode - make API call
  try {
    const result = await apiCall(endpoint, options);

    // Cache the response if cacheable
    if (cacheable && storeName && result.status === 'success') {
      try {
        if (Array.isArray(result.data)) {
          await offlineStorage.putBulk(storeName, result.data);
        } else if (result.data) {
          await offlineStorage.put(storeName, result.data);
        }
        await offlineStorage.setLastSyncTime(storeName);
      } catch (cacheError) {
        console.warn('Failed to cache response:', cacheError);
        // Don't fail the request if caching fails
      }
    }

    return result;
  } catch (error) {
    // If online API call fails, try to fall back to cache for read operations
    if (!mutation && cacheable && storeName) {
      console.warn('API call failed, attempting to use cached data:', error);

      let cachedData;
      if (cacheKey) {
        cachedData = await offlineStorage.get(storeName, cacheKey);
      } else {
        cachedData = await offlineStorage.getAll(storeName);
      }

      if (cachedData) {
        return {
          status: 'success',
          data: cachedData,
          offline: true,
          cached: true,
          warning: 'Using cached data due to API failure'
        };
      }
    }

    throw error;
  }
}

// ============================================================================
// AUTHENTICATION
// ============================================================================

/**
 * Login user with multi-role support
 */
export const loginUser = async (email, password) => {
  try {
    const result = await apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    return result;
  } catch (error) {
    return {
      status: 'error',
      message: error.message || 'Login failed'
    };
  }
};

/**
 * Verify authentication token
 */
export const verifyToken = async (token) => {
  try {
    const result = await apiCall('/auth/verify', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });

    return result;
  } catch (error) {
    return {
      status: 'error',
      message: error.message || 'Token verification failed',
      valid: false
    };
  }
};

// ============================================================================
// STUDENTS
// ============================================================================

/**
 * Get all learners/students
 */
export const getLearners = async () => {
  try {
    const { currentTerm, currentYear } = getCurrentTermInfo();
    const result = await apiCallWithOfflineSupport(
      `/students?term=${currentTerm}&year=${currentYear}`,
      {},
      {
        storeName: STORES.STUDENTS,
        cacheable: true,
        mutation: false
      }
    );
    return result;
  } catch (error) {
    console.error('Get learners error:', error);
    throw error;
  }
};

/**
 * Get students by class
 */
export const getStudentsByClass = async (className) => {
  try {
    const result = await apiCallWithOfflineSupport(
      `/students?className=${encodeURIComponent(className)}`,
      {},
      {
        storeName: STORES.STUDENTS,
        cacheable: true,
        mutation: false
      }
    );
    return result;
  } catch (error) {
    console.error('Get students by class error:', error);
    throw error;
  }
};

/**
 * Add new learner/student
 */
export const addLearner = async (studentData) => {
  try {
    // Sanitize input
    const sanitized = sanitizeInput(studentData);

    const result = await apiCall('/students', {
      method: 'POST',
      body: JSON.stringify(sanitized),
    });

    return result;
  } catch (error) {
    console.error('Add learner error:', error);
    throw error;
  }
};

/**
 * Update learner/student
 */
export const updateLearner = async (studentData) => {
  try {
    const sanitized = sanitizeInput(studentData);

    const result = await apiCall('/students', {
      method: 'PUT',
      body: JSON.stringify(sanitized),
    });

    return result;
  } catch (error) {
    console.error('Update learner error:', error);
    throw error;
  }
};

/**
 * Delete learner/student
 */
export const deleteLearner = async (studentId) => {
  try {
    const result = await apiCall(`/students?id=${studentId}`, {
      method: 'DELETE',
    });

    return result;
  } catch (error) {
    console.error('Delete learner error:', error);
    throw error;
  }
};

/**
 * Bulk delete learners
 */
export const bulkDeleteLearners = async (studentIds) => {
  try {
    const result = await apiCall('/students?bulk=true', {
      method: 'DELETE',
      body: JSON.stringify({ ids: studentIds }),
    });

    return result;
  } catch (error) {
    console.error('Bulk delete learners error:', error);
    throw error;
  }
};

// ============================================================================
// TEACHERS
// ============================================================================

/**
 * Get all teachers
 */
export const getTeachers = async () => {
  try {
    const result = await apiCall('/teachers');
    // Map snake_case fields to camelCase
    if (result.status === 'success' && result.data) {
      result.data = result.data.map(mapObjectToCamelCase);
    }
    return result;
  } catch (error) {
    console.error('Get teachers error:', error);
    throw error;
  }
};

/**
 * Add new teacher
 */
export const addTeacher = async (teacherData) => {
  try {
    const sanitized = sanitizeInput(teacherData);

    // Debug: Log what we're sending to the API
    console.log('🔍 Original teacher data:', teacherData);
    console.log('🔍 Sanitized teacher data:', sanitized);
    console.log('🔍 primaryRole value:', sanitized.primaryRole);
    console.log('🔍 primaryRole type:', typeof sanitized.primaryRole);

    const result = await apiCall('/teachers', {
      method: 'POST',
      body: JSON.stringify(sanitized),
    });

    return result;
  } catch (error) {
    console.error('Add teacher error:', error);
    throw error;
  }
};

/**
 * Update teacher
 */
export const updateTeacher = async (teacherData) => {
  try {
    const sanitized = sanitizeInput(teacherData);

    console.log('Updating teacher with data:', sanitized);

    const result = await apiCall('/teachers', {
      method: 'PUT',
      body: JSON.stringify(sanitized),
    });

    return result;
  } catch (error) {
    console.error('Update teacher error:', error);
    console.error('Teacher data that failed:', teacherData);

    // If error has details from API, include them in the error message
    if (error.response && error.response.details) {
      const detailedError = new Error(error.message + ' - ' + JSON.stringify(error.response.details));
      detailedError.details = error.response.details;
      throw detailedError;
    }

    throw error;
  }
};

/**
 * Delete teacher
 */
export const deleteTeacher = async (teacherId) => {
  try {
    const result = await apiCall(`/teachers?id=${teacherId}`, {
      method: 'DELETE',
    });

    return result;
  } catch (error) {
    console.error('Delete teacher error:', error);
    throw error;
  }
};

/**
 * Bulk delete teachers
 */
export const bulkDeleteTeachers = async (teacherIds) => {
  try {
    const result = await apiCall('/teachers?bulk=true', {
      method: 'DELETE',
      body: JSON.stringify({ ids: teacherIds }),
    });

    return result;
  } catch (error) {
    console.error('Bulk delete teachers error:', error);
    throw error;
  }
};

// ============================================================================
// MARKS / SCORES
// ============================================================================

/**
 * Get marks for a class and subject
 */
export const getMarks = async (className, subject, term = null) => {
  try {
    const { currentTerm } = getCurrentTermInfo();
    const termParam = term || currentTerm;

    const result = await apiCallWithOfflineSupport(
      `/marks?className=${encodeURIComponent(className)}&subject=${encodeURIComponent(subject)}&term=${encodeURIComponent(termParam)}`,
      {},
      {
        storeName: STORES.MARKS,
        cacheable: true,
        mutation: false
      }
    );

    return result;
  } catch (error) {
    console.error('Get marks error:', error);
    throw error;
  }
};

/**
 * Get student report data (all subjects)
 */
export const getStudentReportData = async (studentId, term) => {
  try {
    const result = await apiCallWithOfflineSupport(
      `/marks?studentId=${studentId}&term=${encodeURIComponent(term)}`,
      {},
      {
        storeName: STORES.MARKS,
        cacheable: true,
        mutation: false
      }
    );

    return result;
  } catch (error) {
    console.error('Get student report data error:', error);
    throw error;
  }
};

/**
 * Update student scores
 */
export const updateStudentScores = async (scoreData) => {
  try {
    const sanitized = sanitizeInput(scoreData);

    const result = await apiCallWithOfflineSupport(
      '/marks',
      {
        method: 'POST',
        body: JSON.stringify(sanitized),
      },
      {
        storeName: STORES.MARKS,
        cacheable: false,
        mutation: true,
        syncAction: 'UPDATE_MARKS'
      }
    );

    return result;
  } catch (error) {
    console.error('Update student scores error:', error);
    throw error;
  }
};

// ============================================================================
// REMARKS
// ============================================================================

/**
 * Get form master remarks for a student
 */
export const getFormMasterRemarks = async (studentId, className) => {
  try {
    const result = await apiCallWithOfflineSupport(
      `/remarks?studentId=${studentId}&className=${encodeURIComponent(className)}`,
      {},
      {
        storeName: STORES.REMARKS,
        cacheable: true,
        mutation: false
      }
    );
    return result;
  } catch (error) {
    console.error('Get form master remarks error:', error);
    throw error;
  }
};

/**
 * Update form master remarks
 */
export const updateFormMasterRemarks = async (remarkData) => {
  try {
    const sanitized = sanitizeInput(remarkData);

    const result = await apiCallWithOfflineSupport(
      '/remarks',
      {
        method: 'POST',
        body: JSON.stringify(sanitized),
      },
      {
        storeName: STORES.REMARKS,
        cacheable: false,
        mutation: true,
        syncAction: 'UPDATE_REMARKS'
      }
    );

    return result;
  } catch (error) {
    console.error('Update form master remarks error:', error);
    throw error;
  }
};

// ============================================================================
// CLASSES
// ============================================================================

/**
 * Get all classes
 */
export const getClasses = async () => {
  try {
    const result = await apiCall('/classes');
    return result;
  } catch (error) {
    console.error('Get classes error:', error);
    throw error;
  }
};

/**
 * Save/Create a class
 */
export const saveClass = async (classData) => {
  try {
    const sanitized = sanitizeInput(classData);

    const result = await apiCall('/classes', {
      method: 'POST',
      body: JSON.stringify(sanitized),
    });

    return result;
  } catch (error) {
    console.error('Save class error:', error);
    throw error;
  }
};

/**
 * Delete a class
 */
export const deleteClass = async (className) => {
  try {
    const result = await apiCall(`/classes?name=${encodeURIComponent(className)}`, {
      method: 'DELETE',
    }, {
      cacheable: false,
      mutation: true,
      syncAction: 'DELETE_CLASS',
      storeName: 'classes'
    });

    return result;
  } catch (error) {
    console.error('Delete class error:', error);
    throw error;
  }
};

// ============================================================================
// ANALYTICS & TRENDS
// ============================================================================

/**
 * Get class performance trends across all terms
 */
export const getClassPerformanceTrends = async (className, subject) => {
  try {
    const result = await apiCall(
      `/analytics/trends?className=${encodeURIComponent(className)}&subject=${encodeURIComponent(subject)}`
    );
    return result;
  } catch (error) {
    console.error('Get class performance trends error:', error);
    // Return empty trend data if API fails
    return {
      status: 'success',
      data: {
        'First Term': { averageScore: 0, studentCount: 0 },
        'Second Term': { averageScore: 0, studentCount: 0 },
        'Third Term': { averageScore: 0, studentCount: 0 }
      }
    };
  }
};

/**
 * Get all marks for analytics
 */
export const getAllMarksForAnalytics = async () => {
  try {
    const result = await apiCall('/analytics/all-marks');
    return result;
  } catch (error) {
    console.error('Get all marks for analytics error:', error);
    throw error;
  }
};

/**
 * Get system statistics
 */
export const getSystemStats = async () => {
  try {
    const result = await apiCall('/analytics/stats');
    return result;
  } catch (error) {
    console.error('Get system stats error:', error);
    throw error;
  }
};

/**
 * Get teacher progress statistics for leaderboard
 */
export const getTeacherProgressStats = async () => {
  try {
    const result = await apiCall('/analytics/teacher-progress');
    return result;
  } catch (error) {
    console.error('Get teacher progress stats error:', error);
    throw error;
  }
};

/**
 * Get comprehensive class performance analytics
 */
export const getClassPerformanceAnalytics = async (className, subject = null, term = null, year = null) => {
  try {
    const params = new URLSearchParams();
    params.append('className', className);
    if (subject) params.append('subject', subject);
    if (term) params.append('term', term);
    if (year) params.append('year', year);

    const result = await apiCall(`/analytics/class-performance?${params.toString()}`);
    return result;
  } catch (error) {
    console.error('Get class performance analytics error:', error);
    throw error;
  }
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Test database connection
 * Note: This now tests API connectivity instead of direct database connection
 */
export const testConnection = async () => {
  try {
    const result = await apiCall('/students?limit=1');
    return {
      status: 'success',
      message: 'API connection successful',
      data: result
    };
  } catch (error) {
    return {
      status: 'error',
      message: 'API connection failed: ' + error.message
    };
  }
};

// ============================================================================
// BROADSHEET API
// ============================================================================

/**
 * Get comprehensive broadsheet data for a class
 * Includes all students, subjects, and scores
 * Used for printing class broadsheets and subject broadsheets
 *
 * @param {String} className - Class name (e.g., "BS7", "KG1")
 * @param {String} term - Optional term filter (e.g., "First Term")
 * @returns {Promise<Object>} Broadsheet data with students, subjects, and scores
 */
export const getClassBroadsheet = async (className, term = null) => {
  try {
    const params = new URLSearchParams({ className });
    if (term) {
      params.append('term', term);
    }

    // Add timeout to prevent hanging (30 seconds)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch(`${API_BASE}/broadsheet?${params.toString()}`, {
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (fetchError) {
      clearTimeout(timeoutId);

      if (fetchError.name === 'AbortError') {
        throw new Error('Request timed out. The broadsheet data is taking too long to load. Try with a smaller class or contact support.');
      }
      throw fetchError;
    }
  } catch (error) {
    console.error('Error fetching class broadsheet:', error);
    return {
      status: 'error',
      message: 'Failed to fetch broadsheet data: ' + error.message,
      data: {
        students: [],
        subjects: [],
        scores: []
      }
    };
  }
};

// ============================================================================
// MIGRATION HELPER
// ============================================================================

/**
 * Check if a function is available
 * Helps during migration from old api.js to new api-client.js
 */
export const isFunctionAvailable = (functionName) => {
  const availableFunctions = [
    'loginUser', 'verifyToken',
    'getLearners', 'getStudentsByClass', 'addLearner', 'updateLearner', 'deleteLearner', 'bulkDeleteLearners',
    'getTeachers', 'addTeacher', 'updateTeacher', 'deleteTeacher', 'bulkDeleteTeachers',
    'getMarks', 'getStudentReportData', 'updateStudentScores',
    'getClasses',
    'getClassBroadsheet',
    'testConnection'
  ];

  return availableFunctions.includes(functionName);
};

/**
 * Get list of all available API functions
 */
export const getAvailableFunctions = () => {
  return [
    '✅ Authentication: loginUser, verifyToken',
    '✅ Students: getLearners, getStudentsByClass, addLearner, updateLearner, deleteLearner, bulkDeleteLearners',
    '✅ Teachers: getTeachers, addTeacher, updateTeacher, deleteTeacher, bulkDeleteTeachers',
    '✅ Marks: getMarks, getStudentReportData, updateStudentScores',
    '✅ Classes: getClasses, saveClass, deleteClass',
    '✅ Analytics: getClassPerformanceTrends, getAllMarksForAnalytics, getSystemStats, getTeacherProgressStats',
    '✅ Remarks: getFormMasterRemarks, updateFormMasterRemarks',
    '⏳ Broadsheet: Coming soon',
  ];
};

// ============================================================================
// BULK IMPORT/EXPORT
// ============================================================================

/**
 * Import students in bulk from CSV data
 */
export const importStudents = async (studentsData) => {
  try {
    // For now, call addLearner for each student
    // In the future, this could be optimized with a dedicated bulk endpoint
    const results = [];
    for (const student of studentsData) {
      try {
        const result = await addLearner(student);
        results.push({ success: true, student, result });
      } catch (error) {
        results.push({ success: false, student, error: error.message });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    return {
      status: 'success',
      message: `Imported ${successCount} students successfully, ${failCount} failed`,
      data: {
        successCount,
        failCount,
        results
      }
    };
  } catch (error) {
    console.error('Import students error:', error);
    throw error;
  }
};

/**
 * Import teachers in bulk from CSV data
 */
export const importTeachers = async (teachersData) => {
  try {
    // For now, call addTeacher for each teacher
    // In the future, this could be optimized with a dedicated bulk endpoint
    const results = [];
    for (const teacher of teachersData) {
      try {
        const result = await addTeacher(teacher);
        results.push({ success: true, teacher, result });
      } catch (error) {
        results.push({ success: false, teacher, error: error.message });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    return {
      status: 'success',
      message: `Imported ${successCount} teachers successfully, ${failCount} failed`,
      data: {
        successCount,
        failCount,
        results
      }
    };
  } catch (error) {
    console.error('Import teachers error:', error);
    throw error;
  }
};

// ============================================================================
// PASSWORD MANAGEMENT
// ============================================================================

/**
 * Change user password (generic)
 * ✅ NOW IMPLEMENTED with secure API endpoint
 */
export const changePassword = async (userId, currentPassword, newPassword) => {
  try {
    const result = await apiCall('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({
        teacherId: userId,
        currentPassword,
        newPassword
      }),
    });

    return result;
  } catch (error) {
    console.error('Change password error:', error);
    throw error;
  }
};

/**
 * Change teacher password specifically
 * ✅ NOW IMPLEMENTED with secure API endpoint
 */
export const changeTeacherPassword = async (teacherId, currentPassword, newPassword) => {
  try {
    const result = await apiCall('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({
        teacherId,
        currentPassword,
        newPassword
      }),
    });

    return result;
  } catch (error) {
    console.error('Change teacher password error:', error);
    throw error;
  }
};

// ============================================================================
// SUBJECTS & CLASS MANAGEMENT
// ============================================================================

/**
 * Get all subjects
 */
export const getSubjects = async () => {
  try {
    // Placeholder - would call /api/subjects
    console.warn('getSubjects: Using placeholder data');
    return {
      status: 'success',
      data: [
        { id: 1, name: 'Mathematics', code: 'MATH' },
        { id: 2, name: 'English Language', code: 'ENG' },
        { id: 3, name: 'Science', code: 'SCI' },
        { id: 4, name: 'Social Studies', code: 'SOC' },
        { id: 5, name: 'Ghanaian Language', code: 'GHA' },
        { id: 6, name: 'Religious & Moral Education', code: 'RME' },
        { id: 7, name: 'ICT', code: 'ICT' },
        { id: 8, name: 'Creative Arts', code: 'CA' },
        { id: 9, name: 'Physical Education', code: 'PE' }
      ]
    };
  } catch (error) {
    console.error('Get subjects error:', error);
    throw error;
  }
};

/**
 * Get subjects for a specific class (from marks database)
 */
export const getClassSubjects = async (className, term = null) => {
  try {
    const { currentTerm } = getCurrentTermInfo();
    const termParam = term || currentTerm;

    // Approach: Get subjects from both teacher assignments AND marks data
    // This ensures subjects show up even before marks are entered

    const subjectsSet = new Set();

    // 1. Get subjects from teacher assignments (teachers who teach this class)
    try {
      const teachersResult = await apiCall('/teachers');
      if (teachersResult.status === 'success' && teachersResult.data) {
        teachersResult.data.forEach(teacher => {
          // Check if teacher teaches this class
          const teacherClasses = teacher.classes || [];
          if (teacherClasses.includes(className)) {
            // Add all their subjects
            const teacherSubjects = teacher.subjects || [];
            teacherSubjects.forEach(subject => {
              if (subject) subjectsSet.add(subject);
            });
          }
        });
      }
    } catch (error) {
      console.log('Could not fetch teacher assignments:', error.message);
    }

    // 2. Get subjects from marks data (for classes that already have marks)
    try {
      const marksResult = await apiCall(
        `/marks?className=${encodeURIComponent(className)}&term=${encodeURIComponent(termParam)}`
      );

      if (marksResult.status === 'success' && marksResult.data) {
        marksResult.data.forEach(mark => {
          if (mark.subject) subjectsSet.add(mark.subject);
        });
      }
    } catch (error) {
      console.log('Could not fetch marks data:', error.message);
    }

    // Convert Set to sorted array
    const subjects = Array.from(subjectsSet).sort();

    return {
      status: 'success',
      data: subjects
    };
  } catch (error) {
    console.error('Get class subjects error:', error);
    return {
      status: 'success',
      data: []
    };
  }
};

/**
 * Add new subject
 */
export const addSubject = async (subjectData) => {
  try {
    console.warn('addSubject: API endpoint not yet implemented');
    return {
      status: 'error',
      message: 'Add subject endpoint not yet implemented'
    };
  } catch (error) {
    console.error('Add subject error:', error);
    throw error;
  }
};

/**
 * Assign subject to class
 */
export const assignSubjectToClass = async (className, subjectId) => {
  try {
    console.warn('assignSubjectToClass: API endpoint not yet implemented');
    return {
      status: 'error',
      message: 'Assign subject to class endpoint not yet implemented'
    };
  } catch (error) {
    console.error('Assign subject to class error:', error);
    throw error;
  }
};

/**
 * Remove subject from class
 */
export const removeSubjectFromClass = async (className, subjectId) => {
  try {
    console.warn('removeSubjectFromClass: API endpoint not yet implemented');
    return {
      status: 'error',
      message: 'Remove subject from class endpoint not yet implemented'
    };
  } catch (error) {
    console.error('Remove subject from class error:', error);
    throw error;
  }
};

/**
 * Assign role to class (e.g., Form Master)
 */
export const assignClassRole = async (className, teacherId, role) => {
  try {
    console.warn('assignClassRole: API endpoint not yet implemented');
    return {
      status: 'error',
      message: 'Assign class role endpoint not yet implemented'
    };
  } catch (error) {
    console.error('Assign class role error:', error);
    throw error;
  }
};

/**
 * Get custom assessments
 */
export const getCustomAssessments = async () => {
  return apiCallWithOfflineSupport('/assessments', {
    method: 'GET'
  }, {
    storeName: STORES.CUSTOM_ASSESSMENTS,
    cacheKey: 'all_assessments',
    cacheable: true
  });
};

/**
 * Save custom assessment scores
 */
export const saveCustomAssessmentScores = async (scoreData) => {
  const { assessmentId, studentId, subject, score } = scoreData;

  return apiCall('/assessment-scores', {
    method: 'POST',
    body: JSON.stringify({
      assessment_id: assessmentId,
      student_id: studentId,
      subject,
      score
    }),
  });
};

/**
 * Get custom assessment scores
 */
export const getCustomAssessmentScores = async (assessmentId, className, subject) => {
  const params = new URLSearchParams({
    assessment_id: assessmentId,
    class_name: className,
    subject
  });

  return apiCall(`/assessment-scores?${params}`, {
    method: 'GET'
  });
};

/**
 * Get all assessment scores for a student (for aggregate calculation)
 */
export const getStudentAssessmentScores = async (assessmentId, studentId) => {
  const params = new URLSearchParams({
    assessment_id: assessmentId,
    student_id: studentId
  });

  return apiCall(`/student-assessment-scores?${params}`, {
    method: 'GET'
  });
};

/**
 * Get aggregate scores for a class and assessment
 */
export const getClassAggregates = async (assessmentId, className) => {
  const params = new URLSearchParams({
    assessment_id: assessmentId,
    class_name: className
  });

  return apiCall(`/assessment-aggregates?${params}`, {
    method: 'GET'
  });
};
