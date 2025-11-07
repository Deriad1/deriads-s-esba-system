# Quick Reference: Naming Conventions

**Quick reference guide for developers working on the eSBA system**

---

## 🎯 Golden Rules

1. **NEVER** hardcode term values like `'Term 1'`, `'Term 2'`, `'Term 3'`
2. **ALWAYS** use constants from `src/constants/terms.js`
3. **NEVER** use `isNaN()` to check student IDs
4. **ALWAYS** use `isNumericStudentId()` helper
5. **NEVER** manually map fields between snake_case and camelCase
6. **ALWAYS** use helper functions from `src/utils/`

---

## 📋 Standard Field Names

### Database Columns (snake_case)
```javascript
// Students table
id, id_number, first_name, last_name, class_name, gender,
term, academic_year, created_at, updated_at

// Marks table
id, student_id, class_name, subject, term, academic_year,
test1, test2, test3, test4, exam, class_score, exam_score,
total, remark, position, created_at, updated_at
```

### Frontend Fields (camelCase)
```javascript
// Students
id, idNumber, firstName, lastName, className, gender,
term, academicYear, createdAt, updatedAt

// Marks
id, studentId, className, subject, term, academicYear,
test1, test2, test3, test4, exam, classScore, examScore,
total, remark, position, createdAt, updatedAt
```

---

## 🔧 Helper Functions

### Term Constants
```javascript
import { DEFAULT_TERM, TERMS } from '../constants/terms';

// Use in components
const term = settings.term || DEFAULT_TERM;

// Available constants
TERMS.FIRST  // "First Term"
TERMS.SECOND // "Second Term"
TERMS.THIRD  // "Third Term"
```

### Student ID Helpers
```javascript
import {
  isNumericStudentId,
  isIdNumberFormat,
  mapStudentFromDb,
  getStudentDisplayName
} from '../utils/studentIdHelpers';

// Check ID format
if (isNumericStudentId(id)) { /* numeric like 123 */ }
if (isIdNumberFormat(id)) { /* string like "eSBA001" */ }

// Map database record to frontend
const student = mapStudentFromDb(dbRecord);

// Get display values
const name = getStudentDisplayName(student);
```

### Field Mappers
```javascript
import {
  mapMarksFromDb,
  mapObjectToCamelCase
} from '../utils/apiFieldMapper';

// In API responses
const marks = mapMarksFromDb(dbMarks);
const data = mapObjectToCamelCase(dbData);
```

---

## 💡 Common Patterns

### Component: Using Terms
```javascript
import { useGlobalSettings } from '../context/GlobalSettingsContext';
import { DEFAULT_TERM } from '../constants/terms';

const MyComponent = () => {
  const { settings } = useGlobalSettings();

  const saveData = () => {
    const data = {
      term: settings.term || DEFAULT_TERM, // ✅ CORRECT
      // NOT: term: 'Term 3'  ❌ WRONG
    };
  };
};
```

### API: Handling Student IDs
```javascript
import { isNumericStudentId } from '../../src/utils/studentIdHelpers';

async function handleRequest(studentId) {
  let dbId = studentId;

  // ✅ CORRECT
  if (!isNumericStudentId(studentId)) {
    const result = await sql`
      SELECT id FROM students WHERE id_number = ${studentId}
    `;
    dbId = result[0].id;
  }

  // NOT: if (isNaN(studentId))  ❌ WRONG
}
```

### API: Mapping Response Data
```javascript
import { mapStudentFromDb } from '../../src/utils/studentIdHelpers';

async function getStudents() {
  const result = await sql`SELECT * FROM students`;

  // ✅ CORRECT
  const students = result.map(student => mapStudentFromDb(student));

  // NOT: Manual mapping  ❌ INEFFICIENT
  // const students = result.map(s => ({
  //   id: s.id,
  //   idNumber: s.id_number,
  //   ...
  // }));

  return students;
}
```

---

## 🚫 Deprecated - DO NOT USE

These columns exist in database but should NOT be used:
- ❌ `total_score` → Use `total` instead
- ❌ `remarks` → Use `remark` instead (singular)
- ❌ `exams_score` → Use `exam_score` instead
- ❌ `grade` → Not actively used

---

## ✅ Checklist for New Code

Before committing new code, verify:

- [ ] No hardcoded term values (`'Term 1'`, `'Term 2'`, `'Term 3'`)
- [ ] Using `DEFAULT_TERM` constant where needed
- [ ] Using `isNumericStudentId()` instead of `isNaN()`
- [ ] Using helper functions for field mapping
- [ ] Using correct column names (`total`, `remark`, `exam_score`)
- [ ] API responses return camelCase fields
- [ ] Database queries use snake_case columns

---

## 🧪 Testing

### Verify Naming Consistency
```bash
node verify-naming-consistency.js
```

### Check Database Schema
```bash
node check-schema.js
node check-column-usage.js
```

---

## 📚 Full Documentation

For complete details, see:
- [NAMING_CONSISTENCY_COMPLETE.md](./NAMING_CONSISTENCY_COMPLETE.md) - Full summary
- [NAMING_STANDARDIZATION_PLAN.md](./NAMING_STANDARDIZATION_PLAN.md) - Detailed plan
- [src/constants/terms.js](./src/constants/terms.js) - Term constants
- [src/utils/studentIdHelpers.js](./src/utils/studentIdHelpers.js) - Student ID helpers
- [src/utils/apiFieldMapper.js](./src/utils/apiFieldMapper.js) - Field mappers

---

**Last Updated:** 2025-10-25
**Status:** ✅ All naming inconsistencies resolved
