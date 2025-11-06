import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { getTeachers, getLearners, testConnection, getClasses, getStudentsByClass, getSubjects, getAllMarksForAnalytics, updateTeacher, getClassSubjects } from '../api-client';
import Layout from "../components/Layout";
import printingService from "../services/printingService";
import LoadingSpinner from "../components/LoadingSpinner";
import { useModalManager } from "../hooks/useModalManager";
import { useNotification } from "../context/NotificationContext";
import { useGlobalSettings } from "../context/GlobalSettingsContext";
import RoleSwitcher from "../components/RoleSwitcher";

// ✅ PERFORMANCE FIX: Lazy load heavy modals to reduce initial bundle size
// These modals contain heavy libraries (jsPDF, XLSX, charts) that should only
// load when the user actually opens the modal

const BulkUploadModal = lazy(() => import("../components/BulkUploadModal"));
const PrintReportModal = lazy(() => import("../components/modals/PrintReportModal"));
const AnalyticsDashboardModal = lazy(() => import("../components/AnalyticsDashboardModal"));
const ClassManagementModal = lazy(() => import("../components/ClassManagementModal"));
const TeacherSubjectAssignment = lazy(() => import("../components/TeacherSubjectAssignment"));
const EditTeacherModal = lazy(() => import("../components/modals/EditTeacherModal"));
const TeachersManagementModal = lazy(() => import("../components/modals/TeachersManagementModal"));
const PromoteStudentsModal = lazy(() => import("../components/PromoteStudentsModal"));
const ClassBasedPromotionModal = lazy(() => import("../components/ClassBasedPromotionModal"));
const ClassPromotionWithStudents = lazy(() => import("../components/ClassPromotionWithStudents"));
const AdminSettingsPanel = lazy(() => import("../components/AdminSettingsPanel"));
const ArchiveViewer = lazy(() => import("../components/ArchiveViewerEnhanced"));
const AssessmentsManagementModal = lazy(() => import("../components/AssessmentsManagementModal"));

const DEFAULT_CLASSES = [
  "KG1", "KG2", "BS1", "BS2", "BS3", "BS4", "BS5", "BS6", "BS7", "BS8", "BS9", "BS10", "BS11", "BS12"
];

const DEFAULT_SUBJECTS = [
  // KG Subjects
  "Literacy",
  "Numeracy",
  "Our World and Our People",
  // Primary Subjects
  "English Language",
  "Mathematics",
  "Science",
  "Integrated Science",
  "History",
  "Our World Our People",
  "Creative Arts",
  "Religious and Moral Education (R.M.E.)",
  "Ghanaian Language",
  "Physical Education",
  // Upper Primary & JHS Subjects
  "Social Studies",
  "Computing",
  "French",
  // JHS Specific
  "Ghanaian Language and Culture",
  "Basic Design and Technology (B.D.T.)"
];

const AdminDashboardPage = () => {
  const { settings } = useGlobalSettings();
  const { showNotification } = useNotification();
  const [teachers, setTeachers] = useState([]);
  const [learners, setLearners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [allSubjects, setAllSubjects] = useState([]);
  const [analyticsData, setAnalyticsData] = useState(null);

  // Print section states
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [classStudents, setClassStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [printing, setPrinting] = useState(false);
  const [classSubjects, setClassSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState("");

  // Selected teacher for editing
  const [selectedTeacher, setSelectedTeacher] = useState(null);

  // Modal manager for all modals
  const {
    openModal,
    closeModal,
    isModalOpen,
  } = useModalManager([
    'teachersList',
    'analyticsDashboard',
    'bulkUpload',
    'classManagement',
    'teacherSubjectAssignment',
    'print',
    'editTeacher',
    'promoteStudents',
    'classPromotionWithStudents',
    'adminSettings',
    'archiveViewer',
    'assessments'
  ]);

  // ✅ FIXED: Wrap functions in useCallback to prevent infinite re-renders
  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      console.log('Testing API connection...');
      try {
        const testResult = await testConnection();
        console.log('✅ Connection test successful:', testResult);
      } catch (testError) {
        console.warn('⚠️ Connection test failed:', testError.message);
        setError(`Backend API updated! Using new endpoint: ${testError.message}`);
      }

      const [teachersResponse, learnersResponse] = await Promise.all([
        getTeachers(),
        getLearners()
      ]);

      if (teachersResponse && teachersResponse.status === 'success') {
        setTeachers(teachersResponse.data || []);
        setError("");
      } else {
        setError(`Teachers: ${teachersResponse?.message || 'Loading...'}`);
      }

      if (learnersResponse && learnersResponse.status === 'success') {
        setLearners(learnersResponse.data || []);
      } else {
        setError(prev => `${prev} | Students: ${learnersResponse?.message || 'Loading...'}`);
      }
    } catch (error) {
      // ✅ FIXED: Proper error handling instead of silent catch
      console.error("❌ Error loading data:", error);
      setError(`Failed to load data: ${error.message || 'Unknown error'}`);

      // Show user-friendly notification
      if (error.message?.includes('API')) {
        setError("Unable to connect to the server. Please check your connection and try again.");
      }
    } finally {
      setLoading(false);
    }
  }, []); // Empty deps - only needs setters which are stable

  const loadClasses = useCallback(async () => {
    try {
      const classesResponse = await getClasses();
      if (classesResponse.status === 'success') {
        // Only use classes from the database - don't merge with DEFAULT_CLASSES
        // This ensures deleted classes actually disappear from the UI
        const dbClasses = (classesResponse.data || []).map(cls => cls.name || cls);
        const sortedClasses = [...new Set(dbClasses)].sort((a, b) => a.localeCompare(b, undefined, {numeric: true}));
        setClasses(sortedClasses);
      }
    } catch (error) {
      console.error("Error loading classes:", error);
    }
  }, []);

  const loadAllSubjects = useCallback(async () => {
    try {
      const subjectsResponse = await getSubjects();
      if (subjectsResponse.status === 'success') {
        const dbSubjects = (subjectsResponse.data || []).map(subj => subj.name || subj);
        const allAvailableSubjects = [...new Set([...DEFAULT_SUBJECTS, ...dbSubjects])].sort();
        setAllSubjects(allAvailableSubjects);
      }
    } catch (error) {
      console.error("Error loading all subjects:", error);
    }
  }, []); // Empty deps - only needs setters which are stable

  // ✅ FIXED: Load data on mount with proper memoized dependencies
  useEffect(() => {
    loadData();
    loadClasses();
    loadAllSubjects();
  }, [loadData, loadClasses, loadAllSubjects]);

  const loadAnalyticsData = async () => {
    try {
      const marksResponse = await getAllMarksForAnalytics();
      if (marksResponse.status === 'success' && marksResponse.data) {
        const marks = marksResponse.data;

        const studentTotals = marks.map(record => {
          // ✅ VALIDATION FIX: Clamp values to valid ranges
          const test1 = Math.max(0, Math.min(15, parseFloat(record.test1) || 0));
          const test2 = Math.max(0, Math.min(15, parseFloat(record.test2) || 0));
          const test3 = Math.max(0, Math.min(15, parseFloat(record.test3) || 0));
          const test4 = Math.max(0, Math.min(15, parseFloat(record.test4) || 0));
          const exam = Math.max(0, Math.min(100, parseFloat(record.exam) || 0));

          const testsTotal = test1 + test2 + test3 + test4;
          const classScore = (testsTotal / 60) * 50;
          const examScore = (exam / 100) * 50;
          const totalScore = classScore + examScore;

          return {
            ...record,
            totalScore,
            classScore,
            examScore
          };
        });

        const scores = studentTotals.map(s => s.totalScore);
        const highestScore = scores.length > 0 ? Math.max(...scores) : 0;
        // ✅ BUG FIX: lowestScore should be 0 when no scores, not 100
        const lowestScore = scores.length > 0 ? Math.min(...scores) : 0;
        const averageScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

        const excellentCount = scores.filter(s => s >= 90).length;
        const veryGoodCount = scores.filter(s => s >= 80 && s < 90).length;
        const goodCount = scores.filter(s => s >= 70 && s < 80).length;
        const satisfactoryCount = scores.filter(s => s >= 60 && s < 70).length;
        const fairCount = scores.filter(s => s >= 50 && s < 60).length;
        const needsImprovementCount = scores.filter(s => s < 50).length;

        const uniqueStudents = [...new Set(marks.map(m => m.student_id))];

        const studentAverages = uniqueStudents.map(studentId => {
          const studentRecords = studentTotals.filter(r => r.student_id === studentId);
          const avgScore = studentRecords.reduce((sum, r) => sum + r.totalScore, 0) / studentRecords.length;
          const record = studentRecords[0];
          return {
            name: `${record.first_name} ${record.last_name}`,
            score: Math.round(avgScore)
          };
        }).sort((a, b) => b.score - a.score).slice(0, 3);

        const analytics = {
          highestScore: Math.round(highestScore),
          averageScore: Math.round(averageScore),
          lowestScore: Math.round(lowestScore),
          totalStudents: uniqueStudents.length,
          excellentCount,
          veryGoodCount,
          goodCount,
          satisfactoryCount,
          fairCount,
          needsImprovementCount,
          performanceData: [
            { name: 'Excellent (90-100)', value: excellentCount },
            { name: 'Very Good (80-89)', value: veryGoodCount },
            { name: 'Good (70-79)', value: goodCount },
            { name: 'Satisfactory (60-69)', value: satisfactoryCount },
            { name: 'Fair (50-59)', value: fairCount },
            { name: 'Needs Improvement (0-49)', value: needsImprovementCount }
          ],
          topPerformers: studentAverages
        };

        setAnalyticsData(analytics);
      }
    } catch (error) {
      console.error("Error loading analytics data:", error);
    }
  };

  const handleTeacherUpdate = async (updatedTeacherData) => {
    try {
      const apiTeacherData = {
        id: updatedTeacherData.id,
        firstName: updatedTeacherData.firstName || updatedTeacherData.first_name,
        lastName: updatedTeacherData.lastName || updatedTeacherData.last_name,
        email: updatedTeacherData.email,
        gender: updatedTeacherData.gender || 'male',
        teachingLevel: updatedTeacherData.teachingLevel || updatedTeacherData.teaching_level || 'PRIMARY',
        subjects: updatedTeacherData.subjects || [],
        classes: updatedTeacherData.classes || [],
        primaryRole: updatedTeacherData.primaryRole ||
                    (updatedTeacherData.all_roles && updatedTeacherData.all_roles.length > 0
                     ? updatedTeacherData.all_roles[0]
                     : 'Subject Teacher'),
        all_roles: updatedTeacherData.all_roles || ['Subject Teacher'],
        classAssigned: updatedTeacherData.classAssigned || updatedTeacherData.class_assigned || null,
        form_class: updatedTeacherData.form_class || null
      };

      console.log('Sending teacher update data:', apiTeacherData);

      await updateTeacher(apiTeacherData);
      showNotification({
        type: 'success',
        title: 'Success',
        message: 'Teacher updated successfully!'
      });
      closeModal('editTeacher');
      setSelectedTeacher(null);
      loadData();
    } catch (error) {
      console.error("Error updating teacher:", error);
      showNotification({
        type: 'error',
        title: 'Update Failed',
        message: `Error updating teacher: ${error.message}`
      });
    }
  };

  const handleOpenEditTeacherModal = (teacher) => {
    setSelectedTeacher(teacher);
    openModal('editTeacher');
  };

  const handleClassChange = async (className) => {
    setSelectedClass(className);
    if (className) {
      try {
        // Fetch both students and subjects for the class
        const [studentsResponse, subjectsResponse] = await Promise.all([
          getStudentsByClass(className),
          getClassSubjects(className)
        ]);

        // Handle students response
        if (studentsResponse.status === 'success') {
          const students = studentsResponse.data || [];
          setClassStudents(students);
          setSelectedStudents([]);

          // Show notification if no students found
          if (students.length === 0) {
            showNotification({
              type: 'info',
              title: 'No Students Found',
              message: `No students found in class ${className}. Please add students to this class first.`
            });
          }
        } else {
          // API returned an error status
          showNotification({
            type: 'error',
            title: 'Error Loading Students',
            message: studentsResponse.message || 'Failed to load students for this class'
          });
          setClassStudents([]);
        }

        // Handle subjects response
        if (subjectsResponse.status === 'success') {
          const subjects = subjectsResponse.data || [];
          setClassSubjects(subjects);

          // Log for debugging
          console.log(`Subjects for ${className}:`, subjects);

          // Show info if no subjects found
          if (subjects.length === 0) {
            console.log(`No subjects with marks found for ${className}. Students may not have marks entered yet.`);
          }
        } else {
          console.error('Error loading class subjects:', subjectsResponse);
          setClassSubjects([]);
        }
      } catch (error) {
        console.error("Error loading class data:", error);
        showNotification({
          type: 'error',
          title: 'Error Loading Class Data',
          message: `Failed to load class data: ${error.message}`
        });
        setClassStudents([]);
        setClassSubjects([]);
      }
    } else {
      setClassStudents([]);
      setSelectedStudents([]);
      setClassSubjects([]);
    }
  };

  const handleStudentSelection = (studentId) => {
    setSelectedStudents(prev => {
      if (prev.includes(studentId)) {
        return prev.filter(id => id !== studentId);
      } else {
        return [...prev, studentId];
      }
    });
  };

  const handleSelectAllStudents = () => {
    if (selectedStudents.length === classStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(classStudents.map(student => student.id));
    }
  };

  const handleBulkUploadSuccess = () => {
    closeModal('bulkUpload');
    loadData();
  };

  const printClassReports = async () => {
    if (!selectedClass) {
      showNotification({
        type: 'warning',
        title: 'Selection Required',
        message: 'Please select a class first'
      });
      return;
    }

    setPrinting(true);
    try {
      const schoolInfo = printingService.getSchoolInfo();
      const studentsResponse = await getStudentsByClass(selectedClass);
      if (studentsResponse.status !== 'success') {
        throw new Error("Failed to load students");
      }
      const result = await printingService.printBulkStudentReportsServerSide(
        studentsResponse.data,
        schoolInfo.term,
        schoolInfo,
        (progress) => {
          console.log(`PDF Generation Progress: ${progress}%`);
        }
      );
      if (result.success) {
        showNotification({
          type: 'success',
          title: 'Success',
          message: result.message
        });
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error("Error printing class reports:", error);
      showNotification({
        type: 'error',
        title: 'Print Failed',
        message: `Error printing reports: ${error.message}`
      });
    } finally {
      setPrinting(false);
    }
  };

  const printSelectedStudents = async () => {
    if (selectedStudents.length === 0) {
      showNotification({
        type: 'warning',
        title: 'Selection Required',
        message: 'Please select at least one student'
      });
      return;
    }

    setPrinting(true);
    try {
      const schoolInfo = printingService.getSchoolInfo();
      const selectedStudentData = classStudents.filter(student =>
        selectedStudents.includes(student.id)
      );
      const result = await printingService.printBulkStudentReports(
        selectedStudentData,
        schoolInfo.term,
        schoolInfo
      );
      if (result.success) {
        showNotification({
          type: 'success',
          title: 'Success',
          message: result.message
        });
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error("Error printing selected students:", error);
      showNotification({
        type: 'error',
        title: 'Print Failed',
        message: `Error printing reports: ${error.message}`
      });
    } finally {
      setPrinting(false);
    }
  };

  const printClassBroadsheet = async () => {
    if (!selectedClass) {
      showNotification({
        type: 'warning',
        title: 'Selection Required',
        message: 'Please select a class first'
      });
      return;
    }
    setPrinting(true);
    try {
      const schoolInfo = printingService.getSchoolInfo();
      const result = await printingService.printCompleteClassBroadsheet(
        selectedClass,
        schoolInfo
      );
      if (result.success) {
        showNotification({
          type: 'success',
          title: 'Success',
          message: result.message
        });
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error("Error printing class broadsheet:", error);
      showNotification({
        type: 'error',
        title: 'Print Failed',
        message: `Error printing broadsheet: ${error.message}`
      });
    } finally {
      setPrinting(false);
    }
  };

  const handleSubjectChange = (subject) => {
    setSelectedSubject(subject);
  };

  const printSubjectBroadsheet = async (subject) => {
    if (!selectedClass) {
      showNotification({
        type: 'warning',
        title: 'Selection Required',
        message: 'Please select a class first'
      });
      return;
    }

    if (!subject) {
      showNotification({
        type: 'warning',
        title: 'Selection Required',
        message: 'Please select a subject'
      });
      return;
    }

    setPrinting(true);
    try {
      const schoolInfo = printingService.getSchoolInfo();
      const result = await printingService.printSubjectBroadsheet(
        selectedClass,
        subject,
        schoolInfo,
        '', // teacherName
        settings.term // term from global settings
      );
      if (result.success) {
        showNotification({
          type: 'success',
          title: 'Success',
          message: `${subject} broadsheet for ${selectedClass} generated successfully`
        });
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error("Error printing subject broadsheet:", error);
      showNotification({
        type: 'error',
        title: 'Print Failed',
        message: `Error printing ${subject} broadsheet: ${error.message}`
      });
    } finally {
      setPrinting(false);
    }
  };

  if (loading && teachers.length === 0 && learners.length === 0) {
    return (
      <Layout>
        <LoadingSpinner message="Loading Admin Dashboard..." size="lg" />
      </Layout>
    );
  }

  return (
    <>
      <Layout>
        <div className="space-y-6 w-full max-w-full mx-auto">
          {/* Header */}
          <div className="glass-card-golden w-full">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-white text-shadow mb-2">Admin Dashboard</h1>
                <p className="text-white/90 text-shadow">Welcome to DERIAD'S eSBA Management System</p>
                <div className="text-sm text-white/90 mt-2 text-shadow">
                  Teachers: {teachers.length} | Students: {learners.length}
                </div>
              </div>
              <div className="flex-shrink-0">
                <RoleSwitcher />
              </div>
            </div>
            {error && (
              <div className="mt-4 glass rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="text-blue-800 font-medium">
                    <strong>✅ System Update:</strong> {error}
                  </div>
                  <button onClick={() => setError("")} className="glass-button text-blue-600 hover:text-blue-800">
                    ✕
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <button
              className="glass-card-golden flex flex-col items-center justify-center min-h-[220px] hover:scale-105 hover:shadow-2xl transition-all duration-300 hover:bg-white/30"
              onClick={() => openModal('teachersList')}
            >
              <div className="text-4xl mb-4">👩‍🏫</div>
              <div className="text-xl font-bold mb-2 text-white text-shadow">View Teachers</div>
              <div className="text-sm text-white/90 text-shadow">{teachers.length} teachers</div>
            </button>
            <button
              className="glass-card-golden flex flex-col items-center justify-center min-h-[220px] hover:scale-105 hover:shadow-2xl transition-all duration-300 hover:bg-white/30"
              onClick={() => openModal('classManagement')}
            >
              <div className="text-4xl mb-4">📚</div>
              <div className="text-xl font-bold mb-2 text-white text-shadow">Manage Classes & Students</div>
              <div className="text-sm text-white/90 text-shadow">{classes.length} classes • {learners.length} students</div>
            </button>
            <button
              className="glass-card-golden flex flex-col items-center justify-center min-h-[220px] hover:scale-105 hover:shadow-2xl transition-all duration-300 hover:bg-white/30 disabled:hover:scale-100 disabled:hover:shadow-none"
              onClick={loadData}
              disabled={loading}
            >
              <div className="text-4xl mb-4">🔄</div>
              <div className="text-xl font-bold mb-2 text-white text-shadow">
                {loading ? "Loading..." : "Refresh Data"}
              </div>
              <div className="text-sm text-white/90 text-shadow">Update information</div>
            </button>
            <button
              className="glass-card-golden flex flex-col items-center justify-center min-h-[220px] hover:scale-105 hover:shadow-2xl transition-all duration-300 hover:bg-white/30"
              onClick={() => openModal('bulkUpload')}
            >
              <div className="text-4xl mb-4">📤</div>
              <div className="text-xl font-bold mb-2 text-white text-shadow">Bulk Upload</div>
              <div className="text-sm text-white/90 text-shadow">Import students from Excel/CSV</div>
            </button>
            <button
              className="glass-card-golden flex flex-col items-center justify-center min-h-[220px] hover:scale-105 hover:shadow-2xl transition-all duration-300 hover:bg-white/30"
              onClick={() => openModal('print')}
            >
              <div className="text-4xl mb-4">🖨️</div>
              <div className="text-xl font-bold mb-2 text-white text-shadow">Print Section</div>
              <div className="text-sm text-white/90 text-shadow">Print reports and broadsheets</div>
            </button>
            <button
              className="glass-card-golden flex flex-col items-center justify-center min-h-[220px] hover:scale-105 hover:shadow-2xl transition-all duration-300 hover:bg-white/30"
              onClick={() => openModal('teacherSubjectAssignment')}
            >
              <div className="text-4xl mb-4">👨‍🏫</div>
              <div className="text-xl font-bold mb-2 text-white text-shadow">Assign Teacher Subjects</div>
              <div className="text-sm text-white/90 text-shadow">Assign subjects & classes to teachers</div>
            </button>
            <button
              className="glass-card-golden flex flex-col items-center justify-center min-h-[220px] hover:scale-105 hover:shadow-2xl transition-all duration-300 hover:bg-white/30"
              onClick={() => openModal('classPromotionWithStudents')}
            >
              <div className="text-4xl mb-4">📚</div>
              <div className="text-xl font-bold mb-2 text-white text-shadow">Promote Students</div>
              <div className="text-sm text-white/90 text-shadow">Select class → review students → promote</div>
            </button>
            <button
              className="glass-card-golden flex flex-col items-center justify-center min-h-[220px] hover:scale-105 hover:shadow-2xl transition-all duration-300 hover:bg-white/30"
              onClick={() => openModal('assessments')}
            >
              <div className="text-4xl mb-4">📝</div>
              <div className="text-xl font-bold mb-2 text-white text-shadow">Manage Assessments</div>
              <div className="text-sm text-white/90 text-shadow">Create midterm, mock exams & more</div>
            </button>
            <button
              className="glass-card-golden flex flex-col items-center justify-center min-h-[220px] hover:scale-105 hover:shadow-2xl transition-all duration-300 hover:bg-white/30"
              onClick={() => openModal('adminSettings')}
            >
              <div className="text-4xl mb-4">⚙️</div>
              <div className="text-xl font-bold mb-2 text-white text-shadow">Settings</div>
              <div className="text-sm text-white/90 text-shadow">School settings & offline mode</div>
            </button>
            <button
              className="glass-card-golden flex flex-col items-center justify-center min-h-[220px] hover:scale-105 hover:shadow-2xl transition-all duration-300 hover:bg-white/30"
              onClick={() => openModal('archiveViewer')}
            >
              <div className="text-4xl mb-4">📦</div>
              <div className="text-xl font-bold mb-2 text-white text-shadow">View Archives</div>
              <div className="text-sm text-white/90 text-shadow">Access historical term data</div>
            </button>
            {/* TEMPORARILY DISABLED - Analytics causing server crashes */}
            {/* <button
              className="glass-card-golden flex flex-col items-center justify-center min-h-[220px]"
              onClick={() => openModal('analyticsDashboard')}
            >
              <div className="text-4xl mb-4">📊</div>
              <div className="text-xl font-bold mb-2 text-white text-shadow">View Analytics</div>
              <div className="text-sm text-white/90 text-shadow">Student performance insights</div>
            </button> */}
          </div>

          {/* Teacher Progress Leaderboard - Temporarily disabled due to API issues */}
          {/* <div className="glass-card-golden">
            <TeacherLeaderboard isVisible={true} />
          </div> */}

          {/* Lazy-loaded Modals with Suspense */}
          <Suspense fallback={<LoadingSpinner message="Loading modal..." />}>
            {isModalOpen('classManagement') && (
              <ClassManagementModal
                isOpen={isModalOpen('classManagement')}
                onClose={() => closeModal('classManagement')}
                classes={classes}
                onClassAdded={(newClass) => setClasses(prev => [...new Set([...prev, newClass])].sort((a, b) => a.localeCompare(b, undefined, {numeric: true})))}
                allSubjects={allSubjects}
                onSubjectAdded={(newSubject) => setAllSubjects(prev => [...new Set([...prev, newSubject])].sort())}
                teachers={teachers}
                onAssignmentChange={loadData}
                learners={learners}
              />
            )}
          </Suspense>

          <Suspense fallback={<LoadingSpinner message="Loading modal..." />}>
            {isModalOpen('teacherSubjectAssignment') && (
              <TeacherSubjectAssignment
                isOpen={isModalOpen('teacherSubjectAssignment')}
                onClose={() => closeModal('teacherSubjectAssignment')}
                teachers={teachers}
                allSubjects={allSubjects}
                allClasses={classes}
                onUpdate={loadData}
              />
            )}
          </Suspense>

          <Suspense fallback={<LoadingSpinner message="Loading modal..." />}>
            {isModalOpen('analyticsDashboard') && (
              <AnalyticsDashboardModal
                isOpen={isModalOpen('analyticsDashboard')}
                onClose={() => closeModal('analyticsDashboard')}
                analyticsData={analyticsData}
              />
            )}
          </Suspense>
        </div>
      </Layout>

      {/* Modals rendered outside main layout with Suspense */}
      <Suspense fallback={<LoadingSpinner message="Loading upload..." />}>
        {isModalOpen('bulkUpload') && (
          <BulkUploadModal
            isOpen={isModalOpen('bulkUpload')}
            onClose={() => closeModal('bulkUpload')}
            onUploadSuccess={handleBulkUploadSuccess}
          />
        )}
      </Suspense>

      <Suspense fallback={<LoadingSpinner message="Loading print..." />}>
        {isModalOpen('print') && (
          <PrintReportModal
            isOpen={isModalOpen('print')}
            onClose={() => closeModal('print')}
            classes={classes}
            selectedClass={selectedClass}
            handleClassChange={handleClassChange}
            printing={printing}
            printClassReports={printClassReports}
            classStudents={classStudents}
            selectedStudents={selectedStudents}
            handleSelectAllStudents={handleSelectAllStudents}
            handleStudentSelection={handleStudentSelection}
            printSelectedStudents={printSelectedStudents}
            printClassBroadsheet={printClassBroadsheet}
            classSubjects={classSubjects}
            selectedSubject={selectedSubject}
            handleSubjectChange={handleSubjectChange}
            printSubjectBroadsheet={printSubjectBroadsheet}
          />
        )}
      </Suspense>

      <Suspense fallback={<LoadingSpinner message="Loading..." />}>
        {isModalOpen('teachersList') && (
          <TeachersManagementModal
            isOpen={isModalOpen('teachersList')}
            onClose={() => closeModal('teachersList')}
            teachers={teachers}
            loadData={loadData}
            onEditTeacher={handleOpenEditTeacherModal}
          />
        )}
      </Suspense>

      <Suspense fallback={<LoadingSpinner message="Loading..." />}>
        {isModalOpen('editTeacher') && (
          <EditTeacherModal
            isOpen={isModalOpen('editTeacher')}
            onClose={() => {
              closeModal('editTeacher');
              setSelectedTeacher(null);
            }}
            teacher={selectedTeacher}
            onTeacherUpdate={handleTeacherUpdate}
          />
        )}
      </Suspense>

      <Suspense fallback={<LoadingSpinner message="Loading..." />}>
        {isModalOpen('promoteStudents') && (
          <PromoteStudentsModal
            isOpen={isModalOpen('promoteStudents')}
            onClose={() => closeModal('promoteStudents')}
            students={learners}
            onPromotionComplete={loadData}
          />
        )}
      </Suspense>

      <Suspense fallback={<LoadingSpinner message="Loading..." />}>
        {isModalOpen('classBasedPromotion') && (
          <ClassBasedPromotionModal
            isOpen={isModalOpen('classBasedPromotion')}
            onClose={() => closeModal('classBasedPromotion')}
            onComplete={loadData}
          />
        )}
      </Suspense>

      <Suspense fallback={<LoadingSpinner message="Loading..." />}>
        {isModalOpen('classPromotionWithStudents') && (
          <ClassPromotionWithStudents
            isOpen={isModalOpen('classPromotionWithStudents')}
            onClose={() => closeModal('classPromotionWithStudents')}
            onComplete={loadData}
          />
        )}
      </Suspense>

      <Suspense fallback={<LoadingSpinner message="Loading..." />}>
        {isModalOpen('adminSettings') && (
          <AdminSettingsPanel
            isOpen={isModalOpen('adminSettings')}
            onClose={() => closeModal('adminSettings')}
            onSave={() => {
              closeModal('adminSettings');
              loadData();
            }}
          />
        )}
      </Suspense>

      <Suspense fallback={<LoadingSpinner message="Loading..." />}>
        {isModalOpen('archiveViewer') && (
          <ArchiveViewer
            isOpen={isModalOpen('archiveViewer')}
            onClose={() => closeModal('archiveViewer')}
          />
        )}
      </Suspense>
    
      <Suspense fallback={<LoadingSpinner message="Loading..." />}>
        {isModalOpen('assessments') && (
          <AssessmentsManagementModal
            isOpen={isModalOpen('assessments')}
            onClose={() => closeModal('assessments')}
          />
        )}
      </Suspense>
    </>
  );
};

export default AdminDashboardPage;
