-- Check all subjects for BS5
SELECT DISTINCT subject, COUNT(*) as student_count
FROM marks m
JOIN students st ON m.student_id = st.id
WHERE st.class_name = 'BS5'
GROUP BY subject
ORDER BY subject;

-- Check all BS5 marks in detail
SELECT
  m.id,
  st.first_name,
  st.last_name,
  m.subject,
  m.term,
  m.test1,
  m.test2,
  m.test3,
  m.test4,
  m.exam
FROM marks m
JOIN students st ON m.student_id = st.id
WHERE st.class_name = 'BS5'
ORDER BY m.subject, st.last_name;
