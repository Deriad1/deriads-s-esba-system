import { sql } from '../lib/db.js';

/**
 * API Endpoint: /api/students/promote
 * Handles student promotion to next class
 *
 * Authorized Roles: admin, head_teacher, form_master, class_teacher
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      status: 'error',
      message: 'Method not allowed. Use POST.'
    });
  }

  try {
    const { studentIds, targetClass, academicYear, term } = req.body;

    // Validate input
    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Student IDs are required and must be an array'
      });
    }

    if (!targetClass) {
      return res.status(400).json({
        status: 'error',
        message: 'Target class is required'
      });
    }

    // Update students
    const results = [];
    const errors = [];

    for (const studentId of studentIds) {
      try {
        // Get current student data
        const currentStudent = await sql`
          SELECT id, id_number, first_name, last_name, class_name
          FROM students
          WHERE id = ${studentId}
        `;

        if (currentStudent.length === 0) {
          errors.push({ studentId, error: 'Student not found' });
          continue;
        }

        // Handle graduated students
        if (targetClass === 'Graduated') {
          // Instead of deleting, we'll keep them but mark as graduated
          // You might want to move them to a separate 'graduated_students' table
          await sql`
            UPDATE students
            SET class_name = 'Graduated'
            WHERE id = ${studentId}
          `;
        } else {
          // Update student class only (students table doesn't have term/year columns)
          await sql`
            UPDATE students
            SET class_name = ${targetClass}
            WHERE id = ${studentId}
          `;
        }

        // Record promotion history
        try {
          await sql`
            INSERT INTO promotion_history (
              student_id,
              from_class,
              to_class,
              academic_year,
              term,
              promotion_date
            ) VALUES (
              ${studentId},
              ${currentStudent[0].class_name},
              ${targetClass},
              ${academicYear || 'Not specified'},
              ${term || 'First Term'},
              NOW()
            )
          `;
        } catch (historyError) {
          console.log('Note: Could not record promotion history:', historyError.message);
          // Don't fail the promotion if history recording fails
        }

        results.push({
          studentId,
          studentName: `${currentStudent[0].first_name} ${currentStudent[0].last_name}`,
          fromClass: currentStudent[0].class_name,
          toClass: targetClass,
          success: true
        });

      } catch (error) {
        console.error(`Error promoting student ${studentId}:`, error);
        errors.push({ studentId, error: error.message });
      }
    }

    return res.status(200).json({
      status: 'success',
      message: `Successfully promoted ${results.length} student(s)`,
      data: {
        promoted: results,
        errors: errors,
        totalProcessed: studentIds.length,
        successCount: results.length,
        errorCount: errors.length
      }
    });

  } catch (error) {
    console.error('❌ Promotion API error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'An error occurred during promotion',
      error: error.message
    });
  }
}
