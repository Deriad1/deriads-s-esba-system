# Google Apps Script Deployment Guide

## Current Issue: CORS Errors

You're experiencing CORS (Cross-Origin Resource Sharing) errors because:

1. **GET requests work** - Basic GET requests don't trigger CORS preflight
2. **Test connection fails** - The test function was using custom headers that trigger CORS preflight
3. **POST requests may fail** - POST requests with certain content types trigger CORS preflight

## SOLUTION STEPS:

### Step 1: Update Google Apps Script
1. Open your Google Apps Script project: https://script.google.com
2. Copy the updated `code.gs` content from the `backend/code.gs` file
3. Save the script (Ctrl+S)

### Step 2: Deploy/Redeploy the Web App
1. In Google Apps Script, click **Deploy** → **New deployment** (or Manage deployments)
2. Set the following settings:
   - **Type**: Web app
   - **Execute as**: Me (your email)
   - **Who has access**: Anyone
3. Click **Deploy**
4. Copy the new deployment URL

### Step 3: Update Frontend
1. Open `src/api.js`
2. Replace the `API_URL` with your new deployment URL
3. Save the file

### Step 4: Test the Fix
1. Restart your React development server: `npm run dev`
2. Open the admin dashboard
3. Try the "Test Connection" button
4. Try adding a teacher or student

## Expected Results:
- ✅ Test connection should work
- ✅ GET requests (viewing data) should work
- ✅ POST requests (adding/deleting) should work
- ✅ No more CORS errors in browser console

## Troubleshooting:

### If test connection still fails:
1. Check browser console for specific error messages
2. Try accessing your deployment URL directly in browser: `YOUR_URL?action=test`
3. Verify the deployment settings (Execute as: Me, Who has access: Anyone)

### If you see "Access denied" or permission errors:
1. Make sure deployment is set to "Execute as: Me"
2. Make sure "Who has access" is set to "Anyone"
3. You may need to re-authorize the script

### If you see "Script function not found":
1. Make sure you saved the updated `code.gs` file
2. Make sure you created a **new deployment** (not just saved)
3. Check for typos in function names

## Your Current Deployment URL:
```
https://script.google.com/macros/s/AKfycbycF5LKnuShzlNnDIyJHv4YPdO-yvNWJoSzKJQPHVHI5g9RXnusVwMQODy2Ze3llBDP6A/exec
```

## Code Changes Made:
1. **Fixed testConnection()** - Removed custom headers that triggered CORS preflight
2. **Updated doOptions()** - Better CORS preflight handling  
3. **Enhanced doGet()** - Added version info and better logging
4. **Enhanced doPost()** - Added better logging and documentation

**Note**: Google Apps Script automatically handles CORS for web app deployments, but the preflight handling needed to be fixed.