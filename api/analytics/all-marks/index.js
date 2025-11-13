// API Endpoint: All Marks Analytics
// Get all marks data for analytics dashboards

import { sql } from '../../lib/db.js';
import { requireAuth, getClassFilterForUser } from '../../lib/authMiddleware.js';

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

    // SECURITY: Authenticate user
    const user = requireAuth(req, res);
    if (!user) return; // Response already sent

    const { term, year, className, subject, teacherId } = req.query;

    // Get class and subject filters for user
    const classFilter = getClassFilterForUser(user);
    const teacherSubjects = user.subjects || [];

    // Get all marks with student information
    // Build query based on filters AND user access
    let marks;

    // SECURITY: Apply user access restrictions
    if (classFilter.hasRestriction) {
      // Teacher: Filter by assigned classes and subjects
      if (classFilter.classes.length === 0 || teacherSubjects.length === 0) {
        return res.status(200).json({
          status: 'success',
          data: []
        });
      }

      // Build conditions with user restrictions
      if (className) {
        // Verify access to specific class
        if (!classFilter.classes.includes(className)) {
          return res.status(403).json({
            status: 'error',
            message: 'Access denied to this class'
          });
        }
      }

      if (subject) {
        // Verify access to specific subject
        if (!teacherSubjects.includes(subject)) {
          return res.status(403).json({
            status: 'error',
            message: 'Access denied to this subject'
          });
        }
      }

      // Get marks filtered by teacher's classes and subjects
      if (term && year) {
        marks = await sql`
          SELECT
            m.*,
            s.first_name,
            s.last_name,
            s.id_number,
            s.class_name as student_class
          FROM marks m
          LEFT JOIN students s ON m.student_id::text = s.id_number
          WHERE m.class_name = ANY(${classFilter.classes})
            AND m.subject = ANY(${teacherSubjects})
            AND m.term = ${term}
            AND m.academic_year = ${year}
          ORDER BY s.last_name, s.first_name, m.subject
        `;
      } else if (className && subject) {
        marks = await sql`
          SELECT
            m.*,
            s.first_name,
            s.last_name,
            s.id_number,
            s.class_name as student_class
          FROM marks m
          LEFT JOIN students s ON m.student_id::text = s.id_number
          WHERE m.class_name = ${className}
            AND m.subject = ${subject}
          ORDER BY s.last_name, s.first_name, m.subject
        `;
      } else {
        // No specific filters - get all marks for teacher's assignments
        marks = await sql`
          SELECT
            m.*,
            s.first_name,
            s.last_name,
            s.id_number,
            s.class_name as student_class
          FROM marks m
          LEFT JOIN students s ON m.student_id::text = s.id_number
          WHERE m.class_name = ANY(${classFilter.classes})
            AND m.subject = ANY(${teacherSubjects})
          ORDER BY s.last_name, s.first_name, m.subject
        `;
      }
    } else if (!term && !year && !className && !subject && !teacherId) {
      // Admin/Head Teacher - No filters - get all marks
      marks = await sql`
        SELECT
          m.*,
          s.first_name,
          s.last_name,
          s.id_number,
          s.class_name as student_class
        FROM marks m
        LEFT JOIN students s ON m.student_id::text = s.id_number
        ORDER BY s.last_name, s.first_name, m.subject
      `;
    } else {
      // Build WHERE conditions
      const conditions = [];
      const params = {};

      if (term) conditions.push('m.term = ' + sql`${term}`.text);
      if (year) conditions.push('m.academic_year = ' + sql`${year}`.text);
      if (className) conditions.push('m.class_name = ' + sql`${className}`.text);
      if (subject) conditions.push('m.subject = ' + sql`${subject}`.text);
      if (teacherId) conditions.push('m.teacher_id = ' + sql`${teacherId}`.text);

      const whereClause = conditions.join(' AND ');

      // Construct query with filters
      const queryParts = [
        'SELECT m.*, s.first_name, s.last_name, s.id_number, s.class_name as student_class',
        'FROM marks m',
        'LEFT JOIN students s ON m.student_id = s.id_number',
        'WHERE ' + whereClause,
        'ORDER BY s.last_name, s.first_name, m.subject'
      ];

      // Use parameterized query with all filters
      if (term && year && className && subject && teacherId) {
        marks = await sql`
          SELECT m.*, s.first_name, s.last_name, s.id_number, s.class_name as student_class
          FROM marks m
          LEFT JOIN students s ON m.student_id::text = s.id_number
          WHERE m.term = ${term}
            AND m.academic_year = ${year}
            AND m.class_name = ${className}
            AND m.subject = ${subject}
            AND m.teacher_id = ${teacherId}
          ORDER BY s.last_name, s.first_name, m.subject
        `;
      } else if (term && year && className && subject) {
        marks = await sql`
          SELECT m.*, s.first_name, s.last_name, s.id_number, s.class_name as student_class
          FROM marks m
          LEFT JOIN students s ON m.student_id::text = s.id_number
          WHERE m.term = ${term}
            AND m.academic_year = ${year}
            AND m.class_name = ${className}
            AND m.subject = ${subject}
          ORDER BY s.last_name, s.first_name, m.subject
        `;
      } else if (term && year && className) {
        marks = await sql`
          SELECT m.*, s.first_name, s.last_name, s.id_number, s.class_name as student_class
          FROM marks m
          LEFT JOIN students s ON m.student_id::text = s.id_number
          WHERE m.term = ${term}
            AND m.academic_year = ${year}
            AND m.class_name = ${className}
          ORDER BY s.last_name, s.first_name, m.subject
        `;
      } else if (term && year) {
        marks = await sql`
          SELECT m.*, s.first_name, s.last_name, s.id_number, s.class_name as student_class
          FROM marks m
          LEFT JOIN students s ON m.student_id::text = s.id_number
          WHERE m.term = ${term}
            AND m.academic_year = ${year}
          ORDER BY s.last_name, s.first_name, m.subject
        `;
      } else if (className) {
        marks = await sql`
          SELECT m.*, s.first_name, s.last_name, s.id_number, s.class_name as student_class
          FROM marks m
          LEFT JOIN students s ON m.student_id::text = s.id_number
          WHERE m.class_name = ${className}
          ORDER BY s.last_name, s.first_name, m.subject
        `;
      } else if (term) {
        marks = await sql`
          SELECT m.*, s.first_name, s.last_name, s.id_number, s.class_name as student_class
          FROM marks m
          LEFT JOIN students s ON m.student_id::text = s.id_number
          WHERE m.term = ${term}
          ORDER BY s.last_name, s.first_name, m.subject
        `;
      } else {
        // Fallback for any other combination
        marks = await sql`
          SELECT m.*, s.first_name, s.last_name, s.id_number, s.class_name as student_class
          FROM marks m
          LEFT JOIN students s ON m.student_id::text = s.id_number
          ORDER BY s.last_name, s.first_name, m.subject
        `;
      }
    }

    // Calculate statistics
    const stats = {
      totalRecords: marks.length,
      averageClassScore: 0,
      averageExamsScore: 0,
      averageTotalScore: 0,
      highestScore: 0,
      lowestScore: 100,
      passRate: 0,
      subjectBreakdown: {},
      classBreakdown: {}
    };

    if (marks.length > 0) {
      let totalClassScore = 0;
      let totalExamsScore = 0;
      let totalScore = 0;
      let passCount = 0;

      marks.forEach(mark => {
        const classScore = parseFloat(mark.class_score || 0);
        const examsScore = parseFloat(mark.exams_score || 0);
        const total = classScore + examsScore;

        totalClassScore += classScore;
        totalExamsScore += examsScore;
        totalScore += total;

        // Track highest and lowest
        if (total > stats.highestScore) stats.highestScore = total;
        if (total < stats.lowestScore) stats.lowestScore = total;

        // Pass rate (50% threshold)
        if (total >= 50) passCount++;

        // Subject breakdown
        const subj = mark.subject;
        if (!stats.subjectBreakdown[subj]) {
          stats.subjectBreakdown[subj] = {
            count: 0,
            totalScore: 0,
            averageScore: 0
          };
        }
        stats.subjectBreakdown[subj].count++;
        stats.subjectBreakdown[subj].totalScore += total;

        // Class breakdown
        const cls = mark.class_name;
        if (!stats.classBreakdown[cls]) {
          stats.classBreakdown[cls] = {
            count: 0,
            totalScore: 0,
            averageScore: 0
          };
        }
        stats.classBreakdown[cls].count++;
        stats.classBreakdown[cls].totalScore += total;
      });

      stats.averageClassScore = (totalClassScore / marks.length).toFixed(2);
      stats.averageExamsScore = (totalExamsScore / marks.length).toFixed(2);
      stats.averageTotalScore = (totalScore / marks.length).toFixed(2);
      stats.passRate = ((passCount / marks.length) * 100).toFixed(1);

      // Calculate subject averages
      Object.keys(stats.subjectBreakdown).forEach(subject => {
        const data = stats.subjectBreakdown[subject];
        data.averageScore = (data.totalScore / data.count).toFixed(2);
      });

      // Calculate class averages
      Object.keys(stats.classBreakdown).forEach(className => {
        const data = stats.classBreakdown[className];
        data.averageScore = (data.totalScore / data.count).toFixed(2);
      });
    }

    // Map results to camelCase
    const mappedMarks = marks.map(mark => ({
      id: mark.id,
      studentId: mark.student_id,
      className: mark.class_name,
      subject: mark.subject,
      term: mark.term,
      academicYear: mark.academic_year,
      classScore: mark.class_score,
      examsScore: mark.exams_score,
      totalScore: (parseFloat(mark.class_score || 0) + parseFloat(mark.exams_score || 0)).toFixed(2),
      grade: mark.grade,
      remarks: mark.remarks,
      teacherId: mark.teacher_id,
      createdAt: mark.created_at,
      updatedAt: mark.updated_at,
      // Student info
      studentFirstName: mark.first_name,
      studentLastName: mark.last_name,
      studentIdNumber: mark.id_number
    }));

    return res.json({
      status: 'success',
      data: {
        marks: mappedMarks,
        statistics: stats,
        filters: {
          term: term || null,
          academicYear: year || null,
          className: className || null,
          subject: subject || null,
          teacherId: teacherId || null
        }
      }
    });

  } catch (error) {
    console.error('All Marks API error:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error'
    });
  }
}
