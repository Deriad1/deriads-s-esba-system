-- Database Migration: Add Archives and Settings Tables
-- Date: 2025-10-16
-- Description: Creates tables for term archiving and global settings management

-- ============================================
-- Archives Table
-- ============================================
-- Stores metadata about archived terms
-- The actual data (marks, remarks, students) stays in original tables
-- This table just tracks what has been archived

CREATE TABLE IF NOT EXISTS archives (
  id SERIAL PRIMARY KEY,
  term VARCHAR(50) NOT NULL,
  academic_year VARCHAR(20) NOT NULL,
  archived_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  archived_by INTEGER REFERENCES teachers(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(term, academic_year)
);

CREATE INDEX idx_archives_term_year ON archives(term, academic_year);
CREATE INDEX idx_archives_date ON archives(archived_date);

-- ============================================
-- Settings Table
-- ============================================
-- Stores global school settings
-- Should only have ONE row at a time

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

-- Ensure only one settings row exists
CREATE UNIQUE INDEX idx_settings_singleton ON settings ((id IS NOT NULL));

-- ============================================
-- Update Triggers
-- ============================================

-- Auto-update updated_at for archives
CREATE OR REPLACE FUNCTION update_archives_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_archives_updated_at
  BEFORE UPDATE ON archives
  FOR EACH ROW
  EXECUTE FUNCTION update_archives_updated_at();

-- Auto-update updated_at for settings
CREATE OR REPLACE FUNCTION update_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_settings_updated_at
  BEFORE UPDATE ON settings
  FOR EACH ROW
  EXECUTE FUNCTION update_settings_updated_at();

-- ============================================
-- Comments
-- ============================================

COMMENT ON TABLE archives IS 'Stores metadata about archived academic terms';
COMMENT ON TABLE settings IS 'Stores global school settings (singleton table)';

COMMENT ON COLUMN archives.metadata IS 'Additional metadata about the archive (JSON format)';
COMMENT ON COLUMN settings.grade_config IS 'Grading scale configuration (JSON format)';

-- ============================================
-- Grant Permissions (adjust as needed)
-- ============================================

-- GRANT SELECT, INSERT, UPDATE, DELETE ON archives TO your_app_user;
-- GRANT SELECT, INSERT, UPDATE ON settings TO your_app_user;
-- GRANT USAGE, SELECT ON SEQUENCE archives_id_seq TO your_app_user;
-- GRANT USAGE, SELECT ON SEQUENCE settings_id_seq TO your_app_user;
