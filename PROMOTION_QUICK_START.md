# Student Promotion - Quick Start Guide

## 🚀 Setup (One-Time)

### Step 1: Create Database Table
Run this in your database:
```sql
CREATE TABLE IF NOT EXISTS promotion_history (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  from_class VARCHAR(10) NOT NULL,
  to_class VARCHAR(10) NOT NULL,
  academic_year VARCHAR(20) NOT NULL,
  term VARCHAR(20) DEFAULT 'First Term',
  promotion_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  promoted_by INTEGER REFERENCES users(id),
  notes TEXT
);
```

**Or use the script:**
```bash
# Run the SQL file
psql -U your_user -d your_database -f create-promotion-history-table.sql
```

## 📋 How to Use

### Individual Promotion (Few Students)

1. **Open Promote Modal:**
   - Go to Admin Dashboard
   - Click "Promote Students" button

2. **Select Students:**
   - Check boxes for students to promote
   - Use "Select All" if needed

3. **Set Target Class:**
   - Target class is auto-suggested (e.g., BS7 → BS8)
   - Enter academic year (e.g., 2025/2026)
   - Select term (usually "First Term")

4. **Click "Promote Students"**
   - Confirm if students are graduating
   - Done! ✅

### Bulk Promotion (Whole Classes)

1. **Open Bulk Promote Modal:**
   - Go to Admin Dashboard
   - Click "Bulk Promote (End of Year)" button

2. **Select Classes:**
   - Click on class cards to select (BS7, BS8, etc.)
   - Classes turn blue when selected
   - Graduating classes turn red (BS9, BS12)

3. **Configure:**
   - Enter new academic year (required)
   - Set starting term
   - Keep "Auto progression" checked

4. **Review Preview:**
   - Check promotions: BS7 → BS8, BS9 → Graduated
   - Review warnings for graduating classes

5. **Click "Promote All Selected Classes"**
   - Confirm the action
   - Done! ✅

## ⚠️ Important Rules

### Before Promotion
1. ✅ **Archive current term** (preserve marks/remarks)
2. ✅ **Complete all data entry**
3. ✅ **Backup database**

### What Happens
- Student's `class_name` changes: BS7 → BS8
- Promotion recorded in history
- Student stays in database (not deleted)
- Marks/remarks NOT copied (start fresh next term)

### Graduated Students
- Marked as class_name = "Graduated"
- Remain in database for records
- Can still view their old reports

## 🔍 Class Progression

```
KG1  → KG2
KG2  → BS1
BS1  → BS2
BS2  → BS3
BS3  → BS4
BS4  → BS5
BS5  → BS6
BS6  → BS7
BS7  → BS8
BS8  → BS9
BS9  → Graduated (Final)
```

## 📊 View Promotion History

**For specific student:**
```bash
GET /api/students/promotion-history?studentId=123
```

**For academic year:**
```bash
GET /api/students/promotion-history?academicYear=2024/2025
```

## 🆘 Troubleshooting

| Problem | Solution |
|---------|----------|
| "Column does not exist" | Students table doesn't have term/year - this is normal |
| "Promotion history not recording" | Run `create-promotion-history-table.sql` |
| "No students found" | Check class names match exactly (case-sensitive) |

## ✅ End of Year Checklist

- [ ] Archive Third Term
- [ ] Export all reports
- [ ] Verify data complete
- [ ] Run bulk promotion
- [ ] Check promotion history
- [ ] Update global term/year
- [ ] Notify teachers

---

**Full Documentation**: See `PROMOTION_SYSTEM_COMPLETE.md`
**Created**: 2025-10-24
