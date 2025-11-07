# Development Setup Guide

## The Problem You Were Experiencing

**Error:** `Failed to execute 'json' on 'Response': Unexpected end of JSON input`

**Root Cause:** This error occurs when the frontend tries to call API endpoints (like `/api/auth/login`), but the Vercel dev server (which handles API routes) is not running. The Vite dev server only serves the React frontend, NOT the API endpoints.

## Solution: Run Both Servers

Your application requires **TWO servers** running simultaneously in development:

### 1. Vite Dev Server (React Frontend)
- **Port:** 9001 (or 9000 if available)
- **Purpose:** Serves the React application
- **Command:** `npm run dev`
- **URL:** http://localhost:9001

### 2. Vercel Dev Server (API Backend)
- **Port:** 3000
- **Purpose:** Serves API endpoints (`/api/*`)
- **Command:** `vercel dev --listen 3000`
- **URL:** http://localhost:3000

## How to Start Development

### Option 1: Two Terminal Windows (Recommended)

**Terminal 1 - Start Vite:**
```bash
npm run dev
```

**Terminal 2 - Start Vercel:**
```bash
vercel dev --listen 3000
```

### Option 2: Single Command (Windows)
```bash
start cmd /k "npm run dev" && start cmd /k "vercel dev --listen 3000"
```

## How It Works

1. **Frontend** runs on http://localhost:9001
2. **API requests** from frontend go to `/api/*` endpoints
3. **Vite proxy** forwards these requests to http://localhost:3000
4. **Vercel dev server** handles the API logic and database queries
5. **Response** flows back to the frontend

```
Browser (localhost:9001)
    ↓
Frontend makes request to /api/auth/login
    ↓
Vite proxy intercepts and forwards to localhost:3000/api/auth/login
    ↓
Vercel serverless function handles request
    ↓
Database query via Neon
    ↓
Response back to frontend
```

## Current Status

✅ **BOTH SERVERS ARE NOW RUNNING!**

- Vite Dev Server: http://localhost:9001
- Vercel Dev Server: http://localhost:3000

You can now:
1. Open your browser to http://localhost:9001
2. Try logging in with the demo credentials
3. The login should work properly now!

## Demo Login Credentials

### God Mode (Development Only)
- **Email:** god@god.com
- **Password:** god123
- **Roles:** All roles available

### Regular Demo Accounts
- **Admin:** admin@school.com / admin123
- **Teacher:** teacher1@example.com / teacher123

## Troubleshooting

### If you still see JSON errors:

1. **Check both servers are running:**
   ```bash
   # In one terminal
   npm run dev

   # In another terminal
   vercel dev --listen 3000
   ```

2. **Check the browser console** (F12) for detailed error messages

3. **Check Vercel dev server logs** for API errors

4. **Verify database connection:**
   - Make sure `.env` file has correct DATABASE_URL
   - Check that Neon database is accessible

### If Vercel dev server fails to start:

1. **Install/Update Vercel CLI:**
   ```bash
   npm i -g vercel@latest
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Link to project (if needed):**
   ```bash
   vercel link
   ```

## Production vs Development

### Development (Current)
- Two servers required
- Hot reload enabled
- API routes via Vercel dev
- Environment variables from `.env`

### Production (Vercel)
- Single deployment
- All routes handled by Vercel edge network
- API routes automatically deployed as serverless functions
- Environment variables from Vercel dashboard

## Next Steps

1. Open http://localhost:9001 in your browser
2. Try logging in
3. If you encounter any errors, check both terminal windows for error messages
4. Report any issues with both frontend and backend logs

## Important Files Modified

1. **vite.config.js** - Added proxy configuration to forward `/api` requests to port 3000
2. **src/api-client.js** - Enhanced error handling with better error messages
3. **This guide** - Comprehensive setup instructions

## Environment Variables

Make sure your `.env` file contains:
```env
DATABASE_URL=postgresql://neondb_owner:npg_5G8EHzxRDKTY@ep-noisy-forest-ad6991s1-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
```

**Note:** Never commit `.env` to version control!
