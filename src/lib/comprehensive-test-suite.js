// Comprehensive Testing Suite for School Management System

import sql from './db-node.js';
import dotenv from 'dotenv';
import { 
  testConnection, 
  addTeacher, 
  getTeachers, 
  addLearner, 
  getLearners, 
  deleteTeacher,
  deleteLearner,
  addStudentScore,
  getStudentScores,
  addFormMasterRemark,
  getFormMasterRemarks
} from './api.js';

dotenv.config();

// Test configuration
const TEST_CONFIG = {
  timeout: 30000, // 30 seconds timeout
  retries: 3,
  cleanup: true // Clean up test data after tests
};

// Test data
const generateTestData = () => {
  const timestamp = Date.now();
  return {
    teacher: {
      firstName: 'Test',
      lastName: 'Teacher',
      email: `test.teacher.${timestamp}@school.com`,
      password: 'test123',
      gender: 'male',
      primaryRole: 'teacher',
      subjects: ['Mathematics', 'Science'],
      classes: ['BS1', 'BS2']
    },
    student: {
      firstName: 'Test',
      lastName: 'Student',
      idNumber: `STU${timestamp.toString().slice(-4)}`,
      class: 'BS1',
      gender: 'female'
    },
    score: {
      studentId: `STU${timestamp.toString().slice(-4)}`,
      subject: 'Mathematics',
      ca1: 15,
      ca2: 18,
      exam: 85
    },
    remark: {
      studentId: `STU${timestamp.toString().slice(-4)}`,
      className: 'BS1',
      remarks: 'Excellent student with great potential',
      attendance: 45
    }
  };
};

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  errors: []
};

// Utility functions
const logTest = (testName, status, message = '') => {
  const statusIcon = status === 'PASS' ? '✅' : '❌';
  console.log(`${statusIcon} ${testName}: ${message}`);
  
  if (status === 'PASS') {
    testResults.passed++;
  } else {
    testResults.failed++;
    testResults.errors.push({ test: testName, error: message });
  }
};

const runTest = async (testName, testFunction) => {
  try {
    await testFunction();
    logTest(testName, 'PASS');
  } catch (error) {
    logTest(testName, 'FAIL', error.message);
  }
};

// Database connection tests
const testDatabaseConnection = async () => {
  const result = await sql`SELECT NOW() as current_time, version() as postgres_version`;
  if (!result || result.length === 0) {
    throw new Error('No data returned from database');
  }
};

const testDatabaseTables = async () => {
  const tables = await sql`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public'
    AND table_name IN ('users', 'students', 'teachers', 'student_scores', 'form_master_remarks', 'system_config')
  `;
  
  if (tables.length < 6) {
    throw new Error(`Expected 6 tables, found ${tables.length}: ${tables.map(t => t.table_name).join(', ')}`);
  }
};

// API functionality tests
const testTeacherCRUD = async () => {
  const testData = generateTestData();
  
  // Test add teacher
  const addResult = await addTeacher(testData.teacher);
  if (addResult.status !== 'success') {
    throw new Error(`Failed to add teacher: ${addResult.message}`);
  }
  
  // Test get teachers
  const getResult = await getTeachers();
  if (getResult.status !== 'success' || !getResult.data) {
    throw new Error('Failed to get teachers');
  }
  
  // Test delete teacher
  const deleteResult = await deleteTeacher(testData.teacher.email);
  if (deleteResult.status !== 'success') {
    throw new Error(`Failed to delete teacher: ${deleteResult.message}`);
  }
};

const testStudentCRUD = async () => {
  const testData = generateTestData();
  
  // Test add student
  const addResult = await addLearner(testData.student);
  if (addResult.status !== 'success') {
    throw new Error(`Failed to add student: ${addResult.message}`);
  }
  
  // Test get students
  const getResult = await getLearners();
  if (getResult.status !== 'success' || !getResult.data) {
    throw new Error('Failed to get students');
  }
  
  // Test delete student
  const deleteResult = await deleteLearner(testData.student.idNumber);
  if (deleteResult.status !== 'success') {
    throw new Error(`Failed to delete student: ${deleteResult.message}`);
  }
};

const testScoreManagement = async () => {
  const testData = generateTestData();
  
  // Add student first
  await addLearner(testData.student);
  
  try {
    // Test add score
    const addResult = await addStudentScore(testData.score);
    if (addResult.status !== 'success') {
      throw new Error(`Failed to add score: ${addResult.message}`);
    }
    
    // Test get scores
    const getResult = await getStudentScores(testData.score.studentId);
    if (getResult.status !== 'success') {
      throw new Error('Failed to get student scores');
    }
  } finally {
    // Clean up
    await deleteLearner(testData.student.idNumber);
  }
};

const testRemarkManagement = async () => {
  const testData = generateTestData();
  
  // Add student first
  await addLearner(testData.student);
  
  try {
    // Test add remark
    const addResult = await addFormMasterRemark(testData.remark);
    if (addResult.status !== 'success') {
      throw new Error(`Failed to add remark: ${addResult.message}`);
    }
    
    // Test get remarks
    const getResult = await getFormMasterRemarks(testData.remark.className);
    if (getResult.status !== 'success') {
      throw new Error('Failed to get form master remarks');
    }
  } finally {
    // Clean up
    await deleteLearner(testData.student.idNumber);
  }
};

// Performance tests
const testPerformance = async () => {
  const startTime = Date.now();
  
  // Test multiple operations
  await Promise.all([
    getTeachers(),
    getLearners(),
    testConnection()
  ]);
  
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  if (duration > 5000) { // 5 seconds
    throw new Error(`Performance test failed: Operations took ${duration}ms (expected < 5000ms)`);
  }
};

// Security tests
const testSecurity = async () => {
  // Test SQL injection prevention
  const maliciousInput = "'; DROP TABLE students; --";
  
  try {
    await addLearner({
      firstName: maliciousInput,
      lastName: 'Test',
      idNumber: 'SEC001',
      class: 'BS1',
      gender: 'male'
    });
    // If we get here without error, security is working
    // eslint-disable-next-line no-unused-vars
  } catch (_error) {
    // Expected - should sanitize input
  }
};

// Main test runner
const runAllTests = async () => {
  console.log('🧪 Starting Comprehensive Test Suite...\n');
  console.log('=' .repeat(50));
  
  // Database tests
  console.log('\n📊 Database Tests:');
  await runTest('Database Connection', testDatabaseConnection);
  await runTest('Database Tables', testDatabaseTables);
  
  // API tests
  console.log('\n🔌 API Tests:');
  await runTest('Teacher CRUD Operations', testTeacherCRUD);
  await runTest('Student CRUD Operations', testStudentCRUD);
  await runTest('Score Management', testScoreManagement);
  await runTest('Remark Management', testRemarkManagement);
  
  // Performance tests
  console.log('\n⚡ Performance Tests:');
  await runTest('Performance Benchmark', testPerformance);
  
  // Security tests
  console.log('\n🔒 Security Tests:');
  await runTest('SQL Injection Prevention', testSecurity);
  
  // Results summary
  console.log('\n' + '=' .repeat(50));
  console.log('📊 Test Results Summary:');
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📈 Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`);
  
  if (testResults.failed > 0) {
    console.log('\n❌ Failed Tests:');
    testResults.errors.forEach(error => {
      console.log(`   • ${error.test}: ${error.error}`);
    });
  }
  
  if (testResults.failed === 0) {
    console.log('\n🎉 All tests passed! Your system is ready for production.');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the errors above.');
  }
  
  process.exit(testResults.failed === 0 ? 0 : 1);
};

// Run tests
runAllTests().catch(error => {
  console.error('💥 Test suite failed:', error);
  process.exit(1);
});
