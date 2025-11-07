-- ✅ PERFORMANCE FIX: Database Performance Indexes
-- This script adds indexes to optimize slow queries
-- Expected improvement: 85% faster API responses (from 2-6s to 200-500ms)

-- Run this with: psql $DATABASE_URL < add-performance-indexes.sql
-- Or in Neon dashboard SQL editor

-- 1. STUDENTS TABLE INDEXES
-- Optimize queries that filter by class_name (used in almost every report)
CREATE INDEX IF NOT EXISTS idx_students_class_name ON students(class_name);

-- Optimize queries that search by name (alphabetical sorting)
CREATE INDEX IF NOT EXISTS idx_students_name ON students(last_name, first_name);

-- Optimize queries that lookup by student ID number
CREATE INDEX IF NOT EXISTS idx_students_id_number ON students(id_number);

-- Composite index for common query pattern (class + name sorting)
CREATE INDEX IF NOT EXISTS idx_students_class_name_sorted ON students(class_name, last_name, first_name);

-- 2. SCORES/MARKS TABLE INDEXES
-- Optimize queries that fetch scores by student
CREATE INDEX IF NOT EXISTS idx_scores_student_id ON scores(student_id);

-- Optimize queries that filter by subject and term (common in reports)
CREATE INDEX IF NOT EXISTS idx_scores_subject_term ON scores(subject, term);

-- Optimize queries that fetch scores by class
CREATE INDEX IF NOT EXISTS idx_scores_class_name ON scores(class_name);

-- Composite index for most common query pattern (student + subject + term)
CREATE INDEX IF NOT EXISTS idx_scores_lookup ON scores(student_id, subject, term);

-- Composite index for broadsheet queries (class + subject + term)
CREATE INDEX IF NOT EXISTS idx_scores_broadsheet ON scores(class_name, subject, term);

-- 3. TEACHERS TABLE INDEXES
-- Optimize login queries (email lookup is most critical for auth)
CREATE INDEX IF NOT EXISTS idx_teachers_email ON teachers(email);

-- Optimize queries that filter by role
CREATE INDEX IF NOT EXISTS idx_teachers_primary_role ON teachers(teacher_primary_role);

-- Optimize queries that search by name
CREATE INDEX IF NOT EXISTS idx_teachers_name ON teachers(last_name, first_name);

-- Optimize queries that filter by assigned class
CREATE INDEX IF NOT EXISTS idx_teachers_form_class ON teachers(form_class);

-- 4. REMARKS TABLE INDEXES (if exists)
-- Optimize queries that fetch remarks by student
CREATE INDEX IF NOT EXISTS idx_remarks_student_id ON remarks(student_id);

-- Optimize queries that fetch remarks by class
CREATE INDEX IF NOT EXISTS idx_remarks_class_name ON remarks(class_name);

-- Composite index for term-specific remarks
CREATE INDEX IF NOT EXISTS idx_remarks_lookup ON remarks(student_id, class_name, term);

-- 5. ARCHIVES TABLE INDEXES (if exists)
-- Optimize queries that search archived data by year
CREATE INDEX IF NOT EXISTS idx_archives_academic_year ON archives(academic_year);

-- Optimize queries that search archived data by term
CREATE INDEX IF NOT EXISTS idx_archives_term ON archives(term);

-- Composite index for archive queries
CREATE INDEX IF NOT EXISTS idx_archives_lookup ON archives(academic_year, term, class_name);

-- 6. SETTINGS TABLE INDEXES (if exists)
-- Optimize queries that fetch settings by key
CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);

-- Display all created indexes
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- Analyze tables to update statistics for query planner
ANALYZE students;
ANALYZE scores;
ANALYZE teachers;
ANALYZE remarks;
ANALYZE archives;
ANALYZE settings;

-- Display index usage statistics (run this after a day of use)
-- Uncomment to see which indexes are being used most:
-- SELECT
--     schemaname,
--     tablename,
--     indexname,
--     idx_scan as times_used,
--     idx_tup_read as rows_read,
--     idx_tup_fetch as rows_fetched
-- FROM pg_stat_user_indexes
-- WHERE schemaname = 'public'
-- AND indexname LIKE 'idx_%'
-- ORDER BY idx_scan DESC;

COMMIT;
