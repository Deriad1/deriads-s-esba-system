import Layout from "../components/Layout";
import { useState, useEffect } from "react";
// import { useAuth } from "../context/AuthContext"; // Not currently used but kept for future implementation
import { 
  getLearners, 
  getTeachers, 
  addLearner, 
  addTeacher, 
  getClassPerformanceTrends,
  getStudentsByClass
} from "../api";
import { getCurrentTermInfo, getTermKey, getCurrentTermKey } from "../utils/termHelpers";
import PerformanceChart from "../components/PerformanceChart";
import TrendAnalysisChart from "../components/TrendAnalysisChart";

const subjectsList = [
  "English Language", "Mathematics", "Science", "Social Studies", "Ghanaian Language",
  "Religious and Moral Education (RME)", "Creative Arts and Design", "Career Technology",
  "Computing", "Physical and Health Education (PHE)", "OWOP", "History", "French", "Arabic"
];

const classesList = [
  "KG1", "KG2", "KG3", "KG4", "KG5", 
  "P1", "P2", "P3", "P4", "P5", "P6",
  "JHS1", "JHS2", "JHS3"
];

const HeadTeacherPage = () => {
  // const { user } = useAuth(); // Not currently used but kept for future implementation
  
  const [learners, setLearners] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState("overview");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showTrendAnalysis, setShowTrendAnalysis] = useState(false);
  const [classTrendData, setClassTrendData] = useState(null);
  const [classStudents, setClassStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showStudentReport, setShowStudentReport] = useState(false);
  
  // State for performance dashboard
  const [performanceData, setPerformanceData] = useState({
    overallTrends: {},
    subjectComparison: [],
    gradeLevelPerformance: [],
    yearOverYear: {}
  });
  
  // State for communication hub
  const [announcements, setAnnouncements] = useState([]);
  const [newAnnouncement, setNewAnnouncement] = useState({ title: "", content: "", audience: "all" });
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState({ recipient: "", content: "" });
  const [emergencyNotifications, setEmergencyNotifications] = useState([]);
  const [newEmergency, setNewEmergency] = useState({ title: "", content: "" });
  
  // State for teacher assignment
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedTeacherForAssignment, setSelectedTeacherForAssignment] = useState(null);
  const [assignmentForm, setAssignmentForm] = useState({
    subjects: [],
    classes: []
  });

  // State for adding new teacher/student
  const [showAddTeacherModal, setShowAddTeacherModal] = useState(false);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [newTeacher, setNewTeacher] = useState({
    firstName: "",
    lastName: "",
    email: "",
    gender: "male",
    primaryRole: "subject_teacher"
  });
  const [newStudent, setNewStudent] = useState({
    firstName: "",
    lastName: "",
    gender: "male",
    className: "",
    idNumber: ""
  });

  // State for teacher roles (newly added for multi-role support)
  const [showTeacherRoleModal, setShowTeacherRoleModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [teacherRoles, setTeacherRoles] = useState({
    primaryRole: "subject_teacher",
    allRoles: ["subject_teacher"],
    classes: [],
    subjects: []
  });

  // Get all classes from learners
  const getAllClasses = () => {
    return [...new Set(learners.map(l => l.className))].filter(Boolean);
  };

  // Load trend data when class and subject are selected in classes tab
  useEffect(() => {
    if (selectedTab === "classes" && selectedClass && selectedSubject) {
      loadTrendData();
    }
  }, [selectedTab, selectedClass, selectedSubject]);

  const loadTrendData = async () => {
    try {
      const response = await getClassPerformanceTrends(selectedClass, selectedSubject);
      if (response.status === 'success') {
        setClassTrendData(response.data);
      }
    } catch (error) {
      console.error("Error loading trend data:", error);
    }
  };

  // Get all subjects from teachers
  const getAllSubjects = () => {
    const subjects = new Set();
    teachers.forEach(teacher => {
      if (Array.isArray(teacher.subjects)) {
        teacher.subjects.forEach(subject => subjects.add(subject));
      }
    });
    return [...subjects];
  };

  // Load students for selected class
  useEffect(() => {
    if (selectedClass) {
      loadClassStudents(selectedClass);
    }
  }, [selectedClass]);

  const loadClassStudents = async (className) => {
    try {
      const response = await getStudentsByClass(className);
      if (response.status === 'success') {
        setClassStudents(response.data || []);
      }
    } catch (error) {
      console.error("Error loading class students:", error);
      setClassStudents([]);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [learnersResponse, teachersResponse] = await Promise.all([
        getLearners(),
        getTeachers()
      ]);
      
      if (learnersResponse.status === 'success') {
        setLearners(learnersResponse.data || []);
      }
      
      if (teachersResponse.status === 'success') {
        setTeachers(teachersResponse.data || []);
      }
      
      // Load performance dashboard data
      loadPerformanceData();
      
      // Load communication hub data
      loadCommunicationData();
    } catch (error) {
      console.error("Error loading data:", error);
      alert("Error loading data: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Load performance dashboard data
  const loadPerformanceData = async () => {
    try {
      // Load real performance data instead of mock data
      const { currentYear } = getCurrentTermInfo();
      const previousYear = `${parseInt(currentYear.split('/')[0]) - 1}/${parseInt(currentYear.split('/')[1]) - 1}`;
      
      // Overall academic performance trends across all classes
      const overallTrends = {};
      const termList = ['First Term', 'Second Term', 'Third Term'];
      
      // Get performance data for each term
      for (const term of termList) {
        const termKey = getTermKey(term, currentYear, 'marks');
        const marks = JSON.parse(localStorage.getItem(termKey) || '[]');
        
        // Calculate average performance for this term
        if (marks.length > 0) {
          const totalScore = marks.reduce((sum, mark) => {
            // Calculate final total (50% tests + 50% exam)
            const testsTotal = (parseFloat(mark.test1) || 0) + 
                              (parseFloat(mark.test2) || 0) + 
                              (parseFloat(mark.test3) || 0) + 
                              (parseFloat(mark.test4) || 0);
            const testsScaled = (testsTotal / 60) * 50;
            const examScaled = ((parseFloat(mark.exam) || 0) / 100) * 50;
            const finalTotal = testsScaled + examScaled;
            return sum + finalTotal;
          }, 0);
          
          const averageScore = totalScore / marks.length;
          overallTrends[term] = {
            averageScore: parseFloat(averageScore.toFixed(1)),
            studentCount: marks.length
          };
        } else {
          overallTrends[term] = {
            averageScore: 0,
            studentCount: 0
          };
        }
      }
      
      // Subject performance comparison
      const subjectPerformance = {};
      const currentTermKey = getCurrentTermKey('marks');
      const marks = JSON.parse(localStorage.getItem(currentTermKey) || '[]');
      
      // Group marks by subject
      marks.forEach(mark => {
        if (!subjectPerformance[mark.subject]) {
          subjectPerformance[mark.subject] = [];
        }
        // Calculate final total (50% tests + 50% exam)
        const testsTotal = (parseFloat(mark.test1) || 0) + 
                          (parseFloat(mark.test2) || 0) + 
                          (parseFloat(mark.test3) || 0) + 
                          (parseFloat(mark.test4) || 0);
        const testsScaled = (testsTotal / 60) * 50;
        const examScaled = ((parseFloat(mark.exam) || 0) / 100) * 50;
        const finalTotal = testsScaled + examScaled;
        subjectPerformance[mark.subject].push(finalTotal);
      });
      
      // Calculate average for each subject
      const subjectComparison = Object.entries(subjectPerformance).map(([subject, scores]) => {
        const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
        return {
          label: subject,
          value: parseFloat(average.toFixed(1))
        };
      });
      
      // Performance by grade level
      const gradeLevelPerformance = [];
      const learnersByGrade = {};
      
      // Categorize learners by grade level
      learners.forEach(learner => {
        const gradeLevel = getGradeLevel(learner.className);
        
        if (!learnersByGrade[gradeLevel]) {
          learnersByGrade[gradeLevel] = [];
        }
        learnersByGrade[gradeLevel].push(learner);
      });
      
      // Calculate performance for each grade level
      Object.entries(learnersByGrade).forEach(([gradeLevel, learnersInGrade]) => {
        // Get marks for learners in this grade
        const learnerIds = learnersInGrade.map(l => l.id);
        const gradeMarks = marks.filter(mark => learnerIds.includes(mark.studentId));
        
        if (gradeMarks.length > 0) {
          const totalScore = gradeMarks.reduce((sum, mark) => {
            // Calculate final total (50% tests + 50% exam)
            const testsTotal = (parseFloat(mark.test1) || 0) + 
                              (parseFloat(mark.test2) || 0) + 
                              (parseFloat(mark.test3) || 0) + 
                              (parseFloat(mark.test4) || 0);
            const testsScaled = (testsTotal / 60) * 50;
            const examScaled = ((parseFloat(mark.exam) || 0) / 100) * 50;
            const finalTotal = testsScaled + examScaled;
            return sum + finalTotal;
          }, 0);
          
          const averageScore = totalScore / gradeMarks.length;
          gradeLevelPerformance.push({
            label: gradeLevel,
            value: parseFloat(averageScore.toFixed(1))
          });
        } else {
          gradeLevelPerformance.push({
            label: gradeLevel,
            value: 0
          });
        }
      });
      
      // Year-over-year comparison
      const yearOverYear = {};
      
      // Get current year performance
      const currentYearMarks = [];
      for (const term of termList) {
        const termKey = getTermKey(term, currentYear, 'marks');
        const termMarks = JSON.parse(localStorage.getItem(termKey) || '[]');
        currentYearMarks.push(...termMarks);
      }
      
      if (currentYearMarks.length > 0) {
        const totalScore = currentYearMarks.reduce((sum, mark) => {
          // Calculate final total (50% tests + 50% exam)
          const testsTotal = (parseFloat(mark.test1) || 0) + 
                            (parseFloat(mark.test2) || 0) + 
                            (parseFloat(mark.test3) || 0) + 
                            (parseFloat(mark.test4) || 0);
          const testsScaled = (testsTotal / 60) * 50;
          const examScaled = ((parseFloat(mark.exam) || 0) / 100) * 50;
          const finalTotal = testsScaled + examScaled;
          return sum + finalTotal;
        }, 0);
        
        const averageScore = totalScore / currentYearMarks.length;
        yearOverYear[currentYear] = {
          averageScore: parseFloat(averageScore.toFixed(1)),
          studentCount: currentYearMarks.length
        };
      } else {
        yearOverYear[currentYear] = {
          averageScore: 0,
          studentCount: 0
        };
      }
      
      // Get previous year performance
      const previousYearMarks = [];
      for (const term of termList) {
        const termKey = getTermKey(term, previousYear, 'marks');
        const termMarks = JSON.parse(localStorage.getItem(termKey) || '[]');
        previousYearMarks.push(...termMarks);
      }
      
      if (previousYearMarks.length > 0) {
        const totalScore = previousYearMarks.reduce((sum, mark) => {
          // Calculate final total (50% tests + 50% exam)
          const testsTotal = (parseFloat(mark.test1) || 0) + 
                            (parseFloat(mark.test2) || 0) + 
                            (parseFloat(mark.test3) || 0) + 
                            (parseFloat(mark.test4) || 0);
          const testsScaled = (testsTotal / 60) * 50;
          const examScaled = ((parseFloat(mark.exam) || 0) / 100) * 50;
          const finalTotal = testsScaled + examScaled;
          return sum + finalTotal;
        }, 0);
        
        const averageScore = totalScore / previousYearMarks.length;
        yearOverYear[previousYear] = {
          averageScore: parseFloat(averageScore.toFixed(1)),
          studentCount: previousYearMarks.length
        };
      } else {
        yearOverYear[previousYear] = {
          averageScore: 0,
          studentCount: 0
        };
      }
      
      setPerformanceData({
        overallTrends,
        subjectComparison,
        gradeLevelPerformance,
        yearOverYear
      });
    } catch (error) {
      console.error("Error loading performance data:", error);
      // Fallback to mock data if there's an error
      loadMockPerformanceData();
    }
  };

  // Fallback function for mock data
  const loadMockPerformanceData = () => {
    // Overall academic performance trends
    const overallTrends = {};
    const terms = ['First Term', 'Second Term', 'Third Term'];
    terms.forEach(term => {
      overallTrends[term] = {
        averageScore: Math.floor(Math.random() * 30) + 60, // Random score between 60-90
        studentCount: Math.floor(Math.random() * 100) + 150 // Random count between 150-250
      };
    });
    
    // Subject performance comparison
    const subjectComparison = subjectsList.slice(0, 8).map(subject => ({
      label: subject,
      value: Math.floor(Math.random() * 30) + 60 // Random score between 60-90
    }));
    
    // Performance by grade level
    const gradeLevels = ["Kindergarten", "Primary", "Junior High"];
    const gradeLevelPerformance = gradeLevels.map(level => ({
      label: level,
      value: Math.floor(Math.random() * 30) + 60 // Random score between 60-90
    }));
    
    // Year-over-year comparison
    const yearOverYear = {};
    const currentYear = "2024/2025";
    const previousYear = "2023/2024";
    yearOverYear[currentYear] = {
      averageScore: Math.floor(Math.random() * 30) + 65, // Random score between 65-95
      studentCount: Math.floor(Math.random() * 100) + 300 // Random count between 300-400
    };
    yearOverYear[previousYear] = {
      averageScore: Math.floor(Math.random() * 30) + 60, // Random score between 60-90
      studentCount: Math.floor(Math.random() * 100) + 250 // Random count between 250-350
    };
    
    setPerformanceData({
      overallTrends,
      subjectComparison,
      gradeLevelPerformance,
      yearOverYear
    });
  };

  // Load communication hub data from localStorage
  const loadCommunicationData = async () => {
    try {
      // Load announcements from localStorage
      const storedAnnouncements = JSON.parse(localStorage.getItem('announcements') || '[]');
      setAnnouncements(storedAnnouncements);
      
      // Load messages from localStorage
      const storedMessages = JSON.parse(localStorage.getItem('messages') || '[]');
      setMessages(storedMessages);
      
      // Load emergency notifications from localStorage
      const storedEmergencyNotifications = JSON.parse(localStorage.getItem('emergencyNotifications') || '[]');
      setEmergencyNotifications(storedEmergencyNotifications);
    } catch (error) {
      console.error("Error loading communication data:", error);
      // Fallback to sample data if there's an error
      loadSampleCommunicationData();
    }
  };

  // Fallback function for sample communication data
  const loadSampleCommunicationData = () => {
    // Sample announcements
    const sampleAnnouncements = [
      {
        id: 1,
        title: "School Closure Notice",
        content: "The school will be closed on Friday for maintenance work.",
        date: "2024-09-10",
        audience: "all"
      },
      {
        id: 2,
        title: "Parent-Teacher Meeting",
        content: "Parent-teacher meetings will be held next week.",
        date: "2024-09-08",
        audience: "parents"
      }
    ];
    
    // Sample messages
    const sampleMessages = [
      {
        id: 1,
        sender: "John Doe",
        recipient: "All Teachers",
        content: "Please remember to submit your reports by Friday.",
        date: "2024-09-10"
      }
    ];
    
    // Sample emergency notifications
    const sampleEmergency = [
      {
        id: 1,
        title: "Fire Drill",
        content: "Fire drill scheduled for tomorrow at 10:00 AM.",
        date: "2024-09-09"
      }
    ];
    
    setAnnouncements(sampleAnnouncements);
    setMessages(sampleMessages);
    setEmergencyNotifications(sampleEmergency);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Save communication data to localStorage when it changes
  useEffect(() => {
    try {
      localStorage.setItem('announcements', JSON.stringify(announcements));
      localStorage.setItem('messages', JSON.stringify(messages));
      localStorage.setItem('emergencyNotifications', JSON.stringify(emergencyNotifications));
    } catch (error) {
      console.error("Error saving communication data:", error);
    }
  }, [announcements, messages, emergencyNotifications]);

  // Get analytics data for school statistics
  const getSchoolAnalytics = () => {
    const classes = getAllClasses();
    const subjects = getAllSubjects();
    
    // Count students per class
    const studentsPerClass = {};
    learners.forEach(learner => {
      studentsPerClass[learner.className] = (studentsPerClass[learner.className] || 0) + 1;
    });
    
    // Count teachers per subject
    const teachersPerSubject = {};
    teachers.forEach(teacher => {
      if (Array.isArray(teacher.subjects)) {
        teacher.subjects.forEach(subject => {
          teachersPerSubject[subject] = (teachersPerSubject[subject] || 0) + 1;
        });
      }
    });
    
    // Prepare data for charts
    const studentsPerClassData = Object.entries(studentsPerClass).map(([className, count]) => ({
      label: className,
      value: count
    }));
    
    const teachersPerSubjectData = Object.entries(teachersPerSubject).map(([subject, count]) => ({
      label: subject,
      value: count
    }));
    
    return {
      totalStudents: learners.length,
      totalTeachers: teachers.length,
      totalClasses: classes.length,
      totalSubjects: subjects.length,
      studentsPerClass,
      teachersPerSubject,
      studentsPerClassData,
      teachersPerSubjectData
    };
  };

  const schoolAnalytics = getSchoolAnalytics();

  // Get class-specific data
  const getClassData = (className) => {
    const classLearners = learners.filter(l => l.className === className);
    const classTeachers = teachers.filter(t => 
      Array.isArray(t.classes) && t.classes.includes(className)
    );
    
    return {
      students: classLearners,
      teachers: classTeachers,
      studentCount: classLearners.length,
      teacherCount: classTeachers.length
    };
  };

  // Get subject-specific data
  const getSubjectData = (subject) => {
    const subjectTeachers = teachers.filter(t => 
      Array.isArray(t.subjects) && t.subjects.includes(subject)
    );
    
    // Get classes taught for this subject
    const classes = new Set();
    subjectTeachers.forEach(teacher => {
      if (Array.isArray(teacher.classes)) {
        teacher.classes.forEach(cls => classes.add(cls));
      }
    });
    
    return {
      teachers: subjectTeachers,
      teacherCount: subjectTeachers.length,
      classes: [...classes],
      classCount: classes.size
    };
  };

  // Handle opening the assignment modal
  const handleOpenAssignmentModal = (teacher) => {
    setSelectedTeacherForAssignment(teacher);
    setAssignmentForm({
      subjects: Array.isArray(teacher.subjects) ? [...teacher.subjects] : [],
      classes: Array.isArray(teacher.classes) ? [...teacher.classes] : []
    });
    setShowAssignModal(true);
  };

  // Handle assignment toggling
  const handleAssignmentSubjectToggle = (subject) => {
    setAssignmentForm(prev => ({
      ...prev,
      subjects: prev.subjects.includes(subject)
        ? prev.subjects.filter(s => s !== subject)
        : [...prev.subjects, subject]
    }));
  };

  const handleAssignmentClassToggle = (className) => {
    setAssignmentForm(prev => ({
      ...prev,
      classes: prev.classes.includes(className)
        ? prev.classes.filter(c => c !== className)
        : [...prev.classes, className]
    }));
  };

  // Save assignments
  const handleSaveAssignments = async () => {
    try {
      // Update the teacher with new assignments
      const updatedTeacher = {
        ...selectedTeacherForAssignment,
        subjects: assignmentForm.subjects,
        classes: assignmentForm.classes
      };

      // For term-specific localStorage implementation, we'll update the teacher
      const { currentTerm, currentYear } = getCurrentTermInfo();
      const termKey = getTermKey(currentTerm, currentYear, 'teachers');
      const teachersData = JSON.parse(localStorage.getItem(termKey) || '[]');
      
      const updatedTeachers = teachersData.map(teacher => 
        teacher.id === selectedTeacherForAssignment.id ? updatedTeacher : teacher
      );
      
      localStorage.setItem(termKey, JSON.stringify(updatedTeachers));
      
      // Update state
      setTeachers(updatedTeachers);
      setShowAssignModal(false);
      setSelectedTeacherForAssignment(null);
      setAssignmentForm({ subjects: [], classes: [] });
      
      // Refresh data to ensure consistency
      await loadData();
      alert("Assignments updated successfully!");
    } catch (error) {
      alert(`Error updating assignments: ${error.message}`);
    }
  };

  // Handle role checkbox changes (newly added)
  const handleRoleToggle = (role) => {
    setTeacherRoles(prev => {
      let allRoles = [...prev.allRoles];
      
      if (allRoles.includes(role)) {
        // If we're removing a role
        if (allRoles.length <= 1) {
          // Don't allow removing the last role
          return prev;
        }
        allRoles = allRoles.filter(r => r !== role);
      } else {
        // If we're adding a role
        allRoles = [...allRoles, role];
      }
      
      // Ensure primary role is still in allRoles
      let primaryRole = prev.primaryRole;
      if (!allRoles.includes(primaryRole)) {
        primaryRole = allRoles[0] || "subject_teacher";
      }
      
      return {
        ...prev,
        allRoles,
        primaryRole
      };
    });
  };

  // Handle class checkbox changes (newly added)
  const handleClassToggle = (className) => {
    setTeacherRoles(prev => {
      const classes = prev.classes.includes(className)
        ? prev.classes.filter(c => c !== className)
        : [...prev.classes, className];
      
      return { ...prev, classes };
    });
  };

  // Handle subject checkbox changes (newly added)
  const handleSubjectToggle = (subject) => {
    setTeacherRoles(prev => {
      const subjects = prev.subjects.includes(subject)
        ? prev.subjects.filter(s => s !== subject)
        : [...prev.subjects, subject];
      
      return { ...prev, subjects };
    });
  };

  // Open role assignment modal (newly added)
  const openRoleAssignment = (teacher) => {
    setSelectedTeacher(teacher);
    // Ensure allRoles is properly initialized
    const allRoles = teacher.allRoles && teacher.allRoles.length > 0 
      ? teacher.allRoles 
      : [teacher.primaryRole || "subject_teacher"];
    
    setTeacherRoles({
      primaryRole: teacher.primaryRole || "subject_teacher",
      allRoles: allRoles,
      classes: teacher.classes || [],
      subjects: teacher.subjects || []
    });
    setShowTeacherRoleModal(true);
  };

  // Handle role assignment (newly added)
  const handleAssignRoles = async (e) => {
    e.preventDefault();
    try {
      if (!selectedTeacher) return;
      
      // Prepare the data to be updated
      const rolesData = {
        primaryRole: teacherRoles.primaryRole,
        allRoles: teacherRoles.allRoles,
        classes: teacherRoles.classes,
        subjects: teacherRoles.subjects
      };
      
      // Update the teacher with new role data
      const { currentTerm, currentYear } = getCurrentTermInfo();
      const termKey = getTermKey(currentTerm, currentYear, 'teachers');
      const teachersData = JSON.parse(localStorage.getItem(termKey) || '[]');
      
      const updatedTeachers = teachersData.map(teacher => 
        teacher.id === selectedTeacher.id ? { ...teacher, ...rolesData } : teacher
      );
      
      localStorage.setItem(termKey, JSON.stringify(updatedTeachers));
      
      // Update state
      setTeachers(updatedTeachers);
      setShowTeacherRoleModal(false);
      setSelectedTeacher(null);
      setTeacherRoles({
        primaryRole: "subject_teacher",
        allRoles: ["subject_teacher"],
        classes: [],
        subjects: []
      });
      
      alert("Teacher roles updated successfully!");
    } catch (error) {
      console.error("Error updating teacher roles:", error);
      alert("Failed to update teacher roles. Please try again.");
    }
  };

  // Helper function to get grade level from class name
  const getGradeLevel = (className) => {
    if (className && className.startsWith("KG")) {
      return "Kindergarten";
    } else if (className && className.startsWith("P")) {
      return "Primary";
    } else if (className && className.startsWith("JHS")) {
      return "Junior High";
    }
    return "Other";
  };

  // Handle adding new teacher
  const handleAddTeacher = async (e) => {
    e.preventDefault();
    try {
      const teacherData = {
        ...newTeacher,
        allRoles: [newTeacher.primaryRole], // Add allRoles property
        subjects: [],
        classes: []
      };
      
      const response = await addTeacher(teacherData);
      if (response.status === 'success') {
        // Ensure the new teacher has all required properties
        const newTeacherWithRoles = {
          ...response.data,
          allRoles: response.data.allRoles || [response.data.primaryRole || "subject_teacher"],
          subjects: response.data.subjects || [],
          classes: response.data.classes || []
        };
        
        setTeachers([...teachers, newTeacherWithRoles]);
        setShowAddTeacherModal(false);
        setNewTeacher({
          firstName: "",
          lastName: "",
          email: "",
          gender: "male",
          primaryRole: "subject_teacher"
        });
        alert("Teacher added successfully!");
      }
    } catch (error) {
      alert(`Error adding teacher: ${error.message}`);
    }
  };

  // Handle adding new student
  const handleAddStudent = async (e) => {
    e.preventDefault();
    try {
      // Generate student ID if not provided
      let studentId = newStudent.idNumber;
      if (!studentId) {
        // Find the highest existing ID and increment
        const existingIds = learners
          .filter(l => l.idNumber && l.idNumber.startsWith('eSBA'))
          .map(l => parseInt(l.idNumber.replace('eSBA', '')))
          .filter(id => !isNaN(id));
        
        const maxId = existingIds.length > 0 ? Math.max(...existingIds) : 0;
        studentId = `eSBA${String(maxId + 1).padStart(4, '0')}`;
      }
      
      const studentData = {
        ...newStudent,
        idNumber: studentId
      };
      
      const response = await addLearner(studentData);
      if (response.status === 'success') {
        setLearners([...learners, response.data]);
        if (selectedClass === newStudent.className) {
          setClassStudents([...classStudents, response.data]);
        }
        setShowAddStudentModal(false);
        setNewStudent({
          firstName: "",
          lastName: "",
          gender: "male",
          className: "",
          idNumber: ""
        });
        alert("Student added successfully!");
      }
    } catch (error) {
      alert(`Error adding student: ${error.message}`);
    }
  };

  // View student report
  const handleViewStudentReport = (student) => {
    setSelectedStudent(student);
    setShowStudentReport(true);
  };

  // Print student report
  const handlePrintStudentReport = (student) => {
    // Create a printable report
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Student Report - ${student.firstName} ${student.lastName}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 20px; }
          .student-info { margin-bottom: 20px; }
          .info-row { display: flex; margin-bottom: 10px; }
          .info-label { font-weight: bold; width: 150px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #000; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          @media print {
            body { -webkit-print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Student Report</h1>
          <h2>${student.firstName} ${student.lastName}</h2>
        </div>
        
        <div class="student-info">
          <div class="info-row">
            <div class="info-label">Student ID:</div>
            <div>${student.idNumber || 'N/A'}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Class:</div>
            <div>${student.className}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Gender:</div>
            <div>${student.gender}</div>
          </div>
        </div>
        
        <p>This is a sample report. In a full implementation, this would include academic performance data.</p>
        
        <script>
          window.onload = function() {
            window.print();
            window.close();
          }
        </script>
      </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
  };

  // Communication Hub functions
  const handleAddAnnouncement = (e) => {
    e.preventDefault();
    if (!newAnnouncement.title || !newAnnouncement.content) {
      alert("Please fill in all fields");
      return;
    }
    
    const announcement = {
      id: Date.now(),
      ...newAnnouncement,
      date: new Date().toISOString().split('T')[0]
    };
    
    const updatedAnnouncements = [announcement, ...announcements];
    setAnnouncements(updatedAnnouncements);
    setNewAnnouncement({ title: "", content: "", audience: "all" });
    // Save to localStorage
    localStorage.setItem('announcements', JSON.stringify(updatedAnnouncements));
    alert("Announcement added successfully!");
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.recipient || !newMessage.content) {
      alert("Please fill in all fields");
      return;
    }
    
    const message = {
      id: Date.now(),
      sender: "Head Teacher",
      ...newMessage,
      date: new Date().toISOString().split('T')[0]
    };
    
    const updatedMessages = [message, ...messages];
    setMessages(updatedMessages);
    setNewMessage({ recipient: "", content: "" });
    // Save to localStorage
    localStorage.setItem('messages', JSON.stringify(updatedMessages));
    alert("Message sent successfully!");
  };

  const handleSendEmergency = (e) => {
    e.preventDefault();
    if (!newEmergency.title || !newEmergency.content) {
      alert("Please fill in all fields");
      return;
    }
    
    const emergency = {
      id: Date.now(),
      ...newEmergency,
      date: new Date().toISOString().split('T')[0]
    };
    
    const updatedEmergencyNotifications = [emergency, ...emergencyNotifications];
    setEmergencyNotifications(updatedEmergencyNotifications);
    setNewEmergency({ title: "", content: "" });
    // Save to localStorage
    localStorage.setItem('emergencyNotifications', JSON.stringify(updatedEmergencyNotifications));
    alert("Emergency notification sent successfully!");
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Loading...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/40 ring-1 ring-white/20 shadow-2xl p-6 rounded-lg">
          <h1 className="text-2xl font-bold text-gray-900">Head Teacher Dashboard</h1>
          <p className="text-gray-600 mt-1">Oversee all teachers and school-wide reports</p>
          
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              HEAD TEACHER
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              {schoolAnalytics.totalStudents} Students
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              {schoolAnalytics.totalTeachers} Teachers
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              {schoolAnalytics.totalClasses} Classes
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setSelectedTab("overview")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                selectedTab === "overview"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setSelectedTab("classes")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                selectedTab === "classes"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Classes
            </button>
            <button
              onClick={() => setSelectedTab("subjects")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                selectedTab === "subjects"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Subjects
            </button>
            <button
              onClick={() => setSelectedTab("teachers")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                selectedTab === "teachers"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Teachers
            </button>
            <button
              onClick={() => setSelectedTab("performance")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                selectedTab === "performance"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Performance Dashboard
            </button>
            <button
              onClick={() => setSelectedTab("communication")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                selectedTab === "communication"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Communication Hub
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {selectedTab === "overview" && (
          <div className="space-y-6">
            {/* School Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white/10 backdrop-blur-xl border border-white/40 ring-1 ring-white/20 shadow-2xl p-6 rounded-lg">
                <div className="text-3xl font-bold text-blue-600">{schoolAnalytics.totalStudents}</div>
                <div className="text-gray-600 mt-1">Total Students</div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-xl border border-white/40 ring-1 ring-white/20 shadow-2xl p-6 rounded-lg">
                <div className="text-3xl font-bold text-green-600">{schoolAnalytics.totalTeachers}</div>
                <div className="text-gray-600 mt-1">Total Teachers</div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-xl border border-white/40 ring-1 ring-white/20 shadow-2xl p-6 rounded-lg">
                <div className="text-3xl font-bold text-purple-600">{schoolAnalytics.totalClasses}</div>
                <div className="text-gray-600 mt-1">Total Classes</div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-xl border border-white/40 ring-1 ring-white/20 shadow-2xl p-6 rounded-lg">
                <div className="text-3xl font-bold text-yellow-600">{schoolAnalytics.totalSubjects}</div>
                <div className="text-gray-600 mt-1">Total Subjects</div>
              </div>
            </div>

            {/* Analytics Toggle */}
            <div className="flex justify-end">
              <button 
                className={`px-4 py-2 rounded-md transition-colors ${
                  showAnalytics 
                    ? "bg-purple-600 text-white hover:bg-purple-700" 
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
                onClick={() => setShowAnalytics(!showAnalytics)}
              >
                {showAnalytics ? "Hide Analytics" : "Show Analytics"}
              </button>
            </div>

            {/* Analytics Section */}
            {showAnalytics && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Students per Class Chart */}
                <div className="bg-white/10 backdrop-blur-xl border border-white/40 ring-1 ring-white/20 shadow-2xl p-6 rounded-lg">
                  <PerformanceChart 
                    data={schoolAnalytics.studentsPerClassData} 
                    title="Students per Class" 
                    type="bar" 
                  />
                </div>
                
                {/* Teachers per Subject Chart */}
                <div className="bg-white/10 backdrop-blur-xl border border-white/40 ring-1 ring-white/20 shadow-2xl p-6 rounded-lg">
                  <PerformanceChart 
                    data={schoolAnalytics.teachersPerSubjectData} 
                    title="Teachers per Subject" 
                    type="bar" 
                  />
                </div>
              </div>
            )}

            {/* Students per Class */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/40 ring-1 ring-white/20 shadow-2xl p-6 rounded-lg">
              <h2 className="text-lg font-semibold mb-4">Students per Class</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(schoolAnalytics.studentsPerClass).map(([className, count]) => (
                  <div key={className} className="border border-gray-200 rounded-lg p-4 bg-white/20 backdrop-blur-sm">
                    <div className="font-medium">{className}</div>
                    <div className="text-2xl font-bold text-blue-600">{count}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Teachers per Subject */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/40 ring-1 ring-white/20 shadow-2xl p-6 rounded-lg">
              <h2 className="text-lg font-semibold mb-4">Teachers per Subject</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(schoolAnalytics.teachersPerSubject).map(([subject, count]) => (
                  <div key={subject} className="border border-gray-200 rounded-lg p-4 bg-white/20 backdrop-blur-sm">
                    <div className="font-medium">{subject}</div>
                    <div className="text-2xl font-bold text-green-600">{count}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {selectedTab === "classes" && (
          <div className="space-y-6">
            {/* Class Selection */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/40 ring-1 ring-white/20 shadow-2xl p-6 rounded-lg">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Class Reports</h2>
                <button
                  onClick={() => setShowAddStudentModal(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Add Student
                </button>
              </div>
              
              <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Class</label>
                  <select
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50 backdrop-blur-sm"
                    value={selectedClass}
                    onChange={e => setSelectedClass(e.target.value)}
                  >
                    <option value="">Choose Class</option>
                    {getAllClasses().map(cls => (
                      <option key={cls} value={cls}>{cls}</option>
                    ))}
                  </select>
                </div>

                {selectedClass && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Subject</label>
                    <select
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50 backdrop-blur-sm"
                      value={selectedSubject}
                      onChange={e => setSelectedSubject(e.target.value)}
                    >
                      <option value="">Choose Subject</option>
                      {getAllSubjects().map(sub => (
                        <option key={sub} value={sub}>{sub}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex items-end gap-2">
                  <button 
                    className={`flex-1 px-4 py-3 rounded-md transition-colors ${
                      showAnalytics 
                        ? "bg-purple-600 text-white hover:bg-purple-700" 
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                    onClick={() => setShowAnalytics(!showAnalytics)}
                    disabled={!selectedClass || !selectedSubject}
                  >
                    {showAnalytics ? "Hide Analytics" : "Show Analytics"}
                  </button>
                  
                  {/* New Trend Analysis Button */}
                  <button 
                    className={`flex-1 px-4 py-3 rounded-md transition-colors ${
                      showTrendAnalysis 
                        ? "bg-indigo-600 text-white hover:bg-indigo-700" 
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                    onClick={() => setShowTrendAnalysis(!showTrendAnalysis)}
                    disabled={!selectedClass || !selectedSubject}
                  >
                    {showTrendAnalysis ? "Hide Trends" : "Show Trends"}
                  </button>
                </div>
              </div>

              {selectedClass && (
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">{selectedClass} Details</h3>
                  
                  {(() => {
                    const classData = getClassData(selectedClass);
                    return (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white/10 backdrop-blur-xl border border-white/40 ring-1 ring-white/20 shadow-2xl p-4 rounded-lg">
                          <h4 className="font-medium mb-2">Student Information</h4>
                          <div className="text-3xl font-bold text-blue-600">{classData.studentCount}</div>
                          <div className="text-gray-600">Students</div>
                          
                          <div className="mt-4">
                            <h5 className="font-medium mb-2">Students List</h5>
                            <div className="max-h-60 overflow-y-auto">
                              <table className="w-full border-collapse border border-gray-300 text-sm bg-white/20 backdrop-blur-sm rounded-lg">
                                <thead>
                                  <tr className="bg-white/30">
                                    <th className="border border-gray-300 p-2 text-left">Name</th>
                                    <th className="border border-gray-300 p-2 text-left">ID</th>
                                    <th className="border border-gray-300 p-2 text-left">Actions</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {classStudents.map(student => (
                                    <tr key={student.id} className="hover:bg-white/30">
                                      <td className="border border-gray-300 p-2">
                                        {student.firstName} {student.lastName}
                                      </td>
                                      <td className="border border-gray-300 p-2">
                                        {student.idNumber || 'N/A'}
                                      </td>
                                      <td className="border border-gray-300 p-2">
                                        <div className="flex space-x-2">
                                          <button
                                            onClick={() => handleViewStudentReport(student)}
                                            className="text-blue-600 hover:text-blue-800 text-sm"
                                          >
                                            View Report
                                          </button>
                                          <button
                                            onClick={() => handlePrintStudentReport(student)}
                                            className="text-green-600 hover:text-green-800 text-sm"
                                          >
                                            Print
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-white/10 backdrop-blur-xl border border-white/40 ring-1 ring-white/20 shadow-2xl p-4 rounded-lg">
                          <h4 className="font-medium mb-2">Teacher Information</h4>
                          <div className="text-3xl font-bold text-green-600">{classData.teacherCount}</div>
                          <div className="text-gray-600">Assigned Teachers</div>
                          
                          <div className="mt-4">
                            <h5 className="font-medium mb-2">Teachers</h5>
                            <div className="max-h-60 overflow-y-auto">
                              <ul className="space-y-1 bg-white/20 backdrop-blur-sm p-2 rounded">
                                {classData.teachers.map(teacher => (
                                  <li key={teacher.id} className="text-sm p-1 hover:bg-white/30 rounded">
                                    {teacher.firstName} {teacher.lastName} - {teacher.primaryRole}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* Analytics Section */}
            {showAnalytics && selectedClass && selectedSubject && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Students per Class Chart */}
                <div className="bg-white/10 backdrop-blur-xl border border-white/40 ring-1 ring-white/20 shadow-2xl p-6 rounded-lg">
                  <PerformanceChart 
                    data={schoolAnalytics.studentsPerClassData} 
                    title="Students per Class" 
                    type="bar" 
                  />
                </div>
                
                {/* Teachers per Subject Chart */}
                <div className="bg-white/10 backdrop-blur-xl border border-white/40 ring-1 ring-white/20 shadow-2xl p-6 rounded-lg">
                  <PerformanceChart 
                    data={schoolAnalytics.teachersPerSubjectData} 
                    title="Teachers per Subject" 
                    type="bar" 
                  />
                </div>
              </div>
            )}

            {/* Trend Analysis Section */}
            {showTrendAnalysis && selectedClass && selectedSubject && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-900">Performance Trends</h2>
                
                {classTrendData ? (
                  <div className="grid grid-cols-1 gap-6">
                    <div className="bg-white/10 backdrop-blur-xl border border-white/40 ring-1 ring-white/20 shadow-2xl p-6 rounded-lg">
                      <TrendAnalysisChart 
                        data={classTrendData} 
                        title={`Class Performance Trend: ${selectedSubject} (${selectedClass})`}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="bg-white/10 backdrop-blur-xl border border-white/40 ring-1 ring-white/20 shadow-2xl p-6 rounded-lg">
                    <div className="text-center py-8 text-gray-500">
                      <p>Loading trend data...</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {selectedTab === "subjects" && (
          <div className="space-y-6">
            {/* Subject Selection */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/40 ring-1 ring-white/20 shadow-2xl p-6 rounded-lg">
              <h2 className="text-lg font-semibold mb-4">Subject Reports</h2>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Subject</label>
                <select
                  className="w-full md:w-64 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50 backdrop-blur-sm"
                  value={selectedSubject}
                  onChange={e => setSelectedSubject(e.target.value)}
                >
                  <option value="">Choose Subject</option>
                  {getAllSubjects().map(sub => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>

              {selectedSubject && (
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">{selectedSubject} Details</h3>
                  
                  {(() => {
                    const subjectData = getSubjectData(selectedSubject);
                    return (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white/10 backdrop-blur-xl border border-white/40 ring-1 ring-white/20 shadow-2xl p-4 rounded-lg">
                          <h4 className="font-medium mb-2">Teacher Information</h4>
                          <div className="text-3xl font-bold text-blue-600">{subjectData.teacherCount}</div>
                          <div className="text-gray-600">Teachers</div>
                          
                          <div className="mt-4">
                            <h5 className="font-medium mb-2">Teachers List</h5>
                            <div className="max-h-40 overflow-y-auto">
                              <ul className="space-y-1 bg-white/20 backdrop-blur-sm p-2 rounded">
                                {subjectData.teachers.map(teacher => (
                                  <li key={teacher.id} className="text-sm p-1 hover:bg-white/30 rounded">
                                    {teacher.firstName} {teacher.lastName} - {teacher.email}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-white/10 backdrop-blur-xl border border-white/40 ring-1 ring-white/20 shadow-2xl p-4 rounded-lg">
                          <h4 className="font-medium mb-2">Class Information</h4>
                          <div className="text-3xl font-bold text-green-600">{subjectData.classCount}</div>
                          <div className="text-gray-600">Classes</div>
                          
                          <div className="mt-4">
                            <h5 className="font-medium mb-2">Classes</h5>
                            <div className="max-h-40 overflow-y-auto">
                              <ul className="space-y-1 bg-white/20 backdrop-blur-sm p-2 rounded">
                                {subjectData.classes.map(className => (
                                  <li key={className} className="text-sm p-1 hover:bg-white/30 rounded">
                                    {className}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        )}

        {selectedTab === "teachers" && (
          <div className="space-y-6">
            {/* Teachers List */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/40 ring-1 ring-white/20 shadow-2xl p-6 rounded-lg">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">All Teachers</h2>
                <button
                  onClick={() => setShowAddTeacherModal(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Add Teacher
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300 text-sm bg-white/20 backdrop-blur-sm rounded-lg">
                  <thead>
                    <tr className="bg-white/30">
                      <th className="border border-gray-300 p-3 text-left">Name</th>
                      <th className="border border-gray-300 p-3 text-left">Email</th>
                      <th className="border border-gray-300 p-3 text-left">Roles</th>
                      <th className="border border-gray-300 p-3 text-left">Subjects</th>
                      <th className="border border-gray-300 p-3 text-left">Classes</th>
                      <th className="border border-gray-300 p-3 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teachers.map(teacher => (
                      <tr key={teacher.id} className="hover:bg-white/30">
                        <td className="border border-gray-300 p-3">
                          {teacher.firstName} {teacher.lastName}
                        </td>
                        <td className="border border-gray-300 p-3">
                          {teacher.email}
                        </td>
                        <td className="border border-gray-300 p-3">
                          <div className="space-y-2">
                            <div>
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                Primary: {teacher.primaryRole?.replace('_', ' ') || 'Subject Teacher'}
                              </span>
                            </div>
                            {teacher.allRoles && teacher.allRoles.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {teacher.allRoles
                                  .filter(role => role !== teacher.primaryRole)
                                  .map(role => (
                                    <span key={role} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                      {role.replace('_', ' ')}
                                    </span>
                                  ))
                                }
                              </div>
                            )}
                            {teacher.allRoles && teacher.allRoles.length === 0 && (
                              <span className="text-xs text-gray-500">No additional roles</span>
                            )}
                          </div>
                        </td>
                        <td className="border border-gray-300 p-3">
                          {Array.isArray(teacher.subjects) && teacher.subjects.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {teacher.subjects.map(subject => (
                                <span key={subject} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  {subject}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-500">None</span>
                          )}
                        </td>
                        <td className="border border-gray-300 p-3">
                          {Array.isArray(teacher.classes) && teacher.classes.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {teacher.classes.map(className => (
                                <span key={className} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                  {className}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-500">None</span>
                          )}
                        </td>
                        <td className="border border-gray-300 p-3">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => openRoleAssignment(teacher)}
                              className="bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700 text-sm"
                            >
                              Manage Roles
                            </button>
                            <button
                              onClick={() => handleOpenAssignmentModal(teacher)}
                              className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-sm"
                            >
                              Assign
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Performance Dashboard Tab */}
        {selectedTab === "performance" && (
          <div className="space-y-6">
            <div className="bg-white/10 backdrop-blur-xl border border-white/40 ring-1 ring-white/20 shadow-2xl p-6 rounded-lg">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">School-Wide Performance Overview</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Overall Academic Performance Trends */}
                <div className="bg-white/10 backdrop-blur-xl border border-white/40 ring-1 ring-white/20 shadow-2xl p-6 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4">Overall Academic Performance Trends</h3>
                  <TrendAnalysisChart 
                    data={performanceData.overallTrends} 
                    title="Academic Performance Across All Classes" 
                  />
                </div>
                
                {/* Subject Performance Comparison */}
                <div className="bg-white/10 backdrop-blur-xl border border-white/40 ring-1 ring-white/20 shadow-2xl p-6 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4">Subject Performance Comparison</h3>
                  <PerformanceChart 
                    data={performanceData.subjectComparison} 
                    title="Subject Performance Comparison" 
                    type="bar" 
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Performance by Grade Level */}
                <div className="bg-white/10 backdrop-blur-xl border border-white/40 ring-1 ring-white/20 shadow-2xl p-6 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4">Performance by Grade Level</h3>
                  <PerformanceChart 
                    data={performanceData.gradeLevelPerformance} 
                    title="Grade Level Performance" 
                    type="pie" 
                  />
                </div>
                
                {/* Year-over-Year Comparison */}
                <div className="bg-white/10 backdrop-blur-xl border border-white/40 ring-1 ring-white/20 shadow-2xl p-6 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4">Year-over-Year Comparison</h3>
                  <div className="space-y-4">
                    {Object.entries(performanceData.yearOverYear).map(([year, data]) => (
                      <div key={year} className="bg-white/20 backdrop-blur-sm p-4 rounded-lg border border-white/30">
                        <div className="flex justify-between items-center">
                          <h4 className="font-medium">{year}</h4>
                          <span className="text-lg font-bold text-blue-600">{data.averageScore}%</span>
                        </div>
                        <div className="mt-2">
                          <div className="flex justify-between text-sm text-gray-600">
                            <span>Students: {data.studentCount}</span>
                            <span>Average Score</span>
                          </div>
                          <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${data.averageScore}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Communication Hub Tab */}
        {selectedTab === "communication" && (
          <div className="space-y-6">
            <div className="bg-white/10 backdrop-blur-xl border border-white/40 ring-1 ring-white/20 shadow-2xl p-6 rounded-lg">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Communication Hub</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Announcements Management */}
                <div className="bg-white/10 backdrop-blur-xl border border-white/40 ring-1 ring-white/20 shadow-2xl p-6 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4">Announcements</h3>
                  <form onSubmit={handleAddAnnouncement} className="mb-6 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                      <input
                        type="text"
                        value={newAnnouncement.title}
                        onChange={(e) => setNewAnnouncement({...newAnnouncement, title: e.target.value})}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50 backdrop-blur-sm"
                        placeholder="Enter announcement title"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                      <textarea
                        value={newAnnouncement.content}
                        onChange={(e) => setNewAnnouncement({...newAnnouncement, content: e.target.value})}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50 backdrop-blur-sm"
                        rows="3"
                        placeholder="Enter announcement content"
                      ></textarea>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Audience</label>
                      <select
                        value={newAnnouncement.audience}
                        onChange={(e) => setNewAnnouncement({...newAnnouncement, audience: e.target.value})}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50 backdrop-blur-sm"
                      >
                        <option value="all">All</option>
                        <option value="teachers">Teachers Only</option>
                        <option value="parents">Parents Only</option>
                        <option value="students">Students Only</option>
                      </select>
                    </div>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 backdrop-blur-sm border border-blue-500/30"
                    >
                      Post Announcement
                    </button>
                  </form>
                  
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {announcements.map(announcement => (
                      <div key={announcement.id} className="bg-white/20 backdrop-blur-sm p-4 rounded-lg border border-white/30">
                        <div className="flex justify-between items-start">
                          <h4 className="font-medium">{announcement.title}</h4>
                          <span className="text-xs text-gray-500">{announcement.date}</span>
                        </div>
                        <p className="text-sm text-gray-700 mt-2">{announcement.content}</p>
                        <div className="mt-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {announcement.audience}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Messaging and Emergency Notifications */}
                <div className="space-y-6">
                  {/* Staff Messaging */}
                  <div className="bg-white/10 backdrop-blur-xl border border-white/40 ring-1 ring-white/20 shadow-2xl p-6 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4">Staff Messaging</h3>
                    <form onSubmit={handleSendMessage} className="mb-6 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Recipient</label>
                        <input
                          type="text"
                          value={newMessage.recipient}
                          onChange={(e) => setNewMessage({...newMessage, recipient: e.target.value})}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50 backdrop-blur-sm"
                          placeholder="Enter recipient name or group"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                        <textarea
                          value={newMessage.content}
                          onChange={(e) => setNewMessage({...newMessage, content: e.target.value})}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50 backdrop-blur-sm"
                          rows="3"
                          placeholder="Enter your message"
                        ></textarea>
                      </div>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 backdrop-blur-sm border border-green-500/30"
                      >
                        Send Message
                      </button>
                    </form>
                    
                    <div className="space-y-4 max-h-60 overflow-y-auto">
                      {messages.map(message => (
                        <div key={message.id} className="bg-white/20 backdrop-blur-sm p-4 rounded-lg border border-white/30">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="font-medium">{message.sender}</span>
                              <span className="text-gray-500 mx-2">→</span>
                              <span className="font-medium">{message.recipient}</span>
                            </div>
                            <span className="text-xs text-gray-500">{message.date}</span>
                          </div>
                          <p className="text-sm text-gray-700 mt-2">{message.content}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Emergency Notifications */}
                  <div className="bg-white/10 backdrop-blur-xl border border-white/40 ring-1 ring-white/20 shadow-2xl p-6 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4">Emergency Notifications</h3>
                    <form onSubmit={handleSendEmergency} className="mb-6 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                        <input
                          type="text"
                          value={newEmergency.title}
                          onChange={(e) => setNewEmergency({...newEmergency, title: e.target.value})}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50 backdrop-blur-sm"
                          placeholder="Enter emergency title"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                        <textarea
                          value={newEmergency.content}
                          onChange={(e) => setNewEmergency({...newEmergency, content: e.target.value})}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50 backdrop-blur-sm"
                          rows="3"
                          placeholder="Enter emergency details"
                        ></textarea>
                      </div>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 backdrop-blur-sm border border-red-500/30"
                      >
                        Send Emergency Notification
                      </button>
                    </form>
                    
                    <div className="space-y-4 max-h-60 overflow-y-auto">
                      {emergencyNotifications.map(emergency => (
                        <div key={emergency.id} className="bg-red-500/20 backdrop-blur-sm p-4 rounded-lg border border-red-300/50">
                          <div className="flex justify-between items-start">
                            <h4 className="font-medium text-red-800">{emergency.title}</h4>
                            <span className="text-xs text-red-700">{emergency.date}</span>
                          </div>
                          <p className="text-sm text-red-900 mt-2">{emergency.content}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Analytics Modal */}
      {showAnalytics && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/10 backdrop-blur-xl border border-white/40 ring-1 ring-white/20 shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-lg">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">School Analytics</h2>
                <button 
                  onClick={() => setShowAnalytics(false)} 
                  className="text-2xl text-gray-500 hover:text-gray-800 focus:outline-none"
                >
                  ×
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Students per Class Chart */}
                <div className="bg-white/20 backdrop-blur-sm p-4 rounded-lg border border-white/30">
                  <PerformanceChart 
                    data={schoolAnalytics.studentsPerClassData} 
                    title="Students per Class" 
                    type="bar" 
                  />
                </div>
                
                {/* Teachers per Subject Chart */}
                <div className="bg-white/20 backdrop-blur-sm p-4 rounded-lg border border-white/30">
                  <PerformanceChart 
                    data={schoolAnalytics.teachersPerSubjectData} 
                    title="Teachers per Subject" 
                    type="bar" 
                  />
                </div>
              </div>
              
              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowAnalytics(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Trend Analysis Modal */}
      {showTrendAnalysis && selectedClass && selectedSubject && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/10 backdrop-blur-xl border border-white/40 ring-1 ring-white/20 shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-lg">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Performance Trends</h2>
                <button 
                  onClick={() => setShowTrendAnalysis(false)} 
                  className="text-2xl text-gray-500 hover:text-gray-800 focus:outline-none"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-6">
                {classTrendData ? (
                  <div className="bg-white/20 backdrop-blur-sm p-4 rounded-lg border border-white/30">
                    <TrendAnalysisChart 
                      data={classTrendData} 
                      title={`Class Performance Trend: ${selectedSubject} (${selectedClass})`}
                    />
                  </div>
                ) : (
                  <div className="bg-white/20 backdrop-blur-sm p-6 rounded-lg border border-white/30 text-center">
                    <p className="text-gray-500">Loading trend data...</p>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowTrendAnalysis(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assignment Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/10 backdrop-blur-xl border border-white/40 ring-1 ring-white/20 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Assign Classes & Subjects
                </h2>
                <button 
                  onClick={() => {
                    setShowAssignModal(false);
                    setSelectedTeacherForAssignment(null);
                    setAssignmentForm({ subjects: [], classes: [] });
                  }} 
                  className="text-2xl text-gray-500 hover:text-gray-800 focus:outline-none"
                >
                  ×
                </button>
              </div>

              {selectedTeacherForAssignment && (
                <div className="mb-6 p-4 bg-white/20 backdrop-blur-sm rounded-lg border border-white/30">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {selectedTeacherForAssignment.firstName} {selectedTeacherForAssignment.lastName}
                  </h3>
                  <p className="text-gray-600">
                    {selectedTeacherForAssignment.email}
                  </p>
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">Subjects</label>
                  <div className="bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg p-4 max-h-40 overflow-y-auto">
                    <div className="grid grid-cols-2 gap-2">
                      {subjectsList.map(subject => (
                        <label key={subject} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={assignmentForm.subjects.includes(subject)}
                            onChange={() => handleAssignmentSubjectToggle(subject)}
                            className="rounded text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{subject}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">Classes</label>
                  <div className="bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg p-4 max-h-40 overflow-y-auto">
                    <div className="grid grid-cols-2 gap-2">
                      {getAllClasses().map(className => (
                        <label key={className} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={assignmentForm.classes.includes(className)}
                            onChange={() => handleAssignmentClassToggle(className)}
                            className="rounded text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{className}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAssignModal(false);
                      setSelectedTeacherForAssignment(null);
                      setAssignmentForm({ subjects: [], classes: [] });
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50/50 backdrop-blur-sm bg-white/30"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveAssignments}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 backdrop-blur-sm border border-blue-500/30"
                  >
                    Save Assignments
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Teacher Modal */}
      {showAddTeacherModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/10 backdrop-blur-xl border border-white/40 ring-1 ring-white/20 shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto rounded-lg">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Add New Teacher
                </h2>
                <button 
                  onClick={() => {
                    setShowAddTeacherModal(false);
                    setNewTeacher({
                      firstName: "",
                      lastName: "",
                      email: "",
                      gender: "male",
                      primaryRole: "subject_teacher"
                    });
                  }} 
                  className="text-2xl text-gray-500 hover:text-gray-800 focus:outline-none"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleAddTeacher} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input
                    type="text"
                    value={newTeacher.firstName}
                    onChange={(e) => setNewTeacher({...newTeacher, firstName: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50 backdrop-blur-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={newTeacher.lastName}
                    onChange={(e) => setNewTeacher({...newTeacher, lastName: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50 backdrop-blur-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={newTeacher.email}
                    onChange={(e) => setNewTeacher({...newTeacher, email: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50 backdrop-blur-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                  <select
                    value={newTeacher.gender}
                    onChange={(e) => setNewTeacher({...newTeacher, gender: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50 backdrop-blur-sm"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Primary Role</label>
                  <select
                    value={newTeacher.primaryRole}
                    onChange={(e) => setNewTeacher({...newTeacher, primaryRole: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50 backdrop-blur-sm"
                  >
                    <option value="subject_teacher">Subject Teacher</option>
                    <option value="class_teacher">Class Teacher</option>
                    <option value="form_master">Form Master</option>
                    <option value="head_teacher">Head Teacher</option>
                  </select>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddTeacherModal(false);
                      setNewTeacher({
                        firstName: "",
                        lastName: "",
                        email: "",
                        gender: "male",
                        primaryRole: "subject_teacher"
                      });
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50/50 backdrop-blur-sm bg-white/30"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 backdrop-blur-sm border border-blue-500/30"
                  >
                    Add Teacher
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add Student Modal */}
      {showAddStudentModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/10 backdrop-blur-xl border border-white/40 ring-1 ring-white/20 shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto rounded-lg">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Add New Student
                </h2>
                <button 
                  onClick={() => {
                    setShowAddStudentModal(false);
                    setNewStudent({
                      firstName: "",
                      lastName: "",
                      gender: "male",
                      className: "",
                      idNumber: ""
                    });
                  }} 
                  className="text-2xl text-gray-500 hover:text-gray-800 focus:outline-none"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleAddStudent} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input
                    type="text"
                    value={newStudent.firstName}
                    onChange={(e) => setNewStudent({...newStudent, firstName: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50 backdrop-blur-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={newStudent.lastName}
                    onChange={(e) => setNewStudent({...newStudent, lastName: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50 backdrop-blur-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                  <select
                    value={newStudent.gender}
                    onChange={(e) => setNewStudent({...newStudent, gender: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50 backdrop-blur-sm"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                  <select
                    value={newStudent.className}
                    onChange={(e) => setNewStudent({...newStudent, className: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50 backdrop-blur-sm"
                    required
                  >
                    <option value="">Select Class</option>
                    {classesList.map(cls => (
                      <option key={cls} value={cls}>{cls}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Student ID (Optional)</label>
                  <input
                    type="text"
                    value={newStudent.idNumber}
                    onChange={(e) => setNewStudent({...newStudent, idNumber: e.target.value})}
                    placeholder="Leave blank for auto-generation"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50 backdrop-blur-sm"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddStudentModal(false);
                      setNewStudent({
                        firstName: "",
                        lastName: "",
                        gender: "male",
                        className: "",
                        idNumber: ""
                      });
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50/50 backdrop-blur-sm bg-white/30"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 backdrop-blur-sm border border-blue-500/30"
                  >
                    Add Student
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Student Report Modal */}
      {showStudentReport && selectedStudent && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/10 backdrop-blur-xl border border-white/40 ring-1 ring-white/20 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Student Report: {selectedStudent.firstName} {selectedStudent.lastName}
                </h2>
                <button 
                  onClick={() => {
                    setShowStudentReport(false);
                    setSelectedStudent(null);
                  }} 
                  className="text-2xl text-gray-500 hover:text-gray-800 focus:outline-none"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4" id="print-area">
                <div className="bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-3">Student Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Name</p>
                      <p className="font-medium">{selectedStudent.firstName} {selectedStudent.lastName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Student ID</p>
                      <p className="font-medium">{selectedStudent.idNumber || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Class</p>
                      <p className="font-medium">{selectedStudent.className}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Gender</p>
                      <p className="font-medium">{selectedStudent.gender}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-3">Academic Performance</h3>
                  <p className="text-gray-600">In a full implementation, this section would show the student's academic performance across subjects.</p>
                  <div className="mt-4 bg-yellow-500/20 border border-yellow-300/50 rounded-lg p-4 backdrop-blur-sm">
                    <p className="text-yellow-900">
                      <strong>Note:</strong> This is a demonstration interface. In a production environment, 
                      this would pull actual academic data from the system.
                    </p>
                  </div>
                </div>

                <div className="bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-3">Attendance & Remarks</h3>
                  <p className="text-gray-600">This section would show attendance records and teacher remarks.</p>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => {
                    setShowStudentReport(false);
                    setSelectedStudent(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50/50 backdrop-blur-sm bg-white/30"
                >
                  Close
                </button>
                <button
                  onClick={() => handlePrintStudentReport(selectedStudent)}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 backdrop-blur-sm border border-green-500/30"
                >
                  Print Report
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Teacher Role Management Modal */}
      {showTeacherRoleModal && selectedTeacher && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/10 backdrop-blur-xl rounded-lg shadow-2xl border border-white/40 ring-1 ring-white/20 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Manage Roles for {selectedTeacher.firstName} {selectedTeacher.lastName}</h2>
                <button 
                  className="text-4xl text-gray-500 hover:text-gray-800 focus:outline-none"
                  onClick={() => setShowTeacherRoleModal(false)}
                >
                  ✕
                </button>
              </div>
              <form onSubmit={handleAssignRoles}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">Primary Role</label>
                  <select 
                    value={teacherRoles.primaryRole} 
                    onChange={(e) => {
                      const newPrimaryRole = e.target.value;
                      setTeacherRoles(prev => ({ ...prev, primaryRole: newPrimaryRole }));
                      
                      // Ensure the new primary role is in allRoles
                      if (!teacherRoles.allRoles.includes(newPrimaryRole)) {
                        handleRoleToggle(newPrimaryRole);
                      }
                    }} 
                    className="mt-1 block w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50 backdrop-blur-sm" 
                  >
                    <option value="subject_teacher">Subject Teacher</option>
                    <option value="class_teacher">Class Teacher</option>
                    <option value="form_master">Form Master</option>
                    <option value="head_teacher">Head Teacher</option>
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">All Roles</label>
                  <div className="grid grid-cols-2 gap-3 p-4 border border-white/30 rounded-lg bg-white/20 backdrop-blur-sm">
                    {["subject_teacher", "class_teacher", "form_master", "head_teacher"].map(role => (
                      <label key={role} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-white/30 transition-colors">
                        <input 
                          type="checkbox" 
                          checked={teacherRoles.allRoles.includes(role)} 
                          onChange={() => handleRoleToggle(role)} 
                          className="rounded text-blue-600 focus:ring-blue-500 h-5 w-5" 
                        />
                        <span className="text-sm font-medium text-gray-800">
                          {role === 'subject_teacher' ? 'Subject Teacher' :
                           role === 'class_teacher' ? 'Class Teacher' :
                           role === 'form_master' ? 'Form Master' :
                           role === 'head_teacher' ? 'Head Teacher' : 'Teacher'}
                        </span>
                      </label>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-gray-600">Select all roles this teacher has. The primary role is marked above.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Classes</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-3 border border-white/30 rounded-lg bg-white/20 backdrop-blur-sm">
                    {getAllClasses().map(className => (
                      <label key={className} className="flex items-center space-x-2">
                        <input 
                          type="checkbox" 
                          checked={teacherRoles.classes.includes(className)} 
                          onChange={() => handleClassToggle(className)} 
                          className="rounded text-blue-600 focus:ring-blue-500" 
                        />
                        <span className="text-sm text-gray-800">{className}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subjects</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-3 border border-white/30 rounded-lg bg-white/20 backdrop-blur-sm">
                    {subjectsList.map(subject => (
                      <label key={subject} className="flex items-center space-x-2">
                        <input 
                          type="checkbox" 
                          checked={teacherRoles.subjects.includes(subject)} 
                          onChange={() => handleSubjectToggle(subject)} 
                          className="rounded text-blue-600 focus:ring-blue-500" 
                        />
                        <span className="text-sm text-gray-800">{subject}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end space-x-4 pt-6">
                  <button
                    type="button"
                    onClick={() => setShowTeacherRoleModal(false)}
                    className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50/50 backdrop-blur-sm bg-white/30"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 backdrop-blur-sm border border-blue-500/30"
                  >
                    Save Roles
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default HeadTeacherPage;