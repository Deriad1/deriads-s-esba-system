-- ========================================
-- CREATE PRODUCTION ADMIN USER
-- ========================================
-- Run this SQL in your Neon Database Console
-- after deployment to create the initial admin
-- ========================================

-- INSTRUCTIONS:
-- 1. Replace YOUR_EMAIL with your admin email
-- 2. Replace HASHED_PASSWORD with a bcrypt hash (see below for how to generate)
-- 3. Replace YOUR_FIRSTNAME and YOUR_LASTNAME
-- 4. Run this in your Neon dashboard SQL editor

-- HOW TO GENERATE BCRYPT HASH:
-- Option 1: Use this Node.js command:
--   node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('YourPassword123', 10).then(console.log)"
--
-- Option 2: Use an online bcrypt generator (use strong password):
--   https://bcrypt-generator.com/ (Rounds: 10)
--
-- Example: Password "Admin2025!" becomes:
-- $2a$10$xyz... (60 characters)

INSERT INTO teachers (
  first_name,
  last_name,
  email,
  password,
  gender,
  teacher_primary_role,
  all_roles,
  classes,
  subjects,
  term,
  academic_year,
  requires_password_change,
  created_at,
  updated_at
) VALUES (
  'YOUR_FIRSTNAME',                    -- Change this
  'YOUR_LASTNAME',                     -- Change this
  'YOUR_EMAIL@example.com',            -- Change this
  'HASHED_PASSWORD_HERE',              -- Change this (bcrypt hash)
  'male',                              -- 'male' or 'female'
  'admin',
  ARRAY['admin', 'head_teacher']::text[],
  ARRAY[]::text[],
  ARRAY[]::text[],
  'First Term',
  '2024/2025',
  false,
  NOW(),
  NOW()
);

-- Verify the user was created:
SELECT id, first_name, last_name, email, teacher_primary_role, all_roles
FROM teachers
WHERE email = 'YOUR_EMAIL@example.com';

-- ========================================
-- ALTERNATIVE: Create with temporary password
-- then force password change on first login
-- ========================================
/*
INSERT INTO teachers (
  first_name,
  last_name,
  email,
  password,
  gender,
  teacher_primary_role,
  all_roles,
  classes,
  subjects,
  term,
  academic_year,
  requires_password_change,
  created_at,
  updated_at
) VALUES (
  'Admin',
  'User',
  'admin@yourschool.com',
  '$2a$10$XyZ...BCRYPT_HASH_HERE',
  'male',
  'admin',
  ARRAY['admin', 'head_teacher']::text[],
  ARRAY[]::text[],
  ARRAY[]::text[],
  'First Term',
  '2024/2025',
  true,                               -- Forces password change on first login
  NOW(),
  NOW()
);
*/

-- ========================================
-- SECURITY NOTES:
-- ========================================
-- ✅ ALWAYS use bcrypt hashed passwords
-- ✅ NEVER store plain text passwords
-- ✅ Use strong passwords (12+ characters, mixed case, numbers, symbols)
-- ✅ Change the default password immediately after first login
-- ✅ Remove or secure this file after use
-- ========================================
