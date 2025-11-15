-- ========================================
-- Fix term naming inconsistency
-- Change from "First Term", "Second Term", "Third Term"
-- to "Term 1", "Term 2", "Term 3"
-- ========================================

-- Update remarks table
UPDATE remarks
SET term = CASE
  WHEN term = 'First Term' THEN 'Term 1'
  WHEN term = 'Second Term' THEN 'Term 2'
  WHEN term = 'Third Term' THEN 'Term 3'
  ELSE term
END
WHERE term IN ('First Term', 'Second Term', 'Third Term');

-- Update marks table (if it exists and has term column)
UPDATE marks
SET term = CASE
  WHEN term = 'First Term' THEN 'Term 1'
  WHEN term = 'Second Term' THEN 'Term 2'
  WHEN term = 'Third Term' THEN 'Term 3'
  ELSE term
END
WHERE term IN ('First Term', 'Second Term', 'Third Term');

-- Update assessments table (if it exists)
UPDATE assessments
SET term = CASE
  WHEN term = 'First Term' THEN 'Term 1'
  WHEN term = 'Second Term' THEN 'Term 2'
  WHEN term = 'Third Term' THEN 'Term 3'
  ELSE term
END
WHERE term IN ('First Term', 'Second Term', 'Third Term');

-- Verify the changes
SELECT 'remarks' as table_name, term, COUNT(*) as count
FROM remarks
GROUP BY term
UNION ALL
SELECT 'marks' as table_name, term, COUNT(*) as count
FROM marks
GROUP BY term
UNION ALL
SELECT 'assessments' as table_name, term, COUNT(*) as count
FROM assessments
GROUP BY term
ORDER BY table_name, term;
