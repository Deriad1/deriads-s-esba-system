-- Create assessments table if it doesn't exist
CREATE TABLE IF NOT EXISTS assessments (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  max_score INTEGER NOT NULL DEFAULT 100,
  assessment_type VARCHAR(50) DEFAULT 'mock_exam',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create assessment_scores table if it doesn't exist
CREATE TABLE IF NOT EXISTS assessment_scores (
  id SERIAL PRIMARY KEY,
  assessment_id INTEGER NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  student_id VARCHAR(50) NOT NULL,
  subject VARCHAR(100) NOT NULL,
  score DECIMAL(5,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(assessment_id, student_id, subject)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_assessment_scores_assessment_id ON assessment_scores(assessment_id);
CREATE INDEX IF NOT EXISTS idx_assessment_scores_student_id ON assessment_scores(student_id);
CREATE INDEX IF NOT EXISTS idx_assessment_scores_subject ON assessment_scores(subject);
CREATE INDEX IF NOT EXISTS idx_assessment_scores_lookup ON assessment_scores(assessment_id, student_id, subject);

-- Add some sample assessments for testing
INSERT INTO assessments (name, description, max_score, assessment_type)
VALUES
  ('Midterm Mock Exam', 'First term midterm mock examination', 100, 'mock_exam'),
  ('End of Term Mock Exam', 'End of term mock examination', 100, 'mock_exam'),
  ('Practice Test 1', 'Practice test for preparation', 50, 'practice_test')
ON CONFLICT DO NOTHING;

-- Display success message
SELECT 'Assessment tables created successfully!' as message;
