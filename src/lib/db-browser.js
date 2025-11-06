// Database connection for browser environment (Vite)
// Import the Neon serverless driver
import { neon } from '@neondatabase/serverless';

// Create a connection pool for browser environment
const sql = neon(import.meta.env.VITE_POSTGRES_URL);

export default sql;