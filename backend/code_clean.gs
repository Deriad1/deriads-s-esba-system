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