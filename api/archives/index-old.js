// API Endpoint: Term Archives
// Handles archiving and retrieval of term data

import { sql } from '../lib/db.js';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // GET: Fetch archived terms or specific archive
    if (req.method === 'GET') {
      const { archiveId, term, year } = req.query;

      if (archiveId) {
        // Get specific archive with all related data
        const archive = await sql`
          SELECT * FROM archives
          WHERE id = ${archiveId}
        `;

        if (archive.length === 0) {
          return res.status(404).json({
            status: 'error',
            message: 'Archive not found'
          });
        }

        // Get archived marks
        const marks = await sql`
          SELECT m.*, s.first_name, s.last_name, s.id_number
          FROM marks m
          LEFT JOIN students s ON m.student_id = s.id
          WHERE m.term = ${archive[0].term}
          AND m.academic_year = ${archive[0].academic_year}
        `;

        // Get archived remarks
        const remarks = await sql`
          SELECT r.*, s.first_name, s.last_name, s.id_number
          FROM remarks r
          LEFT JOIN students s ON r.student_id = s.id
          WHERE r.term = ${archive[0].term}
          AND r.academic_year = ${archive[0].academic_year}
        `;

        // Get archived students (get distinct students who have marks in this term)
        const students = await sql`
          SELECT DISTINCT s.*
          FROM students s
          INNER JOIN marks m ON s.id = m.student_id
          WHERE m.term = ${archive[0].term}
          AND m.academic_year = ${archive[0].academic_year}
        `;

        return res.json({
          status: 'success',
          data: {
            archive: {
              id: archive[0].id,
              term: archive[0].term,
              academicYear: archive[0].academic_year,
              archivedDate: archive[0].archived_date,
              archivedBy: archive[0].archived_by,
              metadata: archive[0].metadata
            },
            marks: marks.map(m => ({
              id: m.id,
              studentId: m.student_id,
              studentName: `${m.first_name} ${m.last_name}`,
              idNumber: m.id_number,
              className: m.class_name,
              subject: m.subject,
              classScore: m.class_score,
              examsScore: m.exams_score,
              grade: m.grade,
              remarks: m.remarks
            })),
            remarks: remarks.map(r => ({
              id: r.id,
              studentId: r.student_id,
              studentName: `${r.first_name} ${r.last_name}`,
              idNumber: r.id_number,
              conduct: r.conduct,
              attitude: r.attitude,
              interest: r.interest,
              remarks: r.remarks
            })),
            students: students.map(s => ({
              id: s.id,
              firstName: s.first_name,
              lastName: s.last_name,
              idNumber: s.id_number,
              className: s.class_name,
              dateOfBirth: s.date_of_birth
            }))
          }
        });
      }

      // Get list of all archives - simplified version without counts first
      console.log('[Archives API] Fetching archives...');

      let archives;

      try {
        if (term && year) {
          archives = await sql`
            SELECT
              id,
              term,
              academic_year,
              archived_date,
              archived_by
            FROM archives
            WHERE term = ${term}
            AND academic_year = ${year}
            ORDER BY archived_date DESC
          `;
        } else if (year) {
          archives = await sql`
            SELECT
              id,
              term,
              academic_year,
              archived_date,
              archived_by
            FROM archives
            WHERE academic_year = ${year}
            ORDER BY archived_date DESC
          `;
        } else {
          archives = await sql`
            SELECT
              id,
              term,
              academic_year,
              archived_date,
              archived_by
            FROM archives
            ORDER BY archived_date DESC
          `;
        }
      } catch (queryError) {
        console.error('[Archives API] Query error:', queryError);
        throw queryError;
      }

      console.log(`[Archives API] Found ${archives.length} archives`);

      // Return empty array if no archives
      if (archives.length === 0) {
        return res.json({
          status: 'success',
          data: []
        });
      }

      // Get counts for each archive
      const archivesWithCounts = [];

      for (const archive of archives) {
        try {
          // Get marks count
          const [markCountResult] = await sql`
            SELECT COUNT(*)::int as count
            FROM marks
            WHERE term = ${archive.term}
            AND academic_year = ${archive.academic_year}
          `;

          // Get remarks count
          const [remarkCountResult] = await sql`
            SELECT COUNT(*)::int as count
            FROM remarks
            WHERE term = ${archive.term}
            AND academic_year = ${archive.academic_year}
          `;

          // Get unique student count from marks
          const [studentCountResult] = await sql`
            SELECT COUNT(DISTINCT student_id)::int as count
            FROM marks
            WHERE term = ${archive.term}
            AND academic_year = ${archive.academic_year}
          `;

          archivesWithCounts.push({
            id: archive.id,
            term: archive.term,
            academicYear: archive.academic_year,
            archivedDate: archive.archived_date,
            archivedBy: archive.archived_by,
            metadata: null,
            counts: {
              marks: markCountResult?.count || 0,
              remarks: remarkCountResult?.count || 0,
              students: studentCountResult?.count || 0
            }
          });
        } catch (countError) {
          console.error(`[Archives API] Error counting for archive ${archive.id}:`, countError);
          // Add archive with zero counts if error
          archivesWithCounts.push({
            id: archive.id,
            term: archive.term,
            academicYear: archive.academic_year,
            archivedDate: archive.archived_date,
            archivedBy: archive.archived_by,
            metadata: null,
            counts: { marks: 0, remarks: 0, students: 0 }
          });
        }
      }

      return res.json({
        status: 'success',
        data: archivesWithCounts
      });
    }

    // POST: Create new archive
    if (req.method === 'POST') {
      const { term, academicYear, archivedBy, metadata } = req.body;

      // Validation
      if (!term || !academicYear) {
        return res.status(400).json({
          status: 'error',
          message: 'term and academicYear are required'
        });
      }

      // Check if archive already exists
      const existing = await sql`
        SELECT id FROM archives
        WHERE term = ${term}
        AND academic_year = ${academicYear}
      `;

      if (existing.length > 0) {
        return res.status(409).json({
          status: 'error',
          message: 'Archive already exists for this term and year'
        });
      }

      // Verify that there is data to archive
      const marksCount = await sql`
        SELECT COUNT(*) as count
        FROM marks
        WHERE term = ${term}
        AND academic_year = ${academicYear}
      `;

      const studentsCount = await sql`
        SELECT COUNT(DISTINCT student_id) as count
        FROM marks
        WHERE term = ${term}
        AND academic_year = ${academicYear}
      `;

      if (parseInt(marksCount[0]?.count || 0) === 0) {
        return res.status(400).json({
          status: 'error',
          message: 'No marks data found to archive for this term and year'
        });
      }

      // Create archive record
      const result = await sql`
        INSERT INTO archives (
          term,
          academic_year,
          archived_by,
          metadata
        ) VALUES (
          ${term},
          ${academicYear},
          ${archivedBy || null},
          ${metadata ? JSON.stringify(metadata) : null}
        )
        RETURNING *
      `;

      return res.json({
        status: 'success',
        message: 'Term archived successfully',
        data: {
          id: result[0].id,
          term: result[0].term,
          academicYear: result[0].academic_year,
          archivedDate: result[0].archived_date,
          archivedBy: result[0].archived_by,
          metadata: result[0].metadata
        }
      });
    }

    // DELETE: Delete archive
    if (req.method === 'DELETE') {
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({
          status: 'error',
          message: 'Archive ID is required'
        });
      }

      // Get archive info before deleting
      const archive = await sql`
        SELECT term, academic_year FROM archives
        WHERE id = ${id}
      `;

      if (archive.length === 0) {
        return res.status(404).json({
          status: 'error',
          message: 'Archive not found'
        });
      }

      // Note: We don't delete the actual marks/remarks/students data
      // We only delete the archive record itself
      // This allows for soft deletion - data remains but is no longer "archived"
      await sql`DELETE FROM archives WHERE id = ${id}`;

      return res.json({
        status: 'success',
        message: 'Archive deleted successfully',
        note: 'The associated marks, remarks, and student data have been preserved'
      });
    }

    return res.status(405).json({
      status: 'error',
      message: 'Method not allowed'
    });

  } catch (error) {
    console.error('Archives API error:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error'
    });
  }
}
