# Fix: Broadsheet Not Using Admin-Selected Term

## Problem

When printing subject broadsheets, the PDF header shows the term from global settings (e.g., "Term 1"), but the system doesn't filter the data by this term. This causes:

1. PDF header shows "Term 1" (from global settings)
2. Data might be from "Third Term" (whatever exists in database)
3. Mismatch between what admin selected and what's printed

## Root Cause

In `src/services/printingService.js`:

```javascript
// Line 481 - printSubjectBroadsheet does NOT accept term parameter
async printSubjectBroadsheet(className, subject, schoolInfo, teacherName = '') {
  // Line 484 - Does NOT pass term to getClassBroadsheet
  const broadsheetData = await getClassBroadsheet(className);
  // ...
}
```

The function:
- Doesn't accept `term` as a parameter
- Doesn't pass `term` to `getClassBroadsheet()`
- Uses `schoolInfo.term` for the PDF header, but doesn't filter data by it

## Solution

### Step 1: Update `printSubjectBroadsheet` function signature

**File:** `src/services/printingService.js`

Change line 481 from:
```javascript
async printSubjectBroadsheet(className, subject, schoolInfo, teacherName = '') {
```

To:
```javascript
async printSubjectBroadsheet(className, subject, schoolInfo, teacherName = '', term = null) {
```

Change line 484 from:
```javascript
const broadsheetData = await getClassBroadsheet(className);
```

To:
```javascript
// Use term from parameter, fallback to schoolInfo.term
const termToUse = term || schoolInfo.term;
const broadsheetData = await getClassBroadsheet(className, termToUse);
```

### Step 2: Update all calls to pass term

Update these 6 files to pass `settings.term`:

**1. src/pages/SubjectTeacherPage.jsx** (line 474)

Add before the call:
```javascript
import { useGlobalSettings } from '../context/GlobalSettingsContext';
// ...
const { settings } = useGlobalSettings();
```

Change line 474-478 from:
```javascript
const result = await printingService.printSubjectBroadsheet(
  selectedClass,
  selectedSubject,
  schoolInfo
);
```

To:
```javascript
const result = await printingService.printSubjectBroadsheet(
  selectedClass,
  selectedSubject,
  schoolInfo,
  '', // teacherName
  settings.term // term from global settings
);
```

**2. src/pages/FormMasterPage.jsx** (already has useGlobalSettings)

Line 636-640 and line 968-973, change to:
```javascript
const result = await printingService.printSubjectBroadsheet(
  selectedClass, // or printClass
  subject,
  schoolInfo,
  '', // teacherName
  settings.term // term from global settings
);
```

**3. src/pages/ClassTeacherPage.jsx** (already has useGlobalSettings)

Line 814-819, change to:
```javascript
const result = await printingService.printSubjectBroadsheet(
  selectedClass,
  selectedSubject,
  schoolInfo,
  teacherName,
  settings.term // term from global settings
);
```

**4. src/pages/AdminDashboardPage.jsx**

Add before line 522:
```javascript
import { useGlobalSettings } from '../context/GlobalSettingsContext';
// ...
const { settings } = useGlobalSettings();
```

Change line 522-527 to:
```javascript
const result = await printingService.printSubjectBroadsheet(
  selectedClass,
  subject,
  schoolInfo,
  '', // teacherName
  settings.term // term from global settings
);
```

**5. src/pages/HeadTeacherPage.jsx**

Add:
```javascript
import { useGlobalSettings } from '../context/GlobalSettingsContext';
// ...
const { settings } = useGlobalSettings();
```

Change line 149-153 to:
```javascript
const result = await printingService.printSubjectBroadsheet(
  printClass,
  printSubject,
  schoolInfo,
  '', // teacherName
  settings.term // term from global settings
);
```

### Step 3: Fix GlobalSettingsContext default

**File:** `src/context/GlobalSettingsContext.jsx`

Change line 1 from:
```javascript
import { createContext, useContext, useState, useEffect } from 'react';
```

To:
```javascript
import { createContext, useContext, useState, useEffect } from 'react';
import { DEFAULT_TERM } from '../constants/terms';
```

Change line 22 from:
```javascript
term: 'Term 1',
```

To:
```javascript
term: DEFAULT_TERM, // 'Third Term' from constants
```

## Testing

After making these changes:

1. Restart the dev server: `npm run dev`
2. Go to Admin Dashboard → School Setup
3. Verify the term is set to your desired term
4. Go to Subject Teacher or Form Master page
5. Print a subject broadsheet
6. Verify:
   - PDF header shows the correct term
   - Data matches the selected term
   - Positions calculate correctly

## Files to Modify

1. ✅ `src/services/printingService.js` - Update function signature and API call
2. ✅ `src/pages/SubjectTeacherPage.jsx` - Pass term parameter
3. ✅ `src/pages/FormMasterPage.jsx` - Pass term parameter (2 locations)
4. ✅ `src/pages/ClassTeacherPage.jsx` - Pass term parameter
5. ✅ `src/pages/AdminDashboardPage.jsx` - Pass term parameter
6. ✅ `src/pages/HeadTeacherPage.jsx` - Pass term parameter
7. ✅ `src/context/GlobalSettingsContext.jsx` - Use DEFAULT_TERM constant

## Expected Outcome

After this fix:
- ✅ Broadsheet printing will use the admin-selected term
- ✅ PDF header will match the data being displayed
- ✅ Positions will calculate correctly for the selected term
- ✅ No more mismatch between settings and printed data
- ✅ System will follow admin's term selection properly
