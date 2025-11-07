# Role Switching Test Plan

## Overview
This document provides a comprehensive testing plan for the role switching functionality, especially for admins with multiple teacher roles.

---

## Test Environment Setup

### Test Users Required

1. **Super Admin (God Mode)**
   - Email: `god@god.com`
   - Password: `god123`
   - Roles: `['admin', 'head_teacher', 'form_master', 'class_teacher', 'subject_teacher']`
   - Purpose: Test all roles and switching

2. **Admin + Class Teacher**
   - Email: `admin.ct@school.com`
   - Roles: `['admin', 'class_teacher']`
   - Purpose: Test dual-role admin

3. **Admin + Form Master**
   - Email: `admin.fm@school.com`
   - Roles: `['admin', 'form_master']`
   - Purpose: Test admin with senior level responsibility

4. **Single Role Teacher**
   - Email: `teacher@school.com`
   - Roles: `['subject_teacher']`
   - Purpose: Test basic teacher (no role switcher)

5. **Multi-Role Teacher (No Admin)**
   - Email: `multi.teacher@school.com`
   - Roles: `['class_teacher', 'subject_teacher']`
   - Purpose: Test teacher role switching without admin privileges

---

## Test Cases

### **TC-001: Admin with Multiple Roles - Login**

**User:** Super Admin (god@god.com)

**Steps:**
1. Navigate to login page
2. Enter email: `god@god.com`
3. Enter password: `god123`
4. Click "Login"

**Expected Results:**
- ✅ Login successful
- ✅ Redirected to `/admin` page
- ✅ Navbar shows RoleSwitcher dropdown
- ✅ Current role displayed: "Administrator"
- ✅ Dropdown contains 5 roles when opened
- ✅ "Administrator" marked as active

**Status:** [ ]

---

### **TC-002: Admin Access to All Pages Without Switching**

**User:** Super Admin (god@god.com)

**Precondition:** Logged in as admin (currentRole = 'admin')

**Steps:**
1. Manually navigate to `/admin` - should load ✅
2. Manually navigate to `/head-teacher` - should load ✅
3. Manually navigate to `/form-master` - should load ✅
4. Manually navigate to `/class-teacher` - should load ✅
5. Manually navigate to `/subject-teacher` - should load ✅

**Expected Results:**
- ✅ All pages load successfully
- ✅ No redirects
- ✅ RoleSwitcher still shows "Administrator" as active
- ✅ No errors in console

**Status:** [ ]

---

### **TC-003: Role Switching - Admin to Class Teacher**

**User:** Super Admin

**Precondition:** Logged in as admin

**Steps:**
1. Click RoleSwitcher dropdown
2. Click "Class Teacher"

**Expected Results:**
- ✅ Dropdown closes
- ✅ Redirected to `/class-teacher` page
- ✅ RoleSwitcher now shows "Class Teacher" as active
- ✅ localStorage updated with `currentRole: 'class_teacher'`
- ✅ Console log shows role switch event
- ✅ Can still manually navigate to `/admin` (admin privilege)

**Status:** [ ]

---

### **TC-004: Role Switching - Class Teacher to Form Master**

**User:** Super Admin

**Precondition:** Currently in "Class Teacher" role

**Steps:**
1. Click RoleSwitcher dropdown
2. Click "Form Master"

**Expected Results:**
- ✅ Redirected to `/form-master` page
- ✅ RoleSwitcher shows "Form Master" (or "Form Mistress" if female)
- ✅ Previous role ("Class Teacher") still available in dropdown
- ✅ Can switch back to any role

**Status:** [ ]

---

### **TC-005: Role Switching Persistence**

**User:** Super Admin

**Precondition:** Switched to "Form Master" role

**Steps:**
1. Note current role: "Form Master"
2. Refresh the page (F5)

**Expected Results:**
- ✅ Still on `/form-master` page
- ✅ RoleSwitcher still shows "Form Master" as active
- ✅ localStorage still has `currentRole: 'form_master'`
- ✅ User not logged out

**Status:** [ ]

---

### **TC-006: Single Role Teacher - No RoleSwitcher**

**User:** Single Role Teacher (teacher@school.com)

**Steps:**
1. Login as teacher@school.com
2. Check navbar

**Expected Results:**
- ✅ Login successful
- ✅ Redirected to `/subject-teacher`
- ✅ RoleSwitcher NOT visible in navbar
- ✅ Cannot access `/admin` (redirects back)
- ✅ Cannot access `/form-master` (redirects back)

**Status:** [ ]

---

### **TC-007: Multi-Role Teacher Without Admin**

**User:** Multi-Role Teacher (class_teacher + subject_teacher)

**Steps:**
1. Login as multi.teacher@school.com
2. Check RoleSwitcher

**Expected Results:**
- ✅ RoleSwitcher visible (2 roles)
- ✅ Can switch between Class Teacher and Subject Teacher
- ✅ Cannot access `/admin` page (no admin role)
- ✅ Redirects to appropriate teacher dashboard

**Status:** [ ]

---

### **TC-008: Invalid Role Switch Attempt**

**User:** Single Role Teacher

**Precondition:** Logged in with only 'subject_teacher' role

**Steps:**
1. Open browser console
2. Execute: `localStorage.setItem('user', JSON.stringify({...user, currentRole: 'admin'}))`
3. Refresh page
4. Try to access `/admin`

**Expected Results:**
- ✅ `switchRole('admin')` returns false
- ✅ Redirect away from `/admin` page
- ✅ Console shows "Access denied" message
- ✅ User cannot gain admin access

**Status:** [ ]

---

### **TC-009: Logout and Re-login**

**User:** Super Admin

**Precondition:** Switched to "Form Master" role

**Steps:**
1. Click logout button
2. Login again with same credentials

**Expected Results:**
- ✅ Logout successful
- ✅ localStorage cleared
- ✅ After re-login, currentRole resets to 'admin' (primary role)
- ✅ RoleSwitcher shows "Administrator"

**Status:** [ ]

---

### **TC-010: Role Context Indicator**

**User:** Super Admin

**Steps:**
1. Login as admin
2. Switch to "Class Teacher"
3. Navigate to different pages

**Expected Results:**
- ✅ RoleSwitcher always shows current active role
- ✅ Active role highlighted in dropdown
- ✅ Visual indicator consistent across all pages

**Status:** [ ]

---

### **TC-011: Concurrent Sessions**

**User:** Super Admin

**Steps:**
1. Login in Chrome (currentRole: 'admin')
2. Login in Firefox (currentRole: 'admin')
3. In Chrome, switch to "Class Teacher"
4. Check Firefox

**Expected Results:**
- ✅ Chrome session: currentRole = 'class_teacher'
- ✅ Firefox session: currentRole = 'admin' (unchanged)
- ✅ Sessions are independent
- ✅ No cross-session interference

**Status:** [ ]

---

### **TC-012: Route Protection - Admin Can Access All**

**User:** Admin + Class Teacher

**Steps:**
1. Login as admin
2. Navigate to `/class-teacher`
3. Navigate to `/subject-teacher`
4. Navigate to `/admin`

**Expected Results:**
- ✅ All pages accessible
- ✅ No unnecessary role switching required
- ✅ Admin superuser access works

**Status:** [ ]

---

### **TC-013: Audit Logging**

**User:** Super Admin

**Steps:**
1. Open browser console
2. Navigate to `/admin`
3. Navigate to `/school-setup`
4. Navigate to `/manage-users`
5. Check console logs

**Expected Results:**
- ✅ Console shows "🔒 Route Access Audit:" logs
- ✅ Logs include: timestamp, userId, route, accessGranted
- ✅ Sensitive routes logged
- ✅ Non-sensitive routes not logged (optional)

**Status:** [ ]

---

### **TC-014: Gender-Based Role Display**

**User:** Female Form Master

**Steps:**
1. Login as female teacher with 'form_master' role
2. Check RoleSwitcher display

**Expected Results:**
- ✅ Shows "Form Mistress" (not "Form Master")
- ✅ Gender-appropriate title used

**User:** Male Form Master

**Expected Results:**
- ✅ Shows "Form Master"

**Status:** [ ]

---

### **TC-015: Navigation After Role Switch**

**User:** Super Admin

**Steps:**
1. Login as admin (on `/admin` page)
2. Switch to "Class Teacher"
3. Check URL

**Expected Results:**
- ✅ Automatically redirects to `/class-teacher`
- ✅ Doesn't stay on `/admin` page
- ✅ Smooth transition (no flash)

**Status:** [ ]

---

### **TC-016: Back Button After Role Switch**

**User:** Super Admin

**Steps:**
1. On `/admin` page (currentRole: 'admin')
2. Switch to "Class Teacher" (redirects to `/class-teacher`)
3. Click browser back button

**Expected Results:**
- ✅ Goes back to `/admin` page
- ✅ currentRole still 'class_teacher' (no role change)
- ✅ Admin access still works (can view `/admin`)
- ✅ RoleSwitcher still shows "Class Teacher"

**Status:** [ ]

---

### **TC-017: Direct URL Access**

**User:** Admin + Class Teacher

**Precondition:** Logged in as 'class_teacher' role

**Steps:**
1. Manually type `/admin` in URL bar
2. Press Enter

**Expected Results:**
- ✅ Page loads (admin superuser access)
- ✅ No redirect
- ✅ currentRole remains 'class_teacher'
- ✅ Can still access admin pages

**Status:** [ ]

---

### **TC-018: Error Handling - Invalid Role**

**Steps:**
1. Login as admin
2. Open console
3. Execute: `switchRole('invalid_role')`

**Expected Results:**
- ✅ Function returns false
- ✅ Console error: "Invalid role switch attempt: invalid_role"
- ✅ currentRole unchanged
- ✅ No redirect

**Status:** [ ]

---

### **TC-019: Role Switcher UI Behavior**

**User:** Super Admin

**Steps:**
1. Click RoleSwitcher dropdown (opens)
2. Click outside the dropdown
3. Dropdown should close

**Expected Results:**
- ✅ Dropdown closes when clicking outside
- ✅ Dropdown closes when selecting a role
- ✅ Dropdown toggles on button click
- ✅ Active role visually distinct (blue highlight)

**Status:** [ ]

---

### **TC-020: Performance - Role Switch Speed**

**User:** Super Admin

**Steps:**
1. Click RoleSwitcher
2. Click "Class Teacher"
3. Measure time to redirect

**Expected Results:**
- ✅ Redirect happens in < 200ms
- ✅ No visible lag
- ✅ Smooth user experience

**Status:** [ ]

---

## Browser Compatibility Testing

Test all above scenarios in:

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

---

## Mobile Responsive Testing

Test role switcher on:

- [ ] Mobile (< 640px)
- [ ] Tablet (640px - 1024px)
- [ ] Desktop (> 1024px)

**Verify:**
- ✅ RoleSwitcher visible and functional
- ✅ Dropdown not cut off
- ✅ Touch targets adequate (min 44px)

---

## Regression Testing

After implementing changes, verify these still work:

- [ ] Normal login/logout
- [ ] Password reset
- [ ] Form submissions
- [ ] Data loading on dashboards
- [ ] Marks entry
- [ ] Report generation
- [ ] School settings

---

## Security Testing

### **ST-001: JWT Token Integrity**

**Steps:**
1. Login and get JWT token
2. Decode token (use jwt.io)
3. Verify `allRoles` is in token
4. Modify token manually
5. Try to use modified token

**Expected:**
- ✅ Server rejects tampered token
- ✅ User logged out

---

### **ST-002: LocalStorage Manipulation**

**Steps:**
1. Login as teacher
2. Open console
3. Modify localStorage: `user.all_roles.push('admin')`
4. Refresh and try to access `/admin`

**Expected:**
- ✅ Backend rejects (token doesn't have admin)
- ✅ Frontend may show page but API calls fail
- ✅ No actual admin access granted

---

### **ST-003: Session Hijacking Prevention**

**Steps:**
1. Login on Device A
2. Copy localStorage to Device B
3. Try to use on Device B

**Expected:**
- ✅ JWT token has expiration
- ✅ Token expires after 24 hours
- ✅ Cannot use indefinitely

---

## Test Results Summary

| Test Case | Status | Notes |
|-----------|--------|-------|
| TC-001 | ⬜ | |
| TC-002 | ⬜ | |
| TC-003 | ⬜ | |
| TC-004 | ⬜ | |
| TC-005 | ⬜ | |
| TC-006 | ⬜ | |
| TC-007 | ⬜ | |
| TC-008 | ⬜ | |
| TC-009 | ⬜ | |
| TC-010 | ⬜ | |
| TC-011 | ⬜ | |
| TC-012 | ⬜ | |
| TC-013 | ⬜ | |
| TC-014 | ⬜ | |
| TC-015 | ⬜ | |
| TC-016 | ⬜ | |
| TC-017 | ⬜ | |
| TC-018 | ⬜ | |
| TC-019 | ⬜ | |
| TC-020 | ⬜ | |

---

## How to Run Tests

### Manual Testing

1. **Start Development Server:**
   ```bash
   npm run dev
   ```

2. **Open Browser Console:**
   - Press F12 to open DevTools
   - Monitor console for logs and errors

3. **Use Test Users:**
   - Use God Mode for comprehensive testing
   - Create additional test users as needed

4. **Execute Test Cases:**
   - Follow each test case step-by-step
   - Check off expected results
   - Note any discrepancies

### Automated Testing (Future)

Consider adding E2E tests using:
- Playwright
- Cypress
- Vitest + Testing Library

Example test:
```javascript
test('Admin can switch to class teacher role', async () => {
  await login('god@god.com', 'god123');
  await expect(page).toHaveURL('/admin');

  await page.click('[aria-label="Switch role"]');
  await page.click('text=Class Teacher');

  await expect(page).toHaveURL('/class-teacher');
  await expect(page.locator('text=Class Teacher')).toBeVisible();
});
```

---

## Bug Report Template

If you find issues, report using this format:

```
**Bug ID:** BUG-001
**Severity:** Critical / High / Medium / Low
**Test Case:** TC-003
**Steps to Reproduce:**
1. Login as admin
2. Click RoleSwitcher
3. Click "Class Teacher"

**Expected Result:**
Redirects to /class-teacher

**Actual Result:**
Error: Cannot read property 'switchRole' of undefined

**Screenshots:**
[Attach screenshot]

**Browser:** Chrome 120
**Date:** 2025-01-15
```

---

## Sign-Off

Once all tests pass, complete this section:

**Tested By:** _________________
**Date:** _________________
**Overall Status:** Pass / Fail
**Notes:**

---

**Ready for Production:** [ ] Yes [ ] No

