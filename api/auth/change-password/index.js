import bcrypt from 'bcryptjs';
import { sql } from '../../lib/db.js';

/**
 * Vercel Serverless Function for Password Change
 *
 * SECURITY FEATURES:
 * - Requires current password verification (prevents unauthorized changes)
 * - Validates new password strength
 * - Hashes new password with bcrypt
 * - Clears requires_password_change flag
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
    const { teacherId, currentPassword, newPassword } = req.body;

    // Validate input
    if (!teacherId) {
      return res.status(400).json({
        status: 'error',
        message: 'Teacher ID is required'
      });
    }

    if (!newPassword) {
      return res.status(400).json({
        status: 'error',
        message: 'New password is required'
      });
    }

    // Validate new password strength
    if (newPassword.length < 6) {
      return res.status(400).json({
        status: 'error',
        message: 'Password must be at least 6 characters long'
      });
    }

    // For additional security, you might want to enforce:
    // - At least one uppercase letter
    // - At least one lowercase letter
    // - At least one number
    // - At least one special character

    // Get teacher record
    const result = await sql`
      SELECT * FROM teachers
      WHERE id = ${teacherId}
    `;

    if (result.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Teacher not found'
      });
    }

    const teacher = result[0];

    // Verify current password (required unless it's a first-time password change)
    if (!teacher.requires_password_change) {
      // Regular password change - verify current password
      if (!currentPassword) {
        return res.status(400).json({
          status: 'error',
          message: 'Current password is required'
        });
      }

      // Check if current password is hashed
      const isPasswordHashed = teacher.password &&
        (teacher.password.startsWith('$2a$') || teacher.password.startsWith('$2b$'));

      let isCurrentPasswordValid = false;

      if (isPasswordHashed) {
        isCurrentPasswordValid = await bcrypt.compare(currentPassword, teacher.password);
      } else {
        // Plain text comparison for legacy accounts
        isCurrentPasswordValid = currentPassword === teacher.password;
      }

      if (!isCurrentPasswordValid) {
        return res.status(401).json({
          status: 'error',
          message: 'Current password is incorrect'
        });
      }
    } else {
      // First-time password change (temporary password reset)
      // Verify the temporary password they're logging in with
      if (currentPassword) {
        const isPasswordHashed = teacher.password &&
          (teacher.password.startsWith('$2a$') || teacher.password.startsWith('$2b$'));

        let isTempPasswordValid = false;

        if (isPasswordHashed) {
          isTempPasswordValid = await bcrypt.compare(currentPassword, teacher.password);
        } else {
          // Plain text comparison for temporary passwords
          isTempPasswordValid = currentPassword === teacher.password;
        }

        if (!isTempPasswordValid) {
          return res.status(401).json({
            status: 'error',
            message: 'Temporary password is incorrect'
          });
        }
      }
    }

    // Check that new password is different from current password
    const isSamePassword = teacher.password &&
      (teacher.password.startsWith('$2a$') || teacher.password.startsWith('$2b$'))
        ? await bcrypt.compare(newPassword, teacher.password)
        : newPassword === teacher.password;

    if (isSamePassword) {
      return res.status(400).json({
        status: 'error',
        message: 'New password must be different from current password'
      });
    }

    // Hash the new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password in database
    await sql`
      UPDATE teachers
      SET
        password = ${hashedPassword},
        requires_password_change = false,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${teacherId}
    `;

    console.log(`✓ Password changed successfully for teacher ID: ${teacherId}`);

    return res.status(200).json({
      status: 'success',
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('❌ Change password API error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'An error occurred while changing password. Please try again.'
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
