import dotenv from 'dotenv';
dotenv.config();

import { addTeacher, getTeachers } from '../api.js';

// Test CRUD operations
const testCRUD = async () => {
  console.log('Testing CRUD operations...');
  
  try {
    // Test adding a teacher
    console.log('Adding a test teacher...');
    const teacherData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@school.com',
      password: 'teacher123',
      gender: 'male',
      primaryRole: 'teacher',
      allRoles: ['teacher', 'class_teacher'],
      subjects: ['Mathematics', 'Physics'],
      classes: ['10A', '11B']
    };
    
    const addResult = await addTeacher(teacherData);
    console.log('Add teacher result:', addResult);
    
    if (addResult.status === 'success') {
      console.log('✅ Teacher added successfully!');
      
      // Test getting teachers
      console.log('Fetching all teachers...');
      const getResult = await getTeachers();
      console.log('Get teachers result:', getResult);
      
      if (getResult.status === 'success') {
        console.log(`✅ Retrieved ${getResult.data.length} teachers successfully!`);
      } else {
        console.error('❌ Failed to get teachers:', getResult.message);
      }
    } else {
      console.error('❌ Failed to add teacher:', addResult.message);
    }
  } catch (error) {
    console.error('❌ Error testing CRUD operations:', error.message);
  }
};

// Run the test
testCRUD();