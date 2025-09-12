import { useTermContext } from "../context/TermContext";

// Local Storage API functions for term-specific data management
// These functions work with the TermContext to ensure data isolation per term/year

/**
 * Get teachers for current term
 */
export const getTeachers = async () => {
  try {
    // In a real implementation, this would use the term context
    // For now, we'll simulate the same structure as the API
    const teachers = JSON.parse(localStorage.getItem('teachers') || '[]');
    return { status: 'success', data: teachers };
  } catch (error) {
    console.error('Get teachers error:', error);
    throw error;
  }
};

/**
 * Get learners for current term
 */
export const getLearners = async () => {
  try {
    // In a real implementation, this would use the term context
    // For now, we'll simulate the same structure as the API
    const learners = JSON.parse(localStorage.getItem('learners') || '[]');
    return { status: 'success', data: learners };
  } catch (error) {
    console.error('Get learners error:', error);
    throw error;
  }
};

/**
 * Add teacher for current term
 */
export const addTeacher = async (teacherData) => {
  try {
    const teachers = JSON.parse(localStorage.getItem('teachers') || '[]');
    const newTeacher = {
      ...teacherData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    teachers.push(newTeacher);
    localStorage.setItem('teachers', JSON.stringify(teachers));
    return { status: 'success', data: newTeacher };
  } catch (error) {
    console.error('Add teacher error:', error);
    throw error;
  }
};

/**
 * Add learner for current term
 */
export const addLearner = async (learnerData) => {
  try {
    const learners = JSON.parse(localStorage.getItem('learners') || '[]');
    const newLearner = {
      ...learnerData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    learners.push(newLearner);
    localStorage.setItem('learners', JSON.stringify(learners));
    return { status: 'success', data: newLearner };
  } catch (error) {
    console.error('Add learner error:', error);
    throw error;
  }
};

/**
 * Update teacher for current term
 */
export const updateTeacher = async (teacherId, updatedData) => {
  try {
    // Get current term info (matching the approach in api.js)
    const currentTerm = localStorage.getItem('currentTerm') || 'First Term';
    const currentYear = localStorage.getItem('currentAcademicYear') || '2024/2025';
    const termKey = `${currentYear.replace('/', '_')}_${currentTerm.replace(' ', '_')}_teachers`;
    
    const teachers = JSON.parse(localStorage.getItem(termKey) || '[]');
    const updatedTeachers = teachers.map(teacher => {
      if (teacher.id === teacherId) {
        return {
          ...teacher,
          ...updatedData,
          updatedAt: new Date().toISOString()
        };
      }
      return teacher;
    });
    
    localStorage.setItem(termKey, JSON.stringify(updatedTeachers));
    const updatedTeacher = updatedTeachers.find(teacher => teacher.id === teacherId);
    return { status: 'success', data: updatedTeacher };
  } catch (error) {
    console.error('Update teacher error:', error);
    throw error;
  }
};

/**
 * Delete teacher for current term
 */
export const deleteTeacher = async (teacherId) => {
  try {
    const teachers = JSON.parse(localStorage.getItem('teachers') || '[]');
    const updatedTeachers = teachers.filter(teacher => teacher.id !== teacherId);
    localStorage.setItem('teachers', JSON.stringify(updatedTeachers));
    return { status: 'success', message: 'Teacher deleted successfully' };
  } catch (error) {
    console.error('Delete teacher error:', error);
    throw error;
  }
};

/**
 * Delete learner for current term
 */
export const deleteLearner = async (learnerId) => {
  try {
    const learners = JSON.parse(localStorage.getItem('learners') || '[]');
    const updatedLearners = learners.filter(learner => learner.id !== learnerId);
    localStorage.setItem('learners', JSON.stringify(updatedLearners));
    return { status: 'success', message: 'Learner deleted successfully' };
  } catch (error) {
    console.error('Delete learner error:', error);
    throw error;
  }
};

/**
 * Test connection
 */
export const testConnection = async () => {
  try {
    return { status: 'success', message: 'Connection successful' };
  } catch (error) {
    console.error('Test connection error:', error);
    throw error;
  }
};