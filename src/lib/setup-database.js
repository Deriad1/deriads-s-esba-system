import sql from './db-node.js';

// Function to create all database tables
export const setupDatabase = async () => {
  try {
    console.log('Setting up database tables...');

    // Create users table (for authentication)
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        user_primary_role VARCHAR(50) NOT NULL DEFAULT 'teacher',
        all_roles TEXT[] DEFAULT ARRAY['teacher'],
        user_current_role VARCHAR(50) NOT NULL DEFAULT 'teacher',
        gender VARCHAR(20),
        subjects TEXT[] DEFAULT ARRAY[]::TEXT[],
        classes TEXT[] DEFAULT ARRAY[]::TEXT[],
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Create students table
    await sql`
      CREATE TABLE IF NOT EXISTS students (
        id SERIAL PRIMARY KEY,
        id_number VARCHAR(20) UNIQUE,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        class_name VARCHAR(50) NOT NULL,
        gender VARCHAR(20) NOT NULL,
        term VARCHAR(30) NOT NULL,
        academic_year VARCHAR(15) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Create teachers table
    await sql`
      CREATE TABLE IF NOT EXISTS teachers (
        id SERIAL PRIMARY KEY,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        gender VARCHAR(20),
        teacher_primary_role VARCHAR(50) DEFAULT 'teacher',
        all_roles TEXT[] DEFAULT ARRAY['teacher'],
        subjects TEXT[] DEFAULT ARRAY[]::TEXT[],
        classes TEXT[] DEFAULT ARRAY[]::TEXT[],
        class_assigned VARCHAR(50), -- The specific class a form master manages
        term VARCHAR(30) NOT NULL,
        academic_year VARCHAR(15) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Create student_scores table
    await sql`
      CREATE TABLE IF NOT EXISTS student_scores (
        id SERIAL PRIMARY KEY,
        student_id VARCHAR(20) NOT NULL,
        subject VARCHAR(100) NOT NULL,
        term VARCHAR(30) NOT NULL,
        academic_year VARCHAR(15) NOT NULL,
        test1 DECIMAL(5,2) DEFAULT 0,
        test2 DECIMAL(5,2) DEFAULT 0,
        test3 DECIMAL(5,2) DEFAULT 0,
        test4 DECIMAL(5,2) DEFAULT 0,
        ca1 DECIMAL(5,2) DEFAULT 0,
        ca2 DECIMAL(5,2) DEFAULT 0,
        exam DECIMAL(5,2) DEFAULT 0,
        total DECIMAL(6,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(student_id, subject, term, academic_year)
      );
    `;

    // Create form_master_remarks table
    await sql`
      CREATE TABLE IF NOT EXISTS form_master_remarks (
        id SERIAL PRIMARY KEY,
        student_id VARCHAR(20) NOT NULL,
        class_name VARCHAR(50) NOT NULL,
        term VARCHAR(30) NOT NULL,
        academic_year VARCHAR(15) NOT NULL,
        remarks TEXT,
        attendance INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(student_id, class_name, term, academic_year)
      );
    `;

    // Create system_config table
    await sql`
      CREATE TABLE IF NOT EXISTS system_config (
        id SERIAL PRIMARY KEY,
        config_key VARCHAR(100) UNIQUE NOT NULL,
        config_value TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Insert default system configuration
    await sql`
      INSERT INTO system_config (config_key, config_value) 
      VALUES 
        ('current_term', 'First Term'),
        ('current_academic_year', '2024/2025'),
        ('school_name', 'DERIAD''S eSBA'),
        ('school_setup_complete', 'true')
      ON CONFLICT (config_key) DO NOTHING;
    `;

    console.log('Database setup completed successfully!');
    return { success: true, message: 'Database tables created successfully' };

  } catch (error) {
    console.error('Database setup failed:', error);
    return { success: false, message: error.message };
  }
};

// Function to check if database is set up
export const checkDatabaseSetup = async () => {
  try {
    const result = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'students', 'teachers', 'student_scores', 'form_master_remarks');
    `;
    return result.length >= 5;
  } catch (error) {
    console.error('Error checking database setup:', error);
    return false;
  }
};