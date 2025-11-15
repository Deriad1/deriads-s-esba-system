import { sql } from '../lib/db.js';
import { validateScoreData } from '../../src/utils/validation.js';
import { isNumericStudentId } from '../../src/utils/studentIdHelpers.js';
import { calculateRemark } from '../../src/utils/gradeHelpers.js';
import { extractUser, requireAuth, requireClassAccess, requireSubjectAccess, getClassFilterForUser } from '../lib/authMiddleware.js';

/**
 * API Endpoint: /api/marks
 * Handles all marks/scores operations
 *
 * SECURITY: Teachers can only access marks for classes AND subjects they are assigned to
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

      default:
        return res.status(405).json({
          status: 'error',
          message: 'Method not allowed'
        });
    }
  } catch (error) {
    console.error('Marks API error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      error: error.message
    });
  }
}

// GET /api/marks - Get marks by class and subject
// SECURITY: Only returns marks for classes AND subjects the teacher is assigned to
async function handleGet(req, res) {
  const { className, subject, term, studentId } = req.query;

  try {
    // Authenticate user
    const user = requireAuth(req, res);
    if (!user) return; // Response already sent by requireAuth

    let result;

    if (studentId) {
      // Get marks for specific student
      // First, get the student's class to verify access
      const studentCheck = await sql`
        SELECT class_name FROM students WHERE id_number = ${studentId}
      `;

      if (studentCheck.length === 0) {
        return res.status(404).json({
          status: 'error',
          message: 'Student not found'
        });
      }

      const studentClass = studentCheck[0].class_name;

      // Verify teacher has access to this student's class
      if (!requireClassAccess(user, studentClass, res)) {
        return; // Response already sent
      }

      // Get marks - filter by subjects if not admin/head_teacher
      const classFilter = getClassFilterForUser(user);

      // Check if teacher is the class teacher for this student's class
      const isClassTeacher = user.form_class === studentClass ||
                            (user.classes && user.classes.includes(studentClass));

      if (classFilter.hasRestriction && !isClassTeacher) {
        // Regular teacher - filter by assigned subjects only
        const teacherSubjects = user.subjects || [];

        if (term) {
          result = await sql`
            SELECT m.* FROM marks m
            JOIN students s ON m.student_id = s.id
            WHERE s.id_number = ${studentId}
              AND m.term = ${term}
              AND m.subject = ANY(${teacherSubjects})
            ORDER BY m.subject
          `;
        } else {
          result = await sql`
            SELECT m.* FROM marks m
            JOIN students s ON m.student_id = s.id
            WHERE s.id_number = ${studentId}
              AND m.subject = ANY(${teacherSubjects})
            ORDER BY m.term, m.subject
          `;
        }
      } else {
        // Admin/Head Teacher OR Class Teacher - see all subjects
        if (term) {
          result = await sql`
            SELECT m.* FROM marks m
            JOIN students s ON m.student_id = s.id
            WHERE s.id_number = ${studentId}
              AND m.term = ${term}
            ORDER BY m.subject
          `;
        } else {
          result = await sql`
            SELECT m.* FROM marks m
            JOIN students s ON m.student_id = s.id
            WHERE s.id_number = ${studentId}
            ORDER BY m.term, m.subject
          `;
        }
      }
    } else if (className && subject) {
      // Verify teacher has access to this class AND subject
      if (!requireSubjectAccess(user, className, subject, res)) {
        return; // Response already sent
      }

      // Get marks for class and subject
      if (term) {
        result = await sql`
          SELECT s.*, st.first_name, st.last_name, st.class_name, st.id_number
          FROM marks s
          JOIN students st ON s.student_id = st.id
          WHERE st.class_name = ${className}
            AND s.subject = ${subject}
            AND s.term = ${term}
          ORDER BY st.last_name, st.first_name
        `;
      } else {
        result = await sql`
          SELECT s.*, st.first_name, st.last_name, st.class_name, st.id_number
          FROM marks s
          JOIN students st ON s.student_id = st.id
          WHERE st.class_name = ${className}
            AND s.subject = ${subject}
          ORDER BY st.last_name, st.first_name
        `;
      }
    } else if (className) {
      // Verify teacher has access to this class
      if (!requireClassAccess(user, className, res)) {
        return; // Response already sent
      }

      // Get class filter to determine subject restrictions
      const classFilter = getClassFilterForUser(user);

      // Check if user is class_teacher or form_master for this class
      const isClassTeacher = user.primaryRole === 'class_teacher' ||
                             user.primaryRole === 'form_master' ||
                             user.all_roles?.includes('class_teacher') ||
                             user.all_roles?.includes('form_master');

      if (classFilter.hasRestriction && !isClassTeacher) {
        // Subject teachers: Filter by assigned subjects only
        const teacherSubjects = user.subjects || [];

        if (teacherSubjects.length === 0) {
          return res.status(200).json({
            status: 'success',
            data: []
          });
        }

        // Get all marks for a class - only for teacher's subjects
        if (term) {
          result = await sql`
            SELECT s.*, st.first_name, st.last_name, st.class_name
            FROM marks s
            JOIN students st ON s.student_id = st.id
            WHERE st.class_name = ${className}
              AND s.term = ${term}
              AND s.subject = ANY(${teacherSubjects})
            ORDER BY s.subject, st.last_name, st.first_name
          `;
        } else {
          result = await sql`
            SELECT s.*, st.first_name, st.last_name, st.class_name
            FROM marks s
            JOIN students st ON s.student_id = st.id
            WHERE st.class_name = ${className}
              AND s.subject = ANY(${teacherSubjects})
            ORDER BY s.subject, st.last_name, st.first_name
          `;
        }
      } else {
        // Admin/Head Teacher/Class Teacher/Form Master - see all subjects
        if (term) {
          result = await sql`
            SELECT s.*, st.first_name, st.last_name, st.class_name
            FROM marks s
            JOIN students st ON s.student_id = st.id
            WHERE st.class_name = ${className}
              AND s.term = ${term}
            ORDER BY s.subject, st.last_name, st.first_name
          `;
        } else {
          result = await sql`
            SELECT s.*, st.first_name, st.last_name, st.class_name
            FROM marks s
            JOIN students st ON s.student_id = st.id
            WHERE st.class_name = ${className}
            ORDER BY s.subject, st.last_name, st.first_name
          `;
        }
      }
    } else {
      return res.status(400).json({
        status: 'error',
        message: 'className or studentId is required'
      });
    }

    return res.status(200).json({
      status: 'success',
      data: result
    });
  } catch (error) {
    throw error;
  }
}

// POST /api/marks - Add or update marks
async function handlePost(req, res) {
  const scoreData = req.body;

  // Validate score data
  const validation = validateScoreData(scoreData);
  if (!validation.isValid) {
    return res.status(400).json({
      status: 'error',
      message: 'Validation failed',
      errors: validation.errors
    });
  }

  try {
    // First, resolve the student's database ID and get class_name and academic_year
    // studentId could be either numeric ID or id_number (e.g., "eSBA020")
    let dbStudentId = scoreData.studentId;
    let studentClassName = scoreData.className; // May be provided in scoreData
    let academicYear = scoreData.academicYear; // May be provided in scoreData

    // If studentId is not numeric, look it up by id_number
    // Use helper to check if it's a numeric ID or id_number format
    if (!isNumericStudentId(scoreData.studentId)) {
      console.log('Looking up student with id_number:', scoreData.studentId);
      const studentLookup = await sql`
        SELECT id, class_name, academic_year FROM students WHERE id_number = ${scoreData.studentId}
      `;

      console.log('Student lookup result:', studentLookup);
      const students = Array.isArray(studentLookup) ? studentLookup : (studentLookup.rows || []);

      if (students.length === 0) {
        return res.status(404).json({
          status: 'error',
          message: `Student with ID ${scoreData.studentId} not found`
        });
      }

      dbStudentId = students[0].id;
      studentClassName = students[0].class_name;
      academicYear = students[0].academic_year;
      console.log('Resolved to database ID:', dbStudentId, 'class:', studentClassName, 'year:', academicYear);
    } else {
      // studentId is numeric, still need to get class_name and academic_year if not provided
      if (!studentClassName || !academicYear) {
        const studentLookup = await sql`
          SELECT class_name, academic_year FROM students WHERE id = ${dbStudentId}
        `;
        if (studentLookup.length > 0) {
          studentClassName = studentClassName || studentLookup[0].class_name;
          academicYear = academicYear || studentLookup[0].academic_year;
        }
      }
    }

    // Calculate total
    const test1 = parseFloat(scoreData.test1) || 0;
    const test2 = parseFloat(scoreData.test2) || 0;
    const test3 = parseFloat(scoreData.test3) || 0;
    const test4 = parseFloat(scoreData.test4) || 0;
    const exam = parseFloat(scoreData.exam) || 0;

    // Class score: (test total / 60) * 50
    const testsTotal = test1 + test2 + test3 + test4;
    const classScore = (testsTotal / 60) * 50;

    // Exam score: (exam / 100) * 50
    const examScore = (exam / 100) * 50;

    // Total score
    const total = classScore + examScore;

    // Calculate remark based on total score
    const remark = calculateRemark(total);

    // Check if record exists
    const existing = await sql`
      SELECT id FROM marks
      WHERE student_id = ${dbStudentId}
        AND subject = ${scoreData.subject}
        AND term = ${scoreData.term}
    `;

    let result;

    if (existing.length > 0) {
      // Update existing record
      result = await sql`
        UPDATE marks
        SET test1 = ${test1},
            test2 = ${test2},
            test3 = ${test3},
            test4 = ${test4},
            exam = ${exam},
            ca1 = ${scoreData.ca1 || null},
            ca2 = ${scoreData.ca2 || null},
            class_score = ${classScore},
            exam_score = ${examScore},
            total = ${total},
            remark = ${remark},
            class_name = ${studentClassName},
            academic_year = ${academicYear},
            updated_at = NOW()
        WHERE id = ${existing[0].id}
        RETURNING *
      `;
    } else {
      // Insert new record
      result = await sql`
        INSERT INTO marks (
          student_id, subject, term, class_name, academic_year,
          test1, test2, test3, test4, exam,
          ca1, ca2, class_score, exam_score, total, remark,
          created_at, updated_at
        ) VALUES (
          ${dbStudentId},
          ${scoreData.subject},
          ${scoreData.term},
          ${studentClassName},
          ${academicYear},
          ${test1}, ${test2}, ${test3}, ${test4}, ${exam},
          ${scoreData.ca1 || null},
          ${scoreData.ca2 || null},
          ${classScore},
          ${examScore},
          ${total},
          ${remark},
          NOW(),
          NOW()
        )
        RETURNING *
      `;
    }

    return res.status(200).json({
      status: 'success',
      message: existing.length > 0 ? 'Marks updated successfully' : 'Marks added successfully',
      data: result[0]
    });
  } catch (error) {
    throw error;
  }
}

// PUT /api/marks - Update marks (alias for POST)
async function handlePut(req, res) {
  return handlePost(req, res);
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};
