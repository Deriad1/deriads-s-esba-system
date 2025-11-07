# Class Teacher Dashboard Enhancement - Implementation Status

## ✅ What Has Been Implemented

### 1. **Added Score Entry Functionality**
- ✅ Import `updateStudentScores` from API
- ✅ Added state variables:
  - `selectedSubject` - for choosing which subject to enter scores for
  - `activeTab` - for switching between "scores" and "remarks" views
  - `marks` - stores score data (test1-4, exam) for each student
  - `savedStudents` - tracks which students have saved scores

### 2. **Added Score Handling Functions**
- ✅ `handleMarkChange()` - handles individual score input changes
- ✅ `calculateTotal()` - auto-calculates total score (60% classwork + 40% exam)
- ✅ `saveStudentScores()` - saves scores for individual students per subject

### 3. **Enhanced UI**
- ✅ Updated header description: "Enter scores for subjects you teach and manage your class"
- ✅ Added subject count badge showing number of subjects assigned
- ✅ Added Subject dropdown (disabled until class is selected)
- ✅ Added Tabs to switch between:
  - 📊 Enter Scores (for selected subject)
  - 📝 Remarks & Attendance

## 🚧 What Still Needs to Be Done

### 1. **Score Entry Table UI**
Need to add the score entry table that shows when "Enter Scores" tab is active:
- Table with columns: Student Name, Test 1-4 (each /10), Exam (/40), Total (/100), Save button
- Only shows when both class AND subject are selected
- Replace the existing remarks table when on "scores" tab

### 2. **Conditional Rendering Logic**
- Show score entry table when `activeTab === "scores"` AND `selectedSubject` is selected
- Show remarks/attendance table when `activeTab === "remarks"`
- Show helper message when class selected but no subject selected in scores tab

### 3. **Complete Integration**
The file has been partially updated. The next step is to:
1. Find the remarks table section (around line 580-610)
2. Wrap it in a conditional: `{activeTab === "remarks" && ...}`
3. Add score entry table section: `{activeTab === "scores" && selectedSubject && ...}`

## 📝 Code Snippets Needed

### Score Entry Table (to be added after line 500):

```jsx
{/* Score Entry Table - shown when activeTab === "scores" */}
{activeTab === "scores" && (
  <>
    {!selectedSubject ? (
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
        <p className="text-yellow-800">
          ⚠️ Please select a subject above to enter scores for your students.
        </p>
      </div>
    ) : (
      <div className="overflow-x-auto">
        <h3 className="text-lg font-semibold mb-4">
          Enter Scores for {selectedSubject}
        </h3>
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="border border-gray-300 p-3 text-left">Student Name</th>
              <th className="border border-gray-300 p-3">Test 1<br/>/10</th>
              <th className="border border-gray-300 p-3">Test 2<br/>/10</th>
              <th className="border border-gray-300 p-3">Test 3<br/>/10</th>
              <th className="border border-gray-300 p-3">Test 4<br/>/10</th>
              <th className="border border-gray-300 p-3">Exam<br/>/40</th>
              <th className="border border-gray-300 p-3">Total<br/>/100</th>
              <th className="border border-gray-300 p-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredLearners.map(learner => {
              const studentId = learner.idNumber || learner.LearnerID;
              const studentMarks = marks[studentId] || {};
              const isSaved = savedStudents.has(studentId);

              return (
                <tr key={studentId} className={isSaved ? "bg-green-50" : "hover:bg-gray-50"}>
                  <td className="border border-gray-300 p-3 font-medium">
                    {learner.firstName} {learner.lastName}
                    {isSaved && <span className="ml-2 text-green-600 text-xs">✓ Saved</span>}
                  </td>

                  {["test1", "test2", "test3", "test4"].map(test => (
                    <td key={test} className="border border-gray-300 p-1">
                      <input
                        type="text"
                        value={studentMarks[test] || ""}
                        onChange={(e) => handleMarkChange(studentId, test, e.target.value)}
                        className="w-full p-2 border rounded text-center"
                        placeholder="0"
                        maxLength="4"
                      />
                    </td>
                  ))}

                  <td className="border border-gray-300 p-1">
                    <input
                      type="text"
                      value={studentMarks.exam || ""}
                      onChange={(e) => handleMarkChange(studentId, "exam", e.target.value)}
                      className="w-full p-2 border rounded text-center"
                      placeholder="0"
                      maxLength="4"
                    />
                  </td>

                  <td className="border border-gray-300 p-3 text-center font-bold">
                    {calculateTotal(studentId)}
                  </td>

                  <td className="border border-gray-300 p-1">
                    <button
                      onClick={() => saveStudentScores(studentId)}
                      disabled={saving}
                      className={`w-full px-3 py-2 rounded text-white text-sm ${
                        isSaved
                          ? "bg-green-600 hover:bg-green-700"
                          : "bg-blue-600 hover:bg-blue-700"
                      } disabled:bg-gray-400`}
                    >
                      {saving ? "..." : isSaved ? "Update" : "Save"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    )}
  </>
)}
```

### Wrap Existing Remarks Table:

Find the existing remarks table (starts around line 582) and wrap it:

```jsx
{/* Remarks and Attendance - shown when activeTab === "remarks" */}
{activeTab === "remarks" && (
  <div className="overflow-x-auto">
    <table className="w-full border-collapse border border-gray-300 text-sm">
      {/* existing table content */}
    </table>
  </div>
)}
```

## 🎯 Benefits of This Enhancement

✅ **Single Dashboard** - Class teachers don't need to switch pages
✅ **Multi-Subject Support** - Can enter scores for all subjects they teach
✅ **Organized Workflow** - Clear tabs separate score entry from class management
✅ **Subject Switching** - Easy dropdown to switch between subjects
✅ **Individual Save** - Save scores per student per subject
✅ **Visual Feedback** - Shows which students have saved scores

## 🚀 Next Steps

1. Complete the UI implementation (add score entry table)
2. Test with a class teacher account that has:
   - Assigned class (e.g., KG1)
   - Multiple subjects (e.g., Literacy, Numeracy, Creative Arts)
3. Verify score saving works correctly
4. Ensure remarks/attendance still works on the other tab

## 📊 User Flow

```
Class Teacher logs in → Class Teacher Dashboard
    ↓
Select Class (e.g., KG1)
    ↓
Select Subject (e.g., Literacy)
    ↓
Click "Enter Scores" tab
    ↓
See all KG1 students with score entry fields
    ↓
Enter Test 1-4 and Exam scores
    ↓
Click "Save" for each student
    ↓
Switch to another subject (e.g., Numeracy)
    ↓
Repeat...
    ↓
Switch to "Remarks & Attendance" tab
    ↓
Enter remarks and attendance
    ↓
Done!
```
