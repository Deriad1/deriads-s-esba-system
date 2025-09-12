/**
 * @fileoverview Google Apps Script for Education Management System (SDA B Basic School)
 * @suppress {uselessCode}
 * 
 * Note: This file contains valid JavaScript/Google Apps Script code.
 * The 'stringify' references are part of JSON.stringify() which is correct.
 * Any spell checker warnings can be safely ignored.
 * 
 * Last Updated: 2025-01-10
 * Backend for React School Management System
 */

// =================================================================
//  MAIN ROUTER FUNCTIONS (doGet, doPost) - Google Apps Script Compatible
// =================================================================

/**
 * Handle OPTIONS requests for CORS preflight
 * Note: Google Apps Script automatically handles CORS for web apps deployed with "Anyone" access
 * This function provides a proper response to preflight requests
 */
function doOptions(e) {
  // Google Apps Script automatically handles CORS when deployed as web app with "Anyone" access
  // Just return a simple JSON response
  return ContentService
    .createTextOutput('{"status":"ok","message":"CORS preflight handled"}')
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  try {
    const params = e.parameter || {};
    const action = params.action;
    
    // Add CORS headers for all responses
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    };
    
    if (!action) {
      throw new Error('No action specified in GET request');
    }

    let result;
    switch (action) {
      case 'login':
        if (!params.email || !params.password) {
          throw new Error('Email and password are required for login');
        }
        result = loginUser(params.email, params.password);
        break;
      case 'getUserRole':
      case 'getUserRoles':
        if (!params.email) {
          throw new Error('Email is required for getting user roles');
        }
        result = getUserRoles(params.email);
        break;
      case 'getLearners':
        result = getLearners();
        break;
      case 'getTeachers':
        result = getTeachers();
        break;
      case 'getStudentsByClass':
        if (!params.className) {
          throw new Error('Class name is required');
        }
        result = getStudentsByClass(params.className);
        break;
      case 'getMarks':
        if (!params.className || !params.subject) {
          throw new Error('Class name and subject are required');
        }
        result = getMarks(params.className, params.subject);
        break;
      case 'getStudentReportData':
        if (!params.studentId || !params.term) {
          throw new Error('Student ID and term are required');
        }
        result = getStudentReportData(params.studentId, params.term);
        break;
      case 'getClassBroadsheet':
        if (!params.className) {
          throw new Error('Class name is required for broadsheet');
        }
        result = getClassBroadsheet(params.className);
        break;
      case 'getClassConfig':
        if (!params.className) {
          throw new Error('Class name is required for class config');
        }
        result = getClassConfig(params.className);
        break;
      case 'getClasses':
        result = getClasses();
        break;
      case 'getSubjects':
        result = getSubjects();
        break;
      case 'test':
        result = { message: 'API is working!', timestamp: new Date(), version: '1.0.1' };
        break;
      default:
        throw new Error('Invalid GET action specified: ' + action);
    }
    
    const output = ContentService
      .createTextOutput(JSON.stringify({ status: 'success', data: result }))
      .setMimeType(ContentService.MimeType.JSON);
    
    // Note: Google Apps Script handles CORS automatically for web apps, 
    // but we log the intent here
    Logger.log('Response headers would include CORS headers');
    
    return output;
      
  } catch (error) {
    Logger.log('doGet Error: ' + error.toString());
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    let requestData;
    
    Logger.log('POST request received');
    Logger.log('e.postData:', e.postData);
    Logger.log('e.parameter:', e.parameter);
    
    // Handle FormData first (sent from frontend)
    if (e.parameter && e.parameter.data) {
      Logger.log('Processing FormData with data parameter');
      try {
        requestData = JSON.parse(e.parameter.data);
        Logger.log('Successfully parsed FormData:', JSON.stringify(requestData));
      } catch (parseError) {
        Logger.log('FormData parse failed:', parseError.toString());
        throw new Error('Invalid data format in FormData: ' + parseError.toString());
      }
    }
    // Handle JSON POST data as fallback
    else if (e.postData && e.postData.contents) {
      Logger.log('Processing JSON POST data');
      try {
        requestData = JSON.parse(e.postData.contents);
        Logger.log('Successfully parsed JSON:', JSON.stringify(requestData));
      } catch (parseError) {
        Logger.log('JSON parse failed:', parseError.toString());
        throw new Error('Invalid JSON format in POST data: ' + parseError.toString());
      }
    }
    // Last resort - check for direct parameters
    else if (e.parameter && Object.keys(e.parameter).length > 0) {
      Logger.log('Found parameters:', JSON.stringify(e.parameter));
      // Try to extract action and payload from parameters
      if (e.parameter.action) {
        requestData = {
          action: e.parameter.action,
          payload: e.parameter.payload ? JSON.parse(e.parameter.payload) : {}
        };
      } else {
        throw new Error('No action found in parameters');
      }
    } else {
      throw new Error('No POST data received');
    }
    
    const action = requestData.action;
    const payload = requestData.payload || {};
    if (!action) {
      throw new Error('No action specified in POST request');
    }
    
    Logger.log('POST Action: ' + action);
    Logger.log('POST Payload: ' + JSON.stringify(payload));

    let result;
    switch (action) {
      case 'addTeacher':
        if (!payload.firstName || !payload.email) {
          throw new Error('First name and email are required for adding a teacher');
        }
        result = addTeacher(payload);
        break;
      case 'updateTeacher':
        result = updateTeacher(payload);
        break;
      case 'deleteTeacher':
        if (!payload.teacherId) {
          throw new Error('Teacher ID is required');
        }
        result = deleteTeacher(payload.teacherId);
        break;
      case 'assignRole':
        result = assignRole(payload);
        break;
      case 'removeRole':
        result = removeRole(payload);
        break;
      case 'getRoleAssignments':
        if (!payload.teacherId) {
          throw new Error('Teacher ID is required');
        }
        result = getRoleAssignments(payload.teacherId);
        break;
      case 'switchRole':
        result = switchRole(payload);
        break;
      case 'addStudent':
      case 'addLearner':
        result = addLearner(payload);
        break;
      case 'deleteStudent':
      case 'deleteLearner':
        result = deleteLearner(payload.studentId || payload.learnerId);
        break;
      case 'updateStudentScores':
        result = updateStudentScores(payload);
        break;
      case 'updateClassConfig':
        if (!payload.className) {
          throw new Error('Class name is required for class config update');
        }
        result = updateClassConfig(payload);
        break;
      case 'assignAllSubjectsToClassTeacher':
        if (!payload.className || !payload.teacherId) {
          throw new Error('Class name and teacher ID are required');
        }
        result = assignAllSubjectsToClassTeacher(payload);
        break;
      case 'updateFormMasterRemarks':
        result = updateFormMasterRemarks(payload);
        break;
      default:
        throw new Error('Invalid POST action specified: ' + action);
    }
    
    const output = ContentService
      .createTextOutput(JSON.stringify({ status: 'success', data: result }))
      .setMimeType(ContentService.MimeType.JSON);
    
    Logger.log('POST response prepared successfully');
    
    return output;
      
  } catch (error) {
    Logger.log('doPost Error: ' + error.toString());
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// =================================================================
//  HELPER FUNCTIONS
// =================================================================
const ss = SpreadsheetApp.getActiveSpreadsheet();

function getSheet(name) { 
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    Logger.log(`Sheet "${name}" not found. Creating it...`);
    sheet = createSheet(name);
  }
  return sheet;
}

function createSheet(name) {
  const sheet = ss.insertSheet(name);
  
  switch (name) {
    case 'Learners':
      sheet.appendRow(['LearnerID', 'First Name', 'Last Name', 'Gender', 'Class']);
      break;
    case 'Teachers':
      sheet.appendRow([
        'TeacherID', 'First Name', 'Last Name', 'Gender', 'Email', 
        'Password', 'Primary_Role', 'All_Roles', 'Classes', 'Subjects', 'Active'
      ]);
      break;
    case 'Broadsheet':
      sheet.appendRow([
        'Class', 'Subject', 'Learner Name', 'Test 1', 'Test 2', 'Test 3', 'Test 4',
        'Total (60)', 'Scaled (50%)', 'Exam (100)', 'Exam Scaled (50%)', 'Total Score', 'Position', 'Remarks'
      ]);
      break;
    case 'Hobbies':
      sheet.appendRow(['LearnerID', 'Name', 'Class', 'Interests', 'Hobbies', 'Attitude', 'Class Teacher Remarks']);
      break;
    case 'Attendance':
      sheet.appendRow(['Attendance_ID', 'LearnerID', 'Name', 'Class', 'Days Present', 'Total School Days']);
      break;
    case 'ClassConfig':
      sheet.appendRow(['Class', 'Subject', 'TeacherID', 'Active']);
      break;
  }
  return sheet;
}

function generateId(prefix = 'eSBA') {
  const timestamp = new Date().getTime().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}${timestamp}${random}`;
}

function formatFullName(firstName, lastName) {
  return `${String(firstName || '').trim()} ${String(lastName || '').trim()}`.trim();
}

function hashPassword(password) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password)
    .map(byte => ('0' + (byte & 0xFF).toString(16)).slice(-2))
    .join('');
}

// =================================================================
//  AUTHENTICATION & USER MANAGEMENT
// =================================================================

function loginUser(email, password) {
  try {
    Logger.log('Login attempt for: ' + email);
    
    const teachersSheet = getSheet('Teachers');
    const teacherData = teachersSheet.getDataRange().getValues();
    
    const hashedPassword = hashPassword(password);
    
    // Skip header row
    for (let i = 1; i < teacherData.length; i++) {
      const row = teacherData[i];
      
      // Match your sheet structure: TeacherID | First Name | Last Name | Gender | Email | Password | Primary_Role | All_Roles | Classes | Subjects | Active
      if (row[4] && row[4].toLowerCase() === email.toLowerCase() && row[5] === hashedPassword) {
        const allRoles = row[7] ? row[7].toString().split(',').map(r => r.trim()) : [row[6]];
        
        Logger.log('Login successful from Teachers sheet');
        return {
          id: row[0],
          email: row[4],
          name: formatFullName(row[1], row[2]),
          primaryRole: row[6] || 'teacher',
          allRoles: allRoles,
          currentRole: row[6] || 'teacher',
          gender: row[3] || '',
          classes: row[8] ? row[8].toString().split(',').map(c => c.trim()) : [],
          subjects: row[9] ? row[9].toString().split(',').map(s => s.trim()) : [],
          active: row[10] !== false && row[10] !== 'false'
        };
      }
    }
    
    Logger.log('Login failed - invalid credentials');
    throw new Error('Invalid email or password');
  } catch (error) {
    Logger.log('loginUser Error: ' + error.toString());
    throw error;
  }
}

function getUserRoles(email) {
  try {
    const teachersSheet = getSheet('Teachers');
    const teacherData = teachersSheet.getDataRange().getValues();
    
    for (let i = 1; i < teacherData.length; i++) {
      const row = teacherData[i];
      if (row[4] && row[4].toLowerCase() === email.toLowerCase()) {
        return {
          allRoles: row[7] ? row[7].toString().split(',').map(r => r.trim()) : [row[6] || 'teacher'],
          primaryRole: row[6] || 'teacher',
          classes: row[8] ? row[8].toString().split(',').map(c => c.trim()) : [],
          subjects: row[9] ? row[9].toString().split(',').map(s => s.trim()) : []
        };
      }
    }
  } catch (e) {
    Logger.log('Error getting user roles: ' + e.toString());
  }
  return { allRoles: ['guest'], primaryRole: 'guest', classes: [], subjects: [] };
}

function switchRole(payload) {
  const userRoles = getUserRoles(payload.email);
  
  if (userRoles.allRoles.includes(payload.newRole)) {
    return { 
      message: 'Role switched successfully', 
      currentRole: payload.newRole
    };
  } else {
    throw new Error('User does not have permission for this role');
  }
}

/**
 * Assign a role to a teacher (admin function)
 */
function assignRole(roleData) {
  try {
    const teachersSheet = getSheet('Teachers');
    const data = teachersSheet.getDataRange().getValues();
    
    // Find teacher by ID or email
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[0] === roleData.teacherId || row[4] === roleData.email) {
        // Get current roles
        const currentRoles = row[7] ? row[7].toString().split(',').map(r => r.trim()) : [row[6] || 'teacher'];
        
        // Add new role if not already present
        if (!currentRoles.includes(roleData.role)) {
          currentRoles.push(roleData.role);
          
          // Update the all_roles column
          teachersSheet.getRange(i + 1, 8).setValue(currentRoles.join(', '));
          
          return { 
            message: `Role '${roleData.role}' assigned successfully to ${row[1]} ${row[2]}`,
            teacherId: row[0],
            updatedRoles: currentRoles
          };
        } else {
          return { 
            message: `Teacher already has the role '${roleData.role}'`,
            teacherId: row[0],
            currentRoles: currentRoles
          };
        }
      }
    }
    
    throw new Error('Teacher not found');
  } catch (error) {
    Logger.log('assignRole Error: ' + error.toString());
    throw new Error('Failed to assign role: ' + error.toString());
  }
}

/**
 * Remove a role from a teacher (admin function)
 */
function removeRole(roleData) {
  try {
    const teachersSheet = getSheet('Teachers');
    const data = teachersSheet.getDataRange().getValues();
    
    // Find teacher by ID or email
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[0] === roleData.teacherId || row[4] === roleData.email) {
        // Get current roles
        const currentRoles = row[7] ? row[7].toString().split(',').map(r => r.trim()) : [row[6] || 'teacher'];
        
        // Remove role if present (but keep at least one role)
        const filteredRoles = currentRoles.filter(role => role !== roleData.role);
        
        if (filteredRoles.length === 0) {
          throw new Error('Cannot remove all roles from a teacher');
        }
        
        if (filteredRoles.length < currentRoles.length) {
          // Update the all_roles column
          teachersSheet.getRange(i + 1, 8).setValue(filteredRoles.join(', '));
          
          // If we removed the primary role, set new primary role
          if (row[6] === roleData.role) {
            teachersSheet.getRange(i + 1, 7).setValue(filteredRoles[0]);
          }
          
          return { 
            message: `Role '${roleData.role}' removed successfully from ${row[1]} ${row[2]}`,
            teacherId: row[0],
            updatedRoles: filteredRoles
          };
        } else {
          return { 
            message: `Teacher does not have the role '${roleData.role}'`,
            teacherId: row[0],
            currentRoles: currentRoles
          };
        }
      }
    }
    
    throw new Error('Teacher not found');
  } catch (error) {
    Logger.log('removeRole Error: ' + error.toString());
    throw new Error('Failed to remove role: ' + error.toString());
  }
}

/**
 * Get role assignments for a teacher
 */
function getRoleAssignments(teacherId) {
  try {
    const teachersSheet = getSheet('Teachers');
    const data = teachersSheet.getDataRange().getValues();
    
    // Find teacher by ID
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[0] === teacherId) {
        return {
          teacherId: row[0],
          name: formatFullName(row[1], row[2]),
          email: row[4],
          primaryRole: row[6] || 'teacher',
          allRoles: row[7] ? row[7].toString().split(',').map(r => r.trim()) : [row[6] || 'teacher'],
          classes: row[8] ? row[8].toString().split(',').map(c => c.trim()) : [],
          subjects: row[9] ? row[9].toString().split(',').map(s => s.trim()) : [],
          active: row[10] !== false && row[10] !== 'false'
        };
      }
    }
    
    throw new Error('Teacher not found');
  } catch (error) {
    Logger.log('getRoleAssignments Error: ' + error.toString());
    throw new Error('Failed to get role assignments: ' + error.toString());
  }
}

// =================================================================
//  LEARNER MANAGEMENT
// =================================================================

function getLearners() {
  try {
    const learnersSheet = getSheet('Learners');
    const data = learnersSheet.getDataRange().getValues();
    if (data.length <= 1) return []; // Only headers or empty
    
    const learners = data.slice(1).filter(row => row[0]).map((row, index) => ({
      id: index + 1,
      idNumber: row[0],        // LearnerID (Column A)
      LearnerID: row[0],       // For backward compatibility
      firstName: row[1] || '', // First Name (Column B)
      lastName: row[2] || '',  // Last Name (Column C)
      gender: row[3] || '',    // Gender (Column D)
      className: row[4] || ''  // Class (Column E)
    }));
    
    return learners;
  } catch (error) {
    Logger.log('getLearners Error: ' + error.toString());
    throw new Error('Failed to get learners: ' + error.toString());
  }
}

function addLearner(payload) {
  try {
    Logger.log('Adding learner with payload: ' + JSON.stringify(payload));
    
    if (!payload) {
      throw new Error('No payload provided');
    }
    
    if (!payload.firstName || !payload.className) {
      throw new Error('First name and class name are required');
    }
    
    // Sanitize inputs
    const sanitizedPayload = {
      firstName: String(payload.firstName).trim().replace(/[<>\"&]/g, ''),
      lastName: String(payload.lastName || '').trim().replace(/[<>\"&]/g, ''),
      gender: String(payload.gender || '').trim().replace(/[<>\"&]/g, ''),
      className: String(payload.className).trim().replace(/[<>\"&]/g, ''),
      idNumber: payload.idNumber ? String(payload.idNumber).trim() : null
    };
    
    const learnersSheet = getSheet('Learners');
    const learnerID = sanitizedPayload.idNumber || payload.studentId || generateId('eSBA');
    
    // Match your Learners sheet structure: LearnerID | First Name | Last Name | Gender | Class
    learnersSheet.appendRow([
      learnerID,                    // Column A: LearnerID
      sanitizedPayload.firstName,   // Column B: First Name
      sanitizedPayload.lastName,    // Column C: Last Name
      sanitizedPayload.gender,      // Column D: Gender
      sanitizedPayload.className    // Column E: Class
    ]);
    
    Logger.log('Learner added successfully: ' + learnerID);
    
    return { 
      message: `Learner ${sanitizedPayload.firstName} ${sanitizedPayload.lastName || ''} added successfully.`,
      learnerId: learnerID
    };
  } catch (error) {
    Logger.log('addLearner Error: ' + error.toString());
    throw new Error('Failed to add learner: ' + error.toString());
  }
}

function deleteLearner(learnerId) {
  try {
    if (!learnerId) {
      throw new Error('Learner ID is required');
    }
    
    const learnersSheet = getSheet('Learners');
    const data = learnersSheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === learnerId) {
        learnersSheet.deleteRow(i + 1);
        return { message: `Learner ${learnerId} deleted successfully.` };
      }
    }
    throw new Error('Learner ID not found: ' + learnerId);
  } catch (error) {
    Logger.log('deleteLearner Error: ' + error.toString());
    throw new Error('Failed to delete learner: ' + error.toString());
  }
}

function getStudentsByClass(className) {
  const learners = getLearners();
  return learners.filter(l => l.className === className);
}

// =================================================================
//  TEACHER MANAGEMENT
// =================================================================

function getTeachers() {
  try {
    const teachersSheet = getSheet('Teachers');
    const data = teachersSheet.getDataRange().getValues();
    if (data.length <= 1) return [];
    
    const teachers = data.slice(1).filter(row => row[0]).map((row, index) => ({
      id: index + 1,
      teacherID: row[0],           // Column A: TeacherID
      firstName: row[1] || '',     // Column B: First Name
      lastName: row[2] || '',      // Column C: Last Name
      name: formatFullName(row[1], row[2]),
      gender: row[3] || '',        // Column D: Gender
      email: row[4] || '',         // Column E: Email
      primaryRole: row[6] || 'teacher',  // Column G: Primary_Role
      allRoles: row[7] ? row[7].toString().split(',').map(r => r.trim()) : [row[6] || 'teacher'], // Column H: All_Roles
      classes: row[8] ? row[8].toString().split(',').map(c => c.trim()) : [], // Column I: Classes
      subjects: row[9] ? row[9].toString().split(',').map(s => s.trim()) : [], // Column J: Subjects
      active: row[10] !== false && row[10] !== 'false' // Column K: Active
    }));
    
    return teachers;
  } catch (error) {
    Logger.log('getTeachers Error: ' + error.toString());
    return [];
  }
}

function addTeacher(payload) {
  try {
    Logger.log('Adding teacher with payload: ' + JSON.stringify(payload));
    
    if (!payload) {
      throw new Error('No payload provided');
    }
    
    if (!payload.firstName || !payload.email) {
      throw new Error('First name and email are required');
    }
    
    const teachersSheet = getSheet('Teachers');
    const teacherID = generateId('TCH');
    
    // Handle arrays properly
    const subjects = Array.isArray(payload.subjects) ? payload.subjects.join(', ') : (payload.subjects || '');
    const classes = Array.isArray(payload.classes) ? payload.classes.join(', ') : (payload.classes || '');
    const allRoles = payload.allRoles ? 
      (Array.isArray(payload.allRoles) ? payload.allRoles.join(', ') : payload.allRoles) : 
      (payload.primaryRole || 'teacher');
    
    const password = payload.password || 'teacher123';
    const hashedPassword = hashPassword(password);
    
    // Sanitize inputs
    const sanitizedPayload = {
      firstName: String(payload.firstName).trim().replace(/[<>\"&]/g, ''),
      lastName: String(payload.lastName || '').trim().replace(/[<>\"&]/g, ''),
      gender: String(payload.gender || '').trim().replace(/[<>\"&]/g, ''),
      email: String(payload.email).trim().replace(/[<>\"&]/g, ''),
      primaryRole: String(payload.primaryRole || 'teacher').trim(),
      active: payload.active !== undefined ? String(payload.active) : 'true'
    };
    
    // Match your Teachers sheet structure exactly: 
    // TeacherID | First Name | Last Name | Gender | Email | Password | Primary_Role | All_Roles | Classes | Subjects | Active
    teachersSheet.appendRow([
      teacherID,                           // Column A: TeacherID
      sanitizedPayload.firstName,          // Column B: First Name
      sanitizedPayload.lastName,           // Column C: Last Name
      sanitizedPayload.gender,             // Column D: Gender
      sanitizedPayload.email,              // Column E: Email
      hashedPassword,                      // Column F: Password
      sanitizedPayload.primaryRole,        // Column G: Primary_Role
      allRoles,                            // Column H: All_Roles
      classes,                             // Column I: Classes
      subjects,                            // Column J: Subjects
      sanitizedPayload.active              // Column K: Active
    ]);
    
    Logger.log('Teacher added successfully: ' + teacherID);
    
    const fullName = formatFullName(sanitizedPayload.firstName, sanitizedPayload.lastName);
    return { message: `Teacher ${fullName} added successfully with ID ${teacherID}.` };
    
  } catch (error) {
    Logger.log('addTeacher Error: ' + error.toString());
    throw new Error('Failed to add teacher: ' + error.toString());
  }
}

function deleteTeacher(teacherId) {
  try {
    Logger.log('Attempting to delete teacher ID: ' + teacherId);
    
    const teachersSheet = getSheet('Teachers');
    const data = teachersSheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === teacherId) {
        teachersSheet.deleteRow(i + 1);
        Logger.log('Teacher deleted successfully: ' + teacherId);
        return { message: 'Teacher deleted successfully.' };
      }
    }
    
    throw new Error('Teacher not found with ID: ' + teacherId);
  } catch (error) {
    Logger.log('deleteTeacher Error: ' + error.toString());
    throw new Error('Failed to delete teacher: ' + error.toString());
  }
}

function updateTeacher(payload) {
  try {
    const teachersSheet = getSheet('Teachers');
    const data = teachersSheet.getDataRange().getValues();
    
    const subjects = Array.isArray(payload.subjects) ? payload.subjects.join(', ') : (payload.subjects || '');
    const classes = Array.isArray(payload.classes) ? payload.classes.join(', ') : (payload.classes || '');
    const allRoles = payload.allRoles ? 
      (Array.isArray(payload.allRoles) ? payload.allRoles.join(', ') : payload.allRoles) : 
      (payload.primaryRole || 'teacher');
    
    let hashedPassword = data.find(row => row[0] === payload.teacherID)?.[5]; // Keep existing if not provided
    if (payload.password) {
      hashedPassword = hashPassword(payload.password);
    }
    
    // Sanitize inputs
    const sanitizedPayload = {
      firstName: String(payload.firstName || '').trim().replace(/[<>\"&]/g, ''),
      lastName: String(payload.lastName || '').trim().replace(/[<>\"&]/g, ''),
      gender: String(payload.gender || '').trim().replace(/[<>\"&]/g, ''),
      email: String(payload.email || '').trim().replace(/[<>\"&]/g, ''),
      primaryRole: String(payload.primaryRole || 'teacher').trim(),
      active: payload.active !== undefined ? String(payload.active) : 'true'
    };
    
    // Find and update teacher
    let updated = false;
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === payload.teacherID) {
        teachersSheet.getRange(i + 1, 1, 1, 11).setValues([[
          payload.teacherID || data[i][0], // Keep existing ID if not provided
          sanitizedPayload.firstName,
          sanitizedPayload.lastName,
          sanitizedPayload.gender,
          sanitizedPayload.email,
          hashedPassword, // Updated or existing password
          sanitizedPayload.primaryRole,
          allRoles,
          classes,
          subjects,
          sanitizedPayload.active
        ]]);
        updated = true;
        break;
      }
    }
    
    if (!updated) {
      throw new Error('Teacher not found for update');
    }
    
    return { message: 'Teacher updated successfully.' };
  } catch (error) {
    Logger.log('updateTeacher Error: ' + error.toString());
    throw new Error('Failed to update teacher: ' + error.toString());
  }
}

// =================================================================
//  SCORING & MARKS MANAGEMENT
// =================================================================

function getMarks(className, subject) {
  try {
    const learners = getLearners(); // Cache learners data
    const studentsInClass = learners.filter(l => l.className === className);
    const broadsheetSheet = getSheet('Broadsheet');
    const broadsheetData = broadsheetSheet.getDataRange().getValues();
    const scores = [];
    
    studentsInClass.forEach(student => {
      let studentScores = {
        studentId: student.idNumber,
        firstName: student.firstName,
        lastName: student.lastName,
        test1: 0, test2: 0, test3: 0, test4: 0, exam: 0
      };
      
      const studentName = formatFullName(student.firstName, student.lastName).toLowerCase();
      for (let i = 1; i < broadsheetData.length; i++) {
        const row = broadsheetData[i];
        const broadsheetName = (row[2] || '').trim().toLowerCase();
        if (row[0] === className && row[1] === subject && broadsheetName === studentName) {
          studentScores.test1 = row[3] || 0;
          studentScores.test2 = row[4] || 0;
          studentScores.test3 = row[5] || 0;
          studentScores.test4 = row[6] || 0;
          studentScores.exam = row[9] || 0;
          break;
        }
      }
      scores.push(studentScores);
    });
    
    return scores;
  } catch (error) {
    Logger.log('getMarks Error: ' + error.toString());
    throw new Error('Failed to get marks: ' + error.toString());
  }
}

function updateStudentScores(payload) {
  try {
    const broadsheetSheet = getSheet('Broadsheet');
    const data = broadsheetSheet.getDataRange().getValues();
    
    const learners = getLearners();
    const student = learners.find(l => l.idNumber === payload.studentId);
    if (!student) throw new Error('Student not found: ' + payload.studentId);
    
    const studentName = formatFullName(student.firstName, student.lastName);
    
    // Calculate totals
    const testsTotal = (payload.test1 || 0) + (payload.test2 || 0) + (payload.test3 || 0) + (payload.test4 || 0);
    const testsScaled = (testsTotal / 60) * 50;
    const examScaled = ((payload.exam || 0) / 100) * 50;
    const finalTotal = testsScaled + examScaled;
    
    // Update or create record
    let updated = false;
    let rowIndex = -1;
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[0] === student.className && row[1] === payload.subject && row[2] === studentName) {
        rowIndex = i + 1;
        broadsheetSheet.getRange(rowIndex, 4, 1, 11).setValues([[
          payload.test1 || 0,
          payload.test2 || 0,
          payload.test3 || 0,
          payload.test4 || 0,
          testsTotal,
          testsScaled.toFixed(1),
          payload.exam || 0,
          examScaled.toFixed(1),
          finalTotal.toFixed(1),
          '', // Position to be calculated
          ''
        ]]);
        updated = true;
        break;
      }
    }
    
    if (!updated) {
      rowIndex = data.length + 1;
      broadsheetSheet.appendRow([
        student.className,
        payload.subject,
        studentName,
        payload.test1 || 0,
        payload.test2 || 0,
        payload.test3 || 0,
        payload.test4 || 0,
        testsTotal,
        testsScaled.toFixed(1),
        payload.exam || 0,
        examScaled.toFixed(1),
        finalTotal.toFixed(1),
        '',
        ''
      ]);
    }
    
    // Calculate positions for the class and subject
    const classSubjectData = data.filter(row => row[0] === student.className && row[1] === payload.subject);
    const scoresForRanking = classSubjectData.map((row, idx) => ({
      rowIndex: idx + 2, // 1-based index + header
      total: parseFloat(row[11]) || 0
    })).sort((a, b) => b.total - a.total); // Sort descending
    
    scoresForRanking.forEach((score, index) => {
      broadsheetSheet.getRange(score.rowIndex, 13).setValue(index + 1); // Set position in Column M
    });
    
    Logger.log('Scores updated successfully for: ' + payload.studentId);
    return { message: `Scores for ${payload.studentId} in ${payload.subject} updated successfully.` };
  } catch (error) {
    Logger.log('updateStudentScores Error: ' + error.toString());
    throw new Error('Failed to update scores: ' + error.toString());
  }
}

function updateFormMasterRemarks(payload) {
  try {
    const hobbiesSheet = getSheet('Hobbies');
    const data = hobbiesSheet.getDataRange().getValues();
    
    // Find student info
    const learners = getLearners();
    const student = learners.find(l => l.idNumber === payload.studentId);
    if (!student) throw new Error('Student not found');
    
    const studentName = formatFullName(student.firstName, student.lastName);
    
    // Look for existing record
    let updated = false;
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[0] === payload.studentId) {
        // Update existing record
        hobbiesSheet.getRange(i + 1, 4, 1, 4).setValues([[
          payload.interest || '',    // Interests (Column D)
          payload.hobbies || '',     // Hobbies (Column E)
          payload.attitude || '',    // Attitude (Column F)
          payload.remarks || ''      // Class Teacher Remarks (Column G)
        ]]);
        updated = true;
        break;
      }
    }
    
    if (!updated) {
      // Create new record
      hobbiesSheet.appendRow([
        payload.studentId,          // LearnerID (Column A)
        studentName,                // Name (Column B)
        student.className,          // Class (Column C)
        payload.interest || '',     // Interests (Column D)
        payload.hobbies || '',      // Hobbies (Column E)
        payload.attitude || '',     // Attitude (Column F)
        payload.remarks || ''       // Class Teacher Remarks (Column G)
      ]);
    }
    
    return { message: `Remarks for ${payload.studentId} updated successfully.` };
  } catch (error) {
    Logger.log('updateFormMasterRemarks Error: ' + error.toString());
    throw new Error('Failed to update remarks: ' + error.toString());
  }
}

function getStudentReportData(studentId, term) {
  try {
    const learners = getLearners();
    const student = learners.find(l => l.idNumber === studentId);
    if (!student) throw new Error("Student not found.");
    
    // Get scores from Broadsheet
    const broadsheetSheet = getSheet('Broadsheet');
    const broadsheetData = broadsheetSheet.getDataRange().getValues();
    const scores = [];
    
    const studentName = formatFullName(student.firstName, student.lastName);
    for (let i = 1; i < broadsheetData.length; i++) {
      const row = broadsheetData[i];
      if (row[0] === student.className && row[2] === studentName) {
        scores.push({
          subject: row[1],           // Subject (Column B)
          test1: row[3] || 0,        // Test 1 (Column D)
          test2: row[4] || 0,        // Test 2 (Column E)
          test3: row[5] || 0,        // Test 3 (Column F)
          test4: row[6] || 0,        // Test 4 (Column G)
          exam: row[9] || 0,         // Exam (100) (Column J)
          total: row[11] || 0,       // Total Score (Column L)
          position: row[12] || '',   // Position (Column M)
          remarks: row[13] || ''     // Remarks (Column N)
        });
      }
    }
    
    // Get remarks from Hobbies sheet
    const hobbiesSheet = getSheet('Hobbies');
    const hobbiesData = hobbiesSheet.getDataRange().getValues();
    let remarks = {};
    
    for (let i = 1; i < hobbiesData.length; i++) {
      const row = hobbiesData[i];
      if (row[0] === studentId) {
        remarks = {
          interests: row[3] || '',           // Interests (Column D)
          hobbies: row[4] || '',             // Hobbies (Column E)
          attitude: row[5] || '',            // Attitude (Column F)
          classTeacherRemarks: row[6] || ''  // Class Teacher Remarks (Column G)
        };
        break;
      }
    }
    
    // Get attendance if available
    let attendance = {};
    try {
      const attendanceSheet = getSheet('Attendance');
      const attendanceData = attendanceSheet.getDataRange().getValues();
      for (let i = 1; i < attendanceData.length; i++) {
        const row = attendanceData[i];
        if (row[1] === studentId) { // LearnerID in Column B
          attendance = {
            present: row[4] || 0,    // Days Present (Column E)
            total: row[5] || 0       // Total School Days (Column F)
          };
          break;
        }
      }
    } catch (e) {
      // Attendance sheet might not exist
      Logger.log('Attendance sheet not found or error: ' + e.toString());
    }
    
    return {
      studentDetails: student,
      scores: scores,
      remarks: remarks,
      attendance: attendance,
      term: term  // Include term, though not used for filtering yet
    };
  } catch (error) {
    Logger.log('getStudentReportData Error: ' + error.toString());
    throw new Error('Failed to get student report: ' + error.toString());
  }
}

// =================================================================
//  ADDITIONAL HELPER FUNCTIONS
// =================================================================

function getClasses() {
  try {
    const learners = getLearners();
    const uniqueClasses = [...new Set(learners.map(l => l.className).filter(c => c))];
    return uniqueClasses.map(className => ({
      classId: className,
      className: className,
      classTeacher: '',
      totalStudents: learners.filter(l => l.className === className).length,
      academicYear: new Date().getFullYear(),
      active: true
    }));
  } catch (e) {
    Logger.log('getClasses Error: ' + e.toString());
    return [];
  }
}

function getSubjects() {
  return [
    { subjectId: 'S001', subjectName: 'Mathematics', description: 'Basic Mathematics', active: true },
    { subjectId: 'S002', subjectName: 'English Language', description: 'Communication Skills', active: true },
    { subjectId: 'S003', subjectName: 'Science', description: 'General Science', active: true },
    { subjectId: 'S004', subjectName: 'Social Studies', description: 'History and Geography', active: true },
    { subjectId: 'S005', subjectName: 'Ghanaian Language', description: 'Local Language', active: true },
    { subjectId: 'S006', subjectName: 'Religious and Moral Education (RME)', description: 'Ethics and Values', active: true }
  ];
}

// =================================================================
//  SETUP AND TESTING FUNCTIONS
// =================================================================

function testAPI() {
  Logger.log('=== API Test Results ===');
  
  try {
    Logger.log('Testing getLearners...');
    const learners = getLearners();
    Logger.log('Learners count: ' + learners.length);
    
    Logger.log('Testing getTeachers...');
    const teachers = getTeachers();
    Logger.log('Teachers count: ' + teachers.length);
    
    Logger.log('Testing getClasses...');
    const classes = getClasses();
    Logger.log('Classes count: ' + classes.length);
    
    Logger.log('Testing getSubjects...');
    const subjects = getSubjects();
    Logger.log('Subjects count: ' + subjects.length);
    
    Logger.log('=== API Test Completed Successfully ===');
    return { 
      message: 'API test completed successfully',
      learners: learners.length,
      teachers: teachers.length,
      classes: classes.length,
      subjects: subjects.length
    };
  } catch (error) {
    Logger.log('API test failed: ' + error.toString());
    throw new Error('API test failed: ' + error.toString());
  }
}

function initializeTestData() {
  try {
    Logger.log('Initializing test data...');
    
    // Add sample learners
    const testLearners = [
      { firstName: 'John', lastName: 'Smith', gender: 'male', className: 'Class 6A' },
      { firstName: 'Mary', lastName: 'Johnson', gender: 'female', className: 'Class 6A' },
      { firstName: 'David', lastName: 'Brown', gender: 'male', className: 'Class 6B' }
    ];
    
    testLearners.forEach(learner => {
      try {
        addLearner(learner);
      } catch (e) {
        Logger.log('Error adding test learner: ' + e.toString());
      }
    });
    
    // Add sample teachers with proper structure
    const testTeachers = [
      { 
        firstName: 'Alice', lastName: 'Williams', gender: 'female', email: 'alice@school.com', 
        password: 'teacher123', primaryRole: 'subject_teacher', 
        subjects: ['Mathematics', 'Science'], classes: ['6A', '6B']
      },
      { 
        firstName: 'Bob', lastName: 'Davis', gender: 'male', email: 'bob@school.com', 
        password: 'teacher123', primaryRole: 'class_teacher', 
        subjects: ['English Language', 'Social Studies'], classes: ['6A']
      },
      { 
        firstName: 'Carol', lastName: 'Wilson', gender: 'female', email: 'carol@school.com', 
        password: 'admin123', primaryRole: 'admin', 
        allRoles: ['admin', 'head_teacher', 'subject_teacher'],
        subjects: ['ALL'], classes: ['ALL']
      }
    ];
    
    testTeachers.forEach(teacher => {
      try {
        addTeacher(teacher);
      } catch (e) {
        Logger.log('Error adding test teacher: ' + e.toString());
      }
    });
    
    Logger.log('Test data initialization completed');
    return { message: 'Test data initialized successfully' };
  } catch (error) {
    Logger.log('initializeTestData Error: ' + error.toString());
    throw new Error('Failed to initialize test data: ' + error.toString());
  }
}

function ensureCorrectLoginData() {
  try {
    Logger.log('Setting up login data...');
    
    const teachersSheet = getSheet('Teachers');
    
    // Add admin users if they don't exist
    const data = teachersSheet.getDataRange().getValues();
    let adminExists = false;
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][4] && data[i][4].toLowerCase() === 'admin@school.com') {
        adminExists = true;
        break;
      }
    }
    
    if (!adminExists) {
      const adminPassword = hashPassword('admin123');
      teachersSheet.appendRow([
        'ADMIN001',                    // TeacherID
        'Admin',                       // First Name
        'User',                        // Last Name
        'Male',                        // Gender
        'admin@school.com',            // Email
        adminPassword,                 // Password (hashed)
        'admin',                       // Primary_Role
        'admin,head_teacher,subject_teacher', // All_Roles
        'ALL',                         // Classes
        'Mathematics,Science,English Language', // Subjects
        'true'                         // Active
      ]);
      
      Logger.log('Admin user added successfully');
    }
    
    Logger.log('Login data setup completed');
    return { message: 'Login data setup completed successfully' };
  } catch (error) {
    Logger.log('ensureCorrectLoginData Error: ' + error.toString());
    throw new Error('Failed to setup login data: ' + error.toString());
  }
}

/**
 * Get broadsheet data for a specific class (all subjects)
 * @param {string} className - The class name to get broadsheet for
 * @returns {Object} Response with broadsheet data
 */
function getClassBroadsheet(className) {
  try {
    Logger.log('Getting broadsheet for class: ' + className);
    
    const broadsheetSheet = getSheet('Broadsheet');
    const data = broadsheetSheet.getDataRange().getValues();
    
    if (data.length <= 1) {
      Logger.log('No broadsheet data found');
      return [];
    }
    
    const headers = data[0];
    const rows = data.slice(1);
    
    // Filter for the specific class
    const classData = rows.filter(row => {
      const rowClass = row[0]; // Assuming Class is the first column
      return rowClass && rowClass.toString().trim() === className.trim();
    });
    
    Logger.log('Found ' + classData.length + ' broadsheet records for class ' + className);
    
    // Convert to objects
    const broadsheetData = classData.map(row => {
      const record = {};
      headers.forEach((header, index) => {
        const key = header.toString().toLowerCase().replace(/\s+/g, '');
        let mappedKey;
        
        // Map headers to consistent property names
        switch (key) {
          case 'class':
            mappedKey = 'className';
            break;
          case 'subject':
            mappedKey = 'subject';
            break;
          case 'learnername':
          case 'studentname':
            mappedKey = 'learnerName';
            break;
          case 'test1':
            mappedKey = 'test1';
            break;
          case 'test2':
            mappedKey = 'test2';
            break;
          case 'test3':
            mappedKey = 'test3';
            break;
          case 'test4':
            mappedKey = 'test4';
            break;
          case 'total(60)':
          case 'total':
          case 'totaltests':
            mappedKey = 'totalTests';
            break;
          case 'scaled(50%)':
          case 'scaled50%':
          case 'scaled50':
            mappedKey = 'scaled50';
            break;
          case 'exam(100)':
          case 'exam':
            mappedKey = 'exam';
            break;
          case 'examscaled(50%)':
          case 'examscaled50%':
          case 'examscaled':
            mappedKey = 'examScaled';
            break;
          case 'totalscore':
          case 'finaltotal':
            mappedKey = 'totalScore';
            break;
          case 'position':
            mappedKey = 'position';
            break;
          case 'remarks':
            mappedKey = 'remarks';
            break;
          default:
            mappedKey = key;
        }
        
        record[mappedKey] = row[index] || '';
      });
      return record;
    });
    
    Logger.log('Mapped broadsheet data: ' + JSON.stringify(broadsheetData.slice(0, 2))); // Log first 2 records
    return broadsheetData;
    
  } catch (error) {
    Logger.log('getClassBroadsheet Error: ' + error.toString());
    throw new Error('Failed to get broadsheet data: ' + error.toString());
  }
}

/**
 * Get class configuration (subjects and teacher assignments)
 * @param {string} className - The class name
 * @returns {Object} Class configuration data
 */
function getClassConfig(className) {
  try {
    Logger.log('Getting class config for: ' + className);
    
    // Get or create ClassConfig sheet
    let configSheet;
    try {
      configSheet = getSheet('ClassConfig');
    } catch (error) {
      // Create ClassConfig sheet if it doesn't exist
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      configSheet = ss.insertSheet('ClassConfig');
      
      // Add headers
      configSheet.getRange(1, 1, 1, 4).setValues([[
        'Class', 'Subject', 'TeacherID', 'Active'
      ]]);
      
      Logger.log('Created new ClassConfig sheet');
    }
    
    const data = configSheet.getDataRange().getValues();
    
    if (data.length <= 1) {
      Logger.log('No class config data found, returning empty config');
      return { subjects: [], teacherAssignments: {} };
    }
    
    const headers = data[0];
    const rows = data.slice(1);
    
    // Filter for the specific class
    const classRows = rows.filter(row => {
      const rowClass = row[0];
      const active = row[3];
      return rowClass && rowClass.toString().trim() === className.trim() && active !== false;
    });
    
    Logger.log('Found ' + classRows.length + ' config records for class ' + className);
    
    // Extract subjects and teacher assignments
    const subjects = [];
    const teacherAssignments = {};
    
    classRows.forEach(row => {
      const subject = row[1];
      const teacherId = row[2];
      
      if (subject && !subjects.includes(subject)) {
        subjects.push(subject);
      }
      
      if (subject && teacherId) {
        teacherAssignments[subject] = teacherId;
      }
    });
    
    const config = { subjects, teacherAssignments };
    Logger.log('Class config: ' + JSON.stringify(config));
    return config;
    
  } catch (error) {
    Logger.log('getClassConfig Error: ' + error.toString());
    throw new Error('Failed to get class config: ' + error.toString());
  }
}

/**
 * Update class configuration (subjects and teacher assignments)
 * @param {Object} configData - Configuration data
 * @returns {Object} Success response
 */
function updateClassConfig(configData) {
  try {
    Logger.log('Updating class config: ' + JSON.stringify(configData));
    
    const { className, subjects, teacherAssignments } = configData;
    
    if (!className || !Array.isArray(subjects)) {
      throw new Error('Class name and subjects array are required');
    }
    
    // Get or create ClassConfig sheet
    let configSheet;
    try {
      configSheet = getSheet('ClassConfig');
    } catch (error) {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      configSheet = ss.insertSheet('ClassConfig');
      configSheet.getRange(1, 1, 1, 4).setValues([[
        'Class', 'Subject', 'TeacherID', 'Active'
      ]]);
    }
    
    // Remove existing config for this class
    const data = configSheet.getDataRange().getValues();
    const headers = data[0];
    const rows = data.slice(1);
    
    // Filter out rows for this class
    const otherClassRows = rows.filter(row => {
      const rowClass = row[0];
      return !rowClass || rowClass.toString().trim() !== className.trim();
    });
    
    // Clear the sheet and add headers back
    configSheet.clear();
    configSheet.getRange(1, 1, 1, 4).setValues([headers]);
    
    // Add back other class data
    if (otherClassRows.length > 0) {
      configSheet.getRange(2, 1, otherClassRows.length, 4).setValues(otherClassRows);
    }
    
    // Add new config for this class
    const newRows = subjects.map(subject => [
      className,
      subject,
      teacherAssignments[subject] || '',
      true
    ]);
    
    if (newRows.length > 0) {
      const startRow = configSheet.getLastRow() + 1;
      configSheet.getRange(startRow, 1, newRows.length, 4).setValues(newRows);
    }
    
    Logger.log('Class config updated successfully for ' + className);
    return { message: 'Class configuration updated successfully' };
    
  } catch (error) {
    Logger.log('updateClassConfig Error: ' + error.toString());
    throw new Error('Failed to update class config: ' + error.toString());
  }
}

/**
 * Assign all subjects to a class teacher
 * @param {Object} assignmentData - Assignment data
 * @returns {Object} Success response
 */
function assignAllSubjectsToClassTeacher(assignmentData) {
  try {
    Logger.log('Assigning all subjects to class teacher: ' + JSON.stringify(assignmentData));
    
    const { className, teacherId, subjects } = assignmentData;
    
    if (!className || !teacherId || !Array.isArray(subjects)) {
      throw new Error('Class name, teacher ID, and subjects array are required');
    }
    
    // Verify teacher exists
    const teachers = getTeachers();
    const teacher = teachers.find(t => (t.id || t.teacherID) === teacherId);
    if (!teacher) {
      throw new Error('Teacher not found: ' + teacherId);
    }
    
    // Create teacher assignments object
    const teacherAssignments = {};
    subjects.forEach(subject => {
      teacherAssignments[subject] = teacherId;
    });
    
    // Update class config
    const configData = {
      className,
      subjects,
      teacherAssignments
    };
    
    updateClassConfig(configData);
    
    Logger.log('All subjects assigned to class teacher successfully');
    return { 
      message: `All ${subjects.length} subjects assigned to ${teacher.firstName} ${teacher.lastName} for class ${className}` 
    };
    
  } catch (error) {
    Logger.log('assignAllSubjectsToClassTeacher Error: ' + error.toString());
    throw new Error('Failed to assign subjects to class teacher: ' + error.toString());
  }
}