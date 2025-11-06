import { query } from '../lib/db.js';
import { formatMockExamResult } from '../../src/utils/gradeHelpers.js';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      const { assessment_id, class_name } = req.query;

      if (!assessment_id || !class_name) {
        return res.status(400).json({
          status: 'error',
          message: 'assessment_id and class_name are required'
        });
      }

      // Get assessment info
      const assessmentQuery = `
        SELECT id, name, max_score
        FROM assessments
        WHERE id = $1
      `;
      const assessmentResult = await query(assessmentQuery, [assessment_id]);

      if (assessmentResult.rows.length === 0) {
        return res.status(404).json({
          status: 'error',
          message: 'Assessment not found'
        });
      }

      const assessment = assessmentResult.rows[0];

      // Get all students in the class
      const studentsQuery = `
        SELECT id_number, first_name, last_name, class_name
        FROM students
        WHERE class_name = $1
        ORDER BY last_name, first_name
      `;
      const studentsResult = await query(studentsQuery, [class_name]);

      // Get all scores for this assessment and class
      const scoresQuery = `
        SELECT
          acs.student_id,
          acs.subject,
          acs.score
        FROM assessment_scores acs
        JOIN students s ON acs.student_id = s.id_number
        WHERE acs.assessment_id = $1 AND s.class_name = $2
      `;
      const scoresResult = await query(scoresQuery, [assessment_id, class_name]);

      // Build student data with scores
      const studentsWithScores = studentsResult.rows.map(student => {
        // Get all scores for this student
        const studentScores = scoresResult.rows
          .filter(score => score.student_id === student.id_number)
          .map(score => {
            const result = formatMockExamResult(
              parseFloat(score.score),
              assessment.max_score
            );
            return {
              subject: score.subject,
              score: score.score,
              percentage: result.percentage,
              grade: result.grade,
              interpretation: result.interpretation
            };
          });

        return {
          studentId: student.id_number,
          firstName: student.first_name,
          lastName: student.last_name,
          className: student.class_name,
          scores: studentScores
        };
      });

      return res.status(200).json({
        status: 'success',
        data: studentsWithScores,
        assessment: {
          id: assessment.id,
          name: assessment.name,
          maxScore: assessment.max_score
        }
      });

    } else {
      return res.status(405).json({
        status: 'error',
        message: 'Method not allowed'
      });
    }

  } catch (error) {
    console.error('Assessment aggregates API error:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error'
    });
  }
}
