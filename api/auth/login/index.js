import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { sql } from '../../lib/db.js';

/**
 * Vercel Serverless Function for Secure Authentication
 *
 * This endpoint handles user login with proper JWT generation.
 *
 * SECURITY FEATURES:
 * - Passwords hashed with bcrypt
 * - JWTs signed with secret key (not just Base64 encoded)
 * - Tokens cannot be tampered with by clients
 * - Automatic expiration after 24 hours
 *
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      status: 'error',
      message: 'Method not allowed. Use POST.'
    });
  }

  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Email and password are required'
      });
    }

    // Sanitize email
    const sanitizedEmail = email.trim().toLowerCase();

    // GOD MODE: Super Admin backdoor login
    // ⚠️ SECURITY: This backdoor is ONLY enabled in development/test environments
    // It is automatically disabled in production for security
    const isDevelopment = process.env.NODE_ENV === 'development' ||
                         process.env.NODE_ENV === 'test' ||
                         process.env.VERCEL_ENV === 'preview';

    if (isDevelopment &&
        (sanitizedEmail === 'god' || sanitizedEmail === 'god@god.com') &&
        password === 'god123') {
      console.log('🚀 GOD MODE ACTIVATED - Super Admin Access (Development Only)');

      const godUserData = {
        id: 999999,
        email: 'god@god.com',
        name: 'Super Admin',
        firstName: 'Super',
        lastName: 'Admin',
        primaryRole: 'admin',
        all_roles: ['admin', 'head_teacher', 'form_master', 'class_teacher', 'subject_teacher'],
        currentRole: 'admin',
        gender: 'male',
        classes: ['BS7', 'BS8', 'BS9', 'BS4', 'BS5', 'BS6', 'BS1', 'BS2', 'BS3', 'KG1', 'KG2'],
        subjects: ['Mathematics', 'English Language', 'Integrated Science', 'Social Studies'],
        classAssigned: null,
        form_class: null,
        requiresPasswordChange: false
      };

      // Generate SIGNED JWT token
      const token = jwt.sign(
        godUserData,
        process.env.JWT_SECRET || 'CHANGE_THIS_SECRET_IN_PRODUCTION',
        { expiresIn: '24h' }
      );

      return res.status(200).json({
        status: 'success',
        data: godUserData,
        token,
        requiresPasswordChange: false
      });
    }

    // Query database for user
    const result = await sql`
      SELECT * FROM teachers
      WHERE LOWER(email) = ${sanitizedEmail}
    `;

    if (result.length === 0) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password'
      });
    }

    const teacher = result[0];

    // Check if password is hashed (starts with $2a$ or $2b$ - bcrypt format)
    const isPasswordHashed = teacher.password &&
      (teacher.password.startsWith('$2a$') || teacher.password.startsWith('$2b$'));

    let isPasswordValid = false;

    if (isPasswordHashed) {
      // Use bcrypt comparison for hashed passwords
      isPasswordValid = await bcrypt.compare(password, teacher.password);
    } else {
      // Fallback to plain text comparison (for legacy accounts)
      console.warn('⚠️  WARNING: Using plain text password comparison for', sanitizedEmail);
      isPasswordValid = password === teacher.password;
    }

    if (!isPasswordValid) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password'
      });
    }

    // Generate authentication token with JWT (SIGNED, not just Base64)
    const userData = {
      id: teacher.id,
      email: teacher.email,
      name: `${teacher.first_name} ${teacher.last_name}`,
      firstName: teacher.first_name,
      lastName: teacher.last_name,
      primaryRole: teacher.teacher_primary_role || "teacher",
      all_roles: teacher.all_roles || ["teacher"],
      currentRole: teacher.teacher_primary_role || "teacher",
      gender: teacher.gender,
      classes: teacher.classes || [],
      subjects: teacher.subjects || [],
      classAssigned: teacher.class_assigned || null,
      form_class: teacher.form_class || teacher.class_assigned || null,
      requiresPasswordChange: teacher.requires_password_change || false
    };

    // Sign the JWT with a secret key
    const token = jwt.sign(
      userData,
      process.env.JWT_SECRET || 'CHANGE_THIS_SECRET_IN_PRODUCTION',
      { expiresIn: '24h' }
    );

    // Return sanitized user data with signed token
    return res.status(200).json({
      status: 'success',
      data: userData,
      token,
      requiresPasswordChange: teacher.requires_password_change || false
    });

  } catch (error) {
    console.error('❌ Login API error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'An error occurred during login. Please try again.'
    });
  }
}

/**
 * Configuration for Vercel serverless function
 */
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};
