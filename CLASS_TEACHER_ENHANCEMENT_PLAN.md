re class teachers, # Class Teacher Dashboard Enhancement Plan

## Current Situation

The Class Teacher dashboard only allows:

- Enter remarks for students
- Record attendance

## The Problem

Class teachers teach **multiple subjects** to their class but can't enter scores for those subjects.

Example: KG1 teacher teaches all KG subjects (Literacy, Numeracy, Our World and Our People, etc.) but has no way to enter scores.

## Proposed Solution

### Enhanced Class Teacher Dashboard Features:

1. **Subject Selection Dropdown**

   - Shows all subjects assigned to the teacher
   - Teacher selects which subject to enter scores for

2. **Score Entry Interface** (per subject)

   - Test 1, Test 2, Test 3, Test 4 (Class Work - 60%)
   - Exam (40%)
   - Auto-calculate total
   - Save scores per subject

3. **Class Management** (existing)

   - Remarks for each student
   - Attendance tracking

4. **Quick Subject Switcher**
   - Tabs or dropdown to quickly switch between subjects
   - Shows which subjects have scores entered vs pending

## Implementation Steps

1. ✅ Add subject dropdown to Class Teacher page
2. ✅ Integrate score entry form (reuse from SubjectTeacherPage)
3. ✅ Show student list with score fields per selected subject
4. ✅ Keep existing remarks & attendance section
5. ✅ Add analytics per subject
6. ✅ Add "Save All" button per subject

## Benefits

✅ Class teachers can manage everything for their class in one place
✅ Enter scores for all subjects they teach
✅ No need to switch to Subject Teacher page
✅ More efficient workflow
✅ Consolidated view of their class

## User Flow

```
Class Teacher logs in
    ↓
Sees their assigned class (auto-selected)
    ↓
Selects Subject: "Mathematics" (dropdown)
    ↓
Sees all students with score entry fields
    ↓
Enters scores (Test 1-4, Exam)
    ↓
Clicks "Save Scores for Mathematics"
    ↓
Switches to next subject: "English Language"
    ↓
Repeat...
    ↓
Also can enter Remarks & Attendance
```
