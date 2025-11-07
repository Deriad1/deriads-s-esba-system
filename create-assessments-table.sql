-- Create Assessments Table for Custom Assessment System
-- Supports Midterm Exams, Mock Exams, and other custom assessments

CREATE TABLE IF NOT EXISTS assessments (
  id SERIAL PRIMARY KEY,

  -- Basic Information
  name VARCHAR(100) NOT NULL,                    -- "Midterm Exam", "Mock Exam"
  description TEXT,                               -- Optional details
  assessment_type VARCHAR(50) NOT NULL,           -- "midterm", "mock", "standard"

  -- Scoring Configuration
  max_score NUMERIC(5,2) NOT NULL DEFAULT 100,   -- Maximum possible score

  -- Academic Context
  term VARCHAR(50) NOT NULL,                      -- "First Term", "Second Term", "Third Term"
  academic_year VARCHAR(20) NOT NULL,             -- "2024/2025", "2025/2026"

  -- Applicability
  applicable_classes TEXT[],                      -- Array: ["BS7", "BS8", "BS9"] or NULL for all
  applicable_subjects TEXT[],                     -- Array: ["Mathematics", "English"] or NULL for all

  -- Status and Scheduling
  is_active BOOLEAN DEFAULT true,                 -- Active/Inactive
  start_date TIMESTAMP,                           -- When teachers can start entering marks
  end_date TIMESTAMP,                             -- Deadline for completion

  -- Audit Trail
  created_by INTEGER,                             -- User ID who created (optional FK to users)
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_assessments_term_year ON assessments(term, academic_year);
CREATE INDEX IF NOT EXISTS idx_assessments_active ON assessments(is_active);
CREATE INDEX IF NOT EXISTS idx_assessments_type ON assessments(assessment_type);

-- Add assessment_id to marks table
ALTER TABLE marks ADD COLUMN IF NOT EXISTS assessment_id INTEGER REFERENCES assessments(id) ON DELETE SET NULL;
ALTER TABLE marks ADD COLUMN IF NOT EXISTS assessment_type VARCHAR(50) DEFAULT 'standard';

-- Add index for assessment queries
CREATE INDEX IF NOT EXISTS idx_marks_assessment_id ON marks(assessment_id);

-- Insert default assessment types (for reference)
INSERT INTO assessments (
  name,
  description,
  assessment_type,
  max_score,
  term,
  academic_year,
  is_active
) VALUES
  (
    'Standard Assessment (Class Tests + Exam)',
    'Regular continuous assessment with 4 class tests and final exam',
    'standard',
    100,
    'Third Term',
    '2025/2026',
    true
  )
ON CONFLICT DO NOTHING;

-- Create view for active assessments
CREATE OR REPLACE VIEW active_assessments AS
SELECT
  id,
  name,
  description,
  assessment_type,
  max_score,
  term,
  academic_year,
  applicable_classes,
  applicable_subjects,
  start_date,
  end_date,
  created_at
FROM assessments
WHERE is_active = true
ORDER BY created_at DESC;

COMMENT ON TABLE assessments IS 'Custom assessments like Midterm Exams, Mock Exams, etc.';
COMMENT ON COLUMN assessments.assessment_type IS 'Type: standard, midterm, mock, quiz, etc.';
COMMENT ON COLUMN assessments.applicable_classes IS 'NULL means all classes, or specific array like {BS7,BS8}';
COMMENT ON COLUMN assessments.applicable_subjects IS 'NULL means all subjects, or specific array like {Mathematics,English}';
