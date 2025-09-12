# 🚨 URGENT: Failed to Fetch Error - Google Apps Script Fix Guide

## Problem: "Failed to fetch" means the frontend cannot reach your Google Apps Script backend.

## 🔧 IMMEDIATE SOLUTIONS (Step by Step)

### Step 1: Test the API URL Directly (30 seconds)
1. **Copy this URL and open it in a new browser tab:**
   ```
   https://script.google.com/macros/s/AKfycbx8vZGD2AnOpyKXKIrF2HUX1rBjO7iXLAIW_tgj7N3LBp6n9Qnide1Eq0-BujnwFmwzJQ/exec?action=test
   ```

2. **Expected Result:** You should see:
   ```json
   {"status":"success","data":{"message":"API is working!","timestamp":"..."}}
   ```

3. **If you see an error or blank page:** Your Google Apps Script is not properly deployed.

### Step 2: Check Google Apps Script Deployment (2 minutes)

1. **Open Google Apps Script:** https://script.google.com
2. **Find your project** (it should contain the code.gs file)
3. **Click "Deploy" → "Manage deployments"**
4. **Check if there's an active deployment:**
   - Type: "Web app"
   - Execute as: "Me"
   - Who has access: "Anyone"

### Step 3: Create New Deployment (if needed)

**If no deployment exists or it's wrong:**

1. **Click "Deploy" → "New deployment"**
2. **Settings:**
   - Type: **"Web app"**
   - Description: "School Management API"
   - Execute as: **"Me"** (very important!)
   - Who has access: **"Anyone"** (very important!)
3. **Click "Deploy"**
4. **Authorize the script** (click "Authorize access" if prompted)
5. **Copy the new Web app URL**

### Step 4: Update API URL (if you got a new one)

**If you got a new URL from Step 3:**

1. **Open:** `src/api.js` in your code editor
2. **Replace line 14** with your new URL:
   ```javascript
   const API_URL = 'YOUR_NEW_URL_HERE';
   ```
3. **Save the file**

### Step 5: Test Again

1. **Go back to your application**
2. **Click "Quick Test" button**
3. **Should now work!**

## 🆘 If Step 1 Failed (Common Issues)

### Issue A: Shows "Sorry, unable to open the file"
**Solution:** The script ID in the URL is wrong or the script doesn't exist.
- Check if you have the correct Google Apps Script project
- Verify the script contains all the backend functions

### Issue B: Shows "Authorization required" or permission error
**Solution:** 
1. Go to Google Apps Script editor
2. Click "Run" on any function (like `doGet`)
3. Grant all permissions when prompted
4. Try Step 1 again

### Issue C: Shows Google login page
**Solution:** Your script is set to wrong permissions
1. Redeploy with "Who has access: Anyone"
2. Make sure "Execute as: Me" is selected

### Issue D: Shows blank white page
**Solution:** 
1. Check Google Apps Script execution logs (View → Logs)
2. Look for error messages
3. Make sure your code.gs file has all required functions

## 🔍 Advanced Debugging

### Check Script Permissions:
1. **Go to Google Apps Script**
2. **Click the gear icon** (Project Settings)
3. **Scroll to "Google Cloud Platform (GCP) Project"**
4. **Make sure it's linked properly**

### Check Script Triggers:
1. **In Google Apps Script, click "Triggers"** (clock icon)
2. **Make sure no broken triggers exist**
3. **Delete any old/broken triggers**

### Check Execution Transcript:
1. **In Google Apps Script, go to "Executions"**
2. **Look for recent failed executions**
3. **Click on failures to see error details**

## 📞 Emergency Contact Info

If you're still stuck, provide me with:
1. ✅ What you see when you open the test URL (Step 1)
2. ✅ Screenshot of your Google Apps Script deployment settings
3. ✅ Any error messages from Google Apps Script logs
4. ✅ Your Google Apps Script project URL

## 🎯 Quick Verification Checklist

- [ ] Google Apps Script project exists and contains backend code
- [ ] Script is deployed as "Web app"
- [ ] Execute as: "Me"
- [ ] Who has access: "Anyone"  
- [ ] All required permissions granted
- [ ] Test URL works in browser
- [ ] API_URL in src/api.js matches deployment URL
- [ ] No typos in the URL (especially /exec at the end)

**The #1 cause of "Failed to fetch" is incorrect Google Apps Script deployment settings!**