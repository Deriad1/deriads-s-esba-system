import { sql } from '../lib/db.js';
import { requireAuth, getClassFilterForUser } from '../lib/authMiddleware.js';

/**
 * API Endpoint: /api/classes
 * Handles class-related operations
 *
 * SECURITY: Teachers can only see classes they are assigned to
 */
export default async function handler(req, res) {
  const { method } = req;

  try {
    switch (method) {
      case 'GET':
        return await handleGet(req, res);

      case 'POST':
        return await handlePost(req, res);

      case 'DELETE':
        return await handleDelete(req, res);

      default:
        return res.status(405).json({
          status: 'error',
          message: 'Method not allowed'
        });
    }
  } catch (error) {
    console.error('Classes API error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      error: error.message
    });
  }
}

// GET /api/classes - Get all unique classes
// SECURITY: Only returns classes the teacher is assigned to
async function handleGet(req, res) {
  try {
    // SECURITY: Authenticate user
    const user = requireAuth(req, res);
    if (!user) return; // Response already sent

    // Get class filter for user
    const classFilter = getClassFilterForUser(user);

    let result;

    if (classFilter.hasRestriction) {
      // Teacher: Only show their assigned classes
      if (classFilter.classes.length === 0) {
        return res.status(200).json({
          status: 'success',
          data: []
        });
      }

      // Get classes from both the classes table and students table
      // Filter by teacher's assigned classes
      result = await sql`
        SELECT DISTINCT class_name as name
        FROM (
          SELECT class_name FROM classes
          WHERE class_name = ANY(${classFilter.classes})
          UNION
          SELECT class_name FROM students
          WHERE class_name IS NOT NULL
            AND class_name != 'UNASSIGNED'
            AND class_name = ANY(${classFilter.classes})
        ) AS all_classes
        ORDER BY class_name
      `;
    } else {
      // Admin/Head Teacher: Show all classes
      result = await sql`
        SELECT DISTINCT class_name as name
        FROM (
          SELECT class_name FROM classes
          UNION
          SELECT class_name FROM students
          WHERE class_name IS NOT NULL AND class_name != 'UNASSIGNED'
        ) AS all_classes
        ORDER BY class_name
      `;
    }

    return res.status(200).json({
      status: 'success',
      data: result
    });
  } catch (error) {
    throw error;
  }
}

// POST /api/classes - Add new class
async function handlePost(req, res) {
  const { name } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({
      status: 'error',
      message: 'Class name is required'
    });
  }

  try {
    // Insert the class into the classes table (only class_name column)
    const result = await sql`
      INSERT INTO classes (class_name, created_at, updated_at)
      VALUES (${name.trim()}, NOW(), NOW())
      RETURNING *
    `;

    return res.status(201).json({
      status: 'success',
      message: `Class ${name} created successfully`,
      data: result[0]
    });
  } catch (error) {
    if (error.message.includes('duplicate key') || error.code === '23505') {
      return res.status(409).json({
        status: 'error',
        message: `Class ${name} already exists`
      });
    }
    throw error;
  }
}

// DELETE /api/classes - Delete class
async function handleDelete(req, res) {
  const { name } = req.query;

  if (!name) {
    return res.status(400).json({
      status: 'error',
      message: 'Class name is required'
    });
  }

  try {
    // Check if there are students in this class
    const studentsInClass = await sql`
      SELECT COUNT(*) as count
      FROM students
      WHERE class_name = ${name}
    `;

    const studentCount = parseInt(studentsInClass[0]?.count || 0);

    // Delete associated data
    // 1. Delete marks for this class
    await sql`
      DELETE FROM marks
      WHERE class_name = ${name}
    `;

    // 2. Delete remarks for this class
    await sql`
      DELETE FROM remarks
      WHERE class_name = ${name}
    `;

    // 3. Delete class_subjects assignments
    try {
      await sql`
        DELETE FROM class_subjects
        WHERE class_name = ${name}
      `;
    } catch (error) {
      // Table might not exist, continue
      console.log('class_subjects table not found, skipping');
    }

    // 4. Delete teacher_classes assignments
    try {
      await sql`
        DELETE FROM teacher_classes
        WHERE class_name = ${name}
      `;
    } catch (error) {
      // Table might not exist, continue
      console.log('teacher_classes table not found, skipping');
    }

    // 5. Update students to remove class assignment
    // Set their class_name to 'UNASSIGNED' instead of deleting students or setting to NULL
    // (class_name has a NOT NULL constraint in the database)
    if (studentCount > 0) {
      await sql`
        UPDATE students
        SET class_name = 'UNASSIGNED'
        WHERE class_name = ${name}
      `;
    }

    // 6. Delete from classes table
    await sql`
      DELETE FROM classes
      WHERE class_name = ${name}
    `;

    return res.status(200).json({
      status: 'success',
      message: `Class ${name} deleted successfully.${studentCount > 0 ? ` ${studentCount} student(s) moved to UNASSIGNED - please reassign them.` : ''}`,
      data: {
        deletedClass: name,
        studentsAffected: studentCount
      }
    });
  } catch (error) {
    console.error('Delete class error:', error);
    throw error;
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};
