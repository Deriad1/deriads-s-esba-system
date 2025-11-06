import dotenv from 'dotenv';
dotenv.config();

import sql from './db-node.js';

// Test the database connection
const testDbConnection = async () => {
  console.log('Testing PostgreSQL database connection...');
  
  try {
    // Test basic connection
    const result = await sql`SELECT NOW() as current_time, version() as postgres_version`;
    console.log('✅ Database connection successful!');
    console.log('📅 Current time:', result[0].current_time);
    console.log('🐘 PostgreSQL version:', result[0].postgres_version);
    
    // Test if tables exist
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    
    if (tables.length > 0) {
      console.log('📊 Found tables:', tables.map(t => t.table_name).join(', '));
    } else {
      console.log('⚠️  No tables found. Run "npm run db:init" to create tables.');
    }
    
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    console.log('Please check your VITE_POSTGRES_URL in the .env file');
    console.log('Make sure your database is accessible and the connection string is correct.');
  }
};

// Run the test
testDbConnection();