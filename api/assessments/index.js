import { sql } from '../lib/db.js';

/**
 * API Endpoint: /api/assessments
 * Manages custom assessments (Midterm, Mock Exams, etc.)
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
    console.error('Assessments API error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      error: error.message
    });
  }
}

// GET /api/assessments - Get all assessments or filter
async function handleGet(req, res) {
  const { id, term, academicYear, active, type, className, subject } = req.query;

  try {
    let result;

    if (id) {
      // Get specific assessment
      result = await sql`
        SELECT * FROM assessments WHERE id = ${id}
      `;

      if (result.length === 0) {
        return res.status(404).json({
          status: 'error',
          message: 'Assessment not found'
        });
      }

      return res.status(200).json({
        status: 'success',
        data: result[0]
      });
    }

    // Get all assessments and filter in JavaScript for now
    // TODO: Optimize with proper SQL queries later
    result = await sql`SELECT * FROM assessments ORDER BY created_at DESC`;

    // Apply filters
    if (term) {
      result = result.filter(a => a.term === term);
    }

    if (academicYear) {
      result = result.filter(a => a.academic_year === academicYear);
    }

    if (active !== undefined) {
      const isActive = active === 'true' || active === true;
      result = result.filter(a => a.is_active === isActive);
    }

    if (type) {
      result = result.filter(a => a.assessment_type === type);
    }

    // Filter by class (if assessment applies to this class)
    if (className) {
      result = result.filter(a =>
        !a.applicable_classes ||
        a.applicable_classes.length === 0 ||
        a.applicable_classes.includes(className)
      );
    }

    // Filter by subject (if assessment applies to this subject)
    if (subject) {
      result = result.filter(a =>
        !a.applicable_subjects ||
        a.applicable_subjects.length === 0 ||
        a.applicable_subjects.includes(subject)
      );
    }

    return res.status(200).json({
      status: 'success',
      count: result.length,
      data: result
    });
  } catch (error) {
    throw error;
  }
}

// POST /api/assessments - Create new assessment
async function handlePost(req, res) {
  const {
    name,
    description,
    assessmentType,
    maxScore,
    term,
    academicYear,
    applicableClasses,
    applicableSubjects,
    startDate,
    endDate,
    createdBy
  } = req.body;

  // Validation
  if (!name || !assessmentType || !term || !academicYear) {
    return res.status(400).json({
      status: 'error',
      message: 'Missing required fields: name, assessmentType, term, academicYear'
    });
  }

  try {
    const result = await sql`
      INSERT INTO assessments (
        name,
        description,
        assessment_type,
        max_score,
        term,
        academic_year,
        applicable_classes,
        applicable_subjects,
        start_date,
        end_date,
        created_by,
        is_active
      ) VALUES (
        ${name},
        ${description || null},
        ${assessmentType},
        ${maxScore || 100},
        ${term},
        ${academicYear},
        ${applicableClasses || null},
        ${applicableSubjects || null},
        ${startDate || null},
        ${endDate || null},
        ${createdBy || null},
        true
      )
      RETURNING *
    `;

    return res.status(201).json({
      status: 'success',
      message: 'Assessment created successfully',
      data: result[0]
    });
  } catch (error) {
    throw error;
  }
}

// PUT /api/assessments - Update assessment
async function handlePut(req, res) {
  const { id } = req.query;
  const {
    name,
    description,
    assessmentType,
    maxScore,
    term,
    academicYear,
    applicableClasses,
    applicableSubjects,
    startDate,
    endDate,
    isActive
  } = req.body;

  if (!id) {
    return res.status(400).json({
      status: 'error',
      message: 'Assessment ID is required'
    });
  }

  try {
    // Check if assessment exists
    const existing = await sql`SELECT id FROM assessments WHERE id = ${id}`;

    if (existing.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Assessment not found'
      });
    }

    const result = await sql`
      UPDATE assessments
      SET
        name = COALESCE(${name}, name),
        description = COALESCE(${description}, description),
        assessment_type = COALESCE(${assessmentType}, assessment_type),
        max_score = COALESCE(${maxScore}, max_score),
        term = COALESCE(${term}, term),
        academic_year = COALESCE(${academicYear}, academic_year),
        applicable_classes = COALESCE(${applicableClasses}, applicable_classes),
        applicable_subjects = COALESCE(${applicableSubjects}, applicable_subjects),
        start_date = COALESCE(${startDate}, start_date),
        end_date = COALESCE(${endDate}, end_date),
        is_active = COALESCE(${isActive}, is_active),
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    return res.status(200).json({
      status: 'success',
      message: 'Assessment updated successfully',
      data: result[0]
    });
  } catch (error) {
    throw error;
  }
}

// DELETE /api/assessments - Delete assessment
async function handleDelete(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({
      status: 'error',
      message: 'Assessment ID is required'
    });
  }

  try {
    // Check if any marks are associated with this assessment
    const marksCount = await sql`
      SELECT COUNT(*) as count FROM marks WHERE assessment_id = ${id}
    `;

    if (marksCount[0].count > 0) {
      return res.status(400).json({
        status: 'error',
        message: `Cannot delete assessment: ${marksCount[0].count} marks records are associated with it. Consider deactivating instead.`
      });
    }

    // Delete assessment
    const result = await sql`
      DELETE FROM assessments WHERE id = ${id} RETURNING *
    `;

    if (result.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Assessment not found'
      });
    }

    return res.status(200).json({
      status: 'success',
      message: 'Assessment deleted successfully',
      data: result[0]
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
