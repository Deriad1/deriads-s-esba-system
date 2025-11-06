import jwt from 'jsonwebtoken';

/**
 * Vercel Serverless Function for JWT Token Verification
 *
 * This endpoint verifies JWT tokens and returns the decoded user data.
 *
 * SECURITY FEATURES:
 * - Verifies JWT signature (cannot be tampered with)
 * - Checks expiration automatically
 * - Validates token format
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
    const { token } = req.body;

    // Validate input
    if (!token) {
      return res.status(400).json({
        status: 'error',
        message: 'Token is required'
      });
    }

    // Verify the JWT token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'CHANGE_THIS_SECRET_IN_PRODUCTION'
    );

    // Token is valid, return user data
    return res.status(200).json({
      status: 'success',
      data: decoded,
      valid: true
    });

  } catch (error) {
    // JWT verification failed
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        status: 'error',
        message: 'Token has expired',
        valid: false
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid token',
        valid: false
      });
    }

    console.error('❌ Token verification error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'An error occurred during token verification',
      valid: false
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
