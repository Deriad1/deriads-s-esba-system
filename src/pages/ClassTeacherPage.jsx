import Layout from "../components/Layout";
import { useState, useEffect, useMemo, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useNotification } from "../context/NotificationContext";
import { getLearners, updateFormMasterRemarks, getClassPerformanceTrends, updateStudentScores, getMarks, deleteMarks, getClasses, getSubjects, getClassSubjects } from '../api-client';
import PerformanceChart from "../components/PerformanceChart";
import TrendAnalysisChart from "../components/TrendAnalysisChart";
import printingService from "../services/printingService";
import TeacherLeaderboard from "../components/TeacherLeaderboard";
import ScoreEntryRow from "../components/ScoreEntryRow";
import ScoreEntryCard from "../components/ScoreEntryCard";
import PromoteStudentsModal from "../components/PromoteStudentsModal";
import { calculatePositions, calculateScoreDetails, getRemarksColorClass } from "../utils/gradeHelpers";
import { DEFAULT_TERM, AVAILABLE_TERMS } from "../constants/terms";
import { useGlobalSettings } from "../context/GlobalSettingsContext";

const ClassTeacherPage = () => {
  const { settings } = useGlobalSettings();
  const { user } = useAuth();
  const { showNotification } = useNotification();

  // Data normalization function for consistent keys
  const normalizeStudentData = (student) => ({
    id: student.id,
    idNumber: student.idNumber || student.id_number || student.LearnerID,
    firstName: student.firstName || student.first_name,
    lastName: student.lastName || student.last_name,
    className: student.className || student.class_name,
    gender: student.gender
  });

  const [learners, setLearners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [printing, setPrinting] = useState(false);
  // Load initial values from localStorage for persistence
  const [selectedClass, setSelectedClass] = useState(() => {
    return localStorage.getItem('classTeacher_selectedClass') || "";
  });
  const [isPromoteModalOpen, setIsPromoteModalOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(() => {
    return localStorage.getItem('classTeacher_selectedSubject') || "";
  });
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('classTeacher_activeTab') || "scores";
  });
  const [assessments, setAssessments] = useState([]); // Available assessments
  const [loadingAssessments, setLoadingAssessments] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState(null); // Selected assessment for score entry
  const [marks, setMarks] = useState({}); // For score entry
  const [savedStudents, setSavedStudents] = useState(new Set()); // Track saved scores
  const [formMasterData, setFormMasterData] = useState({}); // Consolidated: remarks, attitude, interest, comments, attendance
  const [vacationDate, setVacationDate] = useState(''); // Vacation date for reports
  const [reopeningDate, setReopeningDate] = useState(''); // Next term reopening date
  const [batchSaving, setBatchSaving] = useState(false); // Track batch save operation
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showTrendAnalysis, setShowTrendAnalysis] = useState(false); // New state for trend analysis
  const [classTrendData, setClassTrendData] = useState(null); // New state for trend data
  const [autoSaving, setAutoSaving] = useState(false); // Track auto-save status
  const [lastAutoSaved, setLastAutoSaved] = useState(null); // Track last auto-save time
  // State for all classes and subjects
  const [allClasses, setAllClasses] = useState([]);
  const [allSubjects, setAllSubjects] = useState([]);
  // Local term selection (overrides global setting)
  const [selectedTerm, setSelectedTerm] = useState(() => {
    return localStorage.getItem('classTeacher_selectedTerm') || settings.term || DEFAULT_TERM;
  });

  // Get all classes (not filtered by user)
  const getUserClasses = () => {
    return allClasses;
  };

  // Get all subjects (not filtered by user)
  const getUserSubjects = () => {
    return allSubjects;
  };

  // Load all classes and subjects on mount
  useEffect(() => {
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

  // Load trend data when class is selected
  useEffect(() => {
    if (selectedClass) {
      loadTrendData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClass]);

  const loadTrendData = async () => {
    try {
      // For form master, we'll show trends for a general subject like "Overall Performance"
      const response = await getClassPerformanceTrends(selectedClass, "Overall Performance");
      if (response.status === 'success') {
        setClassTrendData(response.data);
      }
    } catch (error) {
      console.error("Error loading trend data:", error);
    }
  };

  // Load assessments when assessments tab is selected and class is chosen
  useEffect(() => {
    if (activeTab === "assessments" && selectedClass) {
      loadAssessments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, selectedClass, settings.term]);

  const loadAssessments = async () => {
    setLoadingAssessments(true);
    try {
      const response = await fetch(`/api/assessments?term=${encodeURIComponent(settings.term || DEFAULT_TERM)}&className=${encodeURIComponent(selectedClass)}&active=true`);
      const data = await response.json();

      if (data.status === 'success') {
        setAssessments(data.data || []);
      } else {
        console.error('Failed to load assessments:', data.message);
        showNotification({
          type: "error",
          title: "Load Failed",
          message: "Could not load assessments"
        });
      }
    } catch (error) {
      console.error("Error loading assessments:", error);
      showNotification({
        type: "error",
        title: "Error",
        message: "Failed to fetch assessments"
      });
    } finally {
      setLoadingAssessments(false);
    }
  };

  useEffect(() => {
    // Clean up old localStorage cache on page load to prevent quota exceeded
    try {
      const now = Date.now();
      const TWO_MINUTES = 2 * 60 * 1000; // Reduced from 1 hour to 2 minutes
      let cleanedCount = 0;

      Object.keys(localStorage).forEach(key => {
        // Clean up old marks cache from all pages
        if (key.startsWith('marks_') || key.startsWith('classTeacher_marks_') || key.startsWith('subjectTeacher_')) {
          try {
            const cached = JSON.parse(localStorage.getItem(key));
            const age = now - (cached?.timestamp || 0);

            // Remove cache older than 2 minutes (more aggressive cleanup)
            if (!cached?.timestamp || age > TWO_MINUTES) {
              localStorage.removeItem(key);
              cleanedCount++;
            }
          } catch (e) {
            // Invalid cache entry, remove it
            localStorage.removeItem(key);
            cleanedCount++;
          }
        }
      });

      if (cleanedCount > 0) {
        console.log(`🧹 Cleaned up ${cleanedCount} old cache entries`);
      }
    } catch (e) {
      console.error('Error cleaning cache:', e);
      // Emergency fallback: clear all cache if there's an error
      if (e.name === 'QuotaExceededError') {
        console.warn('🚨 Emergency: Clearing all cache due to quota exceeded');
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('marks_') || key.startsWith('classTeacher_marks_') || key.startsWith('subjectTeacher_')) {
            try {
              localStorage.removeItem(key);
            } catch { }
          }
        });
      }
    }

    loadLearners();
  }, []);

  // Save selections to localStorage whenever they change
  useEffect(() => {
    if (selectedClass) {
      localStorage.setItem('classTeacher_selectedClass', selectedClass);
    }
  }, [selectedClass]);

  useEffect(() => {
    if (selectedSubject) {
      localStorage.setItem('classTeacher_selectedSubject', selectedSubject);
    }
  }, [selectedSubject]);

  useEffect(() => {
    if (activeTab) {
      localStorage.setItem('classTeacher_activeTab', activeTab);
    }
  }, [activeTab]);

  useEffect(() => {
    if (selectedTerm) {
      localStorage.setItem('classTeacher_selectedTerm', selectedTerm);
    }
  }, [selectedTerm]);

  // Save marks to localStorage whenever they change (with timestamp for cache invalidation)
  // Use a ref to debounce cache saves
  const cacheSaveTimeoutRef = useRef(null);

  useEffect(() => {
    // Clear any pending cache save
    if (cacheSaveTimeoutRef.current) {
      clearTimeout(cacheSaveTimeoutRef.current);
    }

    // Debounce cache saving to prevent excessive writes
    cacheSaveTimeoutRef.current = setTimeout(() => {
      if (Object.keys(marks).length > 0 && selectedClass && selectedSubject) {
        try {
          // Only cache marks that have actual values to reduce storage size
          const marksWithValues = {};
          Object.entries(marks).forEach(([studentId, studentMarks]) => {
            const hasValues = Object.values(studentMarks).some(val => val !== "" && val !== undefined && val !== null);
            if (hasValues) {
              marksWithValues[studentId] = studentMarks;
            }
          });

          // Only save if there are marks with values
          if (Object.keys(marksWithValues).length > 0) {
            const cacheKey = `classTeacher_marks_${selectedClass}_${selectedSubject}`;
            const cacheData = {
              marks: marksWithValues,
              savedStudents: Array.from(savedStudents),
              timestamp: Date.now(),
              term: selectedTerm
            };

            // Check cache size before saving (max 100KB)
            const cacheString = JSON.stringify(cacheData);
            const cacheSizeKB = new Blob([cacheString]).size / 1024;

            if (cacheSizeKB > 100) {
              console.warn(`⚠️ Cache too large (${cacheSizeKB.toFixed(1)}KB), skipping save`);
              return;
            }

            localStorage.setItem(cacheKey, cacheString);
          }
        } catch (e) {
          // Handle quota exceeded or other localStorage errors
          if (e.name === 'QuotaExceededError') {
            console.warn('🚨 localStorage quota exceeded - emergency cleanup');
            // Emergency: Clear ALL cache immediately
            Object.keys(localStorage).forEach(key => {
              if (key.startsWith('classTeacher_marks_') || key.startsWith('subjectTeacher_marks_') || key.startsWith('marks_')) {
                try {
                  localStorage.removeItem(key);
                } catch { }
              }
            });
          }
          console.error('Error saving marks to localStorage:', e);
        }
      }
    }, 1000); // Wait 1 second after last change before saving

    // Cleanup timeout on unmount
    return () => {
      if (cacheSaveTimeoutRef.current) {
        clearTimeout(cacheSaveTimeoutRef.current);
      }
    };
  }, [marks, savedStudents, selectedClass, selectedSubject, settings.term]);

  const loadLearners = async () => {
    setLoading(true);
    try {
      const response = await getLearners();
      if (response.status === 'success') {
        // Normalize student data for consistent keys
        const normalizedData = (response.data || []).map(normalizeStudentData);
        setLearners(normalizedData);
      } else {
        console.error('Learners error:', response.message);
        showNotification({
          type: "error",
          message: response.message || "Failed to load learners",
          duration: 7000
        });
      }
    } catch (error) {
      console.error("Error loading learners:", error);
      showNotification({
        type: "error",
        message: `Error loading learners: ${error.message}`,
        duration: 7000
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter learners for selected class - Memoized for performance
  const filteredLearners = useMemo(() => {
    return learners.filter(l => l.className === selectedClass);
  }, [learners, selectedClass]);

  // Auto-switch to scores tab when there's cached data on page load
  useEffect(() => {
    // Check if we have saved selections and cached marks
    if (selectedClass && selectedSubject) {
      const cacheKey = `classTeacher_marks_${selectedClass}_${selectedSubject}`;
      const cachedData = localStorage.getItem(cacheKey);

      if (cachedData) {
        try {
          const parsed = JSON.parse(cachedData);
          const cacheAge = Date.now() - parsed.timestamp;
          const CACHE_DURATION = 60 * 60 * 1000; // 1 hour for auto-switch

          // Auto-switch to scores tab if cache exists and is relatively recent
          if (cacheAge < CACHE_DURATION && Object.keys(parsed.marks || {}).length > 0) {
            console.log('📂 Auto-switching to scores tab with cached data');
            setActiveTab('scores');
          }
        } catch (e) {
          console.error('Error checking cached marks:', e);
        }
      }
    }
    // Only run on initial mount, not when selections change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array = run once on mount

  // Load marks from database when class/subject changes
  useEffect(() => {
    if (selectedClass && selectedSubject && filteredLearners.length > 0) {
      // Don't clear state immediately - let loadMarksFromDatabase handle it
      // This prevents showing empty state while data is loading
      loadMarksFromDatabase();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClass, selectedSubject, filteredLearners.length]);

  // Load saved marks from database
  const loadMarksFromDatabase = async () => {
    setLoading(true);
    try {
      // Check localStorage cache first for instant loading
      const cacheKey = `classTeacher_marks_${selectedClass}_${selectedSubject}`;
      const cachedData = localStorage.getItem(cacheKey);

      if (cachedData) {
        try {
          const parsed = JSON.parse(cachedData);
          const cacheAge = Date.now() - parsed.timestamp;
          const CACHE_DURATION = 2 * 60 * 1000; // Reduced from 5 minutes to 2 minutes

          // If cache is fresh and matches current term, use it immediately
          if (cacheAge < CACHE_DURATION && parsed.term === selectedTerm) {
            console.log('📦 Loading marks from cache (instant load)');
            setMarks(parsed.marks);
            setSavedStudents(new Set(parsed.savedStudents || []));
            // Still fetch from database in background to ensure data is up-to-date
          } else {
            // Cache expired, remove it
            localStorage.removeItem(cacheKey);
          }
        } catch (e) {
          console.error('Error parsing cached marks:', e);
          // Remove corrupted cache
          try {
            localStorage.removeItem(cacheKey);
          } catch { }
        }
      }

      const response = await getMarks(selectedClass, selectedSubject, selectedTerm);
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
        console.log(`📊 Processing ${response.data.length} marks from API/cache for subject: "${selectedSubject}"`);

        response.data.forEach(mark => {
          // Ensure we only process marks for the selected subject
          // This prevents "mirroring" if the API/cache returns mixed data
          // Use case-insensitive comparison with trimmed whitespace for robustness
          const markSubject = (mark.subject || '').trim().toLowerCase();
          const currentSubject = (selectedSubject || '').trim().toLowerCase();

          if (markSubject !== currentSubject) return;

          // API returns id_number field from the students table
          const studentId = mark.id_number || mark.student_id || mark.studentId;
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

      console.log('Loaded marks for', Object.keys(newMarks).length, 'students');
      console.log('Students with saved marks:', savedSet.size);

      // Show success notification
      if (savedSet.size > 0) {
        showNotification({
          type: "success",
          message: `Loaded marks for ${savedSet.size} student${savedSet.size > 1 ? 's' : ''}`,
          duration: 3000
        });
      } else {
        showNotification({
          type: "info",
          message: "No saved marks found for this class/subject",
          duration: 3000
        });
      }

      // Check for draft data after loading from database
      const draft = loadDraft(selectedClass, selectedSubject);
      if (draft && draft.marks) {
        // Ask user if they want to restore draft
        const hasDraftData = Object.keys(draft.marks).some(studentId => {
          const draftMarks = draft.marks[studentId];
          return draftMarks && Object.values(draftMarks).some(v => v && v.trim() !== "");
        });

        if (hasDraftData) {
          const draftTime = new Date(draft.timestamp);
          const timeDiff = (new Date() - draftTime) / 1000 / 60; // minutes

          if (timeDiff < 60) { // Only show if draft is less than 1 hour old
            showNotification({
              type: "info",
              message: `Found unsaved work from ${Math.round(timeDiff)} minutes ago. Restoring...`,
              duration: 5000
            });

            // Merge draft with database data (draft takes precedence)
            Object.keys(draft.marks).forEach(studentId => {
              if (newMarks[studentId]) {
                newMarks[studentId] = { ...newMarks[studentId], ...draft.marks[studentId] };
              }
            });
          }
        }
      }

      // Only update if database response is successful
      // This prevents overwriting cache with empty database response
      if (response.status === 'success') {
        setMarks(newMarks);

        // Merge with cached savedStudents to preserve the saved state
        setSavedStudents(prev => {
          const merged = new Set([...prev, ...savedSet]);
          return merged;
        });
      }
    } catch (error) {
      console.error("Error loading marks:", error);
      showNotification({
        type: "error",
        message: `Error loading saved marks: ${error.message}`,
        duration: 7000
      });
      // Still initialize with empty marks even if loading fails
      const newMarks = {};
      filteredLearners.forEach(learner => {
        const studentId = learner.idNumber || learner.LearnerID;
        newMarks[studentId] = {
          test1: "", test2: "", test3: "", test4: "", exam: ""
        };
      });
      setMarks(newMarks);
      setSavedStudents(new Set());
    } finally {
      setLoading(false);
    }
  };

  // Auto-save marks to localStorage when they change (debounced)
  useEffect(() => {
    if (!selectedClass || !selectedSubject) return;

    // Check if marks have any data
    const hasData = Object.keys(marks).some(studentId => {
      const studentMarks = marks[studentId];
      return studentMarks && Object.values(studentMarks).some(v => v && v.trim() !== "");
    });

    if (hasData) {
      // Debounce auto-save by 1 second
      const timeoutId = setTimeout(() => {
        autoSaveMarks(marks, selectedClass, selectedSubject);
      }, 1000);

      return () => clearTimeout(timeoutId);
    }
  }, [marks, selectedClass, selectedSubject]);

  // Initialize form master data when class changes
  useEffect(() => {
    if (selectedClass && filteredLearners.length > 0) {
      const newFormMasterData = {};
      filteredLearners.forEach(learner => {
        const key = learner.idNumber;
        newFormMasterData[key] = {
          remarks: "",
          attitude: "",
          interest: "",
          comments: "",
          attendance: ""
        };
      });
      setFormMasterData(newFormMasterData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClass, filteredLearners.length]);

  const handleRemarkChange = (studentId, value) => {
    setFormMasterData(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        remarks: value
      }
    }));
  };

  const handleAttitudeChange = (studentId, value) => {
    setFormMasterData(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        attitude: value
      }
    }));
  };

  const handleInterestChange = (studentId, value) => {
    setFormMasterData(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        interest: value
      }
    }));
  };

  const handleCommentsChange = (studentId, value) => {
    setFormMasterData(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        comments: value
      }
    }));
  };

  const handleAttendanceChange = (studentId, value) => {
    // Allow only numbers
    if (value && !/^\d*$/.test(value)) return;

    setFormMasterData(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        attendance: value
      }
    }));
  };

  const handleAttendanceTotalChange = (studentId, value) => {
    // Allow only numbers
    if (value && !/^\d*$/.test(value)) return;

    setFormMasterData(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        attendanceTotal: value
      }
    }));
  };

  // Auto-save marks to localStorage
  const autoSaveMarks = (marksData, className, subject) => {
    if (!className || !subject) return;

    const draftKey = `marks_draft_${className}_${subject}`;
    try {
      setAutoSaving(true);
      localStorage.setItem(draftKey, JSON.stringify({
        marks: marksData,
        timestamp: new Date().toISOString(),
        className,
        subject
      }));
      setLastAutoSaved(new Date());

      // Clear auto-saving indicator after a short delay
      setTimeout(() => setAutoSaving(false), 500);
    } catch (error) {
      console.error('Error auto-saving marks:', error);
      setAutoSaving(false);
    }
  };

  // Load draft from localStorage
  const loadDraft = (className, subject) => {
    if (!className || !subject) return null;

    const draftKey = `marks_draft_${className}_${subject}`;
    try {
      const draftData = localStorage.getItem(draftKey);
      if (draftData) {
        return JSON.parse(draftData);
      }
    } catch (error) {
      console.error('Error loading draft:', error);
    }
    return null;
  };

  // Clear draft from localStorage
  const clearDraft = (className, subject) => {
    if (!className || !subject) return;

    const draftKey = `marks_draft_${className}_${subject}`;
    try {
      localStorage.removeItem(draftKey);
      setLastAutoSaved(null);
    } catch (error) {
      console.error('Error clearing draft:', error);
    }
  };

  // Handle mark changes for score entry
  const handleMarkChange = (studentId, field, value) => {
    // Only allow numbers (including decimals)
    if (value && !/^\d*\.?\d*$/.test(value)) return;

    setMarks(prev => {
      const newMarks = {
        ...prev,
        [studentId]: {
          ...prev[studentId],
          [field]: value
        }
      };

      // Auto-save after mark change (debounced via useEffect)
      return newMarks;
    });
  };

  // Calculate total for a student
  const calculateTotal = (studentId) => {
    const studentMarks = marks[studentId];
    if (!studentMarks) return "";

    // Class work: 4 tests × 15 marks each = 60 total, converted to 50
    const test1 = parseFloat(studentMarks.test1) || 0;
    const test2 = parseFloat(studentMarks.test2) || 0;
    const test3 = parseFloat(studentMarks.test3) || 0;
    const test4 = parseFloat(studentMarks.test4) || 0;
    const testsTotal = test1 + test2 + test3 + test4;
    const classScore50 = (testsTotal / 60) * 50; // Convert 60 marks to 50%

    // Exam: 100 marks converted to 50
    const exam = parseFloat(studentMarks.exam) || 0;
    const examScore50 = exam * 0.5; // Convert 100 marks to 50%

    // Total out of 100
    const total = classScore50 + examScore50;
    return total.toFixed(1);
  };

  // Save scores for a student
  const saveStudentScores = async (studentId) => {
    if (!selectedClass || !selectedSubject) {
      showNotification({
        type: "error",
        message: "Please select both class and subject.",
        duration: 5000
      });
      return;
    }

    const studentMarks = marks[studentId];
    if (!studentMarks) return;

    // Validate that at least one field is filled
    const hasData = Object.values(studentMarks).some(v => v && v.trim() !== "");
    if (!hasData) {
      showNotification({
        type: "error",
        message: "Please enter at least one score before saving.",
        duration: 5000
      });
      return;
    }

    setSaving(true);
    try {
      // Calculate score details including grade and remarks
      const scoreDetails = calculateScoreDetails(studentMarks);

      // Calculate position - we need all students' scores for this
      const allStudentsWithScores = filteredLearners.map(learner => {
        const lid = learner.idNumber;
        const lmarks = marks[lid] || {};
        const lscoreDetails = calculateScoreDetails(lmarks);
        return {
          studentId: lid,
          total: lscoreDetails.total
        };
      });
      const studentsWithPositions = calculatePositions(allStudentsWithScores, 'total');
      const currentStudentPosition = studentsWithPositions.find(s => s.studentId === studentId)?.position || null;

      const response = await updateStudentScores({
        studentId,
        className: selectedClass,
        subject: selectedSubject,
        term: selectedTerm,
        test1: studentMarks.test1 || "0",
        test2: studentMarks.test2 || "0",
        test3: studentMarks.test3 || "0",
        test4: studentMarks.test4 || "0",
        ca1: (parseFloat(studentMarks.test1) || 0) + (parseFloat(studentMarks.test2) || 0),
        ca2: (parseFloat(studentMarks.test3) || 0) + (parseFloat(studentMarks.test4) || 0),
        exam: studentMarks.exam || "0",
        total: scoreDetails.total.toString(),
        grade: scoreDetails.grade,
        remark: scoreDetails.remarks,
        position: currentStudentPosition
      });

      if (response.status === 'success') {
        setSavedStudents(prev => new Set([...prev, studentId]));
        // Clear draft for this student after successful save
        clearDraft(selectedClass, selectedSubject);
        showNotification({
          type: "success",
          message: `Scores saved successfully for ${selectedSubject}!`,
          duration: 5000
        });
      } else {
        showNotification({
          type: "error",
          message: `Error saving scores: ${response.message}`,
          duration: 7000
        });
      }
    } catch (error) {
      console.error("Save scores error:", error);
      showNotification({
        type: "error",
        message: `Error saving scores: ${error.message}`,
        duration: 7000
      });
    } finally {
      setSaving(false);
    }
  };

  // Save all scores for all students (Batch Save)
  const saveAllScores = async () => {
    if (!selectedClass || !selectedSubject) {
      showNotification({
        type: "error",
        message: "Please select both class and subject.",
        duration: 5000
      });
      return;
    }

    // Get students with unsaved changes
    const studentsToSave = filteredLearners.filter(learner => {
      const studentId = learner.idNumber;
      const studentMarks = marks[studentId];
      if (!studentMarks) return false;

      // Check if student has any marks entered
      return Object.values(studentMarks).some(v => v && v.trim() !== "");
    });

    if (studentsToSave.length === 0) {
      showNotification({
        type: "error",
        message: "No scores to save. Please enter scores first.",
        duration: 5000
      });
      return;
    }

    setBatchSaving(true);
    let successCount = 0;
    let errorCount = 0;

    showNotification({
      type: "info",
      message: `Saving scores for ${studentsToSave.length} students...`,
      duration: 3000
    });

    try {
      // Calculate positions for all students first
      const allStudentsWithScores = studentsToSave.map(learner => {
        const lid = learner.idNumber;
        const lmarks = marks[lid] || {};
        const lscoreDetails = calculateScoreDetails(lmarks);
        return {
          studentId: lid,
          total: lscoreDetails.total
        };
      });
      const studentsWithPositions = calculatePositions(allStudentsWithScores, 'total');

      const promises = studentsToSave.map(async (learner) => {
        const studentId = learner.idNumber;
        const studentMarks = marks[studentId];

        try {
          // Calculate score details
          const scoreDetails = calculateScoreDetails(studentMarks);
          const studentPosition = studentsWithPositions.find(s => s.studentId === studentId)?.position || null;

          const response = await updateStudentScores({
            studentId,
            className: selectedClass,
            subject: selectedSubject,
            term: selectedTerm,
            test1: studentMarks.test1 || "0",
            test2: studentMarks.test2 || "0",
            test3: studentMarks.test3 || "0",
            test4: studentMarks.test4 || "0",
            ca1: (parseFloat(studentMarks.test1) || 0) + (parseFloat(studentMarks.test2) || 0),
            ca2: (parseFloat(studentMarks.test3) || 0) + (parseFloat(studentMarks.test4) || 0),
            exam: studentMarks.exam || "0",
            total: scoreDetails.total.toString(),
            grade: scoreDetails.grade,
            remark: scoreDetails.remarks,
            position: studentPosition
          });

          if (response.status === 'success') {
            successCount++;
            setSavedStudents(prev => new Set([...prev, studentId]));
          } else {
            errorCount++;
          }
        } catch (error) {
          console.error(`Error saving scores for ${studentId}:`, error);
          errorCount++;
        }
      });

      await Promise.all(promises);

      if (errorCount === 0) {
        // Clear draft after successful batch save
        clearDraft(selectedClass, selectedSubject);
        showNotification({
          type: "success",
          message: `All scores saved successfully! (${successCount} students)`,
          duration: 5000
        });
      } else {
        showNotification({
          type: "error",
          message: `Saved ${successCount} students successfully. ${errorCount} failed.`,
          duration: 7000
        });
      }
    } catch (error) {
      console.error("Batch save error:", error);
      showNotification({
        type: "error",
        message: `Error saving scores: ${error.message}`,
        duration: 7000
      });
    } finally {
      setBatchSaving(false);
    }
  };

  // Clear all marks for the selected class, subject, and term
  const clearMarks = async () => {
    if (!selectedClass || !selectedSubject || !selectedTerm) {
      showNotification({
        type: "error",
        message: "Please select class, subject, and term first.",
        duration: 5000
      });
      return;
    }

    // Confirm deletion
    const confirmed = window.confirm(
      `⚠️ WARNING: This will permanently delete ALL marks for:\n\n` +
      `Class: ${selectedClass}\n` +
      `Subject: ${selectedSubject}\n` +
      `Term: ${selectedTerm}\n\n` +
      `This action CANNOT be undone!\n\n` +
      `Are you sure you want to continue?`
    );

    if (!confirmed) return;

    setBatchSaving(true);
    try {
      const response = await deleteMarks(selectedClass, selectedSubject, selectedTerm);

      if (response.status === 'success') {
        // Clear local state
        const emptyMarks = {};
        filteredLearners.forEach(learner => {
          const studentId = learner.idNumber;
          emptyMarks[studentId] = {
            test1: "", test2: "", test3: "", test4: "", exam: ""
          };
        });
        setMarks(emptyMarks);
        setSavedStudents(new Set());

        // Clear cache
        const cacheKey = `classTeacher_marks_${selectedClass}_${selectedSubject}`;
        localStorage.removeItem(cacheKey);
        clearDraft(selectedClass, selectedSubject);

        showNotification({
          type: "success",
          message: response.message || `Marks cleared successfully for ${selectedSubject}!`,
          duration: 5000
        });
      } else {
        showNotification({
          type: "error",
          message: `Error clearing marks: ${response.message}`,
          duration: 7000
        });
      }
    } catch (error) {
      console.error("Clear marks error:", error);
      showNotification({
        type: "error",
        message: `Error clearing marks: ${error.message}`,
        duration: 7000
      });
    } finally {
      setBatchSaving(false);
    }
  };


  // Save all remarks and attendance
  const saveAllData = async () => {
    if (!selectedClass) {
      showNotification({
        type: "error",
        message: "Please select a class first.",
        duration: 5000
      });
      return;
    }

    setSaving(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      const promises = filteredLearners.map(async (learner) => {
        const displayId = learner.idNumber; // For UI tracking (e.g., "eSBA026")
        const databaseId = learner.id; // For database operations (integer)
        const studentData = formMasterData[displayId];

        // Save if student has any data OR if vacation dates are set (need to save them for at least one student)
        const hasStudentData = studentData && (studentData.remarks || studentData.attendance || studentData.attitude || studentData.interest || studentData.comments);
        const hasTermDates = (vacationDate || reopeningDate);

        if (hasStudentData || hasTermDates) {
          try {
            const response = await updateFormMasterRemarks({
              studentId: databaseId, // Use database ID for API
              className: selectedClass,
              term: selectedTerm,
              academicYear: settings.academicYear || `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`,
              remarks: studentData?.remarks || "",
              attendance: studentData?.attendance || "",
              attendanceTotal: studentData?.attendanceTotal || "", // Total school days
              attitude: studentData?.attitude || "",
              interest: studentData?.interest || "",
              comments: studentData?.comments || "",
              vacationDate: vacationDate || "",
              reopeningDate: reopeningDate || ""
            });

            if (response.status === 'success') {
              successCount++;
            } else {
              errorCount++;
            }
          } catch (error) {
            console.error(`Error saving data for ${displayId}:`, error);
            errorCount++;
          }
        }
      });

      await Promise.all(promises);

      if (errorCount === 0) {
        showNotification({
          type: "success",
          message: `All data saved successfully! (${successCount} students)`,
          duration: 5000
        });
      } else {
        showNotification({
          type: "error",
          message: `Saved ${successCount} students successfully. ${errorCount} failed.`,
          duration: 7000
        });
      }

    } catch (error) {
      console.error("Save all data error:", error);
      showNotification({
        type: "error",
        message: `Error saving data: ${error.message}`,
        duration: 7000
      });
    } finally {
      setSaving(false);
    }
  };

  // Get analytics data for the selected class
  const getAnalyticsData = () => {
    if (!selectedClass) return null;

    // Get students with data entered
    const studentsWithData = filteredLearners.filter(learner => {
      const studentId = learner.idNumber;
      const studentData = formMasterData[studentId];
      return studentData &&
        ((studentData.remarks && studentData.remarks.trim() !== "") ||
          (studentData.attendance && studentData.attendance.trim() !== "") ||
          (studentData.attitude && studentData.attitude.trim() !== "") ||
          (studentData.interest && studentData.interest.trim() !== "") ||
          (studentData.comments && studentData.comments.trim() !== ""));
    });

    if (studentsWithData.length === 0) return null;

    // Calculate attendance statistics
    let totalAttendance = 0;
    let attendanceRecords = 0;

    studentsWithData.forEach(learner => {
      const studentId = learner.idNumber;
      const studentData = formMasterData[studentId];
      if (studentData && studentData.attendance && studentData.attendance.trim() !== "") {
        const attendanceValue = parseInt(studentData.attendance);
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
  };

  const analyticsData = getAnalyticsData();

  // 1. Print Student Terminal Reports (Individual reports for all students)
  const printStudentReports = async () => {
    if (!selectedClass) {
      showNotification({
        type: "error",
        message: "Please select a class first",
        duration: 5000
      });
      return;
    }
    if (filteredLearners.length === 0) {
      showNotification({
        type: "error",
        message: "No students found in this class",
        duration: 5000
      });
      return;
    }
    setPrinting(true);
    showNotification({
      type: "info",
      message: "Generating student reports...",
      duration: 3000
    });
    try {
      const schoolInfo = printingService.getSchoolInfo();

      // DEBUG: Check subjects count before printing
      const subjectsResponse = await getClassSubjects(selectedClass);
      const subjectCount = subjectsResponse.data?.subjects?.length || 0;
      showNotification({
        type: "info",
        message: `Generating reports... Found ${subjectCount} subjects for ${selectedClass}. (v1.1)`,
        duration: 4000
      });

      const result = await printingService.printBulkStudentReportsServerSide(
        filteredLearners,
        selectedTerm, // Use selected term
        schoolInfo,
        (progress) => console.log(`Printing progress: ${progress}%`)
      );
      if (result.success) {
        showNotification({
          type: "success",
          message: result.message,
          duration: 5000
        });
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error("Error printing student reports:", error);
      showNotification({
        type: "error",
        message: `Error printing student reports: ${error.message}`,
        duration: 7000
      });
    } finally {
      setPrinting(false);
    }
  };

  // 2. Print Subject Broadsheet (One subject, all students)
  const printSubjectBroadsheet = async () => {
    if (!selectedClass) {
      showNotification({
        type: "error",
        message: "Please select a class first",
        duration: 5000
      });
      return;
    }
    if (!selectedSubject) {
      showNotification({
        type: "error",
        message: "Please select a subject first",
        duration: 5000
      });
      return;
    }
    setPrinting(true);
    showNotification({
      type: "info",
      message: "Generating subject broadsheet...",
      duration: 3000
    });
    try {
      const schoolInfo = printingService.getSchoolInfo();
      // Get current teacher's name for the broadsheet
      const teacherName = user?.firstName && user?.lastName
        ? `${user.firstName} ${user.lastName}`
        : user?.name || '';

      const result = await printingService.printSubjectBroadsheet(
        selectedClass,
        selectedSubject,
        schoolInfo,
        teacherName,
        selectedTerm // Use selected term
      );
      if (result.success) {
        showNotification({
          type: "success",
          message: result.message,
          duration: 5000
        });
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error("Error printing subject broadsheet:", error);
      showNotification({
        type: "error",
        message: `Error printing subject broadsheet: ${error.message}`,
        duration: 7000
      });
    } finally {
      setPrinting(false);
    }
  };

  // 3. Print Complete Class Broadsheet (All subjects, all students)
  const printClassBroadsheet = async () => {
    if (!selectedClass) {
      showNotification({
        type: "error",
        message: "Please select a class first",
        duration: 5000
      });
      return;
    }
    setPrinting(true);
    showNotification({
      type: "info",
      message: "Generating class broadsheet...",
      duration: 3000
    });
    try {
      const schoolInfo = printingService.getSchoolInfo();
      const result = await printingService.printCompleteClassBroadsheet(
        selectedClass,
        schoolInfo,
        selectedTerm // Use selected term
      );
      if (result.success) {
        showNotification({
          type: "success",
          message: result.message,
          duration: 5000
        });
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error("Error printing class broadsheet:", error);
      showNotification({
        type: "error",
        message: `Error printing class broadsheet: ${error.message}`,
        duration: 7000
      });
    } finally {
      setPrinting(false);
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
        <div className="glass-strong p-4 sm:p-6 rounded-lg shadow-xl">
          <h1 className="text-xl sm:text-2xl font-bold text-white">Class Teacher Dashboard</h1>
          <p className="text-white/80 mt-1 text-sm sm:text-base">Enter scores for subjects you teach and manage your class</p>

          <div className="mt-4 flex flex-wrap gap-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              CLASS TEACHER
            </span>
            {getUserClasses().length > 0 && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                {getUserClasses().length} Class{getUserClasses().length !== 1 ? 'es' : ''}
              </span>
            )}
            {getUserSubjects().length > 0 && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                {getUserSubjects().length} Subject{getUserSubjects().length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        {/* No classes warning */}
        {getUserClasses().length === 0 && (
          <div className="glass-light border-l-4 border-yellow-400 p-4 rounded-lg">
            <div className="flex">
              <div className="text-white">
                <p className="font-bold">No classes assigned</p>
                <p>Please contact the administrator to assign classes to your account.</p>
              </div>
            </div>
          </div>
        )}

        {/* Class & Subject Selection */}
        <div className="glass-medium p-4 sm:p-6 rounded-lg shadow-lg">
          <h2 className="text-base sm:text-lg font-semibold mb-4 text-white">Manage Your Class</h2>

          {/* Class Selection Cards */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-white/90 mb-3">📚 Select Class</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {getUserClasses().map(cls => (
                <button
                  key={cls}
                  onClick={() => setSelectedClass(cls)}
                  className={`px-4 py-3 rounded-lg font-medium transition-all text-sm ${selectedClass === cls
                    ? 'bg-blue-500 text-white border-2 border-blue-400 shadow-lg scale-105'
                    : 'bg-white/10 text-white/90 border-2 border-white/20 hover:bg-white/20 hover:border-white/40 hover:scale-102'
                    }`}
                  style={{ minHeight: '48px', touchAction: 'manipulation' }}
                >
                  {cls}
                </button>
              ))}
            </div>
            {getUserClasses().length === 0 && (
              <p className="text-white/60 text-sm italic">No classes available</p>
            )}
          </div>

          {/* Term Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-white/90 mb-3">📅 Select Term</label>
            <div className="grid grid-cols-3 gap-2">
              {AVAILABLE_TERMS.map(term => (
                <button
                  key={term}
                  onClick={() => setSelectedTerm(term)}
                  className={`px-4 py-3 rounded-lg font-medium transition-all text-sm ${selectedTerm === term
                    ? 'bg-green-500 text-white border-2 border-green-400 shadow-lg scale-105'
                    : 'bg-white/10 text-white/90 border-2 border-white/20 hover:bg-white/20 hover:border-white/40 hover:scale-102'
                    }`}
                  style={{ minHeight: '48px', touchAction: 'manipulation' }}
                >
                  {term}
                </button>
              ))}
            </div>
          </div>

          {/* Subject Selection Cards */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-white/90 mb-3">
              📖 Select Subject {!selectedClass && <span className="text-white/50 text-xs">(Select a class first)</span>}
            </label>
            <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 ${!selectedClass ? 'opacity-50 pointer-events-none' : ''}`}>
              {getUserSubjects().map(subj => (
                <button
                  key={subj}
                  onClick={() => setSelectedSubject(subj)}
                  disabled={!selectedClass}
                  className={`px-3 py-3 rounded-lg font-medium transition-all text-xs sm:text-sm ${selectedSubject === subj
                    ? 'bg-purple-500 text-white border-2 border-purple-400 shadow-lg scale-105'
                    : 'bg-white/10 text-white/90 border-2 border-white/20 hover:bg-white/20 hover:border-white/40 hover:scale-102 disabled:opacity-50 disabled:cursor-not-allowed'
                    }`}
                  style={{ minHeight: '48px', touchAction: 'manipulation' }}
                >
                  {subj}
                </button>
              ))}
            </div>
            {getUserSubjects().length === 0 && (
              <p className="text-white/60 text-sm italic">No subjects available</p>
            )}
          </div>

          {/* Tabs for switching between Score Entry and Remarks */}
          {selectedClass && (
            <div className="mb-6">
              {/* Tabs Navigation */}
              <div className="flex gap-2 overflow-x-auto border-b border-white/20 pb-0 mb-4 scrollbar-hide">
                <button
                  onClick={() => setActiveTab("scores")}
                  className={`px-3 py-2 font-medium transition-colors whitespace-nowrap text-xs sm:text-sm ${activeTab === "scores"
                    ? "text-blue-400 border-b-2 border-blue-400 bg-white/10"
                    : "text-white/70 hover:text-white hover:bg-white/5"
                    }`}
                  style={{ minHeight: '40px' }}
                >
                  📊 Enter Scores
                </button>
                <button
                  onClick={() => setActiveTab("remarks")}
                  className={`px-3 py-2 font-medium transition-colors whitespace-nowrap text-xs sm:text-sm ${activeTab === "remarks"
                    ? "text-blue-400 border-b-2 border-blue-400 bg-white/10"
                    : "text-white/70 hover:text-white hover:bg-white/5"
                    }`}
                  style={{ minHeight: '40px' }}
                >
                  📝 Remarks
                </button>
                <button
                  onClick={() => setActiveTab("assessments")}
                  className={`px-3 py-2 font-medium transition-colors whitespace-nowrap text-xs sm:text-sm ${activeTab === "assessments"
                    ? "text-blue-400 border-b-2 border-blue-400 bg-white/10"
                    : "text-white/70 hover:text-white hover:bg-white/5"
                    }`}
                  style={{ minHeight: '40px' }}
                >
                  📋 Assessments
                </button>
              </div>

              {/* Action Buttons - Separate Row for Scores Tab */}
              {activeTab === "scores" && selectedSubject && (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10">
                  {/* Subject indicator */}
                  <div className="flex-1 text-white/90 text-sm font-medium">
                    Subject: <span className="text-blue-300">{selectedSubject}</span>
                  </div>

                  {/* Auto-save indicator */}
                  {(autoSaving || lastAutoSaved) && (
                    <div className="text-xs text-white/70 flex items-center gap-1">
                      {autoSaving ? (
                        <>
                          <svg className="animate-spin h-3 w-3 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <svg className="h-3 w-3 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span>Saved {lastAutoSaved && `${Math.round((new Date() - lastAutoSaved) / 1000)}s ago`}</span>
                        </>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={loadMarksFromDatabase}
                      disabled={loading || !selectedClass || !selectedSubject}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors font-medium text-sm flex items-center gap-1"
                      title="Load saved marks from database"
                    >
                      {loading ? "⏳ Loading..." : "📥 Load"}
                    </button>

                    <button
                      onClick={saveAllScores}
                      disabled={batchSaving || !selectedClass || !selectedSubject}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors font-medium text-sm flex items-center gap-1"
                    >
                      {batchSaving ? "⏳ Saving..." : "💾 Save All"}
                    </button>

                    <button
                      onClick={clearMarks}
                      disabled={batchSaving || !selectedClass || !selectedSubject}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors font-medium text-sm flex items-center gap-1"
                      title="Delete all marks for this class, subject, and term"
                    >
                      {batchSaving ? "⏳ Clearing..." : "🗑️ Clear Marks"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Selected Assessment Indicator */}
          {selectedAssessment && activeTab === "scores" && (
            <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-l-4 border-blue-600 rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-white/90">Custom Assessment Selected:</p>
                  <p className="text-lg font-bold text-white">{selectedAssessment.name}</p>
                  <div className="flex gap-2 mt-1">
                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                      {selectedAssessment.assessment_type}
                    </span>
                    <span className="text-xs px-2 py-1 bg-purple-100 text-purple-800 rounded">
                      Max Score: {selectedAssessment.max_score}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedAssessment(null);
                    showNotification({
                      type: "info",
                      title: "Standard Assessment",
                      message: "Switched back to standard assessment (4 tests + exam)"
                    });
                  }}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                >
                  ✕ Use Standard Assessment
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons Row */}
          {selectedClass && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 mb-6">

              {/* Save Button */}
              <button
                className="w-full glass-button-primary px-4 py-3 rounded-xl text-white border-2 border-blue-400/50 hover:border-blue-400 hover:bg-white/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium shadow-lg"
                style={{ minHeight: '44px', fontSize: '16px' }}
                onClick={saveAllData}
                disabled={saving || !selectedClass}
              >
                {saving ? "Saving..." : "💾 Save All Data"}
              </button>

              {/* Print Student Reports */}
              <button
                className="w-full glass-button px-4 py-3 rounded-xl text-white border-2 border-purple-400/50 hover:border-purple-400 hover:bg-white/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium shadow-lg"
                style={{ minHeight: '44px', fontSize: '16px' }}
                onClick={printStudentReports}
                disabled={printing || !selectedClass}
                title="Print individual terminal reports for all students"
              >
                {printing ? "⏳ Printing..." : "📄 Student Reports"}
              </button>

              {/* Print Subject Broadsheet */}
              <button
                className="w-full glass-button px-4 py-3 rounded-xl text-white border-2 border-orange-400/50 hover:border-orange-400 hover:bg-white/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium shadow-lg"
                style={{ minHeight: '44px', fontSize: '16px' }}
                onClick={printSubjectBroadsheet}
                disabled={printing || !selectedClass || !selectedSubject}
                title="Print broadsheet for selected subject only"
              >
                {printing ? "⏳ Printing..." : "📊 Subject Sheet"}
              </button>

              {/* Print Class Broadsheet */}
              <button
                className="w-full glass-button px-4 py-3 rounded-xl text-white border-2 border-green-400/50 hover:border-green-400 hover:bg-white/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium shadow-lg"
                style={{ minHeight: '44px', fontSize: '16px' }}
                onClick={printClassBroadsheet}
                disabled={printing || !selectedClass}
                title="Print complete broadsheet with all subjects"
              >
                {printing ? "⏳ Printing..." : "📋 Class Sheet"}
              </button>

              <button
                className={`w-full glass-button px-4 py-3 rounded-xl transition-all font-medium shadow-lg ${showAnalytics
                  ? "text-white border-2 border-purple-400 bg-white/30"
                  : "text-white border-2 border-white/30 hover:border-white/50 hover:bg-white/20"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                style={{ minHeight: '44px', fontSize: '16px' }}
                onClick={() => setShowAnalytics(!showAnalytics)}
                disabled={!selectedClass}
              >
                {showAnalytics ? "📉 Hide Analytics" : "📈 Show Analytics"}
              </button>

              {/* Promote Students Button */}
              <button
                className="w-full glass-button px-4 py-3 rounded-xl text-white border-2 border-emerald-400/50 hover:border-emerald-400 hover:bg-white/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold shadow-lg"
                style={{ minHeight: '44px', fontSize: '16px' }}
                onClick={() => setIsPromoteModalOpen(true)}
                disabled={!selectedClass}
                title="Promote students to next class"
              >
                📈 Promote Students
              </button>

              {/* Trend Analysis Button */}
              <button
                className={`w-full glass-button px-4 py-3 rounded-xl transition-all font-medium shadow-lg ${showTrendAnalysis
                  ? "text-white border-2 border-indigo-400 bg-white/30"
                  : "text-white border-2 border-white/30 hover:border-white/50 hover:bg-white/20"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                style={{ minHeight: '44px', fontSize: '16px' }}
                onClick={() => setShowTrendAnalysis(!showTrendAnalysis)}
                disabled={!selectedClass}
              >
                {showTrendAnalysis ? "📉 Hide Trends" : "📊 Show Trends"}
              </button>
            </div>
          )}

          {/* Current Selection Info */}
          {selectedClass && (
            <div className="glass-light border border-blue-300/50 rounded-lg p-4 mb-6 shadow-md">
              <h3 className="font-bold text-white text-shadow text-base sm:text-lg">
                Class: {selectedClass}
              </h3>
              <p className="text-white/90 text-xs sm:text-sm text-shadow">
                {filteredLearners.length} students | Class Teacher: {user?.name}
              </p>
            </div>
          )}

          {/* Analytics Section */}
          {showAnalytics && selectedClass && (
            <div className="space-y-6 mt-6">
              <h2 className="text-lg sm:text-xl font-bold text-white text-shadow">Class Analytics</h2>

              {analyticsData ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Summary Stats */}
                  <div className="glass-ultra rounded-lg p-4 sm:p-6">
                    <h3 className="text-base sm:text-lg font-bold mb-4 text-white text-shadow">Attendance Summary</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="glass-ultra-light border border-blue-200/50 rounded-lg p-4 text-center">
                        <div className="text-3xl font-bold text-blue-600">{analyticsData.totalStudents}</div>
                        <div className="text-white/90 font-medium">Students with Data</div>
                      </div>
                      <div className="glass-ultra-light border border-green-200/50 rounded-lg p-4 text-center">
                        <div className="text-3xl font-bold text-green-600">{analyticsData.averageAttendance}</div>
                        <div className="text-white/90 font-medium">Average Attendance</div>
                      </div>
                      <div className="glass-ultra-light border border-purple-200/50 rounded-lg p-4 text-center">
                        <div className="text-3xl font-bold text-purple-600">{analyticsData.attendanceRecords}</div>
                        <div className="text-white/90 font-medium">Attendance Records</div>
                      </div>
                    </div>
                  </div>

                  {/* Attendance Visualization */}
                  <PerformanceChart
                    data={[
                      { label: 'Students with Data', value: analyticsData.totalStudents },
                      { label: 'Attendance Records', value: analyticsData.attendanceRecords }
                    ]}
                    title="Data Completion"
                    type="pie"
                  />
                </div>
              ) : (
                <div className="glass-ultra rounded-lg p-6">
                  <div className="text-center py-8 text-white/80">
                    <p>No data available for analytics. Please enter student data first.</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Trend Analysis Section */}
          {showTrendAnalysis && selectedClass && (
            <div className="space-y-6 mt-6">
              <h2 className="text-lg sm:text-xl font-bold text-white">Class Performance Trends</h2>

              {classTrendData ? (
                <div className="grid grid-cols-1 gap-6">
                  <TrendAnalysisChart
                    data={classTrendData}
                    title={`Class Performance Trend: ${selectedClass}`}
                  />
                </div>
              ) : (
                <div className="glass-ultra rounded-lg p-6">
                  <div className="text-center py-8 text-white/80">
                    <p>Loading trend data...</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Score Entry Table - shown when activeTab === "scores" */}
          {activeTab === "scores" && selectedClass && filteredLearners.length > 0 && (
            <>
              {!selectedSubject ? (
                <div className="glass-light border-2 border-yellow-400/60 rounded-lg p-4 mb-6 shadow-lg">
                  <p className="text-white font-medium">
                    ⚠️ Please select a subject above to enter scores for your students.
                  </p>
                </div>
              ) : (
                <div className="glass-card-golden">
                  <h3 className="text-lg sm:text-xl font-bold mb-6 text-white">
                    📊 Enter Scores for {selectedSubject}
                  </h3>

                  {/* Desktop Table View - Hidden on Mobile */}
                  <div className="hidden md:block overflow-x-auto rounded-lg border-2 border-yellow-500/30">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 border-b-2 border-yellow-500/30">
                          <th className="p-4 text-left font-bold text-white">Student Name</th>
                          {selectedAssessment && selectedAssessment.assessment_type !== 'standard' ? (
                            // Custom Assessment - Single Score Field
                            <>
                              <th className="p-4 text-center font-bold text-white">
                                Score<br />
                                <span className="text-xs font-normal text-white/80">
                                  /{selectedAssessment.max_score}
                                </span>
                              </th>
                              <th className="p-4 text-center font-bold text-white">POS</th>
                              <th className="p-4 text-center font-bold text-white">REMARKS</th>
                              <th className="p-4 text-center font-bold text-white">Action</th>
                            </>
                          ) : (
                            // Standard Assessment - Full Score Entry
                            <>
                              <th className="p-4 text-center font-bold text-white">Test 1<br /><span className="text-xs font-normal text-white/80">/15</span></th>
                              <th className="p-4 text-center font-bold text-white">Test 2<br /><span className="text-xs font-normal text-white/80">/15</span></th>
                              <th className="p-4 text-center font-bold text-white">Test 3<br /><span className="text-xs font-normal text-white/80">/15</span></th>
                              <th className="p-4 text-center font-bold text-white">Test 4<br /><span className="text-xs font-normal text-white/80">/15</span></th>
                              <th className="p-4 text-center font-bold text-white">Exam<br /><span className="text-xs font-normal text-white/80">/100</span></th>
                              <th className="p-4 text-center font-bold text-white">Total<br /><span className="text-xs font-normal text-white/80">/100</span></th>
                              <th className="p-4 text-center font-bold text-white">POS</th>
                              <th className="p-4 text-center font-bold text-white">REMARKS</th>
                              <th className="p-4 text-center font-bold text-white">Action</th>
                            </>
                          )}
                        </tr>
                      </thead>
                      <tbody className="bg-white/90">
                        {(() => {
                          // Calculate scores and positions for all students
                          const isCustomAssessment = selectedAssessment && selectedAssessment.assessment_type !== 'standard';

                          const studentsWithScores = filteredLearners.map(learner => {
                            const studentId = learner.idNumber;
                            const studentMarks = marks[studentId] || {};

                            let totalScore, remarks;

                            if (isCustomAssessment) {
                              // Custom assessment - use the total field directly
                              totalScore = parseFloat(studentMarks.total) || 0;
                              // Calculate remark based on percentage of max score
                              const percentage = (totalScore / parseFloat(selectedAssessment.max_score)) * 100;
                              if (percentage >= 80) remarks = 'EXCELLENT';
                              else if (percentage >= 70) remarks = 'VERY GOOD';
                              else if (percentage >= 60) remarks = 'GOOD';
                              else if (percentage >= 45) remarks = 'Credit';
                              else if (percentage >= 35) remarks = 'PASS';
                              else remarks = 'WEAK';
                            } else {
                              // Standard assessment - calculate from tests and exam
                              const scoreDetails = calculateScoreDetails(studentMarks);
                              totalScore = scoreDetails.total;
                              remarks = scoreDetails.remark;
                            }

                            return {
                              ...learner,
                              studentId,
                              marks: studentMarks,
                              total: totalScore,
                              remarks: remarks
                            };
                          });

                          // Calculate positions based on total scores
                          const studentsWithPositions = calculatePositions(studentsWithScores, 'total');

                          // Render rows
                          return studentsWithPositions.map(student => {
                            const isSaved = savedStudents.has(student.studentId);
                            const studentName = `${student.firstName} ${student.lastName}`;

                            return (
                              <ScoreEntryRow
                                key={student.studentId}
                                studentId={student.studentId}
                                studentName={studentName}
                                marks={student.marks}
                                isSaved={isSaved}
                                position={student.position}
                                remarks={student.remarks}
                                onMarkChange={handleMarkChange}
                                onSave={saveStudentScores}
                                saving={saving}
                                selectedAssessment={selectedAssessment}
                              />
                            );
                          });
                        })()}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Card View - Hidden on Desktop */}
                  <div className="block md:hidden">
                    {/* Mobile Header with Close Button */}
                    <div className="sticky top-0 z-10 glass-strong rounded-xl p-4 mb-4 shadow-lg border border-white/20">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="text-base font-bold text-white">
                            📝 Entering Scores
                          </h4>
                          <p className="text-xs text-white/80 mt-1">
                            {filteredLearners.length} students • {selectedSubject}
                          </p>
                        </div>
                        <button
                          onClick={() => setSelectedSubject("")}
                          className="ml-3 px-4 py-2 bg-red-500/90 hover:bg-red-600 text-white rounded-lg font-semibold transition-all shadow-lg active:scale-95"
                          style={{ minHeight: '44px', fontSize: '16px' }}
                        >
                          ✕ Close
                        </button>
                      </div>
                    </div>

                    {/* Student Cards */}
                    <div className="space-y-4">
                      {(() => {
                        // Calculate scores and positions for all students (same logic as table)
                        const isCustomAssessment = selectedAssessment && selectedAssessment.assessment_type !== 'standard';

                        const studentsWithScores = filteredLearners.map(learner => {
                          const studentId = learner.idNumber;
                          const studentMarks = marks[studentId] || {};

                          let totalScore, remarks;

                          if (isCustomAssessment) {
                            totalScore = parseFloat(studentMarks.total) || 0;
                            const percentage = (totalScore / parseFloat(selectedAssessment.max_score)) * 100;
                            if (percentage >= 80) remarks = 'EXCELLENT';
                            else if (percentage >= 70) remarks = 'VERY GOOD';
                            else if (percentage >= 60) remarks = 'GOOD';
                            else if (percentage >= 45) remarks = 'Credit';
                            else if (percentage >= 35) remarks = 'PASS';
                            else remarks = 'WEAK';
                          } else {
                            const scoreDetails = calculateScoreDetails(studentMarks);
                            totalScore = scoreDetails.total;
                            remarks = scoreDetails.remark;
                          }

                          return {
                            ...learner,
                            studentId,
                            marks: studentMarks,
                            total: totalScore,
                            remarks: remarks
                          };
                        });

                        const studentsWithPositions = calculatePositions(studentsWithScores, 'total');

                        // Render cards
                        return studentsWithPositions.map(student => {
                          const isSaved = savedStudents.has(student.studentId);
                          const studentName = `${student.firstName} ${student.lastName}`;

                          return (
                            <ScoreEntryCard
                              key={student.studentId}
                              studentId={student.studentId}
                              studentName={studentName}
                              marks={student.marks}
                              isSaved={isSaved}
                              position={student.position}
                              remarks={student.remarks}
                              onMarkChange={handleMarkChange}
                              onSave={saveStudentScores}
                              saving={saving}
                              selectedAssessment={selectedAssessment}
                            />
                          );
                        });
                      })()}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Remarks and Attendance Entry Table - shown when activeTab === "remarks" */}
          {activeTab === "remarks" && selectedClass && filteredLearners.length > 0 && (
            <div className="glass-card-golden">
              <h3 className="text-lg sm:text-xl font-bold mb-6 text-white">
                📝 Class Remarks & Attendance
              </h3>

              {/* Term Dates Section */}
              <div className="mb-6 p-4 bg-white/10 rounded-lg border border-yellow-500/30">
                <h4 className="text-md font-bold mb-4 text-white">📅 Term Dates</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="vacationDate" className="block text-sm font-medium text-white mb-2">
                      Vacation Date
                    </label>
                    <input
                      type="date"
                      id="vacationDate"
                      value={vacationDate}
                      onChange={(e) => setVacationDate(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 bg-white text-gray-900"
                    />
                    <p className="text-xs text-white/70 mt-1">
                      Will appear on student reports
                    </p>
                  </div>
                  <div>
                    <label htmlFor="reopeningDate" className="block text-sm font-medium text-white mb-2">
                      Next Term Begins
                    </label>
                    <input
                      type="date"
                      id="reopeningDate"
                      value={reopeningDate}
                      onChange={(e) => setReopeningDate(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 bg-white text-gray-900"
                    />
                    <p className="text-xs text-white/70 mt-1">
                      Will appear on student reports
                    </p>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto rounded-lg border-2 border-yellow-500/30">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 border-b-2 border-yellow-500/30">
                      <th className="p-4 text-left font-bold text-white">Student Name</th>
                      <th className="p-4 text-center font-bold text-white">Days Present</th>
                      <th className="p-4 text-center font-bold text-white">Total Days</th>
                      <th className="p-4 text-left font-bold text-white">Remarks</th>
                      <th className="p-4 text-left font-bold text-white">Attitude</th>
                      <th className="p-4 text-left font-bold text-white">Interest</th>
                      <th className="p-4 text-left font-bold text-white">Comments</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white/90">
                    {filteredLearners.map(learner => {
                      const studentId = learner.idNumber;
                      const studentData = formMasterData[studentId] || {};

                      return (
                        <tr key={studentId} className="border-b border-gray-200/50 hover:bg-yellow-50/50 transition-colors">
                          <td className="p-4 font-semibold text-gray-900">
                            {learner.firstName} {learner.lastName}
                          </td>

                          <td className="p-2 text-center">
                            <input
                              type="text"
                              value={studentData.attendance || ''}
                              onChange={(e) => handleAttendanceChange(studentId, e.target.value)}
                              className="w-20 p-2 border-2 border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all"
                              placeholder="45"
                              maxLength="3"
                            />
                          </td>

                          <td className="p-2 text-center">
                            <input
                              type="text"
                              value={studentData.attendanceTotal || ''}
                              onChange={(e) => handleAttendanceTotalChange(studentId, e.target.value)}
                              className="w-20 p-2 border-2 border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all"
                              placeholder="50"
                              maxLength="3"
                            />
                          </td>

                          <td className="p-2">
                            <select
                              value={studentData.remarks || ''}
                              onChange={(e) => handleRemarkChange(studentId, e.target.value)}
                              className="w-full p-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all"
                            >
                              <option value="">Select remark</option>
                              <option value="RESPECTFUL">RESPECTFUL</option>
                              <option value="WELL-BEHAVED">WELL-BEHAVED</option>
                              <option value="DISRESPECTFUL">DISRESPECTFUL</option>
                              <option value="CALM">CALM</option>
                              <option value="HUMBLE">HUMBLE</option>
                              <option value="APPROACHABLE">APPROACHABLE</option>
                              <option value="BULLY">BULLY</option>
                              <option value="TRUANT">TRUANT</option>
                            </select>
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              list={`attitude-options-${studentId}`}
                              value={studentData.attitude || ""}
                              onChange={(e) => handleAttitudeChange(studentId, e.target.value)}
                              className="w-full p-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all"
                              placeholder="Select or type attitude"
                            />
                            <datalist id={`attitude-options-${studentId}`}>
                              <option value="HARDWORKING" />
                              <option value="DEPENDABLE" />
                              <option value="NOT SERIOUS IN CLASS" />
                              <option value="LAZY" />
                              <option value="SLOW" />
                            </datalist>
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              list={`interest-options-${studentId}`}
                              value={studentData.interest || ""}
                              onChange={(e) => handleInterestChange(studentId, e.target.value)}
                              className="w-full p-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all"
                              placeholder="Select or type interest"
                            />
                            <datalist id={`interest-options-${studentId}`}>
                              <option value="SPORTS" />
                              <option value="READING" />
                              <option value="DRUMMING" />
                              <option value="SINGING" />
                            </datalist>
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              list={`comments-options-${studentId}`}
                              value={studentData.comments || ""}
                              onChange={(e) => handleCommentsChange(studentId, e.target.value)}
                              className="w-full p-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all"
                              placeholder="Select or type comments"
                            />
                            <datalist id={`comments-options-${studentId}`}>
                              <option value="Has Improved" />
                              <option value="Keep it up!" />
                              <option value="More room For Improvement" />
                              <option value="Hardworking" />
                              <option value="Must Buck-Up" />
                            </datalist>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Save Button for Remarks */}
              <div className="mt-6 flex justify-end">
                <button
                  onClick={saveAllData}
                  disabled={saving}
                  className="glass-button-primary px-6 py-3 rounded-xl text-white border-2 border-blue-400/50 hover:border-blue-400 hover:bg-white/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium shadow-lg"
                  style={{ minHeight: '44px', fontSize: '16px' }}
                >
                  {saving ? "Saving..." : "💾 Save All Remarks & Attendance"}
                </button>
              </div>
            </div>
          )}

          {/* Assessments Tab - shown when activeTab === "assessments" */}
          {activeTab === "assessments" && selectedClass && (
            <div className="glass-card-golden">
              <h3 className="text-lg sm:text-xl font-bold mb-6 text-white">
                📋 Available Assessments for {selectedClass}
              </h3>

              {loadingAssessments ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  <p className="mt-4 text-white/80">Loading assessments...</p>
                </div>
              ) : assessments.length === 0 ? (
                <div className="text-center py-12 text-white/80">
                  <svg className="mx-auto h-12 w-12 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="mt-4 font-medium">No assessments available</p>
                  <p className="mt-2 text-sm">Contact your administrator to create custom assessments like midterm or mock exams.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {assessments.map((assessment) => (
                    <div
                      key={assessment.id}
                      className="glass-light border border-white/20 rounded-lg p-4 sm:p-6 hover:shadow-xl transition-all hover:border-white/40"
                    >
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                        <div className="flex-1">
                          <h4 className="text-base sm:text-lg font-semibold text-white mb-2">
                            {assessment.name}
                          </h4>
                          {assessment.description && (
                            <p className="text-sm text-white/80 mb-3">{assessment.description}</p>
                          )}
                          <div className="flex flex-wrap gap-3 text-sm">
                            <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-800">
                              📝 {assessment.assessment_type || 'Standard'}
                            </span>
                            <span className="inline-flex items-center px-3 py-1 rounded-full bg-purple-100 text-purple-800">
                              📅 {assessment.term}
                            </span>
                            <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-800">
                              🎯 Max: {assessment.max_score} marks
                            </span>
                            {assessment.start_date && (
                              <span className="inline-flex items-center px-3 py-1 rounded-full bg-orange-100 text-orange-800">
                                🗓️ {new Date(assessment.start_date).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                          {assessment.applicable_subjects && assessment.applicable_subjects.length > 0 && (
                            <div className="mt-3">
                              <p className="text-xs text-white/70 mb-1">Applicable Subjects:</p>
                              <div className="flex flex-wrap gap-2">
                                {assessment.applicable_subjects.map((subject, idx) => (
                                  <span key={idx} className="text-xs px-2 py-1 bg-gray-100 text-white rounded">
                                    {subject}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="w-full sm:w-auto sm:ml-4">
                          <button
                            onClick={() => {
                              setSelectedAssessment(assessment);
                              setActiveTab("scores");
                              showNotification({
                                type: "success",
                                title: "Assessment Selected",
                                message: `Now entering scores for: ${assessment.name}`
                              });
                            }}
                            className="w-full sm:w-auto px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                            style={{ minHeight: '44px', fontSize: '16px' }}
                          >
                            📝 Enter Scores
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* No students message */}
          {selectedClass && filteredLearners.length === 0 && activeTab !== "assessments" && (
            <div className="text-center py-8 text-white">
              <p>No students found in {selectedClass}</p>
            </div>
          )}

          {/* No class selected message */}
          {!selectedClass && (
            <div className="text-center py-8 text-white">
              <p>Please select a class above to begin entering scores or managing student data</p>
            </div>
          )}
        </div>

        {/* Teacher Leaderboard - At Bottom */}
        <TeacherLeaderboard />

        {/* Promote Students Modal */}
        {isPromoteModalOpen && (
          <PromoteStudentsModal
            isOpen={isPromoteModalOpen}
            onClose={() => setIsPromoteModalOpen(false)}
            students={filteredLearners.filter(l => {
              // Class Teacher can only promote students from their assigned classes
              const assignedClasses = getUserClasses();
              return assignedClasses.includes(l.className);
            })}
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

export default ClassTeacherPage;