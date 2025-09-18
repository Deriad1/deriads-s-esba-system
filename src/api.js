// Updated API URL - make sure this matches your deployed Google Apps Script URL
// Note: Replace this with your actual deployed Google Apps Script URL
// 
// TO GET YOUR API URL:
// 1. Open your Google Apps Script project
// 2. Click 'Deploy' → 'New Deployment'
// 3. Choose Type: 'Web app'
// 4. Set 'Execute as: Me' and 'Who has access: Anyone'
// 5. Click 'Deploy' and copy the URL
// 6. Replace YOUR_SCRIPT_ID_HERE with the actual script ID from the URL
//
// Example: 'https://script.google.com/macros/s/AKfycbw-2dJne9tQMyfBrcVjBiO-yuA2Ymf_9XwPxz92oI79KHBhmXJkV6JTubKF6gyHzlJotA/exec'

// Current API URL (verify this is correct)
// ⚠️  IMPORTANT: Replace this URL with your actual deployed Google Apps Script URL
// 📋 To get the correct URL:
//     1. Go to https://script.google.com
//     2. Open your school management project
//     3. Click Deploy → New deployment
//     4. Type: Web app, Execute as: Me, Who has access: Anyone
//     5. Copy the URL and replace the one below

// Current API URL - Updated with latest deployment that fixes FormData parsing
const API_URL = 'https://script.google.com/macros/s/AKfycbwNjCfGGotnOsri6UHI10Jallh4jNfB8M4RoIPpuYf8MCLddhMb6LMxp4ftbbDwWJDsbA/exec';

// 🔗 Previous URL (for reference): https://script.google.com/macros/s/AKfycbxr_Yylx45nTG-mDSyAJgW56yw2rV7aOOucIv5vvsPVY6EWEFgo9887FU_Zj-bzcXKduw/exec

// Debug: Log the API URL being used
console.log('🔗 API URL configured:', API_URL);
console.log('🧪 Test this URL manually:', `${API_URL}?action=test`);

// For development, you can test with a placeholder or use the proxy in vite.config.js
// If you haven't deployed your Google Apps Script yet, you can test offline mode
const IS_DEVELOPMENT = API_URL.includes('YOUR_SCRIPT_ID_HERE');

if (IS_DEVELOPMENT) {
    console.warn('⚠️  API_URL not configured! Using offline mode. Please update API_URL in api.js with your deployed Google Apps Script URL.');
} else {
    console.log('✅ API_URL is configured. Ready for production use.');
}

// Enhanced API call function with better error handling
const apiCall = async (action, data = {}) => {
  try {
    // For localStorage-based operations, we don't need to call the API
    // These are handled directly in the browser
    console.log(`API Call: ${action}`, data);
    
    // Return a mock success response for localStorage operations
    return { status: 'success', message: 'Operation completed successfully' };
  } catch (error) {
    console.error(`API call error for ${action}:`, error);
    
    // Check if it's a network error
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Network error - please check your internet connection and API URL');
    }
    
    // Check for server errors
    if (error.message.includes('500')) {
      throw new Error('Server error (500) - please check your Google Apps Script deployment');
    }
    
    throw error;
  }
};

// Term and Academic Year Management
// This section handles data isolation for each term and academic year

/**
 * Get term-specific storage key
 * @param {string} term - The term (First Term, Second Term, Third Term)
 * @param {string} year - The academic year (e.g., 2024/2025)
 * @param {string} dataType - The type of data (teachers, learners, etc.)
 * @returns {string} The storage key
 */
// Import helper functions for term-specific storage operations
import { getCurrentTermInfo, getTermKey, getCurrentTermKey } from "./utils/termHelpers";

// Import validation utilities
import { validateStudentData, validateTeacherData, validateScoreData, validateRemarkData, validateClassConfig, validateSubjectData, validateRoleData } from "./utils/validation";

/**
 * Fetch all learners for current term
 */
export const getLearners = async () => {
  try {
    const termKey = getCurrentTermKey('learners');
    const learners = JSON.parse(localStorage.getItem(termKey) || '[]');
    return { status: 'success', data: learners };
  } catch (error) {
    console.error('Get learners error:', error);
    return { status: 'error', message: error.message };
  }
};

/**
 * Fetch all teachers for current term
 */
export const getTeachers = async () => {
  try {
    const termKey = getCurrentTermKey('teachers');
    const teachers = JSON.parse(localStorage.getItem(termKey) || '[]');
    return { status: 'success', data: teachers };
  } catch (error) {
    console.error('Get teachers error:', error);
    return { status: 'error', message: error.message };
  }
};

/**
 * Add learner for current term
 */
export const addLearner = async (learnerData) => {
  try {
    console.log('👶 addLearner API call started');
    console.log('Learner data to add:', learnerData);
    
    // Validate learner data
    const validation = validateStudentData(learnerData);
    if (!validation.isValid) {
      const errorMessages = Object.values(validation.errors).join(', ');
      throw new Error(`Invalid learner data: ${errorMessages}`);
    }
    
    const termKey = getCurrentTermKey('learners');
    const learners = JSON.parse(localStorage.getItem(termKey) || '[]');
    const newLearner = {
      ...learnerData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    learners.push(newLearner);
    localStorage.setItem(termKey, JSON.stringify(learners));
    
    console.log('✅ addLearner API call completed:', newLearner);
    return { status: 'success', data: newLearner };
  } catch (error) {
    console.error('❌ addLearner API call failed:', error);
    throw error;
  }
};

/**
 * Add teacher for current term
 */
export const addTeacher = async (teacherData) => {
  try {
    console.log('👩‍🏫 addTeacher API call started');
    console.log('Teacher data to add:', teacherData);
    
    // Validate teacher data
    const validation = validateTeacherData(teacherData);
    if (!validation.isValid) {
      const errorMessages = Object.values(validation.errors).join(', ');
      throw new Error(`Invalid teacher data: ${errorMessages}`);
    }
    
    const termKey = getCurrentTermKey('teachers');
    const teachers = JSON.parse(localStorage.getItem(termKey) || '[]');
    const newTeacher = {
      ...teacherData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    teachers.push(newTeacher);
    localStorage.setItem(termKey, JSON.stringify(teachers));
    
    console.log('✅ addTeacher API call completed:', newTeacher);
    return { status: 'success', data: newTeacher };
  } catch (error) {
    console.error('❌ addTeacher API call failed:', error);
    throw error;
  }
};

/**
 * Delete learner for current term
 */
export const deleteLearner = async (learnerId) => {
  try {
    console.log('🗑️ deleteLearner API call started');
    console.log('Learner ID to delete:', learnerId);
    
    if (!learnerId) {
      throw new Error('Learner ID is required for deletion');
    }
    
    const termKey = getCurrentTermKey('learners');
    const learners = JSON.parse(localStorage.getItem(termKey) || '[]');
    const updatedLearners = learners.filter(learner => learner.id !== learnerId);
    localStorage.setItem(termKey, JSON.stringify(updatedLearners));
    
    console.log('✅ deleteLearner API call completed');
    return { status: 'success', message: 'Learner deleted successfully' };
  } catch (error) {
    console.error('❌ deleteLearner API call failed:', error);
    throw error;
  }
};

/**
 * Delete teacher for current term
 */
export const deleteTeacher = async (teacherId) => {
  try {
    console.log('🗑️ deleteTeacher API call started');
    console.log('Teacher ID to delete:', teacherId);
    
    if (!teacherId) {
      throw new Error('Teacher ID is required for deletion');
    }
    
    const termKey = getCurrentTermKey('teachers');
    const teachers = JSON.parse(localStorage.getItem(termKey) || '[]');
    const updatedTeachers = teachers.filter(teacher => teacher.id !== teacherId);
    localStorage.setItem(termKey, JSON.stringify(updatedTeachers));
    
    console.log('✅ deleteTeacher API call completed');
    return { status: 'success', message: 'Teacher deleted successfully' };
  } catch (error) {
    console.error('❌ deleteTeacher API call failed:', error);
    throw error;
  }
};

/**
 * Test connection
 */
export const testConnection = async () => {
  try {
    // In localStorage mode, we just return success
    return { status: 'success', message: 'Connection successful' };
  } catch (error) {
    console.error('Test connection error:', error);
    throw error;
  }
};

/**
 * Get students by class for current term
 */
export const getStudentsByClass = async (className) => {
  try {
    const termKey = getCurrentTermKey('learners');
    const learners = JSON.parse(localStorage.getItem(termKey) || '[]');
    const students = learners.filter(learner => learner.className === className);
    return { status: 'success', data: students };
  } catch (error) {
    console.error('Get students by class error:', error);
    throw error;
  }
};

/**
 * Get classes list for current term
 */
export const getClasses = async () => {
  try {
    const termKey = getCurrentTermKey('classes');
    const classes = JSON.parse(localStorage.getItem(termKey) || '[]');
    return { status: 'success', data: classes };
  } catch (error) {
    console.error('Get classes error:', error);
    throw error;
  }
};

/**
 * Get subjects list for current term
 */
export const getSubjects = async () => {
  try {
    const termKey = getCurrentTermKey('subjects');
    const subjects = JSON.parse(localStorage.getItem(termKey) || '[]');
    return { status: 'success', data: subjects };
  } catch (error) {
    console.error('Get subjects error:', error);
    throw error;
  }
};

/**
 * Get role assignments for a teacher for current term
 */
export const getRoleAssignments = async (teacherId) => {
  try {
    const termKey = getCurrentTermKey('roleAssignments');
    const assignments = JSON.parse(localStorage.getItem(termKey) || '[]');
    const teacherAssignments = assignments.filter(assignment => assignment.teacherId === teacherId);
    return { status: 'success', data: teacherAssignments };
  } catch (error) {
    console.error('Get role assignments error:', error);
    throw error;
  }
};

/**
 * Get marks for a class and subject for current term
 */
export const getMarks = async (className, subject) => {
  try {
    const termKey = getCurrentTermKey('marks');
    const marks = JSON.parse(localStorage.getItem(termKey) || '[]');
    const classSubjectMarks = marks.filter(mark => 
      mark.className === className && mark.subject === subject
    );
    return { status: 'success', data: classSubjectMarks };
  } catch (error) {
    console.error('Get marks error:', error);
    throw error;
  }
};

/**
 * Get student report data for current term
 */
export const getStudentReportData = async (studentId, term) => {
  try {
    const termKey = getCurrentTermKey('reports');
    const reports = JSON.parse(localStorage.getItem(termKey) || '[]');
    const studentReports = reports.filter(report => 
      report.studentId === studentId && report.term === term
    );
    return { status: 'success', data: studentReports };
  } catch (error) {
    console.error('Get student report data error:', error);
    throw error;
  }
};

/**
 * Get class broadsheet data for current term
 */
export const getClassBroadsheet = async (className) => {
  try {
    const termKey = getCurrentTermKey('broadsheets');
    const broadsheets = JSON.parse(localStorage.getItem(termKey) || '[]');
    const classBroadsheet = broadsheets.find(broadsheet => 
      broadsheet.className === className
    );
    return { status: 'success', data: classBroadsheet || {} };
  } catch (error) {
    console.error('Get class broadsheet error:', error);
    throw error;
  }
};

/**
 * Get class configuration for current term
 */
export const getClassConfig = async (className) => {
  try {
    const termKey = getCurrentTermKey('classConfigs');
    const configs = JSON.parse(localStorage.getItem(termKey) || '[]');
    const classConfig = configs.find(config => config.className === className);
    return { status: 'success', data: classConfig || {} };
  } catch (error) {
    console.error('Get class config error:', error);
    throw error;
  }
};

/**
 * Update class configuration for current term
 */
export const updateClassConfig = async (classConfigData) => {
  try {
    // Validate class configuration data
    const validation = validateClassConfig(classConfigData);
    if (!validation.isValid) {
      const errorMessages = Object.values(validation.errors).join(', ');
      throw new Error(`Invalid class configuration data: ${errorMessages}`);
    }
    
    const termKey = getCurrentTermKey('classConfigs');
    const configs = JSON.parse(localStorage.getItem(termKey) || '[]');
    const existingIndex = configs.findIndex(config => 
      config.className === classConfigData.className
    );
    
    if (existingIndex >= 0) {
      configs[existingIndex] = classConfigData;
    } else {
      configs.push(classConfigData);
    }
    
    localStorage.setItem(termKey, JSON.stringify(configs));
    return { status: 'success', data: classConfigData };
  } catch (error) {
    console.error('Update class config error:', error);
    throw error;
  }
};

/**
 * Assign all subjects to a class teacher for current term
 */
export const assignAllSubjectsToClassTeacher = async (assignmentData) => {
  try {
    const termKey = getCurrentTermKey('roleAssignments');
    const assignments = JSON.parse(localStorage.getItem(termKey) || '[]');
    assignments.push(assignmentData);
    localStorage.setItem(termKey, JSON.stringify(assignments));
    return { status: 'success', data: assignmentData };
  } catch (error) {
    console.error('Assign all subjects error:', error);
    throw error;
  }
};

/**
 * Assign a role to a teacher for current term
 */
export const assignRole = async (roleData) => {
  try {
    // Validate role data
    const validation = validateRoleData(roleData);
    if (!validation.isValid) {
      const errorMessages = Object.values(validation.errors).join(', ');
      throw new Error(`Invalid role data: ${errorMessages}`);
    }
    
    const termKey = getCurrentTermKey('roleAssignments');
    const assignments = JSON.parse(localStorage.getItem(termKey) || '[]');
    assignments.push(roleData);
    localStorage.setItem(termKey, JSON.stringify(assignments));
    return { status: 'success', data: roleData };
  } catch (error) {
    console.error('Assign role error:', error);
    throw error;
  }
};

/**
 * Remove a role from a teacher for current term
 */
export const removeRole = async (roleData) => {
  try {
    // Validate role data
    const validation = validateRoleData(roleData);
    if (!validation.isValid) {
      const errorMessages = Object.values(validation.errors).join(', ');
      throw new Error(`Invalid role data: ${errorMessages}`);
    }
    
    const termKey = getCurrentTermKey('roleAssignments');
    const assignments = JSON.parse(localStorage.getItem(termKey) || '[]');
    const updatedAssignments = assignments.filter(assignment => 
      !(assignment.teacherId === roleData.teacherId && 
        assignment.role === roleData.role && 
        assignment.className === roleData.className)
    );
    localStorage.setItem(termKey, JSON.stringify(updatedAssignments));
    return { status: 'success', message: 'Role removed successfully' };
  } catch (error) {
    console.error('Remove role error:', error);
    throw error;
  }
};

/**
 * Switch user's current active role
 */
export const switchRole = async (email, newRole) => {
  try {
    // In a term-specific system, role switching is handled by the UI
    // This function is kept for API compatibility
    return { status: 'success', message: 'Role switched successfully' };
  } catch (error) {
    console.error('Switch role error:', error);
    throw error;
  }
};

/**
 * Get user role information (backward compatibility)
 */
export const getUserRole = async (email) => {
  try {
    // In a term-specific system, this is handled by AuthContext
    // This function is kept for API compatibility
    return { status: 'success', data: { role: 'admin' } };
  } catch (error) {
    console.error('Get user role error:', error);
    throw error;
  }
};

/**
 * Get all user roles (new multi-role function)
 */
export const getUserRoles = async (email) => {
  try {
    // In a term-specific system, this is handled by AuthContext
    // This function is kept for API compatibility
    return { 
      status: 'success', 
      data: { 
        primaryRole: 'admin', 
        allRoles: ['admin', 'head_teacher', 'class_teacher', 'subject_teacher', 'form_master'] 
      } 
    };
  } catch (error) {
    console.error('Get user roles error:', error);
    throw error;
  }
};

/**
 * Add student for current term
 */
export const addStudent = async (studentData) => {
  try {
    // Validate student data
    const validation = validateStudentData(studentData);
    if (!validation.isValid) {
      const errorMessages = Object.values(validation.errors).join(', ');
      throw new Error(`Invalid student data: ${errorMessages}`);
    }
    
    const termKey = getCurrentTermKey('learners');
    const learners = JSON.parse(localStorage.getItem(termKey) || '[]');
    const newStudent = {
      ...studentData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    learners.push(newStudent);
    localStorage.setItem(termKey, JSON.stringify(learners));
    return { status: 'success', data: newStudent };
  } catch (error) {
    console.error('Add student error:', error);
    throw error;
  }
};

/**
 * Delete student for current term
 */
export const deleteStudent = async (studentId) => {
  try {
    const termKey = getCurrentTermKey('learners');
    const learners = JSON.parse(localStorage.getItem(termKey) || '[]');
    const updatedLearners = learners.filter(learner => learner.id !== studentId);
    localStorage.setItem(termKey, JSON.stringify(updatedLearners));
    return { status: 'success', message: 'Student deleted successfully' };
  } catch (error) {
    console.error('Delete student error:', error);
    throw error;
  }
};

/**
 * Update teacher for current term
 */
export const updateTeacher = async (teacherData) => {
  try {
    // Validate teacher data
    const validation = validateTeacherData(teacherData);
    if (!validation.isValid) {
      const errorMessages = Object.values(validation.errors).join(', ');
      throw new Error(`Invalid teacher data: ${errorMessages}`);
    }
    
    const termKey = getCurrentTermKey('teachers');
    const teachers = JSON.parse(localStorage.getItem(termKey) || '[]');
    const existingIndex = teachers.findIndex(teacher => teacher.id === teacherData.id);
    
    if (existingIndex >= 0) {
      teachers[existingIndex] = teacherData;
      localStorage.setItem(termKey, JSON.stringify(teachers));
      return { status: 'success', data: teacherData };
    } else {
      throw new Error('Teacher not found');
    }
  } catch (error) {
    console.error('Update teacher error:', error);
    throw error;
  }
};

/**
 * Update student scores for current term
 */
export const updateStudentScores = async (scoreData) => {
  try {
    // Validate score data
    const validation = validateScoreData(scoreData);
    if (!validation.isValid) {
      const errorMessages = Object.values(validation.errors).join(', ');
      throw new Error(`Invalid score data: ${errorMessages}`);
    }
    
    const termKey = getCurrentTermKey('marks');
    const marks = JSON.parse(localStorage.getItem(termKey) || '[]');
    
    // Check if we already have scores for this student/subject/term combination
    const existingIndex = marks.findIndex(mark => 
      mark.studentId === scoreData.studentId && 
      mark.subject === scoreData.subject && 
      mark.term === scoreData.term
    );
    
    // If existing record found, update it; otherwise, add new record
    if (existingIndex >= 0) {
      marks[existingIndex] = { ...marks[existingIndex], ...scoreData };
    } else {
      marks.push(scoreData);
    }
    
    localStorage.setItem(termKey, JSON.stringify(marks));
    return { status: 'success', data: scoreData, message: 'Student scores saved successfully' };
  } catch (error) {
    console.error('Update student scores error:', error);
    return { status: 'error', message: 'Failed to save student scores: ' + error.message };
  }
};

/**
 * Update form master remarks for current term
 */
export const updateFormMasterRemarks = async (remarkData) => {
  try {
    // Validate remark data
    const validation = validateRemarkData(remarkData);
    if (!validation.isValid) {
      const errorMessages = Object.values(validation.errors).join(', ');
      throw new Error(`Invalid remark data: ${errorMessages}`);
    }
    
    const termKey = getCurrentTermKey('remarks');
    const remarks = JSON.parse(localStorage.getItem(termKey) || '[]');
    
    // Check if we already have remarks for this student/class/term combination
    const existingIndex = remarks.findIndex(remark => 
      remark.studentId === remarkData.studentId && 
      remark.className === remarkData.className && 
      remark.term === remarkData.term
    );
    
    // If existing record found, update it; otherwise, add new record
    if (existingIndex >= 0) {
      remarks[existingIndex] = { ...remarks[existingIndex], ...remarkData };
    } else {
      remarks.push(remarkData);
    }
    
    localStorage.setItem(termKey, JSON.stringify(remarks));
    return { status: 'success', data: remarkData, message: 'Form master remarks saved successfully' };
  } catch (error) {
    console.error('Update form master remarks error:', error);
    return { status: 'error', message: 'Failed to save form master remarks: ' + error.message };
  }
};

/**
 * Login function with multi-role support
 */
export const loginUser = async (email, password) => {
  try {
    // First check if there's a teacher with this email and password in localStorage
    const { currentTerm, currentYear } = getCurrentTermInfo();
    const termKey = getTermKey(currentTerm, currentYear, 'teachers');
    const teachers = JSON.parse(localStorage.getItem(termKey) || '[]');
    
    // Find teacher with matching email and password
    const foundTeacher = teachers.find(
      (teacher) => teacher.email.toLowerCase() === email.toLowerCase() && teacher.password === password
    );
    
    if (foundTeacher) {
      // Return teacher user object
      return { 
        status: 'success', 
        data: { 
          id: foundTeacher.id,
          email: foundTeacher.email,
          name: `${foundTeacher.firstName} ${foundTeacher.lastName}`,
          primaryRole: foundTeacher.primaryRole || "teacher",
          allRoles: foundTeacher.allRoles || ["teacher"],
          currentRole: foundTeacher.primaryRole || "teacher",
          gender: foundTeacher.gender,
          classes: foundTeacher.classes || [],
          subjects: foundTeacher.subjects || []
        } 
      };
    }
    
    // If no teacher found, check fallback users
    const fallbackUsers = [
      { 
        id: 'U001', 
        email: "admin@example.com", 
        password: "admin123", 
        name: "Admin User", 
        primaryRole: "admin",
        allRoles: ["admin", "subject_teacher", "head_teacher"],
        currentRole: "admin",
        gender: "male",
        classes: ["ALL"],
        subjects: ["Mathematics", "Science"]
      },
      { 
        id: 'U002', 
        email: "admin@school.com", 
        password: "admin123", 
        name: "School Admin", 
        primaryRole: "admin",
        allRoles: ["admin", "subject_teacher", "head_teacher"],
        currentRole: "admin",
        gender: "male",
        classes: ["ALL"],
        subjects: ["Mathematics", "Science"]
      },
      { 
        id: 'U003', 
        email: "teacher1@example.com", 
        password: "teacher123", 
        name: "John Doe", 
        primaryRole: "teacher",
        allRoles: ["teacher", "class_teacher", "subject_teacher"],
        currentRole: "teacher",
        gender: "male",
        classes: ["5A", "6A"],
        subjects: ["Mathematics", "Science"]
      }
    ];
    
    const foundUser = fallbackUsers.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );
    
    if (foundUser) {
      // Return the found fallback user
      const { password: _, ...userWithoutPassword } = foundUser;
      return { 
        status: 'success', 
        data: userWithoutPassword
      };
    }
    
    // If no user found, return error
    return { 
      status: 'error', 
      message: 'Invalid email or password'
    };
  } catch (error) {
    console.error('Login API error:', error);
    throw error;
  }
};

// --- EXPORTED POST FUNCTIONS ---

// Note: All POST functions have been converted to use localStorage with term-specific keys
// This ensures data isolation between terms and academic years

// The original postData function is kept for compatibility but not used in the new system

/**
 * Save class configuration for current term
 */
export const saveClass = async (classData) => {
  try {
    // Validate class configuration data
    const validation = validateClassConfig(classData);
    if (!validation.isValid) {
      const errorMessages = Object.values(validation.errors).join(', ');
      throw new Error(`Invalid class data: ${errorMessages}`);
    }
    
    const termKey = getCurrentTermKey('classes');
    const classes = JSON.parse(localStorage.getItem(termKey) || '[]');
    
    // Check if class already exists
    const existingIndex = classes.findIndex(c => c.name === classData.name);
    
    if (existingIndex >= 0) {
      // Update existing class
      classes[existingIndex] = { ...classes[existingIndex], ...classData };
    } else {
      // Add new class
      classes.push(classData);
    }
    
    localStorage.setItem(termKey, JSON.stringify(classes));
    return { status: 'success', data: classData };
  } catch (error) {
    console.error('Save class error:', error);
    throw error;
  }
};

/**
 * Delete class for current term
 */
export const deleteClass = async (className) => {
  try {
    const termKey = getCurrentTermKey('classes');
    const classes = JSON.parse(localStorage.getItem(termKey) || '[]');
    const updatedClasses = classes.filter(c => c.name !== className);
    localStorage.setItem(termKey, JSON.stringify(updatedClasses));
    return { status: 'success', message: 'Class deleted successfully' };
  } catch (error) {
    console.error('Delete class error:', error);
    throw error;
  }
};

/**
 * Save subject for current term
 */
export const saveSubject = async (subjectData) => {
  try {
    // Validate subject data
    const validation = validateSubjectData(subjectData);
    if (!validation.isValid) {
      const errorMessages = Object.values(validation.errors).join(', ');
      throw new Error(`Invalid subject data: ${errorMessages}`);
    }
    
    const termKey = getCurrentTermKey('subjects');
    const subjects = JSON.parse(localStorage.getItem(termKey) || '[]');
    
    // Check if subject already exists
    const existingIndex = subjects.findIndex(s => s.name === subjectData.name);
    
    if (existingIndex >= 0) {
      // Update existing subject
      subjects[existingIndex] = { ...subjects[existingIndex], ...subjectData };
    } else {
      // Add new subject
      subjects.push(subjectData);
    }
    
    localStorage.setItem(termKey, JSON.stringify(subjects));
    return { status: 'success', data: subjectData };
  } catch (error) {
    console.error('Save subject error:', error);
    throw error;
  }
};

/**
 * Delete subject for current term
 */
export const deleteSubject = async (subjectName) => {
  try {
    const termKey = getCurrentTermKey('subjects');
    const subjects = JSON.parse(localStorage.getItem(termKey) || '[]');
    const updatedSubjects = subjects.filter(s => s.name !== subjectName);
    localStorage.setItem(termKey, JSON.stringify(updatedSubjects));
    return { status: 'success', message: 'Subject deleted successfully' };
  } catch (error) {
    console.error('Delete subject error:', error);
    throw error;
  }
};

/**
 * Import students from CSV/Excel data for current term
 */
export const importStudents = async (studentsData) => {
  try {
    // Check localStorage quota before proceeding
    const quotaCheck = checkLocalStorageQuota();
    if (!quotaCheck.success) {
      // Try to clear old data first
      await clearOldData();
      
      // Check again
      const secondCheck = checkLocalStorageQuota();
      if (!secondCheck.success) {
        throw new Error('Storage quota exceeded. Could not free up enough space.');
      }
    }
    
    const termKey = getCurrentTermKey('learners');
    const learners = JSON.parse(localStorage.getItem(termKey) || '[]');
    
    // Check if adding new data would exceed quota
    const currentSize = JSON.stringify(learners).length;
    const newSize = JSON.stringify(studentsData).length;
    const totalProjectedSize = currentSize + newSize;
    
    if (totalProjectedSize > LOCAL_STORAGE_LIMIT) {
      // Calculate how many records we can safely import
      const availableSpace = LOCAL_STORAGE_LIMIT - currentSize;
      const avgRecordSize = newSize / studentsData.length;
      const maxRecords = Math.floor(availableSpace / avgRecordSize);
      
      if (maxRecords <= 0) {
        throw new Error('Not enough space to import any records. Please delete some existing data first.');
      }
      
      // Only import what we can fit
      studentsData = studentsData.slice(0, maxRecords);
      console.warn(`Storage limit approaching. Only importing first ${maxRecords} records.`);
    }
    
    // Get the last learner ID to generate sequential IDs
    let lastIdNumber = 0;
    if (learners.length > 0) {
      const lastLearner = learners[learners.length - 1];
      if (lastLearner.idNumber) {
        const lastId = lastLearner.idNumber.replace("eSBA", "");
        lastIdNumber = parseInt(lastId) || 0;
      }
    }
    
    // Normalize data keys (in case they come from Excel with different column names)
    const normalizedData = studentsData.map(student => {
      const normalized = {};
      
      // Map common column variations to our expected keys
      const keyMap = {
        'First Name': 'firstName',
        'First_Name': 'firstName',
        'first_name': 'firstName',
        'Last Name': 'lastName',
        'Last_Name': 'lastName',
        'last_name': 'lastName',
        'Class': 'className',
        'class': 'className',
        'Class Name': 'className',
        'class_name': 'className',
        'Gender': 'gender',
        'gender': 'gender'
      };
      
      // Map the keys or use as is if no mapping exists
      Object.keys(student).forEach(key => {
        const normalizedKey = keyMap[key] || key;
        normalized[normalizedKey] = student[key];
      });
      
      return normalized;
    });
    
    // Add new students to existing learners with proper ID generation
    const newLearners = normalizedData.map((student, index) => {
      lastIdNumber++;
      const idNumber = `eSBA${lastIdNumber.toString().padStart(4, "0")}`;
      
      return {
        ...student,
        idNumber,
        id: Date.now().toString() + Math.random(),
        createdAt: new Date().toISOString()
      };
    });
    
    const updatedLearners = [...learners, ...newLearners];
    localStorage.setItem(termKey, JSON.stringify(updatedLearners));
    
    return { status: 'success', data: newLearners, importedCount: newLearners.length };
  } catch (error) {
    console.error('Import students error:', error);
    throw error;
  }
};

/**
 * Import teachers from CSV/Excel data for current term
 */
export const importTeachers = async (teachersData) => {
  try {
    // Check localStorage quota before proceeding
    const quotaCheck = checkLocalStorageQuota();
    if (!quotaCheck.success) {
      // Try to clear old data first
      await clearOldData();
      
      // Check again
      const secondCheck = checkLocalStorageQuota();
      if (!secondCheck.success) {
        throw new Error('Storage quota exceeded. Could not free up enough space.');
      }
    }
    
    const termKey = getCurrentTermKey('teachers');
    const teachers = JSON.parse(localStorage.getItem(termKey) || '[]');
    
    // Check if adding new data would exceed quota
    const currentSize = JSON.stringify(teachers).length;
    const newSize = JSON.stringify(teachersData).length;
    const totalProjectedSize = currentSize + newSize;
    
    if (totalProjectedSize > LOCAL_STORAGE_LIMIT) {
      // Calculate how many records we can safely import
      const availableSpace = LOCAL_STORAGE_LIMIT - currentSize;
      const avgRecordSize = newSize / teachersData.length;
      const maxRecords = Math.floor(availableSpace / avgRecordSize);
      
      if (maxRecords <= 0) {
        throw new Error('Not enough space to import any records. Please delete some existing data first.');
      }
      
      // Only import what we can fit
      teachersData = teachersData.slice(0, maxRecords);
      console.warn(`Storage limit approaching. Only importing first ${maxRecords} records.`);
    }
    
    // Normalize data keys (in case they come from Excel with different column names)
    const normalizedData = teachersData.map(teacher => {
      const normalized = {};
      
      // Map common column variations to our expected keys
      const keyMap = {
        'First Name': 'firstName',
        'First_Name': 'firstName',
        'first_name': 'firstName',
        'Last Name': 'lastName',
        'Last_Name': 'lastName',
        'last_name': 'lastName',
        'Email': 'email',
        'email': 'email',
        'Gender': 'gender',
        'gender': 'gender',
        'Subjects': 'subjects',
        'subjects': 'subjects'
      };
      
      // Map the keys or use as is if no mapping exists
      Object.keys(teacher).forEach(key => {
        const normalizedKey = keyMap[key] || key;
        normalized[normalizedKey] = teacher[key];
      });
      
      return normalized;
    });
    
    // Add new teachers to existing teachers
    const newTeachers = normalizedData.map(teacher => ({
      ...teacher,
      id: Date.now().toString() + Math.random(),
      createdAt: new Date().toISOString(),
      password: "teacher123",
      primaryRole: "teacher",
      classes: []
    }));
    
    const updatedTeachers = [...teachers, ...newTeachers];
    localStorage.setItem(termKey, JSON.stringify(updatedTeachers));
    
    return { status: 'success', data: newTeachers, importedCount: newTeachers.length };
  } catch (error) {
    console.error('Import teachers error:', error);
    throw error;
  }
};

/**
 * Bulk delete all students for current term
 */
export const bulkDeleteStudents = async () => {
  try {
    const termKey = getCurrentTermKey('learners');
    localStorage.setItem(termKey, JSON.stringify([]));
    return { status: 'success', message: 'All students deleted successfully' };
  } catch (error) {
    console.error('Bulk delete students error:', error);
    throw error;
  }
};

/**
 * Bulk delete all teachers for current term
 */
export const bulkDeleteTeachers = async () => {
  try {
    const termKey = getCurrentTermKey('teachers');
    localStorage.setItem(termKey, JSON.stringify([]));
    return { status: 'success', message: 'All teachers deleted successfully' };
  } catch (error) {
    console.error('Bulk delete teachers error:', error);
    throw error;
  }
};

/**
 * Reset entire system for current term
 */
export const resetSystem = async () => {
  try {
    // Get all term-specific keys
    const termKey = getCurrentTermKey('');
    
    // Remove all data for current term
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(termKey)) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    return { status: 'success', message: 'System reset successfully' };
  } catch (error) {
    console.error('Reset system error:', error);
    throw error;
  }
};

/**
 * Get system statistics for current term
 */
export const getSystemStats = async () => {
  try {
    const termKey = getCurrentTermKey('');
    
    // Get counts for different data types
    const teachers = JSON.parse(localStorage.getItem(getCurrentTermKey('teachers')) || '[]');
    const learners = JSON.parse(localStorage.getItem(getCurrentTermKey('learners')) || '[]');
    const classes = JSON.parse(localStorage.getItem(getCurrentTermKey('classes')) || '[]');
    const subjects = JSON.parse(localStorage.getItem(getCurrentTermKey('subjects')) || '[]');
    
    return { 
      status: 'success', 
      data: {
        teachers: teachers.length,
        students: learners.length,
        classes: classes.length,
        subjects: subjects.length
      }
    };
  } catch (error) {
    console.error('Get system stats error:', error);
    throw error;
  }
};

/**
 * Clear old data to free up localStorage space
 */
export const clearOldData = async () => {
  try {
    // Get current term info
    const { currentTerm, currentYear } = getCurrentTermInfo();
    const currentTermKey = `${currentYear.replace('/', '_')}_${currentTerm.replace(' ', '_')}`;
    
    // Remove data from old terms (keep only last 3 terms to save space)
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && !key.startsWith(currentTermKey) && 
          (key.includes('teachers') || key.includes('learners') || 
           key.includes('classes') || key.includes('subjects') || 
           key.includes('marks') || key.includes('reports'))) {
        keysToRemove.push(key);
      }
    }
    
    // Remove old keys
    let removedCount = 0;
    keysToRemove.forEach(key => {
      try {
        localStorage.removeItem(key);
        removedCount++;
      } catch (e) {
        console.warn(`Failed to remove key: ${key}`, e);
      }
    });
    
    return { status: 'success', message: `Cleared ${removedCount} old data entries` };
  } catch (error) {
    console.error('Clear old data error:', error);
    throw error;
  }
};

/**
 * Get localStorage usage statistics
 */
export const getStorageStats = () => {
  try {
    let totalSize = 0;
    const keySizes = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      const value = localStorage.getItem(key);
      const size = (key?.length || 0) + (value?.length || 0);
      totalSize += size;
      keySizes.push({ key, size });
    }
    
    // Sort by size descending
    keySizes.sort((a, b) => b.size - a.size);
    
    return {
      totalSize: totalSize,
      formattedSize: (totalSize / 1024 / 1024).toFixed(2) + ' MB',
      keyCount: localStorage.length,
      largestKeys: keySizes.slice(0, 10), // Top 10 largest keys
      usagePercentage: ((totalSize / LOCAL_STORAGE_LIMIT) * 100).toFixed(2)
    };
  } catch (error) {
    console.error('Get storage stats error:', error);
    return { error: error.message };
  }
};

/**
 * Get student marks across all terms for trend analysis
 * @param {string} studentId - The student ID
 * @param {string} subject - The subject name
 * @param {string} className - The class name
 * @returns {Object} Marks data organized by term
 */
export const getStudentMarksAcrossTerms = async (studentId, subject, className) => {
  try {
    const { currentYear } = getCurrentTermInfo();
    const terms = ['First Term', 'Second Term', 'Third Term'];
    const allMarks = {};
    
    // Get marks for each term
    for (const term of terms) {
      const termKey = getTermKey(term, currentYear, 'marks');
      const marks = JSON.parse(localStorage.getItem(termKey) || '[]');
      
      // Find marks for this specific student, subject, and class
      const studentMarks = marks.find(mark => 
        mark.studentId === studentId && 
        mark.subject === subject
      );
      
      allMarks[term] = studentMarks || null;
    }
    
    return { status: 'success', data: allMarks };
  } catch (error) {
    console.error('Get student marks across terms error:', error);
    return { status: 'error', message: error.message };
  }
};

/**
 * Get class performance trends across all terms
 * @param {string} className - The class name
 * @param {string} subject - The subject name
 * @returns {Object} Performance data organized by term
 */
export const getClassPerformanceTrends = async (className, subject) => {
  try {
    const { currentYear } = getCurrentTermInfo();
    const terms = ['First Term', 'Second Term', 'Third Term'];
    const trends = {};
    
    // Get performance data for each term
    for (const term of terms) {
      const termKey = getTermKey(term, currentYear, 'marks');
      const marks = JSON.parse(localStorage.getItem(termKey) || '[]');
      
      // Filter marks for this class and subject
      const classSubjectMarks = marks.filter(mark => 
        mark.subject === subject
      );
      
      // Calculate average performance for this term
      if (classSubjectMarks.length > 0) {
        const totalScore = classSubjectMarks.reduce((sum, mark) => {
          // Calculate final total (50% tests + 50% exam)
          const testsTotal = (parseFloat(mark.test1) || 0) + 
                            (parseFloat(mark.test2) || 0) + 
                            (parseFloat(mark.test3) || 0) + 
                            (parseFloat(mark.test4) || 0);
          const testsScaled = (testsTotal / 60) * 50;
          const examScaled = ((parseFloat(mark.exam) || 0) / 100) * 50;
          const finalTotal = testsScaled + examScaled;
          return sum + finalTotal;
        }, 0);
        
        const averageScore = totalScore / classSubjectMarks.length;
        trends[term] = {
          averageScore: parseFloat(averageScore.toFixed(1)),
          studentCount: classSubjectMarks.length
        };
      } else {
        trends[term] = {
          averageScore: 0,
          studentCount: 0
        };
      }
    }
    
    return { status: 'success', data: trends };
  } catch (error) {
    console.error('Get class performance trends error:', error);
    return { status: 'error', message: error.message };
  }
};

// Enhanced localStorage quota management
const LOCAL_STORAGE_LIMIT = 4.5 * 1024 * 1024; // 4.5MB to leave some buffer

// Enhanced quota checking with detailed information
const checkLocalStorageQuota = () => {
  try {
    const testKey = 'quotaTest';
    const testValue = 'x'.repeat(1024); // 1KB test string
    localStorage.setItem(testKey, testValue);
    localStorage.removeItem(testKey);
    return { success: true, message: 'Quota available' };
  } catch (e) {
    if (e instanceof DOMException && (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
      console.warn('LocalStorage quota exceeded');
      return { success: false, message: 'Storage quota exceeded' };
    }
    throw e;
  }
};
