import { sql } from '../lib/db.js';
import { validateTeacherData } from '../../src/utils/validation.js';
import { getCurrentTermInfo } from '../../src/utils/termHelpers.js';
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

/**
 * API Endpoint: /api/teachers
 * Handles all teacher-related operations
 */
export default async function handler(req, res) {
  const { method } = req;

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
    console.error('Teachers API error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      error: error.message
    });
  }
}

// GET /api/teachers
async function handleGet(req, res) {
  try {
    // Set cache-control headers to prevent stale data
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    const result = await sql`
      SELECT id, first_name, last_name, email, gender,
             teacher_primary_role, all_roles, classes, subjects,
             class_assigned, form_class, phone,
             requires_password_change, created_at, updated_at
      FROM teachers
      ORDER BY last_name, first_name
    `;

    return res.status(200).json({
      status: 'success',
      data: result
    });
  } catch (error) {
    throw error;
  }
}

// POST /api/teachers - Add new teacher
async function handlePost(req, res) {
  const teacherData = req.body;

  console.log('Received teacher data:', JSON.stringify(teacherData, null, 2));

  // Validate teacher data
  const validation = validateTeacherData(teacherData);
  if (!validation.isValid) {
    console.error('Teacher validation failed:', validation.errors);
    console.error('Teacher data received:', JSON.stringify(teacherData, null, 2));
    return res.status(400).json({
      status: 'error',
      message: `Validation failed: ${Object.keys(validation.errors).join(', ')}`,
      errors: validation.errors,
      details: validation.errors
    });
  }

  try {
    // Get current term and academic year information
    const { currentTerm, currentYear } = getCurrentTermInfo();

    // Hash password if provided
    let hashedPassword = null;
    if (teacherData.password) {
      const salt = await bcrypt.genSalt(SALT_ROUNDS);
      hashedPassword = await bcrypt.hash(teacherData.password, salt);
    }

    const result = await sql`
      INSERT INTO teachers (
        first_name, last_name, email, gender, password,
        teacher_primary_role, all_roles, classes, subjects,
        class_assigned, form_class, phone, term, academic_year,
        requires_password_change, created_at, updated_at
      ) VALUES (
        ${teacherData.firstName},
        ${teacherData.lastName},
        ${teacherData.email},
        ${teacherData.gender},
        ${hashedPassword},
        ${teacherData.primaryRole || 'teacher'},
        ${teacherData.allRoles || ['teacher']},
        ${teacherData.classes || []},
        ${teacherData.subjects || []},
        ${teacherData.classAssigned || null},
        ${teacherData.formClass || teacherData.form_class || null},
        ${teacherData.phone || null},
        ${currentTerm},
        ${currentYear},
        ${teacherData.requiresPasswordChange !== undefined ? teacherData.requiresPasswordChange : true},
        NOW(),
        NOW()
      )
      RETURNING id, first_name, last_name, email, teacher_primary_role
    `;

    return res.status(201).json({
      status: 'success',
      message: 'Teacher added successfully',
      data: result[0]
    });
  } catch (error) {
    if (error.message.includes('duplicate key')) {
      return res.status(409).json({
        status: 'error',
        message: 'Teacher with this email already exists'
      });
    }
    throw error;
  }
}

// PUT /api/teachers - Update teacher
async function handlePut(req, res) {
  const teacherData = req.body;

  if (!teacherData.id) {
    return res.status(400).json({
      status: 'error',
      message: 'Teacher ID is required'
    });
  }

  // Validate teacher data
  const validation = validateTeacherData(teacherData);
  if (!validation.isValid) {
    console.error('Teacher validation failed:', validation.errors);
    console.error('Teacher data received:', JSON.stringify(teacherData, null, 2));
    return res.status(400).json({
      status: 'error',
      message: `Validation failed: ${Object.keys(validation.errors).join(', ')}`,
      errors: validation.errors,
      details: validation.errors
    });
  }

  try {
    // Get existing teacher to preserve password if not being updated
    const existingResult = await sql`
      SELECT password FROM teachers WHERE id = ${teacherData.id}
    `;

    let updatedPassword = existingResult[0]?.password;

    // Hash password if provided
    if (teacherData.password) {
      const salt = await bcrypt.genSalt(SALT_ROUNDS);
      updatedPassword = await bcrypt.hash(teacherData.password, salt);
    }

    // Update classes array to include form_class
    let classesArray = teacherData.classes || [];
    const assignedClass = teacherData.form_class || teacherData.classAssigned;
    if (assignedClass && !classesArray.includes(assignedClass)) {
      classesArray = [...classesArray, assignedClass];
    }

    const result = await sql`
      UPDATE teachers
      SET first_name = ${teacherData.firstName},
          last_name = ${teacherData.lastName},
          email = ${teacherData.email},
          gender = ${teacherData.gender},
          password = ${updatedPassword},
          teacher_primary_role = ${teacherData.primaryRole},
          all_roles = ${teacherData.allRoles || ['teacher']},
          classes = ${classesArray},
          subjects = ${teacherData.subjects || []},
          class_assigned = ${teacherData.classAssigned || null},
          form_class = ${teacherData.form_class || teacherData.formClass || null},
          phone = ${teacherData.phone || null},
          updated_at = NOW()
      WHERE id = ${teacherData.id}
      RETURNING id, first_name, last_name, email, teacher_primary_role
    `;

    if (result.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Teacher not found'
      });
    }

    return res.status(200).json({
      status: 'success',
      message: 'Teacher updated successfully',
      data: result[0]
    });
  } catch (error) {
    throw error;
  }
}

// DELETE /api/teachers
async function handleDelete(req, res) {
  const { id, bulk } = req.query;
  const { ids } = req.body || {};

  try {
    let result;

    if (bulk && ids && Array.isArray(ids)) {
      // Bulk delete
      result = await sql`
        DELETE FROM teachers
        WHERE id = ANY(${ids})
        RETURNING id
      `;

      return res.status(200).json({
        status: 'success',
        message: `Deleted ${result.length} teachers`,
        count: result.length
      });
    } else if (id) {
      // Delete single teacher
      result = await sql`
        DELETE FROM teachers
        WHERE id = ${id}
        RETURNING id
      `;

      if (result.length === 0) {
        return res.status(404).json({
          status: 'error',
          message: 'Teacher not found'
        });
      }

      return res.status(200).json({
        status: 'success',
        message: 'Teacher deleted successfully'
      });
    } else {
      return res.status(400).json({
        status: 'error',
        message: 'Teacher ID is required'
      });
    }
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
