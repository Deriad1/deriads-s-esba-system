-- Reassign students from BS10, BS11, BS12 to BS9
-- This will remove those classes from the system

-- Update students in BS10 to BS9
UPDATE students
SET class_name = 'BS9', updated_at = NOW()
WHERE class_name = 'BS10';

-- Update students in BS11 to BS9
UPDATE students
SET class_name = 'BS9', updated_at = NOW()
WHERE class_name = 'BS11';

-- Update students in BS12 to BS9
UPDATE students
SET class_name = 'BS9', updated_at = NOW()
WHERE class_name = 'BS12';

-- Verify the changes
SELECT id, id_number, first_name, last_name, class_name
FROM students
WHERE class_name IN ('BS9', 'BS10', 'BS11', 'BS12')
ORDER BY class_name, last_name;
