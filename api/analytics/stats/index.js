// API Endpoint: System Statistics
// Get overall system statistics

import { sql } from '../../../lib/db.js';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    if (req.method !== 'GET') {
      return res.status(405).json({
        status: 'error',
        message: 'Method not allowed'
      });
    }

    const { term, year } = req.query;

    // Get current term and year if not provided
    const currentTerm = term || 'First Term';
    const academicYear = year || new Date().getFullYear() + '/' + (new Date().getFullYear() + 1);

    // Get total students
    const studentsResult = await sql`
      SELECT COUNT(*) as count
      FROM students
      WHERE term = ${currentTerm}
      AND academic_year = ${academicYear}
    `;

    // Get total teachers
    const teachersResult = await sql`
      SELECT COUNT(*) as count
      FROM teachers
      WHERE term = ${currentTerm}
      AND academic_year = ${academicYear}
    `;

    // Get total classes (distinct class names)
    const classesResult = await sql`
      SELECT COUNT(DISTINCT class_name) as count
      FROM students
      WHERE term = ${currentTerm}
      AND academic_year = ${academicYear}
    `;

    // Get marks entry progress
    const marksResult = await sql`
      SELECT COUNT(DISTINCT student_id) as students_with_marks
      FROM marks
      WHERE term = ${currentTerm}
      AND academic_year = ${academicYear}
    `;

    // Get remarks entry progress
    const remarksResult = await sql`
      SELECT COUNT(DISTINCT student_id) as students_with_remarks
      FROM remarks
      WHERE term = ${currentTerm}
      AND academic_year = ${academicYear}
    `;

    // Calculate average performance
    const avgPerformanceResult = await sql`
      SELECT AVG(
        COALESCE(class_score, 0) +
        COALESCE(exams_score, 0)
      ) as avg_score
      FROM marks
      WHERE term = ${currentTerm}
      AND academic_year = ${academicYear}
    `;

    const totalStudents = parseInt(studentsResult[0]?.count || 0);
    const studentsWithMarks = parseInt(marksResult[0]?.students_with_marks || 0);
    const studentsWithRemarks = parseInt(remarksResult[0]?.students_with_remarks || 0);

    const stats = {
      totalStudents,
      totalTeachers: parseInt(teachersResult[0]?.count || 0),
      totalClasses: parseInt(classesResult[0]?.count || 0),
      marksProgress: totalStudents > 0 ? ((studentsWithMarks / totalStudents) * 100).toFixed(1) : 0,
      remarksProgress: totalStudents > 0 ? ((studentsWithRemarks / totalStudents) * 100).toFixed(1) : 0,
      averagePerformance: parseFloat(avgPerformanceResult[0]?.avg_score || 0).toFixed(2),
      term: currentTerm,
      academicYear
    };

    return res.json({
      status: 'success',
      data: stats
    });

  } catch (error) {
    console.error('Stats API error:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error'
    });
  }
}
