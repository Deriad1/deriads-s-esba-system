// Debug endpoint to check student data
import { sql } from '../lib/db.js';

export default async function handler(req, res) {
  try {
    const { studentId, className } = req.query;

    console.log('[Debug Student Data] Query:', { studentId, className });

    // Get student info
    const students = await sql`
      SELECT * FROM students
      WHERE id_number = ${studentId} OR id::text = ${studentId}
      LIMIT 1
    `;

    if (students.length === 0) {
      return res.json({
        status: 'error',
        message: 'Student not found',
        query: { studentId, className }
      });
    }

    const student = students[0];
    console.log('[Debug Student Data] Found student:', student);

    // Get all marks for this student
    const marks = await sql`
      SELECT * FROM marks
      WHERE student_id = ${student.id}
      ORDER BY term, subject
    `;

    // Get all remarks for this student
    const remarks = await sql`
      SELECT * FROM remarks
      WHERE student_id = ${student.id}
      ORDER BY term
    `;

    // Get distinct terms from marks
    const termsInMarks = await sql`
      SELECT DISTINCT term, COUNT(*) as count
      FROM marks
      WHERE student_id = ${student.id}
      GROUP BY term
      ORDER BY term
    `;

    return res.json({
      status: 'success',
      student: {
        id: student.id,
        id_number: student.id_number,
        first_name: student.first_name,
        last_name: student.last_name,
        class_name: student.class_name
      },
      marks: {
        count: marks.length,
        terms: termsInMarks,
        data: marks
      },
      remarks: {
        count: remarks.length,
        data: remarks
      }
    });
  } catch (error) {
    console.error('[Debug Student Data] Error:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message,
      stack: error.stack
    });
  }
}
