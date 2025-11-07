# 🎓 Student Promotion - Quick Reference

## 🚀 How to Promote Students

### Access
**Admin Dashboard** → Click **"Promote Students"** (📚 icon)

### 4 Simple Steps

#### Step 1: Select Source Class
Click on a class card (e.g., BS7)
- Shows student count
- Empty classes are disabled

#### Step 2: Review Students
- All students **auto-selected** ✅
- Deselect anyone who shouldn't be promoted
- Toggle: "Select All" / "Deselect All"

#### Step 3: Select Target Class
- Dropdown auto-suggests next level
- Options: KG1-BS12, or "Graduated 🎓"

#### Step 4: Configure & Promote
- Enter Academic Year (e.g., 2025/2026)
- Select Starting Term (usually "First Term")
- Click **"Promote X Students"**

---

## 📋 Common Use Cases

### Normal Promotion
**All BS7 → BS8**
1. Select BS7
2. Keep all students selected
3. Target: BS8 (auto-suggested)
4. Enter year → Promote

### Selective Promotion
**Some repeat, some advance**
1. Select BS7
2. Deselect students who repeat
3. Target: BS8
4. Promote advancing students
5. Repeat for repeating students (target: BS7)

### Graduation
**BS9 → Graduated**
1. Select BS9
2. Keep all selected
3. Target: Graduated 🎓
4. ⚠️ Red warning appears
5. Confirm → Promote

---

## ✅ What Gets Updated

### Students Table
- ✅ `class_name` changes to target class
- ✅ All other fields stay the same

### Promotion History Table
- ✅ Records: who, from where, to where, when
- ✅ Audit trail preserved

### Marks/Remarks
- ✅ Stay in their original term/year
- ✅ Not affected by promotion

---

## ⚠️ Important Notes

### Before Promoting
- Archive current term first (preserves marks)
- Verify student lists are correct
- Plan who repeats/skips/graduates

### During Promotion
- All students auto-selected by default
- Deselect anyone who shouldn't be promoted
- Double-check target class
- Review academic year

### After Promotion
- Verify students appear in new class
- Check promotion history was recorded
- Update global term if needed

---

## 🎨 UI Design

✅ **White/Glassmorphism** - Clean, translucent design
✅ **Gray/Black buttons** - No blue/purple colors
✅ **Green checkmarks** - On selected students
✅ **Responsive** - Works on all screen sizes

---

## 🐛 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| Button disabled | Select class + students + target + year |
| No students found | Check class has students in database |
| Promotion fails | Check console for error details |
| Wrong colors | Component should use `glass-card-golden` |

---

## 🔗 Class Progression

```
KG1 → KG2 → BS1 → BS2 → BS3 → BS4 → BS5 → BS6
→ BS7 → BS8 → BS9 → Graduated

BS10, BS11, BS12 → Graduated
```

---

## 📞 Full Documentation

See `PROMOTION_SYSTEM_READY.md` for comprehensive testing guide.

---

**Status:** ✅ Ready to Use
**Server:** http://localhost:9001
