-- Run these SQL statements ONE AT A TIME
-- Copy and paste each line individually, then click Execute

-- Statement 1: Add comments column
ALTER TABLE remarks ADD COLUMN IF NOT EXISTS comments TEXT;

-- Statement 2: Add attendance column
ALTER TABLE remarks ADD COLUMN IF NOT EXISTS attendance VARCHAR(10);

-- Statement 3: Add attendance_total column
ALTER TABLE remarks ADD COLUMN IF NOT EXISTS attendance_total INTEGER DEFAULT 0;
