-- Check all English marks in database
SELECT
  m.id,
  st.first_name,
  st.last_name,
  st.class_name,
  m.subject,
  m.term,
  m.test1,
  m.test2,
  m.test3,
  m.test4,
  m.exam
FROM marks m
JOIN students st ON m.student_id = st.id
WHERE m.subject LIKE '%English%'
ORDER BY st.class_name, st.last_name;

-- Check what subjects exist for a specific class
SELECT DISTINCT subject, COUNT(*) as count
FROM marks m
JOIN students st ON m.student_id = st.id
WHERE st.class_name = 'BS7'
GROUP BY subject
ORDER BY subject;
