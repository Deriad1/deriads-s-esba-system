/**
 * Aggregate Score Calculation for Mock Exams
 *
 * Calculates aggregate score by:
 * 1. Adding grades from 4 core subjects: English Language, Mathematics, Integrated Science, Social Studies
 * 2. Adding grades from best 2 subjects from remaining subjects
 *
 * Lower aggregate is better (Grade 1 is best, Grade 9 is worst)
 */

// Core subjects that must be included
export const CORE_SUBJECTS = [
  'English Language',
  'Mathematics',
  'Integrated Science',
  'Social Studies'
];

/**
 * Calculate aggregate score for a student
 * @param {Array} studentScores - Array of score objects { subject, score, grade, percentage }
 * @returns {Object} { aggregate, coreGrades, bestTwoGrades, missingCoreSubjects, eligibleForAggregate }
 */
export const calculateAggregate = (studentScores) => {
  if (!studentScores || studentScores.length === 0) {
    return {
      aggregate: null,
      coreGrades: {},
      bestTwoGrades: [],
      missingCoreSubjects: CORE_SUBJECTS,
      eligibleForAggregate: false,
      message: 'No scores available'
    };
  }

  // Separate core and elective subjects
  const coreGrades = {};
  const electiveGrades = [];
  const missingCoreSubjects = [];

  // Check for core subjects
  CORE_SUBJECTS.forEach(coreSubject => {
    const score = studentScores.find(s =>
      s.subject?.toLowerCase() === coreSubject.toLowerCase()
    );

    if (score && score.grade && score.grade !== '-') {
      coreGrades[coreSubject] = {
        subject: coreSubject,
        grade: parseInt(score.grade),
        percentage: score.percentage,
        interpretation: score.interpretation
      };
    } else {
      missingCoreSubjects.push(coreSubject);
    }
  });

  // If any core subject is missing, student is not eligible for aggregate
  if (missingCoreSubjects.length > 0) {
    return {
      aggregate: null,
      coreGrades,
      bestTwoGrades: [],
      missingCoreSubjects,
      eligibleForAggregate: false,
      message: `Missing core subject(s): ${missingCoreSubjects.join(', ')}`
    };
  }

  // Collect elective subjects (non-core subjects with valid grades)
  studentScores.forEach(score => {
    const isCore = CORE_SUBJECTS.some(
      core => core.toLowerCase() === score.subject?.toLowerCase()
    );

    if (!isCore && score.grade && score.grade !== '-') {
      electiveGrades.push({
        subject: score.subject,
        grade: parseInt(score.grade),
        percentage: score.percentage,
        interpretation: score.interpretation
      });
    }
  });

  // Sort electives by grade (ascending - lower is better)
  electiveGrades.sort((a, b) => a.grade - b.grade);

  // Get best 2 elective subjects
  const bestTwoGrades = electiveGrades.slice(0, 2);

  // If less than 2 elective subjects, not eligible
  if (bestTwoGrades.length < 2) {
    return {
      aggregate: null,
      coreGrades,
      bestTwoGrades,
      missingCoreSubjects: [],
      eligibleForAggregate: false,
      message: `Need at least 2 elective subjects (currently have ${bestTwoGrades.length})`
    };
  }

  // Calculate aggregate: sum of core grades + sum of best 2 elective grades
  const coreSum = Object.values(coreGrades).reduce((sum, item) => sum + item.grade, 0);
  const electiveSum = bestTwoGrades.reduce((sum, item) => sum + item.grade, 0);
  const aggregate = coreSum + electiveSum;

  return {
    aggregate,
    coreGrades,
    bestTwoGrades,
    missingCoreSubjects: [],
    eligibleForAggregate: true,
    message: 'Aggregate calculated successfully'
  };
};

/**
 * Get aggregate interpretation based on aggregate score
 * Lower is better (6 is excellent, 54 is very poor)
 */
export const getAggregateInterpretation = (aggregate) => {
  if (aggregate === null || aggregate === undefined) {
    return { interpretation: 'N/A', color: '#6b7280', class: 'bg-gray-100 text-gray-600' };
  }

  // Best possible: 6 (all subjects grade 1)
  // Worst possible: 54 (all subjects grade 9)
  if (aggregate <= 12) {
    return {
      interpretation: 'Outstanding',
      color: '#10b981',
      class: 'bg-green-100 text-green-800 border-green-600'
    };
  } else if (aggregate <= 18) {
    return {
      interpretation: 'Excellent',
      color: '#22c55e',
      class: 'bg-green-50 text-green-700 border-green-500'
    };
  } else if (aggregate <= 24) {
    return {
      interpretation: 'Very Good',
      color: '#3b82f6',
      class: 'bg-blue-50 text-blue-700 border-blue-500'
    };
  } else if (aggregate <= 30) {
    return {
      interpretation: 'Good',
      color: '#8b5cf6',
      class: 'bg-purple-50 text-purple-700 border-purple-500'
    };
  } else if (aggregate <= 36) {
    return {
      interpretation: 'Average',
      color: '#f59e0b',
      class: 'bg-yellow-50 text-yellow-700 border-yellow-500'
    };
  } else if (aggregate <= 42) {
    return {
      interpretation: 'Fair',
      color: '#ef4444',
      class: 'bg-orange-50 text-orange-700 border-orange-500'
    };
  } else {
    return {
      interpretation: 'Weak',
      color: '#991b1b',
      class: 'bg-red-50 text-red-800 border-red-600'
    };
  }
};

/**
 * Calculate aggregate for multiple students
 * @param {Array} students - Array of student objects with their scores
 * @returns {Array} Students with aggregate information added
 */
export const calculateClassAggregates = (students) => {
  return students.map(student => {
    const aggregateInfo = calculateAggregate(student.scores);
    return {
      ...student,
      ...aggregateInfo,
      aggregateInterpretation: getAggregateInterpretation(aggregateInfo.aggregate)
    };
  }).sort((a, b) => {
    // Sort by aggregate (lower is better)
    if (a.aggregate === null) return 1;
    if (b.aggregate === null) return -1;
    return a.aggregate - b.aggregate;
  });
};

/**
 * Format aggregate display
 */
export const formatAggregateDisplay = (aggregateInfo) => {
  if (!aggregateInfo.eligibleForAggregate) {
    return {
      display: 'N/A',
      tooltip: aggregateInfo.message,
      breakdown: null
    };
  }

  const coreGradesList = Object.entries(aggregateInfo.coreGrades)
    .map(([subject, info]) => `${subject}: ${info.grade}`)
    .join(', ');

  const electiveGradesList = aggregateInfo.bestTwoGrades
    .map(item => `${item.subject}: ${item.grade}`)
    .join(', ');

  return {
    display: aggregateInfo.aggregate,
    tooltip: `Core: ${coreGradesList} | Best 2: ${electiveGradesList}`,
    breakdown: {
      core: aggregateInfo.coreGrades,
      bestTwo: aggregateInfo.bestTwoGrades
    }
  };
};

/**
 * Check if a subject is a core subject
 */
export const isCoreSubject = (subject) => {
  return CORE_SUBJECTS.some(
    core => core.toLowerCase() === subject?.toLowerCase()
  );
};
