// API Endpoint: Performance Trends
// Get class performance trends across terms

import { sql } from '../../../lib/db.js';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    if (req.method !== 'GET') {
      return res.status(405).json({
        status: 'error',
        message: 'Method not allowed'
      });
    }

    const { className, subject, year } = req.query;

    if (!className || !subject) {
      return res.status(400).json({
        status: 'error',
        message: 'className and subject are required'
      });
    }

    // Get current academic year if not provided
    const academicYear = year || new Date().getFullYear() + '/' + (new Date().getFullYear() + 1);

    // Get performance data for all three terms
    const terms = ['First Term', 'Second Term', 'Third Term'];
    const trendsData = {};

    for (const term of terms) {
      const results = await sql`
        SELECT
          AVG(COALESCE(total, 0)) as average_score,
          MAX(COALESCE(total, 0)) as highest_score,
          MIN(COALESCE(total, 0)) as lowest_score,
          COUNT(DISTINCT student_id) as student_count
        FROM marks
        WHERE class_name = ${className}
        AND subject = ${subject}
        AND term = ${term}
        AND academic_year = ${academicYear}
        AND total IS NOT NULL
      `;

      trendsData[term] = {
        averageScore: parseFloat(results[0]?.average_score || 0).toFixed(2),
        highestScore: parseFloat(results[0]?.highest_score || 0).toFixed(2),
        lowestScore: parseFloat(results[0]?.lowest_score || 0).toFixed(2),
        studentCount: parseInt(results[0]?.student_count || 0)
      };
    }

    return res.json({
      status: 'success',
      data: trendsData
    });

  } catch (error) {
    console.error('Trends API error:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error'
    });
  }
}
