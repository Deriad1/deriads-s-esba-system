import { sql } from '../lib/db.js';

/**
 * API Endpoint: /api/students/promotion-history
 * Tracks student promotion history
 *
 * GET: Retrieve promotion history
 * POST: Record a new promotion
 */
export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      return await handleGet(req, res);
    } else if (req.method === 'POST') {
      return await handlePost(req, res);
    } else {
      return res.status(405).json({
        status: 'error',
        message: 'Method not allowed'
      });
    }
  } catch (error) {
    console.error('Promotion History API error:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error'
    });
  }
}

async function handleGet(req, res) {
  const { studentId, academicYear, limit } = req.query;

  let query;

  if (studentId) {
    // Get promotion history for specific student
    query = sql`
      SELECT
        ph.*,
        s.id_number,
        s.first_name,
        s.last_name,
        u.username as promoted_by_username
      FROM promotion_history ph
      LEFT JOIN students s ON ph.student_id = s.id
      LEFT JOIN users u ON ph.promoted_by = u.id
      WHERE ph.student_id = ${studentId}
      ORDER BY ph.promotion_date DESC
      ${limit ? sql`LIMIT ${parseInt(limit)}` : sql``}
    `;
  } else if (academicYear) {
    // Get all promotions for an academic year
    query = sql`
      SELECT
        ph.*,
        s.id_number,
        s.first_name,
        s.last_name,
        u.username as promoted_by_username
      FROM promotion_history ph
      LEFT JOIN students s ON ph.student_id = s.id
      LEFT JOIN users u ON ph.promoted_by = u.id
      WHERE ph.academic_year = ${academicYear}
      ORDER BY ph.promotion_date DESC
      ${limit ? sql`LIMIT ${parseInt(limit)}` : sql``}
    `;
  } else {
    // Get recent promotions
    query = sql`
      SELECT
        ph.*,
        s.id_number,
        s.first_name,
        s.last_name,
        u.username as promoted_by_username
      FROM promotion_history ph
      LEFT JOIN students s ON ph.student_id = s.id
      LEFT JOIN users u ON ph.promoted_by = u.id
      ORDER BY ph.promotion_date DESC
      ${limit ? sql`LIMIT ${parseInt(limit)}` : sql`LIMIT 100`}
    `;
  }

  const history = await query;

  return res.json({
    status: 'success',
    data: history
  });
}

async function handlePost(req, res) {
  const {
    studentId,
    fromClass,
    toClass,
    academicYear,
    term,
    promotedBy,
    notes
  } = req.body;

  // Validate required fields
  if (!studentId || !fromClass || !toClass || !academicYear) {
    return res.status(400).json({
      status: 'error',
      message: 'Missing required fields: studentId, fromClass, toClass, academicYear'
    });
  }

  // Check if promotion_history table exists, if not create it
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS promotion_history (
        id SERIAL PRIMARY KEY,
        student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        from_class VARCHAR(10) NOT NULL,
        to_class VARCHAR(10) NOT NULL,
        academic_year VARCHAR(20) NOT NULL,
        term VARCHAR(20),
        promotion_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        promoted_by INTEGER REFERENCES users(id),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
  } catch (error) {
    console.log('Promotion history table might already exist:', error.message);
  }

  // Insert promotion record
  const result = await sql`
    INSERT INTO promotion_history (
      student_id,
      from_class,
      to_class,
      academic_year,
      term,
      promoted_by,
      notes
    ) VALUES (
      ${studentId},
      ${fromClass},
      ${toClass},
      ${academicYear},
      ${term || 'First Term'},
      ${promotedBy || null},
      ${notes || ''}
    )
    RETURNING *
  `;

  return res.json({
    status: 'success',
    message: 'Promotion history recorded',
    data: result[0]
  });
}
