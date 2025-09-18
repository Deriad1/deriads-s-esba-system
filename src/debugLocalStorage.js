// Debug script to check localStorage contents
const debugLocalStorage = () => {
  console.log('=== localStorage Debug Info ===');
  
  // Check current term info
  const currentTerm = localStorage.getItem('currentTerm') || 'First Term';
  const currentYear = localStorage.getItem('currentAcademicYear') || '2024/2025';
  console.log('Current Term:', currentTerm);
  console.log('Current Year:', currentYear);
  
  // Check if school setup is complete
  const isSetupComplete = localStorage.getItem('schoolSetupComplete');
  console.log('School Setup Complete:', isSetupComplete);
  
  // Check for teachers in term-specific storage
  const termKey = `${currentYear.replace('/', '_')}_${currentTerm.replace(' ', '_')}_teachers`;
  console.log('Term Key:', termKey);
  
  try {
    const teachers = JSON.parse(localStorage.getItem(termKey) || '[]');
    console.log('Teachers in localStorage:', teachers);
    console.log('Number of teachers:', teachers.length);
  } catch (e) {
    console.log('Error parsing teachers:', e);
  }
  
  // Check for user
  const user = localStorage.getItem('user');
  console.log('Current User:', user);
  
  // Check fallback users
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
  
  console.log('Fallback Users:', fallbackUsers);
};

// Run the debug function
debugLocalStorage();

export default debugLocalStorage;