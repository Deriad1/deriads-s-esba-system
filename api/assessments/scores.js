import { query } from '../lib/db.js';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      // Get assessment scores
      const { assessment_id, class_name, subject, student_id } = req.query;

      if (!assessment_id) {
        return res.status(400).json({
          status: 'error',
          message: 'assessment_id is required'
        });
      }

      let sqlQuery;
      let params;

      if (student_id) {
        // Get all scores for a specific student
        sqlQuery = `
          SELECT
            acs.*,
            s.first_name,
            s.last_name,
            s.class_name,
            a.name as assessment_name,
            a.max_score
          FROM assessment_scores acs
          JOIN students s ON acs.student_id = s.id_number
          JOIN assessments a ON acs.assessment_id = a.id
          WHERE acs.assessment_id = $1 AND acs.student_id = $2
          ORDER BY acs.subject
        `;
        params = [assessment_id, student_id];
      } else if (class_name && subject) {
        // Get scores for a class and subject
        sqlQuery = `
          SELECT
            acs.*,
            s.first_name,
            s.last_name,
            s.id_number,
            s.class_name
          FROM assessment_scores acs
          JOIN students s ON acs.student_id = s.id_number
          WHERE acs.assessment_id = $1
            AND s.class_name = $2
            AND acs.subject = $3
          ORDER BY s.last_name, s.first_name
        `;
        params = [assessment_id, class_name, subject];
      } else {
        return res.status(400).json({
          status: 'error',
          message: 'Either student_id or (class_name and subject) is required'
        });
      }

      const result = await query(sqlQuery, params);

      return res.status(200).json({
        status: 'success',
        data: result.rows
      });

    } else if (req.method === 'POST') {
      // Save assessment score
      const { assessment_id, student_id, subject, score } = req.body;

      if (!assessment_id || !student_id || !subject || score === undefined) {
        return res.status(400).json({
          status: 'error',
          message: 'assessment_id, student_id, subject, and score are required'
        });
      }

      // Check if score already exists
      const checkQuery = `
        SELECT id FROM assessment_scores
        WHERE assessment_id = $1 AND student_id = $2 AND subject = $3
      `;
      const existing = await query(checkQuery, [assessment_id, student_id, subject]);

      let result;
      if (existing.rows.length > 0) {
        // Update existing score
        const updateQuery = `
          UPDATE assessment_scores
          SET score = $1, updated_at = CURRENT_TIMESTAMP
          WHERE assessment_id = $2 AND student_id = $3 AND subject = $4
          RETURNING *
        `;
        result = await query(updateQuery, [score, assessment_id, student_id, subject]);
      } else {
        // Insert new score
        const insertQuery = `
          INSERT INTO assessment_scores (assessment_id, student_id, subject, score)
          VALUES ($1, $2, $3, $4)
          RETURNING *
        `;
        result = await query(insertQuery, [assessment_id, student_id, subject, score]);
      }

      return res.status(200).json({
        status: 'success',
        message: 'Score saved successfully',
        data: result.rows[0]
      });

    } else {
      return res.status(405).json({
        status: 'error',
        message: 'Method not allowed'
      });
    }

  } catch (error) {
    console.error('Assessment scores API error:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error'
    });
  }
}
