import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, role }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/" replace />; // redirect if not logged in
  }

  if (role) {
    const currentRole = user.currentRole || user.primaryRole || user.role;
    
    // Special handling for teacher roles - allow any teacher role to access teacher routes
    if (role === "teacher") {
      const teacherRoles = ["teacher", "class_teacher", "subject_teacher", "head_teacher", "form_master"];
      const hasTeacherRole = teacherRoles.includes(currentRole);
      
      // Allow admins with teacher roles to access teacher pages
      const isAdminWithTeacherRole = user.allRoles && user.allRoles.includes('admin') && 
                                   user.allRoles.some(r => teacherRoles.includes(r));
      
      // For role-specific routes, check if user has that specific role or is an admin
      if (location.pathname.includes('/teacher/')) {
        // Extract the specific role from the path
        let specificRole = null;
        if (location.pathname.includes('/head-teacher')) specificRole = 'head_teacher';
        if (location.pathname.includes('/class-teacher')) specificRole = 'class_teacher';
        if (location.pathname.includes('/subject-teacher')) specificRole = 'subject_teacher';
        if (location.pathname.includes('/form-master')) specificRole = 'form_master';
        
        // If this is a role-specific route, allow access if user is admin or has that role
        if (specificRole) {
          const canAccess = user.allRoles.includes('admin') || user.allRoles.includes(specificRole);
          if (!canAccess) {
            console.log('Access denied - user does not have specific role:', specificRole);
            return <Navigate to="/teacher" replace />;
          }
        }
      }
      
      if (!hasTeacherRole && !isAdminWithTeacherRole) {
        console.log('Access denied - user role:', currentRole, 'required:', role);
        return <Navigate to="/" replace />; // block non-teacher roles
      }
    } else if (currentRole !== role) {
      console.log('Access denied - user role:', currentRole, 'required:', role);
      return <Navigate to="/" replace />; // block wrong role
    }
  }

  return children;
}