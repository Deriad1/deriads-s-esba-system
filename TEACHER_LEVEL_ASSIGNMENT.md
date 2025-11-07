# Teacher Level Assignment & Form Master System

## Overview

This implementation adds the ability to assign teachers to specific educational levels (KG, Primary, or JHS) and provides a specialized Form Master assignment workflow for JHS teachers.

---

## New Features

### 1. **Teaching Level Assignment**

Teachers can now be assigned to one of three educational levels:
- **🎨 Kindergarten (KG)**: For teachers working with KG1 and KG2
- **📚 Primary School**: For teachers working with BS1-BS6
- **🎓 Junior High School (JHS)**: For teachers working with BS7-BS9

#### Database Changes

Added two new columns to the `teachers` table:
- `teaching_level` (VARCHAR(20)): Stores 'KG', 'PRIMARY', or 'JHS'
- `form_class` (VARCHAR(50)): Stores the assigned form class for Form Masters

#### Migration Script

Run `npm run db:add-teacher-level` to:
- Add the new columns
- Automatically assign teaching levels based on existing class assignments
- Display distribution of teachers by level

---

### 2. **Form Master Assignment Modal**

When a teacher is assigned as a Form Master for JHS, a specialized modal appears to configure:

#### A. Form Class Selection
- Choose which JHS class (BS7, BS8, or BS9) the teacher will manage
- Visual button selection with color-coded highlight
- Only JHS classes are shown (BS7, BS8, BS9)

#### B. Subject Selection
- Choose which subjects the Form Master will teach
- Multi-select checkboxes with "Select All" option
- Shows count of selected subjects
- All available subjects in the system are displayed

#### C. Class Selection
- Choose which JHS classes the teacher will teach in
- Multi-select with visual feedback
- "Select All" option for convenience
- Shows selected classes summary

#### D. Assignment Summary
- Displays a summary card showing:
  - Form Class assignment
  - Selected subjects
  - Teaching classes
- Provides clear overview before saving

---

## User Workflow

### Editing a Teacher

1. **Navigate to Teachers Management**
   - Click "View Teachers" on Admin Dashboard
   - Click the edit (pencil) icon for any teacher

2. **Select Teaching Level**
   - Three visual buttons appear: KG, Primary, JHS
   - Click the appropriate level for the teacher
   - Selection is highlighted with the level's color:
     - KG: Pink
     - Primary: Blue
     - JHS: Green

3. **Assign Form Master Role (JHS Only)**
   - If teaching level is JHS, Form Master becomes available
   - Check the "Form Master" checkbox under Additional Responsibilities
   - An info box appears explaining the assignment process

4. **Form Master Assignment Modal (JHS Only)**
   - When Form Master is selected for a JHS teacher, the modal opens automatically
   - **Step 1**: Select the form class (BS7, BS8, or BS9)
   - **Step 2**: Select subjects to teach (checkboxes with Select All)
   - **Step 3**: Select which classes to teach in (BS7, BS8, BS9)
   - **Step 4**: Review the summary
   - Click "Save Assignment" to confirm

5. **Complete Teacher Update**
   - The Form Master details are added to the teacher's profile
   - Click "Update Teacher" to save all changes

---

## Technical Implementation

### Components

#### 1. **FormMasterAssignmentModal.jsx**

**Location**: `src/components/FormMasterAssignmentModal.jsx`

**Props**:
```javascript
{
  isOpen: boolean,
  onClose: function,
  teacher: object,
  allSubjects: array,
  onSave: function
}
```

**Features**:
- Visual class selection with color coding
- Subject multi-select with checkboxes
- Class multi-select for JHS classes
- Assignment summary display
- Form validation (requires form class, subjects, and classes)
- Save callback with structured data

**Data Structure Returned**:
```javascript
{
  teacherId: number,
  formClass: string,  // e.g., 'BS7'
  subjects: array,    // e.g., ['Mathematics', 'Science']
  classes: array,     // e.g., ['BS7', 'BS8']
  teachingLevel: 'JHS'
}
```

#### 2. **EditTeacherModal Updates**

**New State**:
- `teachingLevel`: Tracks selected teaching level
- `showFormMasterModal`: Controls Form Master modal visibility

**New UI Elements**:
- Teaching Level selector (3 visual buttons)
- Info box for JHS Form Master
- Conditional Form Master modal trigger

**Logic**:
- Opens Form Master modal when Form Master is selected AND teaching level is JHS
- Updates form data with Form Master assignment details
- Includes teaching_level and form_class in teacher update

### API Updates

#### updateTeacher Function

**File**: `src/api.js`

**Changes**:
Added two new fields to the UPDATE query:
```javascript
teaching_level = ${teacherData.teachingLevel || 'PRIMARY'}
form_class = ${teacherData.form_class || null}
```

**Usage**:
```javascript
await updateTeacher({
  id: teacherId,
  firstName: 'John',
  lastName: 'Doe',
  // ... other fields
  teachingLevel: 'JHS',
  form_class: 'BS7',
  subjects: ['Mathematics', 'Science'],
  classes: ['BS7', 'BS8']
});
```

---

## Benefits

### 1. **Better Organization**
- Teachers are clearly categorized by the level they teach
- Easy to identify which teachers work at which educational stage
- Supports level-specific management and reporting

### 2. **Streamlined Form Master Assignment**
- Dedicated workflow for assigning Form Masters
- Ensures all necessary information is collected
- Clear visual interface for complex assignments

### 3. **Enhanced Data Integrity**
- Form Masters are properly linked to their form class
- Subject and class assignments are consistent
- Level-based validation ensures appropriate assignments

### 4. **Improved User Experience**
- Visual, intuitive interface for level selection
- Step-by-step Form Master assignment
- Clear summary before confirming
- Helpful info boxes guide the user

---

## Usage Examples

### Example 1: Assigning a Primary School Teacher

```
1. Edit teacher profile
2. Select "📚 Primary" teaching level
3. Select classes: BS3, BS4
4. Select subjects: English, Mathematics, Science
5. Save
```

### Example 2: Assigning a JHS Form Master

```
1. Edit teacher profile
2. Select "🎓 JHS" teaching level
3. Check "Form Master" under Additional Responsibilities
4. Form Master Modal opens:
   - Select Form Class: BS8
   - Select Subjects: Mathematics, Science, English
   - Select Teaching Classes: BS7, BS8, BS9
   - Review summary
   - Save Assignment
5. Update Teacher
```

### Example 3: Removing Form Master Status

```
1. Edit teacher profile
2. Uncheck "Form Master" under Additional Responsibilities
3. Update Teacher
(Form class assignment is cleared automatically)
```

---

## Database Schema

### Teachers Table (Updated Columns)

```sql
CREATE TABLE teachers (
  -- Existing columns...
  teaching_level VARCHAR(20) DEFAULT 'PRIMARY',
  form_class VARCHAR(50),
  -- Existing columns...
);
```

**teaching_level**:
- Values: 'KG', 'PRIMARY', 'JHS'
- Default: 'PRIMARY'
- Indicates the primary educational level the teacher works with

**form_class**:
- Values: 'BS7', 'BS8', 'BS9', or NULL
- Only populated for Form Masters
- Indicates which JHS class they manage

---

## Testing Checklist

### Basic Testing
- [ ] Select KG level for a teacher
- [ ] Select Primary level for a teacher
- [ ] Select JHS level for a teacher
- [ ] Verify level is saved correctly
- [ ] Verify level persists after refresh

### Form Master Assignment
- [ ] Select JHS level for a teacher
- [ ] Check Form Master responsibility
- [ ] Verify Form Master modal opens
- [ ] Select a form class (BS7/BS8/BS9)
- [ ] Select multiple subjects
- [ ] Select multiple teaching classes
- [ ] Verify summary shows correct information
- [ ] Save assignment
- [ ] Verify data is saved to database
- [ ] Edit the same teacher again
- [ ] Verify Form Master details are loaded correctly

### Edge Cases
- [ ] Try selecting Form Master for non-JHS teacher
- [ ] Change teaching level after assigning Form Master
- [ ] Uncheck Form Master and verify form_class is cleared
- [ ] Save without selecting form class (should show error)
- [ ] Save without selecting subjects (should show error)
- [ ] Save without selecting classes (should show error)

### Data Validation
- [ ] Check teaching_level is saved correctly in database
- [ ] Check form_class is saved correctly for Form Masters
- [ ] Check form_class is NULL for non-Form Masters
- [ ] Verify subjects array includes selected subjects
- [ ] Verify classes array includes selected classes

---

## Future Enhancements

### Potential Improvements

1. **Level-Based Subject Filtering**
   - Show only relevant subjects for each level
   - E.g., KG might have different subjects than JHS

2. **Multiple Form Masters**
   - Support co-Form Masters for large classes
   - Track Form Master history

3. **Level Transition**
   - Track when teachers move between levels
   - Maintain historical assignments

4. **Reporting by Level**
   - Generate level-specific reports
   - Teacher distribution analysis
   - Level performance metrics

5. **Class Teacher (Primary) Assignment**
   - Similar modal for Primary class teachers
   - Assign to specific class (BS1-BS6)
   - Auto-assign all subjects for that class

6. **KG Specialization**
   - Different interface for KG teachers
   - Age-appropriate subjects and activities
   - KG-specific assessments

---

## Troubleshooting

### Common Issues

**Issue**: Form Master modal doesn't appear
- **Solution**: Ensure teaching level is set to 'JHS' before checking Form Master

**Issue**: Form class not saving
- **Solution**: Check that form_class column exists in database (run migration script)

**Issue**: Subjects not populating in modal
- **Solution**: Verify allSubjects prop is being passed to FormMasterAssignmentModal

**Issue**: Teaching level resets to PRIMARY
- **Solution**: Ensure teachingLevel is included in the updateTeacher API call

---

## Summary

The Teacher Level Assignment and Form Master system provides:
- ✅ Clear categorization of teachers by educational level
- ✅ Specialized workflow for JHS Form Master assignments
- ✅ Visual, intuitive interface for complex assignments
- ✅ Proper data structure for level-based management
- ✅ Foundation for level-specific features and reporting

This enhancement aligns the system with Ghana's educational structure and provides a solid foundation for level-specific management and analytics.

---

## Quick Start

1. **Run Migration**:
   ```bash
   npm run db:add-teacher-level
   ```

2. **Test the Feature**:
   - Login as admin
   - Go to "View Teachers"
   - Click edit on any teacher
   - Select "JHS" as teaching level
   - Check "Form Master"
   - Complete the Form Master assignment

3. **Verify**:
   - Check database to see teaching_level and form_class populated
   - Edit the teacher again to see saved values
   - Verify Form Master details are retained

---

**Last Updated**: October 2, 2025
**Version**: 1.0
**Status**: ✅ Implemented and Ready for Testing
