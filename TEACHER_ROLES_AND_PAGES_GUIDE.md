# Teacher Roles & Login Redirect Guide

## 📋 Overview

This document explains all teacher roles, what pages they see, and how the system decides where to redirect teachers upon login.

---

## 🎭 All Teacher Roles in the System

### 1. **admin**
- Full system administrator
- Can manage everything

### 2. **head_teacher**
- School head teacher
- Oversight of all teachers and classes

### 3. **form_master** / **form_mistress**
- Manages a specific JHS class (BS7, BS8, or BS9)
- Also teaches subjects to their form class
- **JHS ONLY** (BS7-BS9)

### 4. **class_teacher**
- Manages a specific KG or Primary class
- **KG and Primary levels** (KG1, KG2, BS1-BS6)

### 5. **subject_teacher**
- Teaches specific subjects across classes
- No class management responsibility
- Can teach any level

### 6. **teacher** (Generic/Legacy)
- Fallback role for teachers without specific role
- Redirects to generic dashboard

---

## 🚪 Login Redirect Logic

When a teacher logs in, the system checks their **Primary Role** and redirects them:

```javascript
const roleRoutes = {
  'admin': '/admin',
  'head_teacher': '/head-teacher',
  'form_master': '/form-master',
  'class_teacher': '/class-teacher',
  'subject_teacher': '/subject-teacher',
  'teacher': '/subject-teacher' // Generic teacher → subject teacher page
};
```

### Redirect Priority:
1. **Primary Role** (teacher_primary_role in database)
2. **Current Role** (if user switches roles in app)
3. **First role in all_roles array**
4. **Fallback**: `/subject-teacher` (if role not recognized)

---

## 📄 All Pages and Their Features

### 1. **/admin** - Admin Dashboard
**Who can access:** Only `admin` role
**Features:**
- View and manage all teachers
- View and manage all students
- Assign subjects & classes to teachers
- Bulk upload students
- Print reports and broadsheets
- School setup and configuration
- Analytics dashboard
- Teacher leaderboard
- Reset teacher passwords

---

### 2. **/head-teacher** - Head Teacher Dashboard
**Who can access:** `head_teacher` and `admin`
**Features:**
- Overview of all classes and teachers
- Performance analytics across school
- Teacher leaderboard
- Class performance trends
- Subject performance charts
- Teacher assignment overview
- Print class reports

---

### 3. **/form-master** - Form Master/Mistress Dashboard
**Who can access:** Only `form_master` role
**For:** JHS teachers (BS7-BS9)
**Features:**
- View their assigned form class (BS7, BS8, or BS9)
- Enter scores for subjects they teach to their form
- View class performance
- Class attendance tracking
- Student list for their form
- Performance trends for their class
- **Dual role:** Both class management + subject teaching

---

### 4. **/class-teacher** - Class Teacher Dashboard
**Who can access:** Only `class_teacher` role
**For:** KG and Primary teachers (KG1-BS6)
**Features:**
- Manage their assigned class
- View all students in their class
- Enter scores (if they also teach subjects)
- Class performance overview
- Student progress tracking

---

### 5. **/subject-teacher** - Subject Teacher Dashboard
**Who can access:** Only `subject_teacher` role
**Features:**
- Select class and subject to enter scores
- View subjects they teach
- View classes assigned to them
- Enter marks (class work 60%, exams 40%)
- Submit scores for students
- Performance analytics for their subjects

**Special Logic:**
If a subject_teacher ALSO has `form_master` in their roles → automatically redirected to `/form-master`

---

### 6. **/dashboard** - ~~Generic Teacher Dashboard~~ (REMOVED ✅)
**Status:** Now redirects to `/subject-teacher`
**Reason:** All teachers should have a specific role. Teachers with generic "teacher" role are now redirected to the Subject Teacher page.

---

### 7. **/school-setup** - School Configuration
**Who can access:** `admin` and `head_teacher`
**Features:**
- Upload school logo
- Set school name
- Configure background image
- Set current term and academic year
- System-wide settings

---

### 8. **/manage-users** - User Management
**Who can access:** Only `admin`
**Features:**
- Advanced user management
- Role assignment
- User permissions

---

### 9. **/report/:studentId** - Individual Student Report
**Who can access:** All authenticated users
**Features:**
- View individual student report card
- Print student report
- End of term assessment

---

### 10. **/notification-demo** - Notification System Demo
**Who can access:** Only `admin`
**Features:**
- Test notification system
- Demo various notification types

---

### 11. **/diagnostic** - System Diagnostics
**Who can access:** Only `admin`
**Features:**
- System health checks
- API connection testing
- Debug information

---

## 🔄 Role Assignment Best Practices

### For KG Teachers:
```
Primary Role: class_teacher
Teaching Level: KG
Assigned Class: KG1 or KG2
```

### For Lower Primary Teachers (BS1-BS3):
```
Primary Role: class_teacher
Teaching Level: Lower Primary
Assigned Class: BS1, BS2, or BS3
```

### For Upper Primary Teachers (BS4-BS6):
```
Primary Role: class_teacher
Teaching Level: Upper Primary
Assigned Class: BS4, BS5, or BS6
```

### For JHS Form Masters (BS7-BS9):
```
Primary Role: form_master
Teaching Level: JHS
Form Class: BS7, BS8, or BS9
Additional: Also assign subjects they teach
```

### For Subject Teachers (No class management):
```
Primary Role: subject_teacher
Teaching Level: (appropriate level or "All Levels")
Subjects: Assign specific subjects
Classes: Assign classes they teach
```

---

## ⚠️ "teacher" Role - Now Fixed! ✅

### The Previous Problem:
Teachers with **"teacher"** as their primary role were redirected to a generic dashboard with limited functionality.

### What's Changed:
- ✅ Generic `/dashboard` route has been **removed**
- ✅ Teachers with "teacher" role now redirect to `/subject-teacher`
- ✅ All teachers now have access to a functional page

### Still Recommended:
**Update each teacher's Primary Role for best experience:**

1. Go to **Admin Dashboard** → **View Teachers**
2. Click **Edit** on each teacher
3. Select the correct **Primary Role**:
   - KG/Primary teachers → **Class Teacher**
   - JHS teachers managing a class → **Form Master**
   - Teachers only teaching subjects → **Subject Teacher**
4. Save changes

This ensures teachers see the interface designed for their specific responsibilities.

---

## 🎯 Recommended Role Structure

### School with 9 Classes (KG1, KG2, BS1-BS9):

| Teacher | Teaching Level | Primary Role | Assigned Class | Subjects |
|---------|---------------|--------------|----------------|----------|
| Teacher A | KG | Class Teacher | KG1 | All KG subjects |
| Teacher B | KG | Class Teacher | KG2 | All KG subjects |
| Teacher C | Lower Primary | Class Teacher | BS1 | All Lower Primary subjects |
| Teacher D | Lower Primary | Class Teacher | BS2 | All Lower Primary subjects |
| Teacher E | Lower Primary | Class Teacher | BS3 | All Lower Primary subjects |
| Teacher F | Upper Primary | Class Teacher | BS4 | All Upper Primary subjects |
| Teacher G | Upper Primary | Class Teacher | BS5 | All Upper Primary subjects |
| Teacher H | Upper Primary | Class Teacher | BS6 | All Upper Primary subjects |
| Teacher I | JHS | Form Master | BS7 | Selected JHS subjects |
| Teacher J | JHS | Form Master | BS8 | Selected JHS subjects |
| Teacher K | JHS | Form Master | BS9 | Selected JHS subjects |
| Teacher L | All Levels | Subject Teacher | - | French (BS4-BS9) |
| Teacher M | JHS | Subject Teacher | - | Computing (JHS only) |

---

## 🔧 How to Fix Teachers with Wrong Roles

### Step-by-Step:

1. **Login as Admin**
2. **Go to Admin Dashboard**
3. **Click "View Teachers" button**
4. **For each teacher:**
   - Click **Edit**
   - Check their **Teaching Level**
   - Update **Primary Role**:
     - KG/Primary managing a class → `Class Teacher`
     - JHS managing a class → `Form Master`
     - No class management → `Subject Teacher`
   - Remove **"teacher"** from roles if it exists
   - Click **Save**

5. **Teacher logs out and logs in again** → Will see correct page!

---

## 📊 Quick Reference Table

| Primary Role | Redirect URL | Page Name | For Whom |
|-------------|--------------|-----------|----------|
| admin | /admin | Admin Dashboard | System Admin |
| head_teacher | /head-teacher | Head Teacher Dashboard | School Head |
| form_master | /form-master | Form Master Dashboard | JHS Class Managers |
| class_teacher | /class-teacher | Class Teacher Dashboard | KG/Primary Class Managers |
| subject_teacher | /subject-teacher | Subject Teacher Dashboard | Subject-only Teachers |
| teacher | /subject-teacher | Subject Teacher Dashboard | Generic teachers (redirected) ✅ |

---

## 💡 Tips for Administrators

1. **Audit all teachers** - Make sure each has the correct primary role
2. **Remove "teacher" role** - Replace with specific roles
3. **Assign teaching levels** - Match role to appropriate level
4. **Test login** - After changing roles, test teacher login
5. **Use "All Levels"** - For teachers who teach across multiple levels

---

## 🔍 How to Check Current Teacher Roles

In **Admin Dashboard → View Teachers**, you can see:
- **Email** - For login
- **Role** - Current primary role (this determines redirect)
- **Subjects** - What they teach
- **Classes** - Where they teach

If you see many teachers with just "teacher" role, you need to update them!
