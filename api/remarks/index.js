// API Endpoint: Form Master Remarks
// Handles CRUD operations for student remarks

import { sql } from '../lib/db.js';
import { extractUser, hasClassAccess } from '../lib/authMiddleware.js';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Authenticate user for all operations
    const user = extractUser(req);

    // GET: Fetch remarks
    if (req.method === 'GET') {
      const { studentId, className, term, year } = req.query;

      let query;
      const params = [];

      if (studentId) {
        // Get remarks for specific student
        // Note: studentId can be either the database ID (integer) or id_number (text like "eSBA007")
        // We need to check which one it is and handle accordingly

        // First try to parse as integer - if successful, it's a database ID
        const parsedId = parseInt(studentId);
        const isNumericId = !isNaN(parsedId) && parsedId.toString() === studentId.toString();

        if (isNumericId) {
          // It's a database ID, use it directly
          if (term && year) {
            query = sql`
              SELECT * FROM remarks
              WHERE student_id = ${parsedId}
              AND term = ${term}
              AND academic_year = ${year}
              ORDER BY created_at DESC
            `;
          } else if (term) {
            query = sql`
              SELECT * FROM remarks
              WHERE student_id = ${parsedId}
              AND term = ${term}
              ORDER BY created_at DESC
            `;
          } else if (year) {
            query = sql`
              SELECT * FROM remarks
              WHERE student_id = ${parsedId}
              AND academic_year = ${year}
              ORDER BY created_at DESC
            `;
          } else {
            query = sql`
              SELECT * FROM remarks
              WHERE student_id = ${parsedId}
              ORDER BY created_at DESC
            `;
          }
        } else {
          // It's an id_number (like "eSBA007"), need to join with students table
          if (term && year) {
            query = sql`
              SELECT r.* FROM remarks r
              JOIN students s ON r.student_id = s.id
              WHERE s.id_number = ${studentId}
              AND r.term = ${term}
              AND r.academic_year = ${year}
              ORDER BY r.created_at DESC
            `;
          } else if (term) {
            query = sql`
              SELECT r.* FROM remarks r
              JOIN students s ON r.student_id = s.id
              WHERE s.id_number = ${studentId}
              AND r.term = ${term}
              ORDER BY r.created_at DESC
            `;
          } else if (year) {
            query = sql`
              SELECT r.* FROM remarks r
              JOIN students s ON r.student_id = s.id
              WHERE s.id_number = ${studentId}
              AND r.academic_year = ${year}
              ORDER BY r.created_at DESC
            `;
          } else {
            query = sql`
              SELECT r.* FROM remarks r
              JOIN students s ON r.student_id = s.id
              WHERE s.id_number = ${studentId}
              ORDER BY r.created_at DESC
            `;
          }
        }
      } else if (className) {
        // Get remarks for entire class
        if (term && year) {
          query = sql`
            SELECT r.*, s.first_name, s.last_name, s.id_number
            FROM remarks r
            JOIN students s ON r.student_id = s.id
            WHERE s.class_name = ${className}
            AND r.term = ${term}
            AND r.academic_year = ${year}
            ORDER BY s.last_name, s.first_name
          `;
        } else if (term) {
          query = sql`
            SELECT r.*, s.first_name, s.last_name, s.id_number
            FROM remarks r
            JOIN students s ON r.student_id = s.id
            WHERE s.class_name = ${className}
            AND r.term = ${term}
            ORDER BY s.last_name, s.first_name
          `;
        } else if (year) {
          query = sql`
            SELECT r.*, s.first_name, s.last_name, s.id_number
            FROM remarks r
            JOIN students s ON r.student_id = s.id
            WHERE s.class_name = ${className}
            AND r.academic_year = ${year}
            ORDER BY s.last_name, s.first_name
          `;
        } else {
          query = sql`
            SELECT r.*, s.first_name, s.last_name, s.id_number
            FROM remarks r
            JOIN students s ON r.student_id = s.id
            WHERE s.class_name = ${className}
            ORDER BY s.last_name, s.first_name
          `;
        }
      } else {
        return res.status(400).json({
          status: 'error',
          message: 'studentId or className required'
        });
      }

      const results = await query;

      // Map database fields to camelCase
      const mappedResults = results.map(remark => ({
        id: remark.id,
        studentId: remark.student_id,
        className: remark.class_name,
        term: remark.term,
        academicYear: remark.academic_year,
        conduct: remark.conduct,
        attitude: remark.attitude,
        interest: remark.interest,
        remarks: remark.remarks,
        comments: remark.comments || remark.conduct || '', // Include comments field
        attendance: remark.attendance || '', // Include attendance field
        attendance_total: remark.attendance_total || remark.attendanceTotal || 0,
        vacationDate: remark.vacation_date || '',
        reopeningDate: remark.reopening_date || '',
        teacherId: remark.teacher_id,
        createdAt: remark.created_at,
        updatedAt: remark.updated_at,
        // Include student info if available
        ...(remark.first_name && {
          studentFirstName: remark.first_name,
          studentLastName: remark.last_name,
          studentIdNumber: remark.id_number
        })
      }));

      return res.json({
        status: 'success',
        data: mappedResults
      });
    }

    // POST: Create or update remarks
    if (req.method === 'POST') {
      const {
        studentId,
        className,
        term,
        academicYear,
        conduct,
        attitude,
        interest,
        remarks,
        comments,         // Added: Teacher comments
        attendance,       // Added: Attendance days present
        attendanceTotal,  // Added: Total school days
        vacationDate,     // Added: Vacation date
        reopeningDate,    // Added: Reopening date
        teacherId
      } = req.body;

      console.log('[remarks POST] Received data:', { studentId, className, term, academicYear, conduct, attitude, interest, remarks, comments, attendance, attendanceTotal, vacationDate, reopeningDate });

      // Validation
      if (!studentId || !className || !term || !academicYear) {
        return res.status(400).json({
          status: 'error',
          message: 'studentId, className, term, and academicYear are required'
        });
      }

      // Permission check: Only Class Teachers and Form Masters can add/update remarks
      // Subject Teachers should NOT be able to add remarks
      if (user) {
        const isClassTeacher = user.primaryRole === 'class_teacher' ||
                              user.all_roles?.includes('class_teacher');
        const isFormMaster = user.primaryRole === 'form_master' ||
                            user.all_roles?.includes('form_master');
        const isAdmin = user.primaryRole === 'admin' ||
                       user.all_roles?.includes('admin');

        // Head Teacher should NOT be able to add remarks (supervisor only)
        const isHeadTeacher = user.primaryRole === 'head_teacher' ||
                             user.all_roles?.includes('head_teacher');

        if (isHeadTeacher) {
          return res.status(403).json({
            status: 'error',
            message: 'Head Teachers cannot add or update remarks. This is for Class Teachers and Form Masters only.'
          });
        }

        // Only Class Teachers and Form Masters (and Admin) can add remarks
        if (!isAdmin && !isClassTeacher && !isFormMaster) {
          return res.status(403).json({
            status: 'error',
            message: 'Only Class Teachers and Form Masters can add or update remarks for their assigned class.'
          });
        }

        // Verify the teacher has access to this class
        if (!isAdmin && !hasClassAccess(user, className)) {
          return res.status(403).json({
            status: 'error',
            message: `Access denied. You are not assigned to class ${className}.`
          });
        }
      }

      // Handle both numeric database ID and string id_number
      let dbStudentId = studentId;
      const parsedId = parseInt(studentId);
      const isNumericId = !isNaN(parsedId) && parsedId.toString() === studentId.toString();

      if (!isNumericId) {
        // It's a string id_number, look up the database ID
        const studentLookup = await sql`
          SELECT id FROM students WHERE id_number = ${studentId}
        `;
        if (studentLookup.length === 0) {
          return res.status(404).json({
            status: 'error',
            message: `Student with id_number ${studentId} not found`
          });
        }
        dbStudentId = studentLookup[0].id;
      }

      // Check if remark already exists
      const existing = await sql`
        SELECT id FROM remarks
        WHERE student_id = ${dbStudentId}
        AND term = ${term}
        AND academic_year = ${academicYear}
      `;

      let result;

      if (existing.length > 0) {
        // Update existing remark
        result = await sql`
          UPDATE remarks
          SET
            conduct = ${conduct || comments || null},
            attitude = ${attitude || null},
            interest = ${interest || null},
            remarks = ${remarks || null},
            comments = ${comments || conduct || null},
            attendance = ${attendance || null},
            attendance_total = ${attendanceTotal || null},
            vacation_date = ${vacationDate || null},
            reopening_date = ${reopeningDate || null},
            teacher_id = ${teacherId || null},
            class_name = ${className},
            updated_at = NOW()
          WHERE id = ${existing[0].id}
          RETURNING *
        `;
      } else {
        // Insert new remark
        result = await sql`
          INSERT INTO remarks (
            student_id, class_name, term, academic_year,
            conduct, attitude, interest, remarks, comments, attendance, attendance_total,
            vacation_date, reopening_date, teacher_id
          ) VALUES (
            ${dbStudentId}, ${className}, ${term}, ${academicYear},
            ${conduct || comments || null}, ${attitude || null}, ${interest || null},
            ${remarks || null}, ${comments || conduct || null}, ${attendance || null},
            ${attendanceTotal || null}, ${vacationDate || null}, ${reopeningDate || null}, ${teacherId || null}
          )
          RETURNING *
        `;
      }

      // Map result to camelCase
      const mappedResult = {
        id: result[0].id,
        studentId: result[0].student_id,
        className: result[0].class_name,
        term: result[0].term,
        academicYear: result[0].academic_year,
        conduct: result[0].conduct,
        attitude: result[0].attitude,
        interest: result[0].interest,
        remarks: result[0].remarks,
        comments: result[0].comments || result[0].conduct || '',
        attendance: result[0].attendance || '',
        attendanceTotal: result[0].attendance_total || 0,
        vacationDate: result[0].vacation_date || '',
        reopeningDate: result[0].reopening_date || '',
        teacherId: result[0].teacher_id,
        createdAt: result[0].created_at,
        updatedAt: result[0].updated_at
      };

      console.log('[remarks POST] Returning mapped result:', mappedResult);

      return res.json({
        status: 'success',
        message: existing.length > 0 ? 'Remark updated successfully' : 'Remark created successfully',
        data: mappedResult
      });
    }

    // PUT: Update remarks (alternative method)
    if (req.method === 'PUT') {
      const { id, conduct, attitude, interest, remarks } = req.body;

      if (!id) {
        return res.status(400).json({
          status: 'error',
          message: 'Remark ID is required'
        });
      }

      const result = await sql`
        UPDATE remarks
        SET
          conduct = ${conduct || null},
          attitude = ${attitude || null},
          interest = ${interest || null},
          remarks = ${remarks || null},
          updated_at = NOW()
        WHERE id = ${id}
        RETURNING *
      `;

      if (result.length === 0) {
        return res.status(404).json({
          status: 'error',
          message: 'Remark not found'
        });
      }

      return res.json({
        status: 'success',
        message: 'Remark updated successfully',
        data: result[0]
      });
    }

    // DELETE: Delete remark
    if (req.method === 'DELETE') {
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({
          status: 'error',
          message: 'Remark ID is required'
        });
      }

      await sql`DELETE FROM remarks WHERE id = ${id}`;

      return res.json({
        status: 'success',
        message: 'Remark deleted successfully'
      });
    }

    return res.status(405).json({
      status: 'error',
      message: 'Method not allowed'
    });

  } catch (error) {
    console.error('Remarks API error:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error'
    });
  }
}
