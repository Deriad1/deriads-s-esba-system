# Quick Test Workaround - Role Switching Without Backend

**Issue:** Backend API not running, login fails with 500 error
**Solution:** Manually set user data in localStorage to test frontend role switching

---

## Step 1: Open the Application

1. Open browser to: **http://localhost:9000**
2. You'll see the login page
3. **Press F12** to open DevTools
4. Click on **Console** tab

---

## Step 2: Manually Set User Data (God Mode)

Copy and paste this code into the browser console:

```javascript
// Set God Mode user in localStorage
localStorage.setItem('user', JSON.stringify({
  id: 999999,
  email: 'god@god.com',
  name: 'Super Admin',
  firstName: 'Super',
  lastName: 'Admin',
  primaryRole: 'admin',
  all_roles: ['admin', 'head_teacher', 'form_master', 'class_teacher', 'subject_teacher'],
  currentRole: 'admin',
  gender: 'male',
  classes: ['BS7', 'BS8', 'BS9'],
  subjects: ['Mathematics', 'English Language'],
  classAssigned: 'BS7',
  form_class: 'BS7',
  requiresPasswordChange: false
}));

// Refresh the page
window.location.href = '/admin';
```

**Expected Result:**
- Page refreshes and redirects to `/admin`
- You're now logged in as God Mode (Super Admin)
- Should see the Admin Dashboard

---

## Step 3: Verify Role Switcher Appears

**Check the Navbar:**

1. Look at the center of the navbar
2. You should see: **👤 Administrator ▼**
3. This is the RoleSwitcher dropdown

**If you DON'T see it:**
- Open console
- Type: `JSON.parse(localStorage.getItem('user')).all_roles`
- Should show: `['admin', 'head_teacher', 'form_master', 'class_teacher', 'subject_teacher']`
- If not, repeat Step 2

---

## Step 4: Test Role Switching

### **Test 1: Switch from Admin to Class Teacher**

1. Click on "Administrator ▼" dropdown
2. You should see 5 roles listed:
   - ✓ Administrator [Active] (blue highlight)
   - ○ Head Teacher
   - ○ Form Master
   - ○ Class Teacher
   - ○ Subject Teacher

3. Click on **"Class Teacher"**

**Expected Results:**
- [ ] Dropdown closes
- [ ] Page redirects to `/class-teacher`
- [ ] Navbar now shows: "Class Teacher ▼"
- [ ] Active role changed in dropdown

**Verify in Console:**
```javascript
JSON.parse(localStorage.getItem('user')).currentRole
// Should return: "class_teacher"
```

---

### **Test 2: Admin Can Still Access All Pages**

**Current State:** You're in "Class Teacher" mode (currentRole: 'class_teacher')

1. Manually navigate to: `http://localhost:9000/admin`
2. Press Enter

**Expected Results:**
- [ ] Admin page loads successfully (admin superuser access)
- [ ] No redirect
- [ ] RoleSwitcher still shows "Class Teacher"
- [ ] This proves admin can access all pages regardless of currentRole ✅

**Try other pages:**
- Navigate to: `/form-master` → [ ] Should load
- Navigate to: `/head-teacher` → [ ] Should load
- Navigate to: `/subject-teacher` → [ ] Should load

---

### **Test 3: Switch to Form Master**

1. Click RoleSwitcher dropdown
2. Click "Form Master"

**Expected Results:**
- [ ] Redirects to `/form-master`
- [ ] RoleSwitcher shows: "Form Master" (not "Form Mistress" since gender is male)

---

### **Test 4: Role Persistence**

1. Currently in "Form Master" mode
2. **Refresh the page (F5)**

**Expected Results:**
- [ ] Still on `/form-master` page
- [ ] RoleSwitcher still shows "Form Master"
- [ ] User not logged out
- [ ] Role persists across refresh ✅

**Verify:**
```javascript
JSON.parse(localStorage.getItem('user')).currentRole
// Should still be: "form_master"
```

---

### **Test 5: Check Audit Logs**

1. Switch to "Admin" role
2. Navigate to `/admin`
3. Open console

**Look for:**
```
🔒 Route Access Audit: {
  timestamp: "2025-01-20...",
  userId: 999999,
  userEmail: "god@god.com",
  currentRole: "admin",
  route: "/admin",
  accessGranted: true
}
```

- [ ] Audit logs appear in console ✅

---

## Step 5: Test Single Role User

### **Set a Teacher with Only One Role:**

```javascript
// Clear current user
localStorage.clear();

// Set single-role teacher
localStorage.setItem('user', JSON.stringify({
  id: 123,
  email: 'teacher@school.com',
  name: 'John Teacher',
  firstName: 'John',
  lastName: 'Teacher',
  primaryRole: 'subject_teacher',
  all_roles: ['subject_teacher'],  // ← Only ONE role
  currentRole: 'subject_teacher',
  gender: 'male',
  subjects: ['Mathematics'],
  requiresPasswordChange: false
}));

// Navigate to subject teacher page
window.location.href = '/subject-teacher';
```

**Expected Results:**
- [ ] Page loads at `/subject-teacher`
- [ ] **RoleSwitcher NOT visible** (only 1 role) ✅
- [ ] Only shows school name, logo, user info

**Test Access Restriction:**
- Try to navigate to: `http://localhost:9000/admin`
- [ ] Should redirect back to `/subject-teacher` (access denied) ✅

**Check Console:**
```
Access denied to /admin. Redirecting to /subject-teacher
```

---

## Step 6: Test UI/UX

### **Visual Checks:**

1. **RoleSwitcher Styling:**
   - [ ] Centered in navbar
   - [ ] Clear, readable font
   - [ ] Dropdown button has hover effect

2. **Dropdown Behavior:**
   - [ ] Click to open → dropdown appears
   - [ ] Click outside → dropdown closes
   - [ ] Active role has blue circle + highlight
   - [ ] Inactive roles have gray circle

3. **Active Role Indicator:**
   - [ ] Active role shows: ✓ and [Active] badge
   - [ ] Active role has blue background
   - [ ] Active role button is disabled (can't click)

---

## Step 7: Test Back Button

1. Start at `/admin` (currentRole: 'admin')
2. Switch to "Class Teacher" (redirects to `/class-teacher`)
3. **Click browser back button**

**Expected Results:**
- [ ] Returns to `/admin` page
- [ ] currentRole still 'class_teacher' (no automatic switch)
- [ ] Admin page loads successfully
- [ ] RoleSwitcher still shows "Class Teacher"

---

## Summary Checklist

**Core Functionality:**
- [ ] Role Switcher appears for multi-role users
- [ ] Role Switcher hidden for single-role users
- [ ] Can switch between roles smoothly
- [ ] Role redirects to correct dashboard
- [ ] Role choice persists after refresh

**Admin Superuser Access:**
- [ ] Admin can access /admin
- [ ] Admin can access /head-teacher
- [ ] Admin can access /form-master ✅ (NEW)
- [ ] Admin can access /class-teacher ✅ (NEW)
- [ ] Admin can access /subject-teacher ✅ (NEW)
- [ ] Access works regardless of currentRole ✅ (KEY FEATURE)

**UI/UX:**
- [ ] RoleSwitcher is visible and clear
- [ ] Dropdown works correctly
- [ ] Active role is highlighted
- [ ] Hover effects work

**Audit Logging:**
- [ ] Console shows audit logs for /admin
- [ ] Logs include timestamp, userId, route
- [ ] Logs show accessGranted status

---

## Known Limitations (Without Backend)

**What WON'T Work:**
- ❌ Actual login (backend required)
- ❌ Fetching real data (students, marks, etc.)
- ❌ API calls
- ❌ Creating/editing users
- ❌ Saving settings

**What WILL Work:**
- ✅ Role switching UI
- ✅ Navigation between pages
- ✅ Route protection logic
- ✅ localStorage persistence
- ✅ Audit logging (console)
- ✅ UI/UX testing

---

## Cleanup After Testing

When done testing:

```javascript
// Clear all test data
localStorage.clear();

// Refresh to logout
window.location.href = '/';
```

---

## Next Steps

**Once Backend is Running:**

1. Run `vercel login` to authenticate Vercel CLI
2. Run `vercel dev` to start with backend support
3. Test actual login with database users
4. Complete full end-to-end testing

**To Deploy:**
```bash
vercel --prod
```

---

## Quick Reference

**God Mode User (Admin with all roles):**
```javascript
localStorage.setItem('user', JSON.stringify({
  id: 999999,
  email: 'god@god.com',
  name: 'Super Admin',
  primaryRole: 'admin',
  all_roles: ['admin', 'head_teacher', 'form_master', 'class_teacher', 'subject_teacher'],
  currentRole: 'admin',
  gender: 'male'
}));
window.location.href = '/admin';
```

**Single-Role Teacher:**
```javascript
localStorage.setItem('user', JSON.stringify({
  id: 123,
  email: 'teacher@school.com',
  name: 'John Teacher',
  primaryRole: 'subject_teacher',
  all_roles: ['subject_teacher'],
  currentRole: 'subject_teacher',
  gender: 'male'
}));
window.location.href = '/subject-teacher';
```

**Check Current User:**
```javascript
JSON.parse(localStorage.getItem('user'))
```

**Check Current Role:**
```javascript
JSON.parse(localStorage.getItem('user')).currentRole
```

**Logout:**
```javascript
localStorage.clear();
window.location.href = '/';
```

---

**Happy Testing! 🎉**

