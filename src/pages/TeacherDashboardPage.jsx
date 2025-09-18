import Layout from "../components/Layout";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { getLearners, updateStudentScores, updateFormMasterRemarks, getClassPerformanceTrends } from "../api";
import PerformanceChart from "../components/PerformanceChart";
import TrendAnalysisChart from "../components/TrendAnalysisChart";

const TeacherDashboardPage = ({ role }) => {  // Add role as a prop parameter
  const { user } = useAuth();
  
  const [learners, setLearners] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [marks, setMarks] = useState({});
  const [remarks, setRemarks] = useState({});
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedStudents, setSavedStudents] = useState(new Set());
  const [savedRemarksStudents, setSavedRemarksStudents] = useState(new Set());
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false); // Add state for analytics modal
  const [showTrendAnalysisModal, setShowTrendAnalysisModal] = useState(false); // Add state for trend analysis modal
  const [classTrendData, setClassTrendData] = useState(null); // New state for trend data
  const [activeView, setActiveView] = useState("scores");
  const [positions, setPositions] = useState({}); // Add missing positions state
  const [showScoresModal, setShowScoresModal] = useState(false); // Add missing state
  const [showRemarksModal, setShowRemarksModal] = useState(false); // Add missing state
  const [searchTerm, setSearchTerm] = useState(""); // Add search term state
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" }); // Add sort config state
  const [autoSaveTimeout, setAutoSaveTimeout] = useState(null); // Add auto-save timeout state
  
  // Offline functionality states
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingSync, setPendingSync] = useState([]);
  const [lastSyncTime, setLastSyncTime] = useState(null);

  // Get user's subjects and classes based on current role
  const getCurrentRoleData = () => {
    // If a specific role was requested via prop, use that for display purposes
    // but don't change the actual user role unless explicitly requested
    const displayRole = role || user?.currentRole || user?.primaryRole || user?.role;
    
    // For multi-role support, use the subjects/classes from user data
    const userSubjects = Array.isArray(user?.subjects) ? user.subjects : 
                        typeof user?.subjects === 'string' ? user.subjects.split(',').map(s => s.trim()) : [];
    
    const userClasses = Array.isArray(user?.classes) ? user.classes :
                       typeof user?.classes === 'string' ? user.classes.split(',').map(c => c.trim()) : [];

    return {
      currentRole: displayRole,
      subjects: userSubjects,
      classes: userClasses.includes('ALL') ? [...new Set(learners.map(l => l.className))].filter(Boolean) : userClasses
    };
  };

  const { currentRole, subjects: userSubjects, classes: userClasses } = getCurrentRoleData();

  // Debugging: Log state values
  console.log('TeacherDashboardPage state:', {
    selectedClass,
    selectedSubject,
    activeView,
    userSubjects: userSubjects.length,
    userClasses: userClasses.length
  });

  // Get available classes - either user's assigned classes or all classes from learners
  const availableClasses = userClasses.length > 0 ? userClasses : [...new Set(learners.map(l => l.className))].filter(Boolean);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load pending sync data from localStorage on component mount
  useEffect(() => {
    const pendingData = JSON.parse(localStorage.getItem('pendingSync') || '[]');
    setPendingSync(pendingData);
    
    const lastSync = localStorage.getItem('lastSyncTime');
    if (lastSync) {
      setLastSyncTime(new Date(parseInt(lastSync)));
    }
  }, []);

  // Save pending sync data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('pendingSync', JSON.stringify(pendingSync));
  }, [pendingSync]);

  useEffect(() => {
    loadLearners();
  }, []);

  const loadLearners = async () => {
    setLoading(true);
    try {
      const response = await getLearners();
      if (response.status === 'success') {
        setLearners(response.data || []);
      } else {
        console.error('Learners error:', response.message);
      }
    } catch (error) {
      console.error("Error loading learners:", error);
      alert("Error loading learners: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Filter learners for selected class
  const filteredLearners = learners.filter(l => l.className === selectedClass);

  // Auto-save functionality
  useEffect(() => {
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
    }
    
    if (selectedClass && selectedSubject && Object.keys(marks).length > 0) {
      const timeout = setTimeout(() => {
        // Auto-save only students with entered marks
        const learnersWithMarks = filteredLearners.filter(learner => {
          const studentId = learner.idNumber || learner.LearnerID;
          const studentMarks = marks[studentId];
          
          if (!studentMarks) return false;
          
          // Check if any of the mark fields have values
          return Object.values(studentMarks).some(mark => mark !== "" && mark !== undefined);
        });
        
        if (learnersWithMarks.length > 0) {
          saveProgressAuto();
        }
      }, 30000); // Auto-save after 30 seconds of inactivity
      
      setAutoSaveTimeout(timeout);
    }
    
    return () => {
      if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
      }
    };
  }, [marks, selectedClass, selectedSubject]); // Removed filteredLearners from dependencies

  // Initialize marks when class/subject changes
  useEffect(() => {
    if (selectedClass && selectedSubject && filteredLearners.length > 0 && activeView === "scores") {
      const newMarks = {};
      filteredLearners.forEach(learner => {
        const key = learner.idNumber || learner.LearnerID;
        newMarks[key] = {
          test1: "", test2: "", test3: "", test4: "", exam: ""
        };
      });
      setMarks(newMarks);
      setSavedStudents(new Set()); // Reset saved students when class/subject changes
    }
  }, [selectedClass, selectedSubject, filteredLearners.length, activeView]);

  // Initialize remarks and attendance when class changes
  useEffect(() => {
    if (selectedClass && filteredLearners.length > 0 && activeView === "remarks") {
      const newRemarks = {};
      const newAttendance = {};
      filteredLearners.forEach(learner => {
        const key = learner.idNumber || learner.LearnerID;
        newRemarks[key] = "";
        newAttendance[key] = "";
      });
      setRemarks(newRemarks);
      setAttendance(newAttendance);
      setSavedRemarksStudents(new Set()); // Reset saved remarks students when class changes
    }
  }, [selectedClass, filteredLearners.length, activeView]);

  // Load trend data when class and subject are selected (for scores view)
  useEffect(() => {
    if (selectedClass && selectedSubject && activeView === "scores") {
      loadTrendData();
    }
  }, [selectedClass, selectedSubject, activeView]);

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

  const handleMarkChange = (studentId, field, value) => {
    // Allow only numbers and decimal points
    if (value && !/^\d*\.?\d*$/.test(value)) return;
    
    // Convert value to number for validation
    const numValue = value === '' ? '' : parseFloat(value);
    
    // Apply validation based on field type
    if (['test1', 'test2', 'test3', 'test4'].includes(field)) {
      // For tests, limit between 0 and 15
      if (numValue !== '' && (numValue < 0 || numValue > 15)) return;
    } else if (field === 'exam') {
      // For exam, limit between 0 and 100
      if (numValue !== '' && (numValue < 0 || numValue > 100)) return;
    }
    
    setMarks(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: value
      }
    }));
    
    // Clear existing timeout
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
    }
    
    // Set new timeout for auto-save after 5 seconds of inactivity
    const timeout = setTimeout(() => {
      saveStudentMarksAuto(studentId);
    }, 5000);
    
    setAutoSaveTimeout(timeout);
  };

  const handleRemarkChange = (studentId, value) => {
    setRemarks(prev => ({
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
  };

  // Calculate totals with validation
  const calculateTotals = (studentMarks) => {
    const test1 = Math.min(parseFloat(studentMarks.test1) || 0, 15);
    const test2 = Math.min(parseFloat(studentMarks.test2) || 0, 15);
    const test3 = Math.min(parseFloat(studentMarks.test3) || 0, 15);
    const test4 = Math.min(parseFloat(studentMarks.test4) || 0, 15);
    const exam = Math.min(parseFloat(studentMarks.exam) || 0, 100);
    
    const testsTotal = test1 + test2 + test3 + test4;
    const testsScaled = (testsTotal / 60) * 50;
    const examScaled = (exam / 100) * 50;
    const finalTotal = testsScaled + examScaled;
    
    return { testsTotal, testsScaled, examScaled, finalTotal };
  };

  // Calculate positions
  const calculatePositions = () => {
    if (!selectedClass || !selectedSubject || filteredLearners.length === 0) {
      return {};
    }

    const studentsWithTotals = filteredLearners.map(learner => {
      const studentId = learner.idNumber || learner.LearnerID;
      const studentMarks = marks[studentId] || {};
      const totals = calculateTotals(studentMarks);
      return {
        studentId,
        name: `${learner.firstName} ${learner.lastName}`,
        total: totals.finalTotal
      };
    }).filter(student => student.total > 0); // Only include students with scores

    // Sort by total score (highest first)
    studentsWithTotals.sort((a, b) => b.total - a.total);

    // Assign positions
    const positionMap = {};
    studentsWithTotals.forEach((student, index) => {
      positionMap[student.studentId] = index + 1;
    });

    return positionMap;
  };

  const getRemarks = (finalTotal) => {
    if (finalTotal >= 80) return "Excellent";
    if (finalTotal >= 70) return "Very Good"; 
    if (finalTotal >= 60) return "Good";
    if (finalTotal >= 50) return "Satisfactory";
    if (finalTotal >= 40) return "Fair";
    if (finalTotal > 0) return "Needs Improvement";
    return "";
  };

  // Get analytics data for the selected class and subject
  const getAnalyticsData = () => {
    if (!selectedClass || (activeView === "scores" && !selectedSubject)) return null;

    let studentsWithData = [];
    
    if (activeView === "scores") {
      // Get students with marks entered
      studentsWithData = filteredLearners.filter(learner => {
        const studentId = learner.idNumber || learner.LearnerID;
        const studentMarks = marks[studentId] || {};
        const totals = calculateTotals(studentMarks);
        return totals.finalTotal > 0;
      });
    } else {
      // For remarks view, we can show attendance data
      studentsWithData = filteredLearners.filter(learner => {
        const studentId = learner.idNumber || learner.LearnerID;
        return (remarks[studentId] && remarks[studentId].trim() !== "") || 
               (attendance[studentId] && attendance[studentId].trim() !== "");
      });
    }

    if (studentsWithData.length === 0) return null;

    if (activeView === "scores") {
      // Performance distribution data
      const performanceData = [
        { label: 'Excellent', value: 0, color: '#10B981' },
        { label: 'Very Good', value: 0, color: '#3B82F6' },
        { label: 'Good', value: 0, color: '#8B5CF6' },
        { label: 'Satisfactory', value: 0, color: '#F59E0B' },
        { label: 'Fair', value: 0, color: '#F97316' },
        { label: 'Needs Improvement', value: 0, color: '#EF4444' }
      ];

      // Student scores data for bar chart
      const studentScores = [];

      studentsWithData.forEach(learner => {
        const studentId = learner.idNumber || learner.LearnerID;
        const studentMarks = marks[studentId] || {};
        const totals = calculateTotals(studentMarks);
        const finalTotal = totals.finalTotal;
        
        if (finalTotal > 0) {
          // Add to performance distribution
          if (finalTotal >= 80) {
            performanceData[0].value++;
          } else if (finalTotal >= 70) {
            performanceData[1].value++;
          } else if (finalTotal >= 60) {
            performanceData[2].value++;
          } else if (finalTotal >= 50) {
            performanceData[3].value++;
          } else if (finalTotal >= 40) {
            performanceData[4].value++;
          } else {
            performanceData[5].value++;
          }
          
          // Add to student scores
          studentScores.push({
            label: `${learner.firstName} ${learner.lastName.charAt(0)}.`,
            value: parseFloat(finalTotal.toFixed(1))
          });
        }
      });

      // Average score
      const averageScore = studentScores.length > 0 
        ? (studentScores.reduce((sum, student) => sum + student.value, 0) / studentScores.length).toFixed(1)
        : 0;

      return {
        performanceData: performanceData.filter(item => item.value > 0),
        studentScores,
        averageScore,
        totalStudents: studentsWithData.length
      };
    } else {
      // For remarks view, show attendance statistics
      let totalAttendance = 0;
      let attendanceRecords = 0;
      
      studentsWithData.forEach(learner => {
        const studentId = learner.idNumber || learner.LearnerID;
        const studentAttendance = attendance[studentId];
        if (studentAttendance && studentAttendance.trim() !== "") {
          const attendanceValue = parseInt(studentAttendance);
          if (!isNaN(attendanceValue)) {
            totalAttendance += attendanceValue;
            attendanceRecords++;
          }
        }
      });
      
      const averageAttendance = attendanceRecords > 0 
        ? (totalAttendance / attendanceRecords).toFixed(1)
        : 0;
      
      return {
        totalStudents: studentsWithData.length,
        averageAttendance,
        attendanceRecords
      };
    }
  };

  const analyticsData = getAnalyticsData();

  // Update positions when marks, class, or subject change
  useEffect(() => {
    if (selectedClass && selectedSubject && activeView === "scores") {
      const newPositions = calculatePositions();
      setPositions(newPositions);
    }
  }, [marks, selectedClass, selectedSubject, activeView]);

  // Save individual student marks with offline support
  const saveStudentMarks = async (studentId) => {
    if (!selectedClass || !selectedSubject) {
      alert("Please select a class and subject first.");
      return;
    }

    // Check if user has permission for this subject
    if (!userSubjects.includes(selectedSubject)) {
      alert("You don't have permission to enter scores for this subject.");
      return;
    }

    const studentMarks = marks[studentId];
    if (!studentMarks) {
      alert("No marks to save for this student.");
      return;
    }

    // Validate that at least one mark field has a value
    const hasMarks = Object.values(studentMarks).some(mark => mark !== "" && mark !== undefined);
    if (!hasMarks) {
      alert("Please enter at least one mark before saving.");
      return;
    }

    setSaving(true);
    try {
      const scoreData = {
        studentId,
        subject: selectedSubject,
        term: 'Term 3',
        test1: parseFloat(studentMarks.test1) || 0,
        test2: parseFloat(studentMarks.test2) || 0,
        test3: parseFloat(studentMarks.test3) || 0,
        test4: parseFloat(studentMarks.test4) || 0,
        exam: parseFloat(studentMarks.exam) || 0
      };
      
      // If offline, save to pending sync queue
      if (!isOnline) {
        const pendingItem = {
          id: Date.now(),
          type: 'marks',
          data: scoreData,
          timestamp: new Date().toISOString()
        };
        
        setPendingSync(prev => [...prev, pendingItem]);
        setSavedStudents(prev => new Set(prev).add(studentId));
        console.log(`Student marks saved offline for ${studentId}!`);
        alert("Data saved locally. It will be synced when you're back online.");
      } else {
        // Online - save directly
        const response = await updateStudentScores(scoreData);
        
        if (response.status === 'success') {
          // Update saved students set
          setSavedStudents(prev => new Set(prev).add(studentId));
          // Show success message without interrupting workflow
          console.log(`Student marks saved successfully for ${studentId}!`);
        } else {
          alert("Error saving student marks: " + response.message);
        }
      }
    } catch (error) {
      console.error(`Error saving marks for ${studentId}:`, error);
      alert("Error saving student marks: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  // Auto-save individual student marks with offline support
  const saveStudentMarksAuto = async (studentId) => {
    if (!selectedClass || !selectedSubject) {
      return;
    }

    // Check if user has permission for this subject
    if (!userSubjects.includes(selectedSubject)) {
      return;
    }

    const studentMarks = marks[studentId];
    if (!studentMarks) {
      return;
    }

    // Validate that at least one mark field has a value
    const hasMarks = Object.values(studentMarks).some(mark => mark !== "" && mark !== undefined);
    if (!hasMarks) {
      return;
    }

    try {
      const scoreData = {
        studentId,
        subject: selectedSubject,
        term: 'Term 3',
        test1: parseFloat(studentMarks.test1) || 0,
        test2: parseFloat(studentMarks.test2) || 0,
        test3: parseFloat(studentMarks.test3) || 0,
        test4: parseFloat(studentMarks.test4) || 0,
        exam: parseFloat(studentMarks.exam) || 0
      };
      
      // If offline, save to pending sync queue
      if (!isOnline) {
        const pendingItem = {
          id: Date.now(),
          type: 'marks',
          data: scoreData,
          timestamp: new Date().toISOString()
        };
        
        setPendingSync(prev => [...prev, pendingItem]);
        setSavedStudents(prev => new Set(prev).add(studentId));
        console.log(`Student marks auto-saved offline for ${studentId}!`);
      } else {
        // Online - save directly
        const response = await updateStudentScores(scoreData);
        
        if (response.status === 'success') {
          // Update saved students set
          setSavedStudents(prev => new Set(prev).add(studentId));
          // Show success message without interrupting workflow
          console.log(`Student marks auto-saved successfully for ${studentId}!`);
        }
      }
    } catch (error) {
      console.error(`Error auto-saving marks for ${studentId}:`, error);
    }
  };


  // Save all marks with offline support
  const saveAllMarks = async () => {
    if (!selectedClass || !selectedSubject) {
      alert("Please select a class and subject first.");
      return;
    }

    // Check if user has permission for this subject
    if (!userSubjects.includes(selectedSubject)) {
      alert("You don't have permission to enter scores for this subject.");
      return;
    }

    setSaving(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      const promises = filteredLearners.map(async (learner) => {
        const studentId = learner.idNumber || learner.LearnerID;
        const studentMarks = marks[studentId];
        
        if (studentMarks) {
          try {
            const scoreData = {
              studentId,
              subject: selectedSubject,
              term: 'Term 3',
              test1: parseFloat(studentMarks.test1) || 0,
              test2: parseFloat(studentMarks.test2) || 0,
              test3: parseFloat(studentMarks.test3) || 0,
              test4: parseFloat(studentMarks.test4) || 0,
              exam: parseFloat(studentMarks.exam) || 0
            };
            
            // If offline, save to pending sync queue
            if (!isOnline) {
              const pendingItem = {
                id: Date.now(),
                type: 'marks',
                data: scoreData,
                timestamp: new Date().toISOString()
              };
              
              setPendingSync(prev => [...prev, pendingItem]);
              successCount++;
              setSavedStudents(prev => new Set(prev).add(studentId));
            } else {
              // Online - save directly
              const response = await updateStudentScores(scoreData);
              
              if (response.status === 'success') {
                successCount++;
                // Update saved students set
                setSavedStudents(prev => new Set(prev).add(studentId));
              } else {
                errorCount++;
              }
            }
          } catch (error) {
            console.error(`Error saving marks for ${studentId}:`, error);
            errorCount++;
          }
        }
      });

      await Promise.all(promises);
      
      if (errorCount === 0) {
        alert(`All marks saved successfully! (${successCount} students)`);
      } else {
        alert(`Saved ${successCount} students successfully. ${errorCount} failed.`);
      }
      
    } catch (error) {
      console.error("Save all marks error:", error);
      alert("Error saving marks: " + error.message);
    } finally {
      setSaving(false);
      // setShowScoresModal(false); // Close modal after saving
    }
  };

  // Save progress - save only the marks that have been entered with offline support
  const saveProgress = async () => {
    if (!selectedClass || !selectedSubject) {
      alert("Please select a class and subject first.");
      return;
    }

    // Check if user has permission for this subject
    if (!userSubjects.includes(selectedSubject)) {
      alert("You don't have permission to enter scores for this subject.");
      return;
    }

    // Filter learners to only those with entered marks
    const learnersWithMarks = filteredLearners.filter(learner => {
      const studentId = learner.idNumber || learner.LearnerID;
      const studentMarks = marks[studentId];
      
      // Check if any marks have been entered for this student
      if (!studentMarks) return false;
      
      // Check if any of the mark fields have values
      return Object.values(studentMarks).some(mark => mark !== "" && mark !== undefined);
    });

    if (learnersWithMarks.length === 0) {
      alert("No marks have been entered to save.");
      return;
    }

    setSaving(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      const promises = learnersWithMarks.map(async (learner) => {
        const studentId = learner.idNumber || learner.LearnerID;
        const studentMarks = marks[studentId];
        
        if (studentMarks) {
          try {
            const scoreData = {
              studentId,
              subject: selectedSubject,
              term: 'Term 3',
              test1: parseFloat(studentMarks.test1) || 0,
              test2: parseFloat(studentMarks.test2) || 0,
              test3: parseFloat(studentMarks.test3) || 0,
              test4: parseFloat(studentMarks.test4) || 0,
              exam: parseFloat(studentMarks.exam) || 0
            };
            
            // If offline, save to pending sync queue
            if (!isOnline) {
              const pendingItem = {
                id: Date.now(),
                type: 'marks',
                data: scoreData,
                timestamp: new Date().toISOString()
              };
              
              setPendingSync(prev => [...prev, pendingItem]);
              successCount++;
              setSavedStudents(prev => new Set(prev).add(studentId));
            } else {
              // Online - save directly
              const response = await updateStudentScores(scoreData);
              
              if (response.status === 'success') {
                successCount++;
                // Update saved students set
                setSavedStudents(prev => new Set(prev).add(studentId));
              } else {
                errorCount++;
              }
            }
          } catch (error) {
            console.error(`Error saving marks for ${studentId}:`, error);
            errorCount++;
          }
        }
      });

      await Promise.all(promises);
      
      if (errorCount === 0) {
        alert(`Progress saved successfully! (${successCount} students)`);
      } else {
        alert(`Saved ${successCount} students successfully. ${errorCount} failed.`);
      }
      
    } catch (error) {
      console.error("Save progress error:", error);
      alert("Error saving progress: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  // Auto-save progress - save only the marks that have been entered with offline support
  const saveProgressAuto = async () => {
    if (!selectedClass || !selectedSubject) {
      return;
    }

    // Check if user has permission for this subject
    if (!userSubjects.includes(selectedSubject)) {
      return;
    }

    // Filter learners to only those with entered marks
    const learnersWithMarks = filteredLearners.filter(learner => {
      const studentId = learner.idNumber || learner.LearnerID;
      const studentMarks = marks[studentId];
      
      // Check if any marks have been entered for this student
      if (!studentMarks) return false;
      
      // Check if any of the mark fields have values
      return Object.values(studentMarks).some(mark => mark !== "" && mark !== undefined);
    });

    if (learnersWithMarks.length === 0) {
      return;
    }

    setSaving(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      const promises = learnersWithMarks.map(async (learner) => {
        const studentId = learner.idNumber || learner.LearnerID;
        const studentMarks = marks[studentId];
        
        if (studentMarks) {
          try {
            const scoreData = {
              studentId,
              subject: selectedSubject,
              term: 'Term 3',
              test1: parseFloat(studentMarks.test1) || 0,
              test2: parseFloat(studentMarks.test2) || 0,
              test3: parseFloat(studentMarks.test3) || 0,
              test4: parseFloat(studentMarks.test4) || 0,
              exam: parseFloat(studentMarks.exam) || 0
            };
            
            // If offline, save to pending sync queue
            if (!isOnline) {
              const pendingItem = {
                id: Date.now(),
                type: 'marks',
                data: scoreData,
                timestamp: new Date().toISOString()
              };
              
              setPendingSync(prev => [...prev, pendingItem]);
              successCount++;
              setSavedStudents(prev => new Set(prev).add(studentId));
            } else {
              // Online - save directly
              const response = await updateStudentScores(scoreData);
              
              if (response.status === 'success') {
                successCount++;
                // Update saved students set
                setSavedStudents(prev => new Set(prev).add(studentId));
              } else {
                errorCount++;
              }
            }
          } catch (error) {
            console.error(`Error saving marks for ${studentId}:`, error);
            errorCount++;
          }
        }
      });

      await Promise.all(promises);
      
      if (errorCount === 0) {
        console.log(`Progress auto-saved successfully! (${successCount} students)`);
      } else {
        console.log(`Auto-saved ${successCount} students successfully. ${errorCount} failed.`);
      }
      
    } catch (error) {
      console.error("Save progress auto error:", error);
    } finally {
      setSaving(false);
    }
  };

  // Save individual remarks with offline support
  const saveRemarks = async (studentId) => {
    if (!selectedClass) {
      alert("Please select a class first.");
      return;
    }

    const studentRemark = remarks[studentId];
    const studentAttendance = attendance[studentId];

    if (!studentRemark && !studentAttendance) {
      alert("Please enter at least a remark or attendance before saving.");
      return;
    }

    setSaving(true);
    try {
      const remarkData = {
        studentId,
        className: selectedClass,
        term: 'Term 3',
        remarks: studentRemark || "",
        attendance: studentAttendance || ""
      };
      
      // If offline, save to pending sync queue
      if (!isOnline) {
        const pendingItem = {
          id: Date.now(),
          type: 'remarks',
          data: remarkData,
          timestamp: new Date().toISOString()
        };
        
        setPendingSync(prev => [...prev, pendingItem]);
        setSavedRemarksStudents(prev => new Set(prev).add(studentId));
        console.log(`Remarks saved offline for ${studentId}!`);
        alert("Data saved locally. It will be synced when you're back online.");
      } else {
        // Online - save directly
        const response = await updateFormMasterRemarks(remarkData);
        
        if (response.status === 'success') {
          // Update saved remarks students set
          setSavedRemarksStudents(prev => new Set(prev).add(studentId));
          console.log(`Remarks saved successfully for ${studentId}!`);
        } else {
          alert("Error saving remarks: " + response.message);
        }
      }
    } catch (error) {
      console.error(`Error saving remarks for ${studentId}:`, error);
      alert("Error saving remarks: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  // Save all remarks with offline support
  const saveAllRemarks = async () => {
    if (!selectedClass) {
      alert("Please select a class first.");
      return;
    }

    setSaving(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      const promises = filteredLearners.map(async (learner) => {
        const studentId = learner.idNumber || learner.LearnerID;
        const studentRemark = remarks[studentId];
        const studentAttendance = attendance[studentId];
        
        if (studentRemark || studentAttendance) {
          try {
            const remarkData = {
              studentId,
              className: selectedClass,
              term: 'Term 3',
              remarks: studentRemark || "",
              attendance: studentAttendance || ""
            };
            
            // If offline, save to pending sync queue
            if (!isOnline) {
              const pendingItem = {
                id: Date.now(),
                type: 'remarks',
                data: remarkData,
                timestamp: new Date().toISOString()
              };
              
              setPendingSync(prev => [...prev, pendingItem]);
              successCount++;
              setSavedRemarksStudents(prev => new Set(prev).add(studentId));
            } else {
              // Online - save directly
              const response = await updateFormMasterRemarks(remarkData);
              
              if (response.status === 'success') {
                successCount++;
                setSavedRemarksStudents(prev => new Set(prev).add(studentId));
              } else {
                errorCount++;
              }
            }
          } catch (error) {
            console.error(`Error saving data for ${studentId}:`, error);
            errorCount++;
          }
        }
      });

      await Promise.all(promises);
      
      if (errorCount === 0) {
        alert(`All data saved successfully! (${successCount} students)`);
      } else {
        alert(`Saved ${successCount} students successfully. ${errorCount} failed.`);
      }
      
    } catch (error) {
      console.error("Save all data error:", error);
      alert("Error saving data: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  // Save progress for remarks with offline support
  const saveRemarksProgress = async () => {
    if (!selectedClass) {
      alert("Please select a class first.");
      return;
    }

    // Filter learners to only those with entered remarks or attendance
    const learnersWithData = filteredLearners.filter(learner => {
      const studentId = learner.idNumber || learner.LearnerID;
      const studentRemark = remarks[studentId];
      const studentAttendance = attendance[studentId];
      return (studentRemark && studentRemark.trim() !== "") || 
             (studentAttendance && studentAttendance.trim() !== "");
    });

    if (learnersWithData.length === 0) {
      alert("No remarks or attendance data has been entered to save.");
      return;
    }

    setSaving(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      const promises = learnersWithData.map(async (learner) => {
        const studentId = learner.idNumber || learner.LearnerID;
        const studentRemark = remarks[studentId];
        const studentAttendance = attendance[studentId];
        
        if (studentRemark || studentAttendance) {
          try {
            const remarkData = {
              studentId,
              className: selectedClass,
              term: 'Term 3',
              remarks: studentRemark || "",
              attendance: studentAttendance || ""
            };
            
            // If offline, save to pending sync queue
            if (!isOnline) {
              const pendingItem = {
                id: Date.now(),
                type: 'remarks',
                data: remarkData,
                timestamp: new Date().toISOString()
              };
              
              setPendingSync(prev => [...prev, pendingItem]);
              successCount++;
              setSavedRemarksStudents(prev => new Set(prev).add(studentId));
            } else {
              // Online - save directly
              const response = await updateFormMasterRemarks(remarkData);
              
              if (response.status === 'success') {
                successCount++;
                setSavedRemarksStudents(prev => new Set(prev).add(studentId));
              } else {
                errorCount++;
              }
            }
          } catch (error) {
            console.error(`Error saving data for ${studentId}:`, error);
            errorCount++;
          }
        }
      });

      await Promise.all(promises);
      
      if (errorCount === 0) {
        alert(`Progress saved successfully! (${successCount} students)`);
      } else {
        alert(`Saved ${successCount} students successfully. ${errorCount} failed.`);
      }
      
    } catch (error) {
      console.error("Save remarks progress error:", error);
      alert("Error saving progress: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  // Function to manually sync pending data when coming back online
  const syncPendingData = async () => {
    if (pendingSync.length === 0) {
      alert("No pending data to sync.");
      return;
    }

    if (!isOnline) {
      alert("You are currently offline. Please connect to the internet to sync data.");
      return;
    }

    setSaving(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      const promises = pendingSync.map(async (pendingItem) => {
        try {
          let response;
          if (pendingItem.type === 'marks') {
            response = await updateStudentScores(pendingItem.data);
          } else if (pendingItem.type === 'remarks') {
            response = await updateFormMasterRemarks(pendingItem.data);
          }
          
          if (response && response.status === 'success') {
            successCount++;
          } else {
            errorCount++;
          }
        } catch (error) {
          console.error(`Error syncing ${pendingItem.type} for ${pendingItem.data.studentId}:`, error);
          errorCount++;
        }
      });

      await Promise.all(promises);
      
      if (errorCount === 0) {
        // Clear pending sync data on success
        setPendingSync([]);
        const syncTime = new Date();
        setLastSyncTime(syncTime);
        localStorage.setItem('lastSyncTime', syncTime.getTime().toString());
        alert(`All pending data synced successfully! (${successCount} items)`);
      } else {
        alert(`Synced ${successCount} items successfully. ${errorCount} failed.`);
      }
      
    } catch (error) {
      console.error("Sync pending data error:", error);
      alert("Error syncing data: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  // Print broadsheet
  const printBroadsheet = () => {
    if (!selectedClass || !selectedSubject) {
      alert("Please select a class and subject first.");
      return;
    }

    try {
      // Create table rows with student data
      let tableRows = '';
      
      // Sort students by position for the printout
      const sortedLearners = [...filteredLearners].sort((a, b) => {
        const aId = a.idNumber || a.LearnerID;
        const bId = b.idNumber || b.LearnerID;
        const aPos = positions[aId] || 9999;
        const bPos = positions[bId] || 9999;
        return aPos - bPos;
      });
      
      sortedLearners.forEach(learner => {
        const studentId = learner.idNumber || learner.LearnerID;
        const studentMarks = marks[studentId] || {};
        const totals = calculateTotals(studentMarks);
        const position = positions[studentId];
        const remarks = getRemarks(totals.finalTotal);
        
        tableRows += `
          <tr>
            <td style="border: 1px solid black; padding: 4px;">${learner.firstName} ${learner.lastName}</td>
            <td style="border: 1px solid black; padding: 4px; text-align: center;">${studentMarks.test1 || 0}</td>
            <td style="border: 1px solid black; padding: 4px; text-align: center;">${studentMarks.test2 || 0}</td>
            <td style="border: 1px solid black; padding: 4px; text-align: center;">${studentMarks.test3 || 0}</td>
            <td style="border: 1px solid black; padding: 4px; text-align: center;">${studentMarks.test4 || 0}</td>
            <td style="border: 1px solid black; padding: 4px; text-align: center;">${totals.testsTotal.toFixed(1)}</td>
            <td style="border: 1px solid black; padding: 4px; text-align: center;">${totals.testsScaled.toFixed(1)}</td>
            <td style="border: 1px solid black; padding: 4px; text-align: center;">${studentMarks.exam || 0}</td>
            <td style="border: 1px solid black; padding: 4px; text-align: center;">${totals.examScaled.toFixed(1)}</td>
            <td style="border: 1px solid black; padding: 4px; text-align: center; font-weight: bold;">${totals.finalTotal.toFixed(1)}</td>
            <td style="border: 1px solid black; padding: 4px; text-align: center;">${position || '-'}</td>
            <td style="border: 1px solid black; padding: 4px;">${remarks}</td>
          </tr>
        `;
      });

      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        alert("Popup blocked. Please allow popups for this site.");
        return;
      }

      const htmlContent = `<!DOCTYPE html>
        <html>
          <head>
            <title>Class Broadsheet - ${selectedClass} (${selectedSubject})</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .header { text-align: center; margin-bottom: 30px; }
              .school-name { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
              .report-title { font-size: 18px; margin-bottom: 10px; }
              .details { font-size: 14px; color: #666; }
              table { border-collapse: collapse; width: 100%; margin-top: 20px; }
              th, td { border: 1px solid black; padding: 8px; text-align: center; }
              th { background-color: #f0f0f0; font-weight: bold; }
              .student-name { text-align: left; }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="school-name">DERIAD'S eSBA</div>
              <div class="report-title">Class Broadsheet</div>
              <div class="details">
                Class: ${selectedClass} | Subject: ${selectedSubject} | Teacher: ${user?.name} | Date: ${new Date().toLocaleDateString()}
              </div>
            </div>
            <table>
              <thead>
                <tr>
                  <th class="student-name">Student Name</th>
                  <th>Test 1<br/>(0-15)</th>
                  <th>Test 2<br/>(0-15)</th>
                  <th>Test 3<br/>(0-15)</th>
                  <th>Test 4<br/>(0-15)</th>
                  <th>Tests<br/>Total</th>
                  <th>50%</th>
                  <th>Exam<br/>(0-100)</th>
                  <th>50%</th>
                  <th>Final<br/>Total</th>
                  <th>Position</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                ${tableRows}
              </tbody>
            </table>
            <div style="margin-top: 30px; font-size: 12px;">
              <p><strong>Grading Scale:</strong></p>
              <p>80-100: Excellent | 70-79: Very Good | 60-69: Good | 50-59: Satisfactory | 40-49: Fair | 0-39: Needs Improvement</p>
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
      console.error("Print error:", error);
      alert("Print failed: " + error.message);
    }
  };

  // Print class report (for remarks view)
  const printClassReport = () => {
    if (!selectedClass) {
      alert("Please select a class first.");
      return;
    }

    try {
      // Create table rows with student data
      let tableRows = '';
      
      filteredLearners.forEach(learner => {
        const studentId = learner.idNumber || learner.LearnerID;
        const studentRemark = remarks[studentId];
        const studentAttendance = attendance[studentId];
        
        // Try to get existing remarks from localStorage if not entered
        let remarksText = '';
        // This would typically come from an API call, but for now we'll use what's entered
        remarksText = studentRemark || '';
        
        tableRows += `
          <tr>
            <td style="border: 1px solid black; padding: 4px;">${learner.firstName} ${learner.lastName}</td>
            <td style="border: 1px solid black; padding: 4px; text-align: center;">${studentAttendance}</td>
            <td style="border: 1px solid black; padding: 4px;">${remarksText}</td>
          </tr>
        `;
      });

      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        alert("Popup blocked. Please allow popups for this site.");
        return;
      }

      const htmlContent = `<!DOCTYPE html>
        <html>
          <head>
            <title>Class Report - ${selectedClass}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .header { text-align: center; margin-bottom: 30px; }
              .school-name { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
              .report-title { font-size: 18px; margin-bottom: 10px; }
              .details { font-size: 14px; color: #666; }
              table { border-collapse: collapse; width: 100%; margin-top: 20px; }
              th, td { border: 1px solid black; padding: 8px; text-align: center; }
              th { background-color: #f0f0f0; font-weight: bold; }
              .student-name { text-align: left; }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="school-name">DERIAD'S eSBA</div>
              <div class="report-title">Class Report</div>
              <div class="details">
                Class: ${selectedClass} | Teacher: ${user?.name} | Date: ${new Date().toLocaleDateString()}
              </div>
            </div>
            <table>
              <thead>
                <tr>
                  <th class="student-name">Student Name</th>
                  <th>Attendance</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                ${tableRows}
              </tbody>
            </table>
            <div style="margin-top: 30px; font-size: 12px;">
              <p><strong>Grading Scale:</strong></p>
              <p>80-100: Excellent | 70-79: Very Good | 60-69: Good | 50-59: Satisfactory | 40-49: Fair | 0-39: Needs Improvement</p>
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
      console.error("Print error:", error);
      alert("Print failed: " + error.message);
    }
  };


  // Get role-specific dashboard features
  const getRoleSpecificFeatures = () => {
    // If a specific role was requested via prop, use that for display
    const displayRole = role || currentRole;
    
    switch(displayRole) {
      case 'admin':
        return {
          title: "Administrator Dashboard",
          description: "Full system access and management capabilities",
          features: ["System Configuration", "User Management", "Role Assignment", "Data Analytics"]
        };
      case 'head_teacher':
        return {
          title: "Head Teacher Dashboard",
          description: "Oversee all teachers and school-wide reports",
          features: ["Teacher Performance", "Class Reports", "School Analytics"]
        };
      case 'class_teacher':
        return {
          title: "Class Teacher Dashboard",
          description: "Manage your assigned class and enter student scores",
          features: ["Class Management", "Student Scores", "Class Reports"]
        };
      case 'subject_teacher':
        return {
          title: "Subject Teacher Dashboard",
          description: "Enter scores for your assigned subjects",
          features: ["Subject Scores", "Class Performance", "Subject Analytics"]
        };
      case 'form_master':
        return {
          title: "Form Master Dashboard",
          description: "Manage your form class and enter remarks",
          features: ["Form Class Management", "Student Remarks", "Attendance Tracking"]
        };
      default:
        return {
          title: "Teacher Dashboard",
          description: "Standard teacher access",
          features: ["Student Scores", "Class Reports"]
        };
    }
  };

  // Sort students based on sort configuration
  const sortStudents = (students) => {
    if (!sortConfig.key) return students;
    
    return [...students].sort((a, b) => {
      let aValue, bValue;
      
      switch (sortConfig.key) {
        case 'name':
          aValue = `${a.firstName} ${a.lastName}`;
          bValue = `${b.firstName} ${b.lastName}`;
          break;
        case 'position': {
          const aPos = positions[a.idNumber || a.LearnerID] || 9999;
          const bPos = positions[b.idNumber || b.LearnerID] || 9999;
          aValue = aPos;
          bValue = bPos;
          break;
        }
        default: {
          // For marks sorting
          const aMarks = marks[a.idNumber || a.LearnerID] || {};
          const bMarks = marks[b.idNumber || b.LearnerID] || {};
          const aTotals = calculateTotals(aMarks);
          const bTotals = calculateTotals(bMarks);
          aValue = aTotals.finalTotal;
          bValue = bTotals.finalTotal;
        }
      }
      
      if (aValue < bValue) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === "asc" ? 1 : -1;
      }
      return 0;
    });
  };

  // Filter students based on search term
  const filterStudents = (students) => {
    if (!searchTerm) return students;
    
    return students.filter(student => 
      `${student.firstName} ${student.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student.idNumber || student.LearnerID).toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const roleFeatures = getRoleSpecificFeatures();

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
        {/* Offline Status Indicator */}
        <div className={`p-3 rounded-lg text-center text-white font-semibold ${
          isOnline ? 'bg-green-500' : 'bg-red-500'
        }`}>
          {isOnline ? 'Online' : 'Offline - Data will be saved locally and synced when online'}
        </div>
        
        {/* Pending Sync Indicator */}
        {pendingSync.length > 0 && (
          <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 rounded">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-bold text-yellow-700">Pending Sync</p>
                <p className="text-yellow-700">{pendingSync.length} items waiting to be synced</p>
                {lastSyncTime && (
                  <p className="text-yellow-600 text-sm">Last sync: {lastSyncTime.toLocaleString()}</p>
                )}
              </div>
              <button 
                onClick={syncPendingData}
                disabled={!isOnline || saving}
                className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:bg-gray-400"
              >
                {saving ? 'Syncing...' : 'Sync Now'}
              </button>
            </div>
          </div>
        )}

        {/* Header with Role Info - Glass Morphism */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/40 ring-1 ring-white/20 shadow-2xl rounded-lg p-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {role ? `${getRoleSpecificFeatures().title} (Direct Access)` : roleFeatures.title}
              </h1>
              <p className="text-gray-600 mt-1">{roleFeatures.description}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {currentRole?.replace('_', ' ').toUpperCase()}
                </span>
                {userSubjects.length > 0 && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {userSubjects.length} Subject{userSubjects.length !== 1 ? 's' : ''}
                  </span>
                )}
                {userClasses.length > 0 && userClasses[0] !== 'ALL' && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    {userClasses.length} Class{userClasses.length !== 1 ? 'es' : ''}
                  </span>
                )}
                {role && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    Direct Access Mode
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {/* Role-specific features */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Key Features:</h3>
            <div className="flex flex-wrap gap-2">
              {roleFeatures.features.map(feature => (
                <span key={feature} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                  {feature}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* View Toggle for Form Master - Glass Morphism */}
        {(currentRole === 'form_master' || role === 'form_master') && (
          <div className="bg-white/10 backdrop-blur-xl border border-white/40 ring-1 ring-white/20 shadow-2xl rounded-lg p-4">
            <div className="flex space-x-4">
              <button
                onClick={() => setActiveView("scores")}
                className={`px-4 py-2 rounded-md ${
                  activeView === "scores"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                Enter Scores
              </button>
              <button
                onClick={() => setActiveView("remarks")}
                className={`px-4 py-2 rounded-md ${
                  activeView === "remarks"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                Enter Remarks & Attendance
              </button>
            </div>
          </div>
        )}

        {/* No subjects warning */}
        {userSubjects.length === 0 && activeView === "scores" && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
            <div className="flex">
              <div className="text-yellow-800">
                <p className="font-bold">No subjects assigned</p>
                <p>Please contact the administrator to assign subjects to your account.</p>
              </div>
            </div>
          </div>
        )}

        {/* Class & Subject Selection - Glass Morphism */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/40 ring-1 ring-white/20 shadow-2xl rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">
            {activeView === "remarks" ? "Remarks & Attendance" : "Student Scores"}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Class</label>
              <select
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50"
                value={selectedClass}
                onChange={e => setSelectedClass(e.target.value)}
              >
                <option value="">Choose Class</option>
                {availableClasses.map(cls => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
              </select>
            </div>

            {activeView === "scores" && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Subject</label>
                <select
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50"
                  value={selectedSubject}
                  onChange={e => setSelectedSubject(e.target.value)}
                >
                  <option value="">Choose Subject</option>
                  {userSubjects.map(sub => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="md:col-span-2 flex items-end gap-2">
              <button 
                className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors whitespace-nowrap"
                onClick={() => {
                  console.log('Enter Scores button clicked');
                  console.log('activeView:', activeView);
                  console.log('selectedClass:', selectedClass);
                  console.log('selectedSubject:', selectedSubject);
                  console.log('Button would be disabled:', !selectedClass || (activeView === "scores" && !selectedSubject));
                  
                  if (activeView === "scores") {
                    console.log('Opening scores modal');
                    setShowScoresModal(true);
                  } else {
                    console.log('Opening remarks modal');
                    setShowRemarksModal(true);
                  }
                }}
                disabled={!selectedClass || (activeView === "scores" && !selectedSubject)}
              >
                {activeView === "scores" ? "Enter Scores" : "Enter Remarks"}
              </button>
              
              <button 
                className="flex-1 bg-green-600 text-white px-4 py-3 rounded-md hover:bg-green-700 disabled:bg-gray-400 transition-colors whitespace-nowrap"
                onClick={activeView === "scores" ? printBroadsheet : printClassReport}
                disabled={!selectedClass || (activeView === "scores" && !selectedSubject)}
              >
                Print
              </button>
            </div>
          </div>

          {/* Statistics Section - Glass Morphism */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/40 ring-1 ring-white/20 shadow-2xl rounded-lg p-6 mt-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-900">Statistics & Analytics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center">
                <button 
                  className={`flex-1 px-4 py-3 rounded-md transition-colors ${
                    showAnalyticsModal 
                      ? "bg-purple-600 text-white hover:bg-purple-700" 
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                  onClick={() => setShowAnalyticsModal(true)}
                  disabled={!selectedClass || (activeView === "scores" && !selectedSubject)}
                >
                  Show Analytics
                </button>
              </div>
              
              {/* Trend Analysis Button */}
              {activeView === "scores" && (
                <div className="flex items-center">
                  <button 
                    className={`flex-1 px-4 py-3 rounded-md transition-colors ${
                      showTrendAnalysisModal 
                        ? "bg-indigo-600 text-white hover:bg-indigo-700" 
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                    onClick={() => setShowTrendAnalysisModal(true)}
                    disabled={!selectedClass || !selectedSubject}
                  >
                    Show Trends
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Current Selection Info - Glass Morphism */}
          {selectedClass && (activeView === "scores" ? selectedSubject : true) && (
            <div className="bg-blue-50/30 border border-blue-200/50 rounded-md p-4 backdrop-blur-sm mt-6">
              <h3 className="font-semibold text-blue-900">
                {activeView === "scores" 
                  ? `${selectedSubject} - ${selectedClass}` 
                  : `Form Class: ${selectedClass}`}
              </h3>
              <p className="text-blue-700 text-sm">
                {filteredLearners.length} students | Teacher: {user?.name}
              </p>
              {/* Class Average Display */}
              {activeView === "scores" && analyticsData && (
                <div className="mt-2 flex items-center">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    Class Average: {analyticsData.averageScore}%
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Analytics Section */}
        {showAnalyticsModal && selectedClass && (activeView === "scores" ? selectedSubject : true) && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900">Performance Analytics</h2>
            
            {analyticsData ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {activeView === "scores" ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <PerformanceChart 
                        data={analyticsData.performanceData} 
                        title="Performance Distribution" 
                        type="pie" 
                      />
                      <PerformanceChart 
                        data={analyticsData.studentScores} 
                        title="Student Scores" 
                        type="bar" 
                      />
                    </div>
                    
                    <div className="bg-white/10 backdrop-blur-xl border border-white/40 ring-1 ring-white/20 shadow-2xl rounded-lg p-6">
                      <h3 className="text-lg font-semibold mb-4">Summary Statistics</h3>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-blue-50/30 border border-blue-200/50 rounded-lg p-4 text-center">
                          <div className="text-3xl font-bold text-blue-600">{analyticsData.totalStudents}</div>
                          <div className="text-gray-700">Students Assessed</div>
                        </div>
                        <div className="bg-green-50/30 border border-green-200/50 rounded-lg p-4 text-center">
                          <div className="text-3xl font-bold text-green-600">{analyticsData.averageScore}%</div>
                          <div className="text-gray-700">Class Average</div>
                        </div>
                        <div className="bg-purple-50/30 border border-purple-200/50 rounded-lg p-4 text-center">
                          <div className="text-3xl font-bold text-purple-600">
                            {analyticsData.performanceData.find(d => d.label === 'Excellent')?.value || 0}
                          </div>
                          <div className="text-gray-700">Excellent Students</div>
                        </div>
                        <div className="bg-yellow-50/30 border border-yellow-200/50 rounded-lg p-4 text-center">
                          <div className="text-3xl font-bold text-yellow-600">
                            {analyticsData.performanceData.find(d => d.label === 'Needs Improvement')?.value || 0}
                          </div>
                          <div className="text-gray-700">Needs Improvement</div>
                        </div>
                      </div>
                      
                      {/* Grade Distribution Visualization */}
                      <div className="mt-6">
                        <h4 className="text-md font-semibold mb-3">Grade Distribution</h4>
                        <div className="space-y-2">
                          {analyticsData.performanceData.map((grade, index) => (
                            <div key={index} className="flex items-center">
                              <div className="w-32 text-sm font-medium text-gray-700">{grade.label}</div>
                              <div className="flex-1 ml-2">
                                <div className="flex items-center">
                                  <div 
                                    className="h-6 rounded-md" 
                                    style={{ 
                                      width: `${(grade.value / analyticsData.totalStudents) * 100}%`,
                                      backgroundColor: grade.color
                                    }}
                                  ></div>
                                  <span className="ml-2 text-sm font-medium text-gray-700">{grade.value} students</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="bg-white/10 backdrop-blur-xl border border-white/40 ring-1 ring-white/20 shadow-2xl rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4">Attendance Analytics</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-blue-50/30 border border-blue-200/50 rounded-lg p-4 text-center">
                        <div className="text-3xl font-bold text-blue-600">{analyticsData.totalStudents}</div>
                        <div className="text-gray-700">Students Assessed</div>
                      </div>
                      <div className="bg-green-50/30 border border-green-200/50 rounded-lg p-4 text-center">
                        <div className="text-3xl font-bold text-green-600">{analyticsData.averageAttendance}</div>
                        <div className="text-gray-700">Average Attendance</div>
                      </div>
                      <div className="bg-purple-50/30 border border-purple-200/50 rounded-lg p-4 text-center">
                        <div className="text-3xl font-bold text-purple-600">{analyticsData.attendanceRecords}</div>
                        <div className="text-gray-700">Attendance Records</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white/10 backdrop-blur-xl border border-white/40 ring-1 ring-white/20 shadow-2xl rounded-lg p-6">
                <div className="text-center py-8 text-gray-500">
                  <p>Loading analytics data...</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Trend Analysis Section */}
        {showTrendAnalysisModal && selectedClass && selectedSubject && activeView === "scores" && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900">Performance Trends</h2>
            
            {classTrendData ? (
              <div className="grid grid-cols-1 gap-6">
                <TrendAnalysisChart 
                  data={classTrendData} 
                  title={`Class Performance Trend: ${selectedSubject} (${selectedClass})`}
                />
              </div>
            ) : (
              <div className="bg-white/10 backdrop-blur-xl border border-white/40 ring-1 ring-white/20 shadow-2xl rounded-lg p-6">
                <div className="text-center py-8 text-gray-500">
                  <p>Loading trend data...</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modal for Entering Scores */}
        {showScoresModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            {/* Removed glass-morphism from modal for better mobile performance */}
            <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Enter Student Scores</h2>
                  <button 
                    onClick={() => setShowScoresModal(false)} 
                    className="text-4xl text-gray-500 hover:text-gray-800 focus:outline-none"
                  >
                    ✕
                  </button>
                </div>

                {/* Current Selection Info in Modal */}
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
                  <h3 className="font-semibold text-blue-900">
                    {selectedSubject} - {selectedClass}
                  </h3>
                  <p className="text-blue-700 text-sm">
                    {filteredLearners.length} students | Teacher: {user?.name}
                  </p>
                </div>

                {/* Search Box */}
                <div className="mb-4">
                  <input
                    type="text"
                    placeholder="Search students by name or ID..."
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                {/* Marks Entry Table */}
                {selectedClass && selectedSubject && filteredLearners.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300 text-sm">
                      <thead>
                        <tr className="bg-gray-50">
                          <th 
                            className="border border-gray-300 p-3 text-left cursor-pointer hover:bg-gray-100"
                            onClick={() => setSortConfig({
                              key: 'name',
                              direction: sortConfig.key === 'name' && sortConfig.direction === 'asc' ? 'desc' : 'asc'
                            })}
                          >
                            Student Name
                            {sortConfig.key === 'name' && (
                              <span className="ml-2">
                                {sortConfig.direction === 'asc' ? '↑' : '↓'}
                              </span>
                            )}
                          </th>
                          <th 
                            className="border border-gray-300 p-3 text-left cursor-pointer hover:bg-gray-100"
                            onClick={() => setSortConfig({
                              key: 'id',
                              direction: sortConfig.key === 'id' && sortConfig.direction === 'asc' ? 'desc' : 'asc'
                            })}
                          >
                            Student ID
                            {sortConfig.key === 'id' && (
                              <span className="ml-2">
                                {sortConfig.direction === 'asc' ? '↑' : '↓'}
                              </span>
                            )}
                          </th>
                          <th className="border border-gray-300 p-2">Test 1<br/>(0-15)</th>
                          <th className="border border-gray-300 p-2">Test 2<br/>(0-15)</th>
                          <th className="border border-gray-300 p-2">Test 3<br/>(0-15)</th>
                          <th className="border border-gray-300 p-2">Test 4<br/>(0-15)</th>
                          <th className="border border-gray-300 p-2">Tests Total</th>
                          <th className="border border-gray-300 p-2">50%</th>
                          <th className="border border-gray-300 p-2">Exam<br/>(0-100)</th>
                          <th className="border border-gray-300 p-2">50%</th>
                          <th 
                            className="border border-gray-300 p-2 cursor-pointer hover:bg-gray-100"
                            onClick={() => setSortConfig({
                              key: 'marks',
                              direction: sortConfig.key === 'marks' && sortConfig.direction === 'asc' ? 'desc' : 'asc'
                            })}
                          >
                            Final Total
                            {sortConfig.key === 'marks' && (
                              <span className="ml-2">
                                {sortConfig.direction === 'asc' ? '↑' : '↓'}
                              </span>
                            )}
                          </th>
                          <th 
                            className="border border-gray-300 p-2 cursor-pointer hover:bg-gray-100"
                            onClick={() => setSortConfig({
                              key: 'position',
                              direction: sortConfig.key === 'position' && sortConfig.direction === 'asc' ? 'desc' : 'asc'
                            })}
                          >
                            Position
                            {sortConfig.key === 'position' && (
                              <span className="ml-2">
                                {sortConfig.direction === 'asc' ? '↑' : '↓'}
                              </span>
                            )}
                          </th>
                          <th className="border border-gray-300 p-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortStudents(filterStudents(filteredLearners)).map(learner => {
                          const studentId = learner.idNumber || learner.LearnerID;
                          const studentMarks = marks[studentId] || {};
                          const totals = calculateTotals(studentMarks);
                          const position = positions[studentId];
                          const isSaved = savedStudents.has(studentId);

                          return (
                            <tr key={studentId} className="hover:bg-gray-50">
                              <td className="border border-gray-300 p-3 font-medium">
                                {learner.firstName} {learner.lastName}
                              </td>
                              <td className="border border-gray-300 p-3">
                                {learner.idNumber || learner.LearnerID}
                              </td>
                              
                              {['test1', 'test2', 'test3', 'test4'].map(test => (
                                <td key={test} className="border border-gray-300 p-1">
                                  <input 
                                    type="text"
                                    value={studentMarks[test] || ''}
                                    onChange={(e) => handleMarkChange(studentId, test, e.target.value)}
                                    className="w-16 p-2 border rounded text-center focus:ring-2 focus:ring-blue-500"
                                    placeholder="0-15"
                                    maxLength="4"
                                  />
                                </td>
                              ))}
                              
                              <td className="border border-gray-300 p-3 text-center font-medium bg-gray-50">
                                {totals.testsTotal.toFixed(1)}
                              </td>
                              
                              <td className="border border-gray-300 p-3 text-center bg-gray-50">
                                {totals.testsScaled.toFixed(1)}
                              </td>
                              
                              <td className="border border-gray-300 p-1">
                                <input 
                                  type="text"
                                  value={studentMarks.exam || ''}
                                  onChange={(e) => handleMarkChange(studentId, 'exam', e.target.value)}
                                  className="w-20 p-2 border rounded text-center focus:ring-2 focus:ring-blue-500"
                                  placeholder="0-100"
                                  maxLength="5"
                                />
                              </td>
                              
                              <td className="border border-gray-300 p-3 text-center bg-gray-50">
                                {totals.examScaled.toFixed(1)}
                              </td>
                              
                              <td className="border border-gray-300 p-3 text-center font-bold text-lg bg-blue-50">
                                {totals.finalTotal.toFixed(1)}
                              </td>
                              
                              <td className="border border-gray-300 p-3 text-center">
                                {position ? (
                                  <span className="font-bold text-blue-600">#{position}</span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </td>
                              
                              <td className="border border-gray-300 p-2">
                                <button 
                                  onClick={() => saveStudentMarks(studentId)}
                                  disabled={saving}
                                  className={`px-3 py-1 rounded text-sm whitespace-nowrap ${
                                    isSaved 
                                      ? "bg-green-100 text-green-800" 
                                      : "bg-blue-600 text-white hover:bg-blue-700"
                                  } ${saving ? "opacity-50 cursor-not-allowed" : ""}`}
                                >
                                  {saving ? "Saving..." : (isSaved ? "Saved" : "Save")}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="bg-white/10 backdrop-blur-xl border border-white/40 ring-1 ring-white/20 shadow-2xl rounded-lg p-6">
                    <div className="text-center py-8 text-gray-500">
                      <p>No students found for the selected class and subject.</p>
                    </div>
                  </div>
                )}

                {filteredLearners.length > 0 && (
                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      onClick={() => setShowScoresModal(false)}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={saveProgress}
                      disabled={saving}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
                    >
                      {saving ? "Saving..." : "Save Progress"}
                    </button>
                    <button
                      onClick={saveAllMarks}
                      disabled={saving}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                    >
                      {saving ? "Saving..." : "Save All"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal for Entering Remarks */}
        {showRemarksModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            {/* Removed glass-morphism from modal for better mobile performance */}
            <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Enter Student Remarks</h2>
                  <button 
                    onClick={() => setShowRemarksModal(false)} 
                    className="text-4xl text-gray-500 hover:text-gray-800 focus:outline-none"
                  >
                    ✕
                  </button>
                </div>

                {/* Current Selection Info in Modal */}
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
                  <h3 className="font-semibold text-blue-900">
                    Form Class: {selectedClass}
                  </h3>
                  <p className="text-blue-700 text-sm">
                    {filteredLearners.length} students | Teacher: {user?.name}
                  </p>
                </div>

                {/* Search Box */}
                <div className="mb-4">
                  <input
                    type="text"
                    placeholder="Search students by name or ID..."
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                {/* Remarks Entry Table */}
                {selectedClass && filteredLearners.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300 text-sm">
                      <thead>
                        <tr className="bg-gray-50">
                          <th 
                            className="border border-gray-300 p-3 text-left cursor-pointer hover:bg-gray-100"
                            onClick={() => setSortConfig({
                              key: 'name',
                              direction: sortConfig.key === 'name' && sortConfig.direction === 'asc' ? 'desc' : 'asc'
                            })}
                          >
                            Student Name
                            {sortConfig.key === 'name' && (
                              <span>{sortConfig.direction === 'asc' ? ' ↑' : ' ↓'}</span>
                            )}
                          </th>
                          <th className="border border-gray-300 p-2">Test 1<br/>(0-15)</th>
                          <th className="border border-gray-300 p-2">Test 2<br/>(0-15)</th>
                          <th className="border border-gray-300 p-2">Test 3<br/>(0-15)</th>
                          <th className="border border-gray-300 p-2">Test 4<br/>(0-15)</th>
                          <th className="border border-gray-300 p-2">Tests Total</th>
                          <th className="border border-gray-300 p-2">50%</th>
                          <th className="border border-gray-300 p-2">Exam<br/>(0-100)</th>
                          <th className="border border-gray-300 p-2">50%</th>
                          <th 
                            className="border border-gray-300 p-2 cursor-pointer hover:bg-gray-100"
                            onClick={() => setSortConfig({
                              key: 'marks',
                              direction: sortConfig.key === 'marks' && sortConfig.direction === 'asc' ? 'desc' : 'asc'
                            })}
                          >
                            Final Total
                            {sortConfig.key === 'marks' && (
                              <span>{sortConfig.direction === 'asc' ? ' ↑' : ' ↓'}</span>
                            )}
                          </th>
                          <th 
                            className="border border-gray-300 p-2 cursor-pointer hover:bg-gray-100"
                            onClick={() => setSortConfig({
                              key: 'position',
                              direction: sortConfig.key === 'position' && sortConfig.direction === 'asc' ? 'desc' : 'asc'
                            })}
                          >
                            Position
                            {sortConfig.key === 'position' && (
                              <span>{sortConfig.direction === 'asc' ? ' ↑' : ' ↓'}</span>
                            )}
                          </th>
                          <th className="border border-gray-300 p-2">Remarks</th>
                          <th className="border border-gray-300 p-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortStudents(filterStudents(filteredLearners)).map(learner => {
                          const studentId = learner.idNumber || learner.LearnerID;
                          const studentMarks = marks[studentId] || {};
                          const totals = calculateTotals(studentMarks);
                          const position = positions[studentId];
                          const isSaved = savedStudents.has(studentId);

                          return (
                            <tr key={studentId} className="hover:bg-gray-50">
                              <td className="border border-gray-300 p-3 font-medium">
                                {learner.firstName} {learner.lastName}
                              </td>
                              
                              {['test1', 'test2', 'test3', 'test4'].map(test => (
                                <td key={test} className="border border-gray-300 p-1">
                                  <input 
                                    type="text"
                                    value={studentMarks[test] || ''}
                                    onChange={(e) => handleMarkChange(studentId, test, e.target.value)}
                                    className="w-16 p-2 border rounded text-center focus:ring-2 focus:ring-blue-500"
                                    placeholder="0-15"
                                    maxLength="4"
                                    min="0"
                                    max="15"
                                  />
                                </td>
                              ))}
                              
                              <td className="border border-gray-300 p-3 text-center font-medium bg-gray-50">
                                {totals.testsTotal.toFixed(1)}
                              </td>
                              
                              <td className="border border-gray-300 p-3 text-center bg-gray-50">
                                {totals.testsScaled.toFixed(1)}
                              </td>
                              
                              <td className="border border-gray-300 p-1">
                                <input 
                                  type="text"
                                  value={studentMarks.exam || ''}
                                  onChange={(e) => handleMarkChange(studentId, 'exam', e.target.value)}
                                  className="w-20 p-2 border rounded text-center focus:ring-2 focus:ring-blue-500"
                                  placeholder="0-100"
                                  maxLength="5"
                                  min="0"
                                  max="100"
                                />
                              </td>
                              
                              <td className="border border-gray-300 p-3 text-center bg-gray-50">
                                {totals.examScaled.toFixed(1)}
                              </td>
                              
                              <td className="border border-gray-300 p-3 text-center font-bold text-lg bg-blue-50">
                                {totals.finalTotal.toFixed(1)}
                              </td>
                              
                              <td className="border border-gray-300 p-3 text-center">
                                {position && (
                                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${
                                    position === 1 ? 'bg-yellow-400 text-yellow-900' :
                                    position === 2 ? 'bg-gray-300 text-gray-800' :
                                    position === 3 ? 'bg-orange-400 text-orange-900' :
                                    'bg-blue-100 text-blue-800'
                                  }`}>
                                    {position === 1 ? '🥇 1st' :
                                     position === 2 ? '🥈 2nd' :
                                     position === 3 ? '🥉 3rd' :
                                     `${position}th`}
                                  </span>
                                )}
                              </td>
                              
                              <td className="border border-gray-300 p-2 text-center">
                                {remarks && (
                                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                    totals.finalTotal >= 80 ? 'bg-green-100 text-green-800' :
                                    totals.finalTotal >= 70 ? 'bg-blue-100 text-blue-800' :
                                    totals.finalTotal >= 60 ? 'bg-yellow-100 text-yellow-800' :
                                    totals.finalTotal >= 50 ? 'bg-orange-100 text-orange-800' :
                                    totals.finalTotal >= 40 ? 'bg-red-100 text-red-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {remarks}
                                  </span>
                                )}
                              </td>
                              
                              <td className="border border-gray-300 p-2 text-center">
                                <button 
                                  onClick={() => saveStudentMarks(studentId)}
                                  className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                    isSaved ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                  }`}
                                >
                                  {isSaved ? 'Saved' : 'Save'}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="bg-white/10 backdrop-blur-xl border border-white/40 ring-1 ring-white/20 shadow-2xl rounded-lg p-6">
                    <div className="text-center py-8 text-gray-500">
                      <p>No students found for the selected class.</p>
                    </div>
                  </div>
                )}

                {filteredLearners.length > 0 && (
                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      onClick={() => setShowScoresModal(false)}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={saveProgress}
                      disabled={saving}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
                    >
                      {saving ? "Saving..." : "Save Progress"}
                    </button>
                    <button
                      onClick={saveAllMarks}
                      disabled={saving}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                    >
                      {saving ? "Saving..." : "Save All"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal for Entering Remarks & Attendance */}
        {showRemarksModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Enter Remarks & Attendance</h2>
                  <button 
                    onClick={() => setShowRemarksModal(false)} 
                    className="text-4xl text-gray-500 hover:text-gray-800 focus:outline-none"
                  >
                    ✕
                  </button>
                </div>

                {/* Current Selection Info in Modal */}
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
                  <h3 className="font-semibold text-blue-900">
                    Form Class: {selectedClass}
                  </h3>
                  <p className="text-blue-700 text-sm">
                    {filteredLearners.length} students | Teacher: {user?.name}
                  </p>
                </div>

                {/* Search Box */}
                <div className="mb-4">
                  <input
                    type="text"
                    placeholder="Search students by name or ID..."
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                {/* Remarks & Attendance Entry Table */}
                {selectedClass && filteredLearners.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300 text-sm">
                      <thead>
                        <tr className="bg-gray-50">
                          <th 
                            className="border border-gray-300 p-3 text-left cursor-pointer hover:bg-gray-100"
                            onClick={() => setSortConfig({
                              key: 'name',
                              direction: sortConfig.key === 'name' && sortConfig.direction === 'asc' ? 'desc' : 'asc'
                            })}
                          >
                            Student Name
                            {sortConfig.key === 'name' && (
                              <span>{sortConfig.direction === 'asc' ? ' ↑' : ' ↓'}</span>
                            )}
                          </th>
                          <th className="border border-gray-300 p-3">Attendance</th>
                          <th className="border border-gray-300 p-3">Remarks</th>
                          <th className="border border-gray-300 p-3">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortStudents(filterStudents(filteredLearners)).map(learner => {
                          const studentId = learner.idNumber || learner.LearnerID;
                          const studentRemark = remarks[studentId] || "";
                          const studentAttendance = attendance[studentId] || "";
                          const isSaved = savedRemarksStudents.has(studentId);

                          return (
                            <tr key={studentId} className="hover:bg-gray-50">
                              <td className="border border-gray-300 p-3 font-medium">
                                {learner.firstName} {learner.lastName}
                              </td>
                              <td className="border border-gray-300 p-3">
                                <input 
                                  type="text"
                                  value={studentAttendance}
                                  onChange={(e) => handleAttendanceChange(studentId, e.target.value)}
                                  className="w-24 p-2 border rounded focus:ring-2 focus:ring-blue-500"
                                  placeholder="Attendance"
                                />
                              </td>
                              <td className="border border-gray-300 p-3">
                                <textarea
                                  value={studentRemark}
                                  onChange={(e) => handleRemarkChange(studentId, e.target.value)}
                                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                                  placeholder="Enter remarks..."
                                  rows="2"
                                />
                              </td>
                              <td className="border border-gray-300 p-3 text-center">
                                <button 
                                  onClick={() => saveRemarks(studentId)}
                                  className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                    isSaved ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                  }`}
                                >
                                  {isSaved ? 'Saved' : 'Save'}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="bg-white/10 backdrop-blur-xl border border-white/40 ring-1 ring-white/20 shadow-2xl rounded-lg p-6">
                    <div className="text-center py-8 text-gray-500">
                      <p>No students found for the selected class.</p>
                    </div>
                  </div>
                )}

                {filteredLearners.length > 0 && (
                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      onClick={() => setShowRemarksModal(false)}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={saveRemarksProgress}
                      disabled={saving}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
                    >
                      {saving ? "Saving..." : "Save Progress"}
                    </button>
                    <button
                      onClick={saveAllRemarks}
                      disabled={saving}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                    >
                      {saving ? "Saving..." : "Save Progress"}
                    </button>
                    <button
                      onClick={saveAllRemarks}
                      disabled={saving}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                    >
                      {saving ? "Saving..." : "Save All"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Analytics Modal */}
        {showAnalyticsModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Performance Analytics</h2>
                  <button 
                    onClick={() => setShowAnalyticsModal(false)} 
                    className="text-4xl text-gray-500 hover:text-gray-800 focus:outline-none"
                  >
                    ✕
                  </button>
                </div>

                {analyticsData ? (
                  <div className="space-y-6">
                    {activeView === "scores" ? (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <PerformanceChart 
                            data={analyticsData.performanceData} 
                            title="Performance Distribution" 
                            type="pie" 
                          />
                          <PerformanceChart 
                            data={analyticsData.studentScores} 
                            title="Student Scores" 
                            type="bar" 
                          />
                        </div>
                        
                        <div className="bg-white/10 backdrop-blur-xl border border-white/40 ring-1 ring-white/20 shadow-2xl rounded-lg p-6">
                          <h3 className="text-lg font-semibold mb-4">Summary Statistics</h3>
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="bg-blue-50/30 border border-blue-200/50 rounded-lg p-4 text-center">
                              <div className="text-3xl font-bold text-blue-600">{analyticsData.totalStudents}</div>
                              <div className="text-gray-700">Students Assessed</div>
                            </div>
                            <div className="bg-green-50/30 border border-green-200/50 rounded-lg p-4 text-center">
                              <div className="text-3xl font-bold text-green-600">{analyticsData.averageScore}%</div>
                              <div className="text-gray-700">Class Average</div>
                            </div>
                            <div className="bg-purple-50/30 border border-purple-200/50 rounded-lg p-4 text-center">
                              <div className="text-3xl font-bold text-purple-600">
                                {analyticsData.performanceData.find(d => d.label === 'Excellent')?.value || 0}
                              </div>
                              <div className="text-gray-700">Excellent Students</div>
                            </div>
                            <div className="bg-yellow-50/30 border border-yellow-200/50 rounded-lg p-4 text-center">
                              <div className="text-3xl font-bold text-yellow-600">
                                {analyticsData.performanceData.find(d => d.label === 'Needs Improvement')?.value || 0}
                              </div>
                              <div className="text-gray-700">Needs Improvement</div>
                            </div>
                          </div>
                          
                          {/* Grade Distribution Visualization */}
                          <div className="mt-6">
                            <h4 className="text-md font-semibold mb-3">Grade Distribution</h4>
                            <div className="space-y-2">
                              {analyticsData.performanceData.map((grade, index) => (
                                <div key={index} className="flex items-center">
                                  <div className="w-32 text-sm font-medium text-gray-700">{grade.label}</div>
                                  <div className="flex-1 ml-2">
                                    <div className="flex items-center">
                                      <div 
                                        className="h-6 rounded-md" 
                                        style={{ 
                                          width: `${(grade.value / analyticsData.totalStudents) * 100}%`,
                                          backgroundColor: grade.color
                                        }}
                                      ></div>
                                      <span className="ml-2 text-sm font-medium text-gray-700">{grade.value} students</span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="bg-white/10 backdrop-blur-xl border border-white/40 ring-1 ring-white/20 shadow-2xl rounded-lg p-6">
                        <h3 className="text-lg font-semibold mb-4">Attendance Analytics</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="bg-blue-50/30 border border-blue-200/50 rounded-lg p-4 text-center">
                            <div className="text-3xl font-bold text-blue-600">{analyticsData.totalStudents}</div>
                            <div className="text-gray-700">Students Assessed</div>
                          </div>
                          <div className="bg-green-50/30 border border-green-200/50 rounded-lg p-4 text-center">
                            <div className="text-3xl font-bold text-green-600">{analyticsData.averageAttendance}</div>
                            <div className="text-gray-700">Average Attendance</div>
                          </div>
                          <div className="bg-purple-50/30 border border-purple-200/50 rounded-lg p-4 text-center">
                            <div className="text-3xl font-bold text-purple-600">{analyticsData.attendanceRecords}</div>
                            <div className="text-gray-700">Attendance Records</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-white/10 backdrop-blur-xl border border-white/40 ring-1 ring-white/20 shadow-2xl rounded-lg p-6">
                    <div className="text-center py-8 text-gray-500">
                      <p>Loading analytics data...</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Trend Analysis Modal */}
        {showTrendAnalysisModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Performance Trends</h2>
                  <button 
                    onClick={() => setShowTrendAnalysisModal(false)} 
                    className="text-4xl text-gray-500 hover:text-gray-800 focus:outline-none"
                  >
                    ✕
                  </button>
                </div>

                {classTrendData ? (
                  <div className="grid grid-cols-1 gap-6">
                    <TrendAnalysisChart 
                      data={classTrendData} 
                      title={`Class Performance Trend: ${selectedSubject} (${selectedClass})`}
                    />
                  </div>
                ) : (
                  <div className="bg-white/10 backdrop-blur-xl border border-white/40 ring-1 ring-white/20 shadow-2xl rounded-lg p-6">
                    <div className="text-center py-8 text-gray-500">
                      <p>Loading trend data...</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default TeacherDashboardPage;