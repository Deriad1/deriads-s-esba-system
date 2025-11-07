/**
 * Head Teacher Dashboard Functionality Test
 * Tests all API endpoints and database synchronization
 */

import dotenv from 'dotenv';
dotenv.config();

const API_BASE = 'http://localhost:3000/api';

// Test colors
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

let passedTests = 0;
let failedTests = 0;

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  passedTests++;
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  failedTests++;
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'cyan');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

async function testEndpoint(name, url, expectedFields = []) {
  try {
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      logError(`${name}: HTTP ${response.status}`);
      return null;
    }

    if (data.status === 'success') {
      logSuccess(`${name}: Endpoint working`);

      if (data.data && Array.isArray(data.data)) {
        logInfo(`  📊 Records found: ${data.data.length}`);

        if (data.data.length > 0 && expectedFields.length > 0) {
          const sample = data.data[0];
          const missingFields = expectedFields.filter(field => !(field in sample));

          if (missingFields.length > 0) {
            logWarning(`  Missing fields: ${missingFields.join(', ')}`);
          } else {
            logSuccess(`  All expected fields present`);
          }

          logInfo(`  Sample record keys: ${Object.keys(sample).slice(0, 5).join(', ')}...`);
        }
      }

      return data.data;
    } else {
      logError(`${name}: ${data.message || 'Unknown error'}`);
      return null;
    }
  } catch (error) {
    logError(`${name}: ${error.message}`);
    return null;
  }
}

async function testDatabaseConnection() {
  log('\n🔍 Testing Database Connection...', 'magenta');

  try {
    const { sql } = await import('./api/lib/db.js');
    const result = await sql`SELECT NOW() as current_time`;

    if (result && result.length > 0) {
      logSuccess(`Database connected: ${result[0].current_time}`);
      return true;
    } else {
      logError('Database connection failed: No result');
      return false;
    }
  } catch (error) {
    logError(`Database connection failed: ${error.message}`);
    return false;
  }
}

async function testTableStructure() {
  log('\n🔍 Testing Table Structure...', 'magenta');

  try {
    const { sql } = await import('./api/lib/db.js');

    // Test students table
    const students = await sql`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'students'
      ORDER BY ordinal_position
    `;

    if (students.length > 0) {
      logSuccess(`Students table: ${students.length} columns`);
      logInfo(`  Columns: ${students.map(c => c.column_name).join(', ')}`);
    } else {
      logWarning('Students table has no columns or does not exist');
    }

    // Test teachers table
    const teachers = await sql`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'teachers'
      ORDER BY ordinal_position
    `;

    if (teachers.length > 0) {
      logSuccess(`Teachers table: ${teachers.length} columns`);
    } else {
      logWarning('Teachers table has no columns or does not exist');
    }

    // Test marks table
    const marks = await sql`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'marks'
      ORDER BY ordinal_position
    `;

    if (marks.length > 0) {
      logSuccess(`Marks table: ${marks.length} columns`);
    } else {
      logWarning('Marks table has no columns or does not exist');
    }

    // Test classes table
    const classes = await sql`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'classes'
      ORDER BY ordinal_position
    `;

    if (classes.length > 0) {
      logSuccess(`Classes table: ${classes.length} columns`);
    } else {
      logWarning('Classes table has no columns or does not exist');
    }

    return true;
  } catch (error) {
    logError(`Table structure test failed: ${error.message}`);
    return false;
  }
}

async function testDataIntegrity() {
  log('\n🔍 Testing Data Integrity...', 'magenta');

  try {
    const { sql } = await import('./api/lib/db.js');

    // Check for orphaned marks (marks without students)
    const orphanedMarks = await sql`
      SELECT COUNT(*) as count
      FROM marks m
      LEFT JOIN students s ON m.student_id::text = s.id_number
      WHERE s.id_number IS NULL
    `;

    if (orphanedMarks[0].count > 0) {
      logWarning(`Found ${orphanedMarks[0].count} orphaned marks (no matching student)`);
    } else {
      logSuccess('No orphaned marks found');
    }

    // Check for students without classes
    const studentsWithoutClass = await sql`
      SELECT COUNT(*) as count
      FROM students
      WHERE class_name IS NULL OR class_name = ''
    `;

    if (studentsWithoutClass[0].count > 0) {
      logWarning(`Found ${studentsWithoutClass[0].count} students without class assignment`);
    } else {
      logSuccess('All students have class assignments');
    }

    // Check for teachers without roles
    const teachersWithoutRoles = await sql`
      SELECT COUNT(*) as count
      FROM teachers
      WHERE teacher_primary_role IS NULL OR teacher_primary_role = ''
    `;

    if (teachersWithoutRoles[0].count > 0) {
      logWarning(`Found ${teachersWithoutRoles[0].count} teachers without primary role`);
    } else {
      logSuccess('All teachers have primary roles');
    }

    return true;
  } catch (error) {
    logError(`Data integrity test failed: ${error.message}`);
    return false;
  }
}

async function testHeadTeacherEndpoints() {
  log('\n🔍 Testing Head Teacher API Endpoints...', 'magenta');

  // Test Classes endpoint
  const classes = await testEndpoint(
    'Classes API',
    `${API_BASE}/classes`,
    ['id', 'name']
  );

  // Test Teachers endpoint
  const teachers = await testEndpoint(
    'Teachers API',
    `${API_BASE}/teachers`,
    ['id', 'firstName', 'lastName', 'email', 'teacherPrimaryRole']
  );

  // Test Students endpoint
  const students = await testEndpoint(
    'Students API',
    `${API_BASE}/students`,
    ['id', 'idNumber', 'firstName', 'lastName', 'className']
  );

  // Test Analytics endpoints
  await testEndpoint(
    'All Marks Analytics API',
    `${API_BASE}/analytics/all-marks`
  );

  await testEndpoint(
    'Teacher Progress API',
    `${API_BASE}/analytics/teacher-progress`
  );

  // Test with specific class if we have classes
  if (classes && classes.length > 0) {
    const className = classes[0].name || classes[0].className;
    logInfo(`\nTesting with sample class: ${className}`);

    await testEndpoint(
      'Class Performance API',
      `${API_BASE}/analytics/class-performance?className=${encodeURIComponent(className)}`
    );
  }

  return true;
}

async function runAllTests() {
  log('═══════════════════════════════════════════════════════', 'cyan');
  log('🧪 HEAD TEACHER DASHBOARD FUNCTIONALITY TEST', 'cyan');
  log('═══════════════════════════════════════════════════════', 'cyan');

  const startTime = Date.now();

  // Test 1: Database Connection
  await testDatabaseConnection();

  // Test 2: Table Structure
  await testTableStructure();

  // Test 3: Data Integrity
  await testDataIntegrity();

  // Test 4: API Endpoints
  await testHeadTeacherEndpoints();

  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  // Summary
  log('\n═══════════════════════════════════════════════════════', 'cyan');
  log('📊 TEST SUMMARY', 'cyan');
  log('═══════════════════════════════════════════════════════', 'cyan');
  log(`✅ Passed: ${passedTests}`, 'green');
  log(`❌ Failed: ${failedTests}`, 'red');
  log(`⏱️  Duration: ${duration}s`, 'blue');
  log('═══════════════════════════════════════════════════════\n', 'cyan');

  if (failedTests === 0) {
    log('🎉 All tests passed! Head Teacher dashboard is functioning correctly.', 'green');
  } else {
    log('⚠️  Some tests failed. Please review the errors above.', 'yellow');
  }

  process.exit(failedTests > 0 ? 1 : 0);
}

runAllTests();
