-- Promotion History Table
-- Tracks all student promotions for historical records and auditing

CREATE TABLE IF NOT EXISTS promotion_history (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  from_class VARCHAR(10) NOT NULL,
  to_class VARCHAR(10) NOT NULL,
  academic_year VARCHAR(20) NOT NULL,
  term VARCHAR(20) DEFAULT 'First Term',
  promotion_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  promoted_by INTEGER REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_promotion_history_student_id ON promotion_history(student_id);
CREATE INDEX IF NOT EXISTS idx_promotion_history_academic_year ON promotion_history(academic_year);
CREATE INDEX IF NOT EXISTS idx_promotion_history_date ON promotion_history(promotion_date);

-- Add comments
COMMENT ON TABLE promotion_history IS 'Tracks student promotions from one class to another';
COMMENT ON COLUMN promotion_history.student_id IS 'Student being promoted';
COMMENT ON COLUMN promotion_history.from_class IS 'Original class (e.g., BS7)';
COMMENT ON COLUMN promotion_history.to_class IS 'Target class (e.g., BS8, Graduated)';
COMMENT ON COLUMN promotion_history.academic_year IS 'Academic year of promotion';
COMMENT ON COLUMN promotion_history.term IS 'Term when promotion occurred';
COMMENT ON COLUMN promotion_history.promoted_by IS 'User who performed the promotion';
