-- Fix inconsistent term values in the database
-- Standardize to "First Term", "Second Term", "Third Term" format

-- Update marks table
UPDATE marks
SET term = CASE
  WHEN term = 'Term 1' THEN 'First Term'
  WHEN term = 'Term 2' THEN 'Second Term'
  WHEN term = 'Term 3' THEN 'Third Term'
  ELSE term
END
WHERE term IN ('Term 1', 'Term 2', 'Term 3');

-- Update students table if term column exists
UPDATE students
SET term = CASE
  WHEN term = 'Term 1' THEN 'First Term'
  WHEN term = 'Term 2' THEN 'Second Term'
  WHEN term = 'Term 3' THEN 'Third Term'
  ELSE term
END
WHERE term IN ('Term 1', 'Term 2', 'Term 3');

-- Update any other tables with term values
-- Add more UPDATE statements here if other tables have term columns
