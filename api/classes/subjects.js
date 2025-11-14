import { sql } from '../lib/db.js';
import { requireAuth } from '../lib/authMiddleware.js';

/**
 * API Endpoint: /api/classes/subjects
 * Get all subjects assigned to a specific class based on teacher assignments
 */
export default async function handler(req, res) {
  const { method } = req;

  try {
    // Require authentication
    const authResult = await requireAuth(req, res);
    if (!authResult.success) {
      return; // requireAuth already sent the response
    }

    if (method !== 'GET') {
      return res.status(405).json({
        status: 'error',
        message: 'Method not allowed'
      });
    }

    const { className } = req.query;

    if (!className) {
      return res.status(400).json({
        status: 'error',
        message: 'className query parameter is required'
      });
    }

    // Get all teachers who teach this class
    const teachers = await sql`
      SELECT DISTINCT subjects
      FROM teachers
      WHERE classes @> ARRAY[${className}]::text[]
      OR class_assigned = ${className}
      OR form_class = ${className}
    `;

    // Collect all unique subjects from all teachers
    const subjectsSet = new Set();

    teachers.forEach(teacher => {
      if (Array.isArray(teacher.subjects)) {
        teacher.subjects.forEach(subject => subjectsSet.add(subject));
      }
    });

    const subjects = Array.from(subjectsSet).sort();

    return res.status(200).json({
      status: 'success',
      data: {
        className,
        subjects,
        count: subjects.length
      }
    });

  } catch (error) {
    console.error('Get class subjects error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      error: error.message
    });
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};
