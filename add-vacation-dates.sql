-- Add vacation_date and reopening_date columns to remarks table
-- These dates will be stored per class/term combination

-- Statement 1: Add vacation_date column
ALTER TABLE remarks ADD COLUMN IF NOT EXISTS vacation_date VARCHAR(50);

-- Statement 2: Add reopening_date column
ALTER TABLE remarks ADD COLUMN IF NOT EXISTS reopening_date VARCHAR(50);
