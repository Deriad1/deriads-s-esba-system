# Role Switching Guide for Admins with Multiple Roles

## Overview

This guide explains how admins who also hold teacher positions (Class Teacher, Form Master, Subject Teacher, Head Teacher) can seamlessly switch between roles in the eSBA system.

---

## Current System Architecture

### 1. **User Role Structure**

Every user has three role-related properties:

- **`primaryRole`**: The user's main role (e.g., 'admin')
- **`allRoles`**: Array of ALL roles the user has (e.g., `['admin', 'head_teacher', 'class_teacher']`)
- **`currentRole`**: The role currently being used (switches dynamically)

### 2. **How Role Switching Works**

```
┌─────────────────────────────────────────────────────────────┐
│                          LOGIN                               │
│  allRoles: ['admin', 'class_teacher', 'form_master']        │
│  currentRole: 'admin' (initial)                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    ROLE SWITCHER UI                          │
│  [Dropdown showing all 3 roles]                             │
│  ✓ Administrator (Active)                                   │
│  ○ Class Teacher                                            │
│  ○ Form Master                                              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼ (User clicks "Class Teacher")
┌─────────────────────────────────────────────────────────────┐
│                    SWITCH ROLE                               │
│  1. Validate role exists in allRoles                        │
│  2. Update currentRole to 'class_teacher'                   │
│  3. Save to localStorage                                    │
│  4. Dispatch 'roleChanged' event                            │
│  5. Navigate to /class-teacher                              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   ROUTE PROTECTION                           │
│  Check: currentRole === 'class_teacher'                     │
│  Result: ✓ Access Granted to Class Teacher Page            │
└─────────────────────────────────────────────────────────────┘
```

---

## Component Breakdown

### **RoleSwitcher Component** ([src/components/RoleSwitcher.jsx](src/components/RoleSwitcher.jsx))

**Location:** Displayed in navbar (center position)

**Behavior:**
- Only appears if user has 2+ roles
- Shows current active role
- Dropdown lists all available roles
- Clicking a role triggers switch and navigation

**Code Flow:**
```javascript
const handleRoleSwitch = (newRole) => {
  const success = switchRole(newRole); // Update auth context

  if (success) {
    // Auto-navigate to appropriate dashboard
    navigate('/class-teacher'); // Example
  }
};
```

---

### **AuthContext switchRole Function** ([src/context/AuthContext.jsx](src/context/AuthContext.jsx:73-100))

**Security Checks:**
1. ✅ Validates user is logged in
2. ✅ Validates new role exists in `user.all_roles`
3. ✅ Updates `currentRole` in state and localStorage
4. ✅ Broadcasts `roleChanged` event for reactive components

**Example:**
```javascript
switchRole('form_master')
// Returns: true if successful, false if invalid
```

---

### **Protected Routes** ([src/Routes.jsx](src/Routes.jsx))

**How Access is Determined:**
```javascript
const ProtectedRoute = ({ children, allowedRoles }) => {
  const currentRole = user.currentRole || user.primaryRole;

  // Check if active role is in allowed list
  if (!allowedRoles.includes(currentRole)) {
    return <Navigate to={appropriateDashboard} />;
  }

  return children;
};
```

---

## Current Issues & Improvements Needed

### **Issue 1: Inconsistent Admin Access**

**Problem:**
- Head Teacher route allows admins: ✅ `allowedRoles={['head_teacher', 'admin']}`
- Form Master route blocks admins: ❌ `allowedRoles={['form_master']}`
- Class Teacher route blocks admins: ❌ `allowedRoles={['class_teacher']}`

**Impact:**
- An admin who is also a Form Master must switch to `currentRole: 'form_master'` to access `/form-master`
- This is inconsistent and confusing

**Solution:**
Allow admins to access ALL pages regardless of currentRole (see Implementation Plan below)

---

### **Issue 2: No Role Access Helper**

**Problem:**
Route protection logic is duplicated across multiple files:
- `Routes.jsx` - Main routing
- `ProtectedRoute.jsx` - Alternative protection
- `Layout.jsx` - Settings button visibility

**Solution:**
Create centralized `canAccessRoute()` helper function

---

### **Issue 3: No Role Switching Persistence Strategy**

**Problem:**
When admin switches to Class Teacher role, then refreshes page:
- Current: Stays as Class Teacher (from localStorage)
- Expected: Unclear if this is desired behavior

**Recommendation:**
Document expected behavior:
- **Option A:** Always reset to primaryRole on refresh (more predictable)
- **Option B:** Persist currentRole across sessions (current behavior)

---

## Implementation Plan

### **Step 1: Create Role Access Helper** ✅

Create `src/utils/routeAccessHelper.js`:

```javascript
/**
 * Determines if a user can access a route based on their roles
 *
 * @param {Object} user - User object with allRoles and currentRole
 * @param {Array} allowedRoles - Roles that can access the route
 * @returns {boolean} - True if user can access
 */
export const canAccessRoute = (user, allowedRoles) => {
  if (!user || !allowedRoles) return false;

  const allRoles = user.all_roles || [];
  const currentRole = user.currentRole || user.primaryRole;

  // Admins can access everything
  if (allRoles.includes('admin')) {
    return true;
  }

  // Otherwise, check if current role is allowed
  return allowedRoles.includes(currentRole);
};

/**
 * Gets the appropriate redirect route for a user's current role
 */
export const getDefaultRouteForRole = (role) => {
  const roleRoutes = {
    'admin': '/admin',
    'head_teacher': '/head-teacher',
    'form_master': '/form-master',
    'class_teacher': '/class-teacher',
    'subject_teacher': '/subject-teacher',
    'teacher': '/subject-teacher'
  };

  return roleRoutes[role] || '/subject-teacher';
};
```

---

### **Step 2: Update Routes.jsx** ✅

Simplify route protection to allow admin access:

```javascript
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Use helper function
  if (!canAccessRoute(user, allowedRoles)) {
    const currentRole = user.currentRole || user.primaryRole;
    return <Navigate to={getDefaultRouteForRole(currentRole)} replace />;
  }

  return children;
};
```

**Update all routes:**
```javascript
// Before: Only form masters can access
<Route path="/form-master" element={
  <ProtectedRoute allowedRoles={['form_master']}>
    <FormMasterPage />
  </ProtectedRoute>
} />

// After: Form masters AND admins can access
// (Handled automatically by canAccessRoute helper)
```

---

### **Step 3: Add Role Context Indicator**

Add visual indicator showing which role is active:

**In Layout.jsx navbar:**
```javascript
{/* Role Context Badge */}
{user.all_roles?.length > 1 && (
  <div className="text-xs text-gray-600">
    Viewing as: <strong>{formatRoleDisplay(currentRole, user.gender)}</strong>
  </div>
)}
```

---

### **Step 4: Add Role Switching Analytics**

Track role switches for UX insights:

```javascript
const switchRole = (newRole) => {
  // ... existing code ...

  // Analytics
  console.log(`Role switched: ${user.currentRole} → ${newRole}`);

  // Optional: Send to analytics service
  // trackEvent('role_switch', { from: user.currentRole, to: newRole });

  return true;
};
```

---

## Best Practices for Admin Role Switching

### **For Developers**

1. **Always check `user.all_roles`** when determining capabilities
2. **Use `user.currentRole`** for UI display and basic routing
3. **Admins bypass currentRole restrictions** for route access
4. **Don't hardcode role checks** - use helper functions

### **For Admins**

1. **Default Login:** Start in admin mode
2. **Use Role Switcher:** Click dropdown in navbar to switch roles
3. **Access is Automatic:** No need to switch roles to access pages (admin sees everything)
4. **Role Context:** Role switcher shows which perspective you're viewing
5. **Quick Switch:** Can switch between roles without logging out

---

## Security Considerations

### **What's Protected:**

✅ Users can only switch to roles in their `all_roles` array
✅ `switchRole()` validates before updating
✅ Backend determines `all_roles` - frontend cannot modify
✅ JWT tokens prevent client-side role manipulation

### **What to Monitor:**

⚠️ Ensure backend properly sets `all_roles` during login
⚠️ Audit trail for role switches (who switched to what, when)
⚠️ Validate `currentRole` on sensitive API calls

---

## Testing Checklist

### **Test Case 1: Admin with Multiple Roles**

**Setup:**
- User with `allRoles: ['admin', 'class_teacher', 'form_master']`

**Test:**
1. ✅ Login → currentRole = 'admin'
2. ✅ Can access `/admin` page
3. ✅ Can access `/class-teacher` page (without switching)
4. ✅ Can access `/form-master` page (without switching)
5. ✅ RoleSwitcher dropdown shows 3 roles
6. ✅ Switch to 'class_teacher' → redirects to `/class-teacher`
7. ✅ RoleSwitcher shows "Class Teacher" as active
8. ✅ Can still access `/admin` page
9. ✅ Switch back to 'admin' → redirects to `/admin`
10. ✅ Refresh page → currentRole persists

---

### **Test Case 2: Teacher with Single Role**

**Setup:**
- User with `allRoles: ['subject_teacher']`

**Test:**
1. ✅ Login → currentRole = 'subject_teacher'
2. ✅ RoleSwitcher does NOT appear (only 1 role)
3. ✅ Can access `/subject-teacher`
4. ✅ Cannot access `/admin` (redirects away)
5. ✅ Cannot access `/form-master` (redirects away)

---

### **Test Case 3: Role Switching Persistence**

**Setup:**
- Admin switches to Form Master role

**Test:**
1. ✅ Switch to 'form_master'
2. ✅ localStorage updated
3. ✅ Refresh page
4. ✅ Still in 'form_master' mode
5. ✅ RoleSwitcher shows Form Master as active

---

## API Endpoints Involved

### **POST /api/auth/login**

**Returns:**
```json
{
  "status": "success",
  "data": {
    "id": 123,
    "email": "admin@school.com",
    "name": "John Doe",
    "primaryRole": "admin",
    "allRoles": ["admin", "head_teacher", "class_teacher"],
    "currentRole": "admin",
    "classes": ["BS7", "BS8"],
    "subjects": ["Mathematics"]
  },
  "token": "jwt_token_here"
}
```

**Note:** Backend determines `allRoles` from database

---

## Files Modified

1. ✅ `src/components/RoleSwitcher.jsx` - Role switching UI
2. ✅ `src/context/AuthContext.jsx` - switchRole() function
3. ✅ `src/Routes.jsx` - ProtectedRoute component
4. ✅ `src/components/Layout.jsx` - RoleSwitcher placement
5. ⏳ `src/utils/routeAccessHelper.js` - NEW helper functions
6. ⏳ Update all route definitions to use new helper

---

## Summary

### **Current State:**
- ✅ Role switching works
- ✅ RoleSwitcher UI is clean and functional
- ⚠️ Admin access to teacher routes is inconsistent
- ⚠️ No centralized access control logic

### **After Improvements:**
- ✅ Admins can access ALL pages regardless of currentRole
- ✅ Centralized access control via helper functions
- ✅ Clear visual indicators of active role
- ✅ Consistent user experience across all role types
- ✅ Better testability and maintainability

---

## Questions to Clarify

1. **Should admins always have access to all routes?**
   - Recommended: Yes, for administrative oversight
   - Alternative: Require role switching for access

2. **Should currentRole persist across sessions?**
   - Current: Yes (stored in localStorage)
   - Alternative: Always reset to primaryRole on login

3. **Should role switches be logged/audited?**
   - Recommended: Yes, for security and UX analytics

4. **Should there be a "View as..." mode?**
   - Current: Role switch affects access and behavior
   - Alternative: "Preview mode" that doesn't change access

---

## Next Steps

1. ✅ Review this guide
2. ⏳ Decide on admin access policy
3. ⏳ Implement route access helper
4. ⏳ Update all route definitions
5. ⏳ Add visual role context indicators
6. ⏳ Test with multiple user scenarios
7. ⏳ Document final behavior in user manual

