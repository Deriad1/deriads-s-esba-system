import Layout from "../components/Layout";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { getLearners, updateFormMasterRemarks, getMarks, updateStudentScores, getClassPerformanceTrends, getClassSubjects, getStudentsByClass, getCustomAssessments, getCustomAssessmentScores, saveCustomAssessmentScores, getTeachers, getClasses, getSubjects, deleteMarks, getClassRemarks } from '../api-client';
import { useNotification } from '../context/NotificationContext';
import { useLoading } from '../context/LoadingContext';
import LoadingSpinner from '../components/LoadingSpinner';
import printingService from "../services/printingService";
import TeacherLeaderboard from "../components/TeacherLeaderboard";
import ManageClassView from "../components/formmaster/ManageClassView";
import EnterScoresView from "../components/formmaster/EnterScoresView";
import PromoteStudentsModal from "../components/PromoteStudentsModal";
import { DEFAULT_TERM, AVAILABLE_TERMS } from "../constants/terms";
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

  // State for all classes and subjects
  const [allClasses, setAllClasses] = useState([]);
  const [allSubjects, setAllSubjects] = useState([]);
  const [availableSubjects, setAvailableSubjects] = useState([]); // Subjects available for the selected class
  const [classMarksData, setClassMarksData] = useState({}); // For View Scores tab
  const [selectedTerm, setSelectedTerm] = useState(() => {
    return localStorage.getItem('formMaster_selectedTerm') || settings.term || DEFAULT_TERM;
  });

  // Term dates and attendance totals
  const [vacationDate, setVacationDate] = useState('');
  const [reopeningDate, setReopeningDate] = useState('');
  const [attendanceTotal, setAttendanceTotal] = useState({}); // Total school days per student
  // Get all classes where this Form Master teaches (for score entry and class selection)
  // Form Masters can teach subjects in multiple classes
  const getUserClasses = () => {
    return user?.classes || [];
  };

  // Get ONLY the form class for class management (attendance, remarks, printing reports)
  // Form Masters can only manage ONE form class
  const getFormClass = () => {
    const formClass = user?.form_class || user?.classAssigned;

    if (!formClass) {
      console.warn('⚠️ Form Master has no assigned form class');
      return [];
    }

    return [formClass];
  };

  // Get subjects assigned to this teacher
  const getUserSubjects = () => {
    return user?.subjects || [];
  };

  // Persist selectedTerm to localStorage
  useEffect(() => {
    localStorage.setItem('formMaster_selectedTerm', selectedTerm);
  }, [selectedTerm]);

  useEffect(() => {
    loadLearners();
    loadCustomAssessments();
    loadTeachers();
    loadAllClasses();
    loadAllSubjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-load all class marks and remarks when in Manage Class view
  useEffect(() => {
    if (mainView === 'manageClass' && selectedClass) {
      loadAllClassMarks();
      loadClassRemarksAndDates();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mainView, selectedClass, selectedTerm]);

  // Load all classes
  const loadAllClasses = async () => {
    try {
      const response = await getClasses();
      if (response.status === 'success' && Array.isArray(response.data)) {
        const classNames = response.data.map(c => c.name || c.class_name).filter(Boolean);
        console.log('Raw class names from API:', classNames); // Debug log

        // Filter for JHS classes (BS 7-9, Basic 7-9, JHS 1-3, etc.)
        const jhsClasses = classNames.filter(name => {
          const upperName = name.toUpperCase();
          return upperName.includes('BS 7') ||
            upperName.includes('BS 8') ||
            upperName.includes('BS 9') ||
            upperName.includes('BASIC 7') ||
            upperName.includes('BASIC 8') ||
            upperName.includes('BASIC 9') ||
            upperName.includes('JHS') ||
            upperName.includes('FORM 1') ||
            upperName.includes('FORM 2') ||
            upperName.includes('FORM 3') ||
            upperName.includes('GRADE 7') ||
            upperName.includes('GRADE 8') ||
            upperName.includes('GRADE 9');
        });

        if (jhsClasses.length === 0 && classNames.length > 0) {
          console.warn('No JHS classes found matching filter. Showing all classes as fallback.');
          setAllClasses(classNames);
        } else {
          setAllClasses(jhsClasses);
        }
      }
    } catch (error) {
      console.error("Error loading classes:", error);
    }
  };

  // Load all subjects
  const loadAllSubjects = async () => {
    try {
      const response = await getSubjects();
      if (response.status === 'success' && Array.isArray(response.data)) {
        const subjectNames = response.data.map(s => s.name).filter(Boolean);
        setAllSubjects(subjectNames);
      }
    } catch (error) {
      console.error("Error loading subjects:", error);
    }
  };

  // Helper to get all possible term variations for fallback
  const getTermVariations = (term) => {
    const variations = [term];

    const map = {
      'First Term': ['Term 1', '1', 'Term One'],
      'Second Term': ['Term 2', '2', 'Term Two'],
      'Third Term': ['Term 3', '3', 'Term Three']
    };

    if (map[term]) {
      variations.push(...map[term]);
    }

    return variations;
  };

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
        showNotification({ message: 'Error loading students: ' + response.message, type: 'error' });
      }
    } catch (error) {
      console.error("Error loading learners:", error);
      showNotification({ message: "Error loading students: " + error.message, type: 'error' });
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
  }, [selectedClass, filteredLearners.length, selectedTerm]);

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
      showNotification({ message: "Error loading saved data: " + error.message, type: 'error' });
    }
  };

  // Load marks data for a specific class
  const loadMarksDataForClass = async (className) => {
    setLoading('marks', true, 'Loading marks data...');
    try {
      // Determine if this is the Form Class
      const isFormClass = className === user?.formClass;

      let subjectsToLoad = [];

      if (isFormClass) {
        // Form Class: Load ALL class subjects
        try {
          const subjectsResponse = await getClassSubjects(className);
          if (subjectsResponse.status === 'success' && Array.isArray(subjectsResponse.data)) {
            subjectsToLoad = subjectsResponse.data;
          } else {
            console.warn('Could not load class subjects, falling back to teacher subjects');
            subjectsToLoad = user?.subjects || [];
          }
        } catch (error) {
          console.error('Error loading class subjects:', error);
          subjectsToLoad = user?.subjects || [];
        }
      } else {
        // Other Classes: Load ONLY teacher's subjects
        subjectsToLoad = user?.subjects || [];
      }

      if (subjectsToLoad.length === 0) {
        console.warn('No subjects to load for class:', className);
        setMarksData({});
        setAvailableSubjects([]);
        return;
      }

      // Update available subjects
      setAvailableSubjects(subjectsToLoad);

      // Fetch marks for all subjects
      const marksPromises = subjectsToLoad.map(subject =>
        getMarks(className, subject, selectedTerm)
      );
      const marksResponses = await Promise.all(marksPromises);

      const newMarksData = {};
      marksResponses.forEach((response, index) => {
          const subject = subjectsToLoad[index];
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

        // Log for debugging
        console.log(`[Form Master] Loaded marks for ${className}:`, {
          isFormClass,
          subjectsCount: subjectsToLoad.length,
          subjects: subjectsToLoad
        });
      } catch (error) {
        console.error("Error loading marks data:", error);
        showNotification({ message: "Error loading marks data: " + error.message, type: 'error' });
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
        showNotification({ message: "Error loading footnote info: " + error.message, type: 'error' });
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
        showNotification({ message: "Error loading analytics data: " + error.message, type: 'error' });
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
          showNotification({ message: "Error saving data to localStorage: " + error.message, type: 'error' });
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
          showNotification({ message: "Error saving footnote info: " + error.message, type: 'error' });
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

    const handleAttendanceTotalChange = (studentId, value) => {
      // Allow only numbers
      if (value && !/^\d*$/.test(value)) return;

      setAttendanceTotal(prev => ({
        ...prev,
        [studentId]: value
      }));
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

      // Convert tests to 50% (60 marks â†’ 50%)
      const classScore50 = (testsTotal / 60) * 50;

      // Get exam score (out of 100)
      const examScore = parseFloat(updatedMarks.exam || 0);

      // Convert exam to 50% (100 marks â†’ 50%)
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
        showNotification({ message: "Error loading daily attendance: " + error.message, type: 'error' });
      }
    };

    // Save daily attendance
    const saveDailyAttendance = () => {
      if (!selectedClass || !dailyAttendanceDate) {
        showNotification({ message: "Please select a class and date first.", type: 'error' });
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

        showNotification({ message: "Daily attendance saved successfully!", type: 'success' });
      } catch (error) {
        console.error("Error saving daily attendance:", error);
        showNotification({ message: "Error saving daily attendance: " + error.message, type: 'error' });
      } finally {
        setSaving(false);
      }
    };

    // Generate attendance report
    const generateAttendanceReport = () => {
      if (!selectedClass || !reportStartDate || !reportEndDate) {
        showNotification({ message: "Please select a class and date range first.", type: 'error' });
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
        showNotification({ message: `Attendance report generated for ${reportData.length} students.`, type: 'success' });
      } catch (error) {
        console.error("Error generating attendance report:", error);
        showNotification({ message: "Error generating attendance report: " + error.message, type: 'error' });
      } finally {
        setLoading('report', false);
      }
    };

    // Print attendance report
    const printAttendanceReport = () => {
      if (attendanceReportData.length === 0) {
        showNotification({ message: "No report data to print.", type: 'error' });
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
        showNotification({ message: "Error printing attendance report: " + error.message, type: 'error' });
      }
    };


    // Print broadsheet for a specific class and subject
    const printBroadsheet = async (subject) => {
      if (!selectedClass || !subject) {
        showNotification({ message: "Please select a class and subject first.", type: 'error' });
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
          selectedTerm // Use selected term
        );

        if (result.success) {
          showNotification({ message: result.message, type: 'success' });
        } else {
          throw new Error(result.message);
        }
      } catch (error) {
        console.error("Error printing broadsheet:", error);
        showNotification({ message: "Error printing broadsheet: " + error.message, type: 'error' });
      }
    };

    // Print complete class broadsheet with all subjects
    const _printCompleteClassBroadsheet = async () => {
      if (!selectedClass) {
        showNotification({ message: "Please select a class first.", type: 'error' });
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
          showNotification({ message: result.message, type: 'success' });
        } else {
          throw new Error(result.message);
        }
      } catch (error) {
        console.error("Error printing complete class broadsheet:", error);
        showNotification({ message: "Error printing complete class broadsheet: " + error.message, type: 'error' });
      }
    };

    // Print class report with attendance and remarks
    // Print Student Terminal Reports
    const printStudentReports = async () => {
      if (!selectedClass) {
        showNotification({ message: "Please select a class first.", type: 'error' });
        return;
      }

      // Verify this is the form class
      if (selectedClass !== user?.formClass) {
        showNotification({ message: "You can only print reports for your assigned form class.", type: 'error' });
        return;
      }

      try {
        const schoolInfo = printingService.getSchoolInfo();
        const classStudents = filteredLearners;

        if (classStudents.length === 0) {
          showNotification({ message: "No students found in this class", type: 'error' });
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
              showNotification({ message: result.message, type: 'success' });
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
            selectedTerm,
            schoolInfo
          );

          if (result.success) {
            showNotification({ message: result.message, type: 'success' });
          } else {
            throw new Error(result.message);
          }
        }
      } catch (error) {
        console.error("Error printing student reports:", error);
        showNotification({ message: "Error printing student reports: " + error.message, type: 'error' });
      }
    };

    // Print Complete Class Broadsheet
    const printClassBroadsheet = async () => {
      if (!selectedClass) {
        showNotification({ message: "Please select a class first.", type: 'error' });
        return;
      }

      // Verify this is the form class
      if (selectedClass !== user?.formClass) {
        showNotification({ message: "You can only print broadsheets for your assigned form class.", type: 'error' });
        return;
      }

      try {
        const schoolInfo = printingService.getSchoolInfo();
        const result = await printingService.printCompleteClassBroadsheet(
          selectedClass,
          schoolInfo
        );

        if (result.success) {
          showNotification({ message: result.message, type: 'success' });
        } else {
          throw new Error(result.message);
        }
      } catch (error) {
        console.error("Error printing class broadsheet:", error);
        showNotification({ message: "Error printing class broadsheet: " + error.message, type: 'error' });
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

          let subjects = [];
          if (subjectsResponse.status === 'success' && Array.isArray(subjectsResponse.data)) {
            subjects = subjectsResponse.data;
          }

          // Fallback if empty or failed
          if (subjects.length === 0) {
            console.warn('Falling back to user subjects');
            subjects = user?.subjects || [];
          }

          setPrintClassSubjects(subjects);

          setSelectedPrintStudents([]);
          setSelectedPrintSubject("");
        } catch (error) {
          console.error("Error loading print class data:", error);
          showNotification({ message: `Error loading class data: ${error.message}`, type: 'error' });
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
        showNotification({ message: "Please select a class first", type: 'warning' });
        return;
      }

      setPrinting(true);
      try {
        const schoolInfo = printingService.getSchoolInfo();
        const result = await printingService.printBulkStudentReportsServerSide(
          printClassStudents,
          selectedTerm,
          schoolInfo,
          (progress) => console.log(`PDF Progress: ${progress}%`)
        );

        if (result.success) {
          showNotification({ message: result.message, type: 'success' });
        } else {
          throw new Error(result.message);
        }
      } catch (error) {
        console.error("Error printing class reports:", error);
        showNotification({ message: `Error printing reports: ${error.message}`, type: 'error' });
      } finally {
        setPrinting(false);
      }
    };

    // Print selected students
    const printSelectedReports = async () => {
      if (selectedPrintStudents.length === 0) {
        showNotification({ message: "Please select at least one student", type: 'warning' });
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
          showNotification({ message: result.message, type: 'success' });
        } else {
          throw new Error(result.message);
        }
      } catch (error) {
        console.error("Error printing selected reports:", error);
        showNotification({ message: `Error printing reports: ${error.message}`, type: 'error' });
      } finally {
        setPrinting(false);
      }
    };

    // Print complete broadsheet for print class
    const printCompleteBroadsheet = async () => {
      if (!printClass) {
        showNotification({ message: "Please select a class first", type: 'warning' });
        return;
      }

      setPrinting(true);
      try {
        const schoolInfo = printingService.getSchoolInfo();
        const result = await printingService.printCompleteClassBroadsheet(
          printClass,
          schoolInfo,
          selectedTerm
        );

        if (result.success) {
          showNotification({ message: result.message, type: 'success' });
        } else {
          throw new Error(result.message);
        }
      } catch (error) {
        console.error("Error printing broadsheet:", error);
        showNotification({ message: `Error printing broadsheet: ${error.message}`, type: 'error' });
      } finally {
        setPrinting(false);
      }
    };

    // Print subject broadsheet from print section
    const printSubjectBroadsheetFromPrintSection = async (subject) => {
      if (!printClass) {
        showNotification({ message: "Please select a class first", type: 'warning' });
        return;
      }

      if (!subject) {
        showNotification({ message: "Please select a subject", type: 'warning' });
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
          selectedTerm // Use selected term
        );

        if (result.success) {
          showNotification({ message: `${subject} broadsheet for ${printClass} generated successfully`, type: 'success' });
        } else {
          throw new Error(result.message);
        }
      } catch (error) {
        console.error("Error printing subject broadsheet:", error);
        showNotification({ message: `Error printing ${subject} broadsheet: ${error.message}`, type: 'error' });
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

      if (!selectedClass) {
        showNotification({ message: "Please select a class first.", type: 'error' });
        return;
      }

      if (userSubjects.length === 0) {
        showNotification({ message: "You are not assigned to any subjects. Please contact the administrator to assign you to subjects.", type: 'error' });
        return;
      }

      if (Object.keys(remarks).length === 0 && Object.keys(attendance).length === 0) {
        showNotification({ message: "No data to save. Please enter attendance or remarks for at least one student.", type: 'error' });
        return;
      }

      setSaving(true);

      try {
        const updatePromises = [];

        // Update form master remarks
        Object.keys(remarks).forEach(studentId => {
          const studentRemarks = remarks[studentId];
          if (studentRemarks) {
            updatePromises.push(updateFormMasterRemarks({
              studentId,
              className: selectedClass,
              term: selectedTerm,
              academicYear: settings.academicYear || '',
              remarks: studentRemarks,
              attitude: attitude[studentId] || '',
              interest: interest[studentId] || '',
              comments: comments[studentId] || '',
              attendance: attendance[studentId] || '',
              attendanceTotal: attendanceTotal[studentId] || '',
              vacationDate: vacationDate || '',
              reopeningDate: reopeningDate || ''
            }));
          }
        });

        // Update student scores
        userSubjects.forEach(subject => {
          if (!marksData[subject]) return;

          const subjectMarksData = marksData[subject];
          Object.keys(subjectMarksData).forEach(studentId => {
            const studentMarks = subjectMarksData[studentId];
            if (studentMarks && (studentMarks.test1 || studentMarks.test2 || studentMarks.test3 || studentMarks.test4 || studentMarks.exam)) {
              updatePromises.push(updateStudentScores({
                studentId,
                className: selectedClass,
                subject,
                term: selectedTerm,
                test1: studentMarks.test1 || '',
                test2: studentMarks.test2 || '',
                test3: studentMarks.test3 || '',
                test4: studentMarks.test4 || '',
                ca1: studentMarks.ca1 || '',
                ca2: studentMarks.ca2 || '',
                testsTotal: studentMarks.testsTotal || '',
                classScore50: studentMarks.classScore50 || '',
                exam: studentMarks.exam || '',
                examScore50: studentMarks.examScore50 || '',
                total: studentMarks.total || '',
                grade: studentMarks.grade || ''
              }));
            }
          });
        });

        if (updatePromises.length > 0) {
          Promise.all(updatePromises).then(results => {
            results.forEach(response => {
              if (response.status !== 'success') {
                console.error('Update error:', response.message);
                showNotification({ message: 'Error saving data: ' + response.message, type: 'error' });
              }
            });

            showNotification({ message: 'Data saved successfully!', type: 'success' });
          }).catch(error => {
            console.error('Update error:', error);
            showNotification({ message: 'Error saving data: ' + error.message, type: 'error' });
          }).finally(() => {
            setSaving(false);
          });
        } else {
          showNotification({ message: 'No data to save.', type: 'error' });
          setSaving(false);
        }
      } catch (error) {
        console.error('Update error:', error);
        showNotification({ message: 'Error saving data: ' + error.message, type: 'error' });
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
        showNotification({ message: "Please select a class first.", type: 'error' });
        return;
      }

      // Validate form before saving
      if (!validateFormData()) {
        showNotification({ message: "Please fix the validation errors before saving.", type: 'error' });
        return;
      }

      setShowConfirmDialog(true);
    };


    // Save all marks data
    const saveAllMarksData = async () => {
      if (!selectedClass) {
        showNotification({ message: "Please select a class first.", type: 'error' });
        return;
      }

      // Validate marks before saving
      if (!validateMarksData()) {
        showNotification({ message: "Please fix the validation errors before saving.", type: 'error' });
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
                    term: selectedTerm,
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
          showNotification({ message: `All marks saved successfully! (${successCount} records)`, type: 'success' });
        } else {
          showNotification({ message: `Saved ${successCount} marks successfully. ${errorCount} failed.`, type: 'warning' });
        }

      } catch (error) {
        console.error("Save all marks error:", error);
        showNotification({ message: "Error saving marks: " + error.message, type: 'error' });
      } finally {
        setSaving(false);
      }
    };

    // Save footnote information
    const saveFootnoteInfo = () => {
      if (!selectedClass) {
        showNotification({ message: "Please select a class first.", type: 'error' });
        return;
      }

      try {
        localStorage.setItem(`footnoteInfo_${selectedClass}`, footnoteInfo);
        showNotification({ message: "Footnote information saved successfully!", type: 'success' });
      } catch (error) {
        console.error("Save footnote info error:", error);
        showNotification({ message: "Error saving footnote info: " + error.message, type: 'error' });
      }
    };

    // ========== ENTER SCORES VIEW FUNCTIONS ==========

    // Initialize and load marks when class/subject/assessment changes (for Enter Scores view)
    useEffect(() => {
      if (mainView === 'enterScores' && selectedClass && selectedSubject && selectedAssessment && filteredLearners.length > 0) {
        loadSubjectMarks();
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mainView, selectedClass, selectedSubject, selectedAssessment, filteredLearners.length, selectedTerm]);

    // Load saved marks from database for Enter Scores view
    const loadSubjectMarks = async () => {
      console.log('📍 loadSubjectMarks called:', { selectedClass, selectedSubject, selectedAssessment, selectedTerm, learners: filteredLearners.length });
      if (!selectedClass || !selectedSubject || !selectedAssessment) {
        console.log('❌ Early return - missing selection');
        showNotification({ message: "Please select class, subject, and assessment first", type: 'warning' });
        return;
      }

      console.log('✅ Starting marks load...');
      setLoading('marks', true, 'Loading saved marks...');
      try {
        const isCustomAssessment = selectedAssessment !== 'regular';
        const newMarks = {};
        const savedSet = new Set();

        let response;
        if (isCustomAssessment) {
          // Fetch custom assessment scores
          response = await getCustomAssessmentScores(selectedClass, selectedAssessment);
        } else {
          // Fetch regular term marks
          response = await getMarks(selectedClass, selectedSubject, selectedTerm);
        }

        console.log('📦 Marks API response:', response);

        if (!response) {
          throw new Error('No response from API');
        }

        // Handle both response formats: { status, data } or direct array
        const isSuccess = response.status === 'success' || Array.isArray(response) || response.data;

        if (isSuccess) {
          const existingMarksData = Array.isArray(response) ? response : (Array.isArray(response.data) ? response.data : []);

          // Initialize marks for all students and populate with existing data
          filteredLearners.forEach(learner => {
            const studentId = learner.idNumber || learner.LearnerID;

            // Find existing marks for this student
            const existingMark = existingMarksData.find(
              mark => mark.student_id === studentId || mark.id_number === studentId
            );

            if (existingMark) {
              if (isCustomAssessment) {
                // Custom assessment - single score field
                newMarks[studentId] = {
                  score: existingMark.score || ""
                };
                if (existingMark.score) {
                  savedSet.add(studentId);
                }
              } else {
                // Regular term scores
                newMarks[studentId] = {
                  test1: existingMark.test1 || "",
                  test2: existingMark.test2 || "",
                  test3: existingMark.test3 || "",
                  test4: existingMark.test4 || "",
                  exam: existingMark.exam || ""
                };

                // Mark as already saved if any marks exist
                const hasMarks = existingMark.test1 || existingMark.test2 ||
                  existingMark.test3 || existingMark.test4 || existingMark.exam;
                if (hasMarks) {
                  savedSet.add(studentId);
                }
              }
            } else {
              // Initialize with empty marks
              if (isCustomAssessment) {
                newMarks[studentId] = { score: "" };
              } else {
                newMarks[studentId] = {
                  test1: "", test2: "", test3: "", test4: "", exam: ""
                };
              }
            }
          });

          setSubjectMarks(newMarks);
          setSavedStudents(savedSet);
          showNotification({ message: "Marks loaded successfully!", type: 'success' });
        } else {
          throw new Error(response.message || "Failed to load marks");
        }
      } catch (error) {
        console.error("Error loading subject marks:", error);
        showNotification({ message: "Error loading saved marks: " + error.message, type: 'error' });

        // Still initialize with empty marks even if loading fails
        const isCustomAssessment = selectedAssessment !== 'regular';
        const newMarks = {};

        filteredLearners.forEach(learner => {
          const studentId = learner.idNumber || learner.LearnerID;
          if (isCustomAssessment) {
            newMarks[studentId] = { score: "" };
          } else {
            newMarks[studentId] = {
              test1: "", test2: "", test3: "", test4: "", exam: ""
            };
          }
        });

        setSubjectMarks(newMarks);
        setSavedStudents(new Set());
      } finally {
        setLoading('marks', false);
      }
    };
    // ==================== FUNCTION 1: LOAD MARKS FROM DATABASE ====================

    // Load saved marks from database with caching (explicit load button)
    const loadMarksFromDatabase = async () => {
      if (!selectedClass || !selectedSubject || !selectedAssessment) {
        showNotification({ message: "Please select class, subject, and assessment first", type: 'warning' });
        return;
      }

      setLoading('marks', true, 'Loading saved marks from database...');
      try {
        // Check localStorage cache first for instant loading
        const cacheKey = `formMaster_marks_${selectedClass}_${selectedSubject}_${selectedAssessment}_${selectedTerm}`;
        const cachedData = localStorage.getItem(cacheKey);

        if (cachedData) {
          try {
            const parsed = JSON.parse(cachedData);
            const cacheAge = Date.now() - parsed.timestamp;
            const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes

            // If cache is fresh and matches current term, use it immediately
            if (cacheAge < CACHE_DURATION && parsed.term === selectedTerm) {
              setSubjectMarks(parsed.marks);
              setSavedStudents(new Set(Object.keys(parsed.marks).filter(id => {
                const marks = parsed.marks[id];
                return Object.values(marks).some(v => v && v !== "");
              })));
              showNotification({ message: "Loaded from cache (refreshing from database...)", type: 'info', duration: 2000 });
            }
          } catch (e) {
            console.warn("Cache parse error:", e);
          }
        }

        // Then fetch from database
        const isCustomAssessment = selectedAssessment !== 'regular';
        let response;

        if (isCustomAssessment) {
          response = await getCustomAssessmentScores(parseInt(selectedAssessment), selectedClass, selectedSubject);
        } else {
          response = await getMarks(selectedClass, selectedSubject, selectedTerm);
        }

        if (response.status === 'success') {
          const data = response.data || [];
          const newMarks = {};
          const savedSet = new Set();

          // Initialize empty marks for all students
          filteredLearners.forEach(learner => {
            const studentId = learner.idNumber || learner.LearnerID;
            if (isCustomAssessment) {
              newMarks[studentId] = { score: "" };
            } else {
              newMarks[studentId] = {
                test1: "", test2: "", test3: "", test4: "", exam: ""
              };
            }
          });

          // Populate with database marks
          data.forEach(mark => {
            const studentId = mark.studentId || mark.student_id || mark.id_number;
            if (newMarks[studentId]) {
              if (isCustomAssessment) {
                newMarks[studentId] = { score: mark.score ?? "" };
                if (mark.score) savedSet.add(studentId);
              } else {
                newMarks[studentId] = {
                  test1: mark.test1 ?? "",
                  test2: mark.test2 ?? "",
                  test3: mark.test3 ?? "",
                  test4: mark.test4 ?? "",
                  exam: mark.exam ?? ""
                };
                const hasMarks = mark.test1 || mark.test2 || mark.test3 || mark.test4 || mark.exam;
                if (hasMarks) savedSet.add(studentId);
              }
            }
          });

          setSubjectMarks(newMarks);
          setSavedStudents(savedSet);

          // Cache the marks
          localStorage.setItem(cacheKey, JSON.stringify({
            marks: newMarks,
            timestamp: Date.now(),
            term: selectedTerm
          }));

          showNotification({ message: 'Marks loaded successfully from database!', type: 'success' });
        } else {
          throw new Error(response.message || 'Failed to load marks');
        }
      } catch (error) {
        console.error("Error loading marks from database:", error);
        showNotification({ message: `Error loading marks: ${error.message}`, type: 'error' });
      } finally {
        setLoading('marks', false);

      }


    };
    // Auto-load marks when class, subject, and assessment are selected
    useEffect(() => {
      if (selectedClass && selectedSubject && selectedAssessment && filteredLearners.length > 0) {
        console.log('🔄 Auto-loading marks for:', selectedClass, selectedSubject, selectedAssessment, selectedTerm);
        loadSubjectMarks();
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedClass, selectedSubject, selectedAssessment, selectedTerm, filteredLearners.length]);

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

    // ==================== FUNCTION 2: CLEAR MARKS ====================

    // Clear all marks for the selected class, subject, and term
    const clearMarks = async () => {
      if (!selectedClass || !selectedSubject || !selectedTerm) {
        showNotification({ message: "Please select class, subject, and term first", type: 'error' });
        return;
      }

      // Confirm deletion
      const confirmed = window.confirm(
        `⚠️ WARNING: This will permanently delete ALL marks for:\n\n` +
        `Class: ${selectedClass}\n` +
        `Subject: ${selectedSubject}\n` +
        `Term: ${selectedTerm}\n\n` +
        `This action CANNOT be undone!\n\n` +
        `Are you absolutely sure?`
      );

      if (!confirmed) return;

      setSavingScores(true);
      try {
        const response = await deleteMarks(selectedClass, selectedSubject, selectedTerm);

        if (response.status === 'success') {
          // Clear marks state
          const emptyMarks = {};
          const isCustomAssessment = selectedAssessment !== 'regular';

          filteredLearners.forEach(learner => {
            const studentId = learner.idNumber || learner.LearnerID;
            if (isCustomAssessment) {
              emptyMarks[studentId] = { score: "" };
            } else {
              emptyMarks[studentId] = {
                test1: "", test2: "", test3: "", test4: "", exam: ""
              };
            }
          });

          setSubjectMarks(emptyMarks);
          setSavedStudents(new Set());

          // Clear cache
          const cacheKey = `formMaster_marks_${selectedClass}_${selectedSubject}_${selectedAssessment}_${selectedTerm}`;
          localStorage.removeItem(cacheKey);

          showNotification({ message: `Marks cleared successfully for ${selectedSubject}!`, type: 'success' });
        } else {
          showNotification({ message: `Error clearing marks: ${response.message}`, type: 'error' });
        }
      } catch (error) {
        console.error("Clear marks error:", error);
        showNotification({ message: `Error clearing marks: ${error.message}`, type: 'error' });
      } finally {
        setSavingScores(false);
      }
    };

    // ==================== FUNCTION 3: LOAD ALL CLASS MARKS ====================

    /**
     * Load marks for ALL subjects in the class
     */
    const loadAllClassMarks = async () => {
      const formClass = selectedClass;
      if (!formClass) {
        console.log('⏭️ No form class, skipping marks load');
        return;
      }

      console.log('📚 Loading all class marks for:', formClass, selectedTerm);
      setLoading('marks', true, 'Loading class marks...');

      try {
        // Get all subjects for the class
        const subjectsResponse = await getClassSubjects(formClass);
        let subjects = subjectsResponse.data || [];

        // Ensure subjects is an array
        if (!Array.isArray(subjects)) {
          console.warn('Subjects data is not an array:', subjects);
          if (subjectsResponse.subjects && Array.isArray(subjectsResponse.subjects)) {
            subjects = subjectsResponse.subjects;
          } else {
            subjects = [];
          }
        }

        const marksDataBySubject = {};

        // Load marks for each subject
        for (const subject of subjects) {
          try {
            const marksResponse = await getMarks(formClass, subject, selectedTerm);
            const marks = marksResponse.data || [];
            const subjectMarks = {};

            if (Array.isArray(marks)) {
              marks.forEach(mark => {
                const studentId = mark.student_id || mark.id_number || mark.studentId;
                if (studentId) {
                  subjectMarks[studentId] = {
                    test1: mark.test1 ?? '',
                    test2: mark.test2 ?? '',
                    test3: mark.test3 ?? '',
                    test4: mark.test4 ?? '',
                    exam: mark.exam ?? '',
                    total: mark.total ?? '',
                    grade: mark.grade ?? '',
                    remark: mark.remark ?? ''
                  };
                }
              });
            } else {
              console.warn(`Marks data for ${subject} is not an array:`, marks);
            }

            marksDataBySubject[subject] = subjectMarks;
            console.log(`✅ Loaded ${Array.isArray(marks) ? marks.length : 0} marks for ${subject}`);
          } catch (error) {
            console.error(`Error loading marks for ${subject}:`, error);
          }
        }

        setClassMarksData(marksDataBySubject);
        showNotification({
          message: `Loaded marks for ${Object.keys(marksDataBySubject).length} subjects`,
          type: 'success'
        });

      } catch (error) {
        console.error('Error loading all class marks:', error);
        showNotification({
          message: 'Error loading class marks: ' + error.message,
          type: 'error'
        });
      } finally {
        setLoading('marks', false);
      }
    };

    // ==================== FUNCTION: LOAD CLASS REMARKS AND DATES ====================

    /**
     * Load remarks for the class and populate vacation/reopening dates
     */
    const loadClassRemarksAndDates = async () => {
      const formClass = selectedClass;
      if (!formClass) {
        console.log('⏭️ No form class, skipping remarks load');
        return;
      }

      console.log('📅 Loading class remarks and dates for:', formClass, selectedTerm);

      try {
        const remarksResponse = await getClassRemarks(formClass, selectedTerm, settings.academicYear);

        if (remarksResponse.status === 'success' && remarksResponse.data && remarksResponse.data.length > 0) {
          // Get the first remark record to extract vacation and reopening dates
          // (these should be the same for all students in the class)
          const firstRemark = remarksResponse.data[0];

          if (firstRemark.vacationDate) {
            console.log('📅 Setting vacation date:', firstRemark.vacationDate);
            setVacationDate(firstRemark.vacationDate);
          }

          if (firstRemark.reopeningDate) {
            console.log('📅 Setting reopening date:', firstRemark.reopeningDate);
            setReopeningDate(firstRemark.reopeningDate);
          }

          // Also populate student remarks, attendance, etc.
          const remarksMap = {};
          const attitudeMap = {};
          const interestMap = {};
          const commentsMap = {};
          const attendanceMap = {};
          const attendanceTotalMap = {};

          remarksResponse.data.forEach(remark => {
            const studentId = remark.studentIdNumber || remark.id_number;
            if (studentId) {
              remarksMap[studentId] = remark.remarks || '';
              attitudeMap[studentId] = remark.attitude || '';
              interestMap[studentId] = remark.interest || '';
              commentsMap[studentId] = remark.comments || '';
              attendanceMap[studentId] = remark.attendance || '';
              attendanceTotalMap[studentId] = remark.attendance_total || remark.attendanceTotal || '';
            }
          });

          setRemarks(remarksMap);
          setAttitude(attitudeMap);
          setInterest(interestMap);
          setComments(commentsMap);
          setAttendance(attendanceMap);
          setAttendanceTotal(attendanceTotalMap);

          console.log('✅ Loaded remarks for', remarksResponse.data.length, 'students');
        } else {
          console.log('ℹ️ No existing remarks found for class');
          // Clear the dates if no remarks exist
          setVacationDate('');
          setReopeningDate('');
        }

      } catch (error) {
        console.error('Error loading class remarks:', error);
        // Don't show an error notification as this is not critical
      }
    };

// ==================== FUNCTION 4: PRINT SUBJECT BROADSHEET ====================

/**
 * Print broadsheet for a single subject
 */
const printSubjectBroadsheet = async (subject) => {
  const formClass = selectedClass;
  if (!formClass || !subject) {
    showNotification({
      message: 'Missing class or subject information',
      type: 'error'
    });
    return;
  }

  setPrinting(true);
  try {
    console.log(`🖨️ Printing broadsheet for ${formClass} - ${subject}`);

    const schoolInfo = printingService.getSchoolInfo();
    const result = await printingService.printSubjectBroadsheet(
      formClass,
      subject,
      schoolInfo,
      '', // teacherName
      selectedTerm
    );

    if (result.success) {
      showNotification({
        message: `${subject} broadsheet for ${formClass} generated successfully`,
        type: 'success'
      });
    } else {
      throw new Error(result.message);
    }

  } catch (error) {
    console.error('Error printing subject broadsheet:', error);
    showNotification({
      message: 'Error printing broadsheet: ' + error.message,
      type: 'error'
    });
  } finally {
    setPrinting(false);
  }
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
    showNotification({ message: "Please select both class and subject", type: 'error' });
    return;
  }

  if (!selectedAssessment) {
    showNotification({ message: "Please select an assessment type", type: 'error' });
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
        showNotification({ message: "Score saved successfully!", type: 'success' });
      } else {
        showNotification({ message: "Error saving score: " + response.message, type: 'error' });
      }
    } else {
      // Save regular term scores
      const { testsTotal, classScore50, examScore50, total, grade } = calculateStudentTotals(studentMarks);

      await updateStudentScores({
        studentId,
        className: selectedClass,
        subject: selectedSubject,
        term: selectedTerm,
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
      showNotification({ message: "Scores saved successfully!", type: 'success' });
    }
  } catch (error) {
    console.error("Error saving scores:", error);
    showNotification({ message: "Error saving scores: " + error.message, type: 'error' });
  } finally {
    setSavingScores(false);
  }
};

// Save all scores for the subject (Enter Scores view)
const saveAllSubjectScores = async () => {
  if (!selectedClass || !selectedSubject) {
    showNotification({ message: "Please select both class and subject", type: 'error' });
    return;
  }

  if (!selectedAssessment) {
    showNotification({ message: "Please select an assessment type", type: 'error' });
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
            term: selectedTerm,
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
    showNotification({ message: "All scores saved successfully!", type: 'success' });
    setSavedStudents(new Set(filteredLearners.map(l => l.idNumber || l.LearnerID)));
  } catch (error) {
    console.error("Error saving all scores:", error);
    showNotification({ message: "Error saving scores: " + error.message, type: 'error' });
  } finally {
    setSavingScores(false);
  }
};

// Actions object for ManageClassView and EnterScoresView
const actions = {
  loadAllClassMarks,
  printSubjectBroadsheet,
  // Tab navigation
  setActiveTab,

  // Attendance & Remarks handlers
  handleAttendanceChange,
  handleAttendanceTotalChange,
  handleRemarkChange,
  handleAttitudeChange,
  handleInterestChange,
  handleCommentsChange,
  handleFootnoteChange,
  setVacationDate,
  setReopeningDate,
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
  saveAllScores: saveAllSubjectScores,
  loadMarks: loadSubjectMarks,
  loadMarksFromDatabase,
  clearMarks,
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
  attendanceTotal,
  remarks,
  attitude,
  interest,
  comments,
  footnoteInfo,
  vacationDate,
  reopeningDate,
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
  customAssessments,
  selectedTerm
};

return (
  <Layout>
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 text-white">Form Master Dashboard</h1>

      {/* Term Selector - Glass Morphism */}
      <div className="mb-6 bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-6">
        <h2 className="text-sm font-semibold text-white/80 mb-3">Select Term</h2>
        <div className="flex gap-3 flex-wrap">
          {AVAILABLE_TERMS.map((term) => (
            <button
              key={term}
              onClick={() => setSelectedTerm(term)}
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${selectedTerm === term
                ? 'bg-blue-500/80 backdrop-blur-lg text-white shadow-xl border border-blue-300/50 scale-105'
                : 'bg-white/10 backdrop-blur-md text-white hover:bg-white/20 border border-white/20 hover:scale-102'
                }`}
            >
              {term}
            </button>
          ))}
        </div>
      </div>

      {/* Main View Switcher - Glass Morphism */}
      <div className="mb-6 bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-6">
        <div className="flex gap-4 flex-wrap">
          <button
            onClick={() => setMainView('manageClass')}
            className={`flex-1 min-w-[200px] py-4 px-6 rounded-xl font-semibold transition-all duration-300 ${mainView === 'manageClass'
              ? 'bg-blue-500/80 backdrop-blur-lg text-white shadow-xl border border-blue-300/50 scale-105'
              : 'bg-white/10 backdrop-blur-md text-white hover:bg-white/20 border border-white/20 hover:scale-102'
              }`}
          >

            Manage Class
          </button>
          <button
            onClick={() => setMainView('enterScores')}
            className={`flex-1 min-w-[200px] py-4 px-6 rounded-xl font-semibold transition-all duration-300 ${mainView === 'enterScores'
              ? 'bg-green-500/80 backdrop-blur-lg text-white shadow-xl border border-green-300/50 scale-105'
              : 'bg-white/10 backdrop-blur-md text-white hover:bg-white/20 border border-white/20 hover:scale-102'
              }`}
          >

            Enter Scores
          </button>
          <button
            onClick={() => setMainView('printSection')}
            className={`flex-1 min-w-[200px] py-4 px-6 rounded-xl font-semibold transition-all duration-300 ${mainView === 'printSection'
              ? 'bg-purple-500/80 backdrop-blur-lg text-white shadow-xl border border-purple-300/50 scale-105'
              : 'bg-white/10 backdrop-blur-md text-white hover:bg-white/20 border border-white/20 hover:scale-102'
              }`}
          >

            Print Section
          </button>
          <button
            onClick={() => setIsPromoteModalOpen(true)}
            className="flex-1 min-w-[200px] py-4 px-6 rounded-xl font-semibold transition-all duration-300 bg-gradient-to-r from-green-500/80 to-blue-500/80 backdrop-blur-lg text-white hover:from-green-600/90 hover:to-blue-600/90 shadow-xl border border-white/30 hover:scale-105"
          >

            Promote Students
          </button>
        </div>
      </div>

      {/* Manage Class View */}
      {mainView === 'manageClass' && selectedClass && (
        <ManageClassView
          state={{ ...state, marksData: classMarksData }}
          actions={actions}
          formClass={selectedClass}
          students={filteredLearners}
          userSubjects={getUserSubjects()}
          allSubjects={availableSubjects}
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
          userSubjects={availableSubjects}
          userClasses={getUserClasses()}
          students={filteredLearners}
          loadingStates={loadingStates}
          errors={errors}
          saving={savingScores}
          isReadOnly={selectedClass === user?.formClass && !user?.subjects?.includes(selectedSubject)}
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
                {getFormClass().map(cls => (
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
                    className={`bg-blue-600/80 backdrop-blur-md hover:bg-blue-700/90 disabled:bg-gray-400/50 text-white px-6 py-4 rounded-xl font-semibold transition-all duration-300 border border-white/30 shadow-lg hover:scale-105 ${printing ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                  >
                    {printing ? "Printing..." : `ðŸ“„ Print All Reports (${printClassStudents.length})`}
                  </button>

                  <button
                    onClick={printCompleteBroadsheet}
                    disabled={printing}
                    className={`bg-green-600/80 backdrop-blur-md hover:bg-green-700/90 disabled:bg-gray-400/50 text-white px-6 py-4 rounded-xl font-semibold transition-all duration-300 border border-white/30 shadow-lg hover:scale-105 ${printing ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                  >
                    ðŸ“Š Print Complete Broadsheet
                  </button>

                  <button
                    onClick={() => setShowSubjectDropdown(!showSubjectDropdown)}
                    disabled={printing}
                    className={`bg-purple-600/80 backdrop-blur-md hover:bg-purple-700/90 disabled:bg-gray-400/50 text-white px-6 py-4 rounded-xl font-semibold transition-all duration-300 border border-white/30 shadow-lg hover:scale-105 ${printing ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                  >
                    ðŸ“‹ Print Subject Broadsheet
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
                    className={`bg-green-600/80 backdrop-blur-md hover:bg-green-700/90 disabled:bg-gray-400/50 w-full text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 border border-white/30 shadow-lg ${printing || selectedPrintStudents.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
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
