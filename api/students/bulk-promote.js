import { sql } from '../lib/db.js';

/**
 * API Endpoint: /api/students/bulk-promote
 * Promote all students in specific classes at once (end of year mass promotion)
 *
 * POST: Promote all students from specified classes
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      status: 'error',
      message: 'Method not allowed. Use POST.'
    });
  }

  try {
    const {
      sourceClasses,  // Array of classes to promote FROM (e.g., ['BS7', 'BS8'])
      academicYear,   // New academic year
      term,           // New term (usually "First Term")
      autoProgress    // If true, use default progression (BS7 → BS8, BS8 → BS9, etc.)
    } = req.body;

    if (!sourceClasses || !Array.isArray(sourceClasses) || sourceClasses.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Source classes are required and must be an array'
      });
    }

    if (!academicYear) {
      return res.status(400).json({
        status: 'error',
        message: 'Academic year is required'
      });
    }

    const CLASS_PROGRESSION = {
      'KG1': 'KG2',
      'KG2': 'BS1',
      'BS1': 'BS2',
      'BS2': 'BS3',
      'BS3': 'BS4',
      'BS4': 'BS5',
      'BS5': 'BS6',
      'BS6': 'BS7',
      'BS7': 'BS8',
      'BS8': 'BS9',
      'BS9': 'Graduated',
      'BS10': 'Graduated',
      'BS11': 'Graduated',
      'BS12': 'Graduated'
    };

    const results = {
      totalProcessed: 0,
      successCount: 0,
      errorCount: 0,
      byClass: {}
    };

    // Process each source class
    for (const sourceClass of sourceClasses) {
      const targetClass = autoProgress ? CLASS_PROGRESSION[sourceClass] : null;

      if (!targetClass) {
        results.byClass[sourceClass] = {
          error: 'No progression defined for this class',
          studentsPromoted: 0
        };
        continue;
      }

      try {
        // Get all students in this class
        const students = await sql`
          SELECT id, id_number, first_name, last_name, class_name
          FROM students
          WHERE class_name = ${sourceClass}
        `;

        if (students.length === 0) {
          results.byClass[sourceClass] = {
            message: 'No students found in this class',
            studentsPromoted: 0
          };
          continue;
        }

        let promotedCount = 0;
        let errorCount = 0;

        // Promote each student
        for (const student of students) {
          try {
            // Update student class
            if (targetClass === 'Graduated') {
              await sql`
                UPDATE students
                SET class_name = 'Graduated'
                WHERE id = ${student.id}
              `;
            } else {
              await sql`
                UPDATE students
                SET class_name = ${targetClass}
                WHERE id = ${student.id}
              `;
            }

            // Record promotion history
            try {
              await sql`
                INSERT INTO promotion_history (
                  student_id,
                  from_class,
                  to_class,
                  academic_year,
                  term,
                  promotion_date,
                  notes
                ) VALUES (
                  ${student.id},
                  ${sourceClass},
                  ${targetClass},
                  ${academicYear},
                  ${term || 'First Term'},
                  NOW(),
                  'Bulk promotion'
                )
              `;
            } catch (historyError) {
              console.log('Could not record history for student', student.id);
            }

            promotedCount++;
            results.successCount++;

          } catch (studentError) {
            console.error(`Error promoting student ${student.id}:`, studentError);
            errorCount++;
            results.errorCount++;
          }
        }

        results.byClass[sourceClass] = {
          targetClass,
          totalStudents: students.length,
          studentsPromoted: promotedCount,
          errors: errorCount
        };

        results.totalProcessed += students.length;

      } catch (classError) {
        console.error(`Error processing class ${sourceClass}:`, classError);
        results.byClass[sourceClass] = {
          error: classError.message,
          studentsPromoted: 0
        };
        results.errorCount++;
      }
    }

    return res.json({
      status: 'success',
      message: `Bulk promotion complete. Promoted ${results.successCount} out of ${results.totalProcessed} students`,
      data: results
    });

  } catch (error) {
    console.error('Bulk promotion API error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'An error occurred during bulk promotion',
      error: error.message
    });
  }
}
