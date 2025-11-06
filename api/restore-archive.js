import { sql } from './lib/db.js';

/**
 * Restore Archive API
 * Loads archived data back into the current term
 *
 * WARNING: This will OVERWRITE current term data!
 * Use with caution - recommend backing up current term first
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      status: 'error',
      message: 'Method not allowed'
    });
  }

  try {
    const { archiveId, targetTerm, targetYear, overwriteMode } = req.body;

    if (!archiveId || !targetTerm || !targetYear) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required fields: archiveId, targetTerm, targetYear'
      });
    }

    console.log('[Restore] Starting restore process...', {
      archiveId,
      targetTerm,
      targetYear,
      overwriteMode
    });

    // Step 1: Get archive details
    const archives = await sql`
      SELECT id, term, academic_year
      FROM archives
      WHERE id = ${archiveId}
    `;

    if (archives.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Archive not found'
      });
    }

    const archive = archives[0];
    console.log('[Restore] Found archive:', archive);

    // Step 2: Get archived marks
    const archivedMarks = await sql`
      SELECT *
      FROM marks
      WHERE term = ${archive.term}
      AND academic_year = ${archive.academic_year}
    `;

    console.log('[Restore] Found', archivedMarks.length, 'marks to restore');

    // Step 3: Get archived remarks
    const archivedRemarks = await sql`
      SELECT *
      FROM remarks
      WHERE term = ${archive.term}
      AND academic_year = ${archive.academic_year}
    `;

    console.log('[Restore] Found', archivedRemarks.length, 'remarks to restore');

    // Step 4: Handle overwrite mode
    if (overwriteMode === 'replace') {
      // Delete existing data for target term
      console.log('[Restore] Deleting existing data for', targetTerm, targetYear);

      await sql`
        DELETE FROM marks
        WHERE term = ${targetTerm}
        AND academic_year = ${targetYear}
      `;

      await sql`
        DELETE FROM remarks
        WHERE term = ${targetTerm}
        AND academic_year = ${targetYear}
      `;
    } else if (overwriteMode === 'merge') {
      // Delete only conflicting records (same student, subject, term)
      console.log('[Restore] Merging with existing data');

      for (const mark of archivedMarks) {
        await sql`
          DELETE FROM marks
          WHERE student_id = ${mark.student_id}
          AND subject = ${mark.subject}
          AND term = ${targetTerm}
          AND academic_year = ${targetYear}
        `;
      }

      for (const remark of archivedRemarks) {
        await sql`
          DELETE FROM remarks
          WHERE student_id = ${remark.student_id}
          AND term = ${targetTerm}
          AND academic_year = ${targetYear}
        `;
      }
    }

    // Step 5: Insert marks with new term/year
    let restoredMarks = 0;
    for (const mark of archivedMarks) {
      await sql`
        INSERT INTO marks (
          student_id, term, academic_year, subject,
          class_score, exams_score, grade, remarks,
          teacher_id
        ) VALUES (
          ${mark.student_id},
          ${targetTerm},
          ${targetYear},
          ${mark.subject},
          ${mark.class_score},
          ${mark.exams_score},
          ${mark.grade},
          ${mark.remarks || ''},
          ${mark.teacher_id}
        )
      `;
      restoredMarks++;
    }

    console.log('[Restore] Restored', restoredMarks, 'marks');

    // Step 6: Insert remarks with new term/year
    let restoredRemarks = 0;
    for (const remark of archivedRemarks) {
      await sql`
        INSERT INTO remarks (
          student_id, term, academic_year,
          conduct, attitude, interest, remarks,
          teacher_id
        ) VALUES (
          ${remark.student_id},
          ${targetTerm},
          ${targetYear},
          ${remark.conduct || ''},
          ${remark.attitude || ''},
          ${remark.interest || ''},
          ${remark.remarks || ''},
          ${remark.teacher_id}
        )
      `;
      restoredRemarks++;
    }

    console.log('[Restore] Restored', restoredRemarks, 'remarks');

    return res.json({
      status: 'success',
      message: 'Archive restored successfully',
      data: {
        restoredMarks,
        restoredRemarks,
        sourceTerm: archive.term,
        sourceYear: archive.academic_year,
        targetTerm,
        targetYear
      }
    });

  } catch (error) {
    console.error('[Restore] Error:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to restore archive'
    });
  }
}
