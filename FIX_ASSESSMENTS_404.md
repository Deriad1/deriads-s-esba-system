# Fix: Assessments API 404 Error

## Problem
Getting `404 Not Found` error when trying to access `/api/assessments`

```
GET http://localhost:9000/api/assessments 404 (Not Found)
Error: Unexpected token '<', "<!DOCTYPE "... is not valid JSON
```

## Root Cause
The Vercel dev server needs to be restarted to recognize the new API endpoint at `api/assessments/index.js`.

## Solution

### Option 1: Restart Vercel Dev Server (Recommended)

**1. Stop all running node processes:**

Press `Ctrl+C` in your terminal where `npm run dev` is running.

Or force stop all node processes:
```bash
# PowerShell
Stop-Process -Name node -Force
```

**2. Wait 2-3 seconds**

**3. Restart the dev server:**
```bash
npm run dev
```

**4. Wait for it to fully start (you should see):**
```
> vercel dev

Vercel CLI [version]
> Ready! Available at http://localhost:9000
```

**5. Test the API:**

Open your browser and go to:
```
http://localhost:9000/api/assessments
```

You should see JSON response:
```json
{
  "status": "success",
  "count": 1,
  "data": [...]
}
```

### Option 2: Test API Directly (Quick Check)

Before restarting, test if the API file itself works:

```bash
# From project root
node api/assessments/index.js
```

If you get errors, there might be an issue with the API code itself.

### Option 3: Check API Manually via Curl

After restarting, test with curl:

```bash
# Windows PowerShell
curl http://localhost:9000/api/assessments

# Or
Invoke-WebRequest -Uri "http://localhost:9000/api/assessments"
```

## Verification Steps

Once restarted:

1. **Test API endpoint:**
   - Browser: `http://localhost:9000/api/assessments`
   - Should return JSON, not HTML

2. **Test in Admin Dashboard:**
   - Go to Admin Dashboard
   - Click "Manage Assessments"
   - Modal should load without errors
   - Should show the default "Standard Assessment"

3. **Create an assessment:**
   - Click "+ Create New Assessment"
   - Fill in "Midterm Exam 2025"
   - Click "Create Assessment"
   - Should see success message
   - New assessment appears in list

## Common Issues

### Issue 1: Still getting 404 after restart
**Possible causes:**
- Server didn't fully stop
- Cache issue
- Port conflict

**Solution:**
```bash
# Kill all node processes
taskkill /F /IM node.exe

# Wait 5 seconds
# Then restart
npm run dev
```

### Issue 2: API file not found
**Check file exists:**
```bash
ls api/assessments/index.js
```

**Should show:**
```
api/assessments/index.js
```

If not, the file wasn't created properly. Re-run:
```bash
# Make sure the file exists with correct content
cat api/assessments/index.js
```

### Issue 3: Vercel dev not starting
**Check package.json scripts:**
```json
{
  "scripts": {
    "dev": "vercel dev --listen 9000",
    ...
  }
}
```

**Try alternative start:**
```bash
npx vercel dev --listen 9000
```

### Issue 4: Database connection error
**Check .env file:**
```
DATABASE_URL=postgresql://...
```

**Test database connection:**
```bash
node check-schema.js
```

## What Should Happen

### Before Restart:
```
GET /api/assessments → 404 Not Found (HTML page)
Error: Unexpected token '<', "<!DOCTYPE"...
```

### After Restart:
```
GET /api/assessments → 200 OK (JSON response)
{
  "status": "success",
  "count": 1,
  "data": [
    {
      "id": 1,
      "name": "Standard Assessment (Class Tests + Exam)",
      "assessment_type": "standard",
      ...
    }
  ]
}
```

## Quick Test Command

After restarting, run this in your terminal:

```bash
curl http://localhost:9000/api/assessments
```

**Expected output:**
```json
{"status":"success","count":1,"data":[{...}]}
```

**Wrong output (means still not working):**
```html
<!DOCTYPE html>...
```

## Next Steps

1. ✅ Stop server
2. ✅ Wait 2-3 seconds
3. ✅ Run `npm run dev`
4. ✅ Wait for "Ready! Available at http://localhost:9000"
5. ✅ Test: `http://localhost:9000/api/assessments`
6. ✅ Go to Admin Dashboard
7. ✅ Click "Manage Assessments"
8. ✅ Should work!

---

**Still having issues?** Let me know the error message and I'll help troubleshoot further!
