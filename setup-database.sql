-- Complete Database Setup Script for eSBA School Management System
-- Run this script to create all necessary tables

-- ============================================
-- Settings Table (for the new API endpoint)
-- ============================================

CREATE TABLE IF NOT EXISTS settings (
  id SERIAL PRIMARY KEY,
  school_name VARCHAR(255) DEFAULT '',
  school_logo TEXT DEFAULT '',
  background_image TEXT DEFAULT '',
  term VARCHAR(50) DEFAULT 'First Term',
  academic_year VARCHAR(20) NOT NULL,
  current_year INTEGER NOT NULL,
  school_address TEXT DEFAULT '',
  school_phone VARCHAR(50) DEFAULT '',
  school_email VARCHAR(100) DEFAULT '',
  school_motto TEXT DEFAULT '',
  principal_name VARCHAR(255) DEFAULT '',
  principal_signature TEXT DEFAULT '',
  grade_config JSONB DEFAULT '{
    "A": {"min": 80, "max": 100, "remark": "Excellent"},
    "B": {"min": 70, "max": 79, "remark": "Very Good"},
    "C": {"min": 60, "max": 69, "remark": "Good"},
    "D": {"min": 50, "max": 59, "remark": "Pass"},
    "E": {"min": 40, "max": 49, "remark": "Weak"},
    "F": {"min": 0, "max": 39, "remark": "Fail"}
  }',
  report_card_template VARCHAR(50) DEFAULT 'default',
  enable_attendance BOOLEAN DEFAULT true,
  enable_remarks BOOLEAN DEFAULT true,
  enable_broadsheet BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default settings
INSERT INTO settings (academic_year, current_year, term)
VALUES ('2024/2025', 2024, 'First Term')
ON CONFLICT DO NOTHING;

-- ============================================
-- Archives Table
-- ============================================

CREATE TABLE IF NOT EXISTS archives (
  id SERIAL PRIMARY KEY,
  term VARCHAR(50) NOT NULL,
  academic_year VARCHAR(20) NOT NULL,
  archived_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  archived_by INTEGER,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(term, academic_year)
);

CREATE INDEX IF NOT EXISTS idx_archives_term_year ON archives(term, academic_year);
CREATE INDEX IF NOT EXISTS idx_archives_date ON archives(archived_date);

-- ============================================
-- Note: Other tables (students, teachers, marks, etc.)
-- should already exist from your initial setup
-- ============================================

-- Verify all tables exist
SELECT
  table_name,
  CASE
    WHEN table_name IN ('students', 'teachers', 'marks', 'classes', 'remarks', 'settings', 'archives')
    THEN '✅ Core Table'
    ELSE '⚠️ Additional Table'
  END as status
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
