import { sql } from '../lib/db.js';

/**
 * API Endpoint: /api/broadsheet
 * Provides comprehensive class broadsheet data for printing
 * Returns all students, subjects, and scores for a specific class
 */
export default async function handler(req, res) {
  const { method } = req;

  try {
    if (method !== 'GET') {
      return res.status(405).json({
        status: 'error',
        message: 'Method not allowed. Use GET.'
      });
    }

    return await handleGet(req, res);
  } catch (error) {
    console.error('Broadsheet API error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      error: error.message
    });
  }
}

/**
 * GET /api/broadsheet?className=BS7&term=First Term
 * Returns comprehensive broadsheet data for a class
 */
async function handleGet(req, res) {
  const { className, term } = req.query;

  // Validate required parameters
  if (!className) {
    return res.status(400).json({
      status: 'error',
      message: 'className parameter is required'
    });
  }

  try {
    // 1. Get all students in the class
    const studentsResult = await sql`
      SELECT
        id,
        id_number as "idNumber",
        first_name as "firstName",
        last_name as "lastName",
        class_name as "className",
        gender
      FROM students
      WHERE class_name = ${className}
      ORDER BY last_name, first_name
    `;

    console.log('Raw studentsResult:', JSON.stringify(studentsResult).substring(0, 500));
    const students = Array.isArray(studentsResult) ? studentsResult : (studentsResult.rows || studentsResult || []);

    if (students.length === 0) {
      return res.status(200).json({
        status: 'success',
        message: 'No students found in this class',
        data: {
          students: [],
          subjects: [],
          scores: []
        }
      });
    }

    // 2. Get all unique subjects taught in this class (from marks table)
    let subjectsResult;
    if (term) {
      subjectsResult = await sql`
        SELECT DISTINCT m.subject
        FROM marks m
        JOIN students s ON m.student_id = s.id
        WHERE s.class_name = ${className}
        AND m.term = ${term}
        ORDER BY m.subject
      `;
    } else {
      subjectsResult = await sql`
        SELECT DISTINCT m.subject
        FROM marks m
        JOIN students s ON m.student_id = s.id
        WHERE s.class_name = ${className}
        ORDER BY m.subject
      `;
    }

    const subjects = Array.isArray(subjectsResult) ? subjectsResult.map(row => row.subject) : [];

    // 3. Get all scores for all students in this class
    let scoresResult;

    if (term) {
      scoresResult = await sql`
        SELECT
          m.id,
          m.student_id,
          s.id_number as "studentIdNumber",
          m.subject,
          m.test1,
          m.test2,
          m.test3,
          m.test4,
          m.exam,
          m.total,
          m.grade,
          m.remark,
          m.position,
          m.term,
          m.academic_year as "academicYear"
        FROM marks m
        JOIN students s ON m.student_id = s.id
        WHERE s.class_name = ${className}
        AND m.term = ${term}
        ORDER BY m.subject, s.last_name, s.first_name
      `;
    } else {
      scoresResult = await sql`
        SELECT
          m.id,
          m.student_id,
          s.id_number as "studentIdNumber",
          m.subject,
          m.test1,
          m.test2,
          m.test3,
          m.test4,
          m.exam,
          m.total,
          m.grade,
          m.remark,
          m.position,
          m.term,
          m.academic_year as "academicYear"
        FROM marks m
        JOIN students s ON m.student_id = s.id
        WHERE s.class_name = ${className}
        ORDER BY m.subject, s.last_name, s.first_name
      `;
    }

    const scores = Array.isArray(scoresResult) ? scoresResult : [];

    // 4. Calculate positions for each subject if not already set
    const scoresWithPositions = calculatePositions(scores, students);

    // 5. Return comprehensive broadsheet data
    return res.status(200).json({
      status: 'success',
      message: `Broadsheet data retrieved for ${className}`,
      data: {
        students,
        subjects,
        scores: scoresWithPositions,
        className,
        term: term || 'All Terms',
        totalStudents: students.length,
        totalSubjects: subjects.length
      }
    });

  } catch (error) {
    console.error('Error fetching broadsheet data:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch broadsheet data',
      error: error.message
    });
  }
}

/**
 * Calculate positions for each subject based on total scores
 * @param {Array} scores - Array of score objects
 * @param {Array} students - Array of student objects
 * @returns {Array} Scores with calculated positions
 */
function calculatePositions(scores, students) {
  // Group scores by subject
  const scoresBySubject = {};

  scores.forEach(score => {
    if (!scoresBySubject[score.subject]) {
      scoresBySubject[score.subject] = [];
    }
    scoresBySubject[score.subject].push(score);
  });

  // Calculate position for each subject
  Object.keys(scoresBySubject).forEach(subject => {
    const subjectScores = scoresBySubject[subject];

    // Sort by total score (descending)
    subjectScores.sort((a, b) => {
      const totalA = parseFloat(a.total) || 0;
      const totalB = parseFloat(b.total) || 0;
      return totalB - totalA;
    });

    // Assign positions (handle ties)
    let currentPosition = 1;
    let previousTotal = null;
    let sameScoreCount = 0;

    subjectScores.forEach((score, index) => {
      const currentTotal = parseFloat(score.total) || 0;

      // Check for tied scores
      if (previousTotal !== null && Math.abs(currentTotal - previousTotal) < 0.01) {
        // Same score as previous - keep same position
        sameScoreCount++;
      } else {
        // Different score - update position
        currentPosition = index + 1;
        sameScoreCount = 0;
      }

      score.calculatedPosition = currentPosition;
      previousTotal = currentTotal;
    });
  });

  return scores;
}

/**
 * Format position number with suffix (1st, 2nd, 3rd, etc.)
 * @param {Number} position - Position number
 * @returns {String} Formatted position
 */
function formatPosition(position) {
  const lastDigit = position % 10;
  const lastTwoDigits = position % 100;

  // Special case for 11th, 12th, 13th
  if (lastTwoDigits >= 11 && lastTwoDigits <= 13) {
    return `${position}th`;
  }

  // Regular cases
  switch (lastDigit) {
    case 1:
      return `${position}st`;
    case 2:
      return `${position}nd`;
    case 3:
      return `${position}rd`;
    default:
      return `${position}th`;
  }
}
