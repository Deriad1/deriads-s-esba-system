-- Add guardian/parent contact columns to students table
-- This enables storing email and phone number for students' guardians

-- Add email column (for guardian/parent email)
ALTER TABLE students
ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- Add phone_number column (for guardian/parent phone)
ALTER TABLE students
ADD COLUMN IF NOT EXISTS phone_number VARCHAR(50);

-- Add indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_students_email ON students(email);
CREATE INDEX IF NOT EXISTS idx_students_phone ON students(phone_number);

-- Show updated table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'students'
ORDER BY ordinal_position;
