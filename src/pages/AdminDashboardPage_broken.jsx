import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { getTeachers, getLearners, addTeacher, addLearner, deleteTeacher, deleteLearner } from "../api";
import { updateTeacher } from "../api/localStorageApi";


const subjectsList = [
  "English Language", "Mathematics", "Science", "Social Studies", "Ghanaian Language",
  "Religious and Moral Education (RME)", "Creative Arts and Design", "Career Technology",
  "Computing", "Physical and Health Education (PHE)", "OWOP", "History", "French", "Arabic"
];

const classesList = [
  "K.G 1", "K.G 2", "BS1", "BS2", "BS3", "BS4", "BS5", "BS6", "BS7", "BS8", "BS9"
];

const AdminDashboardPage = () => {
  const [teachers, setTeachers] = useState([]);
  const [learners, setLearners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false); // New state for role dropdown animation
  
  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [showLearnerModal, setShowLearnerModal] = useState(false);
  const [showAddTeacherForm, setShowAddTeacherForm] = useState(false);
  const [showAddLearnerForm, setShowAddLearnerForm] = useState(false);
  const [showClassView, setShowClassView] = useState(false);
  const [showClassDetailsView, setShowClassDetailsView] = useState(false);
  const [selectedClassDetails, setSelectedClassDetails] = useState(null);
  const [showClassSetupView, setShowClassSetupView] = useState(false);
  
  const [teacherForm, setTeacherForm] = useState({
    firstName: "", lastName: "", gender: "", email: "", subjects: [], 
    password: "teacher123", primaryRole: "teacher", classes: []
  });
  
  const [learnerForm, setLearnerForm] = useState({
    firstName: "", lastName: "", className: "", gender: ""
  });
  
  const [selectedClass, setSelectedClass] = useState("");
  const [teacherSearch, setTeacherSearch] = useState("");
  const [learnerSearch, setLearnerSearch] = useState("");
  
  const [schoolName] = useState(localStorage.getItem('schoolName') || 'DERIAD\'S eSBA');

  useEffect(() => {
    loadData();
    
    // Add event listener for role dropdown toggle
    const handleRoleDropdownToggle = (event) => {
      setIsRoleDropdownOpen(event.detail.isOpen);
    };
    
    window.addEventListener('roleDropdownToggle', handleRoleDropdownToggle);
    
    // Cleanup event listener
    return () => {
      window.removeEventListener('roleDropdownToggle', handleRoleDropdownToggle);
    };
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [teachersResponse, learnersResponse] = await Promise.all([
        getTeachers(),
        getLearners()
      ]);
      
      if (teachersResponse && teachersResponse.status === 'success') {
        setTeachers(teachersResponse.data || []);
      }
      
      if (learnersResponse && learnersResponse.status === 'success') {
        setLearners(learnersResponse.data || []);
      }
    } catch (err) {
      console.error("Error loading data:", err);
      setError("Backend endpoint updated - data should load properly now");
    } finally {
      setLoading(false);
    }
  };

  const handleAddTeacher = async (e) => {
    e.preventDefault();
    try {
      // Include role information and password from the form
      const teacherData = {
        ...teacherForm,
        primaryRole: "teacher",
        allRoles: ["teacher"],
        classes: [],
        subjects: teacherForm.subjects || []
      };
      
      const response = await addTeacher(teacherData);
      if (response && response.status === 'success') {
        setTeachers(prev => [...prev, response.data]);
        setTeacherForm({
          firstName: "", lastName: "", gender: "", email: "", subjects: [], 
          password: "teacher123", primaryRole: "teacher", classes: []
        });
        setShowAddTeacherForm(false);
        alert("Teacher added successfully!");
      }
    } catch (error) {
      console.error("Error adding teacher:", error);
      alert("Failed to add teacher. Please try again.");
    }
  };

  const handleDeleteTeacher = async (teacherId) => {
    try {
      const response = await deleteTeacher(teacherId);
      if (response && response.status === 'success') {
        setTeachers(prev => prev.filter(teacher => teacher.id !== teacherId));
        alert("Teacher deleted successfully!");
      }
    } catch (error) {
      console.error("Error deleting teacher:", error);
      alert("Failed to delete teacher. Please try again.");
    }
  };

  const handleAddLearner = async (e) => {
    e.preventDefault();
    try {
      // Generate learner ID
      const idNumber = generateLearnerId();
      
      const response = await addLearner({
        ...learnerForm,
        idNumber
      });
      
      if (response && response.status === 'success') {
        setLearners(prev => [...prev, response.data]);
        setLearnerForm({
          firstName: "", lastName: "", className: "", gender: ""
        });
        setShowAddLearnerForm(false);
        alert("Student added successfully!");
      }
    } catch (error) {
      console.error("Error adding student:", error);
      alert("Failed to add student. Please try again.");
    }
  };

  const handleDeleteLearner = async (learnerId) => {
    try {
      const response = await deleteLearner(learnerId);
      if (response && response.status === 'success') {
        // Use the correct ID field for filtering
        setLearners(prev => prev.filter(learner => learner.id !== learnerId));
        alert("Student deleted successfully!");
      }
    } catch (error) {
      console.error("Error deleting student:", error);
      alert("Failed to delete student. Please try again.");
    }
  };
  
  const handleTeacherChange = (e) => {
    setTeacherForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleLearnerChange = (e) => {
    setLearnerForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubjectToggle = (subject) => {
    setTeacherForm(prev => ({
      ...prev,
      subjects: prev.subjects.includes(subject)
        ? prev.subjects.filter(s => s !== subject)
        : [...prev.subjects, subject]
    }));
  };

  // Add state for teacher role management
  const [showTeacherRoleModal, setShowTeacherRoleModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [teacherRoles, setTeacherRoles] = useState({
    primaryRole: "teacher",
    allRoles: ["teacher"],
    classes: [],
    subjects: []
  });

  // Function to assign roles to teachers
  const assignRolesToTeacher = async (teacherId, rolesData) => {
    try {
      // Prepare the complete teacher data with ID
      const teacherData = {
        id: teacherId,
        ...rolesData
      };
      
      // Use the API function to update the teacher
      const response = await updateTeacher(teacherData);
      
      if (response && response.status === 'success') {
        // Update state with the updated teacher data
        setTeachers(prevTeachers => 
          prevTeachers.map(teacher => 
            teacher.id === teacherId ? { ...teacher, ...response.data } : teacher
          )
        );
        return response;
      } else {
        throw new Error("Failed to update teacher roles");
      }
    } catch (error) {
      console.error("Error assigning roles to teacher:", error);
      throw error;
    }
  };

  // Handle role assignment
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
      
      await assignRolesToTeacher(selectedTeacher.id, rolesData);
      setShowTeacherRoleModal(false);
      setSelectedTeacher(null);
      setTeacherRoles({
        primaryRole: "teacher",
        allRoles: ["teacher"],
        classes: [],
        subjects: []
      });
      alert("Teacher roles updated successfully!");
    } catch (error) {
      console.error("Error updating teacher roles:", error);
      alert("Failed to update teacher roles. Please try again.");
    }
  };

  // Open role assignment modal
  const openRoleAssignment = (teacher) => {
    setSelectedTeacher(teacher);
    setTeacherRoles({
      primaryRole: teacher.primaryRole || "teacher",
      allRoles: teacher.allRoles && teacher.allRoles.length > 0 ? teacher.allRoles : [teacher.primaryRole || "teacher"],
      classes: teacher.classes || [],
      subjects: teacher.subjects || []
    });
    setShowTeacherRoleModal(true);
  };

  // Handle role checkbox changes
  const handleRoleToggle = (role) => {
    setTeacherRoles(prev => {
      const allRoles = prev.allRoles.includes(role)
        ? prev.allRoles.filter(r => r !== role)
        : [...prev.allRoles, role];
      
      return {
        ...prev,
        allRoles,
        primaryRole: allRoles.includes(prev.primaryRole) ? prev.primaryRole : allRoles[0] || "teacher"
      };
    });
  };

  // Handle class checkbox changes
  const handleClassToggle = (className) => {
    setTeacherRoles(prev => {
      const classes = prev.classes.includes(className)
        ? prev.classes.filter(c => c !== className)
        : [...prev.classes, className];
      
      return { ...prev, classes };
    });
  };

  // Handle subject checkbox changes
  const handleSubjectToggleForRoles = (subject) => {
    setTeacherRoles(prev => {
      const subjects = prev.subjects.includes(subject)
        ? prev.subjects.filter(s => s !== subject)
        : [...prev.subjects, subject];
      
      return { ...prev, subjects };
    });
  };

  // Add state for teacher password management
  const [showTeacherPasswordModal, setShowTeacherPasswordModal] = useState(false);
  const [selectedTeacherForPassword, setSelectedTeacherForPassword] = useState(null);
  const [teacherPassword, setTeacherPassword] = useState("");

  // Function to update teacher password
  const updateTeacherPassword = async (teacherId, newPassword) => {
    try {
      // Get current teachers from localStorage
      const currentTerm = localStorage.getItem('currentTerm') || 'First Term';
      const currentYear = localStorage.getItem('currentAcademicYear') || '2024/2025';
      const termKey = `${currentYear.replace('/', '_')}_${currentTerm.replace(' ', '_')}_teachers`;
      
      const teachers = JSON.parse(localStorage.getItem(termKey) || '[]');
      
      // Find and update the teacher
      const updatedTeachers = teachers.map(teacher => {
        if (teacher.id === teacherId) {
          return {
            ...teacher,
            password: newPassword
          };
        }
        return teacher;
      });
      
      // Save updated teachers
      localStorage.setItem(termKey, JSON.stringify(updatedTeachers));
      
      // Update state
      setTeachers(updatedTeachers);
      
      return { status: 'success', message: 'Teacher password updated successfully' };
    } catch (error) {
      console.error("Error updating teacher password:", error);
      throw error;
    }
  };

  // Handle password update
  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    try {
      if (!selectedTeacherForPassword || !teacherPassword) {
        alert("Please enter a password");
        return;
      }
      
      await updateTeacherPassword(selectedTeacherForPassword.id, teacherPassword);
      setShowTeacherPasswordModal(false);
      setSelectedTeacherForPassword(null);
      setTeacherPassword("");
      alert("Teacher password updated successfully!");
    } catch (error) {
      console.error("Error updating teacher password:", error);
      alert("Failed to update teacher password. Please try again.");
    }
  };

  // Open password update modal
  const openPasswordUpdate = (teacher) => {
    setSelectedTeacherForPassword(teacher);
    setTeacherPassword(teacher.password || "");
    setShowTeacherPasswordModal(true);
  };

  // Add state for class setup
  const [showClassSetupModal, setShowClassSetupModal] = useState(false);
  const [selectedTeacherForClass, setSelectedTeacherForClass] = useState(null);
  const [teacherClasses, setTeacherClasses] = useState([]);
  const [teacherSubjects, setTeacherSubjects] = useState([]);

  // Open class setup modal
  const openClassSetup = (teacher) => {
    setSelectedTeacherForClass(teacher);
    setTeacherClasses(teacher.classes || []);
    setTeacherSubjects(teacher.subjects || []);
    setShowClassSetupModal(true);
  };

  // Handle class checkbox changes
  const handleClassToggleForSetup = (className) => {
    setTeacherClasses(prev => {
      if (prev.includes(className)) {
        return prev.filter(c => c !== className);
      } else {
        return [...prev, className];
      }
    });
  };

  // Handle subject checkbox changes
  const handleSubjectToggleForSetup = (subject) => {
    setTeacherSubjects(prev => {
      if (prev.includes(subject)) {
        return prev.filter(s => s !== subject);
      } else {
        return [...prev, subject];
      }
    });
  };

  // Update teacher classes and subjects
  const updateTeacherClassesAndSubjects = async (teacherId, classes, subjects) => {
    try {
      // Get current teachers from localStorage
      const currentTerm = localStorage.getItem('currentTerm') || 'First Term';
      const currentYear = localStorage.getItem('currentAcademicYear') || '2024/2025';
      const termKey = `${currentYear.replace('/', '_')}_${currentTerm.replace(' ', '_')}_teachers`;
      
      const teachers = JSON.parse(localStorage.getItem(termKey) || '[]');
      
      // Find and update the teacher
      const updatedTeachers = teachers.map(teacher => {
        if (teacher.id === teacherId) {
          return {
            ...teacher,
            classes: classes,
            subjects: subjects
          };
        }
        return teacher;
      });
      
      // Save updated teachers
      localStorage.setItem(termKey, JSON.stringify(updatedTeachers));
      
      // Update state
      setTeachers(updatedTeachers);
      
      return { status: 'success', message: 'Teacher classes and subjects updated successfully' };
    } catch (error) {
      console.error("Error updating teacher classes and subjects:", error);
      throw error;
    }
  };

  // Handle class and subject assignment
  const handleAssignClassesAndSubjects = async (e) => {
    e.preventDefault();
    try {
      if (!selectedTeacherForClass) return;
      
      await updateTeacherClassesAndSubjects(
        selectedTeacherForClass.id, 
        teacherClasses, 
        teacherSubjects
      );
      
      setShowClassSetupModal(false);
      setSelectedTeacherForClass(null);
      setTeacherClasses([]);
      setTeacherSubjects([]);
      alert("Teacher classes and subjects updated successfully!");
    } catch (error) {
      console.error("Error updating teacher classes and subjects:", error);
      alert("Failed to update teacher classes and subjects. Please try again.");
    }
  };

  const printClassBroadsheet = (className, students) => {
    try {
      // Create a simple broadsheet print view
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        alert("Popup blocked. Please allow popups for this site.");
        return;
      }

      const htmlContent = `<!DOCTYPE html>
        <html>
          <head>
            <title>Class Broadsheet - ${className}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .header { text-align: center; margin-bottom: 30px; }
              .school-name { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
              .broadsheet-title { font-size: 18px; margin-bottom: 10px; }
              .details { font-size: 14px; color: #666; }
              table { border-collapse: collapse; width: 100%; margin-top: 20px; }
              th, td { border: 1px solid black; padding: 8px; text-align: center; }
              th { background-color: #f0f0f0; font-weight: bold; }
              .student-name { text-align: left; }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="school-name">${schoolName}</div>
              <div class="broadsheet-title">Class Broadsheet</div>
              <div class="details">
                Class: ${className} | Total Students: ${students.length} | Date: ${new Date().toLocaleDateString()}
              </div>
            </div>
            <table>
              <thead>
                <tr>
                  <th class="student-name">Student Name</th>
                  <th>Student ID</th>
                </tr>
              </thead>
              <tbody>
                ${students.map(student => `
                  <tr>
                    <td class="student-name">${student.firstName} ${student.lastName}</td>
                    <td>${student.idNumber}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </body>
        </html>`;
      
      printWindow.document.open();
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      setTimeout(() => {
        printWindow.print();
      }, 1000);
      
    } catch (error) {
      console.error("Print broadsheet error:", error);
      alert("Print failed: " + error.message);
    }
  };

  const printStudentReport = (student) => {
    try {
      // Create a simple student report print view
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        alert("Popup blocked. Please allow popups for this site.");
        return;
      }

      const htmlContent = `<!DOCTYPE html>
        <html>
          <head>
            <title>Student Report - ${student.firstName} ${student.lastName}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .header { text-align: center; margin-bottom: 30px; }
              .school-name { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
              .report-title { font-size: 18px; margin-bottom: 10px; }
              .details { font-size: 14px; color: #666; }
              .student-info { margin: 20px 0; }
              .info-row { display: flex; margin-bottom: 10px; }
              .info-label { font-weight: bold; width: 150px; }
              table { border-collapse: collapse; width: 100%; margin-top: 20px; }
              th, td { border: 1px solid black; padding: 8px; text-align: center; }
              th { background-color: #f0f0f0; font-weight: bold; }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="school-name">${schoolName}</div>
              <div class="report-title">Student Report</div>
              <div class="details">
                Date: ${new Date().toLocaleDateString()}
              </div>
            </div>
            
            <div class="student-info">
              <div class="info-row">
                <div class="info-label">Student Name:</div>
                <div>${student.firstName} ${student.lastName}</div>
              </div>
              <div class="info-row">
                <div class="info-label">Student ID:</div>
                <div>${student.idNumber}</div>
              </div>
              <div class="info-row">
                <div class="info-label">Class:</div>
                <div>${student.className}</div>
              </div>
            </div>
            
            <div>
              <h3>Academic Performance</h3>
              <p>No academic records available for this student.</p>
            </div>
          </body>
        </html>`;
      
      printWindow.document.open();
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      setTimeout(() => {
        printWindow.print();
      }, 1000);
      
    } catch (error) {
      console.error("Print student report error:", error);
      alert("Print failed: " + error.message);
    }
  };

  const printAllClassBroadsheets = () => {
    try {
      // Group students by class
      const studentsByClass = {};
      learners.forEach(student => {
        if (!studentsByClass[student.className]) {
          studentsByClass[student.className] = [];
        }
        studentsByClass[student.className].push(student);
      });

      // Create a single print view with all class broadsheets
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        alert("Popup blocked. Please allow popups for this site.");
        return;
      }

      let broadsheetsHtml = '';
      Object.keys(studentsByClass).forEach(className => {
        const students = studentsByClass[className];
        broadsheetsHtml += `
          <div class="class-broadsheet" style="page-break-after: always; margin-bottom: 40px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="font-size: 24px; font-weight: bold; margin-bottom: 5px;">${schoolName}</div>
              <div style="font-size: 18px; margin-bottom: 10px;">Class Broadsheet</div>
              <div style="font-size: 14px; color: #666;">
                Class: ${className} | Total Students: ${students.length} | Date: ${new Date().toLocaleDateString()}
              </div>
            </div>
            <table style="border-collapse: collapse; width: 100%; margin-top: 20px;">
              <thead>
                <tr>
                  <th style="border: 1px solid black; padding: 8px; text-align: center; background-color: #f0f0f0;">No.</th>
                  <th style="border: 1px solid black; padding: 8px; text-align: left; background-color: #f0f0f0;">Student Name</th>
                  <th style="border: 1px solid black; padding: 8px; text-align: center; background-color: #f0f0f0;">Student ID</th>
                </tr>
              </thead>
              <tbody>
                ${students.map((student, index) => `
                  <tr>
                    <td style="border: 1px solid black; padding: 8px; text-align: center;">${index + 1}</td>
                    <td style="border: 1px solid black; padding: 8px; text-align: left;">${student.firstName} ${student.lastName}</td>
                    <td style="border: 1px solid black; padding: 8px; text-align: center;">${student.idNumber}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `;
      });

      const htmlContent = `<!DOCTYPE html>
        <html>
          <head>
            <title>All Class Broadsheets</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
            </style>
          </head>
          <body>
            ${broadsheetsHtml}
          </body>
        </html>`;
      
      printWindow.document.open();
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      setTimeout(() => {
        printWindow.print();
      }, 1000);
      
    } catch (error) {
      console.error("Print all broadsheets error:", error);
      alert("Print failed: " + error.message);
    }
  };

  const printAllStudentReports = () => {
    try {
      // Create a print view with all student reports
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        alert("Popup blocked. Please allow popups for this site.");
        return;
      }

      let reportsHtml = '';
      learners.forEach(student => {
        reportsHtml += `
          <div class="student-report" style="page-break-after: always; margin-bottom: 40px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="font-size: 24px; font-weight: bold; margin-bottom: 5px;">${schoolName}</div>
              <div style="font-size: 18px; margin-bottom: 10px;">Student Report</div>
              <div style="font-size: 14px; color: #666;">
                Date: ${new Date().toLocaleDateString()}
              </div>
            </div>
            
            <div style="margin: 20px 0;">
              <div style="display: flex; margin-bottom: 10px;">
                <div style="font-weight: bold; width: 150px;">Student Name:</div>
                <div>${student.firstName} ${student.lastName}</div>
              </div>
              <div style="display: flex; margin-bottom: 10px;">
                <div style="font-weight: bold; width: 150px;">Student ID:</div>
                <div>${student.idNumber}</div>
              </div>
              <div style="display: flex; margin-bottom: 10px;">
                <div style="font-weight: bold; width: 150px;">Class:</div>
                <div>${student.className}</div>
              </div>
            </div>
            
            <div>
              <h3 style="margin: 20px 0 10px 0;">Academic Performance</h3>
              <p>No academic records available for this student.</p>
            </div>
          </div>
        `;
      });

      const htmlContent = `<!DOCTYPE html>
        <html>
          <head>
            <title>All Student Reports</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
            </style>
          </head>
          <body>
            ${reportsHtml}
          </body>
        </html>`;
      
      printWindow.document.open();
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      setTimeout(() => {
        printWindow.print();
      }, 1000);
      
    } catch (error) {
      console.error("Print all reports error:", error);
      alert("Print failed: " + error.message);
    }
  };

  const exportData = () => {
    try {
      // Create a CSV export of all data
      let csvContent = "Class,Student ID,First Name,Last Name,Gender\n";
      
      learners.forEach(student => {
        csvContent += `"${student.className}","${student.idNumber}","${student.firstName}","${student.lastName}","${student.gender}"\n`;
      });
      
      // Create download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `student_data_${new Date().toISOString().slice(0, 10)}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      alert("Data exported successfully!");
    } catch (error) {
      console.error("Export data error:", error);
      alert("Export failed: " + error.message);
    }
  };

  const generateLearnerId = () => {
    if (learners.length === 0) return "eSBA0001";
    
    // Find the highest numbered ID among existing learners
    let maxNumber = 0;
    learners.forEach(learner => {
      if (learner.idNumber && learner.idNumber.startsWith("eSBA")) {
        const numberPart = learner.idNumber.replace("eSBA", "");
        const number = parseInt(numberPart, 10);
        if (!isNaN(number) && number > maxNumber) {
          maxNumber = number;
        }
      }
    });
    
    // Increment the highest number and format it
    const nextNumber = maxNumber + 1;
    return `eSBA${nextNumber.toString().padStart(4, "0")}`;
  };

  const filteredTeachers = teachers.filter(teacher => {
    const searchTerm = teacherSearch.toLowerCase();
    return (
      teacher.firstName?.toLowerCase().includes(searchTerm) ||
      teacher.lastName?.toLowerCase().includes(searchTerm) ||
      teacher.email?.toLowerCase().includes(searchTerm)
    );
  });

  const filteredLearners = learners.filter(learner => {
    const searchTerm = learnerSearch.toLowerCase();
    const matchesSearch = (
      learner.firstName?.toLowerCase().includes(searchTerm) ||
      learner.lastName?.toLowerCase().includes(searchTerm) ||
      learner.className?.toLowerCase().includes(searchTerm) ||
      learner.idNumber?.toLowerCase().includes(searchTerm)
    );
    
    // If a specific class is selected, only show students from that class
    if (selectedClass) {
      return matchesSearch && learner.className === selectedClass;
    }
    
    return matchesSearch;
  });

  if (loading && teachers.length === 0 && learners.length === 0) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-lg">Loading admin dashboard...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className={`bg-white/10 backdrop-blur-xl p-6 rounded-lg shadow-2xl border-2 border-white/40 ring-1 ring-white/20 transition-all duration-300 ease-in-out ${isRoleDropdownOpen ? 'transform translate-y-40' : ''}`}>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Welcome to DERIAD'S eSBA Management System</p>
          <div className="text-sm text-gray-600 mt-2">
            Teachers: {teachers.length} | Students: {learners.length}
          </div>
          {error && (
            <div className="mt-4 p-4 bg-blue-50/70 border-2 border-blue-300/60 rounded-lg backdrop-blur-sm">
              <div className="flex justify-between items-start">
                <div className="text-blue-800">
                  <strong>✅ System Update:</strong> {error}
                </div>
                <button onClick={() => setError("")} className="text-blue-600 hover:text-blue-800">
                  ✕
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons - Add Class Setup button */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <div className="bg-white/10 backdrop-blur-xl rounded-lg shadow-2xl border border-white/40 ring-1 ring-white/20 hover:shadow-md transition-shadow duration-300 min-h-[220px] flex flex-col items-center justify-center p-6">
            <button 
              className="flex flex-col items-center justify-center w-full h-full focus:outline-none"
              onClick={() => setShowTeacherModal(true)}
            >
              <div className="text-4xl mb-4">👩‍🏫</div>
              <div className="text-xl font-semibold mb-2 text-gray-800">
                Teachers
              </div>
              <div className="text-sm text-gray-600">{teachers.length} teachers</div>
            </button>
          </div>

          <div className="bg-white/10 backdrop-blur-xl rounded-lg shadow-2xl border border-white/40 ring-1 ring-white/20 hover:shadow-md transition-shadow duration-300 min-h-[220px] flex flex-col items-center justify-center p-6">
            <button 
              className="flex flex-col items-center justify-center w-full h-full focus:outline-none"
              onClick={() => setShowLearnerModal(true)}
            >
              <div className="text-4xl mb-4">🎓</div>
              <div className="text-xl font-semibold mb-2 text-gray-800">
                Students
              </div>
              <div className="text-sm text-gray-600">{learners.length} students</div>
            </button>
          </div>

          <div className="bg-white/10 backdrop-blur-xl rounded-lg shadow-2xl border border-white/40 ring-1 ring-white/20 hover:shadow-md transition-shadow duration-300 min-h-[220px] flex flex-col items-center justify-center p-6">
            <button 
              className="flex flex-col items-center justify-center w-full h-full focus:outline-none"
              onClick={() => setShowClassView(true)}
            >
              <div className="text-4xl mb-4">📚</div>
              <div className="text-xl font-semibold mb-2 text-gray-800">
                View by Class
              </div>
              <div className="text-sm text-gray-600">Students organized by class</div>
            </button>
          </div>

          <div className="bg-white/10 backdrop-blur-xl rounded-lg shadow-2xl border border-white/40 ring-1 ring-white/20 hover:shadow-md transition-shadow duration-300 min-h-[220px] flex flex-col items-center justify-center p-6">
            <button 
              className="flex flex-col items-center justify-center w-full h-full focus:outline-none disabled:opacity-50"
              onClick={loadData}
              disabled={loading}
            >
              <div className="text-4xl mb-4">🔄</div>
              <div className="text-xl font-semibold mb-2 text-gray-800">
                {loading ? "Loading..." : "Refresh Data"}
              </div>
              <div className="text-sm text-gray-600">Update information</div>
            </button>
          </div>

          <div className="bg-white/10 backdrop-blur-xl rounded-lg shadow-2xl border border-white/40 ring-1 ring-white/20 hover:shadow-md transition-shadow duration-300 min-h-[220px] flex flex-col items-center justify-center p-6">
            <button 
              className="flex flex-col items-center justify-center w-full h-full focus:outline-none"
              onClick={() => setShowClassSetupView(true)}
            >
              <div className="text-4xl mb-4">⚙️</div>
              <div className="text-xl font-semibold mb-2 text-gray-800">
                Class Setup
              </div>
              <div className="text-sm text-gray-600">Assign classes & subjects</div>
            </button>
          </div>

          {/* Print and Export Functions */}
          <div className="bg-white/10 backdrop-blur-xl rounded-lg shadow-2xl border border-white/40 ring-1 ring-white/20 hover:shadow-md transition-shadow duration-300 min-h-[220px] flex flex-col items-center justify-center p-6">
            <button 
              className="flex flex-col items-center justify-center w-full h-full focus:outline-none"
              onClick={printAllClassBroadsheets}
            >
              <div className="text-4xl mb-4">📋</div>
              <div className="text-xl font-semibold mb-2 text-gray-800">
                Print All Classes
              </div>
              <div className="text-sm text-gray-600">Print broadsheets for all classes</div>
            </button>
          </div>

          <div className="bg-white/10 backdrop-blur-xl rounded-lg shadow-2xl border border-white/40 ring-1 ring-white/20 hover:shadow-md transition-shadow duration-300 min-h-[220px] flex flex-col items-center justify-center p-6">
            <button 
              className="flex flex-col items-center justify-center w-full h-full focus:outline-none"
              onClick={printAllStudentReports}
            >
              <div className="text-4xl mb-4">📄</div>
              <div className="text-xl font-semibold mb-2 text-gray-800">
                Print All Reports
              </div>
              <div className="text-sm text-gray-600">Print reports for all students</div>
            </button>
          </div>

          <div className="bg-white/10 backdrop-blur-xl rounded-lg shadow-2xl border border-white/40 ring-1 ring-white/20 hover:shadow-md transition-shadow duration-300 min-h-[220px] flex flex-col items-center justify-center p-6">
            <button 
              className="flex flex-col items-center justify-center w-full h-full focus:outline-none"
              onClick={exportData}
            >
              <div className="text-4xl mb-4">💾</div>
              <div className="text-xl font-semibold mb-2 text-gray-800">
                Export Data
              </div>
              <div className="text-sm text-gray-600">Export all system data</div>
            </button>
          </div>
          
          {/* New Print Individual Class Broadsheet Section */}
          <div className="bg-white/10 backdrop-blur-xl rounded-lg shadow-2xl border border-white/40 ring-1 ring-white/20 hover:shadow-md transition-shadow duration-300 min-h-[220px] flex flex-col items-center justify-center p-6">
            <button 
              className="flex flex-col items-center justify-center w-full h-full focus:outline-none"
              onClick={() => {
                const className = prompt("Enter class name (e.g., BS1, K.G 1):");
                if (className) {
                  const classStudents = learners.filter(student => student.className === className);
                  if (classStudents.length > 0) {
                    printClassBroadsheet(className, classStudents);
                  } else {
                    alert(`No students found in class ${className}`);
                  }
                }
              }}
            >
              <div className="text-4xl mb-4">📑</div>
              <div className="text-xl font-semibold mb-2 text-gray-800">
                Print Class Broadsheet
              </div>
              <div className="text-sm text-gray-600">Print broadsheet for a specific class</div>
            </button>
          </div>
          
          {/* New Print Individual Student Report Section */}
          <div className="bg-white/10 backdrop-blur-xl rounded-lg shadow-2xl border border-white/40 ring-1 ring-white/20 hover:shadow-md transition-shadow duration-300 min-h-[220px] flex flex-col items-center justify-center p-6">
            <button 
              className="flex flex-col items-center justify-center w-full h-full focus:outline-none"
              onClick={() => {
                const studentId = prompt("Enter student ID (e.g., eSBA0001):");
                if (studentId) {
                  const student = learners.find(s => s.idNumber === studentId);
                  if (student) {
                    printStudentReport(student);
                  } else {
                    alert(`Student with ID ${studentId} not found`);
                  }
                }
              }}
            >
              <div className="text-4xl mb-4">📊</div>
              <div className="text-xl font-semibold mb-2 text-gray-800">
                Print Student Report
              </div>
              <div className="text-sm text-gray-600">Print report for a specific student</div>
            </button>
          </div>
        </div>
      </div>

      {/* Teacher Modal - Updated to include password management */}
      {showTeacherModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/10 backdrop-blur-xl rounded-lg shadow-2xl border border-white/40 ring-1 ring-white/20 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Teachers</h2>
                <button 
                  className="text-4xl text-gray-500 hover:text-gray-800 focus:outline-none"
                  onClick={() => setShowTeacherModal(false)}
                >
                  ✕
                </button>
              </div>
              <form onSubmit={handleAssignClassesAndSubjects}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">Select Teacher</label>
                  <select 
                    value={selectedTeacherForClass ? selectedTeacherForClass.id : ""} 
                    onChange={(e) => {
                      const teacher = teachers.find(t => t.id === e.target.value);
                      if (teacher) {
                        openClassSetup(teacher);
                      }
                    }} 
                    className="mt-1 block w-full p-2 border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 bg-white/50 backdrop-blur-sm" 
                  >
                    <option value="" className="bg-white/80 text-gray-800">Select teacher</option>
                    {teachers.map(teacher => (
                      <option key={teacher.id} value={teacher.id} className="bg-white/80 text-gray-800">{teacher.firstName} {teacher.lastName}</option>
                    ))}
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">Classes</label>
                  <div className="flex flex-wrap gap-2 p-3 border border-white/30 rounded-lg bg-white/20 backdrop-blur-sm">
                    {classesList.map(className => (
                      <label key={className} className="inline-flex items-center">
                        <input 
                          type="checkbox" 
                          checked={teacherClasses.includes(className)} 
                          onChange={() => handleClassToggleForSetup(className)} 
                          className="mr-2" 
                        />
                        <span className="text-sm text-gray-800">{className}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">Subjects</label>
                  <div className="flex flex-wrap gap-2 p-3 border border-white/30 rounded-lg bg-white/20 backdrop-blur-sm">
                    {subjectsList.map(subject => (
                      <label key={subject} className="inline-flex items-center">
                        <input 
                          type="checkbox" 
                          checked={teacherSubjects.includes(subject)} 
                          onChange={() => handleSubjectToggleForSetup(subject)} 
                          className="mr-2" 
                        />
                        <span className="text-sm text-gray-800">{subject}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => setShowClassSetupView(false)}
                    className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50/50 backdrop-blur-sm bg-white/30"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="px-6 py-3 bg-blue-600/80 text-white rounded-lg hover:bg-blue-700 backdrop-blur-sm border border-blue-500/30"
                  >
                    Save Setup
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
                  onChange={(e) => setTeacherSearch(e.target.value)} 
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                />
                <ul className="mt-4 space-y-2">
                  {filteredTeachers.map(teacher => (
                    <li key={teacher.id} className="bg-white/10 backdrop-blur-xl rounded-lg shadow-2xl border border-white/40 ring-1 ring-white/20 p-4 flex justify-between items-center">
                      <div>
                        <div className="text-lg font-semibold text-gray-900">{teacher.firstName} {teacher.lastName}</div>
                        <div className="text-sm text-gray-600">{teacher.email}</div>
                        <div className="text-sm text-gray-600">Subjects: {teacher.subjects.join(', ')}</div>
                      </div>
                      <div className="flex space-x-2">
                        <button 
                          className="text-blue-500 hover:text-blue-700 focus:outline-none"
                          onClick={() => openRoleAssignment(teacher)}
                        >
                          Manage Roles
                        </button>
                        <button 
                          className="text-red-500 hover:text-red-700 focus:outline-none"
                          onClick={() => openPasswordUpdate(teacher)}
                        >
                          Change Password
                        </button>
                        <button 
                          className="text-red-500 hover:text-red-700 focus:outline-none"
                          onClick={() => handleDeleteTeacher(teacher.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Learner Modal */}
      {showLearnerModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/10 backdrop-blur-xl rounded-lg shadow-2xl border border-white/40 ring-1 ring-white/20 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Students</h2>
                <button 
                  className="text-4xl text-gray-500 hover:text-gray-800 focus:outline-none"
                  onClick={() => setShowLearnerModal(false)}
                >
                  ✕
                </button>
              </div>
              {/* Add Learner Form */}
              {showAddLearnerForm && (
                <div className="bg-white/10 backdrop-blur-xl rounded-lg shadow-2xl border border-white/40 ring-1 ring-white/20 p-6">
                  <form onSubmit={handleAddLearner}>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700" htmlFor="firstName">First Name</label>
                      <input 
                        type="text" 
                        id="firstName" 
                        name="firstName" 
                        value={learnerForm.firstName} 
                        onChange={handleLearnerChange} 
                        className="mt-1 block w-full p-2 border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 bg-white/50 backdrop-blur-sm" 
                        required 
                      />
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700" htmlFor="lastName">Last Name</label>
                      <input 
                        type="text" 
                        id="lastName" 
                        name="lastName" 
                        value={learnerForm.lastName} 
                        onChange={handleLearnerChange} 
                        className="mt-1 block w-full p-2 border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 bg-white/50 backdrop-blur-sm" 
                        required 
                      />
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700" htmlFor="className">Class Name</label>
                      <select 
                        id="className" 
                        name="className" 
                        value={learnerForm.className} 
                        onChange={handleLearnerChange} 
                        className="mt-1 block w-full p-2 border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 bg-white/50 backdrop-blur-sm" 
                        required 
                      >
                        <option value="" className="bg-white/80 text-gray-800">Select class</option>
                        {classesList.map(className => (
                          <option key={className} value={className} className="bg-white/80 text-gray-800">{className}</option>
                        ))}
                      </select>
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700" htmlFor="gender">Gender</label>
                      <select 
                        id="gender" 
                        name="gender" 
                        value={learnerForm.gender} 
                        onChange={handleLearnerChange} 
                        className="mt-1 block w-full p-2 border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 bg-white/50 backdrop-blur-sm" 
                        required 
                      >
                        <option value="" className="bg-white/80 text-gray-800">Select gender</option>
                        <option value="Male" className="bg-white/80 text-gray-800">Male</option>
                        <option value="Female" className="bg-white/80 text-gray-800">Female</option>
                      </select>
                    </div>
                    <div className="flex justify-end space-x-4">
                      <button
                        type="button"
                        onClick={() => setShowAddLearnerForm(false)}
                        className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50/50 backdrop-blur-sm bg-white/30"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        className="px-6 py-3 bg-blue-600/80 text-white rounded-lg hover:bg-blue-700 backdrop-blur-sm border border-blue-500/30"
                      >
                        Add Student
                      </button>
                    </div>
                  </form>
                </div>
              )}
              {/* Learner List */}
              {!showAddLearnerForm && (
                <div className="mt-6">
                  <div className="flex justify-between">
                    <input 
                      type="text" 
                      placeholder="Search students..." 
                      value={learnerSearch} 
                      onChange={(e) => setLearnerSearch(e.target.value)} 
                      className="w-full p-2 border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 bg-white/50 backdrop-blur-sm" 
                    />
                    <select 
                      value={selectedClass} 
                      onChange={(e) => setSelectedClass(e.target.value)} 
                      className="ml-4 p-2 border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 bg-white/50 backdrop-blur-sm"
                    >
                      <option value="">All Classes</option>
                      {classesList.map(className => (
                        <option key={className} value={className}>{className}</option>
                      ))}
                    </select>
                  </div>
                  <ul className="mt-4 space-y-2">
                    {filteredLearners.map(learner => (
                      <li key={learner.idNumber} className="bg-white/10 backdrop-blur-xl rounded-lg shadow-2xl border border-white/40 ring-1 ring-white/20 p-4 flex justify-between items-center">
                        <div>
                          <div className="text-lg font-semibold text-gray-900">{learner.firstName} {learner.lastName}</div>
                          <div className="text-sm text-gray-600">ID: {learner.idNumber}</div>
                          <div className="text-sm text-gray-600">Class: {learner.className}</div>
                        </div>
                        <button 
                          className="text-red-500 hover:text-red-700 focus:outline-none"
                          onClick={() => handleDeleteLearner(learner.id)}
                        >
                          Delete
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Class View */}
      {showClassView && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/10 backdrop-blur-xl rounded-lg shadow-2xl border border-white/40 ring-1 ring-white/20 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Classes</h2>
                <button 
                  className="text-4xl text-gray-500 hover:text-gray-800 focus:outline-none"
                  onClick={() => setShowClassView(false)}
                >
                  ✕
                </button>
              </div>
              <div className="mt-6">
                <ul className="space-y-2">
                  {classesList.map(className => (
                    <li key={className} className="bg-white/10 backdrop-blur-xl rounded-lg shadow-2xl border border-white/40 ring-1 ring-white/20 p-4 flex justify-between items-center">
                      <div>
                        <div className="text-lg font-semibold text-gray-900">{className}</div>
                        <div className="text-sm text-gray-600">{learners.filter(learner => learner.className === className).length} students</div>
                      </div>
                      <button 
                        className="text-blue-500 hover:text-blue-700 focus:outline-none"
                        onClick={() => {
                          setSelectedClassDetails(className);
                          setShowClassDetailsView(true);
                        }}
                      >
                        View Details
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Class Details Modal */}
      {showClassDetailsView && selectedClassDetails && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/10 backdrop-blur-xl rounded-lg shadow-2xl border border-white/40 ring-1 ring-white/20 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Class Details - {selectedClassDetails.name}</h2>
                <button 
                  className="text-4xl text-gray-500 hover:text-gray-800 focus:outline-none"
                  onClick={() => setShowClassDetailsView(false)}
                >
                  ✕
                </button>
              </div>
              <ul className="mt-4 space-y-2">
                {learners.filter(learner => learner.className === selectedClassDetails).map(learner => (
                  <li key={learner.idNumber} className="bg-white/10 backdrop-blur-xl rounded-lg shadow-2xl border border-white/40 ring-1 ring-white/20 p-4 flex justify-between items-center">
                    <div>
                      <div className="text-lg font-semibold text-gray-900">{learner.firstName} {learner.lastName}</div>
                      <div className="text-sm text-gray-600">ID: {learner.idNumber}</div>
                      <div className="text-sm text-gray-600">Class: {learner.className}</div>
                    </div>
                    <button 
                      className="text-red-500 hover:text-red-700 focus:outline-none"
                      onClick={() => handleDeleteLearner(learner.id)}
                    >
                      Delete
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Role Assignment Modal */}
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
                      setTeacherRoles(prev => ({ ...prev, primaryRole: e.target.value }));
                      handleRoleToggle(e.target.value);
                    }} 
                    className="mt-1 block w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                  >
                    <option value="teacher">Teacher</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">All Roles</label>
                  <div className="flex flex-wrap gap-2">
                    <label className="inline-flex items-center">
                      <input 
                        type="checkbox" 
                        checked={teacherRoles.allRoles.includes("teacher")} 
                        onChange={() => handleRoleToggle("teacher")} 
                        className="mr-2" 
                      />
                      Teacher
                    </label>
                    <label className="inline-flex items-center">
                      <input 
                        type="checkbox" 
                        checked={teacherRoles.allRoles.includes("admin")} 
                        onChange={() => handleRoleToggle("admin")} 
                        className="mr-2" 
                      />
                      Admin
                    </label>
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">Classes</label>
                  <div className="flex flex-wrap gap-2">
                    {classesList.map(className => (
                      <label key={className} className="inline-flex items-center">
                        <input 
                          type="checkbox" 
                          checked={teacherRoles.classes.includes(className)} 
                          onChange={() => handleClassToggle(className)} 
                          className="mr-2" 
                        />
                        {className}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">Subjects</label>
                  <div className="flex flex-wrap gap-2">
                    {subjectsList.map(subject => (
                      <label key={subject} className="inline-flex items-center">
                        <input 
                          type="checkbox" 
                          checked={teacherRoles.subjects.includes(subject)} 
                          onChange={() => handleSubjectToggleForRoles(subject)} 
                          className="mr-2" 
                        />
                        {subject}
                      </label>
                    ))}
                  </div>
                </div>
                <button 
                  type="submit" 
                  className="w-full py-2 px-4 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Save Roles
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Password Update Modal */}
      {showTeacherPasswordModal && selectedTeacherForPassword && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/10 backdrop-blur-xl rounded-lg shadow-2xl border border-white/40 ring-1 ring-white/20 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Change Password for {selectedTeacherForPassword.firstName} {selectedTeacherForPassword.lastName}</h2>
                <button 
                  className="text-4xl text-gray-500 hover:text-gray-800 focus:outline-none"
                  onClick={() => setShowTeacherPasswordModal(false)}
                >
                  ✕
                </button>
              </div>
              <form onSubmit={handleUpdatePassword}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700" htmlFor="password">New Password</label>
                  <input 
                    type="password" 
                    id="password" 
                    value={teacherPassword} 
                    onChange={(e) => setTeacherPassword(e.target.value)} 
                    className="mt-1 block w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                    required 
                  />
                </div>
                <button 
                  type="submit" 
                  className="w-full py-2 px-4 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Update Password
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Student Modal */}
      {showLearnerModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/10 backdrop-blur-xl rounded-lg shadow-2xl border border-white/40 ring-1 ring-white/20 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Students Management</h2>
                <button 
                  onClick={() => {
                    setShowLearnerModal(false);
                    setLearnerModalType(null);
                  }}
                  className="text-4xl text-gray-500 hover:text-gray-800 focus:outline-none"
                >
                  ✕
                </button>
              </div>
              <form onSubmit={handleAssignClassesAndSubjects}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">Select Teacher</label>
                  <select 
                    value={selectedTeacherForClass ? selectedTeacherForClass.id : ""} 
                    onChange={(e) => {
                      const teacher = teachers.find(t => t.id === e.target.value);
                      if (teacher) {
                        openClassSetup(teacher);
                      }
                    }} 
                    className="mt-1 block w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                  >
                    <option value="">Select teacher</option>
                    {teachers.map(teacher => (
                      <option key={teacher.id} value={teacher.id}>{teacher.firstName} {teacher.lastName}</option>
                    ))}
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">Classes</label>
                  <div className="flex flex-wrap gap-2">
                    {classesList.map(className => (
                      <label key={className} className="inline-flex items-center">
                        <input 
                          type="checkbox" 
                          checked={teacherClasses.includes(className)} 
                          onChange={() => handleClassToggleForSetup(className)} 
                          className="mr-2" 
                        />
                        {className}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">Subjects</label>
                  <div className="flex flex-wrap gap-2">
                    {subjectsList.map(subject => (
                      <label key={subject} className="inline-flex items-center">
                        <input 
                          type="checkbox" 
                          checked={teacherSubjects.includes(subject)} 
                          onChange={() => handleSubjectToggleForSetup(subject)} 
                          className="mr-2" 
                        />
                        {subject}
                      </label>
                    ))}
                  </div>
                </div>
                <button 
                  type="submit" 
                  className="w-full py-2 px-4 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Save Setup
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Class Setup Modal */}
      {showClassSetupModal && selectedTeacherForClass && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/10 backdrop-blur-xl rounded-lg shadow-2xl border border-white/40 ring-1 ring-white/20 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Teachers Management</h2>
                <button 
                  onClick={() => setShowTeacherModal(false)} 
                  className="focus:outline-none focus:ring-2 focus:ring-blue-600/50 transition-colors duration-300 hover:bg-blue-500/10 rounded-full p-2 backdrop-blur-sm bg-white/30 border border-white/30"
                >
                  <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>
              <div className="space-y-6">
                {/* Add Teacher Form */}
                {!showAddTeacherForm && (
                  <button onClick={() => setShowAddTeacherForm(true)} className="text-lg font-semibold text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600/50 transition-colors duration-300 hover:bg-blue-500/10 rounded p-4 backdrop-blur-sm bg-white/30 border border-white/30">
                    + Add Teacher
                  </button>
                )}
                {showAddTeacherForm && (
                  <form onSubmit={handleAddTeacher} className="space-y-4 bg-white/30 backdrop-blur-sm p-4 rounded-lg border border-white/30">
                    <div className="flex flex-wrap -mx-2 space-y-4">
                      <div className="w-full md:w-1/2 px-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                        <input 
                          type="text" 
                          name="firstName" 
                          value={teacherForm.firstName} 
                          onChange={handleTeacherChange} 
                          className="w-full px-4 py-3 rounded-lg border border-white/30 focus:outline-none focus:ring-2 focus:ring-blue-600/50 transition-colors duration-300 bg-white/50 backdrop-blur-sm"
                          required
                        />
                      </div>
                      <div className="w-full md:w-1/2 px-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                        <input 
                          type="text" 
                          name="lastName" 
                          value={teacherForm.lastName} 
                          onChange={handleTeacherChange} 
                          className="w-full px-4 py-3 rounded-lg border border-white/30 focus:outline-none focus:ring-2 focus:ring-blue-600/50 transition-colors duration-300 bg-white/50 backdrop-blur-sm"
                          required
                        />
                      </div>
                      <div className="w-full md:w-1/2 px-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                        <select 
                          name="gender" 
                          value={teacherForm.gender} 
                          onChange={handleTeacherChange} 
                          className="w-full px-4 py-3 rounded-lg border border-white/30 focus:outline-none focus:ring-2 focus:ring-blue-600/50 transition-colors duration-300 bg-white/50 backdrop-blur-sm"
                          required
                        >
                          <option value="" className="bg-white/80 text-gray-800">Select gender</option>
                          <option value="Male" className="bg-white/80 text-gray-800">Male</option>
                          <option value="Female" className="bg-white/80 text-gray-800">Female</option>
                        </select>
                      </div>
                      <div className="w-full md:w-1/2 px-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                        <input 
                          type="email" 
                          name="email" 
                          value={teacherForm.email} 
                          onChange={handleTeacherChange} 
                          className="w-full px-4 py-3 rounded-lg border border-white/30 focus:outline-none focus:ring-2 focus:ring-blue-600/50 transition-colors duration-300 bg-white/50 backdrop-blur-sm"
                          required
                        />
                      </div>
                      <div className="w-full px-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Subjects</label>
                        <div className="space-y-2 p-3 border border-white/30 rounded-lg bg-white/20 backdrop-blur-sm">
                          {subjectsList.map(subject => (
                            <label key={subject} className="flex items-center">
                              <input 
                                type="checkbox" 
                                value={subject} 
                                checked={teacherForm.subjects.includes(subject)} 
                                onChange={() => handleSubjectToggle(subject)} 
                                className="mr-2 focus:outline-none focus:ring-2 focus:ring-blue-600/50 transition-colors duration-300"
                              />
                              <span className="text-sm text-gray-800">{subject}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="text-right space-x-4">
                      <button 
                        type="button" 
                        onClick={() => setShowAddTeacherForm(false)} 
                        className="text-lg font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-600/50 transition-colors duration-300 hover:bg-gray-500/10 rounded p-4 backdrop-blur-sm bg-white/30 border border-white/30"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        className="text-lg font-semibold text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600/50 transition-colors duration-300 hover:bg-blue-500/10 rounded p-4 backdrop-blur-sm bg-white/30 border border-white/30"
                      >
                        Add Teacher
                      </button>
                    </div>
                  </form>
                )}

                {/* View Teachers */}
                {filteredTeachers.length > 0 && (
                  <div className="space-y-4">
                    <input 
                      type="text" 
                      value={teacherSearch} 
                      onChange={(e) => setTeacherSearch(e.target.value)} 
                      placeholder="Search teachers..." 
                      className="w-full px-4 py-3 rounded-lg border border-white/30 focus:outline-none focus:ring-2 focus:ring-blue-600/50 transition-colors duration-300 bg-white/50 backdrop-blur-sm"
                    />
                    <div className="space-y-4">
                      {filteredTeachers.map(teacher => (
                        <div key={teacher.id} className="p-4 bg-white/10 backdrop-blur-sm rounded-lg shadow-lg border border-white/40 ring-1 ring-white/20">
                          <div className="flex justify-between items-center mb-4">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">{teacher.firstName} {teacher.lastName}</h3>
                              <p className="text-sm text-gray-700">{teacher.email}</p>
                              <p className="text-sm text-gray-700">{teacher.gender}</p>
                              {teacher.subjects && teacher.subjects.length > 0 && (
                                <p className="text-sm text-gray-700">Subjects: {teacher.subjects.join(', ')}</p>
                              )}
                            </div>
                            <div className="space-x-2">
                              <button 
                                onClick={() => openRoleAssignment(teacher)} 
                                className="text-lg font-semibold text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600/50 transition-colors duration-300 hover:bg-blue-500/10 rounded p-4 backdrop-blur-sm bg-white/30 border border-white/30"
                              >
                                Assign Roles
                              </button>
                              <button 
                                onClick={() => openPasswordUpdate(teacher)} 
                                className="text-lg font-semibold text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600/50 transition-colors duration-300 hover:bg-blue-500/10 rounded p-4 backdrop-blur-sm bg-white/30 border border-white/30"
                              >
                                Update Password
                              </button>
                              <button 
                                onClick={() => openClassSetup(teacher)} 
                                className="text-lg font-semibold text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600/50 transition-colors duration-300 hover:bg-blue-500/10 rounded p-4 backdrop-blur-sm bg-white/30 border border-white/30"
                              >
                                Class Setup
                              </button>
                              <button 
                                onClick={() => handleDeleteTeacher(teacher.id)} 
                                className="text-lg font-semibold text-red-700 focus:outline-none focus:ring-2 focus:ring-red-600/50 transition-colors duration-300 hover:bg-red-500/10 rounded p-4 backdrop-blur-sm bg-white/30 border border-white/30"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Learner Modal */}
      {showLearnerModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/10 backdrop-blur-xl rounded-lg shadow-2xl border border-white/40 ring-1 ring-white/20 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Students Management</h2>
                <button 
                  onClick={() => setShowLearnerModal(false)} 
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ✕
                </button>
              </div>

              {!showAddTeacherForm ? (
                <>
                  {/* Search and Add Teacher */}
                  <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="Search teachers..."
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50 backdrop-blur-sm"
                        value={teacherSearch}
                        onChange={(e) => setTeacherSearch(e.target.value)}
                      />
                    </div>
                    <button
                      onClick={() => setShowAddTeacherForm(true)}
                      className="bg-blue-600/80 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap backdrop-blur-sm border border-blue-500/30"
                    >
                      + Add New Teacher
                    </button>
                  </div>

                  {/* Teachers List */}
                  <div className="border border-gray-200/50 rounded-lg overflow-hidden bg-white/30 backdrop-blur-sm">
                    <table className="min-w-full divide-y divide-gray-200/50">
                      <thead className="bg-white/20 backdrop-blur-sm">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Name</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Email</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Roles</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Subjects</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white/10 backdrop-blur-sm divide-y divide-gray-200/50">
                        {filteredTeachers.length > 0 ? (
                          filteredTeachers.map((teacher) => (
                            <tr key={teacher.id || teacher.email} className="hover:bg-white/20">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  {teacher.firstName} {teacher.lastName}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-700">{teacher.email}</div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-sm text-gray-700">
                                  {(teacher.allRoles && teacher.allRoles.length > 0 
                                    ? teacher.allRoles 
                                    : [teacher.primaryRole || "teacher"])
                                    .map(role => 
                                      role === 'admin' ? 'Administrator' :
                                      role === 'head_teacher' ? 'Head Teacher' :
                                      role === 'class_teacher' ? 'Class Teacher' :
                                      role === 'subject_teacher' ? 'Subject Teacher' :
                                      role === 'form_master' ? 'Form Master' : 'Teacher'
                                    )
                                    .join(", ")}
                                </div>
                                {teacher.classes && teacher.classes.length > 0 && (
                                  <div className="text-xs text-gray-600 mt-1">
                                    Classes: {teacher.classes.join(", ")}
                                  </div>
                                )}
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-sm text-gray-700">
                                  {teacher.subjects && teacher.subjects.length > 0 
                                    ? teacher.subjects.join(", ") 
                                    : "No subjects assigned"}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                <button
                                  onClick={() => openPasswordUpdate(teacher)}
                                  className="text-green-700 hover:text-green-900 backdrop-blur-sm bg-green-100/330 px-2 py-1 rounded border border-green-300/30"
                                >
                                  Set Password
                                </button>
                                <button
                                  onClick={() => openRoleAssignment(teacher)}
                                  className="text-blue-700 hover:text-blue-900 backdrop-blur-sm bg-blue-100/30 px-2 py-1 rounded border border-blue-300/30"
                                >
                                  Assign Roles
                                </button>
                                <button
                                  onClick={() => {
                                    if (window.confirm("Are you sure you want to delete this teacher?")) {
                                      handleDeleteTeacher(teacher.id);
                                    }
                                  }}
                                  className="text-red-700 hover:text-red-900 backdrop-blur-sm bg-red-100/30 px-2 py-1 rounded border border-red-300/30"
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-700">
                              {teacherSearch ? "No teachers found matching your search" : "No teachers found"}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                // Add Teacher Form
                <form onSubmit={handleAddTeacher} className="space-y-6 bg-white/30 backdrop-blur-sm p-4 rounded-lg border border-white/30">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                      <input
                        type="text"
                        name="firstName"
                        value={teacherForm.firstName}
                        onChange={handleTeacherChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50 backdrop-blur-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                      <input
                        type="text"
                        name="lastName"
                        value={teacherForm.lastName}
                        onChange={handleTeacherChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50 backdrop-blur-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                      <input
                        type="email"
                        name="email"
                        value={teacherForm.email}
                        onChange={handleTeacherChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50 backdrop-blur-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                      <input
                        type="password"
                        name="password"
                        value={teacherForm.password}
                        onChange={handleTeacherChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50 backdrop-blur-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                      <select
                        name="gender"
                        value={teacherForm.gender}
                        onChange={handleTeacherChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50 backdrop-blur-sm"
                        required
                      >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Subjects</label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-2 border border-gray-300/50 rounded-lg bg-white/20 backdrop-blur-sm">
                      {subjectsList.map(subject => (
                        <label key={subject} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={teacherForm.subjects.includes(subject)}
                            onChange={() => handleSubjectToggle(subject)}
                            className="rounded text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{subject}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end space-x-4">
                    <button
                      type="button"
                      onClick={() => setShowAddTeacherForm(false)}
                      className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50/50 backdrop-blur-sm bg-white/30"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-3 bg-blue-600/80 text-white rounded-lg hover:bg-blue-700 backdrop-blur-sm border border-blue-500/30"
                    >
                      Add Teacher
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Teacher Role Assignment Modal */}
      {showTeacherRoleModal && selectedTeacher && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/10 backdrop-blur-xl rounded-lg shadow-2xl border border-white/40 ring-1 ring-white/20 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Assign Roles to {selectedTeacher.firstName} {selectedTeacher.lastName}</h2>
                <button 
                  onClick={() => setShowTeacherRoleModal(false)} 
                  className="text-4xl text-gray-500 hover:text-gray-800 focus:outline-none"
                >
                  ✕
                </button>
              </div>
              <form onSubmit={handleAssignRoles} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Primary Role</label>
                  <select
                    value={teacherRoles.primaryRole}
                    onChange={(e) => setTeacherRoles(prev => ({ ...prev, primaryRole: e.target.value }))}
                    className="w-full p-3 border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 bg-white/50 backdrop-blur-sm"
                  >
                    {teacherRoles.allRoles.map(role => (
                      <option key={role} value={role} className="bg-white/80 text-gray-800">
                        {role === 'admin' ? 'Administrator' :
                         role === 'head_teacher' ? 'Head Teacher' :
                         role === 'class_teacher' ? 'Class Teacher' :
                         role === 'subject_teacher' ? 'Subject Teacher' :
                         role === 'form_master' ? 'Form Master' : 'Teacher'}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">All Roles</label>
                  <div className="grid grid-cols-2 gap-2 p-3 border border-white/30 rounded-lg bg-white/20 backdrop-blur-sm">
                    {['teacher', 'admin'].map(role => (
                      <label key={role} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={teacherRoles.allRoles.includes(role)}
                          onChange={() => handleRoleToggle(role)}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-800">
                          {role === 'admin' ? 'Administrator' : 'Teacher'}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Classes</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-3 border border-white/30 rounded-lg bg-white/20 backdrop-blur-sm">
                    {classesList.map(className => (
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
                          onChange={() => handleSubjectToggleForRoles(subject)}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-800">{subject}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => setShowTeacherRoleModal(false)}
                    className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50/50 backdrop-blur-sm bg-white/30"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-blue-600/80 text-white rounded-lg hover:bg-blue-700 backdrop-blur-sm border border-blue-500/30"
                  >
                    Assign Roles
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Teacher Password Update Modal */}
      {showTeacherPasswordModal && selectedTeacherForPassword && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/10 backdrop-blur-xl rounded-lg shadow-2xl border border-white/40 ring-1 ring-white/20 w-full max-w-sm max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Update Password for {selectedTeacherForPassword.firstName} {selectedTeacherForPassword.lastName}</h2>
                <button 
                  onClick={() => {
                    setShowTeacherPasswordModal(false);
                    setSelectedTeacherForPassword(null);
                    setTeacherPassword("");
                  }} 
                  className="text-4xl text-gray-500 hover:text-gray-800 focus:outline-none"
                >
                  ✕
                </button>
              </div>
              <form onSubmit={handleUpdatePassword}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700" htmlFor="password">New Password</label>
                  <input 
                    type="password" 
                    id="password" 
                    value={teacherPassword} 
                    onChange={(e) => setTeacherPassword(e.target.value)} 
                    className="mt-1 block w-full p-2 border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 bg-white/50 backdrop-blur-sm" 
                    required 
                  />
                </div>
                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowTeacherPasswordModal(false);
                      setSelectedTeacherForPassword(null);
                      setTeacherPassword("");
                    }}
                    className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50/50 backdrop-blur-sm bg-white/30"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-blue-600/80 text-white rounded-lg hover:bg-blue-700 backdrop-blur-sm border border-blue-500/30"
                  >
                    Update Password
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Class Setup Modal */}
      {showClassSetupModal && selectedTeacherForClass && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Assign Classes & Subjects to {selectedTeacherForClass.firstName} {selectedTeacherForClass.lastName}</h2>
                <button 
                  onClick={() => {
                    setShowClassSetupModal(false);
                    setSelectedTeacherForClass(null);
                  }} 
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAssignClassesAndSubjects} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Classes</label>
                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 border border-gray-300 rounded-lg">
                    {classesList.map(className => (
                      <label key={className} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={teacherClasses.includes(className)}
                          onChange={() => handleClassToggleForSetup(className)}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm">{className}</span>
                      </label>
                    ))}
                  </div>
                </div>
</original_code>```

```
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Teacher Password Update Modal */}
      {showTeacherPasswordModal && selectedTeacherForPassword && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/10 backdrop-blur-xl rounded-lg shadow-2xl border border-white/40 ring-1 ring-white/20 w-full max-w-sm max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Update Password for {selectedTeacherForPassword.firstName} {selectedTeacherForPassword.lastName}</h2>
                <button 
                  onClick={() => {
                    setShowTeacherPasswordModal(false);
                    setSelectedTeacherForPassword(null);
                    setTeacherPassword("");
                  }} 
                  className="text-4xl text-gray-500 hover:text-gray-800 focus:outline-none"
                >
                  ✕
                </button>
              </div>
              <form onSubmit={handleUpdatePassword}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700" htmlFor="password">New Password</label>
                  <input 
                    type="password" 
                    id="password" 
                    value={teacherPassword} 
                    onChange={(e) => setTeacherPassword(e.target.value)} 
                    className="mt-1 block w-full p-2 border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 bg-white/50 backdrop-blur-sm" 
                    required 
                  />
                </div>
                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowTeacherPasswordModal(false);
                      setSelectedTeacherForPassword(null);
                      setTeacherPassword("");
                    }}
                    className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50/50 backdrop-blur-sm bg-white/30"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-blue-600/80 text-white rounded-lg hover:bg-blue-700 backdrop-blur-sm border border-blue-500/30"
                  >
                    Update Password
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Class Setup Modal */}
      {showClassSetupModal && selectedTeacherForClass && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Assign Classes & Subjects to {selectedTeacherForClass.firstName} {selectedTeacherForClass.lastName}</h2>
                <button 
                  onClick={() => {
                    setShowClassSetupModal(false);
                    setSelectedTeacherForClass(null);
                  }} 
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAssignClassesAndSubjects} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Classes</label>
                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 border border-gray-300 rounded-lg">
                    {classesList.map(className => (
                      <label key={className} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={teacherClasses.includes(className)}
                          onChange={() => handleClassToggleForSetup(className)}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm">{className}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subjects</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-2 border border-gray-300 rounded-lg">
                    {subjectsList.map(subject => (
                      <label key={subject} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={teacherSubjects.includes(subject)}
                          onChange={() => handleSubjectToggleForSetup(subject)}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm">{subject}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowClassSetupModal(false);
                      setSelectedTeacherForClass(null);
                    }}
                    className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Update Classes & Subjects
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Class View */}
      {showClassView && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">View Students by Class</h2>
                <button 
                  onClick={() => setShowClassView(false)} 
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ✕
                </button>
              </div>

              <div className="flex justify-between items-center mb-6">
                <div className="flex space-x-4">
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Class</option>
                    {classesList.map(className => (
                      <option key={className} value={className}>
                        {className}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredLearners.length > 0 ? (
                      filteredLearners.map((learner) => (
                        <tr key={learner.idNumber}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {learner.firstName} {learner.lastName}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{learner.idNumber}</div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="2" className="px-6 py-4 text-center text-sm text-gray-500">
                          {selectedClass ? "No students in this class" : "Please select a class"}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Class Setup View */}
      {showClassSetupView && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/10 backdrop-blur-xl rounded-lg shadow-2xl border border-white/40 ring-1 ring-white/20 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Class Setup</h2>
                <button 
                  onClick={() => setShowClassSetupView(false)} 
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {classesList.map(className => (
                  <div key={className} className="bg-white/10 backdrop-blur-xl rounded-lg shadow-2xl border border-white/40 ring-1 ring-white/20 hover:shadow-md transition-shadow duration-300 min-h-[220px] flex flex-col items-center justify-center p-6">
                    <button 
                      className="flex flex-col items-center justify-center w-full h-full focus:outline-none"
                      onClick={() => {
                        setSelectedClassDetails(className);
                        setShowClassDetailsView(true);
                      }}
                    >
                      <div className="text-4xl mb-4">📚</div>
                      <div className="text-xl font-semibold mb-2 text-gray-800">
                        {className}
                      </div>
                      <div className="text-sm text-gray-600">View & Assign Teachers</div>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Class Details View */}
      {showClassDetailsView && selectedClassDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Details for {selectedClassDetails}</h2>
                <button 
                  onClick={() => {
                    setShowClassDetailsView(false);
                    setSelectedClassDetails(null);
                  }} 
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Class Information */}
                <div className="bg-white/10 backdrop-blur-xl rounded-lg shadow-2xl border border-white/40 ring-1 ring-white/20 p-6">
                  <h3 className="text-lg font-bold mb-4">Class Information</h3>
                  <div className="text-sm mb-2 text-gray-700">
                    Class: {selectedClassDetails}
                  </div>
                  <div className="text-sm mb-2 text-gray-700">
                    Total Students: {learners.filter(learner => learner.className === selectedClassDetails).length}
                  </div>
                </div>

                {/* Assigned Teachers */}
                <div className="bg-white/10 backdrop-blur-xl rounded-lg shadow-2xl border border-white/40 ring-1 ring-white/20 p-6">
                  <h3 className="text-lg font-bold mb-4">Assigned Teachers</h3>
                  <div className="border border-gray-200/50 rounded-lg overflow-hidden bg-white/30 backdrop-blur-sm">
                    <table className="min-w-full divide-y divide-gray-200/50">
                      <thead className="bg-white/20 backdrop-blur-sm">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Teacher</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Subject</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white/10 backdrop-blur-sm divide-y divide-gray-200/50">
                        {teachers.filter(teacher => teacher.classes && teacher.classes.includes(selectedClassDetails)).length > 0 ? (
                          teachers.filter(teacher => teacher.classes && teacher.classes.includes(selectedClassDetails)).map(teacher => (
                            <tr key={teacher.id} className="hover:bg-white/20">
                              <td className="px-4 py-2 text-sm text-gray-700">
                                {teacher.firstName} {teacher.lastName}
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-700">
                                {teacher.subjects && teacher.subjects.length > 0 ? teacher.subjects.join(", ") : "Not assigned"}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="2" className="px-4 py-2 text-center text-sm text-gray-700">
                              No teachers assigned to this class
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowClassDetailsView(false);
                    setSelectedClassDetails(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50/50 backdrop-blur-sm bg-white/30"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setSelectedClass(selectedClassDetails);
                    setShowLearnerModal(true);
                    setShowClassDetailsView(false);
                  }}
                  className="px-4 py-2 bg-blue-600/80 text-white rounded-lg hover:bg-blue-700 backdrop-blur-sm border border-blue-500/30"
                >
                  Manage Students
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Students by Class Modal */}
      {showClassView && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/10 backdrop-blur-xl rounded-lg shadow-2xl border border-white/40 ring-1 ring-white/20 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">View Students by Class</h2>
                <button 
                  onClick={() => setShowClassView(false)} 
                  className="text-4xl text-gray-500 hover:text-gray-800 focus:outline-none"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {classesList.map(className => (
                  <div key={className} className="bg-white/10 backdrop-blur-xl rounded-lg shadow-2xl border border-white/40 ring-1 ring-white/20 hover:shadow-md transition-shadow duration-300 min-h-[220px] flex flex-col items-center justify-center p-6">
                    <button 
                      className="flex flex-col items-center justify-center w-full h-full focus:outline-none"
                      onClick={() => {
                        setSelectedClass(className);
                        setShowLearnerModal(true);
                      }}
                    >
                      <div className="text-4xl mb-4">📚</div>
                      <div className="text-xl font-semibold mb-2 text-gray-900">
                        {className}
                      </div>
                      <div className="text-sm text-gray-700">View Students</div>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {classesList.map(className => (
                  <div key={className} className="bg-white/10 backdrop-blur-xl rounded-lg shadow-2xl border border-white/40 ring-1 ring-white/20 hover:shadow-md transition-shadow duration-300 min-h-[220px] flex flex-col items-center justify-center p-6">
                    <button 
                      className="flex flex-col items-center justify-center w-full h-full focus:outline-none"
                      onClick={() => {
                        setSelectedClass(className);
                        setShowLearnerModal(true);
                      }}
                    >
                      <div className="text-4xl mb-4">📚</div>
                      <div className="text-xl font-semibold mb-2 text-gray-800">
                        {className}
                      </div>
                      <div className="text-sm text-gray-600">View Students</div>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Learner Management View */}
      {showLearnerModal && selectedClass && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/10 backdrop-blur-xl rounded-lg shadow-2xl border border-white/40 ring-1 ring-white/20 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Manage Students - {selectedClass}</h2>
                <button 
                  onClick={() => setShowLearnerModal(false)} 
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {learners.filter(learner => learner.className === selectedClass).map((learner, index) => (
                  <div key={index} className="bg-white/10 backdrop-blur-xl rounded-lg shadow-2xl border border-white/40 ring-1 ring-white/20 hover:shadow-md transition-shadow duration-300 min-h-[220px] flex flex-col items-center justify-center p-6">
                    <div className="text-4xl mb-4">🎓</div>
                    <div className="text-xl font-semibold mb-2 text-gray-800">
                      {learner.name}
                    </div>
                    <div className="text-sm text-gray-600">{learner.email}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add New Learner View */}
      {showAddNewLearnerView && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/10 backdrop-blur-xl rounded-lg shadow-2xl border border-white/40 ring-1 ring-white/20 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Add New Learner</h2>
                <button 
                  onClick={() => setShowAddNewLearnerView(false)} 
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="bg-white/10 backdrop-blur-xl rounded-lg shadow-2xl border border-white/40 ring-1 ring-white/20 p-6">
                  <h3 className="text-lg font-bold mb-4">Personal Information</h3>
                  <div className="space-y-2">
                    <input type="text" className="w-full border border-gray-300 rounded-lg px-4 py-2" placeholder="Full Name" />
                    <input type="email" className="w-full border border-gray-300 rounded-lg px-4 py-2" placeholder="Email Address" />
                    <input type="text" className="w-full border border-gray-300 rounded-lg px-4 py-2" placeholder="ID Number" />
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-xl rounded-lg shadow-2xl border border-white/40 ring-1 ring-white/20 p-6">
                  <h3 className="text-lg font-bold mb-4">Class Information</h3>
                  <div className="space-y-2">
                    <select className="w-full border border-gray-300 rounded-lg px-4 py-2">
                      <option disabled selected>Select a class</option>
                      {classesList.map(className => (
                        <option key={className} value={className}>
                          {className}
                        </option>
                      ))}
                    </select>
                    <button className="w-full bg-green-500 hover:bg-green-600 text-white rounded-lg px-4 py-2">
                      Add New Learner
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add New Teacher View */}
      {showAddNewTeacherView && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/10 backdrop-blur-xl rounded-lg shadow-2xl border border-white/40 ring-1 ring-white/20 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Add New Teacher</h2>
                <button 
                  onClick={() => setShowAddNewTeacherView(false)} 
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="bg-white/10 backdrop-blur-xl rounded-lg shadow-2xl border border-white/40 ring-1 ring-white/20 p-6">
                  <h3 className="text-lg font-bold mb-4">Personal Information</h3>
                  <div className="space-y-2">
                    <input type="text" className="w-full border border-gray-300 rounded-lg px-4 py-2" placeholder="First Name" />
                    <input type="text" className="w-full border border-gray-300 rounded-lg px-4 py-2" placeholder="Last Name" />
                    <input type="email" className="w-full border border-gray-300 rounded-lg px-4 py-2" placeholder="Email Address" />
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-xl rounded-lg shadow-2xl border border-white/40 ring-1 ring-white/20 p-6">
                  <h3 className="text-lg font-bold mb-4">Classes & Subjects</h3>
                  <div className="space-y-2">
                    <div className="flex flex-col space-y-2">
                      <label htmlFor="teacherClass" className="text-sm font-medium text-gray-700">Classes</label>
                      <select id="teacherClass" className="w-full border border-gray-300 rounded-lg px-4 py-2">
                        <option disabled selected>Select a class</option>
                        {classesList.map(className => (
                          <option key={className} value={className}>
                            {className}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col space-y-2">
                      <label htmlFor="teacherSubject" className="text-sm font-medium text-gray-700">Subjects</label>
                      <select id="teacherSubject" className="w-full border border-gray-300 rounded-lg px-4 py-2">
                        <option disabled selected>Select a subject</option>
                        {subjects.map(subjectName => (
                          <option key={subjectName} value={subjectName}>
                            {subjectName}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button className="w-full bg-green-500 hover:bg-green-600 text-white rounded-lg px-4 py-2">
                      Add New Teacher
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Class Teacher Assignment Modal */}
      {showClassSetupModal && selectedTeacherForEdit && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/10 backdrop-blur-xl rounded-lg shadow-2xl border border-white/40 ring-1 ring-white/20 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Manage Classes & Subjects for {selectedTeacherForEdit.firstName}</h2>
                <button 
                  onClick={() => setShowClassSetupModal(false)} 
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="bg-white/10 backdrop-blur-xl rounded-lg shadow-2xl border border-white/40 ring-1 ring-white/20 p-6">
                  <h3 className="text-lg font-bold mb-4">Assigned Classes & Subjects</h3>
                  <div className="space-y-2">
                    {teacherClasses?.length ? teacherClasses?.map(classIndex => {
                      return <button key={classIndex}>{classList[classIndex].classDetails.join(" & ")} </button>
                    }) : 'Nothing has been added for '}
                    <button className="w-full bg-green-500 hover:bg-green-600 text-white rounded-lg px-4 py-2">
                      Save & Submit Changes
                    </button>
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-xl rounded-lg shadow-2xl border border-white/40 ring-1 ring-white/20 p-6">
                  <h3 className="text-lg font-bold mb-4">Add Classes</h3>
                  <div className="space-y-2">
                    <div className="flex flex-col space-y-2">
                      <label htmlFor="teacherClass" className="text-sm font-medium text-gray-700">Classes</label>
                      <select id="teacherClass" className="w-full border border-gray-300 rounded-lg px-4 py-2">
                        <option disabled selected>Select a class</option>
                        {classesList.map(className => (
                          <option key={className} value={className}>
                            {className}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col space-y-2">
                      <label htmlFor="teacherSubject" className="text-sm font-medium text-gray-700">Subjects</label>
                      <select id="teacherSubject" className="w-full border border-gray-300 rounded-lg px-4 py-2">
                        <option disabled selected>Select a subject</option>
                        {subjects.map(subjectName => (
                          <option key={subjectName} value={subjectName}>
                            {subjectName}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button className="w-full bg-green-500 hover:bg-green-600 text-white rounded-lg px-4 py-2">
                      Add Class Assignment
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Class Teacher Assignment Modal */}
      {showClassTeacherManagement && classSelectionState.classesAndLearnersView && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/10 backdrop-blur-xl rounded-lg shadow-2xl border border-white/40 ring-1 ring-white/20 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Manage Classes & Teachers</h2>
                <button 
                  onClick={() => setShowClassTeacherManagement(false)} 
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="bg-white/10 backdrop-blur-xl rounded-lg shadow-2xl border border-white/40 ring-1 ring-white/20 p-6">
                  <h3 className="text-lg font-bold mb-4">Classes</h3>
                  <div className="space-y-2">
                    <div className="flex flex-col space-y-2">
                      <label htmlFor="teacherClass" className="text-sm font-medium text-gray-700">Classes</label>
                      <select id="teacherClass" className="w-full border border-gray-300 rounded-lg px-4 py-2">
                        <option disabled selected>Select a class</option>
                        {classesList.map(className => (
                          <option key={className} value={className}>
                            {className}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col space-y-2">
                      <label htmlFor="teacherSubject" className="text-sm font-medium text-gray-700">Subjects</label>
                      <select id="teacherSubject" className="w-full border border-gray-300 rounded-lg px-4 py-2">
                        <option disabled selected>Select a subject</option>
                        {subjects.map(subjectName => (
                          <option key={subjectName} value={subjectName}>
                            {subjectName}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button className="w-full bg-green-500 hover:bg-green-600 text-white rounded-lg px-4 py-2">
                      Save & Submit Changes
                    </button>
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-xl rounded-lg shadow-2xl border border-white/40 ring-1 ring-white/20 p-6">
                  <h3 className="text-lg font-bold mb-4">Teachers</h3>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Classes</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subjects</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {teachers.filter(teacher => teacher.classes.includes(selectedClassDetails)).length > 0 ? (
                          teachers.filter(teacher => teacher.classes.includes(selectedClassDetails)).map((teacher) => (
                            <tr key={teacher.id || teacher.email}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  {teacher.firstName} {teacher.lastName}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-500">{teacher.email}</div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-sm text-gray-500">
                                  {teacher.classes && teacher.classes.length > 0 
                                    ? teacher.classes.join(", ") 
                                    : "No classes assigned"}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-sm text-gray-500">
                                  {teacher.subjects && teacher.subjects.length > 0 
                                    ? teacher.subjects.join(", ") 
                                    : "No subjects assigned"}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                <button
                                  onClick={() => openClassSetup(teacher)}
                                  className="text-blue-600 hover:text-blue-900"
                                >
                                  Manage Classes & Subjects
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                              No teachers assigned to this class
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Class Teacher Assignment Modal */}
      {showClassTeacherManagement && classSelectionState.assignTeacherView && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/10 backdrop-blur-xl rounded-lg shadow-2xl border border-white/40 ring-1 ring-white/20 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Manage Classes & Teachers</h2>
                <button 
                  onClick={() => setShowClassTeacherManagement(false)} 
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="bg-white/10 backdrop-blur-xl rounded-lg shadow-2xl border border-white/40 ring-1 ring-white/20 p-6">
                  <h3 className="text-lg font-bold mb-4">Classes</h3>
                  <div className="space-y-2">
                    <div className="flex flex-col space-y-2">
                      <label htmlFor="teacherClass" className="text-sm font-medium text-gray-700">Classes</label>
                      <select id="teacherClass" className="w-full border border-gray-300 rounded-lg px-4 py-2">
                        <option disabled selected>Select a class</option>
                        {classesList.map(className => (
                          <option key={className} value={className}>
                            {className}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col space-y-2">
                      <label htmlFor="teacherSubject" className="text-sm font-medium text-gray-700">Subjects</label>
                      <select id="teacherSubject" className="w-full border border-gray-300 rounded-lg px-4 py-2">
                        <option disabled selected>Select a subject</option>
                        {subjects.map(subjectName => (
                          <option key={subjectName} value={subjectName}>
                            {subjectName}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button className="w-full bg-green-500 hover:bg-green-600 text-white rounded-lg px-4 py-2">
                      Save & Submit Changes
                    </button>
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-xl rounded-lg shadow-2xl border border-white/40 ring-1 ring-white/20 p-6">
                  <h3 className="text-lg font-bold mb-4">Teachers</h3>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Classes</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subjects</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {teachers.filter(teacher => teacher.classes.includes(selectedClassDetails)).length > 0 ? (
                          teachers.filter(teacher => teacher.classes.includes(selectedClassDetails)).map((teacher) => (
                            <tr key={teacher.id || teacher.email}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  {teacher.firstName} {teacher.lastName}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-500">{teacher.email}</div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-sm text-gray-500">
                                  {teacher.classes && teacher.classes.length > 0 
                                    ? teacher.classes.join(", ") 
                                    : "No classes assigned"}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-sm text-gray-500">
                                  {teacher.subjects && teacher.subjects.length > 0 
                                    ? teacher.subjects.join(", ") 
                                    : "No subjects assigned"}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                <button
                                  onClick={() => openClassSetup(teacher)}
                                  className="text-blue-600 hover:text-blue-900"
                                >
                                  Manage Classes & Subjects
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                              No teachers assigned to this class
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Class Teacher Assignment Modal */}
      {showClassTeacherManagement && classSelectionState.assignClassView && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/10 backdrop-blur-xl rounded-lg shadow-2xl border border-white/40 ring-1 ring-white/20 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Manage Classes & Teachers</h2>
                <button 
                  onClick={() => setShowClassTeacherManagement(false)} 
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="bg-white/10 backdrop-blur-xl rounded-lg shadow-2xl border border-white/40 ring-1 ring-white/20 p-6">
                  <h3 className="text-lg font-bold mb-4">Classes</h3>
                  <div className="space-y-2">
                    <div className="flex flex-col space-y-2">
                      <label htmlFor="teacherClass" className="text-sm font-medium text-gray-700">Classes</label>
                      <select id="teacherClass" className="w-full border border-gray-300 rounded-lg px-4 py-2">
                        <option disabled selected>Select a class</option>
                        {classesList.map(className => (
                          <option key={className} value={className}>
                            {className}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col space-y-2">
                      <label htmlFor="teacherSubject" className="text-sm font-medium text-gray-700">Subjects</label>
                      <select id="teacherSubject" className="w-full border border-gray-300 rounded-lg px-4 py-2">
                        <option disabled selected>Select a subject</option>
                        {subjects.map(subjectName => (
                          <option key={subjectName} value={subjectName}>
                            {subjectName}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button className="w-full bg-green-500 hover:bg-green-600 text-white rounded-lg px-4 py-2">
                      Save & Submit Changes
                    </button>
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-xl rounded-lg shadow-2xl border border-white/40 ring-1 ring-white/20 p-6">
                  <h3 className="text-lg font-bold mb-4">Teachers</h3>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Classes</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subjects</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {teachers.filter(teacher => teacher.classes.includes(selectedClassDetails)).length > 0 ? (
                          teachers.filter(teacher => teacher.classes.includes(selectedClassDetails)).map((teacher) => (
                            <tr key={teacher.id || teacher.email}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  {teacher.firstName} {teacher.lastName}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-500">{teacher.email}</div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-sm text-gray-500">
                                  {teacher.classes && teacher.classes.length > 0 
                                    ? teacher.classes.join(", ") 
                                    : "No classes assigned"}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-sm text-gray-500">
                                  {teacher.subjects && teacher.subjects.length > 0 
                                    ? teacher.subjects.join(", ") 
                                    : "No subjects assigned"}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                <button
                                  onClick={() => openClassSetup(teacher)}
                                  className="text-blue-600 hover:text-blue-900"
                                >
                                  Manage Classes & Subjects
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                              No teachers assigned to this class
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Class Teacher Assignment Modal */}
      {showClassTeacherManagement && classSelectionState.assignSubjectView && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/10 backdrop-blur-xl rounded-lg shadow-2xl border border-white/40 ring-1 ring-white/20 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Manage Classes & Teachers</h2>
                <button 
                  onClick={() => setShowClassTeacherManagement(false)} 
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ✕
                </button>
              </div>

              <div className="flex justify-between items-center mb-6">
                <div className="flex space-x-4">
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50 backdrop-blur-sm"
                  >
                    <option value="" className="bg-white/80 text-gray-800">Select Class</option>
                    {classesList.map(className => (
                      <option key={className} value={className} className="bg-white/80 text-gray-800">
                        {className}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="border border-gray-200/50 rounded-lg overflow-hidden bg-white/30 backdrop-blur-sm">
                <table className="min-w-full divide-y divide-gray-200/50">
                  <thead className="bg-white/20 backdrop-blur-sm">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">ID</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white/10 backdrop-blur-sm divide-y divide-gray-200/50">
                    {filteredLearners.length > 0 ? (
                      filteredLearners.map((learner) => (
                        <tr key={learner.idNumber} className="hover:bg-white/20">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {learner.firstName} {learner.lastName}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-700">{learner.idNumber}</div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="2" className="px-6 py-4 text-center text-sm text-gray-700">
                          {selectedClass ? "No students in this class" : "Please select a class"}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Learner Modal */}
      {showLearnerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Students Management</h2>
                <button 
                  onClick={() => setShowLearnerModal(false)} 
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ✕
                </button>
              </div>

              {!showAddLearnerForm ? (
                <>
                  {/* Search and Add Learner */}
                  <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="Search students..."
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50 backdrop-blur-sm"
                        value={learnerSearch}
                        onChange={(e) => setLearnerSearch(e.target.value)}
                      />
                    </div>
                    <button
                      onClick={() => setShowAddLearnerForm(true)}
                      className="bg-blue-600/80 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap backdrop-blur-sm border border-blue-500/30"
                    >
                      + Add New Student
                    </button>
                  </div>

                  {/* Learners List */}
                  <div className="border border-gray-200/50 rounded-lg overflow-hidden bg-white/30 backdrop-blur-sm">
                    <table className="min-w-full divide-y divide-gray-200/50">
                      <thead className="bg-white/20 backdrop-blur-sm">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Name</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">ID</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Class</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white/10 backdrop-blur-sm divide-y divide-gray-200/50">
                        {filteredLearners.length > 0 ? (
                          filteredLearners.map((learner) => (
                            <tr key={learner.idNumber} className="hover:bg-white/20">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  {learner.firstName} {learner.lastName}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-700">{learner.idNumber}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-700">{learner.className}</div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="3" className="px-6 py-4 text-center text-sm text-gray-700">
                              {learnerSearch ? "No students found matching your search" : "No students found"}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                // Add Learner Form
                <form onSubmit={handleAddLearner} className="space-y-6 bg-white/30 backdrop-blur-sm p-4 rounded-lg border border-white/30">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                      <input
                        type="text"
                        name="firstName"
                        value={learnerForm.firstName}
                        onChange={handleLearnerChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50 backdrop-blur-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                      <input
                        type="text"
                        name="lastName"
                        value={learnerForm.lastName}
                        onChange={handleLearnerChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50 backdrop-blur-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                      <select
                        name="gender"
                        value={learnerForm.gender}
                        onChange={handleLearnerChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50 backdrop-blur-sm"
                        required
                      >
                        <option value="" className="bg-white/80 text-gray-800">Select Gender</option>
                        <option value="Male" className="bg-white/80 text-gray-800">Male</option>
                        <option value="Female" className="bg-white/80 text-gray-800">Female</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Class</label>
                      <select
                        name="className"
                        value={learnerForm.className}
                        onChange={handleLearnerChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50 backdrop-blur-sm"
                        required
                      >
                        <option value="" className="bg-white/80 text-gray-800">Select Class</option>
                        {classesList.map(className => (
                          <option key={className} value={className} className="bg-white/80 text-gray-800">
                            {className}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-4">
                    <button
                      type="button"
                      onClick={() => setShowAddLearnerForm(false)}
                      className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50/50 backdrop-blur-sm bg-white/30"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-3 bg-blue-600/80 text-white rounded-lg hover:bg-blue-700 backdrop-blur-sm border border-blue-500/30"
                    >
                      Add Student
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Teacher Password Update Modal */}
      {showTeacherPasswordModal && selectedTeacherForPassword && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Set Password for {selectedTeacherForPassword.firstName} {selectedTeacherForPassword.lastName}</h2>
                <button 
                  onClick={() => {
                    setShowTeacherPasswordModal(false);
                    setSelectedTeacherForPassword(null);
                    setTeacherPassword("");
                  }} 
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleUpdatePassword} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                  <input
                    type="password"
                    value={teacherPassword}
                    onChange={(e) => setTeacherPassword(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowTeacherPasswordModal(false);
                      setSelectedTeacherForPassword(null);
                      setTeacherPassword("");
                    }}
                    className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Update Password
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Student Modal */}
      {showLearnerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Students Management</h2>
                <button 
                  onClick={() => {
                    setShowLearnerModal(false);
                    setShowAddLearnerForm(false);
                    setSelectedClass(""); // Reset selected class when closing modal
                  }} 
                  className="text-4xl text-gray-500 hover:text-gray-800 focus:outline-none"
                >
                  ✕
                </button>
              </div>

              {!showAddLearnerForm ? (
                <>
                  {/* Search and Add Student */}
                  <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="Search students..."
                        className="w-full p-3 border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 bg-white/50 backdrop-blur-sm"
                        value={learnerSearch}
                        onChange={(e) => setLearnerSearch(e.target.value)}
                      />
                    </div>
                    <button
                      onClick={() => {
                        setSelectedClass(""); // Reset selected class when adding new student
                        setShowAddLearnerForm(true);
                      }}
                      className="bg-green-600/80 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors whitespace-nowrap backdrop-blur-sm border border-green-500/30"
                    >
                      + Add New Student
                    </button>
                  </div>

                  {/* Students List */}
                  <div className="border border-white/30 rounded-lg overflow-hidden bg-white/30 backdrop-blur-sm">
                    <table className="min-w-full divide-y divide-white/30">
                      <thead className="bg-white/20 backdrop-blur-sm">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Name</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">ID</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Class</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white/10 backdrop-blur-sm divide-y divide-white/30">
                        {filteredLearners.length > 0 ? (
                          filteredLearners.map((learner) => (
                            <tr key={learner.idNumber || learner.LearnerID} className="hover:bg-white/20">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  {learner.firstName} {learner.lastName}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-700">{learner.idNumber || learner.LearnerID}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-700">{learner.className}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <button
                                  onClick={() => {
                                    if (window.confirm("Are you sure you want to delete this student?")) {
                                      handleDeleteLearner(learner.id);
                                    }
                                  }}
                                  className="text-red-700 hover:text-red-900 backdrop-blur-sm bg-red-100/30 px-2 py-1 rounded border border-red-300/30"
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-700">
                              {learnerSearch ? "No students found matching your search" : "No students found"}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                // Add Student Form
                <form onSubmit={handleAddLearner} className="space-y-6 bg-white/30 backdrop-blur-sm p-4 rounded-lg border border-white/30">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                      <input
                        type="text"
                        name="firstName"
                        value={learnerForm.firstName}
                        onChange={handleLearnerChange}
                        className="w-full p-3 border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 bg-white/50 backdrop-blur-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                      <input
                        type="text"
                        name="lastName"
                        value={learnerForm.lastName}
                        onChange={handleLearnerChange}
                        className="w-full p-3 border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 bg-white/50 backdrop-blur-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Class</label>
                      <select
                        name="className"
                        value={learnerForm.className}
                        onChange={handleLearnerChange}
                        className="w-full p-3 border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 bg-white/50 backdrop-blur-sm"
                        required
                      >
                        <option value="">Select Class</option>
                        {classesList.map(cls => (
                          <option key={cls} value={cls}>{cls}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                      <select
                        name="className"
                        value={learnerForm.className}
                        onChange={handleLearnerChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        required
                      >
                        <option value="">Select Class</option>
                        {classesList.map(cls => (
                          <option key={cls} value={cls}>{cls}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                      <select
                        name="gender"
                        value={learnerForm.gender}
                        onChange={handleLearnerChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        required
                      >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-4">
                    <button
                      type="button"
                      onClick={() => setShowAddLearnerForm(false)}
                      className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      Add Student
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* View Students by Class Modal */}
      {showClassView && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">View Students by Class</h2>
                <button 
                  onClick={() => setShowClassView(false)} 
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {classesList.map((className) => {
                  // Filter students for this class
                  const classStudents = learners.filter(learner => learner.className === className);
                  
                  return (
                    <div 
                      key={className} 
                      className="border border-gray-200 rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                      onClick={() => {
                        setSelectedClassDetails({ name: className, students: classStudents });
                        setShowClassDetailsView(true);
                      }}
                    >
                      <div className="bg-blue-50 px-4 py-3 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-800">{className}</h3>
                        <p className="text-sm text-gray-600">{classStudents.length} students</p>
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {classStudents.length > 0 ? (
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {classStudents.slice(0, 5).map((student) => (
                                <tr key={student.idNumber} className="hover:bg-gray-50">
                                  <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {student.firstName} {student.lastName}
                                  </td>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                                    {student.idNumber}
                                  </td>
                                </tr>
                              ))}
                              {classStudents.length > 5 && (
                                <tr>
                                  <td colSpan="2" className="px-4 py-2 text-center text-sm text-gray-500">
                                    and {classStudents.length - 5} more...
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        ) : (
                          <div className="p-4 text-center text-gray-500 text-sm">
                            No students in this class
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Class Details Modal */}
      {showClassDetailsView && selectedClassDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Class Details - {selectedClassDetails.name}</h2>
                <button 
                  onClick={() => setShowClassDetailsView(false)} 
                  className="text-4xl text-gray-500 hover:text-gray-800 focus:outline-none"
                >
                  ✕
                </button>
              </div>

              <div className="mb-6">
                <div className="flex justify-between items-center bg-white/20 backdrop-blur-sm p-4 rounded-lg border border-white/30">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{selectedClassDetails.name}</h3>
                    <p className="text-gray-700">{selectedClassDetails.students.length} students enrolled</p>
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => printClassBroadsheet(selectedClassDetails.name, selectedClassDetails.students)}
                      className="bg-green-600/80 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center backdrop-blur-sm border border-green-500/30"
                    >
                      <span>Print Broadsheet</span>
                    </button>
                    <button
                      onClick={() => {
                        setSelectedClass(selectedClassDetails.name);
                        setShowClassDetailsView(false);
                        setShowLearnerModal(true);
                      }}
                      className="bg-blue-600/80 hover:bg-blue-700 text-white px-4 py-2 rounded-lg backdrop-blur-sm border border-blue-500/30"
                    >
                      View All Students
                    </button>
                  </div>
                </div>
              </div>

              <div className="border border-white/30 rounded-lg overflow-hidden bg-white/30 backdrop-blur-sm">
                <table className="min-w-full divide-y divide-white/30">
                  <thead className="bg-white/20 backdrop-blur-sm">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white/10 backdrop-blur-sm divide-y divide-white/30">
                    {selectedClassDetails.students.length > 0 ? (
                      selectedClassDetails.students.map((student) => (
                        <tr key={student.idNumber} className="hover:bg-white/20">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {student.firstName} {student.lastName}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-700">{student.idNumber}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => printStudentReport(student, selectedClassDetails.name)}
                              className="text-blue-700 hover:text-blue-900 backdrop-blur-sm bg-blue-100/30 px-2 py-1 rounded border border-blue-300/30"
                            >
                              Print Report
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="3" className="px-6 py-4 text-center text-sm text-gray-700">
                          No students in this class
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Class Setup Modal */}
      {showClassSetupView && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/10 backdrop-blur-xl rounded-lg shadow-2xl border border-white/40 ring-1 ring-white/20 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Class Setup</h2>
                <button 
                  className="text-4xl text-gray-500 hover:text-gray-800 focus:outline-none"
                  onClick={() => setShowClassSetupView(false)}
                >
                  ✕
                </button>
              </div>

              {/* Teachers List with Class/Subject Assignment */}
              <div className="border border-white/30 rounded-lg overflow-hidden bg-white/30 backdrop-blur-sm">
                <table className="min-w-full divide-y divide-white/30">
                  <thead className="bg-white/20 backdrop-blur-sm">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Teacher</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Current Classes</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Current Subjects</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white/10 backdrop-blur-sm divide-y divide-white/30">
                    {teachers.length > 0 ? (
                      teachers.map((teacher) => (
                        <tr key={teacher.id} className="hover:bg-white/20">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {teacher.firstName} {teacher.lastName}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-700">{teacher.email}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-700">
                              {teacher.classes && teacher.classes.length > 0 
                                ? teacher.classes.join(", ") 
                                : "No classes assigned"}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-700">
                              {teacher.subjects && teacher.subjects.length > 0 
                                ? teacher.subjects.join(", ") 
                                : "No subjects assigned"}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => openClassSetup(teacher)}
                              className="text-blue-700 hover:text-blue-900 backdrop-blur-sm bg-blue-100/30 px-2 py-1 rounded border border-blue-300/30"
                            >
                              Assign Classes/Subjects
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-700">
                          No teachers found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {teachers.length > 0 ? (
                      teachers.map((teacher) => (
                        <tr key={teacher.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {teacher.firstName} {teacher.lastName}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{teacher.email}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-500">
                              {teacher.classes && teacher.classes.length > 0 
                                ? teacher.classes.join(", ") 
                                : "No classes assigned"}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-500">
                              {teacher.subjects && teacher.subjects.length > 0 
                                ? teacher.subjects.join(", ") 
                                : "No subjects assigned"}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => openClassSetup(teacher)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Assign Classes/Subjects
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                          No teachers found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Class Setup Modal */}
      {showClassSetupModal && selectedTeacherForClass && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/10 backdrop-blur-xl rounded-lg shadow-2xl border border-white/40 ring-1 ring-white/20 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Assign Classes & Subjects to {selectedTeacherForClass.firstName} {selectedTeacherForClass.lastName}</h2>
                <button 
                  onClick={() => {
                    setShowClassSetupModal(false);
                    setSelectedTeacherForClass(null);
                  }} 
                  className="text-4xl text-gray-500 hover:text-gray-800 focus:outline-none"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAssignClassesAndSubjects} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Classes</label>
                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 border border-white/30 rounded-lg bg-white/20 backdrop-blur-sm">
                    {classesList.map(className => (
                      <label key={className} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={teacherClasses.includes(className)}
                          onChange={() => handleClassToggleForSetup(className)}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{className}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subjects</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-2 border border-white/30 rounded-lg bg-white/20 backdrop-blur-sm">
                    {subjectsList.map(subject => (
                      <label key={subject} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={teacherSubjects.includes(subject)}
                          onChange={() => handleSubjectToggleForSetup(subject)}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{subject}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowClassSetupModal(false);
                      setSelectedTeacherForClass(null);
                    }}
                    className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50/50 backdrop-blur-sm bg-white/30"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-blue-600/80 text-white rounded-lg hover:bg-blue-700 backdrop-blur-sm border border-blue-500/30"
                  >
                    Save Assignments
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

    </Layout>
  );
}

export default AdminDashboardPage;