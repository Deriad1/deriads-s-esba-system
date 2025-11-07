-- Database Migration: Add Password Reset Functionality
-- Run this SQL script to add the requires_password_change column to the teachers table

-- Add requires_password_change column to teachers table
ALTER TABLE teachers
ADD COLUMN IF NOT EXISTS requires_password_change BOOLEAN DEFAULT FALSE;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_teachers_requires_password_change
ON teachers(requires_password_change);

-- Add comment to document the column purpose
COMMENT ON COLUMN teachers.requires_password_change IS
'Indicates if the teacher must change their password upon next login (e.g., after admin reset)';
