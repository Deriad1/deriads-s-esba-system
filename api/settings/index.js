// API Endpoint: Global Settings
// Handles system-wide settings management

import { sql } from '../lib/db.js';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // GET: Fetch current settings
    if (req.method === 'GET') {
      let settings = [];

      try {
        // Get all settings
        settings = await sql`
          SELECT * FROM settings
          ORDER BY id DESC
          LIMIT 1
        `;
      } catch (dbError) {
        // Table doesn't exist or other DB error - return defaults
        console.warn('Settings table not found, using defaults:', dbError.message);
      }

      if (settings.length === 0) {
        // Return default settings if none exist
        const currentYear = new Date().getFullYear();
        const nextYear = currentYear + 1;

        return res.json({
          status: 'success',
          data: {
            id: null,
            schoolName: '',
            schoolLogo: '',
            backgroundImage: '',
            term: 'First Term',
            academicYear: `${currentYear}/${nextYear}`,
            currentYear: currentYear,
            schoolAddress: '',
            schoolPhone: '',
            schoolEmail: '',
            schoolMotto: '',
            principalName: '',
            principalSignature: '',
            gradeConfig: {
              A: { min: 80, max: 100, remark: 'Excellent' },
              B: { min: 70, max: 79, remark: 'Very Good' },
              C: { min: 60, max: 69, remark: 'Good' },
              D: { min: 50, max: 59, remark: 'Pass' },
              E: { min: 40, max: 49, remark: 'Weak' },
              F: { min: 0, max: 39, remark: 'Fail' }
            },
            reportCardTemplate: 'default',
            enableAttendance: true,
            enableRemarks: true,
            enableBroadsheet: true,
            createdAt: null,
            updatedAt: null
          }
        });
      }

      const setting = settings[0];

      return res.json({
        status: 'success',
        data: {
          id: setting.id,
          schoolName: setting.school_name,
          schoolLogo: setting.school_logo,
          backgroundImage: setting.background_image,
          term: setting.term,
          academicYear: setting.academic_year,
          currentYear: setting.current_year,
          schoolAddress: setting.school_address,
          schoolPhone: setting.school_phone,
          schoolEmail: setting.school_email,
          schoolMotto: setting.school_motto,
          principalName: setting.principal_name,
          principalSignature: setting.principal_signature,
          gradeConfig: setting.grade_config,
          reportCardTemplate: setting.report_card_template,
          enableAttendance: setting.enable_attendance,
          enableRemarks: setting.enable_remarks,
          enableBroadsheet: setting.enable_broadsheet,
          createdAt: setting.created_at,
          updatedAt: setting.updated_at
        }
      });
    }

    // POST: Create initial settings (should only be used once)
    if (req.method === 'POST') {
      const {
        schoolName,
        schoolLogo,
        backgroundImage,
        term,
        academicYear,
        currentYear,
        schoolAddress,
        schoolPhone,
        schoolEmail,
        schoolMotto,
        principalName,
        principalSignature,
        gradeConfig,
        reportCardTemplate,
        enableAttendance,
        enableRemarks,
        enableBroadsheet
      } = req.body;

      // Check if settings already exist
      const existing = await sql`SELECT id FROM settings LIMIT 1`;

      if (existing.length > 0) {
        return res.status(409).json({
          status: 'error',
          message: 'Settings already exist. Use PUT to update.'
        });
      }

      // Create new settings
      const result = await sql`
        INSERT INTO settings (
          school_name,
          school_logo,
          background_image,
          term,
          academic_year,
          current_year,
          school_address,
          school_phone,
          school_email,
          school_motto,
          principal_name,
          principal_signature,
          grade_config,
          report_card_template,
          enable_attendance,
          enable_remarks,
          enable_broadsheet
        ) VALUES (
          ${schoolName || ''},
          ${schoolLogo || ''},
          ${backgroundImage || ''},
          ${term || 'First Term'},
          ${academicYear || `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`},
          ${currentYear || new Date().getFullYear()},
          ${schoolAddress || ''},
          ${schoolPhone || ''},
          ${schoolEmail || ''},
          ${schoolMotto || ''},
          ${principalName || ''},
          ${principalSignature || ''},
          ${gradeConfig ? JSON.stringify(gradeConfig) : JSON.stringify({
            A: { min: 80, max: 100, remark: 'Excellent' },
            B: { min: 70, max: 79, remark: 'Very Good' },
            C: { min: 60, max: 69, remark: 'Good' },
            D: { min: 50, max: 59, remark: 'Pass' },
            E: { min: 40, max: 49, remark: 'Weak' },
            F: { min: 0, max: 39, remark: 'Fail' }
          })},
          ${reportCardTemplate || 'default'},
          ${enableAttendance !== undefined ? enableAttendance : true},
          ${enableRemarks !== undefined ? enableRemarks : true},
          ${enableBroadsheet !== undefined ? enableBroadsheet : true}
        )
        RETURNING *
      `;

      return res.json({
        status: 'success',
        message: 'Settings created successfully',
        data: {
          id: result[0].id,
          schoolName: result[0].school_name,
          term: result[0].term,
          academicYear: result[0].academic_year
        }
      });
    }

    // PUT: Update settings
    if (req.method === 'PUT') {
      const {
        schoolName,
        schoolLogo,
        backgroundImage,
        term,
        academicYear,
        currentYear,
        schoolAddress,
        schoolPhone,
        schoolEmail,
        schoolMotto,
        principalName,
        principalSignature,
        gradeConfig,
        reportCardTemplate,
        enableAttendance,
        enableRemarks,
        enableBroadsheet
      } = req.body;

      // Get current settings
      const current = await sql`SELECT id FROM settings LIMIT 1`;

      if (current.length === 0) {
        return res.status(404).json({
          status: 'error',
          message: 'Settings not found. Use POST to create initial settings.'
        });
      }

      const settingsId = current[0].id;

      // Build update query dynamically based on provided fields
      let updateFields = [];
      let updateValues = [];

      if (schoolName !== undefined) {
        updateFields.push('school_name = $' + (updateValues.length + 1));
        updateValues.push(schoolName);
      }
      if (schoolLogo !== undefined) {
        updateFields.push('school_logo = $' + (updateValues.length + 1));
        updateValues.push(schoolLogo);
      }
      if (backgroundImage !== undefined) {
        updateFields.push('background_image = $' + (updateValues.length + 1));
        updateValues.push(backgroundImage);
      }
      if (term !== undefined) {
        updateFields.push('term = $' + (updateValues.length + 1));
        updateValues.push(term);
      }
      if (academicYear !== undefined) {
        updateFields.push('academic_year = $' + (updateValues.length + 1));
        updateValues.push(academicYear);
      }
      if (currentYear !== undefined) {
        updateFields.push('current_year = $' + (updateValues.length + 1));
        updateValues.push(currentYear);
      }
      if (schoolAddress !== undefined) {
        updateFields.push('school_address = $' + (updateValues.length + 1));
        updateValues.push(schoolAddress);
      }
      if (schoolPhone !== undefined) {
        updateFields.push('school_phone = $' + (updateValues.length + 1));
        updateValues.push(schoolPhone);
      }
      if (schoolEmail !== undefined) {
        updateFields.push('school_email = $' + (updateValues.length + 1));
        updateValues.push(schoolEmail);
      }
      if (schoolMotto !== undefined) {
        updateFields.push('school_motto = $' + (updateValues.length + 1));
        updateValues.push(schoolMotto);
      }
      if (principalName !== undefined) {
        updateFields.push('principal_name = $' + (updateValues.length + 1));
        updateValues.push(principalName);
      }
      if (principalSignature !== undefined) {
        updateFields.push('principal_signature = $' + (updateValues.length + 1));
        updateValues.push(principalSignature);
      }
      if (gradeConfig !== undefined) {
        updateFields.push('grade_config = $' + (updateValues.length + 1));
        updateValues.push(JSON.stringify(gradeConfig));
      }
      if (reportCardTemplate !== undefined) {
        updateFields.push('report_card_template = $' + (updateValues.length + 1));
        updateValues.push(reportCardTemplate);
      }
      if (enableAttendance !== undefined) {
        updateFields.push('enable_attendance = $' + (updateValues.length + 1));
        updateValues.push(enableAttendance);
      }
      if (enableRemarks !== undefined) {
        updateFields.push('enable_remarks = $' + (updateValues.length + 1));
        updateValues.push(enableRemarks);
      }
      if (enableBroadsheet !== undefined) {
        updateFields.push('enable_broadsheet = $' + (updateValues.length + 1));
        updateValues.push(enableBroadsheet);
      }

      if (updateFields.length === 0) {
        return res.status(400).json({
          status: 'error',
          message: 'No fields to update'
        });
      }

      // Build SET clause parts
      const setParts = [];
      if (schoolName !== undefined) setParts.push(sql`school_name = ${schoolName}`);
      if (schoolLogo !== undefined) setParts.push(sql`school_logo = ${schoolLogo}`);
      if (backgroundImage !== undefined) setParts.push(sql`background_image = ${backgroundImage}`);
      if (term !== undefined) setParts.push(sql`term = ${term}`);
      if (academicYear !== undefined) setParts.push(sql`academic_year = ${academicYear}`);
      if (currentYear !== undefined) setParts.push(sql`current_year = ${currentYear}`);
      if (schoolAddress !== undefined) setParts.push(sql`school_address = ${schoolAddress}`);
      if (schoolPhone !== undefined) setParts.push(sql`school_phone = ${schoolPhone}`);
      if (schoolEmail !== undefined) setParts.push(sql`school_email = ${schoolEmail}`);
      if (schoolMotto !== undefined) setParts.push(sql`school_motto = ${schoolMotto}`);
      if (principalName !== undefined) setParts.push(sql`principal_name = ${principalName}`);
      if (principalSignature !== undefined) setParts.push(sql`principal_signature = ${principalSignature}`);
      if (gradeConfig !== undefined) setParts.push(sql`grade_config = ${JSON.stringify(gradeConfig)}`);
      if (reportCardTemplate !== undefined) setParts.push(sql`report_card_template = ${reportCardTemplate}`);
      if (enableAttendance !== undefined) setParts.push(sql`enable_attendance = ${enableAttendance}`);
      if (enableRemarks !== undefined) setParts.push(sql`enable_remarks = ${enableRemarks}`);
      if (enableBroadsheet !== undefined) setParts.push(sql`enable_broadsheet = ${enableBroadsheet}`);

      // Always update the timestamp
      setParts.push(sql`updated_at = NOW()`);

      // Use sql template for proper parameterization
      const result = await sql`
        UPDATE settings
        SET ${sql.join(setParts, sql`, `)}
        WHERE id = ${settingsId}
        RETURNING *
      `;

      return res.json({
        status: 'success',
        message: 'Settings updated successfully',
        data: {
          id: result[0].id,
          schoolName: result[0].school_name,
          term: result[0].term,
          academicYear: result[0].academic_year,
          updatedAt: result[0].updated_at
        }
      });
    }

    return res.status(405).json({
      status: 'error',
      message: 'Method not allowed'
    });

  } catch (error) {
    console.error('Settings API error:', error);

    // If database connection fails, return default settings instead of erroring
    if (req.method === 'GET') {
      const currentYear = new Date().getFullYear();
      const nextYear = currentYear + 1;

      return res.json({
        status: 'success',
        data: {
          id: null,
          schoolName: '',
          schoolLogo: '',
          backgroundImage: '',
          term: 'First Term',
          academicYear: `${currentYear}/${nextYear}`,
          currentYear: currentYear,
          schoolAddress: '',
          schoolPhone: '',
          schoolEmail: '',
          schoolMotto: '',
          principalName: '',
          principalSignature: '',
          gradeConfig: {
            A: { min: 80, max: 100, remark: 'Excellent' },
            B: { min: 70, max: 79, remark: 'Very Good' },
            C: { min: 60, max: 69, remark: 'Good' },
            D: { min: 50, max: 59, remark: 'Pass' },
            E: { min: 40, max: 49, remark: 'Weak' },
            F: { min: 0, max: 39, remark: 'Fail' }
          },
          reportCardTemplate: 'default',
          enableAttendance: true,
          enableRemarks: true,
          enableBroadsheet: true,
          createdAt: null,
          updatedAt: null
        }
      });
    }

    return res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error'
    });
  }
}
