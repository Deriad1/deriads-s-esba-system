import Layout from "../components/Layout";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNotification } from "../context/NotificationContext";
import { useGlobalSettings } from "../context/GlobalSettingsContext";
import { getLearners, updateStudentScores, getClassPerformanceTrends, getMarks, getCustomAssessments, saveCustomAssessmentScores, getCustomAssessmentScores, getClasses, getSubjects } from '../api-client';
import PerformanceChart from "../components/PerformanceChart";
import TrendAnalysisChart from "../components/TrendAnalysisChart";
import AnalyticsDashboard from "../components/AnalyticsDashboard";
import printingService from "../services/printingService";
import ChangePasswordModal from "../components/ChangePasswordModal";
import TeacherLeaderboard from "../components/TeacherLeaderboard";
import ResponsiveScoreEntry from "../components/ResponsiveScoreEntry";
import useOfflineSync from "../hooks/useOfflineSync";
import useAutoSave from "../hooks/useAutoSave";
import { DEFAULT_TERM } from "../constants/terms";
import { validateScoreData, VALIDATION_CONSTRAINTS } from "../utils/validation";

const SubjectTeacherPage = () => {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const { settings } = useGlobalSettings();

  // Initialize offline sync hook
  const {
    isOnline,
    pendingCount,
    queueAction,
    syncPendingData
  } = useOfflineSync({
    onSyncSuccess: (successCount) => {
      showNotification({ message: `Successfully synced ${successCount} items!`, type: 'success' });
    },
    onSyncError: (errorCount) => {
      showNotification({ message: `Failed to sync ${errorCount} items`, type: 'error' });
    },
    autoSync: true
  });

  const [learners, setLearners] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedAssessment, setSelectedAssessment] = useState(""); // Can be "regular" or assessment ID
  const [customAssessments, setCustomAssessments] = useState([]);
  const [marks, setMarks] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedStudents, setSavedStudents] = useState(new Set()); // Track saved students
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showTrendAnalysis, setShowTrendAnalysis] = useState(false); // New state for trend analysis
  const [classTrendData, setClassTrendData] = useState(null); // New state for trend data
  // State for modals
  const [showScoresModal, setShowScoresModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  // State for all classes and subjects
  const [allClasses, setAllClasses] = useState([]);
  const [allSubjects, setAllSubjects] = useState([]);

  // Get all subjects (not filtered by user)
  const getUserSubjects = () => {
    return allSubjects;
  };

  // Get all classes (not filtered by user)
  const getUserClasses = () => {
    return allClasses;
  };

  useEffect(() => {
    loadLearners();
    loadCustomAssessments();
    loadAllClasses();
    loadAllSubjects();
  }, []);

  // Load all classes
  const loadAllClasses = async () => {
    try {
      const response = await getClasses();
      if (response.status === 'success' && Array.isArray(response.data)) {
        const classNames = response.data.map(c => c.name || c.class_name).filter(Boolean);
        setAllClasses(classNames);
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

  // Load custom assessments
  const loadCustomAssessments = async () => {
    try {
      const response = await getCustomAssessments();
      if (response.status === 'success') {
        setCustomAssessments(response.data || []);
      }
    } catch (error) {
      console.error("Error loading custom assessments:", error);
    }
  };

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
      showNotification({ message: "Error loading learners: " + error.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Filter learners for selected class
  const filteredLearners = learners.filter(l => {
    const studentClass = l.className || l.class_name;
    return studentClass === selectedClass;
  });

  // Fetch and initialize marks when class/subject/assessment changes
  useEffect(() => {
    if (selectedClass && selectedSubject && selectedAssessment && filteredLearners.length > 0) {
      fetchExistingMarks();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClass, selectedSubject, selectedAssessment, filteredLearners.length]);

  // Fetch existing marks from database
  const fetchExistingMarks = async () => {
    try {
      const isCustomAssessment = selectedAssessment !== 'regular';

      let response;
      if (isCustomAssessment) {
        // Fetch custom assessment scores
        response = await getCustomAssessmentScores(
          parseInt(selectedAssessment),
          selectedClass,
          selectedSubject
        );
      } else {
        // Fetch regular term marks
        response = await getMarks(selectedClass, selectedSubject);
      }

      if (response.status === 'success') {
        const existingMarksData = response.data || [];

        // Create marks object with existing data
        const newMarks = {};
        const alreadySaved = new Set();

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
                alreadySaved.add(studentId);
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
                alreadySaved.add(studentId);
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

        setMarks(newMarks);
        setSavedStudents(alreadySaved);
      }
    } catch (error) {
      console.error("Error fetching existing marks:", error);
      // If fetch fails, initialize with empty marks
      const newMarks = {};
      const isCustomAssessment = selectedAssessment !== 'regular';

      filteredLearners.forEach(learner => {
        const key = learner.idNumber || learner.LearnerID;
        if (isCustomAssessment) {
          newMarks[key] = { score: "" };
        } else {
          newMarks[key] = {
            test1: "", test2: "", test3: "", test4: "", exam: ""
          };
        }
      });
      setMarks(newMarks);
      setSavedStudents(new Set());
    }
  };

  const handleMarkChange = (studentId, field, value) => {
    // ✅ VALIDATION FIX: Improved regex and range checking
    // Allow only valid numbers with max 2 decimal places
    if (value && !/^\d*\.?\d{0,2}$/.test(value)) {
      return; // Invalid format
    }

    // Check value is within acceptable range
    if (value !== '') {
      const numValue = parseFloat(value);

      if (isNaN(numValue)) {
        return; // Not a valid number
      }

      // Check maximum bounds
      if (field === 'exam' && numValue > VALIDATION_CONSTRAINTS.MAX_EXAM_SCORE) {
        showNotification({
          message: `Exam score cannot exceed ${VALIDATION_CONSTRAINTS.MAX_EXAM_SCORE}`,
          type: 'warning'
        });
        return;
      }

      if (field !== 'exam' && field !== 'score' && numValue > VALIDATION_CONSTRAINTS.MAX_TEST_SCORE) {
        showNotification({
          message: `Test score cannot exceed ${VALIDATION_CONSTRAINTS.MAX_TEST_SCORE}`,
          type: 'warning'
        });
        return;
      }

      // Check for negative values
      if (numValue < 0) {
        showNotification({
          message: 'Score cannot be negative',
          type: 'warning'
        });
        return;
      }
    }

    setMarks(prev => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || {}),
        [field]: value
      }
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

  const positions = calculatePositions();

  // Save individual student marks with offline support
  const saveStudentMarks = async (studentId) => {
    if (!selectedClass || !selectedSubject || !selectedAssessment) {
      showNotification({ message: "Please select a class, subject, and assessment first.", type: 'warning' });
      return;
    }

    const studentMarks = marks[studentId];
    if (!studentMarks) {
      showNotification({ message: "No marks to save for this student.", type: 'warning' });
      return;
    }

    // Validate that at least one mark field has a value
    const hasMarks = Object.values(studentMarks).some(mark => mark !== "" && mark !== undefined);
    if (!hasMarks) {
      showNotification({ message: "Please enter at least one mark before saving.", type: 'warning' });
      return;
    }

    const isCustomAssessment = selectedAssessment !== 'regular';

    // If offline, queue the action
    if (!isOnline) {
      const scoreData = isCustomAssessment
        ? {
            assessmentId: parseInt(selectedAssessment),
            studentId,
            subject: selectedSubject,
            score: parseFloat(studentMarks.score) || 0
          }
        : {
            studentId,
            subject: selectedSubject,
            term: settings.term || DEFAULT_TERM,
            test1: parseFloat(studentMarks.test1) || 0,
            test2: parseFloat(studentMarks.test2) || 0,
            test3: parseFloat(studentMarks.test3) || 0,
            test4: parseFloat(studentMarks.test4) || 0,
            exam: parseFloat(studentMarks.exam) || 0
          };

      queueAction('scores', scoreData);
      setSavedStudents(prev => new Set(prev).add(studentId));
      showNotification({
        message: "📡 Offline: Saved locally. Will sync when online.",
        type: 'info'
      });
      return;
    }

    // Online - save directly
    setSaving(true);
    try {
      let response;

      if (isCustomAssessment) {
        // Validate custom assessment score
        const score = parseFloat(studentMarks.score);

        if (isNaN(score) || score < 0) {
          showNotification({
            message: "Score must be a valid positive number",
            type: 'error'
          });
          setSaving(false);
          return;
        }

        // Save custom assessment score
        response = await saveCustomAssessmentScores({
          assessmentId: parseInt(selectedAssessment),
          studentId,
          subject: selectedSubject,
          score: score
        });
      } else {
        // ✅ VALIDATION FIX: Validate scores before saving
        const scoreData = {
          studentId,
          subject: selectedSubject,
          term: settings.term || DEFAULT_TERM,
          test1: studentMarks.test1,
          test2: studentMarks.test2,
          test3: studentMarks.test3,
          test4: studentMarks.test4,
          exam: studentMarks.exam
        };

        const validation = validateScoreData(scoreData);

        if (!validation.isValid) {
          const errorMessages = Object.values(validation.errors).join('\n');
          showNotification({
            message: `Validation failed:\n${errorMessages}`,
            type: 'error'
          });
          setSaving(false);
          return;
        }

        // Save regular term scores with validated data
        response = await updateStudentScores({
          studentId,
          subject: selectedSubject,
          term: settings.term || DEFAULT_TERM,
          test1: parseFloat(studentMarks.test1) || 0,
          test2: parseFloat(studentMarks.test2) || 0,
          test3: parseFloat(studentMarks.test3) || 0,
          test4: parseFloat(studentMarks.test4) || 0,
          exam: parseFloat(studentMarks.exam) || 0
        });
      }

      if (response.status === 'success') {
        // Update saved students set
        setSavedStudents(prev => new Set(prev).add(studentId));
        // Show success message without interrupting workflow
        showNotification({ message: `Marks saved successfully!`, type: 'success' });
      } else {
        showNotification({ message: "Error saving student marks: " + response.message, type: 'error' });
      }
    } catch (error) {
      console.error("Save student marks error:", error);
      showNotification({ message: "Error saving student marks: " + error.message, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // Save all marks
  const saveAllMarks = async () => {
    if (!selectedClass || !selectedSubject) {
      showNotification({ message: "Please select a class and subject first.", type: 'warning' });
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
            const response = await updateStudentScores({
              studentId,
              subject: selectedSubject,
              term: 'Term 3',
              test1: parseFloat(studentMarks.test1) || 0,
              test2: parseFloat(studentMarks.test2) || 0,
              test3: parseFloat(studentMarks.test3) || 0,
              test4: parseFloat(studentMarks.test4) || 0,
              exam: parseFloat(studentMarks.exam) || 0
            });
            
            if (response.status === 'success') {
              successCount++;
              // Update saved students set
              setSavedStudents(prev => new Set(prev).add(studentId));
            } else {
              errorCount++;
            }
          } catch (error) {
            console.error(`Error saving marks for ${studentId}:`, error);
            errorCount++;
          }
        }
      });

      await Promise.all(promises);

      if (errorCount === 0) {
        showNotification({ message: `All marks saved successfully! (${successCount} students)`, type: 'success' });
      } else {
        showNotification({ message: `Saved ${successCount} students successfully. ${errorCount} failed.`, type: 'warning' });
      }

    } catch (error) {
      console.error("Save all marks error:", error);
      showNotification({ message: "Error saving marks: " + error.message, type: 'error' });
    } finally {
      setSaving(false);
      setShowScoresModal(false); // Close modal after saving
    }
  };

  // Save progress - save only the marks that have been entered
  const saveProgress = async () => {
    if (!selectedClass || !selectedSubject) {
      showNotification({ message: "Please select a class and subject first.", type: 'warning' });
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
      showNotification({ message: "No marks have been entered to save.", type: 'warning' });
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
            const response = await updateStudentScores({
              studentId,
              subject: selectedSubject,
              term: 'Term 3',
              test1: parseFloat(studentMarks.test1) || 0,
              test2: parseFloat(studentMarks.test2) || 0,
              test3: parseFloat(studentMarks.test3) || 0,
              test4: parseFloat(studentMarks.test4) || 0,
              exam: parseFloat(studentMarks.exam) || 0
            });
            
            if (response.status === 'success') {
              successCount++;
              // Update saved students set
              setSavedStudents(prev => new Set(prev).add(studentId));
            } else {
              errorCount++;
            }
          } catch (error) {
            console.error(`Error saving marks for ${studentId}:`, error);
            errorCount++;
          }
        }
      });

      await Promise.all(promises);

      if (errorCount === 0) {
        showNotification({ message: `Progress saved successfully! (${successCount} students)`, type: 'success' });
      } else {
        showNotification({ message: `Saved ${successCount} students successfully. ${errorCount} failed.`, type: 'warning' });
      }

    } catch (error) {
      console.error("Save progress error:", error);
      showNotification({ message: "Error saving progress: " + error.message, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // Print broadsheet - RESTRICTED TO ASSIGNED SUBJECTS ONLY
  const printBroadsheet = async () => {
    if (!selectedClass || !selectedSubject) {
      showNotification({ message: "Please select a class and subject first.", type: 'warning' });
      return;
    }

    // ✅ CHECK: Verify teacher is assigned to this subject
    if (!getUserSubjects().includes(selectedSubject)) {
      showNotification({
        message: "You can only print broadsheets for subjects you teach.",
        type: 'error'
      });
      return;
    }

    try {
      // Get school information
      const schoolInfo = printingService.getSchoolInfo();

      // Get teacher's full name
      const teacherName = user?.name || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Teacher';

      // Generate and download subject broadsheet
      const result = await printingService.printSubjectBroadsheet(
        selectedClass,
        selectedSubject,
        schoolInfo,
        teacherName, // Pass teacher's name
        settings.term // term from global settings
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

  // Get analytics data for the selected class and subject
  const getAnalyticsData = () => {
    if (!selectedClass || !selectedSubject) return null;

    // Get students with marks entered
    const studentsWithData = filteredLearners.filter(learner => {
      const studentId = learner.idNumber || learner.LearnerID;
      const studentMarks = marks[studentId] || {};
      const totals = calculateTotals(studentMarks);
      return totals.finalTotal > 0;
    });

    if (studentsWithData.length === 0) return null;

    // Calculate scores
    const scores = studentsWithData.map(learner => {
      const studentId = learner.idNumber || learner.LearnerID;
      const studentMarks = marks[studentId] || {};
      const totals = calculateTotals(studentMarks);
      return totals.finalTotal;
    });

    // Calculate statistics
    const highest = Math.max(...scores);
    const lowest = Math.min(...scores);
    const average = scores.reduce((a, b) => a + b, 0) / scores.length;

    // Calculate distribution
    const excellent = scores.filter(score => score >= 80).length;
    const good = scores.filter(score => score >= 70 && score < 80).length;
    const fair = scores.filter(score => score >= 60 && score < 70).length;
    const poor = scores.filter(score => score < 60).length;

    // Calculate score ranges for distribution chart
    const scoreRanges = [
      { range: '0-19', count: scores.filter(score => score >= 0 && score < 20).length },
      { range: '20-39', count: scores.filter(score => score >= 20 && score < 40).length },
      { range: '40-59', count: scores.filter(score => score >= 40 && score < 60).length },
      { range: '60-79', count: scores.filter(score => score >= 60 && score < 80).length },
      { range: '80-100', count: scores.filter(score => score >= 80 && score <= 100).length }
    ];

    // Mock trend data (in a real implementation, this would come from the API)
    const trend = {
      'First Term': { averageScore: 75.5 },
      'Second Term': { averageScore: 78.2 },
      'Third Term': { averageScore: 82.1 }
    };

    return {
      highest: highest.toFixed(1),
      lowest: lowest.toFixed(1),
      average: average.toFixed(1),
      totalStudents: studentsWithData.length,
      distribution: {
        excellent: Math.round((excellent / studentsWithData.length) * 100),
        good: Math.round((good / studentsWithData.length) * 100),
        fair: Math.round((fair / studentsWithData.length) * 100),
        poor: Math.round((poor / studentsWithData.length) * 100)
      },
      scoreRanges,
      trend
    };
  };



  // Load trend data when class and subject are selected
  useEffect(() => {
    if (selectedClass && selectedSubject) {
      loadTrendData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClass, selectedSubject]);

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
        <div className="glass-ultra rounded-lg p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white">Subject Teacher Dashboard</h1>
              <p className="text-white/90 mt-1 text-sm sm:text-base">Enter scores for your assigned subjects</p>
            </div>
            <button
              onClick={() => setShowChangePasswordModal(true)}
              className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
              style={{ minHeight: '44px' }}
            >
              <span>🔒</span>
              <span>Change Password</span>
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              SUBJECT TEACHER
            </span>
            {getUserSubjects().length > 0 && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                {getUserSubjects().length} Subject{getUserSubjects().length !== 1 ? 's' : ''}
              </span>
            )}
            {getUserClasses().length > 0 && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                {getUserClasses().length} Class{getUserClasses().length !== 1 ? 'es' : ''}
              </span>
            )}
          </div>
        </div>

        {/* No subjects warning */}
        {getUserSubjects().length === 0 && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
            <div className="flex">
              <div className="text-yellow-800">
                <p className="font-bold">No subjects assigned</p>
                <p>Please contact the administrator to assign subjects to your account.</p>
              </div>
            </div>
          </div>
        )}

        {/* Class & Subject Selection */}
        <div className="glass-ultra rounded-lg p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold mb-4 text-white">Enter Student Scores</h2>

          {/* Dropdowns Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-white mb-2">Select Class</label>
              <select
                className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium transition-all"
                style={{ minHeight: '44px', fontSize: '16px' }}
                value={selectedClass}
                onChange={e => setSelectedClass(e.target.value)}
              >
                <option value="" className="bg-white text-gray-900">Choose Class</option>
                {getUserClasses().map(cls => (
                  <option key={cls} value={cls} className="bg-white text-gray-900">{cls}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">Select Subject</label>
              <select
                className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium transition-all"
                style={{ minHeight: '44px', fontSize: '16px' }}
                value={selectedSubject}
                onChange={e => setSelectedSubject(e.target.value)}
              >
                <option value="" className="bg-white text-gray-900">Choose Subject</option>
                {getUserSubjects().map(sub => (
                  <option key={sub} value={sub} className="bg-white text-gray-900">{sub}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">Assessment Type</label>
              <select
                className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium transition-all"
                style={{ minHeight: '44px', fontSize: '16px' }}
                value={selectedAssessment}
                onChange={e => setSelectedAssessment(e.target.value)}
              >
                <option value="" className="bg-white text-gray-900">Choose Assessment</option>
                <option value="regular" className="bg-white text-gray-900">Regular Term Scores</option>
                {customAssessments.map(assessment => (
                  <option key={assessment.id} value={assessment.id} className="bg-white text-gray-900">
                    {assessment.name} ({assessment.max_score} marks)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Action Buttons Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <button
              className="w-full glass-button-primary px-4 py-3 rounded-xl text-white border-2 border-blue-400/50 hover:border-blue-400 hover:bg-white/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium shadow-lg"
              style={{ minHeight: '44px' }}
              onClick={() => setShowScoresModal(true)}
              disabled={!selectedClass || !selectedSubject || !selectedAssessment}
            >
              📝 Enter Scores
            </button>

            <button
              className="w-full glass-button px-4 py-3 rounded-xl text-white border-2 border-cyan-400/50 hover:border-cyan-400 hover:bg-white/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium shadow-lg"
              style={{ minHeight: '44px' }}
              onClick={fetchExistingMarks}
              disabled={loading || !selectedClass || !selectedSubject || !selectedAssessment}
              title="Load saved marks from database"
            >
              {loading ? '⏳ Loading...' : '📥 Load Marks'}
            </button>

            <button
              className="w-full glass-button px-4 py-3 rounded-xl text-white border-2 border-green-400/50 hover:border-green-400 hover:bg-white/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium shadow-lg"
              style={{ minHeight: '44px' }}
              onClick={printBroadsheet}
              disabled={!selectedClass || !selectedSubject || selectedAssessment !== 'regular'}
            >
              🖨️ Print
            </button>

            <button
              className={`w-full glass-button px-4 py-3 rounded-xl transition-all font-medium shadow-lg ${
                showAnalytics
                  ? "text-white border-2 border-purple-400 bg-white/30"
                  : "text-white border-2 border-white/30 hover:border-white/50 hover:bg-white/20"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              style={{ minHeight: '44px' }}
              onClick={() => setShowAnalytics(!showAnalytics)}
              disabled={!selectedClass || !selectedSubject}
            >
              📊 {showAnalytics ? "Hide Analytics" : "Show Analytics"}
            </button>

            <button
              className={`w-full glass-button px-4 py-3 rounded-xl transition-all font-medium shadow-lg ${
                showTrendAnalysis
                  ? "text-white border-2 border-indigo-400 bg-white/30"
                  : "text-white border-2 border-white/30 hover:border-white/50 hover:bg-white/20"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              style={{ minHeight: '44px' }}
              onClick={() => setShowTrendAnalysis(!showTrendAnalysis)}
              disabled={!selectedClass || !selectedSubject}
            >
              📈 {showTrendAnalysis ? "Hide Trends" : "Show Trends"}
            </button>
          </div>

          {/* Current Selection Info */}
          {selectedClass && selectedSubject && (
            <div className="mt-4 bg-white/10 border-2 border-white/30 rounded-xl p-4 backdrop-blur-md">
              <h3 className="font-semibold text-white text-sm sm:text-base">
                {selectedSubject} - {selectedClass}
              </h3>
              <p className="text-white/80 text-xs sm:text-sm mt-1">
                {filteredLearners.length} student{filteredLearners.length !== 1 ? 's' : ''} | Teacher: {user?.name}
              </p>
            </div>
          )}
        </div>

        {/* Analytics Dashboard */}
        {showAnalytics && (
          <div className="mt-6">
            <AnalyticsDashboard 
              analyticsData={getAnalyticsData()} 
              className={selectedClass} 
              subject={selectedSubject} 
            />
          </div>
        )}

        {/* Trend Analysis Section */}
        {showTrendAnalysis && selectedClass && selectedSubject && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white">Performance Trends</h2>
            
            {classTrendData ? (
              <TrendAnalysisChart 
                data={classTrendData} 
                title={`Class Performance Trend: ${selectedClass} - ${selectedSubject}`}
              />
            ) : (
              <div className="glass-ultra rounded-lg p-6">
                <div className="text-center py-8 text-white/70">
                  <p>Loading trend data...</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Scores Entry Modal */}
        {showScoresModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            {/* Frosted Glass Modal */}
            <div className="glass-card-golden rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border-2 border-white/30 shadow-2xl">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-white">📝 Enter Student Scores</h2>
                  <button
                    onClick={() => setShowScoresModal(false)}
                    className="text-4xl text-white/70 hover:text-white focus:outline-none transition-colors"
                  >
                    ✕
                  </button>
                </div>

                {/* Current Selection Info in Modal */}
                <div className="glass-ultra border border-white/30 rounded-xl p-4 mb-6 shadow-lg">
                  <h3 className="font-bold text-white text-lg">
                    {selectedSubject} - {selectedClass}
                  </h3>
                  <p className="text-white/80 text-sm mt-1">
                    {filteredLearners.length} students | Teacher: {user?.name}
                  </p>
                </div>

                {/* Marks Entry - Responsive Table/Card View */}
                {selectedClass && selectedSubject && filteredLearners.length > 0 ? (
                  <ResponsiveScoreEntry
                    learners={filteredLearners}
                    marks={marks}
                    onMarkChange={handleMarkChange}
                    onSaveStudent={saveStudentMarks}
                    savedStudents={savedStudents}
                    saving={saving}
                    calculateTotals={calculateTotals}
                    positions={positions}
                    getRemarks={getRemarks}
                    assessmentType={selectedAssessment === 'regular' ? 'regular' : 'custom'}
                    customAssessmentInfo={
                      selectedAssessment !== 'regular'
                        ? customAssessments.find(a => a.id === parseInt(selectedAssessment))
                        : null
                    }
                  />
                ) : selectedClass && selectedSubject ? (
                  <div className="text-center py-8 text-white/70">
                    <p>No students found in this class.</p>
                  </div>
                ) : (
                  <div className="text-center py-8 text-white/70">
                    <p>Please select a class and subject to view students.</p>
                  </div>
                )}

                {/* Grading Scale */}
                {selectedClass && selectedSubject && filteredLearners.length > 0 && (
                  <div className="mt-4 p-4 glass-ultra rounded-xl border border-white/30 shadow-lg">
                    <div className="overflow-x-auto">
                      <div className="text-xs text-white">
                        <strong>Grading Scale:</strong> 80-100: Excellent | 70-79: Very Good | 60-69: Good | 50-59: Satisfactory | 40-49: Fair | Below 40: Needs Improvement
                      </div>
                    </div>
                  </div>
                )}

                {/* Save All Button - Only for desktop */}
                {selectedClass && selectedSubject && filteredLearners.length > 0 && (
                  <div className="hidden md:block mt-6">
                    <div className="flex justify-end gap-4">
                      <button
                        onClick={saveProgress}
                        disabled={saving}
                        className="glass-button px-6 py-3 rounded-xl text-white border-2 border-green-400/50 hover:border-green-400 hover:bg-white/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium shadow-lg"
                      >
                        {saving ? 'Saving...' : '💾 Save Progress'}
                      </button>
                      <button
                        onClick={saveAllMarks}
                        disabled={saving}
                        className="glass-button-primary px-6 py-3 rounded-xl text-white border-2 border-blue-400/50 hover:border-blue-400 hover:bg-white/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium shadow-lg"
                      >
                        {saving ? 'Saving...' : '💾 Save All Marks'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Modal Action Buttons - Desktop only */}
                <div className="hidden md:flex mt-6 justify-end space-x-3">
                  <button
                    onClick={() => setShowScoresModal(false)}
                    className="glass-button px-4 py-2 border-2 border-white/30 rounded-xl text-white hover:border-white/50 hover:bg-white/20 transition-all font-medium shadow-lg"
                  >
                    ✕ Cancel
                  </button>
                  <button
                    onClick={saveProgress}
                    disabled={saving}
                    className="glass-button px-4 py-2 rounded-xl text-white border-2 border-green-400/50 hover:border-green-400 hover:bg-white/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium shadow-lg"
                  >
                    {saving ? "Saving..." : "💾 Save Progress"}
                  </button>
                  <button
                    onClick={saveAllMarks}
                    disabled={saving}
                    className="glass-button-primary px-4 py-2 rounded-xl text-white border-2 border-blue-400/50 hover:border-blue-400 hover:bg-white/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium shadow-lg"
                  >
                    {saving ? "Saving..." : "💾 Save All Marks"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Teacher Leaderboard - At Bottom */}
        <TeacherLeaderboard />
      </div>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
        userEmail={user?.email}
      />
    </Layout>
  );
};

export default SubjectTeacherPage;