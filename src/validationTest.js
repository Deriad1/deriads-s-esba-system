// Test file to verify validation functions are working correctly

import { 
  validateStudentData, 
  validateTeacherData, 
  validateScoreData, 
  validateRemarkData, 
  validateClassConfig, 
  validateSubjectData, 
  validateRoleData,
  validateEmail,
  validatePhone,
  validateNumberRange,
  validateRequiredString,
  validateGender
} from './utils/validation';

// Test validation functions
console.log('=== Validation Function Tests ===');

// Test email validation
console.log('Email Validation Tests:');
console.log('Valid email (test@example.com):', validateEmail('test@example.com'));
console.log('Invalid email (test@):', validateEmail('test@'));
console.log('Invalid email (test):', validateEmail('test'));
console.log('Empty email:', validateEmail(''));

// Test phone validation
console.log('\nPhone Validation Tests:');
console.log('Valid phone (+1234567890):', validatePhone('+1234567890'));
console.log('Valid phone (1234567890):', validatePhone('1234567890'));
console.log('Invalid phone (123):', validatePhone('123'));
console.log('Empty phone (optional):', validatePhone(''));

// Test number range validation
console.log('\nNumber Range Validation Tests:');
console.log('Valid number in range (50, 0-100):', validateNumberRange(50, 0, 100));
console.log('Invalid number below range (-5, 0-100):', validateNumberRange(-5, 0, 100));
console.log('Invalid number above range (105, 0-100):', validateNumberRange(105, 0, 100));

// Test required string validation
console.log('\nRequired String Validation Tests:');
console.log('Valid string (Hello):', validateRequiredString('Hello'));
console.log('Invalid empty string:', validateRequiredString(''));
console.log('Invalid whitespace string:', validateRequiredString('   '));

// Test gender validation
console.log('\nGender Validation Tests:');
console.log('Valid gender (male):', validateGender('male'));
console.log('Valid gender (female):', validateGender('female'));
console.log('Valid gender (other):', validateGender('other'));
console.log('Invalid gender (unknown):', validateGender('unknown'));

// Test student data validation
console.log('\n=== Student Data Validation Tests ===');

const validStudent = {
  firstName: 'John',
  lastName: 'Doe',
  className: '10A',
  gender: 'male',
  idNumber: 'S12345'
};

const invalidStudent = {
  firstName: '',
  lastName: 'Doe',
  className: '',
  gender: 'unknown'
};

console.log('Valid student data:', validateStudentData(validStudent));
console.log('Invalid student data:', validateStudentData(invalidStudent));

// Test teacher data validation
console.log('\n=== Teacher Data Validation Tests ===');

const validTeacher = {
  firstName: 'Jane',
  lastName: 'Smith',
  email: 'jane@example.com',
  gender: 'female',
  primaryRole: 'teacher',
  phone: '+1234567890',
  password: 'password123'
};

const invalidTeacher = {
  firstName: '',
  lastName: '',
  email: 'invalid-email',
  gender: 'unknown',
  primaryRole: ''
};

console.log('Valid teacher data:', validateTeacherData(validTeacher));
console.log('Invalid teacher data:', validateTeacherData(invalidTeacher));

// Test score data validation
console.log('\n=== Score Data Validation Tests ===');

const validScore = {
  studentId: '123',
  subject: 'Mathematics',
  term: 'First Term',
  test1: 10,
  test2: 12,
  exam: 80
};

const invalidScore = {
  studentId: '',
  subject: '',
  term: '',
  test1: -5,
  exam: 150
};

console.log('Valid score data:', validateScoreData(validScore));
console.log('Invalid score data:', validateScoreData(invalidScore));

// Test remark data validation
console.log('\n=== Remark Data Validation Tests ===');

const validRemark = {
  studentId: '123',
  className: '10A',
  term: 'First Term',
  remarks: 'Good progress',
  attendance: 95
};

const invalidRemark = {
  studentId: '',
  className: '',
  term: '',
  attendance: -10
};

console.log('Valid remark data:', validateRemarkData(validRemark));
console.log('Invalid remark data:', validateRemarkData(invalidRemark));

// Test class config validation
console.log('\n=== Class Config Validation Tests ===');

const validClassConfig = {
  className: '10A',
  maxStudents: 30
};

const invalidClassConfig = {
  className: '',
  maxStudents: 150
};

console.log('Valid class config:', validateClassConfig(validClassConfig));
console.log('Invalid class config:', validateClassConfig(invalidClassConfig));

// Test subject data validation
console.log('\n=== Subject Data Validation Tests ===');

const validSubject = {
  name: 'Mathematics'
};

const invalidSubject = {
  name: ''
};

console.log('Valid subject data:', validateSubjectData(validSubject));
console.log('Invalid subject data:', validateSubjectData(invalidSubject));

// Test role data validation
console.log('\n=== Role Data Validation Tests ===');

const validRole = {
  teacherId: 'T123',
  role: 'class_teacher',
  className: '10A'
};

const invalidRole = {
  teacherId: '',
  role: 'invalid_role'
};

console.log('Valid role data:', validateRoleData(validRole));
console.log('Invalid role data:', validateRoleData(invalidRole));

console.log('\n=== All Tests Completed ===');