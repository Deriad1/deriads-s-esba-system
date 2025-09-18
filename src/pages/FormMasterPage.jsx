import Layout from "../components/Layout";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { getLearners, updateFormMasterRemarks, getMarks, updateStudentScores } from "../api";
import { useNotification } from '../context/NotificationContext';
import { useLoading } from '../context/LoadingContext';
import LoadingSpinner from '../components/LoadingSpinner';

const FormMasterPage = () => {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const { setLoading, isLoading } = useLoading();

  const [learners, setLearners] = useState([]);
  const [saving, setSaving] = useState(false);
  const [selectedClass, setSelectedClass] = useState("");
  const [remarks, setRemarks] = useState({});
  const [attendance, setAttendance] = useState({});
  const [errors, setErrors] = useState({}); // New state for validation errors
  const [showConfirmDialog, setShowConfirmDialog] = useState(false); // New state for confirmation dialog
  const [marksData, setMarksData] = useState({}); // New state for marks data
  const [activeTab, setActiveTab] = useState("attendance"); // New state for active tab
  const [footnoteInfo, setFootnoteInfo] = useState(""); // New state for footnote information
  
  // New states for daily attendance
  const [dailyAttendance, setDailyAttendance] = useState({});
  const [dailyAttendanceDate, setDailyAttendanceDate] = useState("");
  
  // New states for attendance report
  const [reportStartDate, setReportStartDate] = useState("");
  const [reportEndDate, setReportEndDate] = useState("");
  const [attendanceReportData, setAttendanceReportData] = useState([]);

  // Get user's assigned classes
  const getUserClasses = () => {
    if (Array.isArray(user?.classes)) {
      return user.classes.filter(cls => cls !== 'ALL');
    }
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
  }, []);

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

  // Filter learners for selected class
  const filteredLearners = learners.filter(l => l.className === selectedClass);

  // Load saved remarks and attendance when class changes
  useEffect(() => {
    if (selectedClass && filteredLearners.length > 0) {
      loadSavedDataForClass(selectedClass);
      loadMarksDataForClass(selectedClass);
      loadFootnoteInfo(selectedClass);
    }
  }, [selectedClass, filteredLearners.length]);

  // Load saved data for a specific class
  const loadSavedDataForClass = (className) => {
    try {
      // Get saved remarks and attendance from localStorage
      const savedRemarks = JSON.parse(localStorage.getItem(`formMasterRemarks_${className}`) || '{}');
      const savedAttendance = JSON.parse(localStorage.getItem(`formMasterAttendance_${className}`) || '{}');
      
      // Initialize with saved data or empty values
      const newRemarks = {};
      const newAttendance = {};
      const newErrors = {};
      
      filteredLearners.forEach(learner => {
        const key = learner.idNumber || learner.LearnerID;
        newRemarks[key] = savedRemarks[key] || "";
        newAttendance[key] = savedAttendance[key] || "";
        newErrors[key] = "";
      });
      
      setRemarks(newRemarks);
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
            const studentId = mark.studentId;
            newMarksData[subject][studentId] = {
              ca1: mark.ca1 || '',
              ca2: mark.ca2 || '',
              exam: mark.exam || '',
              total: mark.total || ''
            };
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

  // Load daily attendance when date changes
  useEffect(() => {
    if (dailyAttendanceDate && selectedClass) {
      loadDailyAttendance();
    }
  }, [dailyAttendanceDate, selectedClass]);

  // Save data to localStorage whenever remarks or attendance change
  useEffect(() => {
    if (selectedClass) {
      try {
        localStorage.setItem(`formMasterRemarks_${selectedClass}`, JSON.stringify(remarks));
        localStorage.setItem(`formMasterAttendance_${selectedClass}`, JSON.stringify(attendance));
      } catch (error) {
        console.error("Error saving data to localStorage:", error);
        showNotification({message: "Error saving data to localStorage: " + error.message, type: 'error'});
      }
    }
  }, [remarks, attendance, selectedClass]);

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
    
    setMarksData(prev => ({
      ...prev,
      [subject]: {
        ...prev[subject],
        [studentId]: {
          ...prev[subject][studentId],
          [field]: value
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
            // Validate CA1 (0-20)
            if (studentMarks.ca1 && (isNaN(studentMarks.ca1) || studentMarks.ca1 < 0 || studentMarks.ca1 > 20)) {
              newErrors[`${subject}-${studentId}-ca1`] = "CA1 must be between 0 and 20";
              isValid = false;
            }
            
            // Validate CA2 (0-20)
            if (studentMarks.ca2 && (isNaN(studentMarks.ca2) || studentMarks.ca2 < 0 || studentMarks.ca2 > 20)) {
              newErrors[`${subject}-${studentId}-ca2`] = "CA2 must be between 0 and 20";
              isValid = false;
            }
            
            // Validate Exam (0-60)
            if (studentMarks.exam && (isNaN(studentMarks.exam) || studentMarks.exam < 0 || studentMarks.exam > 60)) {
              newErrors[`${subject}-${studentId}-exam`] = "Exam must be between 0 and 60";
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
            const studentMarks = marksData[subject][studentId];
            
            if (studentMarks && (studentMarks.ca1 || studentMarks.ca2 || studentMarks.exam)) {
              // Calculate total
              const ca1 = parseFloat(studentMarks.ca1) || 0;
              const ca2 = parseFloat(studentMarks.ca2) || 0;
              const exam = parseFloat(studentMarks.exam) || 0;
              const total = ca1 + ca2 + exam;
              
              promises.push(
                updateStudentScores({
                  studentId,
                  className: selectedClass,
                  subject,
                  term: 'Term 3',
                  ca1: studentMarks.ca1 || "",
                  ca2: studentMarks.ca2 || "",
                  exam: studentMarks.exam || "",
                  total: total.toString()
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



  return (
    <Layout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Form Master Dashboard</h1>
        
        {/* Class Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Class</label>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
          >
            <option value="">Select a class</option>
            {getUserClasses().map(cls => (
              <option key={cls} value={cls}>{cls}</option>
            ))}
          </select>
        </div>

        {selectedClass && (
          <div>
            {/* Tabs */}
            <div className="mb-6 border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab("attendance")}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "attendance"
                      ? "border-indigo-500 text-indigo-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  Attendance & Remarks
                </button>
                <button
                  onClick={() => setActiveTab("marks")}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "marks"
                      ? "border-indigo-500 text-indigo-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  Marks
                </button>
                <button
                  onClick={() => setActiveTab("daily")}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "daily"
                      ? "border-indigo-500 text-indigo-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  Daily Attendance
                </button>
                <button
                  onClick={() => setActiveTab("report")}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "report"
                      ? "border-indigo-500 text-indigo-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  Attendance Report
                </button>
              </nav>
            </div>

            {/* Attendance & Remarks Tab */}
            {activeTab === "attendance" && (
              <div>
                <div className="bg-white shadow rounded-lg p-6 mb-6">
                  <h2 className="text-xl font-semibold mb-4">Attendance & Remarks</h2>
                  
                  {isLoading('learners') ? (
                    <LoadingSpinner message="Loading students..." />
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attendance</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remarks</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {filteredLearners.map((learner) => {
                            const studentId = learner.idNumber || learner.LearnerID;
                            return (
                              <tr key={studentId}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm font-medium text-gray-900">{learner.firstName} {learner.lastName}</div>
                                  <div className="text-sm text-gray-500">{studentId}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <input
                                    type="number"
                                    min="0"
                                    max="365"
                                    value={attendance[studentId] || ""}
                                    onChange={(e) => handleAttendanceChange(studentId, e.target.value)}
                                    className="w-24 p-2 border border-gray-300 rounded-md"
                                  />
                                  {errors[studentId] && (
                                    <div className="text-red-500 text-sm mt-1">{errors[studentId]}</div>
                                  )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <textarea
                                    value={remarks[studentId] || ""}
                                    onChange={(e) => handleRemarkChange(studentId, e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                    rows="2"
                                  />
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                  
                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      onClick={confirmSave}
                      disabled={saving}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                      {saving ? "Saving..." : "Save All"}
                    </button>
                  </div>
                </div>

                {/* Footnote Section */}
                <div className="bg-white shadow rounded-lg p-6 mb-6">
                  <h2 className="text-xl font-semibold mb-4">Footnote Information</h2>
                  <textarea
                    value={footnoteInfo}
                    onChange={(e) => handleFootnoteChange(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    rows="3"
                    placeholder="Enter any additional information for reports..."
                  />
                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={saveFootnoteInfo}
                      className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                    >
                      Save Footnote
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Marks Tab */}
            {activeTab === "marks" && (
              <div>
                <div className="bg-white shadow rounded-lg p-6 mb-6">
                  <h2 className="text-xl font-semibold mb-4">Student Marks</h2>
                  
                  {isLoading('marks') ? (
                    <LoadingSpinner message="Loading marks data..." />
                  ) : (
                    getUserSubjects().map(subject => (
                      <div key={subject} className="mb-8">
                        <h3 className="text-lg font-medium mb-3">{subject}</h3>
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CA1 (20)</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CA2 (20)</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exam (60)</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total (100)</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {filteredLearners.map((learner) => {
                                const studentId = learner.idNumber || learner.LearnerID;
                                const studentMarks = marksData[subject]?.[studentId] || {};
                                const ca1 = studentMarks.ca1 || '';
                                const ca2 = studentMarks.ca2 || '';
                                const exam = studentMarks.exam || '';
                                const total = studentMarks.total || '';
                                
                                // Check for errors for this specific student and subject
                                const ca1Error = errors[`${subject}-${studentId}-ca1`];
                                const ca2Error = errors[`${subject}-${studentId}-ca2`];
                                const examError = errors[`${subject}-${studentId}-exam`];
                                
                                return (
                                  <tr key={`${subject}-${studentId}`}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <div className="text-sm font-medium text-gray-900">{learner.firstName} {learner.lastName}</div>
                                      <div className="text-sm text-gray-500">{studentId}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <input
                                        type="number"
                                        min="0"
                                        max="20"
                                        step="0.5"
                                        value={ca1}
                                        onChange={(e) => handleMarksChange(subject, studentId, 'ca1', e.target.value)}
                                        className="w-20 p-2 border border-gray-300 rounded-md"
                                      />
                                      {ca1Error && (
                                        <div className="text-red-500 text-xs mt-1">{ca1Error}</div>
                                      )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <input
                                        type="number"
                                        min="0"
                                        max="20"
                                        step="0.5"
                                        value={ca2}
                                        onChange={(e) => handleMarksChange(subject, studentId, 'ca2', e.target.value)}
                                        className="w-20 p-2 border border-gray-300 rounded-md"
                                      />
                                      {ca2Error && (
                                        <div className="text-red-500 text-xs mt-1">{ca2Error}</div>
                                      )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <input
                                        type="number"
                                        min="0"
                                        max="60"
                                        step="0.5"
                                        value={exam}
                                        onChange={(e) => handleMarksChange(subject, studentId, 'exam', e.target.value)}
                                        className="w-20 p-2 border border-gray-300 rounded-md"
                                      />
                                      {examError && (
                                        <div className="text-red-500 text-xs mt-1">{examError}</div>
                                      )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <div className="text-sm font-medium text-gray-900">{total}</div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))
                  )}
                  
                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      onClick={saveAllMarksData}
                      disabled={saving}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                      {saving ? "Saving..." : "Save All Marks"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Daily Attendance Tab */}
            {activeTab === "daily" && (
              <div>
                <div className="bg-white shadow rounded-lg p-6 mb-6">
                  <h2 className="text-xl font-semibold mb-4">Daily Attendance</h2>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Date</label>
                    <input
                      type="date"
                      value={dailyAttendanceDate}
                      onChange={(e) => setDailyAttendanceDate(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  
                  {dailyAttendanceDate && (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {filteredLearners.map((learner) => {
                            const studentId = learner.idNumber || learner.LearnerID;
                            const status = dailyAttendance[studentId] || 'present';
                            return (
                              <tr key={studentId}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm font-medium text-gray-900">{learner.firstName} {learner.lastName}</div>
                                  <div className="text-sm text-gray-500">{studentId}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex space-x-4">
                                    <label className="inline-flex items-center">
                                      <input
                                        type="radio"
                                        name={`status-${studentId}`}
                                        checked={status === 'present'}
                                        onChange={() => handleDailyAttendanceChange(studentId, 'present')}
                                        className="text-blue-600"
                                      />
                                      <span className="ml-2">Present</span>
                                    </label>
                                    <label className="inline-flex items-center">
                                      <input
                                        type="radio"
                                        name={`status-${studentId}`}
                                        checked={status === 'absent'}
                                        onChange={() => handleDailyAttendanceChange(studentId, 'absent')}
                                        className="text-blue-600"
                                      />
                                      <span className="ml-2">Absent</span>
                                    </label>
                                    <label className="inline-flex items-center">
                                      <input
                                        type="radio"
                                        name={`status-${studentId}`}
                                        checked={status === 'late'}
                                        onChange={() => handleDailyAttendanceChange(studentId, 'late')}
                                        className="text-blue-600"
                                      />
                                      <span className="ml-2">Late</span>
                                    </label>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                      
                      <div className="mt-6 flex justify-end">
                        <button
                          onClick={saveDailyAttendance}
                          disabled={saving}
                          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
                        >
                          {saving ? "Saving..." : "Save Daily Attendance"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Attendance Report Tab */}
            {activeTab === "report" && (
              <div>
                <div className="bg-white shadow rounded-lg p-6 mb-6">
                  <h2 className="text-xl font-semibold mb-4">Attendance Report</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                      <input
                        type="date"
                        value={reportStartDate}
                        onChange={(e) => setReportStartDate(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                      <input
                        type="date"
                        value={reportEndDate}
                        onChange={(e) => setReportEndDate(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        onClick={generateAttendanceReport}
                        disabled={isLoading('report')}
                        className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                      >
                        {isLoading('report') ? "Generating..." : "Generate Report"}
                      </button>
                    </div>
                  </div>
                  
                  {attendanceReportData.length > 0 && (
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium">Report Results</h3>
                        <button
                          onClick={printAttendanceReport}
                          className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
                        >
                          Print Report
                        </button>
                      </div>
                      
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Present</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Absent</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Late</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Days</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Percentage</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {attendanceReportData.map((student) => (
                              <tr key={student.studentId}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm font-medium text-gray-900">{student.name}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.present}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.absent}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.late}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.totalDays}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                  <span className={
                                    student.percentage >= 90 ? "text-green-600" :
                                    student.percentage >= 75 ? "text-yellow-600" : "text-red-600"
                                  }>
                                    {student.percentage}%
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Confirmation Dialog */}
        {showConfirmDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-96">
              <h3 className="text-lg font-medium mb-4">Confirm Save</h3>
              <p className="mb-6">Are you sure you want to save all data? This action cannot be undone.</p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => handleConfirmDialog('cancel')}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleConfirmDialog('save')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default FormMasterPage;