# Testing Session Guide - Role Switching

**Date:** 2025-01-20
**Server Status:** ✅ Running on http://localhost:9000
**Tester:** _____________

---

## Pre-Testing Checklist

- [x] Development server is running
- [ ] Browser DevTools open (F12)
- [ ] Console tab visible
- [ ] Network tab ready
- [ ] Clear browser cache (Ctrl + Shift + R)

---

## Test Session 1: God Mode Login (Multiple Roles)

### **Objective:** Verify admin with all roles can login and see role switcher

### **Steps:**

1. **Open Browser:**
   - Navigate to: `http://localhost:9000`
   - Should see login page

2. **Login with God Mode:**
   ```
   Email: god@god.com
   Password: god123
   ```

3. **Expected Results:**
   - [ ] Login successful
   - [ ] Redirected to `/admin` page
   - [ ] Navbar shows **RoleSwitcher** dropdown in center
   - [ ] RoleSwitcher displays: "Administrator ▼"
   - [ ] No errors in console

4. **Verify Role Switcher:**
   - Click on "Administrator ▼" dropdown
   - Should see 5 roles:
     - [ ] ✓ Administrator [Active]
     - [ ] ○ Head Teacher
     - [ ] ○ Form Master
     - [ ] ○ Class Teacher
     - [ ] ○ Subject Teacher

5. **Check Console:**
   ```javascript
   // Type in console:
   JSON.parse(localStorage.getItem('user'))
   ```

   **Expected output:**
   ```json
   {
     "id": 999999,
     "email": "god@god.com",
     "name": "Super Admin",
     "primaryRole": "admin",
     "allRoles": ["admin", "head_teacher", "form_master", "class_teacher", "subject_teacher"],
     "currentRole": "admin"
   }
   ```

**Status:** [ ] Pass [ ] Fail

**Notes:**
_________________________________________________

---

## Test Session 2: Admin Superuser Access

### **Objective:** Verify admin can access ALL pages without switching roles

### **Steps:**

1. **Ensure you're logged in as God Mode (currentRole: 'admin')**

2. **Test Access to Each Route:**

   **Route: /admin**
   - Manually navigate to: `http://localhost:9000/admin`
   - [ ] Page loads successfully
   - [ ] No redirect
   - [ ] RoleSwitcher still shows "Administrator"

   **Route: /head-teacher**
   - Navigate to: `http://localhost:9000/head-teacher`
   - [ ] Page loads successfully
   - [ ] No redirect
   - [ ] RoleSwitcher still shows "Administrator"
   - [ ] Should see Head Teacher dashboard content

   **Route: /form-master**
   - Navigate to: `http://localhost:9000/form-master`
   - [ ] Page loads successfully ✅ (NEW - previously blocked)
   - [ ] No redirect
   - [ ] RoleSwitcher still shows "Administrator"

   **Route: /class-teacher**
   - Navigate to: `http://localhost:9000/class-teacher`
   - [ ] Page loads successfully ✅ (NEW - previously blocked)
   - [ ] No redirect
   - [ ] RoleSwitcher still shows "Administrator"

   **Route: /subject-teacher**
   - Navigate to: `http://localhost:9000/subject-teacher`
   - [ ] Page loads successfully
   - [ ] No redirect
   - [ ] RoleSwitcher still shows "Administrator"

3. **Check Console for Audit Logs:**
   - Look for logs like:
   ```
   🔒 Route Access Audit: {
     timestamp: "...",
     userId: 999999,
     currentRole: "admin",
     route: "/admin",
     accessGranted: true
   }
   ```
   - [ ] Audit logs appear for /admin
   - [ ] Audit logs appear for /manage-users (if navigated)
   - [ ] Audit logs appear for /school-setup (if navigated)

**Status:** [ ] Pass [ ] Fail

**Notes:**
_________________________________________________

---

## Test Session 3: Role Switching - Admin to Class Teacher

### **Objective:** Verify role switching works correctly

### **Steps:**

1. **Start from /admin page (currentRole: 'admin')**

2. **Switch to Class Teacher:**
   - Click RoleSwitcher dropdown
   - Click "Class Teacher"

3. **Expected Results:**
   - [ ] Dropdown closes
   - [ ] Automatic redirect to `/class-teacher`
   - [ ] RoleSwitcher now shows: "Class Teacher"
   - [ ] URL is: `http://localhost:9000/class-teacher`

4. **Check Console:**
   ```javascript
   // Should see:
   console.log("Role switched: admin → class_teacher")

   // Verify in localStorage:
   JSON.parse(localStorage.getItem('user')).currentRole
   // Should return: "class_teacher"
   ```

5. **Verify Admin Access Still Works:**
   - Manually navigate to: `http://localhost:9000/admin`
   - [ ] Page loads (admin superuser access)
   - [ ] RoleSwitcher still shows "Class Teacher"
   - [ ] Can still access admin functions

**Status:** [ ] Pass [ ] Fail

**Notes:**
_________________________________________________

---

## Test Session 4: Role Switching - Class Teacher to Form Master

### **Objective:** Verify switching between non-admin roles

### **Steps:**

1. **Ensure currentRole is 'class_teacher'**

2. **Switch to Form Master:**
   - Click RoleSwitcher dropdown
   - Click "Form Master"

3. **Expected Results:**
   - [ ] Redirect to `/form-master`
   - [ ] RoleSwitcher shows: "Form Master" (or "Form Mistress")
   - [ ] Can view form master dashboard

4. **Switch to Subject Teacher:**
   - Click RoleSwitcher dropdown
   - Click "Subject Teacher"
   - [ ] Redirect to `/subject-teacher`
   - [ ] RoleSwitcher shows: "Subject Teacher"

5. **Switch Back to Admin:**
   - Click RoleSwitcher dropdown
   - Click "Administrator"
   - [ ] Redirect to `/admin`
   - [ ] Back to admin dashboard

**Status:** [ ] Pass [ ] Fail

**Notes:**
_________________________________________________

---

## Test Session 5: Role Persistence

### **Objective:** Verify role choice persists across page refreshes

### **Steps:**

1. **Switch to "Head Teacher" role**
   - Click RoleSwitcher → "Head Teacher"
   - Verify redirect to `/head-teacher`

2. **Refresh the page (F5)**

3. **Expected Results:**
   - [ ] Still on `/head-teacher` page
   - [ ] RoleSwitcher still shows "Head Teacher"
   - [ ] currentRole still 'head_teacher' in localStorage
   - [ ] No logout
   - [ ] Page loads correctly

4. **Test with Different Role:**
   - Switch to "Form Master"
   - Refresh page (F5)
   - [ ] Still in Form Master mode

5. **Test with Hard Refresh:**
   - Switch to "Class Teacher"
   - Hard refresh (Ctrl + Shift + R)
   - [ ] Still in Class Teacher mode
   - [ ] Cache cleared but role persists

**Status:** [ ] Pass [ ] Fail

**Notes:**
_________________________________________________

---

## Test Session 6: Single Role Teacher (No Switcher)

### **Objective:** Verify teachers with only one role don't see switcher

### **Setup Required:**

You'll need to create a test teacher account with only one role.

**Option 1: Use Admin Dashboard**
1. Login as admin
2. Go to `/manage-users`
3. Add new teacher:
   ```
   Name: Test Teacher
   Email: test@teacher.com
   Password: test123
   Primary Role: subject_teacher
   All Roles: [subject_teacher]  ← Only one role
   ```

**Option 2: Use God Mode to Check Current Teachers**
1. Check if there are existing teachers with single roles
2. Reset their password if needed

### **Test Steps:**

1. **Logout from God Mode**
   - Click logout button
   - Should redirect to login page

2. **Login as Single-Role Teacher:**
   ```
   Email: test@teacher.com
   Password: test123
   ```

3. **Expected Results:**
   - [ ] Login successful
   - [ ] Redirected to `/subject-teacher`
   - [ ] **RoleSwitcher NOT visible** in navbar ✅
   - [ ] Only school name, logo, and user info visible

4. **Test Access Restrictions:**
   - Try to navigate to: `http://localhost:9000/admin`
   - [ ] Should redirect to `/subject-teacher` (access denied)
   - Try to navigate to: `http://localhost:9000/form-master`
   - [ ] Should redirect to `/subject-teacher` (access denied)

5. **Check Console:**
   ```
   Access denied to /admin. Redirecting to /subject-teacher
   ```
   - [ ] Console shows access denied messages

**Status:** [ ] Pass [ ] Fail

**Notes:**
_________________________________________________

---

## Test Session 7: Audit Logging

### **Objective:** Verify sensitive routes are being logged

### **Steps:**

1. **Login as God Mode**

2. **Clear Console (Ctrl + L)**

3. **Navigate to Sensitive Routes:**
   - Go to `/admin`
   - Go to `/manage-users`
   - Go to `/school-setup`

4. **Check Console Output:**

   Should see entries like:
   ```javascript
   🔒 Route Access Audit: {
     timestamp: "2025-01-20T...",
     userId: 999999,
     userEmail: "god@god.com",
     currentRole: "admin",
     route: "/admin",
     accessGranted: true
   }
   ```

5. **Verify Audit Data:**
   - [ ] timestamp is present and valid
   - [ ] userId matches logged-in user
   - [ ] currentRole is correct
   - [ ] route is correct
   - [ ] accessGranted is true for admin

6. **Navigate to Non-Sensitive Route:**
   - Go to `/subject-teacher`
   - [ ] No audit log (or minimal logging)

**Status:** [ ] Pass [ ] Fail

**Notes:**
_________________________________________________

---

## Test Session 8: Back Button Behavior

### **Objective:** Verify browser back button works correctly

### **Steps:**

1. **Start at /admin (currentRole: 'admin')**

2. **Switch to "Class Teacher"**
   - Should redirect to `/class-teacher`
   - currentRole is now 'class_teacher'

3. **Click Browser Back Button**

4. **Expected Results:**
   - [ ] Returns to `/admin` page
   - [ ] currentRole still 'class_teacher' (no automatic role change)
   - [ ] Admin page loads successfully (admin access works)
   - [ ] RoleSwitcher still shows "Class Teacher"

5. **Click Forward Button**
   - [ ] Returns to `/class-teacher`
   - [ ] Everything works normally

**Status:** [ ] Pass [ ] Fail

**Notes:**
_________________________________________________

---

## Test Session 9: Direct URL Access

### **Objective:** Verify typing URLs directly in address bar works

### **Steps:**

1. **Login as God Mode**

2. **Switch to "Subject Teacher" role**
   - currentRole is now 'subject_teacher'

3. **Type URL Directly:**
   - In address bar, type: `http://localhost:9000/admin`
   - Press Enter

4. **Expected Results:**
   - [ ] Page loads successfully (admin access)
   - [ ] No redirect
   - [ ] RoleSwitcher still shows "Subject Teacher"
   - [ ] Can use admin functions

5. **Test Multiple URLs:**
   - Type: `/form-master` → [ ] Loads
   - Type: `/class-teacher` → [ ] Loads
   - Type: `/head-teacher` → [ ] Loads

**Status:** [ ] Pass [ ] Fail

**Notes:**
_________________________________________________

---

## Test Session 10: Concurrent Sessions

### **Objective:** Verify multiple browser sessions work independently

### **Steps:**

1. **In Chrome:**
   - Login as God Mode
   - Switch to "Admin" role
   - Stay on `/admin` page

2. **In Firefox (or Incognito):**
   - Open `http://localhost:9000`
   - Login as God Mode
   - Switch to "Class Teacher" role

3. **Expected Results:**
   - [ ] Chrome session: currentRole = 'admin'
   - [ ] Firefox session: currentRole = 'class_teacher'
   - [ ] Sessions are independent
   - [ ] Switching in one doesn't affect the other

4. **Switch Role in Chrome:**
   - Switch Chrome to "Form Master"
   - Check Firefox → [ ] Still "Class Teacher"

**Status:** [ ] Pass [ ] Fail

**Notes:**
_________________________________________________

---

## Test Session 11: Error Handling - Invalid Role

### **Objective:** Verify system handles invalid role switches

### **Steps:**

1. **Login as God Mode**

2. **Open Console**

3. **Try Invalid Role Switch:**
   ```javascript
   // Get auth context (you may need to expose this)
   // Or try to manipulate localStorage:

   const user = JSON.parse(localStorage.getItem('user'));
   user.currentRole = 'hacker_role';  // Invalid role
   localStorage.setItem('user', JSON.stringify(user));

   // Refresh page
   window.location.reload();
   ```

4. **Expected Results:**
   - [ ] System should handle gracefully
   - [ ] Either resets to primaryRole or shows error
   - [ ] User not stuck in broken state
   - [ ] Can still navigate

**Status:** [ ] Pass [ ] Fail

**Notes:**
_________________________________________________

---

## Test Session 12: UI/UX Testing

### **Objective:** Verify user interface looks and feels good

### **Steps:**

1. **Visual Inspection:**
   - [ ] RoleSwitcher is centered in navbar
   - [ ] Dropdown is properly styled
   - [ ] Active role has blue highlight
   - [ ] Inactive roles have gray circle
   - [ ] Hover effect works (light blue background)
   - [ ] Font sizes are readable
   - [ ] Icons are crisp

2. **Dropdown Behavior:**
   - Click to open → [ ] Opens smoothly
   - Click outside → [ ] Closes
   - Click on role → [ ] Closes and switches
   - Press ESC → [ ] Should close (if implemented)

3. **Mobile Testing (if applicable):**
   - Resize browser to mobile width
   - [ ] RoleSwitcher still visible
   - [ ] Dropdown not cut off
   - [ ] Touch targets adequate

**Status:** [ ] Pass [ ] Fail

**Notes:**
_________________________________________________

---

## Known Issues Found

| Issue # | Description | Severity | Status |
|---------|-------------|----------|--------|
| 1       |             |          |        |
| 2       |             |          |        |
| 3       |             |          |        |

---

## Test Summary

**Total Tests:** 12
**Passed:** ___
**Failed:** ___
**Blocked:** ___

**Overall Status:** [ ] Pass [ ] Fail [ ] Needs Attention

---

## Sign-Off

**Tested By:** _________________
**Date:** _________________
**Time Spent:** _________________
**Browser:** Chrome ___ / Firefox ___ / Safari ___ / Edge ___
**OS:** Windows ___ / Mac ___ / Linux ___

**Comments:**
_________________________________________________
_________________________________________________
_________________________________________________

**Ready for Production:** [ ] Yes [ ] No [ ] With Fixes

---

## Next Actions Required

Based on testing results:

1. [ ] Fix critical bugs
2. [ ] Address UI issues
3. [ ] Update documentation
4. [ ] Create user training materials
5. [ ] Deploy to production
6. [ ] Monitor in production

**Priority:**
- [ ] High
- [ ] Medium
- [ ] Low

**Assigned To:** _________________

---

## Additional Notes

_________________________________________________
_________________________________________________
_________________________________________________
_________________________________________________

