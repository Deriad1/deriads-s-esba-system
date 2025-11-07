import fs from 'fs';

const content = `// API Endpoint: Comprehensive Class Performance Analytics
// Get detailed analytics for a class with optional subject filtering

import { sql } from '../../lib/db.js';

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

    const { className, subject, term, year } = req.query;

    if (!className) {
      return res.status(400).json({
        status: 'error',
        message: 'className is required'
      });
    }

    // Get current term and academic year if not provided
    const currentTerm = term || 'First Term';
    const academicYear = year || '2024/2025';

    // Get all student_scores for the class
    let scoresQuery;
    if (subject) {
      scoresQuery = sql\`
        SELECT
          sc.student_id,
          sc.subject,
          sc.test1,
          sc.test2,
          sc.test3,
          sc.test4,
          sc.exam,
          sc.ca1,
          sc.ca2,
          sc.total,
          s.first_name,
          s.last_name,
          s.gender,
          s.class_name
        FROM student_scores sc
        JOIN students s ON sc.student_id = s.id_number
        WHERE s.class_name = \${className}
          AND sc.term = \${currentTerm}
          AND sc.academic_year = \${academicYear}
          AND sc.subject = \${subject}
          AND sc.total IS NOT NULL
        ORDER BY sc.total DESC
      \`;
    } else {
      scoresQuery = sql\`
        SELECT
          sc.student_id,
          sc.subject,
          sc.test1,
          sc.test2,
          sc.test3,
          sc.test4,
          sc.exam,
          sc.ca1,
          sc.ca2,
          sc.total,
          s.first_name,
          s.last_name,
          s.gender,
          s.class_name
        FROM student_scores sc
        JOIN students s ON sc.student_id = s.id_number
        WHERE s.class_name = \${className}
          AND sc.term = \${currentTerm}
          AND sc.academic_year = \${academicYear}
          AND sc.total IS NOT NULL
        ORDER BY sc.total DESC
      \`;
    }
    const scores = await scoresQuery;

    // Rename for compatibility with existing code
    const marks = scores;

    if (marks.length === 0) {
      return res.json({
        status: 'success',
        data: {
          className,
          subject: subject || 'All Subjects',
          term: currentTerm,
          academicYear,
          totalStudents: 0,
          studentsWithScores: 0,
          averageScore: 0,
          highestScore: 0,
          lowestScore: 0,
          performanceDistribution: {
            excellent: 0,
            veryGood: 0,
            good: 0,
            satisfactory: 0,
            fair: 0,
            needsImprovement: 0
          },
          topPerformers: [],
          subjectBreakdown: [],
          genderStats: {
            male: { count: 0, average: 0 },
            female: { count: 0, average: 0 }
          }
        }
      });
    }

    // Calculate overall statistics
    const totalScores = marks.map(m => parseFloat(m.total));
    const averageScore = totalScores.reduce((a, b) => a + b, 0) / totalScores.length;
    const highestScore = Math.max(...totalScores);
    const lowestScore = Math.min(...totalScores);

    // Performance distribution (based on total out of 100)
    const distribution = {
      excellent: marks.filter(m => m.total >= 90).length,
      veryGood: marks.filter(m => m.total >= 80 && m.total < 90).length,
      good: marks.filter(m => m.total >= 70 && m.total < 80).length,
      satisfactory: marks.filter(m => m.total >= 60 && m.total < 70).length,
      fair: marks.filter(m => m.total >= 50 && m.total < 60).length,
      needsImprovement: marks.filter(m => m.total < 50).length
    };

    // Top performers (top 10)
    const topPerformers = marks.slice(0, 10).map(m => ({
      studentId: m.student_id,
      name: \`\${m.first_name} \${m.last_name}\`,
      subject: m.subject,
      score: parseFloat(m.total).toFixed(2)
    }));

    // Subject breakdown (if no specific subject selected)
    let subjectBreakdown = [];
    if (!subject) {
      const subjects = [...new Set(marks.map(m => m.subject))];
      subjectBreakdown = subjects.map(subj => {
        const subjectMarks = marks.filter(m => m.subject === subj);
        const subjectScores = subjectMarks.map(m => parseFloat(m.total));
        const subjectAvg = subjectScores.reduce((a, b) => a + b, 0) / subjectScores.length;

        return {
          subject: subj,
          studentCount: subjectMarks.length,
          average: parseFloat(subjectAvg.toFixed(2)),
          highest: Math.max(...subjectScores),
          lowest: Math.min(...subjectScores)
        };
      });
    }

    // Gender statistics
    const maleMarks = marks.filter(m => m.gender?.toLowerCase() === 'male');
    const femaleMarks = marks.filter(m => m.gender?.toLowerCase() === 'female');

    const genderStats = {
      male: {
        count: maleMarks.length,
        average: maleMarks.length > 0
          ? parseFloat((maleMarks.reduce((sum, m) => sum + parseFloat(m.total), 0) / maleMarks.length).toFixed(2))
          : 0
      },
      female: {
        count: femaleMarks.length,
        average: femaleMarks.length > 0
          ? parseFloat((femaleMarks.reduce((sum, m) => sum + parseFloat(m.total), 0) / femaleMarks.length).toFixed(2))
          : 0
      }
    };

    // Get total students in class
    const studentCount = await sql\`
      SELECT COUNT(*) as count
      FROM students
      WHERE class_name = \${className}
    \`;

    const totalStudents = parseInt(studentCount[0].count);

    return res.json({
      status: 'success',
      data: {
        className,
        subject: subject || 'All Subjects',
        term: currentTerm,
        academicYear,
        totalStudents,
        studentsWithScores: marks.length,
        averageScore: parseFloat(averageScore.toFixed(2)),
        highestScore: parseFloat(highestScore.toFixed(2)),
        lowestScore: parseFloat(lowestScore.toFixed(2)),
        performanceDistribution: distribution,
        topPerformers,
        subjectBreakdown,
        genderStats
      }
    });

  } catch (error) {
    console.error('Class Performance Analytics API error:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error'
    });
  }
}
`;

fs.writeFileSync('api/analytics/class-performance/index.js', content);
console.log('✅ Fixed class-performance API');
process.exit(0);
