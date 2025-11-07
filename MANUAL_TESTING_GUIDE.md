# 🧪 Manual Testing Guide for Bug Fixes

## Overview
This guide helps you manually test all the bug fixes applied on November 3, 2025.

**Automated Tests:** ✅ 31/31 PASSED
**ESLint:** ✅ No errors
**Ready for Manual Testing:** ✅ Yes

---

## 🚀 Getting Started

### 1. Start the Development Server

```bash
npm run dev
```

The app should start on `http://localhost:5173` (or similar)

---

## 🔐 Test Suite 1: Authentication & JWT Tokens

### Test 1.1: Basic Login
**What to test:** JWT token handling

**Steps:**
1. Open browser to `http://localhost:5173`
2. Enter valid credentials (e.g., `admin@school.com` / `admin123`)
3. Click "Sign in"

**Expected Result:**
- ✅ Login succeeds
- ✅ Token stored in localStorage (check DevTools → Application → Local Storage)
- ✅ Token is a JWT (three parts separated by dots: `xxx.yyy.zzz`)
- ✅ NOT Base64 encoded user data (should not be easily readable)
- ✅ Redirected to appropriate dashboard

**How to verify:**
```javascript
// Open browser console (F12) and run:
const token = localStorage.getItem('authToken');
console.log('Token:', token);
console.log('Is JWT?', token.split('.').length === 3);

// Try to decode (client-side, no verification)
const payload = JSON.parse(atob(token.split('.')[1]));
console.log('Token payload:', payload);
console.log('Has expiration?', !!payload.exp);
```

---

### Test 1.2: Token Expiration Check
**What to test:** Token verification on app load

**Steps:**
1. Login successfully
2. Open DevTools → Application → Local Storage
3. Find `authToken`
4. Modify the token (change a character)
5. Refresh the page

**Expected Result:**
- ✅ Auto-logout occurs
- ✅ Console shows: "Token expired or invalid. Logging out..."
- ✅ Redirected to login page
- ✅ localStorage cleared

---

### Test 1.3: Session Persistence
**What to test:** Valid tokens persist

**Steps:**
1. Login successfully
2. Refresh the page (F5)

**Expected Result:**
- ✅ Still logged in
- ✅ Console shows: "✓ Session restored successfully"
- ✅ User data intact

---

### Test 1.4: Single Storage Location
**What to test:** No duplicate token storage

**Steps:**
1. Login successfully
2. Open DevTools → Application
3. Check both localStorage AND sessionStorage

**Expected Result:**
- ✅ `authToken` exists in localStorage
- ✅ `authToken` does NOT exist in sessionStorage (or is being migrated)

```javascript
// Verify in console:
console.log('localStorage:', localStorage.getItem('authToken'));
console.log('sessionStorage:', sessionStorage.getItem('authToken'));
// sessionStorage should be null
```

---

## 🔑 Test Suite 2: Password Change

### Test 2.1: Password Change Success
**What to test:** Complete password change flow

**Steps:**
1. Login as a user
2. Navigate to Settings/Profile
3. Find "Change Password" option
4. Enter:
   - Current password: `admin123`
   - New password: `newpass123`
   - Confirm: `newpass123`
5. Submit

**Expected Result:**
- ✅ Shows notification: "Password changed successfully!"
- ✅ NOT a browser alert (blocking dialog)
- ✅ Notification is green (success type)
- ✅ Notification auto-dismisses after ~3 seconds
- ✅ Auto-logout after password change
- ✅ Can login with new password

---

### Test 2.2: Password Validation
**What to test:** Password requirements enforced

**Test Short Password:**
1. Try to change password
2. Enter new password: `12345` (only 5 chars)
3. Submit

**Expected Result:**
- ✅ Shows notification: "Password must be at least 6 characters long"
- ✅ Notification is red (error type)
- ✅ Password NOT changed

**Test Mismatch:**
1. New password: `newpass123`
2. Confirm: `different456`
3. Submit

**Expected Result:**
- ✅ Shows notification: "Passwords do not match!"
- ✅ Notification is red (error type)

---

### Test 2.3: Current Password Verification
**What to test:** Requires correct current password

**Steps:**
1. Enter wrong current password
2. Enter valid new password
3. Submit

**Expected Result:**
- ✅ Error message about incorrect current password
- ✅ Password NOT changed

---

## ✅ Test Suite 3: Data Validation

### Test 3.1: Score Entry Validation (Real-time)
**What to test:** Input validation prevents invalid data

**Navigate to:** Subject Teacher → Enter Scores

**Test Negative Values:**
1. Select a class and subject
2. Try to enter: `-5` in Test 1
3. Type negative sign

**Expected Result:**
- ✅ Cannot type negative values
- ✅ OR shows warning notification
- ✅ Value rejected

**Test Out of Range:**
1. Try to enter `20` in Test 1 (max is 15)
2. Complete typing

**Expected Result:**
- ✅ Shows notification: "Test score cannot exceed 15"
- ✅ Notification is orange/yellow (warning)
- ✅ Value not accepted

**Test Exam Score:**
1. Try to enter `150` in Exam field (max is 100)

**Expected Result:**
- ✅ Shows notification: "Exam score cannot exceed 100"
- ✅ Value not accepted

**Test Non-Numeric:**
1. Try to type letters: `abc`

**Expected Result:**
- ✅ Letters not entered at all
- ✅ Only numbers and decimal point allowed

**Test Decimal Places:**
1. Try to enter: `12.345` (3 decimal places)

**Expected Result:**
- ✅ Limited to 2 decimal places: `12.34`

---

### Test 3.2: Save-Time Validation
**What to test:** Validation before API call

**Steps:**
1. Enter some scores (valid ones)
2. Try to save

**Expected Result:**
- ✅ If all valid: Success notification "Marks saved successfully!"
- ✅ If any invalid: Error notification listing problems
- ✅ Invalid data NOT sent to server

---

### Test 3.3: Calculation Accuracy
**What to test:** No division by zero, proper clamping

**Navigate to:** Admin Dashboard → Analytics

**Steps:**
1. Look at analytics section
2. Check if there are any students with scores

**Expected Result - No Students:**
- ✅ Highest Score: 0 (not NaN)
- ✅ Lowest Score: 0 (not 100!)
- ✅ Average: 0
- ✅ No errors in console

**Expected Result - With Students:**
- ✅ All scores within valid ranges (0-100)
- ✅ Calculations correct
- ✅ No NaN or Infinity values

---

## 🎨 Test Suite 4: Notifications (UX)

### Test 4.1: No More Blocking Alerts
**What to test:** Modern notifications instead of alerts

**Scenarios to test:**
1. Click "Forgot Password" on login page
2. Click "Sign Up" on login page
3. Change password with mismatched passwords
4. Change password successfully

**Expected Result for ALL:**
- ✅ NO browser alert() dialog (blocking)
- ✅ Modern notification appears (non-blocking)
- ✅ Can still interact with page
- ✅ Notification auto-dismisses
- ✅ Color-coded by type:
  - Success: Green
  - Error: Red
  - Warning: Orange/Yellow
  - Info: Blue

---

### Test 4.2: Notification Behavior
**What to test:** User-friendly notifications

**Steps:**
1. Trigger any notification
2. Observe behavior

**Expected Result:**
- ✅ Appears in corner/top of screen
- ✅ Slides in smoothly
- ✅ Auto-dismisses after ~3 seconds
- ✅ Can be manually closed (X button)
- ✅ Multiple notifications stack nicely
- ✅ Accessible (screen readers can read them)

---

## 🔄 Test Suite 5: User Data Normalization

### Test 5.1: Role Consistency
**What to test:** Consistent role data structure

**Steps:**
1. Login as user
2. Open browser console
3. Check user object

```javascript
const user = JSON.parse(localStorage.getItem('user'));
console.log('User roles:', user);
console.log('Has allRoles?', !!user.allRoles);
console.log('Has primaryRole?', !!user.primaryRole);
console.log('Has currentRole?', !!user.currentRole);
console.log('Snake case removed?', user.all_roles === undefined);
```

**Expected Result:**
- ✅ User has `allRoles` (camelCase)
- ✅ User has `primaryRole` (camelCase)
- ✅ User has `currentRole` (camelCase)
- ✅ NO `all_roles` (snake_case removed)
- ✅ NO `teacher_primary_role` (snake_case removed)

---

### Test 5.2: Role Switching
**What to test:** Role switching works with normalized data

**Steps:**
1. Login as user with multiple roles
2. Switch role (if UI available)
3. Check console

**Expected Result:**
- ✅ Role switch succeeds
- ✅ currentRole updated
- ✅ No errors in console
- ✅ Permissions update correctly

---

## 🐛 Test Suite 6: Error Handling

### Test 6.1: Proper Error Logging
**What to test:** Errors logged to console

**Steps:**
1. Open DevTools Console
2. Disconnect internet OR stop backend server
3. Try to load data (refresh page)

**Expected Result:**
- ✅ Error logged to console with details
- ✅ Console shows: "❌ Error loading data: ..."
- ✅ User sees friendly error message
- ✅ NOT a misleading success message

---

### Test 6.2: Network Error Handling
**What to test:** Graceful handling of network issues

**Steps:**
1. Login successfully
2. Disconnect internet
3. Try to save data or navigate

**Expected Result:**
- ✅ Error notification shown
- ✅ Message explains the issue
- ✅ App doesn't crash
- ✅ Can retry after reconnecting

---

## 📊 Test Results Tracking

### Checklist

#### Authentication & JWT (4 tests)
- [ ] Basic Login - JWT tokens
- [ ] Token Expiration Check
- [ ] Session Persistence
- [ ] Single Storage Location

#### Password Change (3 tests)
- [ ] Password Change Success
- [ ] Password Validation
- [ ] Current Password Verification

#### Data Validation (3 tests)
- [ ] Score Entry Validation (Real-time)
- [ ] Save-Time Validation
- [ ] Calculation Accuracy

#### Notifications (2 tests)
- [ ] No More Blocking Alerts
- [ ] Notification Behavior

#### User Data (2 tests)
- [ ] Role Consistency
- [ ] Role Switching

#### Error Handling (2 tests)
- [ ] Proper Error Logging
- [ ] Network Error Handling

---

## 🎯 Success Criteria

**All Tests Pass If:**
- ✅ All automated tests passed (31/31)
- ✅ No ESLint errors
- ✅ Application compiles without errors
- ✅ Manual tests pass without critical issues
- ✅ No console errors during normal use
- ✅ User experience is smooth

---

## 🔧 Troubleshooting

### Issue: Token verification fails
**Solution:** Check that JWT_SECRET is set correctly

### Issue: Notifications not appearing
**Solution:** Check NotificationContext is providing the hook

### Issue: Validation not working
**Solution:** Verify validation functions are imported

### Issue: Build fails
**Solution:** Run `npm install` and check for dependency issues

---

## 📝 Reporting Issues

If you find bugs during testing:

1. **Note the exact steps** to reproduce
2. **Check browser console** for errors
3. **Screenshot** the issue if UI-related
4. **Check Network tab** for API errors
5. **Report with details** to development team

---

**Happy Testing! 🎉**

Remember: The goal is to verify all fixes work correctly in a real browser environment.
