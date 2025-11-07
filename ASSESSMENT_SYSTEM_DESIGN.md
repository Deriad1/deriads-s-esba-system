# Custom Assessment System Design

## Overview

Allow admin to create custom assessments (e.g., Midterm, Mock Exams, Quizzes) that teachers can use to enter marks for students.

## Current System

Currently, the system only tracks:
- **4 Class Tests** (test1, test2, test3, test4) - 15 marks each = 60 total → scaled to 50%
- **1 Exam** - 100 marks → scaled to 50%
- **Total** - 100%

## Proposed Enhancement

### 1. Assessment Types

Allow admin to define different assessment types:

**Examples:**
- Midterm Assessment (20% of final grade)
- Mock Exam (30% of final grade)
- Quiz (10% of final grade)
- Class Work (20% of final grade)
- Final Exam (50% of final grade)

### 2. Database Schema

**New Table: `assessments`**
```sql
CREATE TABLE assessments (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,              -- "Midterm Assessment", "Mock Exam"
  description TEXT,                         -- Details about the assessment
  assessment_type VARCHAR(50) NOT NULL,     -- "midterm", "mock", "quiz", "classwork", "exam"
  max_score NUMERIC(5,2) NOT NULL,         -- Maximum score (e.g., 100, 50, 20)
  weight_percentage NUMERIC(5,2) NOT NULL, -- Weight in final grade (e.g., 20, 30, 50)
  term VARCHAR(50) NOT NULL,               -- "First Term", "Second Term", "Third Term"
  academic_year VARCHAR(20) NOT NULL,      -- "2024/2025"
  is_active BOOLEAN DEFAULT true,          -- Active or archived
  applicable_classes TEXT[],               -- Array of classes ["KG1", "KG2", "BS1"]
  applicable_subjects TEXT[],              -- Array of subjects or NULL for all
  start_date TIMESTAMP,                    -- When assessment becomes available
  end_date TIMESTAMP,                      -- Deadline for completing assessment
  created_by INTEGER REFERENCES users(id), -- Admin who created it
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Updated Table: `marks`**
```sql
-- Add new column to marks table
ALTER TABLE marks ADD COLUMN assessment_id INTEGER REFERENCES assessments(id);
ALTER TABLE marks ADD COLUMN assessment_type VARCHAR(50); -- For backward compatibility

-- Keep existing columns for standard system:
-- test1, test2, test3, test4, exam, class_score, exam_score, total, remark
```

### 3. Admin Features

#### Create Assessment
- Admin goes to Admin Dashboard
- Clicks "Create Assessment" button
- Fills form:
  - Assessment Name (e.g., "Midterm Assessment")
  - Description
  - Assessment Type (dropdown)
  - Maximum Score
  - Weight in Final Grade (%)
  - Term
  - Academic Year
  - Applicable Classes (multi-select)
  - Applicable Subjects (multi-select or "All")
  - Start Date (when teachers can start entering marks)
  - End Date (deadline)

#### Manage Assessments
- View all assessments (active and archived)
- Edit assessment details
- Activate/Deactivate assessments
- Delete assessments (if no marks entered)
- View progress (how many teachers completed)

#### Assessment Dashboard
- See which teachers have completed the assessment
- See completion percentage per class
- Export assessment results

### 4. Teacher Features

#### View Available Assessments
- Teachers see a list of active assessments for their classes/subjects
- See deadline and completion status
- Click to enter marks

#### Enter Marks for Assessment
- Select assessment from dropdown
- Select class and subject
- Enter marks for each student
- Marks are validated against max_score
- Save and submit

#### Assessment Types

**Option A: Simple Assessments (Single Score)**
```
Example: Midterm Assessment
- Student: John Doe
- Score: 85/100
- Saved as one entry
```

**Option B: Composite Assessments (Multiple Components)**
```
Example: Continuous Assessment
- Quiz 1: 15/20
- Quiz 2: 18/20
- Assignment: 25/30
- Class Participation: 8/10
- Total: 66/80
```

### 5. Calculation System

#### Standard System (Current)
```
Class Tests (4 tests × 15 = 60) → 50%
Exam (100) → 50%
Total: 100%
```

#### With Custom Assessments
```
Option 1: Parallel System
- Standard system remains (test1-4 + exam)
- Custom assessments are separate entries
- Admin chooses which system to use per term

Option 2: Flexible Weighting
- Admin defines multiple assessments
- System calculates total based on weights
- Example:
  - Midterm (20%) = 80/100 → 16/20
  - Classwork (30%) = 70/100 → 21/30
  - Final Exam (50%) = 85/100 → 42.5/50
  - Total: 79.5/100
```

### 6. Broadsheet Integration

#### Filter by Assessment
- Print broadsheet for specific assessment
- Print broadsheet for standard system
- Print combined report showing all assessments

#### Display Options
- Show individual assessment scores
- Show weighted scores
- Show cumulative total

### 7. Report Integration

#### Individual Student Report
```
STUDENT REPORT - TERM 1, 2024/2025
Name: John Doe
Class: BS7

Subject: Mathematics
├─ Midterm Assessment (20%): 85/100 → 17.0/20
├─ Classwork (30%): 70/100 → 21.0/30
├─ Final Exam (50%): 90/100 → 45.0/50
└─ Total: 83.0/100 → EXCELLENT

Subject: English
├─ Midterm Assessment (20%): 75/100 → 15.0/20
├─ Classwork (30%): 80/100 → 24.0/30
├─ Final Exam (50%): 78/100 → 39.0/50
└─ Total: 78.0/100 → VERY GOOD
```

## Implementation Plan

### Phase 1: Database & API (Foundation)
1. Create `assessments` table
2. Add `assessment_id` to `marks` table
3. Create API endpoints:
   - `POST /api/assessments` - Create assessment
   - `GET /api/assessments` - List all assessments
   - `GET /api/assessments/:id` - Get one assessment
   - `PUT /api/assessments/:id` - Update assessment
   - `DELETE /api/assessments/:id` - Delete assessment
   - `GET /api/assessments/active` - Get active assessments
4. Create API for marks with assessments:
   - `POST /api/marks/assessment` - Enter marks for assessment
   - `GET /api/marks/assessment/:id` - Get marks for assessment

### Phase 2: Admin UI
1. Create "Assessments" section in Admin Dashboard
2. Create "Create Assessment" modal
3. Create "Manage Assessments" table
4. Create assessment progress dashboard

### Phase 3: Teacher UI
1. Add "Available Assessments" section to teacher pages
2. Update marks entry to support assessments
3. Add assessment selection dropdown

### Phase 4: Reporting
1. Update broadsheet to support assessment filtering
2. Update individual reports to show assessments
3. Create assessment-specific reports

### Phase 5: Calculation System
1. Implement weighted score calculation
2. Update total calculation to handle multiple assessments
3. Update remark calculation based on final weighted total

## User Stories

### As an Admin
1. I want to create a midterm assessment for BS7-BS12 students
2. I want to set the weight of the midterm as 20% of the final grade
3. I want to see which teachers have completed entering marks
4. I want to deactivate old assessments

### As a Teacher
1. I want to see all assessments I need to complete
2. I want to enter midterm marks for my students
3. I want to see the deadline for each assessment
4. I want to view my completion status

### As a Form Master
1. I want to see all assessments for my class
2. I want to print reports showing all assessment scores
3. I want to track which subjects have pending assessments

## Benefits

1. **Flexibility** - Admin can create any type of assessment
2. **Customization** - Different weights for different assessments
3. **Organization** - Clear structure for continuous assessment
4. **Tracking** - Monitor completion status
5. **Reporting** - Comprehensive assessment reports
6. **Standards** - Consistent assessment across all classes

## Questions to Resolve

1. **Compatibility**: Should custom assessments replace the standard system or coexist?
   - **Recommendation**: Coexist - keep standard system as default, custom assessments as optional

2. **Calculation**: How should final grades be calculated with multiple assessments?
   - **Recommendation**: Weighted average based on assessment weights

3. **Backward Compatibility**: How to handle existing marks?
   - **Recommendation**: Existing marks stay in standard system (test1-4 + exam)

4. **Deadline Enforcement**: Should system prevent entry after deadline?
   - **Recommendation**: Show warning but allow with admin permission

5. **Score Entry**: Simple (one score) or composite (multiple components)?
   - **Recommendation**: Start simple, add composite in future

## Next Steps

1. Get user confirmation on design
2. Create database migration script
3. Build API endpoints
4. Create admin UI components
5. Update teacher pages
6. Test thoroughly
7. Deploy and train users

## Example Usage Scenarios

### Scenario 1: Midterm Assessment
```
Admin creates "Midterm Assessment"
- Type: Midterm
- Max Score: 100
- Weight: 20%
- Classes: BS7, BS8, BS9
- Subjects: All
- Deadline: 2025-11-15

Teachers see notification
Teachers enter marks
System calculates weighted score
Reports show midterm results
```

### Scenario 2: Continuous Assessment
```
Admin creates multiple assessments:
- Quiz 1 (5%)
- Quiz 2 (5%)
- Assignment (10%)
- Midterm (20%)
- Final Exam (60%)

Teachers complete each assessment
System calculates cumulative total
Final report shows all components
```

## Technical Considerations

- **Performance**: Index assessment_id in marks table
- **Validation**: Ensure weights don't exceed 100%
- **Permissions**: Only admin can create assessments
- **Audit Trail**: Log who entered marks and when
- **Data Integrity**: Prevent deletion if marks exist
- **Caching**: Cache active assessments for performance

---

**Ready to implement?** Let me know if you want to proceed with this design or if you'd like any modifications!
