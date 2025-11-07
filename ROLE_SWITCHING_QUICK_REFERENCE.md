# Role Switching Quick Reference Card

## For Administrators with Multiple Roles

---

## What is Role Switching?

If you're an **Administrator** who also teaches (Class Teacher, Form Master, Subject Teacher, or Head Teacher), you can seamlessly switch between these roles without logging out.

---

## How to Switch Roles

### **Step 1: Find the Role Switcher**

Look at the top navigation bar (navbar) - you'll see a dropdown in the center showing your current role:

```
┌─────────────────────────────────────┐
│  [Logo]  [👤 Administrator ▼]  [⚙️] │
└─────────────────────────────────────┘
           ↑
    Role Switcher
```

---

### **Step 2: Click to Open**

Click on the role dropdown to see all your available roles:

```
┌──────────────────────────────────┐
│  Switch Role                      │
├──────────────────────────────────┤
│  ✓ Administrator     [Active]    │
│  ○ Head Teacher                  │
│  ○ Class Teacher                 │
│  ○ Subject Teacher               │
└──────────────────────────────────┘
```

---

### **Step 3: Select a Role**

Click on the role you want to switch to:

- **Administrator** → Access all admin functions
- **Head Teacher** → View school-wide analytics
- **Class Teacher** → Manage your assigned class
- **Form Master/Mistress** → Manage your form class (BS7-BS9)
- **Subject Teacher** → Enter marks for your subjects

---

### **Step 4: Automatic Redirect**

After selecting, you'll be automatically redirected to that role's dashboard:

| Role Selected       | Redirects To            |
|---------------------|-------------------------|
| Administrator       | `/admin`                |
| Head Teacher        | `/head-teacher`         |
| Form Master         | `/form-master`          |
| Class Teacher       | `/class-teacher`        |
| Subject Teacher     | `/subject-teacher`      |

---

## Important Features

### ✅ **Admin Superuser Access**

As an **Administrator**, you can:
- Access ALL pages regardless of which role is active
- No need to switch roles to view different pages
- Role switching is for **context**, not **access control**

**Example:**
```
You're in "Class Teacher" mode → Can still access /admin page
You're in "Admin" mode → Can still access /class-teacher page
```

---

### ✅ **Persistent Role Selection**

Your role choice is remembered:
- Stays active when navigating between pages
- Persists even if you refresh the page
- Only resets when you log out

---

### ✅ **Visual Indicator**

The navbar always shows which role you're currently using:
- **Blue highlight** = Active role
- **Gray circle** = Available but not active

---

## Common Scenarios

### **Scenario 1: Entering Marks for My Class**

1. Click Role Switcher
2. Select "Class Teacher" (or "Form Master" for BS7-BS9)
3. You're now on your class dashboard
4. Enter marks for your students

---

### **Scenario 2: Viewing School-Wide Analytics**

1. Click Role Switcher
2. Select "Head Teacher"
3. View overall school performance
4. Generate school reports

---

### **Scenario 3: Managing Users**

1. Click Role Switcher
2. Select "Administrator"
3. Access admin dashboard
4. Manage teachers, settings, etc.

---

### **Scenario 4: Quick Access Without Switching**

**You don't need to switch roles for basic navigation!**

Even if you're in "Subject Teacher" mode:
- You can manually go to `/admin` page
- Admin access is always available
- Just type the URL or bookmark it

---

## Role Descriptions

### **Administrator**
- **Purpose:** System management and oversight
- **Access:** All pages and features
- **Typical Tasks:**
  - Add/edit teachers
  - Configure school settings
  - Manage users and permissions
  - View all reports

---

### **Head Teacher**
- **Purpose:** School-wide academic oversight
- **Access:** Analytics, all classes, reports
- **Typical Tasks:**
  - View school performance dashboards
  - Generate comparative reports
  - Monitor teacher performance
  - Export broadsheets

---

### **Form Master/Mistress** (BS7-BS9)
- **Purpose:** Manage senior secondary students
- **Access:** Assigned form class data
- **Typical Tasks:**
  - View class performance
  - Generate student reports
  - Track attendance
  - Print report cards

---

### **Class Teacher** (KG-BS6)
- **Purpose:** Manage junior/primary students
- **Access:** Assigned class data
- **Typical Tasks:**
  - Enter CA and exam marks
  - View class statistics
  - Generate individual reports
  - Track student progress

---

### **Subject Teacher**
- **Purpose:** Enter marks for specific subjects
- **Access:** Assigned subjects across classes
- **Typical Tasks:**
  - Enter CA1, CA2, CA3, CA4 marks
  - Enter exam marks
  - View subject performance
  - Filter by class and subject

---

## Troubleshooting

### **Q: I don't see the Role Switcher**

**A:** This means you only have one role. The switcher only appears for users with 2+ roles.

---

### **Q: Can I switch to a role I don't have?**

**A:** No. You can only switch to roles assigned to you by an administrator.

---

### **Q: What happens if I refresh the page?**

**A:** Your selected role is saved. You'll stay in the same role after refreshing.

---

### **Q: Do I need to switch roles to access different pages?**

**A:** No! As an admin, you can access all pages regardless of your current role. Role switching is just for **context** and **dashboard preference**.

---

### **Q: What if I forget which role I'm in?**

**A:** Check the Role Switcher in the navbar - it always shows your active role.

---

### **Q: Can I be logged in with different roles on different devices?**

**A:** Yes! Each device/browser session is independent. You can be "Admin" on your laptop and "Class Teacher" on your phone.

---

## Best Practices

### ✅ **DO:**
- Switch to the role relevant to your current task
- Use "Class Teacher" when managing your class
- Use "Admin" when doing administrative work
- Use "Subject Teacher" when entering marks

### ❌ **DON'T:**
- Switch roles excessively (it's unnecessary)
- Worry about access - admins can access everything
- Log out to change roles (use the switcher instead)

---

## Keyboard Shortcuts

Currently not available, but could be added:

- `Alt + R` → Open Role Switcher
- `Alt + 1` → Switch to Admin
- `Alt + 2` → Switch to Head Teacher
- `Alt + 3` → Switch to Class Teacher
- etc.

---

## Security Notes

### 🔒 **Your roles are determined by:**
- Your account permissions in the database
- Cannot be changed by you (only by system admins)
- Verified on every login

### 🔒 **Role switching does NOT:**
- Grant you new permissions
- Allow access to roles you don't have
- Bypass security checks

### 🔒 **What's protected:**
- Backend verifies your JWT token on every request
- You cannot edit localStorage to gain unauthorized roles
- All role changes are logged for auditing

---

## Video Tutorial

**Coming Soon:** A step-by-step video showing:
1. How to locate the Role Switcher
2. How to switch between roles
3. What each role's dashboard looks like
4. Common workflows for multi-role admins

---

## Support

If you encounter issues:

1. **Check your roles:**
   - Open browser console (F12)
   - Type: `JSON.parse(localStorage.getItem('user')).all_roles`
   - This shows all roles you have

2. **Refresh the page:**
   - Sometimes a simple refresh fixes UI issues

3. **Clear cache:**
   - `Ctrl + Shift + R` (Windows)
   - `Cmd + Shift + R` (Mac)

4. **Contact support:**
   - Email: support@school.com
   - Include: Your name, role, and what went wrong

---

## Changelog

### Version 2.0 (Current)
- ✅ Admins can access all pages without switching
- ✅ Improved role switcher UI
- ✅ Added audit logging
- ✅ Better mobile responsiveness

### Version 1.0
- ✅ Basic role switching
- ✅ Role-based routing
- ✅ LocalStorage persistence

---

## Summary

| Feature                     | Status |
|-----------------------------|--------|
| Multiple role support       | ✅     |
| Visual role switcher        | ✅     |
| Auto-redirect on switch     | ✅     |
| Persistent role selection   | ✅     |
| Admin superuser access      | ✅     |
| Mobile responsive           | ✅     |
| Audit logging               | ✅     |
| Keyboard shortcuts          | ⏳     |

---

**Last Updated:** 2025-01-20
**Version:** 2.0

