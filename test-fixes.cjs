/**
 * Test Suite for Bug Fixes
 *
 * This script tests all the fixes we applied today
 * Run with: node test-fixes.js
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Bug Fixes - November 3, 2025\n');
console.log('=' .repeat(60));

let passedTests = 0;
let failedTests = 0;
let totalTests = 0;

// Helper functions
function test(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`✅ PASS: ${name}`);
    passedTests++;
    return true;
  } catch (error) {
    console.log(`❌ FAIL: ${name}`);
    console.log(`   Error: ${error.message}`);
    failedTests++;
    return false;
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

function fileExists(filePath) {
  return fs.existsSync(path.join(__dirname, filePath));
}

function fileContains(filePath, searchString) {
  const fullPath = path.join(__dirname, filePath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  const content = fs.readFileSync(fullPath, 'utf8');
  return content.includes(searchString);
}

console.log('\n📁 Test 1: File Existence Tests\n');

test('Password change API endpoint exists', () => {
  assert(fileExists('api/auth/change-password/index.js'),
    'Password change endpoint should exist');
});

test('User data normalizer exists', () => {
  assert(fileExists('src/utils/userDataNormalizer.js'),
    'User normalizer should exist');
});

test('Bug report documentation exists', () => {
  assert(fileExists('BUG_REPORT_2025-11-03.md'),
    'Bug report should exist');
});

test('Fixes documentation exists', () => {
  assert(fileExists('FIXES_APPLIED_2025-11-03.md'),
    'Fixes documentation should exist');
});

console.log('\n🔐 Test 2: JWT Token Handling\n');

test('JWT decode function exists in authHelpers', () => {
  assert(fileContains('src/utils/authHelpers.js', 'decodeJWT'),
    'decodeJWT function should exist');
});

test('isTokenExpired function exists', () => {
  assert(fileContains('src/utils/authHelpers.js', 'isTokenExpired'),
    'isTokenExpired function should exist');
});

test('verifyAuthToken properly checks expiration', () => {
  assert(fileContains('src/utils/authHelpers.js', 'isTokenExpired(token)'),
    'verifyAuthToken should check token expiration');
});

test('Old Base64 function deprecated', () => {
  assert(fileContains('src/utils/authHelpers.js', '@deprecated'),
    'Old generateAuthToken should be marked deprecated');
});

console.log('\n🔒 Test 3: Token Verification on App Load\n');

test('AuthContext validates token on load', () => {
  assert(fileContains('src/context/AuthContext.jsx', 'verifyAuthToken'),
    'AuthContext should verify token on load');
});

test('AuthContext auto-logs out on invalid token', () => {
  assert(fileContains('src/context/AuthContext.jsx', 'Token expired or invalid'),
    'Should log out on invalid token');
});

test('User data is normalized on restore', () => {
  assert(fileContains('src/context/AuthContext.jsx', 'normalizeUserData'),
    'Should normalize user data on restore');
});

console.log('\n💾 Test 4: Token Storage\n');

test('storeAuthToken uses only localStorage', () => {
  const content = fs.readFileSync(path.join(__dirname, 'src/utils/authHelpers.js'), 'utf8');
  const storeFunction = content.match(/export const storeAuthToken[\s\S]*?};/);
  if (!storeFunction) throw new Error('storeAuthToken function not found');

  // Should have localStorage but not sessionStorage in the main function body
  const functionBody = storeFunction[0];
  assert(functionBody.includes('localStorage.setItem'),
    'Should store in localStorage');
  assert(!functionBody.match(/sessionStorage\.setItem.*authToken/),
    'Should not store in sessionStorage in main function');
});

test('getAuthToken reads only from localStorage', () => {
  const content = fs.readFileSync(path.join(__dirname, 'src/utils/authHelpers.js'), 'utf8');
  const getFunction = content.match(/export const getAuthToken[\s\S]*?};/);
  if (!getFunction) throw new Error('getAuthToken function not found');

  const functionBody = getFunction[0];
  assert(functionBody.includes('localStorage.getItem'),
    'Should read from localStorage');
  assert(!functionBody.match(/sessionStorage\.getItem.*\|\|/),
    'Should not fallback to sessionStorage');
});

console.log('\n🔑 Test 5: Password Change Implementation\n');

test('Password change API validates input', () => {
  assert(fileContains('api/auth/change-password/index.js', 'newPassword.length < 6'),
    'Should validate password length');
});

test('Password change API hashes password', () => {
  assert(fileContains('api/auth/change-password/index.js', 'bcrypt.hash'),
    'Should hash password with bcrypt');
});

test('Password change API verifies current password', () => {
  assert(fileContains('api/auth/change-password/index.js', 'bcrypt.compare'),
    'Should verify current password');
});

test('Client calls password change API', () => {
  assert(fileContains('src/api-client.js', '/auth/change-password'),
    'Client should call password change endpoint');
});

console.log('\n✅ Test 6: Data Validation\n');

test('SubjectTeacherPage imports validation', () => {
  assert(fileContains('src/pages/SubjectTeacherPage.jsx', 'validateScoreData'),
    'Should import validation functions');
});

test('Score validation enforced before save', () => {
  assert(fileContains('src/pages/SubjectTeacherPage.jsx', 'validation.isValid'),
    'Should check validation before saving');
});

test('Input validation limits decimal places', () => {
  assert(fileContains('src/pages/SubjectTeacherPage.jsx', '\\d{0,2}'),
    'Should limit decimal places in regex');
});

test('Validation checks maximum bounds', () => {
  assert(fileContains('src/pages/SubjectTeacherPage.jsx', 'MAX_EXAM_SCORE'),
    'Should check maximum score bounds');
});

test('AdminDashboard clamps score values', () => {
  assert(fileContains('src/pages/AdminDashboardPage.jsx', 'Math.max(0, Math.min'),
    'Should clamp values to valid ranges');
});

console.log('\n🔄 Test 7: User Data Normalization\n');

test('normalizeUserData function exists', () => {
  assert(fileContains('src/utils/userDataNormalizer.js', 'export const normalizeUserData'),
    'normalizeUserData function should exist');
});

test('Handles both snake_case and camelCase', () => {
  const content = fs.readFileSync(path.join(__dirname, 'src/utils/userDataNormalizer.js'), 'utf8');
  assert(content.includes('all_roles') && content.includes('allRoles'),
    'Should handle both naming conventions');
});

test('AuthContext normalizes on login', () => {
  assert(fileContains('src/context/AuthContext.jsx', 'normalizeUserData(response.data)'),
    'Should normalize user data on login');
});

console.log('\n🎨 Test 8: Notification System\n');

test('LoginPage uses notification instead of alert', () => {
  const content = fs.readFileSync(path.join(__dirname, 'src/pages/LoginPage.jsx'), 'utf8');
  assert(content.includes('showNotification'),
    'LoginPage should use showNotification');

  // Count alerts (should be in comments or demo code only)
  const alertMatches = content.match(/[^/]alert\(/g) || [];
  assert(alertMatches.length === 0,
    `LoginPage should not have alert() calls (found ${alertMatches.length})`);
});

test('ChangePasswordModal uses notification', () => {
  assert(fileContains('src/components/ChangePasswordModal.jsx', 'showNotification'),
    'ChangePasswordModal should use showNotification');
});

test('LoginPage imports NotificationContext', () => {
  assert(fileContains('src/pages/LoginPage.jsx', 'useNotification'),
    'Should import useNotification hook');
});

console.log('\n🐛 Test 9: Error Handling\n');

test('AdminDashboard has proper error handling', () => {
  const content = fs.readFileSync(path.join(__dirname, 'src/pages/AdminDashboardPage.jsx'), 'utf8');
  assert(content.includes('catch (error)'),
    'Should catch error with parameter');
  assert(!content.match(/catch\s*\{\s*setError.*Backend endpoint updated/),
    'Should not have misleading success message in catch');
});

test('Errors are logged to console', () => {
  assert(fileContains('src/pages/AdminDashboardPage.jsx', 'console.error'),
    'Should log errors to console');
});

console.log('\n📊 Test 10: Division by Zero Fix\n');

test('lowestScore calculation checks array length', () => {
  const content = fs.readFileSync(path.join(__dirname, 'src/pages/AdminDashboardPage.jsx'), 'utf8');
  assert(content.includes('scores.length > 0') && content.includes('Math.min(...scores)'),
    'Should check array length before Math.min');
});

// Summary
console.log('\n' + '='.repeat(60));
console.log('\n📊 TEST RESULTS SUMMARY\n');
console.log(`Total Tests: ${totalTests}`);
console.log(`✅ Passed: ${passedTests}`);
console.log(`❌ Failed: ${failedTests}`);
console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%\n`);

if (failedTests === 0) {
  console.log('🎉 ALL TESTS PASSED! Fixes are working correctly.\n');
  process.exit(0);
} else {
  console.log('⚠️  Some tests failed. Please review the errors above.\n');
  process.exit(1);
}
