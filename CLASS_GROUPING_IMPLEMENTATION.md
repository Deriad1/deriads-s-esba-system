# Class Grouping System Implementation

## Overview

Ghana's basic education system is divided into three levels:
- **KG (Kindergarten)**: KG1, KG2
- **Primary School**: BS1, BS2, BS3, BS4, BS5, BS6
- **JHS (Junior High School)**: BS7, BS8, BS9

This implementation provides a systematic way to group, display, and filter classes based on these educational levels throughout the eSBA system.

---

## Files Created

### 1. `src/utils/classGrouping.js`
**Purpose**: Core utility functions for class grouping

**Key Functions**:

```javascript
// Get the group for a specific class
getClassGroup(className) → { name, shortName, classes, description, color, icon, key }

// Group an array of classes
groupClasses(classes) → { KG: [], PRIMARY: [], JHS: [], OTHER: [] }

// Get all classes in a specific group
getClassesByGroup(groupKey) → Array<string>

// Sort classes by educational level
sortClassesByLevel(classes) → Array<string>

// Filter students by class group
filterStudentsByGroup(students, groupKey) → Array<object>

// Get statistics for each class group
getGroupStatistics(students) → { KG: {...}, PRIMARY: {...}, JHS: {...} }
```

**Visual Properties**:
- **KG**: Pink color (#FFB6C1), 🎨 icon
- **Primary**: Sky blue (#87CEEB), 📚 icon
- **JHS**: Light green (#90EE90), 🎓 icon

---

### 2. `src/components/ClassGroupFilter.jsx`
**Purpose**: Reusable filter buttons for selecting class groups

**Props**:
- `selectedGroup`: Currently selected group ('KG', 'PRIMARY', 'JHS', or 'ALL')
- `onGroupChange`: Callback function when group changes
- `showAll`: Whether to show "All Classes" button (default: true)
- `className`: Additional CSS classes

**Usage Example**:
```jsx
<ClassGroupFilter
  selectedGroup={selectedGroup}
  onGroupChange={(group) => setSelectedGroup(group)}
  showAll={true}
/>
```

---

### 3. `src/components/GroupedClassList.jsx`
**Purpose**: Displays classes organized by educational level

**Props**:
- `classes`: Array of class names
- `onClassSelect`: Callback when a class is clicked
- `selectedClass`: Currently selected class
- `showCounts`: Whether to display student counts
- `studentCounts`: Object mapping class names to student counts

**Usage Example**:
```jsx
<GroupedClassList
  classes={['KG1', 'KG2', 'BS1', 'BS7', 'BS8', 'BS9']}
  onClassSelect={(className) => setSelectedClass(className)}
  selectedClass="BS7"
  showCounts={true}
  studentCounts={{ 'KG1': 25, 'KG2': 30, 'BS7': 40 }}
/>
```

**Visual Output**:
```
┌─────────────────────────────────┐
│ 🎨 Kindergarten (2 classes)     │
│ ┌─────┐ ┌─────┐                │
│ │ KG1 │ │ KG2 │                │
│ └─────┘ └─────┘                │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ 🎓 Junior High School (3 class) │
│ ┌─────┐ ┌─────┐ ┌─────┐        │
│ │ BS7 │ │ BS8 │ │ BS9 │        │
│ └─────┘ └─────┘ └─────┘        │
└─────────────────────────────────┘
```

---

### 4. `src/components/ClassGroupStats.jsx`
**Purpose**: Display statistics for each class group

**Props**:
- `students`: Array of student objects (must have `className` property)
- `className`: Additional CSS classes

**Features**:
- Shows student count per group
- Displays percentage distribution
- Animated progress bars
- Color-coded by group

**Usage Example**:
```jsx
<ClassGroupStats students={allStudents} />
```

**Visual Output**:
```
┌──────────────────────┐┌──────────────────────┐┌──────────────────────┐
│ 🎨 Kindergarten   45 ││ 📚 Primary School 120││ 🎓 JHS            60 │
│ Students      18.0%  ││ Students      48.0%  ││ Students      24.0%  │
│ ████░░░░░░░░░░░░░░░  ││ ████████████░░░░░░░  ││ ██████░░░░░░░░░░░░░  │
└──────────────────────┘└──────────────────────┘└──────────────────────┘
```

---

## Integration with Admin Dashboard

### Updates Made to `src/pages/AdminDashboardPage.jsx`

1. **Imports Added**:
```javascript
import ClassGroupStats from "../components/ClassGroupStats";
import GroupedClassList from "../components/GroupedClassList";
```

2. **Student Distribution Section** (Added after header):
```jsx
<div className="glass-card-golden w-full">
  <h2 className="text-xl font-bold text-gray-900 text-shadow mb-4">
    Student Distribution by Level
  </h2>
  <ClassGroupStats students={learners} />
</div>
```

3. **Print Modal Enhanced**:
   - Replaced dropdown class selector with grouped visual class selection
   - Classes now organized by KG, Primary, and JHS
   - Easy visual identification of class levels
   - Better UX for selecting classes to print

**Before**:
```
Select Class: [Dropdown: KG1, KG2, BS1, ... BS9]
```

**After**:
```
Kindergarten (2 classes)
┌──────┐ ┌──────┐
│  KG1 │ │  KG2 │
└──────┘ └──────┘

Primary School (6 classes)
┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐
│  BS1 │ │  BS2 │ │  BS3 │ │  BS4 │ │  BS5 │ │  BS6 │
└──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘

Junior High School (3 classes)
┌──────┐ ┌──────┐ ┌──────┐
│  BS7 │ │  BS8 │ │  BS9 │
└──────┘ └──────┘ └──────┘
```

---

## Benefits

### 1. **Improved UX**
- Visual organization makes class selection intuitive
- Color-coding helps quick identification
- Icons provide visual cues

### 2. **Better Data Visualization**
- Student distribution clearly shows enrollment patterns
- Easy to spot imbalances between levels
- Progress bars provide quick visual comparison

### 3. **Educational Context**
- Aligns with Ghana's education structure
- Respects pedagogical differences between levels
- Makes system more relatable to Ghanaian educators

### 4. **Reusability**
- Components can be used in other dashboards (Head Teacher, Form Master, etc.)
- Utility functions available throughout the app
- Consistent implementation across features

### 5. **Extensibility**
- Easy to add custom classes to "OTHER" group
- Can extend to include SHS levels if needed
- Flexible for future education system changes

---

## Future Enhancement Opportunities

1. **Role-Based Filtering**
   - Filter teachers by class group they teach
   - Assign responsibilities by educational level

2. **Performance Analytics**
   - Compare performance across levels
   - Identify trends by educational stage

3. **Resource Allocation**
   - Track resources by level (books, materials)
   - Budget planning per educational stage

4. **Reporting Enhancements**
   - Generate level-specific reports
   - Broadsheets grouped by educational level

5. **Subject Assignment**
   - Different subjects for different levels
   - Level-appropriate curriculum management

---

## Usage Guidelines

### For Developers

```javascript
// Import utilities
import {
  getClassGroup,
  groupClasses,
  filterStudentsByGroup,
  sortClassesByLevel
} from '../utils/classGrouping';

// Get group information
const group = getClassGroup('BS7'); // Returns JHS group info

// Group classes
const grouped = groupClasses(['KG1', 'BS3', 'BS9']);
// Returns: { KG: ['KG1'], PRIMARY: ['BS3'], JHS: ['BS9'], OTHER: [] }

// Filter students
const jhsStudents = filterStudentsByGroup(allStudents, 'JHS');

// Sort classes
const sorted = sortClassesByLevel(['BS9', 'KG1', 'BS5']);
// Returns: ['KG1', 'BS5', 'BS9']
```

### For UI Components

```jsx
// Use pre-built components for consistency
import ClassGroupFilter from '../components/ClassGroupFilter';
import GroupedClassList from '../components/GroupedClassList';
import ClassGroupStats from '../components/ClassGroupStats';

// Implement in your component
function MyComponent() {
  const [selectedGroup, setSelectedGroup] = useState('ALL');

  return (
    <>
      <ClassGroupFilter
        selectedGroup={selectedGroup}
        onGroupChange={setSelectedGroup}
      />
      <ClassGroupStats students={students} />
    </>
  );
}
```

---

## Testing Recommendations

1. **Unit Tests**
   - Test grouping functions with various class combinations
   - Verify statistics calculations
   - Test edge cases (empty arrays, invalid class names)

2. **Integration Tests**
   - Test components render correctly
   - Verify filtering works across dashboards
   - Test with real student data

3. **User Acceptance Testing**
   - Verify alignment with Ghana's education system
   - Test with actual teachers and administrators
   - Gather feedback on visual organization

---

## Maintenance Notes

- Update `CLASS_GROUPS` constant in `classGrouping.js` if education system changes
- Keep colors accessible (WCAG AA compliant)
- Maintain consistency across all dashboards
- Document any custom class additions in "OTHER" group

---

## System Status

✅ **Implemented**:
- Core grouping utilities
- Visual components
- Admin Dashboard integration
- Statistics display

⏳ **Pending** (Optional Future Enhancements):
- Integration in other dashboards (Head Teacher, Form Master)
- Advanced filtering in student/teacher management
- Performance analytics by level
- Resource management by level

---

## Summary

The class grouping system provides a solid foundation for organizing Ghana's educational levels throughout the eSBA system. It improves usability, provides better context for educators, and sets the stage for level-specific features and analytics.

**Current Impact**:
- Admin Dashboard: Enhanced with statistics and visual class selection
- Print Section: Improved UX with grouped class display
- Reusable components: Ready for integration in other features

**Next Steps**:
1. Test with real school data
2. Gather user feedback
3. Apply to other dashboards as needed
4. Consider additional level-specific features
