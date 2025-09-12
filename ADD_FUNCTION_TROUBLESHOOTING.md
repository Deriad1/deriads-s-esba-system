# Add Teacher/Learner Function Troubleshooting Guide

## Quick Diagnosis Steps

### 1. Test Basic Connectivity
1. Open your browser console (F12)
2. Click the "Test Connection" button on the Admin Dashboard
3. Check the console output for detailed error messages

### 2. Common Issues and Solutions

#### Issue A: "Failed to fetch" Error
**Symptoms:** Console shows network error, can't connect to server
**Causes & Solutions:**
- ✅ **Google Apps Script not deployed**: Follow BACKEND_SETUP.md
- ✅ **Wrong API URL**: Verify the URL in `src/api.js` matches your deployed script
- ✅ **Internet connection**: Check your network connection
- ✅ **Script permissions**: Ensure deployment permissions are set correctly

#### Issue B: "Permission denied" or 403 Error
**Symptoms:** Connection works but operations fail with permission error
**Solutions:**
- ✅ **Redeploy script**: Create a new deployment in Google Apps Script
- ✅ **Check permissions**: Ensure "Execute as: Me" and "Who has access: Anyone"
- ✅ **Script authorization**: Run a test function in Google Apps Script editor first

#### Issue C: Data validation errors
**Symptoms:** Form data seems correct but fails validation
**Debug steps:**
1. Open browser console
2. Try adding a teacher/student
3. Look for validation error messages in console
4. Check if all required fields are filled

#### Issue D: Response parsing errors
**Symptoms:** "Invalid response format" errors
**Solutions:**
- ✅ Check Google Apps Script logs for backend errors
- ✅ Verify JSON format in responses
- ✅ Ensure proper error handling in backend

### 3. Enhanced Debug Mode

The add functions now include comprehensive logging. When you try to add a teacher or student:

1. **Open Browser Console** (F12 → Console tab)
2. **Attempt to add** a teacher or student
3. **Review the detailed logs** that start with:
   - `=== ADD TEACHER DEBUG START ===`
   - `=== ADD LEARNER DEBUG START ===`

### 4. Expected Console Output (Success)

When working correctly, you should see:
```
=== ADD TEACHER DEBUG START ===
Teacher form data: {"firstName":"John","lastName":"Doe",...}
🚀 Making POST request: addTeacher
📦 Payload: {...}
🌐 API URL: https://script.google.com/...
📨 Full request body: {...}
📡 Response status: 200 OK
✅ POST addTeacher completed successfully
✅ Teacher added successfully: Teacher John Doe added successfully
=== ADD TEACHER DEBUG END ===
```

### 5. Manual Testing Steps

If the automated functions aren't working:

1. **Test the API URL directly**:
   - Copy your API URL from `src/api.js`
   - Add `?action=test` to the end
   - Open in browser: `https://script.google.com/.../exec?action=test`
   - Should return: `{"status":"success","data":{"message":"API is working!"}}`

2. **Test with simple curl/fetch**:
   ```javascript
   // Run this in browser console
   fetch('YOUR_API_URL?action=getTeachers')
     .then(r => r.text())
     .then(console.log)
     .catch(console.error)
   ```

### 6. Backend Verification

1. **Open Google Apps Script editor**
2. **Check execution logs** (View → Logs)
3. **Look for error messages** when you try to add data
4. **Common backend issues**:
   - Sheet permissions
   - Missing or renamed sheets
   - Function name mismatches

### 7. Step-by-Step Debug Process

1. **Clear browser cache and reload**
2. **Open console** before attempting any operations
3. **Test connection first** - click "Test Connection" button
4. **If connection works**, try adding with minimal data:
   - Teacher: Only required fields (first name, last name, gender, email)
   - Student: Only required fields (first name, last name, class)
5. **Review all console output** for specific error details

### 8. Quick Fixes to Try

1. **Refresh the page** and try again
2. **Clear browser cache** (Ctrl+Shift+Delete)
3. **Try in incognito/private browser window**
4. **Check if Google Sheets is accessible** (open the sheets directly)
5. **Redeploy Google Apps Script** with a new version

### 9. Emergency Fallback

If nothing works, you can temporarily test with offline data:
1. Comment out the API calls in the add functions
2. Add console.log statements to verify form data
3. Check if the issue is frontend validation or backend connectivity

### 10. Contact Support Checklist

Before seeking help, please provide:
- ✅ Browser console output (full log from debug session)
- ✅ Google Apps Script execution logs
- ✅ Your API URL (with sensitive parts redacted)
- ✅ Exact error messages
- ✅ Steps to reproduce the issue

---

## Expected Workflow

1. **User fills form** → Form validation passes
2. **Frontend sends request** → API call with proper payload
3. **Google Apps Script receives** → Processes the request
4. **Database updated** → New record added to sheets
5. **Success response** → User sees success message
6. **UI updates** → Data refreshes automatically

If any step fails, the enhanced debug logging will show exactly where the process breaks down.