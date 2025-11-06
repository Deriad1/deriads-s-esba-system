// Helper functions for role naming and class categorization

// Determine if a class is senior level (BS7-BS9)
export const isSeniorClass = (className) => {
  const seniorClasses = ['BS7', 'BS8', 'BS9'];
  return seniorClasses.includes(className);
};

// Determine if a class is junior level (KG-BS6)
export const isJuniorClass = (className) => {
  const juniorClasses = ['KG1', 'KG2', 'BS1', 'BS2', 'BS3', 'BS4', 'BS5', 'BS6'];
  return juniorClasses.includes(className);
};

// Get the appropriate role name based on class level and teacher gender
export const getClassLeaderRole = (className, gender) => {
  if (isSeniorClass(className)) {
    // BS7-BS9 use Form Master/Mistress
    return gender === 'female' ? 'Form Mistress' : 'Form Master';
  } else if (isJuniorClass(className)) {
    // KG-BS6 use Class Teacher
    return 'Class Teacher';
  }
  return 'Class Teacher'; // Default
};

// Get the role code for database/routing
export const getClassLeaderRoleCode = (className) => {
  if (isSeniorClass(className)) {
    return 'form_master';
  } else if (isJuniorClass(className)) {
    return 'class_teacher';
  }
  return 'class_teacher';
};

// Get display name for a teacher with their assigned class
export const getTeacherRoleDisplay = (teacher, className = null) => {
  if (!teacher) return '';
  
  // If no specific class provided, use teacher's primary role
  if (!className) {
    const primaryRole = teacher.all_roles?.[0] || teacher.primaryRole || teacher.role;
    return formatRoleDisplay(primaryRole, teacher.gender);
  }
  
  // Check if teacher is assigned to this class as a leader
  const isLeader = teacher.classes?.includes(className);
  if (!isLeader) return 'Subject Teacher';
  
  return getClassLeaderRole(className, teacher.gender);
};

// Format role display name with gender consideration
export const formatRoleDisplay = (roleCode, gender) => {
  const roleMap = {
    'admin': 'Administrator',
    'head_teacher': 'Head Teacher',
    'subject_teacher': 'Subject Teacher',
    'class_teacher': 'Class Teacher',
    'form_master': gender === 'female' ? 'Form Mistress' : 'Form Master'
  };
  
  return roleMap[roleCode] || roleCode;
};

// Get all possible roles a teacher can have based on their assignments
export const getTeacherPossibleRoles = (teacher) => {
  const roles = new Set();
  
  // Add base role
  if (teacher.primaryRole) {
    roles.add(teacher.primaryRole);
  }
  
  // Add subject teacher if they have subjects
  if (teacher.subjects && teacher.subjects.length > 0) {
    roles.add('subject_teacher');
  }
  
  // Add class leadership roles based on assigned classes
  if (teacher.classes && teacher.classes.length > 0) {
    teacher.classes.forEach(className => {
      const roleCode = getClassLeaderRoleCode(className);
      roles.add(roleCode);
    });
  }
  
  return Array.from(roles);
};

// Validate if a teacher can be assigned to a class
export const canAssignTeacherToClass = (teacher, className) => {
  // Any teacher can be assigned to any class
  // But we need to inform what role they'll have
  return {
    canAssign: true,
    roleTitle: getClassLeaderRole(className, teacher.gender),
    roleCode: getClassLeaderRoleCode(className)
  };
};

// Get appropriate greeting/title for a teacher
export const getTeacherTitle = (teacher) => {
  if (!teacher) return '';
  
  const gender = teacher.gender?.toLowerCase();
  
  if (gender === 'female') {
    return 'Ms.';
  } else if (gender === 'male') {
    return 'Mr.';
  }
  
  return ''; // Neutral if gender not specified
};

// Get full display name with title
export const getTeacherFullName = (teacher) => {
  if (!teacher) return '';
  
  const title = getTeacherTitle(teacher);
  const firstName = teacher.firstName || teacher.first_name || '';
  const lastName = teacher.lastName || teacher.last_name || '';
  
  return `${title} ${firstName} ${lastName}`.trim();
};