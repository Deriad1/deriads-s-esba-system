import { setupDatabase } from './setup-database.js';

// Initialize the database
const initDatabase = async () => {
  console.log('Initializing PostgreSQL database...');
  
  try {
    const result = await setupDatabase();
    if (result.success) {
      console.log('✅ Database initialization completed successfully!');
      console.log(result.message);
    } else {
      console.error('❌ Database initialization failed:', result.message);
    }
  } catch (error) {
    console.error('❌ Database initialization error:', error);
  }
};

// Run the initialization
initDatabase();