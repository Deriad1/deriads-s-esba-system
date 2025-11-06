import dotenv from 'dotenv';
dotenv.config();

import { neon } from '@neondatabase/serverless';

console.log('POSTGRES_URL:', process.env.POSTGRES_URL ? 'Loaded' : 'Not found');

if (!process.env.POSTGRES_URL) {
  console.error('❌ POSTGRES_URL environment variable not set');
  process.exit(1);
}

try {
  const sql = neon(process.env.POSTGRES_URL);
  console.log('✅ Database client created successfully');
  
  // Test the connection
  const result = await sql`SELECT 1 as test`;
  console.log('✅ Database connection successful!', result);
} catch (error) {
  console.error('❌ Database connection failed:', error.message);
}