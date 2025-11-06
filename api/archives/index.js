// API Endpoint: Term Archives
// Handles archiving and retrieval of term data

import { sql } from '../lib/db.js';

export default async function handler(req, res) {
  const { method } = req;

  try {
    switch (method) {
      case 'GET':
        return await handleGet(req, res);

      case 'POST':
        return await handlePost(req, res);

      case 'DELETE':
        return await handleDelete(req, res);

      default:
        return res.status(405).json({
          status: 'error',
          message: 'Method not allowed'
        });
    }
  } catch (error) {
    console.error('Archives API error:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error'
    });
  }
}

// GET /api/archives - Get all archives or specific archive
async function handleGet(req, res) {
  try {
    const { archiveId, term, year } = req.query;

    // If archiveId provided, get specific archive with details
    if (archiveId) {
      return await getArchiveDetails(archiveId, res);
    }

    // Otherwise, get list of all archives
    console.log('[Archives] Fetching archives list...');

    const archives = await sql`
      SELECT
        id,
        term,
        academic_year,
        archived_date,
        archived_by
      FROM archives
      ORDER BY archived_date DESC
    `;

    console.log(`[Archives] Found ${archives.length} archives`);

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
      // Count marks
      const marksResult = await sql`
        SELECT COUNT(*)::int as count
        FROM marks
        WHERE term = ${archive.term}
        AND academic_year = ${archive.academic_year}
      `;

      // Count remarks
      const remarksResult = await sql`
        SELECT COUNT(*)::int as count
        FROM remarks
        WHERE term = ${archive.term}
        AND academic_year = ${archive.academic_year}
      `;

      // Count distinct students
      const studentsResult = await sql`
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
        counts: {
          marks: marksResult[0]?.count || 0,
          remarks: remarksResult[0]?.count || 0,
          students: studentsResult[0]?.count || 0
        }
      });
    }

    return res.json({
      status: 'success',
      data: archivesWithCounts
    });

  } catch (error) {
    console.error('[Archives] GET error:', error);
    throw error;
  }
}

// Get specific archive with all data
async function getArchiveDetails(archiveId, res) {
  try {
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

    const archiveData = archive[0];

    // Get marks
    const marks = await sql`
      SELECT
        m.*,
        s.first_name,
        s.last_name,
        s.id_number
      FROM marks m
      LEFT JOIN students s ON m.student_id = s.id
      WHERE m.term = ${archiveData.term}
      AND m.academic_year = ${archiveData.academic_year}
    `;

    // Get remarks
    const remarks = await sql`
      SELECT
        r.*,
        s.first_name,
        s.last_name,
        s.id_number
      FROM remarks r
      LEFT JOIN students s ON r.student_id = s.id
      WHERE r.term = ${archiveData.term}
      AND r.academic_year = ${archiveData.academic_year}
    `;

    // Get students
    const students = await sql`
      SELECT DISTINCT s.*
      FROM students s
      INNER JOIN marks m ON s.id = m.student_id
      WHERE m.term = ${archiveData.term}
      AND m.academic_year = ${archiveData.academic_year}
    `;

    return res.json({
      status: 'success',
      data: {
        archive: {
          id: archiveData.id,
          term: archiveData.term,
          academicYear: archiveData.academic_year,
          archivedDate: archiveData.archived_date,
          archivedBy: archiveData.archived_by
        },
        marks: marks.map(m => ({
          id: m.id,
          studentId: m.student_id,
          studentName: `${m.first_name || ''} ${m.last_name || ''}`.trim(),
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
          studentName: `${r.first_name || ''} ${r.last_name || ''}`.trim(),
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

  } catch (error) {
    console.error('[Archives] Get details error:', error);
    throw error;
  }
}

// POST /api/archives - Create new archive
async function handlePost(req, res) {
  try {
    const { term, academicYear, archivedBy } = req.body;

    // Validation
    if (!term || !academicYear) {
      return res.status(400).json({
        status: 'error',
        message: 'term and academicYear are required'
      });
    }

    // Check if already exists
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

    // Verify there's data to archive
    const marksCount = await sql`
      SELECT COUNT(*) as count
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

    // Create archive
    const result = await sql`
      INSERT INTO archives (
        term,
        academic_year,
        archived_by
      ) VALUES (
        ${term},
        ${academicYear},
        ${archivedBy || null}
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
        archivedBy: result[0].archived_by
      }
    });

  } catch (error) {
    console.error('[Archives] POST error:', error);
    throw error;
  }
}

// DELETE /api/archives - Delete archive
async function handleDelete(req, res) {
  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({
        status: 'error',
        message: 'Archive ID is required'
      });
    }

    // Check if exists
    const archive = await sql`
      SELECT * FROM archives
      WHERE id = ${id}
    `;

    if (archive.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Archive not found'
      });
    }

    // Delete archive record (data remains in marks/remarks tables)
    await sql`DELETE FROM archives WHERE id = ${id}`;

    return res.json({
      status: 'success',
      message: 'Archive deleted successfully',
      note: 'Associated marks and remarks data has been preserved'
    });

  } catch (error) {
    console.error('[Archives] DELETE error:', error);
    throw error;
  }
}
