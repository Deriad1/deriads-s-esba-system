import dotenv from 'dotenv';
dotenv.config();

import { checkDatabaseSetup } from './setup-database.js';

// Check if database is set up
const checkSetup = async () => {
  console.log('Checking database setup...');
  
  try {
    const isSetup = await checkDatabaseSetup();
    if (isSetup) {
      console.log('✅ Database is properly set up with all required tables!');
    } else {
      console.log('❌ Database setup is incomplete');
    }
  } catch (error) {
    console.error('❌ Error checking database setup:', error.message);
  }
};

// Run the check
checkSetup();