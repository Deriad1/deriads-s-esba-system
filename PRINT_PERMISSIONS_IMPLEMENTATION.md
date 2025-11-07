# Print Permissions Implementation - Teacher Roles

## Requirements

### 1. Form Master Page
**Should have ALL print options** (same as Admin/Head Teacher):
- Print All Student Reports
- Print Selected Students Reports
- Print Complete Class Broadsheet (all subjects)
- Print Subject-Specific Broadsheet (dropdown selection)

### 2. Subject Teacher Page
**Should only print THEIR assigned subject broadsheet**:
- Print button should only work for subjects they teach
- No access to student reports or complete broadsheet
- Restricted to subject broadsheet for their subject only

## Implementation Status

### ✅ COMPLETED

#### Form Master Page Backend Functions
1. **Added imports** (Line 4):
   - `getClassSubjects` - Get subjects for a class
   - `getStudentsByClass` - Get students in a class

2. **Added Print Section States** (Lines 54-60):
   ```javascript
   const [printClass, setPrintClass] = useState("");
   const [printClassStudents, setPrintClassStudents] = useState([]);
   const [printClassSubjects, setPrintClassSubjects] = useState([]);
   const [selectedPrintStudents, setSelectedPrintStudents] = useState([]);
   const [selectedPrintSubject, setSelectedPrintSubject] = useState("");
   const [printing, setPrinting] = useState(false);
   ```

3. **Added Print Section Functions** (Lines 791-975):
   - `handlePrintClassChange()` - Fetch students & subjects when class selected
   - `handlePrintStudentSelection()` - Toggle student selection
   - `handleSelectAllPrintStudents()` - Select/deselect all students
   - `printAllClassReports()` - Print reports for all students in class
   - `printSelectedReports()` - Print reports for selected students only
   - `printCompleteBroadsheet()` - Print complete class broadsheet
   - `printSubjectBroadsheetFromPrintSection()` - Print subject broadsheet

### ⏳ PENDING

#### Form Master Page UI Components

**Need to add a third tab/view button**:
```jsx
<button
  onClick={() => setMainView('printSection')}
  className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all ${
    mainView === 'printSection'
      ? 'bg-purple-600 text-white shadow-lg'
      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
  }`}
>
  <span className="text-xl mr-2">🖨️</span>
  Print Section
</button>
```

**Need to add Print Section View** (after line 1542):
```jsx
{/* Print Section View */}
{mainView === 'printSection' && (
  <div className="space-y-6">
    {/* Class Selection */}
    <div className="glass-ultra rounded-lg p-6">
      <h2 className="text-lg font-semibold mb-4">Print Reports & Broadsheets</h2>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Class</label>
        <select
          value={printClass}
          onChange={(e) => handlePrintClassChange(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-md"
        >
          <option value="">Choose Class</option>
          {getUserClasses().map(cls => (
            <option key={cls} value={cls}>{cls}</option>
          ))}
        </select>
      </div>

      {printClass && (
        <>
          {/* Print Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <button
              onClick={printAllClassReports}
              disabled={printing || printClassStudents.length === 0}
              className="glass-button-primary text-white px-4 py-3 rounded-md"
            >
              {printing ? "Printing..." : `📄 Print All Reports (${printClassStudents.length})`}
            </button>

            <button
              onClick={printCompleteBroadsheet}
              disabled={printing}
              className="glass-button-primary text-white px-4 py-3 rounded-md"
            >
              📊 Print Complete Broadsheet
            </button>

            <button
              onClick={() => setShowSubjectDropdown(!showSubjectDropdown)}
              disabled={printing}
              className="glass-button-success text-white px-4 py-3 rounded-md"
            >
              📋 Print Subject Broadsheet
            </button>
          </div>

          {/* Subject Dropdown */}
          {showSubjectDropdown && (
            <div className="glass rounded-lg p-4 mb-6">
              <h4 className="text-md font-bold mb-2">Select Subject</h4>
              <div className="max-h-48 overflow-y-auto glass rounded p-2">
                {printClassSubjects.length > 0 ? (
                  printClassSubjects.map((subject) => (
                    <button
                      key={subject}
                      onClick={() => {
                        printSubjectBroadsheetFromPrintSection(subject);
                        setShowSubjectDropdown(false);
                      }}
                      disabled={printing}
                      className="w-full text-left px-3 py-2 mb-1 glass hover:glass-button-primary hover:text-white rounded"
                    >
                      {subject}
                    </button>
                  ))
                ) : (
                  <p className="text-gray-600 text-sm">No subjects with marks found</p>
                )}
              </div>
            </div>
          )}

          {/* Student Selection */}
          <div className="glass rounded-lg p-4">
            <h3 className="text-lg font-bold mb-3">Select Individual Students</h3>
            <div className="flex items-center mb-2">
              <input
                type="checkbox"
                checked={selectedPrintStudents.length === printClassStudents.length}
                onChange={handleSelectAllPrintStudents}
                className="mr-2"
              />
              <label className="font-medium">Select All</label>
            </div>

            <div className="max-h-40 overflow-y-auto glass rounded p-2 mb-4">
              {printClassStudents.map((student) => (
                <div key={student.id} className="flex items-center mb-1">
                  <input
                    type="checkbox"
                    checked={selectedPrintStudents.includes(student.id)}
                    onChange={() => handlePrintStudentSelection(student.id)}
                    className="mr-2"
                  />
                  <label>
                    {student.first_name} {student.last_name} ({student.id_number})
                  </label>
                </div>
              ))}
            </div>

            <button
              onClick={printSelectedReports}
              disabled={printing || selectedPrintStudents.length === 0}
              className="glass-button-success w-full text-white px-4 py-2 rounded-md"
            >
              {printing ? "Printing..." : `Print Selected (${selectedPrintStudents.length})`}
            </button>
          </div>
        </>
      )}
    </div>
  </div>
)}
```

### Subject Teacher Page Restrictions

**Current Status**: Subject Teacher can print ANY subject broadsheet

**Required Change** (Line 447-474 in SubjectTeacherPage.jsx):

```javascript
// Print broadsheet - RESTRICTED TO ASSIGNED SUBJECTS ONLY
const printBroadsheet = async () => {
  if (!selectedClass || !selectedSubject) {
    showNotification({ message: "Please select a class and subject first.", type: 'warning' });
    return;
  }

  // ✅ CHECK: Verify teacher is assigned to this subject
  if (!getUserSubjects().includes(selectedSubject)) {
    showNotification({
      message: "You can only print broadsheets for subjects you teach.",
      type: 'error'
    });
    return;
  }

  try {
    const schoolInfo = printingService.getSchoolInfo();
    const result = await printingService.printSubjectBroadsheet(
      selectedClass,
      selectedSubject,
      schoolInfo
    );

    if (result.success) {
      showNotification({ message: result.message, type: 'success' });
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error("Error printing broadsheet:", error);
    showNotification({ message: "Error printing broadsheet: " + error.message, type: 'error' });
  }
};
```

## Next Steps

### 1. Complete Form Master Page UI
- [ ] Add "Print Section" button to main view switcher (line ~1356)
- [ ] Add `showSubjectDropdown` state
- [ ] Add Print Section View component (after line 1542)
- [ ] Test all print functions with form class

### 2. Restrict Subject Teacher
- [ ] Update `printBroadsheet()` function to check teacher permissions
- [ ] Test that subject teachers can ONLY print their assigned subjects
- [ ] Verify error message displays correctly for unauthorized subjects

### 3. Testing Checklist
- [ ] Form Master can print all student reports for form class
- [ ] Form Master can print selected students
- [ ] Form Master can print complete broadsheet
- [ ] Form Master can print subject-specific broadsheet
- [ ] Subject Teacher can print broadsheet for assigned subject
- [ ] Subject Teacher CANNOT print broadsheet for non-assigned subject
- [ ] Subject Teacher has no access to student reports or complete broadsheet

## Files Modified

1. **src/pages/FormMasterPage.jsx**
   - Lines 1-4: Added imports for `getClassSubjects`, `getStudentsByClass`
   - Lines 54-60: Added print section states
   - Lines 791-975: Added print section handler functions
   - **PENDING**: Add UI components for Print Section view

2. **src/pages/SubjectTeacherPage.jsx**
   - **PENDING**: Lines 447-474: Add permission check to `printBroadsheet()`

## Summary

**Form Master** now has all the backend logic for comprehensive printing options. Just need to add the UI components to access these functions.

**Subject Teacher** needs a simple permission check added to restrict printing to assigned subjects only.

Total implementation time: ~30 minutes remaining
- Form Master UI: 15 minutes
- Subject Teacher restriction: 5 minutes
- Testing: 10 minutes
