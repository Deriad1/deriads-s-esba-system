const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

const pool = new Pool({ connectionString: process.env.POSTGRES_URL });

async function checkTable() {
  try {
    // Check if table exists
    const tableCheck = await pool.query(`
      SELECT * FROM information_schema.tables
      WHERE table_name = 'app_settings'
    `);

    if (tableCheck.rows.length === 0) {
      console.log('❌ app_settings table does not exist');
      console.log('Creating app_settings table...');

      // Create the table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS app_settings (
          key VARCHAR(255) PRIMARY KEY,
          value TEXT,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      console.log('✅ app_settings table created successfully');
    } else {
      console.log('✅ app_settings table exists');

      // Show current settings
      const settings = await pool.query('SELECT * FROM app_settings');
      console.log('\nCurrent settings in database:');
      console.table(settings.rows);
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkTable();
