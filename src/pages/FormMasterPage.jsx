import Layout from "../components/Layout";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { getLearners, updateFormMasterRemarks, getMarks, updateStudentScores, getClassPerformanceTrends, getClassSubjects, getStudentsByClass, getCustomAssessments, saveCustomAssessmentScores, getTeachers } from '../api-client';
import { useNotification } from '../context/NotificationContext';
import { useLoading } from '../context/LoadingContext';
import LoadingSpinner from '../components/LoadingSpinner';
import printingService from "../services/printingService";
import TeacherLeaderboard from "../components/TeacherLeaderboard";
import ManageClassView from "../components/formmaster/ManageClassView";
import EnterScoresView from "../components/formmaster/EnterScoresView";
import PromoteStudentsModal from "../components/PromoteStudentsModal";
import { DEFAULT_TERM } from "../constants/terms";
import { useGlobalSettings } from "../context/GlobalSettingsContext";

const FormMasterPage = () => {
  const { settings } = useGlobalSettings();
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const { setLoading, isLoading } = useLoading();

  const [learners, setLearners] = useState([]);
  const [saving, setSaving] = useState(false);
  const [selectedClass, setSelectedClass] = useState("");
  const [remarks, setRemarks] = useState({});
  const [attitude, setAttitude] = useState({});
  const [interest, setInterest] = useState({});
  const [comments, setComments] = useState({});
  const [attendance, setAttendance] = useState({});
  const [errors, setErrors] = useState({}); // New state for validation errors
  const [showConfirmDialog, setShowConfirmDialog] = useState(false); // New state for confirmation dialog
  const [marksData, setMarksData] = useState({}); // New state for marks data
  const [activeTab, setActiveTab] = useState("attendance"); // New state for active tab
  const [footnoteInfo, setFootnoteInfo] = useState(""); // New state for footnote information
  const [mainView, setMainView] = useState("manageClass"); // New state for main view: "manageClass" or "enterScores"

  // States for Enter Scores view (subject teacher functionality)
  const [selectedSubject, setSelectedSubject] = useState("");
  const [subjectMarks, setSubjectMarks] = useState({});
  const [savingScores, setSavingScores] = useState(false);
  const [savedStudents, setSavedStudents] = useState(new Set());
  const [isPromoteModalOpen, setIsPromoteModalOpen] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState("");
  const [customAssessments, setCustomAssessments] = useState([]);

  // State for teachers and subject-to-teacher mapping
  const [subjectTeachers, setSubjectTeachers] = useState({});

  // New states for daily attendance
  const [dailyAttendance, setDailyAttendance] = useState({});
  const [dailyAttendanceDate, setDailyAttendanceDate] = useState("");
  
  // New states for attendance report
  const [reportStartDate, setReportStartDate] = useState("");
  const [reportEndDate, setReportEndDate] = useState("");
  const [attendanceReportData, setAttendanceReportData] = useState([]);

  // New state for analytics
  const [analyticsData, setAnalyticsData] = useState({});

  // New state for PDF generation method toggle
  const [useServerSidePDF, setUseServerSidePDF] = useState(true);

  // Print Section states
  const [printClass, setPrintClass] = useState("");
  const [printClassStudents, setPrintClassStudents] = useState([]);
  const [printClassSubjects, setPrintClassSubjects] = useState([]);
  const [selectedPrintStudents, setSelectedPrintStudents] = useState([]);
  const [selectedPrintSubject, setSelectedPrintSubject] = useState("");
  const [printing, setPrinting] = useState(false);
  const [showSubjectDropdown, setShowSubjectDropdown] = useState(false);

  // Get user's assigned classes
  const getUserClasses = () => {
    console.log('User object:', user);
    console.log('User classes:', user?.classes);

    if (Array.isArray(user?.classes)) {
      const filtered = user.classes.filter(cls => cls !== 'ALL');
      console.log('Filtered classes:', filtered);
      return filtered;
    }

    // Handle if classes is a string (comma-separated or JSON)
    if (typeof user?.classes === 'string') {
      try {
        // Try parsing as JSON
        const parsed = JSON.parse(user.classes);
        if (Array.isArray(parsed)) {
          return parsed.filter(cls => cls !== 'ALL');
        }
      } catch (e) {
        // Try splitting by comma
        return user.classes.split(',').map(cls => cls.trim()).filter(cls => cls && cls !== 'ALL');
      }
    }

    console.log('No classes found, returning empty array');
    return [];
  };

  // Get user's assigned subjects
  const getUserSubjects = () => {
    if (Array.isArray(user?.subjects)) {
      return user.subjects;
    }
    return [];
  };

  useEffect(() => {
    loadLearners();
    loadCustomAssessments();
    loadTeachers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-select form class when switching to Manage Class view
  useEffect(() => {
    if (mainView === 'manageClass' && user?.formClass) {
      setSelectedClass(user.formClass);
    } else if (mainView === 'enterScores') {
      // Clear selection when switching to Enter Scores view
      setSelectedClass('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mainView]);

  const loadLearners = async () => {
    setLoading('learners', true, 'Loading students...');
    try {
      const response = await getLearners();
      if (response.status === 'success') {
        setLearners(response.data || []);
      } else {
        console.error('Learners error:', response.message);
        showNotification({message: 'Error loading students: ' + response.message, type: 'error'});
      }
    } catch (error) {
      console.error("Error loading learners:", error);
      showNotification({message: "Error loading students: " + error.message, type: 'error'});
    } finally {
      setLoading('learners', false);
    }
  };

  const loadCustomAssessments = async () => {
    try {
      const response = await getCustomAssessments();
      if (response.status === 'success') {
        setCustomAssessments(response.data || []);
      }
    } catch (error) {
      console.error('Error loading custom assessments:', error);
    }
  };

  // Load teachers and create subject-to-teacher mapping
  const loadTeachers = async () => {
    try {
      const response = await getTeachers();
      if (response.status === 'success') {
        const teachers = response.data || [];

        // Create a mapping of subject -> teacher name
        const mapping = {};
        teachers.forEach(teacher => {
          const teacherName = `${teacher.firstName} ${teacher.lastName}`;
          if (Array.isArray(teacher.subjects)) {
            teacher.subjects.forEach(subject => {
              mapping[subject] = teacherName;
            });
          }
        });

        setSubjectTeachers(mapping);
      }
    } catch (error) {
      console.error('Error loading teachers:', error);
    }
  };

  // Filter learners for selected class
  const filteredLearners = learners.filter(l => {
    const studentClass = l.className || l.class_name;
    return studentClass === selectedClass;
  });

  // Load saved remarks and attendance when class changes
  useEffect(() => {
    if (selectedClass && filteredLearners.length > 0) {
      loadSavedDataForClass(selectedClass);
      loadMarksDataForClass(selectedClass);
      loadFootnoteInfo(selectedClass);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClass, filteredLearners.length]);

  // Load saved data for a specific class
  const loadSavedDataForClass = (className) => {
    try {
      // Get saved remarks, attitude, interest, comments, and attendance from localStorage
      const savedRemarks = JSON.parse(localStorage.getItem(`formMasterRemarks_${className}`) || '{}');
      const savedAttitude = JSON.parse(localStorage.getItem(`formMasterAttitude_${className}`) || '{}');
      const savedInterest = JSON.parse(localStorage.getItem(`formMasterInterest_${className}`) || '{}');
      const savedComments = JSON.parse(localStorage.getItem(`formMasterComments_${className}`) || '{}');
      const savedAttendance = JSON.parse(localStorage.getItem(`formMasterAttendance_${className}`) || '{}');

      // Initialize with saved data or empty values
      const newRemarks = {};
      const newAttitude = {};
      const newInterest = {};
      const newComments = {};
      const newAttendance = {};
      const newErrors = {};

      filteredLearners.forEach(learner => {
        const key = learner.idNumber || learner.LearnerID;
        newRemarks[key] = savedRemarks[key] || "";
        newAttitude[key] = savedAttitude[key] || "";
        newInterest[key] = savedInterest[key] || "";
        newComments[key] = savedComments[key] || "";
        newAttendance[key] = savedAttendance[key] || "";
        newErrors[key] = "";
      });

      setRemarks(newRemarks);
      setAttitude(newAttitude);
      setInterest(newInterest);
      setComments(newComments);
      setAttendance(newAttendance);
      setErrors(newErrors);
    } catch (error) {
      console.error("Error loading saved data:", error);
      showNotification({message: "Error loading saved data: " + error.message, type: 'error'});
    }
  };

  // Load marks data for a specific class
  const loadMarksDataForClass = async (className) => {
    setLoading('marks', true, 'Loading marks data...');
    try {
      const userSubjects = getUserSubjects();
      if (userSubjects.length === 0) return;

      const marksPromises = userSubjects.map(subject => 
        getMarks(className, subject)
      );

      const marksResponses = await Promise.all(marksPromises);
      const newMarksData = {};

      marksResponses.forEach((response, index) => {
        const subject = userSubjects[index];
        if (response.status === 'success') {
          // Initialize marks for this subject
          newMarksData[subject] = {};

          // Populate with existing marks data
          response.data.forEach(mark => {
            // Try multiple possible student ID fields
            const studentId = mark.id_number || mark.studentId || mark.student_id;

            if (studentId) {
              newMarksData[subject][studentId] = {
                test1: mark.test1 ?? '',
                test2: mark.test2 ?? '',
                test3: mark.test3 ?? '',
                test4: mark.test4 ?? '',
                testsTotal: mark.tests_total || mark.testsTotal || '',
                classScore50: mark.class_score_50 || mark.classScore50 || '',
                exam: mark.exam ?? '',
                examScore50: mark.exam_score_50 || mark.examScore50 || '',
                total: mark.total ?? '',
                remark: mark.remark || '',
                ca1: mark.ca1 ?? '',
                ca2: mark.ca2 ?? ''
              };
            }
          });
        }
      });

      setMarksData(newMarksData);
    } catch (error) {
      console.error("Error loading marks data:", error);
      showNotification({message: "Error loading marks data: " + error.message, type: 'error'});
    } finally {
      setLoading('marks', false);
    }
  };

  // Load footnote information for a specific class
  const loadFootnoteInfo = (className) => {
    try {
      const savedFootnote = localStorage.getItem(`footnoteInfo_${className}`) || "";
      setFootnoteInfo(savedFootnote);
    } catch (error) {
      console.error("Error loading footnote info:", error);
      showNotification({message: "Error loading footnote info: " + error.message, type: 'error'});
    }
  };

  // Load analytics data for a specific class
  const loadAnalyticsData = async (className) => {
    setLoading('analytics', true, 'Loading analytics data...');
    try {
      const userSubjects = getUserSubjects();
      if (userSubjects.length === 0) return;

      const analyticsPromises = userSubjects.map(subject => 
        getClassPerformanceTrends(className, subject)
      );

      const analyticsResponses = await Promise.all(analyticsPromises);
      const newAnalyticsData = {};

      analyticsResponses.forEach((response, index) => {
        const subject = userSubjects[index];
        if (response.status === 'success') {
          newAnalyticsData[subject] = response.data;
        }
      });

      setAnalyticsData(newAnalyticsData);
    } catch (error) {
      console.error("Error loading analytics data:", error);
      showNotification({message: "Error loading analytics data: " + error.message, type: 'error'});
    } finally {
      setLoading('analytics', false);
    }
  };

  // Load daily attendance when date changes
  useEffect(() => {
    if (dailyAttendanceDate && selectedClass) {
      loadDailyAttendance();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dailyAttendanceDate, selectedClass]);

  // Save data to localStorage whenever remarks, attitude, interest, comments, or attendance change
  useEffect(() => {
    if (selectedClass) {
      try {
        localStorage.setItem(`formMasterRemarks_${selectedClass}`, JSON.stringify(remarks));
        localStorage.setItem(`formMasterAttitude_${selectedClass}`, JSON.stringify(attitude));
        localStorage.setItem(`formMasterInterest_${selectedClass}`, JSON.stringify(interest));
        localStorage.setItem(`formMasterComments_${selectedClass}`, JSON.stringify(comments));
        localStorage.setItem(`formMasterAttendance_${selectedClass}`, JSON.stringify(attendance));
      } catch (error) {
        console.error("Error saving data to localStorage:", error);
        showNotification({message: "Error saving data to localStorage: " + error.message, type: 'error'});
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remarks, attitude, interest, comments, attendance, selectedClass]);

  // Save footnote information to localStorage
  useEffect(() => {
    if (selectedClass) {
      try {
        localStorage.setItem(`footnoteInfo_${selectedClass}`, footnoteInfo);
      } catch (error) {
        console.error("Error saving footnote info to localStorage:", error);
        showNotification({message: "Error saving footnote info: " + error.message, type: 'error'});
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [footnoteInfo, selectedClass]);

  const handleRemarkChange = (studentId, value) => {
    setRemarks(prev => ({
      ...prev,
      [studentId]: value
    }));

    // Clear error for this field when user starts typing
    if (errors[studentId]) {
      setErrors(prev => ({
        ...prev,
        [studentId]: ""
      }));
    }
  };

  const handleAttitudeChange = (studentId, value) => {
    setAttitude(prev => ({
      ...prev,
      [studentId]: value
    }));
  };

  const handleInterestChange = (studentId, value) => {
    setInterest(prev => ({
      ...prev,
      [studentId]: value
    }));
  };

  const handleCommentsChange = (studentId, value) => {
    setComments(prev => ({
      ...prev,
      [studentId]: value
    }));
  };

  const handleAttendanceChange = (studentId, value) => {
    // Allow only numbers
    if (value && !/^\d*$/.test(value)) return;
    
    setAttendance(prev => ({
      ...prev,
      [studentId]: value
    }));
    
    // Clear error for this field when user starts typing
    if (errors[studentId]) {
      setErrors(prev => ({
        ...prev,
        [studentId]: ""
      }));
    }
  };

  // Handle marks change for a student
  const handleMarksChange = (subject, studentId, field, value) => {
    // Allow only numbers
    if (value && !/^\d*\.?\d*$/.test(value)) return;

    // Calculate total automatically
    const currentMarks = marksData[subject]?.[studentId] || {};
    const updatedMarks = { ...currentMarks, [field]: value };

    // Get test scores (each out of 15)
    const test1 = parseFloat(updatedMarks.test1 || 0);
    const test2 = parseFloat(updatedMarks.test2 || 0);
    const test3 = parseFloat(updatedMarks.test3 || 0);
    const test4 = parseFloat(updatedMarks.test4 || 0);

    // Calculate tests total (out of 60)
    const testsTotal = test1 + test2 + test3 + test4;

    // Convert tests to 50% (60 marks → 50%)
    const classScore50 = (testsTotal / 60) * 50;

    // Get exam score (out of 100)
    const examScore = parseFloat(updatedMarks.exam || 0);

    // Convert exam to 50% (100 marks → 50%)
    const examScore50 = (examScore / 100) * 50;

    // Calculate final total (out of 100)
    const finalTotal = classScore50 + examScore50;

    setMarksData(prev => ({
      ...prev,
      [subject]: {
        ...prev[subject],
        [studentId]: {
          ...updatedMarks,
          testsTotal: testsTotal.toFixed(1),
          classScore50: classScore50.toFixed(1),
          examScore50: examScore50.toFixed(1),
          total: finalTotal.toFixed(1)
        }
      }
    }));
  };

  // Handle footnote info change
  const handleFootnoteChange = (value) => {
    setFootnoteInfo(value);
  };

  // Handle daily attendance change
  const handleDailyAttendanceChange = (studentId, status) => {
    setDailyAttendance(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  // Load daily attendance for selected date
  const loadDailyAttendance = () => {
    if (!selectedClass || !dailyAttendanceDate) return;
    
    try {
      const dailyAttendanceKey = `dailyAttendance_${selectedClass}_${dailyAttendanceDate}`;
      const savedDailyAttendance = JSON.parse(localStorage.getItem(dailyAttendanceKey) || '{}');
      setDailyAttendance(savedDailyAttendance);
    } catch (error) {
      console.error("Error loading daily attendance:", error);
      showNotification({message: "Error loading daily attendance: " + error.message, type: 'error'});
    }
  };

  // Save daily attendance
  const saveDailyAttendance = () => {
    if (!selectedClass || !dailyAttendanceDate) {
      showNotification({message: "Please select a class and date first.", type: 'error'});
      return;
    }

    setSaving(true);
    
    try {
      const dailyAttendanceKey = `dailyAttendance_${selectedClass}_${dailyAttendanceDate}`;
      localStorage.setItem(dailyAttendanceKey, JSON.stringify(dailyAttendance));
      
      // Also save to the main attendance record for reporting
      const attendanceSummaryKey = `formMasterAttendance_${selectedClass}`;
      const existingAttendance = JSON.parse(localStorage.getItem(attendanceSummaryKey) || '{}');
      
      // Update the summary attendance based on daily records
      filteredLearners.forEach(learner => {
        const studentId = learner.idNumber || learner.LearnerID;
        // Initialize if not exists
        if (!existingAttendance[studentId]) {
          existingAttendance[studentId] = {
            present: 0,
            absent: 0,
            late: 0,
            total: 0
          };
        }
        
        // Get all daily attendance records for this student
        const studentDailyRecords = {};
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
          if (key.startsWith(`dailyAttendance_${selectedClass}_`)) {
            const date = key.split('_').pop();
            const dailyData = JSON.parse(localStorage.getItem(key) || '{}');
            if (dailyData[studentId]) {
              studentDailyRecords[date] = dailyData[studentId];
            }
          }
        });
        
        // Calculate summary from all daily records
        let present = 0, absent = 0, late = 0;
        Object.values(studentDailyRecords).forEach(status => {
          switch (status) {
            case 'present': present++; break;
            case 'absent': absent++; break;
            case 'late': late++; break;
          }
        });
        
        existingAttendance[studentId] = {
          present,
          absent,
          late,
          total: present + absent + late
        };
      });
      
      localStorage.setItem(attendanceSummaryKey, JSON.stringify(existingAttendance));
      
      showNotification({message: "Daily attendance saved successfully!", type: 'success'});
    } catch (error) {
      console.error("Error saving daily attendance:", error);
      showNotification({message: "Error saving daily attendance: " + error.message, type: 'error'});
    } finally {
      setSaving(false);
    }
  };

  // Generate attendance report
  const generateAttendanceReport = () => {
    if (!selectedClass || !reportStartDate || !reportEndDate) {
      showNotification({message: "Please select a class and date range first.", type: 'error'});
      return;
    }
    
    setLoading('report', true, 'Generating attendance report...');
    try {
      const reportData = [];
      
      // Get all dates between start and end date
      const startDate = new Date(reportStartDate);
      const endDate = new Date(reportEndDate);
      const dates = [];
      
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        dates.push(new Date(d).toISOString().split('T')[0]);
      }
      
      // For each student, calculate attendance stats
      filteredLearners.forEach(learner => {
        const studentId = learner.idNumber || learner.LearnerID;
        let present = 0;
        let absent = 0;
        let late = 0;
        
        dates.forEach(date => {
          const dailyAttendanceKey = `dailyAttendance_${selectedClass}_${date}`;
          const dailyData = JSON.parse(localStorage.getItem(dailyAttendanceKey) || '{}');
          const status = dailyData[studentId] || 'present'; // Default to present if no record
          
          switch (status) {
            case 'present':
              present++;
              break;
            case 'absent':
              absent++;
              break;
            case 'late':
              late++;
              break;
          }
        });
        
        const totalDays = present + absent + late;
        const percentage = totalDays > 0 ? Math.round(((present + (late * 0.5)) / totalDays) * 100) : 0;
        
        reportData.push({
          studentId,
          name: `${learner.firstName} ${learner.lastName}`,
          totalDays,
          present,
          absent,
          late,
          percentage
        });
      });
      
      // Sort by student name
      reportData.sort((a, b) => a.name.localeCompare(b.name));
      
      setAttendanceReportData(reportData);
      showNotification({message: `Attendance report generated for ${reportData.length} students.`, type: 'success'});
    } catch (error) {
      console.error("Error generating attendance report:", error);
      showNotification({message: "Error generating attendance report: " + error.message, type: 'error'});
    } finally {
      setLoading('report', false);
    }
  };

  // Print attendance report
  const printAttendanceReport = () => {
    if (attendanceReportData.length === 0) {
      showNotification({message: "No report data to print.", type: 'error'});
      return;
    }
    
    try {
      let tableRows = '';
      attendanceReportData.forEach((student) => {
        tableRows += `
${student.name} | ${student.present} | ${student.absent} | ${student.late} | ${student.totalDays} | ${student.percentage}%
`;
      });

      const blob = new Blob([tableRows], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance_report_${selectedClass}_${reportStartDate}_${reportEndDate}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error printing attendance report:", error);
      showNotification({message: "Error printing attendance report: " + error.message, type: 'error'});
    }
  };


  // Print broadsheet for a specific class and subject
  const printBroadsheet = async (subject) => {
    if (!selectedClass || !subject) {
      showNotification({message: "Please select a class and subject first.", type: 'error'});
      return;
    }

    try {
      // Get school information
      const schoolInfo = printingService.getSchoolInfo();

      // Fetch teacher assigned to this subject for this class
      let teacherName = '';
      try {
        const teachersResponse = await getTeachers();
        if (teachersResponse.status === 'success') {
          const teachers = teachersResponse.data || [];
          const subjectTeacher = teachers.find(teacher => {
            const teacherClasses = teacher.classes || [];
            const teacherSubjects = teacher.subjects || [];
            const teachesThisClass = teacherClasses.includes(selectedClass) ||
                                     teacher.classAssigned === selectedClass ||
                                     teacher.form_class === selectedClass;
            return teachesThisClass && teacherSubjects.includes(subject);
          });
          if (subjectTeacher) {
            teacherName = `${subjectTeacher.first_name || subjectTeacher.firstName || ''} ${subjectTeacher.last_name || subjectTeacher.lastName || ''}`.trim();
          }
        }
      } catch (error) {
        console.warn('Could not fetch teacher for subject:', error);
        // Continue without teacher name
      }

      // Generate and download subject broadsheet
      const result = await printingService.printSubjectBroadsheet(
        selectedClass,
        subject,
        schoolInfo,
        teacherName, // Pass the subject teacher's name
        settings.term || DEFAULT_TERM // term from global settings
      );

      if (result.success) {
        showNotification({message: result.message, type: 'success'});
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error("Error printing broadsheet:", error);
      showNotification({message: "Error printing broadsheet: " + error.message, type: 'error'});
    }
  };

  // Print complete class broadsheet with all subjects
  const _printCompleteClassBroadsheet = async () => {
    if (!selectedClass) {
      showNotification({message: "Please select a class first.", type: 'error'});
      return;
    }

    try {
      // Get school information
      const schoolInfo = printingService.getSchoolInfo();

      // Generate and download complete class broadsheet
      const result = await printingService.printCompleteClassBroadsheet(
        selectedClass,
        schoolInfo
      );
      
      if (result.success) {
        showNotification({message: result.message, type: 'success'});
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error("Error printing complete class broadsheet:", error);
      showNotification({message: "Error printing complete class broadsheet: " + error.message, type: 'error'});
    }
  };

  // Print class report with attendance and remarks
  // Print Student Terminal Reports
  const printStudentReports = async () => {
    if (!selectedClass) {
      showNotification({message: "Please select a class first.", type: 'error'});
      return;
    }

    // Verify this is the form class
    if (selectedClass !== user?.formClass) {
      showNotification({message: "You can only print reports for your assigned form class.", type: 'error'});
      return;
    }

    try {
      const schoolInfo = printingService.getSchoolInfo();
      const classStudents = filteredLearners;

      if (classStudents.length === 0) {
        showNotification({message: "No students found in this class", type: 'error'});
        return;
      }

      let result;

      // Try server-side PDF generation first if enabled
      if (useServerSidePDF) {
        try {
          showNotification({
            message: "Generating high-quality PDFs on server...",
            type: 'info'
          });

          result = await printingService.printBulkStudentReportsServerSide(
            classStudents,
            schoolInfo.term,
            schoolInfo
          );

          if (result.success) {
            showNotification({message: result.message, type: 'success'});
            return;
          } else {
            throw new Error(result.message);
          }
        } catch (serverError) {
          console.warn('Server-side PDF generation failed, falling back to client-side:', serverError);
          showNotification({
            message: "Server-side generation failed. Trying client-side...",
            type: 'warning'
          });

          // Fallback to client-side generation
          result = await printingService.printBulkStudentReports(
            classStudents,
            schoolInfo.term,
            schoolInfo
          );

          if (result.success) {
            showNotification({
              message: result.message + ' (using client-side generation)',
              type: 'success'
            });
          } else {
            throw new Error(result.message);
          }
        }
      } else {
        // Use client-side generation directly
        result = await printingService.printBulkStudentReports(
          classStudents,
          schoolInfo.term,
          schoolInfo
        );

        if (result.success) {
          showNotification({message: result.message, type: 'success'});
        } else {
          throw new Error(result.message);
        }
      }
    } catch (error) {
      console.error("Error printing student reports:", error);
      showNotification({message: "Error printing student reports: " + error.message, type: 'error'});
    }
  };

  // Print Complete Class Broadsheet
  const printClassBroadsheet = async () => {
    if (!selectedClass) {
      showNotification({message: "Please select a class first.", type: 'error'});
      return;
    }

    // Verify this is the form class
    if (selectedClass !== user?.formClass) {
      showNotification({message: "You can only print broadsheets for your assigned form class.", type: 'error'});
      return;
    }

    try {
      const schoolInfo = printingService.getSchoolInfo();
      const result = await printingService.printCompleteClassBroadsheet(
        selectedClass,
        schoolInfo
      );

      if (result.success) {
        showNotification({message: result.message, type: 'success'});
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error("Error printing class broadsheet:", error);
      showNotification({message: "Error printing class broadsheet: " + error.message, type: 'error'});
    }
  };

  // ========== PRINT SECTION FUNCTIONS ==========

  // Handle print class change
  const handlePrintClassChange = async (className) => {
    setPrintClass(className);
    if (className) {
      try {
        // Fetch both students and subjects for the class
        const [studentsResponse, subjectsResponse] = await Promise.all([
          getStudentsByClass(className),
          getClassSubjects(className)
        ]);

        if (studentsResponse.status === 'success') {
          setPrintClassStudents(studentsResponse.data || []);
        } else {
          setPrintClassStudents([]);
        }

        if (subjectsResponse.status === 'success') {
          setPrintClassSubjects(subjectsResponse.data || []);
        } else {
          setPrintClassSubjects([]);
        }

        setSelectedPrintStudents([]);
        setSelectedPrintSubject("");
      } catch (error) {
        console.error("Error loading print class data:", error);
        showNotification({message: `Error loading class data: ${error.message}`, type: 'error'});
        setPrintClassStudents([]);
        setPrintClassSubjects([]);
      }
    } else {
      setPrintClassStudents([]);
      setPrintClassSubjects([]);
      setSelectedPrintStudents([]);
      setSelectedPrintSubject("");
    }
  };

  // Handle student selection for printing
  const handlePrintStudentSelection = (studentId) => {
    setSelectedPrintStudents(prev => {
      if (prev.includes(studentId)) {
        return prev.filter(id => id !== studentId);
      } else {
        return [...prev, studentId];
      }
    });
  };

  // Handle select all students
  const handleSelectAllPrintStudents = () => {
    if (selectedPrintStudents.length === printClassStudents.length) {
      setSelectedPrintStudents([]);
    } else {
      setSelectedPrintStudents(printClassStudents.map(s => s.id));
    }
  };

  // Print all class reports
  const printAllClassReports = async () => {
    if (!printClass) {
      showNotification({message: "Please select a class first", type: 'warning'});
      return;
    }

    setPrinting(true);
    try {
      const schoolInfo = printingService.getSchoolInfo();
      const result = await printingService.printBulkStudentReportsServerSide(
        printClassStudents,
        schoolInfo.term,
        schoolInfo,
        (progress) => console.log(`PDF Progress: ${progress}%`)
      );

      if (result.success) {
        showNotification({message: result.message, type: 'success'});
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error("Error printing class reports:", error);
      showNotification({message: `Error printing reports: ${error.message}`, type: 'error'});
    } finally {
      setPrinting(false);
    }
  };

  // Print selected students
  const printSelectedReports = async () => {
    if (selectedPrintStudents.length === 0) {
      showNotification({message: "Please select at least one student", type: 'warning'});
      return;
    }

    setPrinting(true);
    try {
      const schoolInfo = printingService.getSchoolInfo();
      const studentsToprint = printClassStudents.filter(s =>
        selectedPrintStudents.includes(s.id)
      );

      const result = await printingService.printBulkStudentReportsServerSide(
        studentsToprint,
        schoolInfo.term,
        schoolInfo,
        (progress) => console.log(`PDF Progress: ${progress}%`)
      );

      if (result.success) {
        showNotification({message: result.message, type: 'success'});
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error("Error printing selected reports:", error);
      showNotification({message: `Error printing reports: ${error.message}`, type: 'error'});
    } finally {
      setPrinting(false);
    }
  };

  // Print complete broadsheet for print class
  const printCompleteBroadsheet = async () => {
    if (!printClass) {
      showNotification({message: "Please select a class first", type: 'warning'});
      return;
    }

    setPrinting(true);
    try {
      const schoolInfo = printingService.getSchoolInfo();
      const result = await printingService.printCompleteClassBroadsheet(
        printClass,
        schoolInfo
      );

      if (result.success) {
        showNotification({message: result.message, type: 'success'});
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error("Error printing broadsheet:", error);
      showNotification({message: `Error printing broadsheet: ${error.message}`, type: 'error'});
    } finally {
      setPrinting(false);
    }
  };

  // Print subject broadsheet from print section
  const printSubjectBroadsheetFromPrintSection = async (subject) => {
    if (!printClass) {
      showNotification({message: "Please select a class first", type: 'warning'});
      return;
    }

    if (!subject) {
      showNotification({message: "Please select a subject", type: 'warning'});
      return;
    }

    setPrinting(true);
    try {
      const schoolInfo = printingService.getSchoolInfo();
      const result = await printingService.printSubjectBroadsheet(
        printClass,
        subject,
        schoolInfo,
        '', // teacherName
        settings.term || DEFAULT_TERM // term from global settings
      );

      if (result.success) {
        showNotification({message: `${subject} broadsheet for ${printClass} generated successfully`, type: 'success'});
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error("Error printing subject broadsheet:", error);
      showNotification({message: `Error printing ${subject} broadsheet: ${error.message}`, type: 'error'});
    } finally {
      setPrinting(false);
    }
  };

  // Handle confirmation dialog
  const handleConfirmDialog = (action) => {
    setShowConfirmDialog(false);
    
    if (action === 'save') {
      handleSave();
    }
  };

  const handleSave = () => {
    const userClasses = getUserClasses();
    const userSubjects = getUserSubjects();

    if (userClasses.length === 0) {
      showNotification({message: "You are not assigned to any classes.", type: 'error'});
      return;
    }

    if (userSubjects.length === 0) {
      showNotification({message: "You are not assigned to any subjects.", type: 'error'});
      return;
    }

    if (Object.keys(remarks).length === 0 || Object.keys(attendance).length === 0) {
      showNotification({message: "No data to save.", type: 'error'});
      return;
    }

    setSaving(true);

    try {
      const updatePromises = [];

      // Update form master remarks
      const remarksData = Object.keys(remarks).map(key => ({
        studentId: key,
        remarks: remarks[key]
      }));

      if (remarksData.length > 0) {
        updatePromises.push(updateFormMasterRemarks(selectedClass, remarksData));
      }

      // Update student scores
      userSubjects.forEach(subject => {
        const scoresData = Object.keys(marksData[subject]).map(key => ({
          studentId: key,
          ca1: marksData[subject][key].ca1,
          ca2: marksData[subject][key].ca2,
          exam: marksData[subject][key].exam,
          total: marksData[subject][key].total
        }));

        if (scoresData.length > 0) {
          updatePromises.push(updateStudentScores(selectedClass, subject, scoresData));
        }
      });

      if (updatePromises.length > 0) {
        Promise.all(updatePromises).then(results => {
          results.forEach(response => {
            if (response.status !== 'success') {
              console.error('Update error:', response.message);
              showNotification({message: 'Error saving data: ' + response.message, type: 'error'});
            }
          });

          showNotification({message: 'Data saved successfully!', type: 'success'});
        }).catch(error => {
          console.error('Update error:', error);
          showNotification({message: 'Error saving data: ' + error.message, type: 'error'});
        }).finally(() => {
          setSaving(false);
        });
      } else {
        showNotification({message: 'No data to save.', type: 'error'});
        setSaving(false);
      }
    } catch (error) {
      console.error('Update error:', error);
      showNotification({message: 'Error saving data: ' + error.message, type: 'error'});
      setSaving(false);
    }
  };

  // Validate form data
  const validateFormData = () => {
    const newErrors = {};
    let isValid = true;
    
    filteredLearners.forEach(learner => {
      const studentId = learner.idNumber || learner.LearnerID;
      const studentAttendance = attendance[studentId];
      
      // Validate attendance - must be a number between 0 and 365
      if (studentAttendance && (isNaN(studentAttendance) || studentAttendance < 0 || studentAttendance > 365)) {
        newErrors[studentId] = "Attendance must be a number between 0 and 365";
        isValid = false;
      }
    });
    
    setErrors(newErrors);
    return isValid;
  };

  // Validate marks data
  const validateMarksData = () => {
    const newErrors = {};
    let isValid = true;

    const userSubjects = getUserSubjects();

    userSubjects.forEach(subject => {
      if (marksData[subject]) {
        filteredLearners.forEach(learner => {
          const studentId = learner.idNumber || learner.LearnerID;
          const studentMarks = marksData[subject][studentId];

          if (studentMarks) {
            // Validate Test 1 (0-15)
            if (studentMarks.test1 && (isNaN(studentMarks.test1) || studentMarks.test1 < 0 || studentMarks.test1 > 15)) {
              newErrors[`${subject}-${studentId}-test1`] = "Test 1 must be between 0 and 15";
              isValid = false;
            }

            // Validate Test 2 (0-15)
            if (studentMarks.test2 && (isNaN(studentMarks.test2) || studentMarks.test2 < 0 || studentMarks.test2 > 15)) {
              newErrors[`${subject}-${studentId}-test2`] = "Test 2 must be between 0 and 15";
              isValid = false;
            }

            // Validate Test 3 (0-15)
            if (studentMarks.test3 && (isNaN(studentMarks.test3) || studentMarks.test3 < 0 || studentMarks.test3 > 15)) {
              newErrors[`${subject}-${studentId}-test3`] = "Test 3 must be between 0 and 15";
              isValid = false;
            }

            // Validate Test 4 (0-15)
            if (studentMarks.test4 && (isNaN(studentMarks.test4) || studentMarks.test4 < 0 || studentMarks.test4 > 15)) {
              newErrors[`${subject}-${studentId}-test4`] = "Test 4 must be between 0 and 15";
              isValid = false;
            }

            // Validate Exam Score (0-100)
            if (studentMarks.exam && (isNaN(studentMarks.exam) || studentMarks.exam < 0 || studentMarks.exam > 100)) {
              newErrors[`${subject}-${studentId}-exam`] = "Exam must be between 0 and 100";
              isValid = false;
            }
          }
        });
      }
    });

    setErrors(prev => ({ ...prev, ...newErrors }));
    return isValid;
  };

  // Show confirmation dialog before saving
  const confirmSave = () => {
    if (!selectedClass) {
      showNotification({message: "Please select a class first.", type: 'error'});
      return;
    }

    // Validate form before saving
    if (!validateFormData()) {
      showNotification({message: "Please fix the validation errors before saving.", type: 'error'});
      return;
    }

    setShowConfirmDialog(true);
  };


  // Save all marks data
  const saveAllMarksData = async () => {
    if (!selectedClass) {
      showNotification({message: "Please select a class first.", type: 'error'});
      return;
    }

    // Validate marks before saving
    if (!validateMarksData()) {
      showNotification({message: "Please fix the validation errors before saving.", type: 'error'});
      return;
    }

    setSaving(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      const userSubjects = getUserSubjects();
      const promises = [];

      userSubjects.forEach(subject => {
        if (marksData[subject]) {
          filteredLearners.forEach(learner => {
            const studentId = learner.idNumber || learner.LearnerID;
            const studentMarks = marksData[subject]?.[studentId];

            if (studentMarks && (studentMarks.test1 || studentMarks.test2 || studentMarks.test3 || studentMarks.test4 || studentMarks.exam)) {
              // Get test scores
              const test1 = parseFloat(studentMarks.test1) || 0;
              const test2 = parseFloat(studentMarks.test2) || 0;
              const test3 = parseFloat(studentMarks.test3) || 0;
              const test4 = parseFloat(studentMarks.test4) || 0;
              const testsTotal = test1 + test2 + test3 + test4;

              // Convert to 50%
              const classScore50 = (testsTotal / 60) * 50;

              // Get exam score
              const exam = parseFloat(studentMarks.exam) || 0;
              const examScore50 = (exam / 100) * 50;

              // Calculate total
              const total = classScore50 + examScore50;

              // Calculate grade
              let grade = '';
              if (total >= 80) grade = 'A';
              else if (total >= 70) grade = 'B';
              else if (total >= 60) grade = 'C';
              else if (total >= 50) grade = 'D';
              else if (total >= 40) grade = 'E';
              else if (total > 0) grade = 'F';

              promises.push(
                updateStudentScores({
                  studentId,
                  className: selectedClass,
                  subject,
                  term: settings.term || DEFAULT_TERM,
                  test1: studentMarks.test1 || "",
                  test2: studentMarks.test2 || "",
                  test3: studentMarks.test3 || "",
                  test4: studentMarks.test4 || "",
                  testsTotal: testsTotal.toString(),
                  classScore50: classScore50.toFixed(1),
                  exam: studentMarks.exam || "",
                  examScore50: examScore50.toFixed(1),
                  total: total.toFixed(1),
                  grade: grade
                })
              );
            }
          });
        }
      });

      const responses = await Promise.all(promises);

      responses.forEach(response => {
        if (response.status === 'success') {
          successCount++;
        } else {
          errorCount++;
          console.error("Error saving marks:", response.message);
        }
      });

      if (errorCount === 0) {
        showNotification({message: `All marks saved successfully! (${successCount} records)`, type: 'success'});
      } else {
        showNotification({message: `Saved ${successCount} marks successfully. ${errorCount} failed.`, type: 'warning'});
      }

    } catch (error) {
      console.error("Save all marks error:", error);
      showNotification({message: "Error saving marks: " + error.message, type: 'error'});
    } finally {
      setSaving(false);
    }
  };

  // Save footnote information
  const saveFootnoteInfo = () => {
    if (!selectedClass) {
      showNotification({message: "Please select a class first.", type: 'error'});
      return;
    }

    try {
      localStorage.setItem(`footnoteInfo_${selectedClass}`, footnoteInfo);
      showNotification({message: "Footnote information saved successfully!", type: 'success'});
    } catch (error) {
      console.error("Save footnote info error:", error);
      showNotification({message: "Error saving footnote info: " + error.message, type: 'error'});
    }
  };

  // ========== ENTER SCORES VIEW FUNCTIONS ==========

  // Initialize and load marks when class/subject changes (for Enter Scores view)
  useEffect(() => {
    if (mainView === 'enterScores' && selectedClass && selectedSubject && filteredLearners.length > 0) {
      loadSubjectMarks();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mainView, selectedClass, selectedSubject, filteredLearners.length]);

  // Load saved marks from database for Enter Scores view
  const loadSubjectMarks = async () => {
    setLoading('marks', true, 'Loading saved marks...');
    try {
      const response = await getMarks(selectedClass, selectedSubject);
      const newMarks = {};
      const savedSet = new Set();

      // Initialize all students with empty marks
      filteredLearners.forEach(learner => {
        const studentId = learner.idNumber || learner.LearnerID;
        newMarks[studentId] = {
          test1: "", test2: "", test3: "", test4: "", exam: ""
        };
      });

      // Populate with saved marks from database
      if (response.status === 'success' && response.data) {
        response.data.forEach(mark => {
          const studentId = mark.studentId || mark.student_id;
          if (newMarks[studentId]) {
            // Map database fields to form fields
            newMarks[studentId] = {
              test1: mark.test1 || "",
              test2: mark.test2 || "",
              test3: mark.test3 || "",
              test4: mark.test4 || "",
              exam: mark.exam || ""
            };
            // Mark this student as saved if they have any marks
            if (mark.test1 || mark.test2 || mark.test3 || mark.test4 || mark.exam) {
              savedSet.add(studentId);
            }
          }
        });
      }

      setSubjectMarks(newMarks);
      setSavedStudents(savedSet);
    } catch (error) {
      console.error("Error loading subject marks:", error);
      showNotification({message: "Error loading saved marks: " + error.message, type: 'error'});
      // Still initialize with empty marks even if loading fails
      const newMarks = {};
      filteredLearners.forEach(learner => {
        const studentId = learner.idNumber || learner.LearnerID;
        newMarks[studentId] = {
          test1: "", test2: "", test3: "", test4: "", exam: ""
        };
      });
      setSubjectMarks(newMarks);
      setSavedStudents(new Set());
    } finally {
      setLoading('marks', false);
    }
  };

  // Handle mark change for Enter Scores view
  const handleSubjectMarkChange = (studentId, field, value) => {
    // Allow only numbers and decimal points
    if (value && !/^\d*\.?\d*$/.test(value)) return;

    setSubjectMarks(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: value
      }
    }));
  };

  // Calculate totals for a student (Enter Scores view)
  const calculateStudentTotals = (studentMarks) => {
    const test1 = Math.min(parseFloat(studentMarks.test1) || 0, 15);
    const test2 = Math.min(parseFloat(studentMarks.test2) || 0, 15);
    const test3 = Math.min(parseFloat(studentMarks.test3) || 0, 15);
    const test4 = Math.min(parseFloat(studentMarks.test4) || 0, 15);
    const testsTotal = test1 + test2 + test3 + test4;
    const classScore50 = (testsTotal / 60) * 50;

    const exam = Math.min(parseFloat(studentMarks.exam) || 0, 100);
    const examScore50 = (exam / 100) * 50;

    const total = classScore50 + examScore50;

    let grade = '';
    if (total >= 80) grade = 'A';
    else if (total >= 70) grade = 'B';
    else if (total >= 60) grade = 'C';
    else if (total >= 50) grade = 'D';
    else if (total >= 40) grade = 'E';
    else if (total > 0) grade = 'F';

    return { testsTotal, classScore50, examScore50, total, grade };
  };

  // Save individual student scores (Enter Scores view)
  const saveStudentScores = async (studentId) => {
    if (!selectedClass || !selectedSubject) {
      showNotification({message: "Please select both class and subject", type: 'error'});
      return;
    }

    if (!selectedAssessment) {
      showNotification({message: "Please select an assessment type", type: 'error'});
      return;
    }

    const studentMarks = subjectMarks[studentId];
    if (!studentMarks) return;

    setSavingScores(true);
    try {
      const isCustomAssessment = selectedAssessment && selectedAssessment !== 'regular';

      if (isCustomAssessment) {
        // Save custom assessment score
        const response = await saveCustomAssessmentScores({
          assessmentId: parseInt(selectedAssessment),
          studentId,
          subject: selectedSubject,
          score: parseFloat(studentMarks.score) || 0
        });

        if (response.status === 'success') {
          setSavedStudents(prev => new Set([...prev, studentId]));
          showNotification({message: "Score saved successfully!", type: 'success'});
        } else {
          showNotification({message: "Error saving score: " + response.message, type: 'error'});
        }
      } else {
        // Save regular term scores
        const { testsTotal, classScore50, examScore50, total, grade } = calculateStudentTotals(studentMarks);

        await updateStudentScores({
          studentId,
          className: selectedClass,
          subject: selectedSubject,
          term: settings.term || DEFAULT_TERM,
          test1: studentMarks.test1 ?? "",
          test2: studentMarks.test2 ?? "",
          test3: studentMarks.test3 ?? "",
          test4: studentMarks.test4 ?? "",
          ca1: (parseFloat(studentMarks.test1) || 0) + (parseFloat(studentMarks.test2) || 0),
          ca2: (parseFloat(studentMarks.test3) || 0) + (parseFloat(studentMarks.test4) || 0),
          testsTotal: testsTotal.toString(),
          classScore50: classScore50.toFixed(1),
          exam: studentMarks.exam ?? "",
          examScore50: examScore50.toFixed(1),
          total: total.toFixed(1),
          grade: grade
        });

        setSavedStudents(prev => new Set([...prev, studentId]));
        showNotification({message: "Scores saved successfully!", type: 'success'});
      }
    } catch (error) {
      console.error("Error saving scores:", error);
      showNotification({message: "Error saving scores: " + error.message, type: 'error'});
    } finally {
      setSavingScores(false);
    }
  };

  // Save all scores for the subject (Enter Scores view)
  const saveAllSubjectScores = async () => {
    if (!selectedClass || !selectedSubject) {
      showNotification({message: "Please select both class and subject", type: 'error'});
      return;
    }

    if (!selectedAssessment) {
      showNotification({message: "Please select an assessment type", type: 'error'});
      return;
    }

    setSavingScores(true);
    try {
      const isCustomAssessment = selectedAssessment && selectedAssessment !== 'regular';

      const promises = filteredLearners.map(learner => {
        const studentId = learner.idNumber || learner.LearnerID;
        const studentMarks = subjectMarks[studentId];

        if (isCustomAssessment) {
          // Save custom assessment scores
          if (studentMarks && studentMarks.score) {
            return saveCustomAssessmentScores({
              assessmentId: parseInt(selectedAssessment),
              studentId,
              subject: selectedSubject,
              score: parseFloat(studentMarks.score) || 0
            });
          }
        } else {
          // Save regular term scores
          if (studentMarks && (studentMarks.test1 || studentMarks.test2 || studentMarks.test3 || studentMarks.test4 || studentMarks.exam)) {
            const { testsTotal, classScore50, examScore50, total, grade } = calculateStudentTotals(studentMarks);

            return updateStudentScores({
              studentId,
              className: selectedClass,
              subject: selectedSubject,
              term: settings.term || DEFAULT_TERM,
              test1: studentMarks.test1 ?? "",
              test2: studentMarks.test2 ?? "",
              test3: studentMarks.test3 ?? "",
              test4: studentMarks.test4 ?? "",
              ca1: (parseFloat(studentMarks.test1) || 0) + (parseFloat(studentMarks.test2) || 0),
              ca2: (parseFloat(studentMarks.test3) || 0) + (parseFloat(studentMarks.test4) || 0),
              testsTotal: testsTotal.toString(),
              classScore50: classScore50.toFixed(1),
              exam: studentMarks.exam ?? "",
              examScore50: examScore50.toFixed(1),
              total: total.toFixed(1),
              grade: grade
            });
          }
        }
        return Promise.resolve();
      });

      await Promise.all(promises);
      showNotification({message: "All scores saved successfully!", type: 'success'});
      setSavedStudents(new Set(filteredLearners.map(l => l.idNumber || l.LearnerID)));
    } catch (error) {
      console.error("Error saving all scores:", error);
      showNotification({message: "Error saving scores: " + error.message, type: 'error'});
    } finally {
      setSavingScores(false);
    }
  };

  // Actions object for ManageClassView and EnterScoresView
  const actions = {
    // Tab navigation
    setActiveTab,

    // Attendance & Remarks handlers
    handleAttendanceChange,
    handleRemarkChange,
    handleAttitudeChange,
    handleInterestChange,
    handleCommentsChange,
    handleFootnoteChange,
    confirmSave,
    saveFootnoteInfo,

    // Marks handlers
    handleMarksChange,
    saveAllMarksData,

    // Broadsheet handlers
    printBroadsheet,

    // Analytics handlers
    loadAnalyticsData: () => loadAnalyticsData(selectedClass),

    // Daily Attendance handlers
    setDailyAttendanceDate,
    handleDailyAttendanceChange,
    saveDailyAttendance,

    // Report handlers
    setReportStartDate,
    setReportEndDate,
    generateAttendanceReport,
    printAttendanceReport,

    // Enter Scores handlers
    setSelectedClass,
    setSelectedSubject,
    setSelectedAssessment,
    handleScoreChange: handleSubjectMarkChange,
    saveScore: saveStudentScores,
    saveAllScores: saveAllSubjectScores
  };

  // Loading states object
  const loadingStates = {
    learners: isLoading('learners'),
    marks: isLoading('marks'),
    broadsheet: isLoading('broadsheet'),
    analytics: isLoading('analytics'),
    daily: isLoading('daily'),
    report: isLoading('report')
  };

  // State object for views
  const state = {
    activeTab,
    marksData,
    attendance,
    remarks,
    attitude,
    interest,
    comments,
    footnoteInfo,
    dailyAttendance,
    dailyAttendanceDate,
    analyticsData,
    attendanceReportData,
    reportStartDate,
    reportEndDate,
    // Enter Scores state
    selectedClass,
    selectedSubject,
    subjectMarks,
    savedStudents,
    savingScores,
    selectedAssessment,
    customAssessments
  };

  return (
    <Layout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6 text-white">Form Master Dashboard</h1>

        {/* Main View Switcher - Glass Morphism */}
        <div className="mb-6 bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-6">
          <div className="flex gap-4 flex-wrap">
            <button
              onClick={() => setMainView('manageClass')}
              className={`flex-1 min-w-[200px] py-4 px-6 rounded-xl font-semibold transition-all duration-300 ${
                mainView === 'manageClass'
                  ? 'bg-blue-500/80 backdrop-blur-lg text-white shadow-xl border border-blue-300/50 scale-105'
                  : 'bg-white/10 backdrop-blur-md text-white hover:bg-white/20 border border-white/20 hover:scale-102'
              }`}
            >
              <span className="text-2xl mr-2">🎓</span>
              Manage Class
            </button>
            <button
              onClick={() => setMainView('enterScores')}
              className={`flex-1 min-w-[200px] py-4 px-6 rounded-xl font-semibold transition-all duration-300 ${
                mainView === 'enterScores'
                  ? 'bg-green-500/80 backdrop-blur-lg text-white shadow-xl border border-green-300/50 scale-105'
                  : 'bg-white/10 backdrop-blur-md text-white hover:bg-white/20 border border-white/20 hover:scale-102'
              }`}
            >
              <span className="text-2xl mr-2">✏️</span>
              Enter Scores
            </button>
            <button
              onClick={() => setMainView('printSection')}
              className={`flex-1 min-w-[200px] py-4 px-6 rounded-xl font-semibold transition-all duration-300 ${
                mainView === 'printSection'
                  ? 'bg-purple-500/80 backdrop-blur-lg text-white shadow-xl border border-purple-300/50 scale-105'
                  : 'bg-white/10 backdrop-blur-md text-white hover:bg-white/20 border border-white/20 hover:scale-102'
              }`}
            >
              <span className="text-2xl mr-2">🖨️</span>
              Print Section
            </button>
            <button
              onClick={() => setIsPromoteModalOpen(true)}
              className="flex-1 min-w-[200px] py-4 px-6 rounded-xl font-semibold transition-all duration-300 bg-gradient-to-r from-green-500/80 to-blue-500/80 backdrop-blur-lg text-white hover:from-green-600/90 hover:to-blue-600/90 shadow-xl border border-white/30 hover:scale-105"
            >
              <span className="text-2xl mr-2">📈</span>
              Promote Students
            </button>
          </div>
        </div>

        {/* Manage Class View */}
        {mainView === 'manageClass' && selectedClass && (
          <ManageClassView
            state={state}
            actions={actions}
            formClass={selectedClass}
            students={filteredLearners}
            userSubjects={getUserSubjects()}
            subjectTeachers={subjectTeachers}
            loadingStates={loadingStates}
            errors={errors}
            saving={saving}
          />
        )}

        {/* Confirmation Dialog - Glass Morphism */}
        {showConfirmDialog && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white/90 backdrop-blur-2xl rounded-2xl shadow-2xl p-8 w-96 border border-white/40">
              <h3 className="text-2xl font-bold mb-4 text-gray-800">Confirm Save</h3>
              <p className="mb-6 text-gray-700">Are you sure you want to save all data? This action cannot be undone.</p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => handleConfirmDialog('cancel')}
                  className="px-6 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-100 backdrop-blur-md transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleConfirmDialog('save')}
                  className="px-6 py-2 bg-blue-600/90 backdrop-blur-md text-white rounded-xl hover:bg-blue-700 shadow-lg transition-all duration-200"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Enter Scores View - EnterScoresView handles all states internally */}
        {mainView === 'enterScores' && (
          <EnterScoresView
            state={state}
            actions={actions}
            userSubjects={getUserSubjects()}
            userClasses={getUserClasses()}
            students={filteredLearners}
            loadingStates={loadingStates}
            errors={errors}
            saving={savingScores}
          />
        )}

        {/* Print Section View - Glass Morphism */}
        {mainView === 'printSection' && (
          <div className="space-y-6">
            {/* Class Selection - Glass Morphism */}
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-white/30">
              <h2 className="text-2xl font-bold mb-6 text-white drop-shadow-md">Print Reports & Broadsheets</h2>

              <div className="mb-6">
                <label className="block text-sm font-medium text-white mb-2">Select Class</label>
                <select
                  value={printClass}
                  onChange={(e) => handlePrintClassChange(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Choose Class</option>
                  {getUserClasses().map(cls => (
                    <option key={cls} value={cls}>{cls}</option>
                  ))}
                </select>
              </div>

              {printClass && (
                <>
                  {/* Print Actions - Glass Morphism */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <button
                      onClick={printAllClassReports}
                      disabled={printing || printClassStudents.length === 0}
                      className={`bg-blue-600/80 backdrop-blur-md hover:bg-blue-700/90 disabled:bg-gray-400/50 text-white px-6 py-4 rounded-xl font-semibold transition-all duration-300 border border-white/30 shadow-lg hover:scale-105 ${
                        printing ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      {printing ? "Printing..." : `📄 Print All Reports (${printClassStudents.length})`}
                    </button>

                    <button
                      onClick={printCompleteBroadsheet}
                      disabled={printing}
                      className={`bg-green-600/80 backdrop-blur-md hover:bg-green-700/90 disabled:bg-gray-400/50 text-white px-6 py-4 rounded-xl font-semibold transition-all duration-300 border border-white/30 shadow-lg hover:scale-105 ${
                        printing ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      📊 Print Complete Broadsheet
                    </button>

                    <button
                      onClick={() => setShowSubjectDropdown(!showSubjectDropdown)}
                      disabled={printing}
                      className={`bg-purple-600/80 backdrop-blur-md hover:bg-purple-700/90 disabled:bg-gray-400/50 text-white px-6 py-4 rounded-xl font-semibold transition-all duration-300 border border-white/30 shadow-lg hover:scale-105 ${
                        printing ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      📋 Print Subject Broadsheet
                    </button>
                  </div>

                  {/* Subject Dropdown - Glass Morphism */}
                  {showSubjectDropdown && (
                    <div className="bg-white/10 backdrop-blur-lg rounded-xl p-5 mb-6 border border-white/20">
                      <h4 className="text-lg font-bold mb-4 text-white drop-shadow-md">Select Subject</h4>
                      <div className="max-h-48 overflow-y-auto bg-white/10 backdrop-blur-md rounded-lg p-3 border border-white/20">
                        {printClassSubjects.length > 0 ? (
                          printClassSubjects.map((subject) => (
                            <button
                              key={subject}
                              onClick={() => {
                                printSubjectBroadsheetFromPrintSection(subject);
                                setShowSubjectDropdown(false);
                              }}
                              disabled={printing}
                              className="w-full text-left px-4 py-3 mb-2 hover:bg-purple-500/30 rounded-lg transition-all duration-200 disabled:opacity-50 text-white font-medium backdrop-blur-sm border border-white/10 hover:border-white/30"
                            >
                              {subject}
                            </button>
                          ))
                        ) : (
                          <p className="text-white/80 text-sm p-3">No subjects with marks found</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Student Selection - Glass Morphism */}
                  <div className="bg-white/10 backdrop-blur-lg rounded-xl p-5 border border-white/20">
                    <h3 className="text-lg font-bold mb-4 text-white drop-shadow-md">Select Individual Students</h3>
                    <div className="flex items-center mb-4 bg-white/10 backdrop-blur-md p-3 rounded-lg border border-white/20">
                      <input
                        type="checkbox"
                        checked={selectedPrintStudents.length === printClassStudents.length && printClassStudents.length > 0}
                        onChange={handleSelectAllPrintStudents}
                        className="mr-3 w-5 h-5 text-purple-600 focus:ring-purple-500 rounded"
                      />
                      <label className="font-semibold text-white">Select All ({printClassStudents.length} students)</label>
                    </div>

                    <div className="max-h-60 overflow-y-auto bg-white/10 backdrop-blur-md rounded-lg p-3 mb-4 border border-white/20">
                      {printClassStudents.map((student) => (
                        <div key={student.id} className="flex items-center mb-2 hover:bg-white/10 p-2 rounded-lg transition-all duration-200">
                          <input
                            type="checkbox"
                            checked={selectedPrintStudents.includes(student.id)}
                            onChange={() => handlePrintStudentSelection(student.id)}
                            className="mr-3 w-4 h-4 text-purple-600 focus:ring-purple-500 rounded"
                          />
                          <label className="text-white font-medium">
                            {student.firstName || student.first_name} {student.lastName || student.last_name} ({student.idNumber || student.id_number})
                          </label>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={printSelectedReports}
                      disabled={printing || selectedPrintStudents.length === 0}
                      className={`bg-green-600/80 backdrop-blur-md hover:bg-green-700/90 disabled:bg-gray-400/50 w-full text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 border border-white/30 shadow-lg ${
                        printing || selectedPrintStudents.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      {printing ? "Printing..." : `Print Selected (${selectedPrintStudents.length})`}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Teacher Leaderboard - At Bottom */}
        <TeacherLeaderboard />

        {/* Promote Students Modal */}
        {isPromoteModalOpen && (
          <PromoteStudentsModal
            isOpen={isPromoteModalOpen}
            onClose={() => setIsPromoteModalOpen(false)}
            students={learners.filter(l => {
              // Form Master can only promote students from their assigned form class
              const assignedClass = user.formClass || user.classAssigned;
              const studentClass = l.className || l.class_name;
              return studentClass === assignedClass;
            })}
            userRole={user?.currentRole || user?.primaryRole}
            currentTerm={settings.term || DEFAULT_TERM}
            onPromotionComplete={() => {
              setIsPromoteModalOpen(false);
              window.location.reload();
            }}
          />
        )}
      </div>
    </Layout>
  );
};

export default FormMasterPage;
