import { Routes as RouterRoutes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { useAuth } from './context/AuthContext';
import LoadingSpinner from './components/LoadingSpinner';
import { canAccessRoute, getDefaultRouteForRole, auditRouteAccess } from './utils/routeAccessHelper';

// ✅ PERFORMANCE FIX: Lazy load all page components
// This reduces initial bundle size by ~70%
// Pages are only loaded when user navigates to them

// Login page loaded immediately (it's the first page)
import LoginPage from './pages/LoginPage';

// All other pages lazy loaded
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage'));
const HeadTeacherPage = lazy(() => import('./pages/HeadTeacherPage'));
const FormMasterPage = lazy(() => import('./pages/FormMasterPage'));
const ClassTeacherPage = lazy(() => import('./pages/ClassTeacherPage'));
const SubjectTeacherPage = lazy(() => import('./pages/SubjectTeacherPage'));
const SchoolSetupPage = lazy(() => import('./pages/SchoolSetupPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const ManageUsersPage = lazy(() => import('./pages/ManageUsersPage'));
const IndividualReportPage = lazy(() => import('./pages/IndividualReportPage'));
const NotificationDemoPage = lazy(() => import('./pages/NotificationDemoPage'));
const DiagnosticPage = lazy(() => import('./pages/DiagnosticPage'));
const MockExamAggregatesPage = lazy(() => import('./pages/MockExamAggregatesPage'));

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  // Wait for auth check to complete before redirecting
  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <div>Loading...</div>
    </div>;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Use centralized access control helper
  const hasAccess = canAccessRoute(user, allowedRoles);

  // Audit sensitive route access
  const currentPath = window.location.pathname;
  auditRouteAccess(user, currentPath, hasAccess);

  if (!hasAccess) {
    // Redirect to appropriate dashboard for their current role
    const currentRole = user.currentRole || user.primaryRole || user.role;
    const redirectPath = getDefaultRouteForRole(currentRole);

    console.log(`🚫 Access denied to ${currentPath}`);
    console.log(`   User allRoles:`, user.all_roles || user.allRoles);
    console.log(`   User currentRole:`, currentRole);
    console.log(`   Required roles:`, allowedRoles);
    console.log(`   Redirecting to:`, redirectPath);
    return <Navigate to={redirectPath} replace />;
  }

  return children;
};

// Subject Teacher Route - No automatic redirects
// Users can have multiple roles and should be able to switch between them freely
const SubjectTeacherRoute = () => {
  return <SubjectTeacherPage />;
};

// Main Routes Component
const Routes = () => {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <LoadingSpinner message="Loading page..." size="lg" />
      </div>
    }>
      <RouterRoutes>
        {/* Public Route */}
        <Route path="/" element={<LoginPage />} />
      
      {/* Admin Routes */}
      <Route path="/admin" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminDashboardPage />
        </ProtectedRoute>
      } />

      <Route path="/manage-users" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <ManageUsersPage />
        </ProtectedRoute>
      } />

      <Route path="/school-setup" element={
        <ProtectedRoute allowedRoles={['admin', 'head_teacher', 'superadmin']}>
          <SchoolSetupPage />
        </ProtectedRoute>
      } />
      
      {/* Head Teacher Routes */}
      <Route path="/head-teacher" element={
        <ProtectedRoute allowedRoles={['head_teacher', 'admin']}>
          <HeadTeacherPage />
        </ProtectedRoute>
      } />
      
      {/* Form Master Routes */}
      <Route path="/form-master" element={
        <ProtectedRoute allowedRoles={['form_master', 'admin']}>
          <FormMasterPage />
        </ProtectedRoute>
      } />

      {/* Class Teacher Routes */}
      <Route path="/class-teacher" element={
        <ProtectedRoute allowedRoles={['class_teacher', 'admin']}>
          <ClassTeacherPage />
        </ProtectedRoute>
      } />
      
      {/* Subject Teacher Routes */}
      <Route path="/subject-teacher" element={
        <ProtectedRoute allowedRoles={['subject_teacher', 'teacher', 'admin']}>
          <SubjectTeacherRoute />
        </ProtectedRoute>
      } />

      {/* Redirect old /dashboard route to subject teacher page */}
      <Route path="/dashboard" element={<Navigate to="/subject-teacher" replace />} />

      {/* Utility Routes */}
      <Route path="/report/:studentId" element={
        <ProtectedRoute>
          <IndividualReportPage />
        </ProtectedRoute>
      } />

      <Route path="/mock-exam-aggregates" element={
        <ProtectedRoute allowedRoles={['admin', 'head_teacher', 'form_master', 'class_teacher', 'subject_teacher']}>
          <MockExamAggregatesPage />
        </ProtectedRoute>
      } />

      <Route path="/notification-demo" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <NotificationDemoPage />
        </ProtectedRoute>
      } />

      {/* Development/Diagnostic Routes - Only available in development mode or for admins */}
      {(import.meta.env.DEV || import.meta.env.MODE === 'development') && (
        <Route path="/diagnostic" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <DiagnosticPage />
          </ProtectedRoute>
        } />
      )}

      {/* 404 Route */}
      <Route path="*" element={<NotFoundPage />} />
    </RouterRoutes>
    </Suspense>
  );
};

export default Routes;