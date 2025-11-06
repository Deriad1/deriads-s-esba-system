// Environment Variables Setup Script

import fs from 'fs';
import path from 'path';

const createEnvFile = () => {
  const envContent = `# PostgreSQL Database Configuration
# Replace this with your actual PostgreSQL connection string
# You can get this from Neon, Supabase, or any PostgreSQL provider

# Example for Neon Database:
# VITE_POSTGRES_URL=postgresql://username:password@hostname/database?sslmode=require

# Example for Supabase:
# VITE_POSTGRES_URL=postgresql://postgres:password@db.supabase.co:5432/postgres

# Example for Railway:
# VITE_POSTGRES_URL=postgresql://postgres:password@containers-us-west-xxx.railway.app:5432/railway

# IMPORTANT: Replace the URL below with your actual PostgreSQL connection string
VITE_POSTGRES_URL=postgresql://username:password@hostname/database?sslmode=require

# Development settings
NODE_ENV=development
VITE_APP_NAME=School Management System
VITE_APP_VERSION=1.0.0

# Instructions:
# 1. Get your PostgreSQL connection string from:
#    - Neon: https://neon.tech (recommended)
#    - Supabase: https://supabase.com
#    - Railway: https://railway.app
# 2. Replace the VITE_POSTGRES_URL above with your actual connection string
# 3. Save this file
# 4. Run: npm run db:init
# 5. Run: npm run db:test
`;

  const envPath = path.join(process.cwd(), '.env');
  
  if (fs.existsSync(envPath)) {
    console.log('✅ .env file already exists');
    console.log('📝 Please update VITE_POSTGRES_URL with your actual PostgreSQL connection string');
  } else {
    fs.writeFileSync(envPath, envContent);
    console.log('✅ .env file created successfully!');
    console.log('📝 Please update VITE_POSTGRES_URL with your actual PostgreSQL connection string');
  }
  
  console.log('\n🔗 Get your PostgreSQL connection string from:');
  console.log('   • Neon: https://neon.tech (recommended)');
  console.log('   • Supabase: https://supabase.com');
  console.log('   • Railway: https://railway.app');
  console.log('\n📋 Next steps:');
  console.log('   1. Update VITE_POSTGRES_URL in .env file');
  console.log('   2. Run: npm run db:init');
  console.log('   3. Run: npm run db:test');
};

createEnvFile();
