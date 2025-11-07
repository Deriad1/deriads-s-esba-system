-- Add test score columns to marks table for broadsheet functionality

ALTER TABLE marks
ADD COLUMN IF NOT EXISTS test1 DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS test2 DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS test3 DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS test4 DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS exam DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS ca1 DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS ca2 DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS exam_score DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS position INTEGER,
ADD COLUMN IF NOT EXISTS grade VARCHAR(2),
ADD COLUMN IF NOT EXISTS remark TEXT;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_marks_student_subject ON marks(student_id, subject);
CREATE INDEX IF NOT EXISTS idx_marks_class_subject ON marks(class_name, subject) WHERE class_name IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_marks_term ON marks(term);

SELECT 'Marks table columns added successfully!' as message;
