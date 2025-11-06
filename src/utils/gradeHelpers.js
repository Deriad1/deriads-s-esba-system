/**
 * Grade and Remarks Calculation Helpers
 * Provides standardized grading logic across the system
 */

/**
 * Calculate remark based on total score
 * Uses the Excel formula logic:
 * =IF(J3>=80,"EXCELLENT",IF(J3>=70,"VERY GOOD",IF(J3>=60,"GOOD",IF(J3>=45,"Credit",IF(J3>=35,"PASS",IF(J3<35,"WEAK"))))))
 *
 * @param {number} total - Total score (0-100)
 * @returns {string} Remark text
 */
export const calculateRemark = (total) => {
  if (total == null || total === '' || isNaN(total)) {
    return '-';
  }

  const score = parseFloat(total);

  if (score >= 80) return 'EXCELLENT';
  if (score >= 70) return 'VERY GOOD';
  if (score >= 60) return 'GOOD';
  if (score >= 45) return 'Credit';
  if (score >= 35) return 'PASS';
  return 'WEAK';
};

/**
 * Grade scale configuration
 */
export const GRADE_SCALE = [
  { min: 80, max: 100, remark: 'EXCELLENT', color: '#10b981' },
  { min: 70, max: 79, remark: 'VERY GOOD', color: '#3b82f6' },
  { min: 60, max: 69, remark: 'GOOD', color: '#8b5cf6' },
  { min: 45, max: 59, remark: 'Credit', color: '#f59e0b' },
  { min: 35, max: 44, remark: 'PASS', color: '#ef4444' },
  { min: 0, max: 34, remark: 'WEAK', color: '#991b1b' }
];

/**
 * Get grade information including remark and color
 */
export const getGradeInfo = (total) => {
  if (total == null || total === '' || isNaN(total)) {
    return { remark: '-', color: '#6b7280', min: 0, max: 0 };
  }

  const score = parseFloat(total);
  const grade = GRADE_SCALE.find(g => score >= g.min && score <= g.max);

  return grade || { remark: '-', color: '#6b7280', min: 0, max: 0 };
};

/**
 * Format score for display
 */
export const formatScore = (score, decimals = 1) => {
  if (score == null || score === '' || isNaN(score)) {
    return '-';
  }

  return parseFloat(score).toFixed(decimals);
};

/**
 * Determine if a score is passing
 */
export const isPassing = (total) => {
  if (total == null || total === '' || isNaN(total)) {
    return false;
  }

  return parseFloat(total) >= 35;
};

/**
 * Calculate score details from student marks
 * Handles the scoring system: 4 tests × 15 = 60→50%, exam 100→50%
 */
export const calculateScoreDetails = (studentMarks) => {
  const test1 = parseFloat(studentMarks.test1) || 0;
  const test2 = parseFloat(studentMarks.test2) || 0;
  const test3 = parseFloat(studentMarks.test3) || 0;
  const test4 = parseFloat(studentMarks.test4) || 0;
  const exam = parseFloat(studentMarks.exam) || 0;

  // Calculate raw totals
  const testsTotal = test1 + test2 + test3 + test4; // Out of 60 (4 × 15)
  const testsScaled = (testsTotal / 60) * 50; // Scale to 50%
  const examScaled = (exam / 100) * 50; // Scale to 50%
  const total = testsScaled + examScaled; // Total out of 100

  const remark = calculateRemark(total);
  const grade = getGradeInfo(total);

  return {
    test1,
    test2,
    test3,
    test4,
    exam,
    testsTotal,
    testsScaled: parseFloat(testsScaled.toFixed(2)),
    examScaled: parseFloat(examScaled.toFixed(2)),
    total: parseFloat(total.toFixed(2)),
    remark,
    grade: grade.remark,
    color: grade.color
  };
};

/**
 * Calculate positions for students based on scores
 * Handles ties by giving same position
 */
export const calculatePositions = (students, scoreField = 'total') => {
  if (!students || students.length === 0) return [];

  // Sort by score descending
  const sorted = [...students].sort((a, b) => {
    const scoreA = parseFloat(a[scoreField]) || 0;
    const scoreB = parseFloat(b[scoreField]) || 0;
    return scoreB - scoreA;
  });

  // Assign positions with tie handling
  let currentPosition = 1;
  let previousScore = null;
  let sameScoreCount = 0;

  return sorted.map((student, index) => {
    const score = parseFloat(student[scoreField]) || 0;

    if (previousScore === null || score < previousScore) {
      currentPosition = index + 1;
      sameScoreCount = 0;
    } else if (score === previousScore) {
      sameScoreCount++;
    }

    previousScore = score;

    return {
      ...student,
      position: currentPosition
    };
  });
};

/**
 * Get CSS classes for remark color styling
 */
export const getRemarksColorClass = (remark) => {
  if (!remark || remark === '-') {
    return 'bg-gray-100 border-gray-300 text-gray-600';
  }

  const remarkUpper = remark.toUpperCase();

  switch (remarkUpper) {
    case 'EXCELLENT':
      return 'bg-green-50 border-green-500 text-green-700';
    case 'VERY GOOD':
      return 'bg-blue-50 border-blue-500 text-blue-700';
    case 'GOOD':
      return 'bg-purple-50 border-purple-500 text-purple-700';
    case 'CREDIT':
      return 'bg-yellow-50 border-yellow-500 text-yellow-700';
    case 'PASS':
      return 'bg-orange-50 border-orange-500 text-orange-700';
    case 'WEAK':
      return 'bg-red-50 border-red-500 text-red-700';
    default:
      return 'bg-gray-100 border-gray-300 text-gray-600';
  }
};

/**
 * Mock Exam Grading System
 * Based on percentage score, assigns a grade from 1-9
 */
export const MOCK_EXAM_GRADES = [
  { grade: 1, min: 90, max: 100, interpretation: 'Highest, excellent', color: '#10b981' },
  { grade: 2, min: 80, max: 89, interpretation: 'Very good', color: '#22c55e' },
  { grade: 3, min: 70, max: 79, interpretation: 'Good', color: '#3b82f6' },
  { grade: 4, min: 60, max: 69, interpretation: 'Credit', color: '#8b5cf6' },
  { grade: 5, min: 55, max: 59, interpretation: 'Average', color: '#f59e0b' },
  { grade: 6, min: 50, max: 54, interpretation: 'Average', color: '#f59e0b' },
  { grade: 7, min: 40, max: 49, interpretation: 'Pass', color: '#ef4444' },
  { grade: 8, min: 35, max: 39, interpretation: 'Pass', color: '#dc2626' },
  { grade: 9, min: 0, max: 34, interpretation: 'Lowest, fail', color: '#991b1b' }
];

/**
 * Calculate mock exam grade based on percentage score
 * @param {number} percentage - Score as percentage (0-100)
 * @returns {object} Grade information { grade, interpretation, color }
 */
export const calculateMockExamGrade = (percentage) => {
  if (percentage == null || percentage === '' || isNaN(percentage)) {
    return { grade: '-', interpretation: '-', color: '#6b7280' };
  }

  const score = parseFloat(percentage);
  const gradeInfo = MOCK_EXAM_GRADES.find(g => score >= g.min && score <= g.max);

  return gradeInfo || { grade: 9, interpretation: 'Lowest, fail', color: '#991b1b' };
};

/**
 * Get CSS classes for mock exam grade styling
 */
export const getMockExamGradeColorClass = (grade) => {
  if (!grade || grade === '-') {
    return 'bg-gray-100 border-gray-300 text-gray-600';
  }

  const gradeNum = parseInt(grade);

  switch (gradeNum) {
    case 1:
      return 'bg-green-50 border-green-600 text-green-800 font-bold';
    case 2:
      return 'bg-green-50 border-green-500 text-green-700';
    case 3:
      return 'bg-blue-50 border-blue-500 text-blue-700';
    case 4:
      return 'bg-purple-50 border-purple-500 text-purple-700';
    case 5:
    case 6:
      return 'bg-yellow-50 border-yellow-500 text-yellow-700';
    case 7:
    case 8:
      return 'bg-orange-50 border-orange-500 text-orange-700';
    case 9:
      return 'bg-red-50 border-red-600 text-red-800 font-bold';
    default:
      return 'bg-gray-100 border-gray-300 text-gray-600';
  }
};

/**
 * Format mock exam result for display
 * @param {number} score - Raw score
 * @param {number} maxScore - Maximum possible score
 * @returns {object} { percentage, grade, interpretation }
 */
export const formatMockExamResult = (score, maxScore = 100) => {
  if (score == null || score === '' || isNaN(score)) {
    return {
      percentage: 0,
      grade: '-',
      interpretation: '-',
      color: '#6b7280'
    };
  }

  const percentage = (parseFloat(score) / maxScore) * 100;
  const gradeInfo = calculateMockExamGrade(percentage);

  return {
    percentage: parseFloat(percentage.toFixed(1)),
    grade: gradeInfo.grade,
    interpretation: gradeInfo.interpretation,
    color: gradeInfo.color
  };
};
