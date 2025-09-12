import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser, switchRole } from "../api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // Check for existing user data on app load
  useEffect(() => {
    const checkExistingAuth = () => {
      try {
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
          const userData = JSON.parse(savedUser);
          setUser(userData);
        }
      } catch (error) {
        console.error("Error loading saved user data:", error);
        localStorage.removeItem('user');
      } finally {
        setLoading(false);
        setIsInitialized(true);
      }
    };

    checkExistingAuth();
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      console.log('Attempting login with:', email);
      const response = await loginUser(email, password);
      console.log('Login response:', response);
      
      if (response.status === 'success' && response.data) {
        const userData = response.data;
        setUser(userData);
        
        // Save to localStorage for persistence
        localStorage.setItem('user', JSON.stringify(userData));
        
        // Navigate based on primary role or current role
        const roleToCheck = userData.currentRole || userData.primaryRole || userData.role;
        console.log('User data after login:', userData);
        console.log('Role to check for navigation:', roleToCheck);
        
        if (roleToCheck === 'admin') {
          // Check if school setup is complete
          const isSetupComplete = localStorage.getItem('schoolSetupComplete') === 'true';
          console.log('Admin login - setup complete:', isSetupComplete);
          
          // For demo purposes, you can uncomment the next 4 lines to force setup flow:
          // if (!isSetupComplete) {
          //   console.log('Redirecting to setup page');
          //   navigate("/setup");
          // } else {
            navigate("/admin");
          // }
        } else if (roleToCheck === 'teacher' || roleToCheck === 'class_teacher' || roleToCheck === 'subject_teacher' || roleToCheck === 'head_teacher') {
          console.log('Teacher login - navigating to /teacher');
          navigate("/teacher");
        } else if (roleToCheck === 'form_master') {
          console.log('Form master login - navigating to /teacher');
          navigate("/teacher");
        } else {
          console.log('Unknown role:', roleToCheck);
          console.error('User data:', userData);
          alert("Unknown user role: " + roleToCheck);
        }
      } else {
        throw new Error(response.message || "Login failed");
      }
    } catch (error) {
      console.error("Login error:", error);
      
      // First, check if there's a teacher with this email and password
      try {
        // Get teachers from localStorage
        const currentTerm = localStorage.getItem('currentTerm') || 'First Term';
        const currentYear = localStorage.getItem('currentAcademicYear') || '2024/2025';
        const termKey = `${currentYear.replace('/', '_')}_${currentTerm.replace(' ', '_')}_teachers`;
        const teachers = JSON.parse(localStorage.getItem(termKey) || '[]');
        
        // Find teacher with matching email and password
        const foundTeacher = teachers.find(
          (teacher) => teacher.email.toLowerCase() === email.toLowerCase() && teacher.password === password
        );
        
        if (foundTeacher) {
          console.log('Teacher found in localStorage:', foundTeacher);
          
          // Create user object for teacher
          const teacherUser = {
            id: foundTeacher.id,
            email: foundTeacher.email,
            name: `${foundTeacher.firstName} ${foundTeacher.lastName}`,
            primaryRole: foundTeacher.primaryRole || "teacher",
            allRoles: foundTeacher.allRoles || ["teacher"],
            currentRole: foundTeacher.primaryRole || "teacher",
            gender: foundTeacher.gender,
            classes: foundTeacher.classes || [],
            subjects: foundTeacher.subjects || []
          };
          
          setUser(teacherUser);
          localStorage.setItem('user', JSON.stringify(teacherUser));
          
          console.log('Teacher login - navigating to /teacher');
          navigate("/teacher");
          setLoading(false);
          return;
        }
      } catch (teacherError) {
        console.error("Error checking teacher credentials:", teacherError);
      }
      
      // Improved fallback logic with multi-role support
      const fallbackUsers = [
        { 
          id: 'U001', 
          email: "admin@example.com", 
          password: "admin123", 
          name: "Admin User", 
          primaryRole: "admin",
          allRoles: ["admin", "subject_teacher", "head_teacher"],
          currentRole: "admin",
          gender: "male",
          classes: ["ALL"],
          subjects: ["Mathematics", "Science"]
        },
        { 
          id: 'U002', 
          email: "admin@school.com", 
          password: "admin123", 
          name: "School Admin", 
          primaryRole: "admin",
          allRoles: ["admin", "subject_teacher", "head_teacher"],
          currentRole: "admin",
          gender: "male",
          classes: ["ALL"],
          subjects: ["Mathematics", "Science"]
        },
        { 
          id: 'U003', 
          email: "teacher1@example.com", 
          password: "teacher123", 
          name: "John Doe", 
          primaryRole: "teacher",
          allRoles: ["teacher", "class_teacher", "subject_teacher"],
          currentRole: "teacher",
          gender: "male",
          classes: ["5A", "6A"],
          subjects: ["Mathematics", "Science"]
        }
      ];
      
      const foundUser = fallbackUsers.find(
        (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
      );

      if (foundUser) {
        console.log('Fallback user found:', foundUser);
        const { password: _, ...userWithoutPassword } = foundUser;
        setUser(userWithoutPassword);
        localStorage.setItem('user', JSON.stringify(userWithoutPassword));
        
        const roleToCheck = userWithoutPassword.currentRole || userWithoutPassword.primaryRole;
        console.log('Fallback user role to check:', roleToCheck);
        
        if (roleToCheck === "admin") {
          // Check if school setup is complete for admin fallback users too
          const isSetupComplete = localStorage.getItem('schoolSetupComplete') === 'true';
          console.log('Admin fallback - setup complete:', isSetupComplete);
          
          // For demo purposes, auto-complete setup if not done
          if (!isSetupComplete) {
            console.log('Auto-completing school setup for demo (fallback)');
            localStorage.setItem('schoolSetupComplete', 'true');
            localStorage.setItem('schoolName', 'DERIAD\'S eSBA');
          }
          
          navigate("/admin");
        } else {
          console.log('Teacher fallback - navigating to /teacher');
          navigate("/teacher");
        }
      } else {
        console.log('No user found for:', email);
        alert("Invalid email or password.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Switch between user roles with enhanced functionality
  const switchUserRole = async (newRole) => {
    // Validate that user exists and has the requested role
    if (!user || !user.allRoles || !user.allRoles.includes(newRole)) {
      alert("You don't have permission to switch to this role");
      return false;
    }

    // If already in this role, still update the UI and navigate appropriately
    if (user.currentRole === newRole) {
      // Even if already in the role, we'll still navigate to the appropriate page
      if (newRole === 'admin') {
        navigate("/admin");
      } else {
        navigate("/teacher");
      }
      return true; // Return true to indicate success
    }

    try {
      setLoading(true);
      
      // Try to switch role on backend (for future API integration)
      try {
        await switchRole(user.email, newRole);
      } catch (apiError) {
        console.log("Backend role switch failed, continuing with frontend switch:", apiError.message);
      }
      
      // Update user state with comprehensive role information
      const updatedUser = {
        ...user,
        currentRole: newRole,
        // Update subjects and classes based on the new role
        subjects: getRoleSpecificSubjects(newRole, user),
        classes: getRoleSpecificClasses(newRole, user)
      };
      
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      // Navigate to appropriate dashboard with enhanced logic
      if (newRole === 'admin') {
        // Check if school setup is complete
        const isSetupComplete = localStorage.getItem('schoolSetupComplete') === 'true';
        
        // For demo purposes, auto-complete setup if not done
        if (!isSetupComplete) {
          localStorage.setItem('schoolSetupComplete', 'true');
          localStorage.setItem('schoolName', 'DERIAD\'S eSBA');
        }
        
        navigate("/admin");
      } else {
        // For all teacher roles, navigate to teacher dashboard
        navigate("/teacher");
      }
      
      return true;
    } catch (error) {
      console.error("Role switch error:", error);
      alert("Failed to switch role: " + error.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get role-specific subjects
  const getRoleSpecificSubjects = (role, user) => {
    // For admin, return all subjects
    if (role === 'admin') {
      return user.subjects || [];
    }
    
    // For other roles, return subjects assigned to that role
    // This would typically come from the backend in a real implementation
    return user.subjects || [];
  };

  // Helper function to get role-specific classes
  const getRoleSpecificClasses = (role, user) => {
    // For admin and head teacher, return all classes
    if (role === 'admin' || role === 'head_teacher') {
      return ['ALL'];
    }
    
    // For class teacher and form master, return their specific classes
    if (role === 'class_teacher' || role === 'form_master') {
      return user.classes || [];
    }
    
    // For subject teacher, return classes they teach
    if (role === 'subject_teacher') {
      return user.classes || [];
    }
    
    // Default fallback
    return user.classes || [];
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    navigate("/");
  };

  // Don't render children until we've checked for existing auth
  if (!isInitialized) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      loading, 
      switchUserRole 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);