import dotenv from 'dotenv';
dotenv.config();

import sql from './db.js';

// Function to drop all database tables
const resetDatabase = async () => {
  try {
    console.log('Dropping database tables...');

    // Drop tables in reverse order to avoid foreign key constraints
    await sql`DROP TABLE IF EXISTS system_config`;
    await sql`DROP TABLE IF EXISTS form_master_remarks`;
    await sql`DROP TABLE IF EXISTS student_scores`;
    await sql`DROP TABLE IF EXISTS teachers`;
    await sql`DROP TABLE IF EXISTS students`;
    await sql`DROP TABLE IF EXISTS users`;

    console.log('Database tables dropped successfully!');
  } catch (error) {
    console.error('Error dropping database tables:', error);
  }
};

// Run the reset
resetDatabase();