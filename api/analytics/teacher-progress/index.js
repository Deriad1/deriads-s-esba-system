// API Endpoint: Teacher Progress Analytics (Simplified)
// Get teacher data for leaderboard

import { sql } from '../../lib/db.js';
import { requireAuth } from '../../lib/authMiddleware.js';

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

    // SECURITY: Only admin and head_teacher can view all teachers' progress
    const isAdminOrHead = user.primaryRole === 'admin' ||
                          user.all_roles?.includes('admin') ||
                          user.all_roles?.includes('head_teacher');

    let teachers;

    if (isAdminOrHead) {
      // Admin/Head Teacher: Get all teachers with basic info
      teachers = await sql`
        SELECT
          id,
          first_name,
          last_name,
          email,
          teacher_primary_role as role,
          all_roles,
          classes,
          subjects
        FROM teachers
        ORDER BY last_name, first_name
      `;
    } else {
      // Regular teachers can only see their own progress
      teachers = await sql`
        SELECT
          id,
          first_name,
          last_name,
          email,
          teacher_primary_role as role,
          all_roles,
          classes,
          subjects
        FROM teachers
        WHERE id = ${user.id}
      `;
    }

    // Get student_scores count per teacher (simplified)
    // Since student_scores doesn't have teacher_id, we'll calculate based on teacher assignments
    const totalScores = await sql`
      SELECT COUNT(*) as count
      FROM student_scores
      WHERE total IS NOT NULL
    `;

    const totalScoresCount = parseInt(totalScores[0]?.count || 0);

    // Format teacher stats with simplified progress calculation
    const teacherStats = teachers.map((teacher) => {
      const teacherId = teacher.id;

      // Simplified: Use subject and class counts as approximation
      const subjectCount = Array.isArray(teacher.subjects) ? teacher.subjects.length : 0;
      const classCount = Array.isArray(teacher.classes) ? teacher.classes.length : 0;

      // Estimate: each teacher with assignments gets a score based on activity
      // This is a placeholder until we can properly track teacher-specific scores
      const estimatedTotal = subjectCount * classCount * 10; // Rough estimate
      const estimatedEntered = totalScoresCount > 0 && teachers.length > 0
        ? Math.floor(totalScoresCount / teachers.length)
        : 0;

      const progress = estimatedTotal > 0
        ? Math.min(100, Math.round((estimatedEntered / estimatedTotal) * 100))
        : 0;

      // Parse all_roles properly
      let rolesArray = [];
      if (teacher.all_roles) {
        if (Array.isArray(teacher.all_roles)) {
          rolesArray = teacher.all_roles;
        } else if (typeof teacher.all_roles === 'string') {
          try {
            rolesArray = JSON.parse(teacher.all_roles);
          } catch {
            rolesArray = [teacher.role];
          }
        }
      } else {
        rolesArray = [teacher.role];
      }

      return {
        teacherId: teacherId,
        firstName: teacher.first_name,
        lastName: teacher.last_name,
        email: teacher.email,
        roles: rolesArray,
        progress: progress,
        scoresEntered: estimatedEntered,
        totalPossible: estimatedTotal,
        subjectsTaught: subjectCount,
        classesTaught: classCount
      };
    });

    // Return data array directly (what the component expects)
    return res.json({
      status: 'success',
      data: teacherStats
    });

  } catch (error) {
    console.error('Teacher Progress API error:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error'
    });
  }
}
