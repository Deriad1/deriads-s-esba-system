# Database Setup Instructions

## Issue
The application shows this error:
```
Database URL not found in environment variables. Please check your .env file.
```

## Solution

You need to configure your database connection by updating the `.env` file with your actual PostgreSQL database credentials.

### Step 1: Get Your Database URL

#### Option A: Using Neon (Recommended - Free Tier Available)

1. Go to [neon.tech](https://neon.tech)
2. Sign up for a free account
3. Create a new project
4. Copy the connection string (it looks like):
   ```
   postgresql://username:password@ep-something-123456.us-east-2.aws.neon.tech/dbname?sslmode=require
   ```

#### Option B: Using Supabase

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Settings > Database
4. Copy the connection string (Connection pooling mode)

#### Option C: Using Railway

1. Go to [railway.app](https://railway.app)
2. Create a PostgreSQL database
3. Copy the connection URL from the database settings

### Step 2: Update Your .env File

1. Open the `.env` file in the root of your project
2. Replace the placeholder with your actual database URL:

```env
# Database Configuration
VITE_POSTGRES_URL=postgresql://YOUR_ACTUAL_DATABASE_URL_HERE
```

**Example:**
```env
VITE_POSTGRES_URL=postgresql://myuser:mypassword@ep-cool-night-123456.us-east-2.aws.neon.tech/mydb?sslmode=require
```

### Step 3: Restart the Development Server

After updating `.env`:

1. Stop the current dev server (Ctrl+C in terminal)
2. Restart it:
   ```bash
   npm run dev
   ```

### Step 4: Initialize the Database

Once the server starts without errors, you may need to initialize your database tables:

```bash
npm run db:init
```

## Security Note

⚠️ **IMPORTANT**: Never commit your `.env` file to version control!

The `.env` file is already in `.gitignore`, so it won't be committed. The `.env.example` file is provided as a template without sensitive data.

## Troubleshooting

### Error persists after updating .env

1. Make sure the `.env` file is in the project root (same directory as `package.json`)
2. Verify the variable name is exactly `VITE_POSTGRES_URL` (with VITE_ prefix)
3. Make sure there are no spaces around the `=` sign
4. Restart the dev server completely

### Connection refused or timeout errors

1. Check that your database service is running
2. Verify your IP is allowed in the database firewall settings
3. Ensure the connection string includes `?sslmode=require` at the end

### Cannot find database

Make sure you've:
1. Created the database in your PostgreSQL provider
2. Run the initialization script: `npm run db:init`

## Need Help?

Check these files for more information:
- `COMPLETE_SYSTEM_GUIDE.md` - Full system documentation
- `DEPLOYMENT_GUIDE.md` - Deployment instructions
- `TROUBLESHOOTING.md` - Common issues and solutions
