# Teacher Access Restrictions - Implementation Complete

## Summary
Implemented comprehensive access control to ensure teachers can **ONLY** access classes and subjects assigned to them.

## Security Changes Implemented

### 1. JWT Authentication Middleware (`api/lib/authMiddleware.js`)
Created centralized authentication and authorization utilities:

- ✅ **`extractUser(req)`** - Extracts and verifies JWT token from Authorization header
- ✅ **`requireAuth(req, res)`** - Requires authentication, returns 401 if not logged in
- ✅ **`hasClassAccess(user, className)`** - Checks if teacher has access to a class
- ✅ **`hasSubjectAccess(user, className, subject)`** - Checks if teacher teaches a subject in a class
- ✅ **`requireClassAccess()`** - Enforces class access, returns 403 if denied
- ✅ **`requireSubjectAccess()`** - Enforces subject access, returns 403 if denied
- ✅ **`getClassFilterForUser()`** - Returns SQL filter for teacher's assigned classes

**Access Levels:**
- **Admin & Head Teachers**: Full access to all classes and subjects
- **Class Teachers / Form Masters**: Access only to their assigned class
- **Subject Teachers**: Access only to classes AND subjects they teach

### 2. Secured API Endpoints

#### Students API (`api/students/index.js`)
- ✅ Requires authentication for all requests
- ✅ GET all students: Returns only students from teacher's assigned classes
- ✅ GET specific class: Verifies teacher has access before returning data
- ✅ Returns 403 Forbidden if teacher tries to access unauthorized class

#### Marks API (`api/marks/index.js`)
- ✅ Requires authentication for all requests
- ✅ GET marks: Filters by BOTH assigned classes AND subjects
- ✅ Subject teachers can ONLY see marks for subjects they teach
- ✅ Returns 403 if teacher tries to access unauthorized subject/class combination

#### Classes API (`api/classes/index.js`)
- ✅ Requires authentication
- ✅ Returns only classes the teacher is assigned to
- ✅ Admin/Head teachers see all classes

#### Analytics APIs
- ✅ **`api/analytics/class-performance/index.js`**
  - Requires authentication
  - Verifies class access (and subject access if specified)
  - Returns 403 if unauthorized

- ✅ **`api/analytics/all-marks/index.js`**
  - Requires authentication
  - Filters marks by teacher's assigned classes AND subjects
  - Returns only data for authorized assignments

- ✅ **`api/analytics/teacher-progress/index.js`**
  - Requires authentication
  - Regular teachers can only see their own progress
  - Only Admin/Head teachers can see all teachers' progress

### 3. Frontend Integration (`src/api-client.js`)
- ✅ Automatically includes JWT token in Authorization header for ALL requests
- ✅ Imports `getAuthToken()` from authHelpers
- ✅ Adds `Authorization: Bearer <token>` to every API call

## How It Works

### Authentication Flow
```
1. Teacher logs in → Receives JWT token with assignments
   Token contains: { classes: [...], subjects: [...], primaryRole, all_roles }

2. Token stored in localStorage by authHelpers

3. Every API request includes: Authorization: Bearer <token>

4. Backend middleware:
   - Extracts token
   - Verifies signature
   - Checks if teacher is assigned to requested resource
   - Returns 401 (not authenticated) or 403 (not authorized) if denied
```

### Example Access Control

**Scenario: Teacher John teaches Math in BS7 and BS8**
- Token contains: `{ classes: ['BS7', 'BS8'], subjects: ['Mathematics'] }`

**Allowed:**
- ✅ GET `/api/students?className=BS7` → Returns BS7 students
- ✅ GET `/api/marks?className=BS7&subject=Mathematics` → Returns Math marks for BS7
- ✅ GET `/api/analytics/class-performance?className=BS8` → Returns BS8 analytics

**Blocked:**
- ❌ GET `/api/students?className=BS9` → 403 Forbidden (not assigned to BS9)
- ❌ GET `/api/marks?className=BS7&subject=English` → 403 Forbidden (doesn't teach English)
- ❌ GET `/api/analytics/teacher-progress` → Only shows John's own progress, not other teachers

## Error Responses

### 401 Unauthorized (Not Logged In)
```json
{
  "status": "error",
  "message": "Authentication required. Please log in."
}
```

### 403 Forbidden (Logged In But Not Assigned)
```json
{
  "status": "error",
  "message": "Access denied. You are not assigned to class BS9."
}
```

```json
{
  "status": "error",
  "message": "Access denied. You are not assigned to teach English in class BS7."
}
```

## Testing the Implementation

### Test Cases

1. **Login as Subject Teacher**
   - Verify token contains correct classes and subjects
   - Try accessing assigned class → Should work
   - Try accessing non-assigned class → Should get 403

2. **Login as Class Teacher**
   - Try accessing assigned class → Should work
   - Try accessing all subjects in that class → Should work (if also subject teacher)

3. **Login as Head Teacher**
   - Try accessing any class → Should work
   - Try accessing any subject → Should work

4. **Test Without Token**
   - Try any API call without Authorization header → Should get 401

### Manual Testing Commands
```bash
# 1. Login and get token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"teacher@school.com","password":"password123"}'

# 2. Use token in subsequent requests
curl http://localhost:3000/api/students?className=BS7 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# 3. Try accessing unauthorized class (should fail)
curl http://localhost:3000/api/students?className=BS9 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Files Modified

### Backend (API)
1. `api/lib/authMiddleware.js` - **NEW** Authentication & authorization utilities
2. `api/students/index.js` - Added access control
3. `api/marks/index.js` - Added access control with subject filtering
4. `api/classes/index.js` - Added access control
5. `api/analytics/class-performance/index.js` - Added access control
6. `api/analytics/all-marks/index.js` - Added access control with filtering
7. `api/analytics/teacher-progress/index.js` - Added privacy controls

### Frontend
1. `src/api-client.js` - Added JWT token to all requests

## Security Benefits

✅ **Backend Enforcement**: Access control happens on the server - cannot be bypassed by modifying frontend code

✅ **Token-Based**: JWT tokens are cryptographically signed - teachers cannot modify their assignments

✅ **Automatic**: All API calls automatically include authentication - no manual token management needed

✅ **Granular Control**:
- Subject teachers limited to specific subjects in specific classes
- Class teachers limited to their assigned class
- Form masters limited to their form class

✅ **Fail-Secure**: Default behavior is to deny access unless explicitly authorized

## Next Steps

1. **Test with Real Teacher Accounts**: Create test teachers with different assignments and verify access
2. **Monitor Logs**: Check for 403 errors that might indicate legitimate access issues
3. **Update Frontend UI**: Hide/disable buttons for unauthorized resources (backend already blocks them)
4. **Document Teacher Assignments**: Ensure all teachers have correct classes and subjects assigned in database

## Important Notes

⚠️ **Admin Override**: Users with `admin` or `head_teacher` roles can access everything

⚠️ **God Mode**: Development backdoor (`god@god.com / god123`) has full access - disabled in production

⚠️ **Token Expiry**: JWT tokens expire after 24 hours - users need to re-login

⚠️ **Assignment Updates**: If a teacher's assignments change in the database, they need to re-login to get new token

---

**Implementation Date**: 2025-11-13
**Status**: ✅ Complete and Ready for Testing
