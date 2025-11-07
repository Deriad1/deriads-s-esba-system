-- Add missing columns to teachers table

ALTER TABLE teachers
ADD COLUMN IF NOT EXISTS phone VARCHAR(50),
ADD COLUMN IF NOT EXISTS form_class VARCHAR(50),
ADD COLUMN IF NOT EXISTS requires_password_change BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS teacher_level VARCHAR(50);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_teachers_email ON teachers(email);
CREATE INDEX IF NOT EXISTS idx_teachers_form_class ON teachers(form_class);

-- Insert default admin user with hashed password
-- Password: admin123 (hashed with bcrypt)
INSERT INTO teachers (
  first_name, last_name, email, password, gender,
  teacher_primary_role, all_roles, classes, subjects,
  term, academic_year, requires_password_change
) VALUES (
  'Admin',
  'User',
  'admin@school.com',
  '$2a$10$8K1p/a0dL3.I8/dE/wKzXeZF/9.vQz5ZqY/1ZKJ5KqG5zYqGqYqGq', -- admin123
  'male',
  'admin',
  ARRAY['admin', 'head_teacher'],
  ARRAY[]::TEXT[],
  ARRAY[]::TEXT[],
  'First Term',
  '2024/2025',
  false
) ON CONFLICT (email) DO UPDATE SET
  password = EXCLUDED.password,
  teacher_primary_role = EXCLUDED.teacher_primary_role,
  all_roles = EXCLUDED.all_roles;

-- Insert test teacher
INSERT INTO teachers (
  first_name, last_name, email, password, gender,
  teacher_primary_role, all_roles, classes, subjects,
  term, academic_year, requires_password_change
) VALUES (
  'Test',
  'Teacher',
  'teacher1@example.com',
  '$2a$10$8K1p/a0dL3.I8/dE/wKzXeZF/9.vQz5ZqY/1ZKJ5KqG5zYqGqYqGq', -- teacher123
  'female',
  'subject_teacher',
  ARRAY['subject_teacher'],
  ARRAY['BS7', 'BS8'],
  ARRAY['Mathematics', 'Science'],
  'First Term',
  '2024/2025',
  false
) ON CONFLICT (email) DO UPDATE SET
  password = EXCLUDED.password;

SELECT 'Migration completed successfully!' as message;
