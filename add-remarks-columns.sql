-- ========================================
-- Migration: Add missing columns to remarks table
-- ========================================
-- Run this SQL on your production database
-- (Vercel Postgres, Neon, or your database provider)
-- ========================================

-- Add comments column (for teacher comments)
ALTER TABLE remarks
ADD COLUMN IF NOT EXISTS comments TEXT;

-- Add attendance column (for days present)
ALTER TABLE remarks
ADD COLUMN IF NOT EXISTS attendance VARCHAR(10);

-- Add attendance_total column (for total days)
ALTER TABLE remarks
ADD COLUMN IF NOT EXISTS attendance_total INTEGER DEFAULT 0;

-- Verify the columns were added
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'remarks'
ORDER BY ordinal_position;

-- Expected output should include:
-- comments | text
-- attendance | character varying
-- attendance_total | integer
