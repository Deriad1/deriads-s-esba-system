# Naming Standardization Plan

This document outlines the comprehensive plan to resolve all naming inconsistencies in the eSBA system.

## Database Schema Standards

Based on the schema check, here are the standardized column names:

### Students Table
- `id` (integer, primary key)
- `id_number` (string, e.g., "eSBA001") - **STANDARD**
- `first_name` (string)
- `last_name` (string)
- `class_name` (string)
- `gender` (string)
- `term` (string) - **MUST USE: "First Term", "Second Term", "Third Term"**
- `academic_year` (string)
- `created_at` (timestamp)
- `updated_at` (timestamp)

### Marks Table
- `id` (integer, primary key)
- `student_id` (integer, foreign key to students.id) - **STANDARD**
- `class_name` (string)
- `subject` (string)
- `term` (string) - **MUST USE: "First Term", "Second Term", "Third Term"**
- `academic_year` (string)
- `test1` (numeric)
- `test2` (numeric)
- `test3` (numeric)
- `test4` (numeric)
- `exam` (numeric) - **STANDARD for raw exam score**
- `class_score` (numeric) - **Calculated: (test1+test2+test3+test4)/60 * 50**
- `exam_score` (numeric) - **Calculated: exam/100 * 50**
- `total` (numeric) - **STANDARD: class_score + exam_score**
- `remark` (text) - **STANDARD (singular)**
- `position` (integer)
- `created_at` (timestamp)
- `updated_at` (timestamp)

**DEPRECATED COLUMNS** (exist but should NOT be used):
- `total_score` - Use `total` instead
- `remarks` - Use `remark` instead (singular)
- `exams_score` - Use `exam_score` instead
- `grade` - Not actively used

## Frontend-Backend Mapping

### API Response Format (camelCase)
When returning data to frontend:
```javascript
{
  id: number,
  idNumber: string,        // from id_number
  firstName: string,       // from first_name
  lastName: string,        // from last_name
  className: string,       // from class_name
  academicYear: string,    // from academic_year
  createdAt: timestamp,    // from created_at
  updatedAt: timestamp     // from updated_at
}
```

### API Request Format (camelCase)
When receiving data from frontend:
```javascript
{
  studentId: string|number,  // Can be id_number ("eSBA001") or numeric id
  className: string,
  academicYear: string,
  // ... other camelCase fields
}
```

### Database Format (snake_case)
All database columns use snake_case:
```sql
id_number, first_name, last_name, class_name, academic_year,
created_at, updated_at, student_id, exam_score, total_score, etc.
```

## Student ID Handling

### Three Ways to Identify Students

1. **Numeric ID** (database primary key)
   - Example: `123`, `456`
   - Used internally in database relationships
   - Type: integer

2. **ID Number** (human-readable identifier)
   - Example: `"eSBA001"`, `"eSBA020"`
   - Used for display and user input
   - Type: string
   - Database column: `id_number`
   - Frontend field: `idNumber`

3. **Mixed Usage in APIs**
   - APIs should accept BOTH formats
   - Use `isNumericStudentId()` helper to detect which format
   - Always look up and use the numeric `id` for database operations

### Helper Functions Available

Located in `src/utils/studentIdHelpers.js`:
- `isNumericStudentId(value)` - Check if value is numeric ID
- `isIdNumberFormat(value)` - Check if value is ID number format
- `normalizeStudentId(studentId)` - Determine type and normalize
- `mapStudentFromDb(dbStudent)` - Convert snake_case to camelCase
- `mapStudentToDb(student)` - Convert camelCase to snake_case
- `getStudentDisplayName(student)` - Get full name
- `getStudentIdForDisplay(student)` - Get ID for display

## Implementation Checklist

### ✅ COMPLETED
- [x] Created `src/constants/terms.js` with standardized term constants
- [x] Created `src/utils/studentIdHelpers.js` with ID conversion helpers
- [x] Created `src/utils/apiFieldMapper.js` with field mapping utilities
- [x] Fixed term naming in database (all "Term 1/2/3" → "First Term/Second Term/Third Term")
- [x] Updated SubjectTeacherPage.jsx to use DEFAULT_TERM constant
- [x] Verified database schema and column usage

### 🔄 IN PROGRESS
- [ ] Update FormMasterPage.jsx to use DEFAULT_TERM and useGlobalSettings
- [ ] Update ClassTeacherPage.jsx to use DEFAULT_TERM and useGlobalSettings
- [ ] Update SchoolSetupPage.jsx term references

### ⏳ PENDING - API Updates
- [ ] Update `api/students/index.js` to use `mapStudentFromDb` helper
- [ ] Update `api/marks/index.js` to use `isNumericStudentId` helper
- [ ] Update `api/broadsheet/index.js` to use standardized field names
- [ ] Ensure all APIs return `id_number` as `idNumber` in responses
- [ ] Ensure all APIs handle both numeric ID and id_number in requests

### ⏳ PENDING - Database Cleanup
- [ ] Drop unused columns: `total_score`, `remarks`, `exams_score`, `grade`
- [ ] Add NOT NULL constraint to `remark` if needed
- [ ] Ensure all code uses `total` not `total_score`
- [ ] Ensure all code uses `remark` not `remarks`

### ⏳ PENDING - Component Updates
- [ ] Update all components to use helper functions for student ID display
- [ ] Replace manual field mapping with `mapStudentFromDb` helper
- [ ] Update marks display to use standardized field names

## Files That Need Updates

### High Priority
1. **src/pages/FormMasterPage.jsx** (lines 1218, 1401, 1446)
   - Replace `'Term 3'` with `settings.term || DEFAULT_TERM`
   - Add imports for `DEFAULT_TERM` and `useGlobalSettings`

2. **src/pages/ClassTeacherPage.jsx** (multiple locations)
   - Replace hardcoded term values with `settings.term || DEFAULT_TERM`
   - Add imports for `DEFAULT_TERM` and `useGlobalSettings`

3. **src/pages/SchoolSetupPage.jsx**
   - Update term selection to use TERMS constants
   - Ensure consistency with global settings

4. **api/students/index.js**
   - Import and use `mapStudentFromDb` helper
   - Simplify the mapping code at lines 87-98

5. **api/marks/index.js**
   - Import and use `isNumericStudentId` helper
   - Replace `isNaN()` check with helper function

6. **api/broadsheet/index.js**
   - Verify uses standardized field names
   - Update position calculation if needed

### Medium Priority
7. **src/services/printingService.js**
   - Verify uses `total` not `total_score`
   - Verify uses `remark` not `remarks`

8. **src/utils/enhancedPdfGenerator.js**
   - Verify field name consistency

### Low Priority
9. All components that display student data
   - Use `getStudentDisplayName()` helper
   - Use `getStudentIdForDisplay()` helper

## Testing Checklist

After all updates are complete:

### API Testing
- [ ] Test `/api/students` returns camelCase fields
- [ ] Test `/api/marks` accepts both numeric ID and id_number
- [ ] Test `/api/marks` returns consistent field names
- [ ] Test `/api/broadsheet` calculates positions correctly

### Frontend Testing
- [ ] Test SubjectTeacherPage saves marks correctly
- [ ] Test FormMasterPage saves marks correctly
- [ ] Test ClassTeacherPage displays data correctly
- [ ] Test broadsheet printing shows correct data
- [ ] Test position calculation is accurate
- [ ] Test remarks display correctly

### Term Consistency Testing
- [ ] Verify all new marks save with "First/Second/Third Term" format
- [ ] Verify no hardcoded "Term 1/2/3" values remain
- [ ] Test switching terms in GlobalSettings works correctly

## Migration Scripts

### Already Created
- `fix-term-values.js` - Standardize term values (✅ COMPLETED)
- `check-schema.js` - Verify database schema
- `check-column-usage.js` - Check which columns have data

### To Be Created
- `cleanup-unused-columns.sql` - Drop deprecated columns
- `verify-naming-consistency.js` - Test all naming is consistent

## Notes

- **DO NOT** use `isNaN()` for student ID detection - use `isNumericStudentId()` helper
- **ALWAYS** use constants from `src/constants/terms.js` for term values
- **NEVER** hardcode term values like 'Term 1', 'Term 2', 'Term 3'
- **PREFER** `remark` (singular) over `remarks` (plural)
- **PREFER** `total` over `total_score`
- **ALWAYS** map snake_case to camelCase in API responses
- **ALWAYS** map camelCase to snake_case in API requests

## Benefits After Completion

1. **Consistency** - Single source of truth for field names
2. **Maintainability** - Easy to update field mappings in one place
3. **Bug Prevention** - No more term naming causing position calculation errors
4. **Code Quality** - Helper functions reduce code duplication
5. **Developer Experience** - Clear conventions make development easier
6. **Type Safety** - Standardized types make TypeScript migration easier (future)
