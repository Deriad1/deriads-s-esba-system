import dotenv from 'dotenv';
dotenv.config();

console.log('Environment variables:');
console.log('VITE_POSTGRES_URL:', process.env.VITE_POSTGRES_URL ? 'Found' : 'Not found');
console.log('POSTGRES_URL:', process.env.POSTGRES_URL ? 'Found' : 'Not found');

if (process.env.VITE_POSTGRES_URL) {
  console.log('VITE_POSTGRES_URL length:', process.env.VITE_POSTGRES_URL.length);
} else if (process.env.POSTGRES_URL) {
  console.log('POSTGRES_URL length:', process.env.POSTGRES_URL.length);
} else {
  console.log('No database URL found in environment variables');
}