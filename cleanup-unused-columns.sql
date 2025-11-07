-- Database Cleanup Migration
-- Removes unused/deprecated columns from marks table
--
-- IMPORTANT: This is a destructive operation!
-- Make sure to backup your database before running this script.
--
-- Columns to be removed:
-- - total_score (replaced by 'total')
-- - remarks (replaced by 'remark' - singular)
-- - exams_score (not used)
-- - grade (not actively used)
--
-- Before running: Verify that no data will be lost by checking column usage

-- Step 1: Verify columns are empty or data has been migrated
SELECT
  COUNT(*) as total_records,
  COUNT(CASE WHEN total_score IS NOT NULL AND total_score != 0 THEN 1 END) as using_total_score,
  COUNT(CASE WHEN remarks IS NOT NULL AND remarks != '' THEN 1 END) as using_remarks,
  COUNT(CASE WHEN exams_score IS NOT NULL AND exams_score != 0 THEN 1 END) as using_exams_score,
  COUNT(CASE WHEN grade IS NOT NULL AND grade != '' THEN 1 END) as using_grade
FROM marks;

-- Step 2: If the above shows 0 for all 'using_*' columns, proceed with cleanup
-- Uncomment the following lines to execute the cleanup:

-- ALTER TABLE marks DROP COLUMN IF EXISTS total_score;
-- ALTER TABLE marks DROP COLUMN IF EXISTS remarks;
-- ALTER TABLE marks DROP COLUMN IF EXISTS exams_score;
-- ALTER TABLE marks DROP COLUMN IF EXISTS grade;

-- Step 3: Verify the cleanup
-- SELECT column_name
-- FROM information_schema.columns
-- WHERE table_name = 'marks'
-- ORDER BY ordinal_position;
