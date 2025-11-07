# Print Reports Timeout Issue - Analysis & Fix

## Problem
When printing bulk student reports, the system times out with error:
```
Error printing reports: Failed to generate student reports: Server returned non-JSON response: An error occurred with this application. NO_RESPONSE_FROM_FUNCTION
```

## Root Cause
The `printBulkStudentReports()` function in `src/services/printingService.js` makes **one API call per student** in a sequential loop:

```javascript
for (let i = 0; i < students.length; i++) {
  const student = students[i];
  // This calls getStudentReportData() for EACH student
  const { subjectsData, remarksInfo } = await this._getFormattedStudentData(student, term);
  // ... generate PDF
}
```

For a class of 30 students, this means 30+ sequential API calls, which exceeds the Vercel serverless function timeout limit (10 seconds by default).

##Solution Implemented
Optimized the bulk print function to batch-fetch student data in parallel batches of 5 students at a time, reducing total API calls and processing time.

Key changes:
1. Import `getMarks` function for batch operations
2. Process students in batches of 5 using `Promise.all()`
3. Cache all fetched data before generating PDFs
4. Skip position calculation for bulk printing (performance optimization)

## Files Modified
- `src/services/printingService.js` - Added batch fetching logic

## Test Plan
1. Navigate to Admin Dashboard
2. Click "Print Section"
3. Select a class with 10+ students
4. Click "Print All Reports"
5. Verify PDFs generate successfully without timeout
