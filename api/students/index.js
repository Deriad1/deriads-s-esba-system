import { sql } from '../lib/db.js';
import { validateStudentData } from '../../src/utils/validation.js';
import { mapStudentFromDb } from '../../src/utils/studentIdHelpers.js';

/**
 * API Endpoint: /api/students
 * Handles all student-related operations
 */
export default async function handler(req, res) {
  const { method, query, body } = req;

  try {
    switch (method) {
      case 'GET':
        return await handleGet(req, res);

      case 'POST':
        return await handlePost(req, res);

      case 'PUT':
        return await handlePut(req, res);

      case 'DELETE':
        return await handleDelete(req, res);

      default:
        return res.status(405).json({
          status: 'error',
          message: 'Method not allowed'
        });
    }
  } catch (error) {
    console.error('Students API error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      error: error.message
    });
  }
}

// GET /api/students - Get all students or filter by class
async function handleGet(req, res) {
  const { className, term, year } = req.query;

  try {
    let result;

    if (className) {
      // Get students by class
      result = await sql`
        SELECT
          id,
          id_number,
          first_name,
          last_name,
          class_name,
          gender,
          term,
          academic_year,
          email,
          phone_number,
          created_at,
          updated_at
        FROM students
        WHERE class_name = ${className}
        ORDER BY last_name, first_name
      `;
    } else {
      // Get all students
      result = await sql`
        SELECT
          id,
          id_number,
          first_name,
          last_name,
          class_name,
          gender,
          term,
          academic_year,
          email,
          phone_number,
          created_at,
          updated_at
        FROM students
        ORDER BY class_name, last_name, first_name
      `;
    }

    // Map snake_case to camelCase for frontend compatibility using helper
    const students = Array.isArray(result) ? result : (result.rows || []);
    const mappedStudents = students.map(student => mapStudentFromDb(student));

    return res.status(200).json({
      status: 'success',
      data: mappedStudents
    });
  } catch (error) {
    throw error;
  }
}

// POST /api/students - Add new student
async function handlePost(req, res) {
  const studentData = req.body;

  // Validate student data
  const validation = validateStudentData(studentData);
  if (!validation.isValid) {
    return res.status(400).json({
      status: 'error',
      message: 'Validation failed',
      errors: validation.errors
    });
  }

  try {
    // Insert student with all available fields including guardian contact info
    const result = await sql`
      INSERT INTO students (
        id_number, first_name, last_name, class_name,
        gender, email, phone_number, created_at, updated_at
      ) VALUES (
        ${studentData.idNumber},
        ${studentData.firstName},
        ${studentData.lastName},
        ${studentData.className},
        ${studentData.gender},
        ${studentData.email || null},
        ${studentData.phoneNumber || null},
        NOW(),
        NOW()
      )
      RETURNING *
    `;

    return res.status(201).json({
      status: 'success',
      message: 'Student added successfully',
      data: result[0]
    });
  } catch (error) {
    if (error.message.includes('duplicate key')) {
      return res.status(409).json({
        status: 'error',
        message: 'Student with this ID already exists'
      });
    }
    throw error;
  }
}

// PUT /api/students - Update student
async function handlePut(req, res) {
  const studentData = req.body;

  if (!studentData.id && !studentData.idNumber) {
    return res.status(400).json({
      status: 'error',
      message: 'Student ID is required'
    });
  }

  // Validate student data
  const validation = validateStudentData(studentData);
  if (!validation.isValid) {
    return res.status(400).json({
      status: 'error',
      message: 'Validation failed',
      errors: validation.errors
    });
  }

  try {
    // Update student with all fields including guardian contact info
    const result = await sql`
      UPDATE students
      SET first_name = ${studentData.firstName},
          last_name = ${studentData.lastName},
          class_name = ${studentData.className},
          gender = ${studentData.gender},
          email = ${studentData.email || null},
          phone_number = ${studentData.phoneNumber || null},
          id_number = ${studentData.idNumber || null},
          updated_at = NOW()
      WHERE id = ${studentData.id}
      RETURNING *
    `;

    if (result.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Student not found'
      });
    }

    return res.status(200).json({
      status: 'success',
      message: 'Student updated successfully',
      data: result[0]
    });
  } catch (error) {
    throw error;
  }
}

// DELETE /api/students - Delete student(s)
async function handleDelete(req, res) {
  const { id, idNumber, bulk } = req.query;
  const { ids } = req.body || {};

  try {
    let result;

    if (bulk && ids && Array.isArray(ids)) {
      // Bulk delete
      result = await sql`
        DELETE FROM students
        WHERE id = ANY(${ids})
        RETURNING id
      `;

      return res.status(200).json({
        status: 'success',
        message: `Deleted ${result.length} students`,
        count: result.length
      });
    } else if (id) {
      // Delete by database ID
      result = await sql`
        DELETE FROM students
        WHERE id = ${id}
        RETURNING id
      `;
    } else if (idNumber) {
      // Delete by student ID number
      result = await sql`
        DELETE FROM students
        WHERE id_number = ${idNumber}
        RETURNING id
      `;
    } else {
      return res.status(400).json({
        status: 'error',
        message: 'Student ID is required'
      });
    }

    if (result.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Student not found'
      });
    }

    return res.status(200).json({
      status: 'success',
      message: 'Student deleted successfully'
    });
  } catch (error) {
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
