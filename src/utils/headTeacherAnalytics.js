/**
 * Head Teacher Analytics Utilities
 *
 * Functions to calculate real-time analytics from student marks data
 * Replaces all mock data with actual calculations
 */

/**
 * Calculate overall school average from all student marks
 * @param {Array} learners - Array of all students
 * @param {Array} marksData - Array of all marks records
 * @returns {number} - Overall school average (0-100)
 */
export const calculateOverallAverage = (learners, marksData) => {
  // Guard against invalid data types
  if (!marksData || !Array.isArray(marksData) || marksData.length === 0) {
    console.warn('⚠️ calculateOverallAverage: Invalid or empty marksData');
    return 0;
  }

  // Sum all total scores
  const totalSum = marksData.reduce((sum, mark) => {
    const total = parseFloat(mark.total) || 0;
    return sum + total;
  }, 0);

  // Calculate average
  const average = marksData.length > 0 ? totalSum / marksData.length : 0;
  return Math.round(average * 10) / 10; // Round to 1 decimal
};

/**
 * Calculate average per subject across all students
 * @param {Array} marksData - Array of all marks records
 * @returns {Array} - Array of {subject, average} objects for charts
 */
export const calculateSubjectAverages = (marksData) => {
  // Guard against invalid data types
  if (!marksData || !Array.isArray(marksData) || marksData.length === 0) {
    console.warn('⚠️ calculateSubjectAverages: Invalid or empty marksData');
    return [];
  }

  // Group marks by subject
  const subjectGroups = {};
  marksData.forEach(mark => {
    const subject = mark.subject || mark.subjectName;
    if (!subject) return;

    if (!subjectGroups[subject]) {
      subjectGroups[subject] = {
        totalScore: 0,
        count: 0
      };
    }

    const total = parseFloat(mark.total) || 0;
    subjectGroups[subject].totalScore += total;
    subjectGroups[subject].count += 1;
  });

  // Calculate average per subject
  const subjectAverages = Object.keys(subjectGroups).map(subject => ({
    subject,
    average: Math.round((subjectGroups[subject].totalScore / subjectGroups[subject].count) * 10) / 10
  }));

  // Sort by average descending
  return subjectAverages.sort((a, b) => b.average - a.average);
};

/**
 * Calculate term trends (average per term)
 * @param {Array} marksData - Array of all marks records with term info
 * @returns {Array} - Array of {term, average} objects for trend charts
 */
export const calculateTermTrends = (marksData) => {
  // Guard against invalid data types
  if (!marksData || !Array.isArray(marksData) || marksData.length === 0) {
    console.warn('⚠️ calculateTermTrends: Invalid or empty marksData');
    return [];
  }

  // Group marks by term
  const termGroups = {};
  marksData.forEach(mark => {
    const term = mark.term || 'Unknown';

    if (!termGroups[term]) {
      termGroups[term] = {
        totalScore: 0,
        count: 0
      };
    }

    const total = parseFloat(mark.total) || 0;
    termGroups[term].totalScore += total;
    termGroups[term].count += 1;
  });

  // Calculate average per term
  const termAverages = Object.keys(termGroups).map(term => ({
    term,
    average: Math.round((termGroups[term].totalScore / termGroups[term].count) * 10) / 10
  }));

  // Sort by term (Term 1, Term 2, Term 3)
  const termOrder = { 'Term 1': 1, 'Term 2': 2, 'Term 3': 3 };
  return termAverages.sort((a, b) => (termOrder[a.term] || 99) - (termOrder[b.term] || 99));
};

/**
 * Calculate class-level statistics
 * @param {string} className - Name of the class
 * @param {Array} learners - Array of all students
 * @param {Array} marksData - Array of all marks records
 * @returns {Object} - Class statistics (average, studentCount, topPerformers, etc.)
 */
export const calculateClassStats = (className, learners, marksData) => {
  // Guard against invalid data types
  if (!className || !marksData || !Array.isArray(marksData) || marksData.length === 0) {
    console.warn('⚠️ calculateClassStats: Invalid or empty marksData');
    return {
      average: 0,
      studentCount: 0,
      topPerformers: [],
      subjectBreakdown: []
    };
  }

  // Filter students in this class
  const classStudents = Array.isArray(learners) ? learners.filter(l => l.className === className) : [];
  const classStudentIds = classStudents.map(s => s.idNumber || s.LearnerID);

  // Filter marks for this class
  const classMarks = marksData.filter(mark =>
    classStudentIds.includes(mark.studentId || mark.student_id)
  );

  if (classMarks.length === 0) {
    return {
      average: 0,
      studentCount: classStudents.length,
      topPerformers: [],
      subjectBreakdown: []
    };
  }

  // Calculate class average
  const totalSum = classMarks.reduce((sum, mark) => {
    return sum + (parseFloat(mark.total) || 0);
  }, 0);
  const classAverage = Math.round((totalSum / classMarks.length) * 10) / 10;

  // Calculate average per student
  const studentAverages = {};
  classMarks.forEach(mark => {
    const studentId = mark.studentId || mark.student_id;
    if (!studentAverages[studentId]) {
      studentAverages[studentId] = {
        totalScore: 0,
        count: 0,
        studentId
      };
    }
    studentAverages[studentId].totalScore += parseFloat(mark.total) || 0;
    studentAverages[studentId].count += 1;
  });

  // Find top performers
  const studentScores = Object.values(studentAverages).map(s => ({
    studentId: s.studentId,
    average: s.totalScore / s.count
  }));
  const topPerformers = studentScores
    .sort((a, b) => b.average - a.average)
    .slice(0, 5)
    .map(s => {
      const student = classStudents.find(st =>
        (st.idNumber || st.LearnerID) === s.studentId
      );
      return {
        name: student ? `${student.firstName} ${student.lastName}` : 'Unknown',
        average: Math.round(s.average * 10) / 10
      };
    });

  // Calculate subject breakdown for this class
  const subjectGroups = {};
  classMarks.forEach(mark => {
    const subject = mark.subject || mark.subjectName;
    if (!subject) return;

    if (!subjectGroups[subject]) {
      subjectGroups[subject] = {
        totalScore: 0,
        count: 0
      };
    }

    subjectGroups[subject].totalScore += parseFloat(mark.total) || 0;
    subjectGroups[subject].count += 1;
  });

  const subjectBreakdown = Object.keys(subjectGroups).map(subject => ({
    subject,
    average: Math.round((subjectGroups[subject].totalScore / subjectGroups[subject].count) * 10) / 10
  }));

  return {
    average: classAverage,
    studentCount: classStudents.length,
    topPerformers,
    subjectBreakdown
  };
};

/**
 * Calculate teacher performance statistics
 * @param {Array} teachers - Array of all teachers
 * @param {Array} marksData - Array of all marks records
 * @returns {Array} - Array of teacher stats with average scores
 */
export const calculateTeacherPerformance = (teachers, marksData) => {
  if (!teachers || teachers.length === 0 || !marksData || marksData.length === 0) {
    return [];
  }

  // Group marks by teacher (using subject as proxy)
  const teacherStats = teachers.map(teacher => {
    const teacherSubjects = Array.isArray(teacher.subjects)
      ? teacher.subjects
      : [];

    // Find all marks for this teacher's subjects
    const teacherMarks = marksData.filter(mark =>
      teacherSubjects.includes(mark.subject || mark.subjectName)
    );

    if (teacherMarks.length === 0) {
      return {
        teacherId: teacher.id || teacher.teacherId,
        name: `${teacher.firstName} ${teacher.lastName}`,
        subjects: teacherSubjects,
        average: 0,
        studentCount: 0
      };
    }

    // Calculate average for this teacher
    const totalSum = teacherMarks.reduce((sum, mark) => {
      return sum + (parseFloat(mark.total) || 0);
    }, 0);

    const average = Math.round((totalSum / teacherMarks.length) * 10) / 10;

    // Count unique students
    const uniqueStudents = new Set(
      teacherMarks.map(m => m.studentId || m.student_id)
    );

    return {
      teacherId: teacher.id || teacher.teacherId,
      name: `${teacher.firstName} ${teacher.lastName}`,
      subjects: teacherSubjects,
      average,
      studentCount: uniqueStudents.size
    };
  });

  // Sort by average descending
  return teacherStats.sort((a, b) => b.average - a.average);
};

/**
 * Calculate grade distribution across the school
 * @param {Array} marksData - Array of all marks records
 * @returns {Object} - Count of each grade (A, B, C, D, E, F)
 */
export const calculateGradeDistribution = (marksData) => {
  if (!marksData || marksData.length === 0) {
    return { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0 };
  }

  const distribution = { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0 };

  marksData.forEach(mark => {
    const grade = mark.grade;
    if (grade && distribution.hasOwnProperty(grade)) {
      distribution[grade]++;
    }
  });

  return distribution;
};

/**
 * Get performance status based on average
 * @param {number} average - Average score
 * @returns {Object} - Status object with label and color
 */
export const getPerformanceStatus = (average) => {
  if (average >= 80) {
    return { label: 'Excellent', color: 'green', emoji: '🌟' };
  } else if (average >= 70) {
    return { label: 'Very Good', color: 'blue', emoji: '💙' };
  } else if (average >= 60) {
    return { label: 'Good', color: 'yellow', emoji: '⭐' };
  } else if (average >= 50) {
    return { label: 'Fair', color: 'orange', emoji: '🟡' };
  } else if (average >= 40) {
    return { label: 'Needs Improvement', color: 'red', emoji: '⚠️' };
  } else {
    return { label: 'Critical', color: 'darkred', emoji: '🚨' };
  }
};
