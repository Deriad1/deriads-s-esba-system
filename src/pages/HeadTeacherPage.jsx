import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useGlobalSettings } from '../context/GlobalSettingsContext';;
import { useNotification } from '../context/NotificationContext';
import { getClasses, saveClass, deleteClass, getTeachers, getLearners, updateTeacher, getAllMarksForAnalytics } from '../api-client.js';
import PerformanceChart from '../components/PerformanceChart';
import TrendAnalysisChart from '../components/TrendAnalysisChart';
import TeacherLeaderboard from '../components/TeacherLeaderboard';
import Layout from '../components/Layout';
import LoadingSpinner from '../components/LoadingSpinner';
import PrintReportModal from '../components/PrintReportModal';
import PromoteStudentsModal from '../components/PromoteStudentsModal';
import TeachersManagementModal from '../components/modals/TeachersManagementModal';
import printingService from '../services/printingService';
import { getSubjectsForLevel } from '../utils/subjectLevelMapping';
import {
  calculateOverallAverage,
  calculateSubjectAverages,
  calculateTermTrends,
  calculateClassStats
} from '../utils/headTeacherAnalytics';

const HeadTeacherPage = () => {
  const { user } = useAuth();
  const { settings } = useGlobalSettings();
  const { showNotification } = useNotification();
  const [classData, setClassData] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [learners, setLearners] = useState([]);
  const [marksData, setMarksData] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedClass, setSelectedClass] = useState(null);
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isSubjectBroadsheetModalOpen, setIsSubjectBroadsheetModalOpen] = useState(false);
  const [isClassBroadsheetModalOpen, setIsClassBroadsheetModalOpen] = useState(false);
  const [isPromoteModalOpen, setIsPromoteModalOpen] = useState(false);
  const [isAddTeacherModalOpen, setIsAddTeacherModalOpen] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [printClass, setPrintClass] = useState('');
  const [printSubject, setPrintSubject] = useState('');
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState({
    totalClasses: 0,
    totalTeachers: 0,
    totalStudents: 0,
    overallAverage: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch classes
        const classResponse = await getClasses();
        if (classResponse.status === 'success') {
          setClassData(classResponse.data);
        } else {
          console.error('Failed to fetch class data:', classResponse.message);
        }
        
        // Fetch teachers
        const teacherResponse = await getTeachers();
        if (teacherResponse.status === 'success') {
          setTeachers(teacherResponse.data || []);
        } else {
          console.error('Failed to fetch teacher data:', teacherResponse.message);
        }
        
        // Fetch learners
        const learnerResponse = await getLearners();
        if (learnerResponse.status === 'success') {
          console.log('✅ Learners data loaded:', learnerResponse.data?.length, 'students');
          console.log('Sample student:', learnerResponse.data?.[0]);
          setLearners(learnerResponse.data || []);
        } else {
          console.error('Failed to fetch learner data:', learnerResponse.message);
        }

        // Fetch all marks for analytics
        const marksResponse = await getAllMarksForAnalytics();
        let marks = [];
        if (marksResponse.status === 'success') {
          // The API returns { status, data: { marks: [], statistics: {}, filters: {} } }
          marks = marksResponse.data?.marks || [];
          console.log('✅ Marks data loaded:', marks.length, 'records');
          setMarksData(marks);
        } else {
          console.error('Failed to fetch marks data:', marksResponse.message);
        }

        // Calculate REAL analytics using actual data
        const realOverallAverage = calculateOverallAverage(
          learnerResponse.data || [],
          marks
        );

        // Update analytics data with REAL values
        setAnalyticsData({
          totalClasses: classResponse.data?.length || 0,
          totalTeachers: teacherResponse.data?.length || 0,
          totalStudents: learnerResponse.data?.length || 0,
          overallAverage: realOverallAverage // REAL VALUE!
        });
      } catch (err) {
        console.error('Failed to fetch data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);


  // REAL data for charts - calculated from actual student marks
  const chartData = useMemo(() => {
    if (!marksData || marksData.length === 0) return [];
    return calculateSubjectAverages(marksData);
  }, [marksData]);

  const trendData = useMemo(() => {
    if (!marksData || marksData.length === 0) return [];
    return calculateTermTrends(marksData);
  }, [marksData]);

  const overallAverage = useMemo(() => {
    return analyticsData.overallAverage || 0;
  }, [analyticsData.overallAverage]);

  // Print Subject Broadsheet
  const printSubjectBroadsheet = async () => {
    if (!printClass) {
      showNotification({
        type: 'warning',
        message: 'Please select a class first',
        duration: 3000
      });
      return;
    }
    if (!printSubject) {
      showNotification({
        type: 'warning',
        message: 'Please select a subject first',
        duration: 3000
      });
      return;
    }

    setPrinting(true);
    try {
      const schoolInfo = printingService.getSchoolInfo();
      const result = await printingService.printSubjectBroadsheet(
        printClass,
        printSubject,
        schoolInfo,
        '', // teacherName
        settings.term // term from global settings
      );

      if (result.success) {
        showNotification({
          type: 'success',
          message: result.message,
          duration: 5000
        });
        setIsSubjectBroadsheetModalOpen(false);
        setPrintClass('');
        setPrintSubject('');
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error("Error printing subject broadsheet:", error);
      showNotification({
        type: 'error',
        message: "Error printing subject broadsheet: " + error.message,
        duration: 5000
      });
    } finally {
      setPrinting(false);
    }
  };

  // Print Complete Class Broadsheet
  const printClassBroadsheet = async () => {
    if (!printClass) {
      showNotification({
        type: 'warning',
        message: 'Please select a class first',
        duration: 3000
      });
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
        showNotification({
          type: 'success',
          message: result.message,
          duration: 5000
        });
        setIsClassBroadsheetModalOpen(false);
        setPrintClass('');
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error("Error printing class broadsheet:", error);
      showNotification({
        type: 'error',
        message: "Error printing class broadsheet: " + error.message,
        duration: 5000
      });
    } finally {
      setPrinting(false);
    }
  };

  // Get subjects for the selected class
  const getAvailableSubjects = () => {
    if (!printClass) return [];

    // Determine level based on class
    let level = '';
    if (printClass === 'KG1' || printClass === 'KG2') {
      level = 'KG';
    } else if (printClass === 'BS1' || printClass === 'BS2' || printClass === 'BS3') {
      level = 'Lower Primary';
    } else if (printClass === 'BS4' || printClass === 'BS5' || printClass === 'BS6') {
      level = 'Upper Primary';
    } else if (printClass === 'BS7' || printClass === 'BS8' || printClass === 'BS9') {
      level = 'JHS';
    }

    return getSubjectsForLevel(level);
  };

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner message="Loading Head Teacher Dashboard..." size="lg" />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="glass-extra-transparent p-6 rounded-lg">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Head Teacher Dashboard</h1>
          <p className="text-white/90">Welcome, {user?.name || 'Head Teacher'}</p>
        </div>

      {/* Tabs */}
      <div className="glass-extra-transparent rounded-lg">
        <div className="flex flex-wrap border-b border-gray-700">
          {['overview', 'classes', 'teachers', 'analytics'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 px-6 font-medium text-sm ${
                activeTab === tab
                  ? 'text-blue-400 border-b-2 border-blue-400'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { title: 'Total Classes', value: analyticsData.totalClasses, icon: '📚' },
              { title: 'Total Teachers', value: analyticsData.totalTeachers, icon: '👩‍🏫' },
              { title: 'Total Students', value: analyticsData.totalStudents, icon: '👨‍🎓' },
              { title: 'Avg Performance', value: `${overallAverage}%`, icon: '📈' }
            ].map((stat, index) => (
              <div key={index} className="glass-card-golden p-4 rounded-lg hover:scale-105 hover:shadow-2xl transition-all duration-300 hover:bg-white/30">
                <div className="flex items-center">
                  <div className="bg-yellow-500/90 backdrop-blur-sm p-3 rounded-lg mr-4 border-2 border-white/50">
                    <span className="text-2xl">{stat.icon}</span>
                  </div>
                  <div>
                    <p className="text-white/90 text-sm">{stat.title}</p>
                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Actions Panel */}
          <div className="glass-card-golden p-6 rounded-lg">
            <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <button
                onClick={() => setActiveTab('teachers')}
                className="glass-card-golden text-white p-4 rounded-lg hover:scale-105 hover:shadow-2xl transition-all duration-300 hover:bg-white/30 flex items-center justify-center space-x-2"
              >
                <span>👩‍🏫</span>
                <span>View Teachers</span>
              </button>
              <button
                onClick={() => setActiveTab('classes')}
                className="glass-card-golden text-white p-4 rounded-lg hover:scale-105 hover:shadow-2xl transition-all duration-300 hover:bg-white/30 flex items-center justify-center space-x-2"
              >
                <span>📚</span>
                <span>Manage Classes</span>
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className="glass-card-golden text-white p-4 rounded-lg hover:scale-105 hover:shadow-2xl transition-all duration-300 hover:bg-white/30 flex items-center justify-center space-x-2"
              >
                <span>📊</span>
                <span>View Analytics</span>
              </button>
              <button
                onClick={() => setIsPromoteModalOpen(true)}
                className="glass-card-golden text-white p-4 rounded-lg hover:scale-105 hover:shadow-2xl transition-all duration-300 hover:bg-white/30 flex items-center justify-center space-x-2"
              >
                <span>📈</span>
                <span>Promote Students</span>
              </button>
            </div>
          </div>

          {/* Print Reports Section */}
          <div className="glass-card-golden p-6 rounded-lg">
            <h2 className="text-xl font-bold text-white mb-4">Print Reports</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => setIsPrintModalOpen(true)}
                className="glass-card-golden text-white p-4 rounded-lg hover:scale-105 hover:shadow-2xl transition-all duration-300 hover:bg-white/30 flex items-center justify-center space-x-2"
                title="Print individual terminal reports for students"
              >
                <span>📄</span>
                <span>Student Reports</span>
              </button>
              <button
                onClick={() => setIsSubjectBroadsheetModalOpen(true)}
                className="glass-card-golden text-white p-4 rounded-lg hover:scale-105 hover:shadow-2xl transition-all duration-300 hover:bg-white/30 flex items-center justify-center space-x-2"
                title="Print broadsheet for a specific subject"
              >
                <span>📊</span>
                <span>Subject Broadsheet</span>
              </button>
              <button
                onClick={() => setIsClassBroadsheetModalOpen(true)}
                className="glass-card-golden text-white p-4 rounded-lg hover:scale-105 hover:shadow-2xl transition-all duration-300 hover:bg-white/30 flex items-center justify-center space-x-2"
                title="Print complete class broadsheet with all subjects"
              >
                <span>📋</span>
                <span>Class Broadsheet</span>
              </button>
            </div>
          </div>

          {/* Form Masters & Class Assignments */}
          <div className="glass-card-golden p-6 rounded-lg">
            <h2 className="text-xl font-bold text-white mb-4">Form Masters & Class Assignments</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-transparent">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider font-bold">Form Master/Mistress</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider font-bold">Class Assigned</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider font-bold">Students</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider font-bold">Subject Teaching</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-300">
                  {teachers
                    .filter(t => {
                      const roles = t.all_roles || t.allRoles || [];
                      const classAssigned = t.class_assigned || t.classAssigned || t.form_class;
                      return roles.includes('form_master') && classAssigned;
                    })
                    .map(teacher => {
                      const classAssigned = teacher.class_assigned || teacher.classAssigned || teacher.form_class;
                      const studentsInClass = learners.filter(s => (s.className || s.class_name) === classAssigned).length;
                      const firstName = teacher.first_name || teacher.firstName;
                      const lastName = teacher.last_name || teacher.lastName;
                      return (
                        <tr key={teacher.id} className="hover:bg-white/10 transition-all duration-200">
                          <td className="px-4 py-3 text-sm text-white font-medium">{firstName} {lastName}</td>
                          <td className="px-4 py-3 text-sm">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                              {classAssigned}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-white/90">{studentsInClass} students</td>
                          <td className="px-4 py-3 text-sm text-white/90">{teacher.subjects?.join(', ') || 'N/A'}</td>
                        </tr>
                      );
                    })}
                  {teachers.filter(t => {
                    const roles = t.all_roles || t.allRoles || [];
                    const classAssigned = t.class_assigned || t.classAssigned || t.form_class;
                    return roles.includes('form_master') && classAssigned;
                  }).length === 0 && (
                    <tr>
                      <td colSpan="4" className="px-4 py-8 text-center text-white/80">
                        No form masters assigned yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-extra-transparent p-4 rounded-lg">
              <h2 className="text-xl font-bold text-white mb-4">Performance Overview</h2>
              <PerformanceChart data={chartData} />
            </div>
            <div className="glass-extra-transparent p-4 rounded-lg">
              <h2 className="text-xl font-bold text-white mb-4">Trend Analysis</h2>
              <TrendAnalysisChart data={trendData} />
            </div>
          </div>

        </div>
      )}

      {/* Classes Tab - Clickable class cards */}
      {activeTab === 'classes' && (
        <div className="glass-extra-transparent p-6 rounded-lg">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white">Class Management & Students</h2>
          </div>

          {/* Class Cards - Clickable */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classData.map(cls => {
              const className = cls.name || cls.ClassName;
              const classStudents = learners.filter(l => (l.className || l.class_name) === className);
              console.log(`Class ${className}: ${classStudents.length} students (Total learners: ${learners.length})`);
              const maleCount = classStudents.filter(s => s.gender === 'male').length;
              const femaleCount = classStudents.filter(s => s.gender === 'female').length;
              const formMaster = teachers.find(t => {
                const assigned = t.class_assigned || t.classAssigned || t.form_class;
                return assigned === className;
              });
              const classTeachers = teachers.filter(t => t.classes?.includes(className));

              return (
                <div
                  key={className}
                  onClick={() => {
                    setSelectedClass(className);
                    setIsClassModalOpen(true);
                  }}
                  className="glass-card p-6 rounded-lg cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-200"
                >
                  {/* Class Header */}
                  <div className="mb-4">
                    <h3 className="text-2xl font-bold text-white mb-2">{className}</h3>

                    {/* Population Summary */}
                    <div className="bg-gradient-to-r from-blue-50 to-pink-50 p-3 rounded-lg mb-3">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1">
                            <span className="text-blue-600 font-semibold">♂</span>
                            <span className="text-white/90 font-medium">{maleCount}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-pink-600 font-semibold">♀</span>
                            <span className="text-white/90 font-medium">{femaleCount}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-white/70 text-xs">Total:</span>
                          <span className="text-white font-bold ml-1">{classStudents.length}</span>
                        </div>
                      </div>
                    </div>

                    {/* Form Master/Class Teacher */}
                    {formMaster && (
                      <div className="bg-green-50 p-2 rounded-lg border border-green-200">
                        <div className="text-xs text-green-700 font-medium mb-1">
                          {(formMaster.all_roles || formMaster.allRoles || []).includes('form_master') ? 'Form Master' : 'Class Teacher'}
                        </div>
                        <div className="text-sm text-white font-semibold">
                          {formMaster.first_name || formMaster.firstName} {formMaster.last_name || formMaster.lastName}
                        </div>
                      </div>
                    )}
                    {!formMaster && (
                      <div className="bg-yellow-50 p-2 rounded-lg border border-yellow-200">
                        <div className="text-xs text-yellow-700 font-medium">
                          ⚠ No Form Master/Class Teacher Assigned
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Quick Info */}
                  <div className="space-y-2">
                    <div className="text-xs text-white/80">
                      <span className="font-semibold">Subject Teachers:</span> {classTeachers.length}
                    </div>
                  </div>

                  {/* Click to view indicator */}
                  <div className="mt-4 pt-4 border-t border-gray-300 text-center">
                    <span className="text-xs text-blue-600 font-medium">Click to view class list →</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Teachers Tab - Integrated View */}
      {activeTab === 'teachers' && (
        <div className="glass-extra-transparent p-3 sm:p-6 rounded-lg">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
            <h2 className="text-lg sm:text-xl font-bold text-white">Teacher Management</h2>
            <button
              onClick={() => setIsAddTeacherModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg transition duration-200 font-semibold text-sm sm:text-base w-full sm:w-auto"
              style={{ minHeight: '44px' }}
            >
              + Add Teacher
            </button>
          </div>

          {/* Mobile Cards - Hidden on desktop */}
          <div className="block lg:hidden space-y-3">
            {teachers.map(teacher => {
              const firstName = teacher.first_name || teacher.firstName;
              const lastName = teacher.last_name || teacher.lastName;
              const classAssigned = teacher.class_assigned || teacher.classAssigned || teacher.form_class;
              const primaryRole = teacher.teacherPrimaryRole || teacher.primaryRole || 'teacher';
              const allRoles = teacher.all_roles || teacher.allRoles || [];

              return (
                <div key={teacher.id} className="glass-strong rounded-lg p-4 border-l-4 border-blue-500/80 shadow-lg">
                  {/* Teacher Header */}
                  <div className="flex items-start justify-between mb-3 gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-bold text-white drop-shadow truncate">{firstName} {lastName}</h3>
                      <p className="text-xs text-white/90 font-medium truncate">{teacher.email}</p>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/30 border-2 border-blue-400/50 text-white backdrop-blur-sm shadow flex-shrink-0">
                      {primaryRole}
                    </span>
                  </div>

                  {/* Details Grid */}
                  <div className="space-y-3">
                    {/* All Roles */}
                    {allRoles.length > 0 && (
                      <div>
                        <p className="text-xs text-white/80 mb-1.5 font-semibold">All Roles:</p>
                        <div className="flex flex-wrap gap-1">
                          {allRoles.map(role => (
                            <span key={role} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-500/30 border border-purple-400/50 text-white backdrop-blur-sm shadow">
                              {role.replace('_', ' ')}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Class Assigned */}
                    <div>
                      <p className="text-xs text-white/80 mb-1.5 font-semibold">Form/Class Assigned:</p>
                      {classAssigned ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-green-500/30 border-2 border-green-400/50 text-white backdrop-blur-sm shadow">
                          {classAssigned}
                        </span>
                      ) : (
                        <span className="text-white/70 text-xs">N/A</span>
                      )}
                    </div>

                    {/* Classes Teaching */}
                    {teacher.classes && teacher.classes.length > 0 && (
                      <div>
                        <p className="text-xs text-white/80 mb-1.5 font-semibold">Classes Teaching:</p>
                        <div className="flex flex-wrap gap-1">
                          {teacher.classes.map(cls => (
                            <span key={cls} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-500/30 border border-blue-400/50 text-white backdrop-blur-sm shadow">
                              {cls}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Subjects */}
                    {teacher.subjects && teacher.subjects.length > 0 && (
                      <div>
                        <p className="text-xs text-white/80 mb-1.5 font-semibold">Subjects:</p>
                        <div className="flex flex-wrap gap-1">
                          {teacher.subjects.map(subject => (
                            <span key={subject} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-500/30 border border-orange-400/50 text-white backdrop-blur-sm shadow">
                              {subject}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table - Hidden on mobile */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-transparent">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider font-bold">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider font-bold">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider font-bold">Primary Role</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider font-bold">All Roles</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider font-bold">Class Assigned</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider font-bold">Classes Teaching</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider font-bold">Subjects</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-300">
                {teachers.map(teacher => {
                  const firstName = teacher.first_name || teacher.firstName;
                  const lastName = teacher.last_name || teacher.lastName;
                  return (
                  <tr key={teacher.id} className="hover:bg-white/10 transition-all duration-200">
                    <td className="px-4 py-3 text-sm text-white font-medium">{firstName} {lastName}</td>
                    <td className="px-4 py-3 text-sm text-white/90">{teacher.email}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                        {teacher.teacherPrimaryRole || teacher.primaryRole || 'teacher'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex flex-wrap gap-1">
                        {(teacher.all_roles || teacher.allRoles || []).map(role => (
                          <span key={role} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-600/80 text-white">
                            {role.replace('_', ' ')}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {(teacher.class_assigned || teacher.classAssigned || teacher.form_class) ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                          {teacher.class_assigned || teacher.classAssigned || teacher.form_class}
                        </span>
                      ) : (
                        <span className="text-white/70">N/A</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-white/90">{teacher.classes?.join(', ') || 'N/A'}</td>
                    <td className="px-4 py-3 text-sm text-white/90">{teacher.subjects?.join(', ') || 'N/A'}</td>
                  </tr>
                );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}


      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="glass-extra-transparent p-4 rounded-lg">
              <h3 className="text-sm font-medium text-white/90 mb-2">Teacher-Student Ratio</h3>
              <p className="text-3xl font-bold text-white">
                1:{analyticsData.totalTeachers > 0 ? Math.round(analyticsData.totalStudents / analyticsData.totalTeachers) : 0}
              </p>
            </div>
            <div className="glass-extra-transparent p-4 rounded-lg">
              <h3 className="text-sm font-medium text-white/90 mb-2">Avg Class Size</h3>
              <p className="text-3xl font-bold text-white">
                {classData.length > 0 ? Math.round(learners.length / classData.length) : 0}
              </p>
            </div>
            <div className="glass-extra-transparent p-4 rounded-lg">
              <h3 className="text-sm font-medium text-white/90 mb-2">Form Masters Assigned</h3>
              <p className="text-3xl font-bold text-white">
                {teachers.filter(t => t.allRoles?.includes('form_master') && t.classAssigned).length}/3
              </p>
            </div>
          </div>

          {/* Charts Section */}
          <div className="glass-extra-transparent p-6 rounded-lg">
            <h2 className="text-xl font-bold text-white mb-4">Performance Analytics</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="glass-extra-transparent p-4 rounded-lg">
                <h3 className="text-lg font-bold text-white mb-4">Subject Performance</h3>
                <PerformanceChart data={chartData} />
              </div>
              <div className="glass-extra-transparent p-4 rounded-lg">
                <h3 className="text-lg font-bold text-white mb-4">Term Trends</h3>
                <TrendAnalysisChart data={trendData} />
              </div>
            </div>
          </div>

          {/* Role Distribution */}
          <div className="glass-extra-transparent p-6 rounded-lg">
            <h2 className="text-xl font-bold text-white mb-4">Teacher Role Distribution</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { role: 'subject_teacher', label: 'Subject Teachers', color: 'bg-blue-500' },
                { role: 'class_teacher', label: 'Class Teachers', color: 'bg-green-500' },
                { role: 'form_master', label: 'Form Masters', color: 'bg-purple-500' },
                { role: 'head_teacher', label: 'Head Teachers', color: 'bg-orange-500' }
              ].map(({ role, label, color }) => {
                const count = teachers.filter(t => t.allRoles?.includes(role)).length;
                return (
                  <div key={role} className="glass-card p-4 rounded-lg">
                    <div className={`${color} w-12 h-12 rounded-full flex items-center justify-center mb-3 mx-auto`}>
                      <span className="text-2xl font-bold text-white">{count}</span>
                    </div>
                    <p className="text-sm text-white/90 text-center">{label}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      </div>

      {/* Class Details Modal */}
      {isClassModalOpen && selectedClass && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="glass-card-golden rounded-xl sm:rounded-xl shadow-2xl max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto scroll-smooth" style={{ scrollbarWidth: 'thin', overflow: 'auto' }}>
            {/* Modal Header */}
            <div className="sticky top-0 glass-strong backdrop-blur-md text-white p-4 sm:p-6 rounded-t-xl border-b-4 border-blue-500/50 shadow-lg">
              <div className="flex justify-between items-center gap-3">
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl sm:text-2xl font-bold truncate">{selectedClass}</h2>
                  <p className="text-blue-100 text-xs sm:text-sm">
                    {learners.filter(l => (l.className || l.class_name) === selectedClass).length} students enrolled
                  </p>
                </div>
                <button
                  onClick={() => {
                    setIsClassModalOpen(false);
                    setSelectedClass(null);
                  }}
                  className="text-white hover:bg-white/20 rounded-full p-2 transition-colors flex-shrink-0"
                  style={{ minHeight: '44px', minWidth: '44px' }}
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
              {/* Form Master/Class Teacher Section - Role depends on class level */}
              <div className="glass-strong p-3 sm:p-4 rounded-lg border-2 border-green-500/30 backdrop-blur-md shadow-lg">
                <h3 className="text-base sm:text-lg font-bold text-white mb-3 flex items-center drop-shadow-md">
                  <span className="mr-2">👨‍🏫</span>
                  <span className="truncate">{['BS7', 'BS8', 'BS9'].includes(selectedClass) ? 'Form Master/Mistress (JHS)' : 'Class Teacher (KG/Primary)'}</span>
                </h3>
                {(() => {
                  const isJHS = ['BS7', 'BS8', 'BS9'].includes(selectedClass);
                  const formMaster = teachers.find(t => (t.class_assigned || t.classAssigned || t.form_class) === selectedClass);
                  const availableTeachers = teachers.filter(t => !(t.class_assigned || t.classAssigned || t.form_class));

                  return (
                    <>
                      {formMaster ? (
                        <div className="glass-medium p-3 sm:p-4 rounded-lg shadow-md mb-3 border-2 border-white/20 backdrop-blur-sm">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-white text-base sm:text-lg drop-shadow truncate">
                                {formMaster.first_name || formMaster.firstName} {formMaster.last_name || formMaster.lastName}
                              </p>
                              <p className="text-xs sm:text-sm text-white/90 font-medium truncate">{formMaster.email}</p>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {formMaster.subjects?.map(subject => (
                                <span key={subject} className="px-2 py-1 bg-blue-500/30 border-2 border-blue-400/50 text-white text-xs rounded-full font-semibold backdrop-blur-sm shadow">
                                  {subject}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="glass-medium border-2 border-yellow-400/50 p-3 sm:p-4 rounded-lg text-center mb-3 backdrop-blur-sm shadow-md">
                          <p className="text-white font-semibold drop-shadow text-sm sm:text-base">⚠ No {isJHS ? 'Form Master' : 'Class Teacher'} assigned to this class</p>
                        </div>
                      )}

                      {/* Assign/Change Class Leader */}
                      <div className="glass-medium p-3 rounded-lg border-2 border-green-400/30 backdrop-blur-sm shadow-md">
                        <label className="block text-xs sm:text-sm font-medium text-white mb-2">
                          {formMaster ? `Change ${isJHS ? 'Form Master' : 'Class Teacher'}` : `Assign ${isJHS ? 'Form Master' : 'Class Teacher'}`}
                        </label>
                        <select
                          onChange={async (e) => {
                            if (e.target.value) {
                              const teacher = teachers.find(t => t.id === parseInt(e.target.value));
                              const teacherName = `${teacher?.first_name || teacher?.firstName} ${teacher?.last_name || teacher?.lastName}`;
                              if (window.confirm(`Assign ${teacherName} as ${isJHS ? 'Form Master' : 'Class Teacher'} for ${selectedClass}?`)) {
                                try {
                                await updateTeacher({
                                  id: teacher.id,
                                  firstName: teacher.first_name || teacher.firstName,
                                  lastName: teacher.last_name || teacher.lastName,
                                  email: teacher.email,
                                  gender: teacher.gender,
                                  primaryRole: isJHS ? 'form_master' : 'class_teacher',
                                  allRoles: [isJHS ? 'form_master' : 'class_teacher'],
                                  subjects: teacher.subjects || [],
                                  classes: [...(teacher.classes || []), selectedClass],
                                  form_class: selectedClass,
                                  teachingLevel: isJHS ? 'JHS' : selectedClass.startsWith('KG') ? 'KG' : selectedClass.startsWith('BS') && ['BS1','BS2','BS3'].includes(selectedClass) ? 'Lower Primary' : 'Upper Primary'
                                });
                                showNotification({
                                  type: 'success',
                                  message: `${isJHS ? 'Form Master' : 'Class Teacher'} assigned successfully!`,
                                  duration: 5000
                                });
                                // Refresh data
                                window.location.reload();
                              } catch (error) {
                                showNotification({
                                  type: 'error',
                                  message: `Failed to assign: ${error.message}`,
                                  duration: 5000
                                });
                              }
                              }
                            }
                            e.target.value = '';
                          }}
                          className="w-full px-3 py-2 bg-white/20 border-2 border-white/30 rounded-lg text-white font-medium focus:ring-2 focus:ring-green-500 focus:border-green-500 backdrop-blur-sm shadow-md"
                        >
                          <option value="" className="bg-gray-800 text-white">-- Select a teacher --</option>
                          {availableTeachers.map(teacher => {
                            const firstName = teacher.first_name || teacher.firstName;
                            const lastName = teacher.last_name || teacher.lastName;
                            return (
                            <option key={teacher.id} value={teacher.id} className="bg-gray-800 text-white">
                              {firstName} {lastName}
                            </option>
                            );
                          })}
                        </select>
                        <p className="text-xs text-white/70 mt-1">
                          💡 {isJHS ? 'Form Masters manage JHS classes (BS7-BS9)' : 'Class Teachers manage KG and Primary classes'}
                        </p>
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Subject Teachers Section */}
              <div className="glass-strong p-3 sm:p-4 rounded-lg border-2 border-blue-500/30 backdrop-blur-md shadow-lg">
                <h3 className="text-base sm:text-lg font-bold text-white mb-3 flex items-center drop-shadow-md">
                  <span className="mr-2">📚</span>
                  Subject Teachers
                </h3>
                {(() => {
                  const classTeachers = teachers.filter(t => t.classes?.includes(selectedClass));
                  return (
                    <>
                      {classTeachers.length > 0 ? (
                        <div className="space-y-2 sm:space-y-3 mb-3">
                          {classTeachers.map(teacher => (
                            <div key={teacher.id} className="glass-medium p-3 sm:p-4 rounded-lg shadow-md border-2 border-white/20 backdrop-blur-sm">
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-white drop-shadow text-sm sm:text-base truncate">
                                    {teacher.first_name || teacher.firstName} {teacher.last_name || teacher.lastName}
                                  </p>
                                  <p className="text-xs text-white/90 font-medium truncate">{teacher.email}</p>
                                </div>
                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                                  <div className="flex flex-wrap gap-1">
                                    {teacher.subjects?.map(subject => (
                                      <span key={subject} className="px-2 py-1 bg-blue-500/30 border-2 border-blue-400/50 text-white text-xs rounded-full font-semibold backdrop-blur-sm shadow">
                                        {subject}
                                      </span>
                                    ))}
                                  </div>
                                  <button
                                    onClick={async () => {
                                      if (window.confirm(`Remove ${teacher.first_name || teacher.firstName} ${teacher.last_name || teacher.lastName} from ${selectedClass}?`)) {
                                        try {
                                          const updatedClasses = teacher.classes.filter(c => c !== selectedClass);
                                          await updateTeacher({
                                            id: teacher.id,
                                            firstName: teacher.first_name || teacher.firstName,
                                            lastName: teacher.last_name || teacher.lastName,
                                            email: teacher.email,
                                            gender: teacher.gender,
                                            primaryRole: teacher.teacher_primary_role || teacher.primaryRole,
                                            allRoles: teacher.all_roles || [],
                                            subjects: teacher.subjects || [],
                                            classes: updatedClasses,
                                            teachingLevel: teacher.teaching_level || 'PRIMARY'
                                          });
                                          showNotification({
                                            type: 'success',
                                            message: 'Teacher removed from class successfully!',
                                            duration: 5000
                                          });
                                          // Refresh data
                                          window.location.reload();
                                        } catch (error) {
                                          showNotification({
                                            type: 'error',
                                            message: 'Failed to remove teacher: ' + error.message,
                                            duration: 5000
                                          });
                                        }
                                      }
                                    }}
                                    className="text-red-400 hover:text-red-200 text-xs sm:text-sm font-semibold bg-red-500/20 px-3 py-1.5 rounded-lg border border-red-400/50 backdrop-blur-sm w-full sm:w-auto"
                                    style={{ minHeight: '44px' }}
                                  >
                                    🗑️ Remove
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="glass-medium border-2 border-yellow-400/50 p-3 sm:p-4 rounded-lg text-center mb-3 backdrop-blur-sm shadow-md">
                          <p className="text-white font-semibold drop-shadow text-sm sm:text-base">⚠ No teachers assigned to this class yet</p>
                        </div>
                      )}

                      {/* Add Subject Teacher */}
                      <div className="glass-medium p-3 rounded-lg border-2 border-blue-400/30 backdrop-blur-sm shadow-md">
                        <label className="block text-xs sm:text-sm font-medium text-white/90 mb-2">
                          Add Subject Teacher to Class
                        </label>
                        <select
                          onChange={async (e) => {
                            if (e.target.value) {
                              const teacher = teachers.find(t => t.id === parseInt(e.target.value));
                              const teacherName = `${teacher?.first_name || teacher?.firstName} ${teacher?.last_name || teacher?.lastName}`;
                              if (window.confirm(`Add ${teacherName} to ${selectedClass}?`)) {
                              try {
                                const updatedClasses = [...(teacher.classes || []), selectedClass];
                                await updateTeacher({
                                  id: teacher.id,
                                  firstName: teacher.first_name || teacher.firstName,
                                  lastName: teacher.last_name || teacher.lastName,
                                  email: teacher.email,
                                  gender: teacher.gender,
                                  primaryRole: teacher.teacher_primary_role || teacher.primaryRole || 'subject_teacher',
                                  allRoles: teacher.all_roles || ['subject_teacher'],
                                  subjects: teacher.subjects || [],
                                  classes: [...new Set(updatedClasses)],
                                  teachingLevel: teacher.teaching_level || 'PRIMARY'
                                });
                                showNotification({
                                  type: 'success',
                                  message: 'Teacher added to class successfully!',
                                  duration: 5000
                                });
                                // Refresh data
                                window.location.reload();
                              } catch (error) {
                                showNotification({
                                  type: 'error',
                                  message: 'Failed to add teacher: ' + error.message,
                                  duration: 5000
                                });
                              }
                              }
                            }
                            e.target.value = '';
                          }}
                          className="w-full px-3 py-2 bg-white/20 border-2 border-white/30 rounded-lg text-white font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 backdrop-blur-sm shadow-md"
                        >
                          <option value="" className="bg-gray-800 text-white">-- Select a teacher to add --</option>
                          {teachers
                            .filter(t => !t.classes?.includes(selectedClass))
                            .map(teacher => (
                              <option key={teacher.id} value={teacher.id} className="bg-gray-800 text-white">
                                {teacher.first_name || teacher.firstName} {teacher.last_name || teacher.lastName}
                              </option>
                            ))}
                        </select>
                        <p className="text-xs text-white/70 mt-1">
                          💡 Teachers must have subjects assigned via "Assign Teacher Subjects" button
                        </p>
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Students Section */}
              <div className="glass-strong p-3 sm:p-4 rounded-lg border-2 border-purple-500/30 backdrop-blur-md shadow-lg">
                <h3 className="text-base sm:text-lg font-bold text-white mb-3 flex items-center drop-shadow-md">
                  <span className="mr-2">👨‍🎓</span>
                  Students List
                </h3>
                {(() => {
                  const classStudents = learners.filter(l => (l.className || l.class_name) === selectedClass);
                  return classStudents.length > 0 ? (
                    <div className="glass-medium p-3 sm:p-4 rounded-lg shadow-md max-h-80 sm:max-h-96 overflow-y-auto scroll-smooth backdrop-blur-sm border-2 border-white/20">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                        {classStudents.map(student => (
                          <div
                            key={student.id}
                            className="p-2.5 sm:p-3 glass-light rounded-lg hover:bg-white/30 transition-all border-2 border-white/20 backdrop-blur-sm shadow-md"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-white text-xs sm:text-sm drop-shadow truncate">
                                  {student.first_name || student.firstName} {student.last_name || student.lastName}
                                </p>
                                <p className="text-xs text-white/90 font-medium truncate">{student.idNumber}</p>
                              </div>
                              <span className={`text-xs px-2 py-1 rounded-full font-semibold border-2 backdrop-blur-sm shadow flex-shrink-0 ${
                                student.gender === 'male'
                                  ? 'bg-blue-500/30 border-blue-400/50 text-white'
                                  : 'bg-pink-500/30 border-pink-400/50 text-white'
                              }`}>
                                {student.gender === 'male' ? '👦' : '👧'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="glass-medium p-6 sm:p-8 rounded-lg text-center border-2 border-yellow-400/50 backdrop-blur-sm shadow-md">
                      <p className="text-white font-semibold drop-shadow text-sm sm:text-base">⚠ No students enrolled in this class yet</p>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 glass-strong backdrop-blur-md px-3 sm:px-6 py-3 sm:py-4 rounded-b-xl border-t-4 border-blue-500/50 shadow-lg">
              <button
                onClick={() => {
                  setIsClassModalOpen(false);
                  setSelectedClass(null);
                }}
                className="w-full bg-gradient-to-r from-blue-500/80 to-purple-500/80 hover:from-blue-600/90 hover:to-purple-600/90 text-white font-bold py-3 sm:py-3 px-4 rounded-lg transition-all shadow-lg border-2 border-white/50 backdrop-blur-sm active:scale-95 text-sm sm:text-base"
                style={{ minHeight: '48px' }}
              >
                ✓ Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print Report Modal */}
      <PrintReportModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        students={learners}
        selectedStudents={[]}
      />

      {/* Subject Broadsheet Modal */}
      {isSubjectBroadsheetModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-orange-600 to-orange-700 text-white p-6 rounded-t-lg">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold">Print Subject Broadsheet</h2>
                  <p className="text-orange-100 text-sm">All students for one subject</p>
                </div>
                <button
                  onClick={() => {
                    setIsSubjectBroadsheetModalOpen(false);
                    setPrintClass('');
                    setPrintSubject('');
                  }}
                  className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">Select Class</label>
                <select
                  value={printClass}
                  onChange={(e) => {
                    setPrintClass(e.target.value);
                    setPrintSubject(''); // Reset subject when class changes
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Choose a class...</option>
                  {classData.map(cls => (
                    <option key={cls.ClassName} value={cls.ClassName}>
                      {cls.ClassName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">Select Subject</label>
                <select
                  value={printSubject}
                  onChange={(e) => setPrintSubject(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  disabled={!printClass}
                >
                  <option value="">Choose a subject...</option>
                  {getAvailableSubjects().map(subject => (
                    <option key={subject} value={subject}>{subject}</option>
                  ))}
                </select>
                {!printClass && (
                  <p className="text-xs text-white/70 mt-1">Please select a class first</p>
                )}
              </div>

              {printClass && printSubject && (
                <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                  <p className="text-sm text-orange-900">
                    <strong>Ready to print:</strong> {printSubject} broadsheet for {printClass}
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 rounded-b-lg border-t flex justify-between">
              <button
                onClick={() => {
                  setIsSubjectBroadsheetModalOpen(false);
                  setPrintClass('');
                  setPrintSubject('');
                }}
                disabled={printing}
                className="px-6 py-2 border border-white/30 text-white rounded-lg hover:bg-white/20 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={printSubjectBroadsheet}
                disabled={printing || !printClass || !printSubject}
                className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {printing ? (
                  <>
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Printing...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    <span>Print Broadsheet</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Class Broadsheet Modal */}
      {isClassBroadsheetModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-6 rounded-t-lg">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold">Print Class Broadsheet</h2>
                  <p className="text-green-100 text-sm">All subjects for all students</p>
                </div>
                <button
                  onClick={() => {
                    setIsClassBroadsheetModalOpen(false);
                    setPrintClass('');
                  }}
                  className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">Select Class</label>
                <select
                  value={printClass}
                  onChange={(e) => setPrintClass(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Choose a class...</option>
                  {classData.map(cls => (
                    <option key={cls.ClassName} value={cls.ClassName}>
                      {cls.ClassName}
                    </option>
                  ))}
                </select>
              </div>

              {printClass && (
                <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                  <p className="text-sm text-green-900">
                    <strong>Ready to print:</strong> Complete broadsheet for {printClass} with all subjects
                  </p>
                  <p className="text-xs text-green-700 mt-1">
                    {learners.filter(l => (l.className || l.class_name) === printClass).length} students enrolled
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 rounded-b-lg border-t flex justify-between">
              <button
                onClick={() => {
                  setIsClassBroadsheetModalOpen(false);
                  setPrintClass('');
                }}
                disabled={printing}
                className="px-6 py-2 border border-white/30 text-white rounded-lg hover:bg-white/20 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={printClassBroadsheet}
                disabled={printing || !printClass}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {printing ? (
                  <>
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Printing...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    <span>Print Broadsheet</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Teacher Leaderboard - At Bottom (Visible on all tabs) */}
      <div className="mt-6">
        <TeacherLeaderboard />
      </div>

      {/* Promote Students Modal */}
      {isPromoteModalOpen && (
        <PromoteStudentsModal
          isOpen={isPromoteModalOpen}
          onClose={() => setIsPromoteModalOpen(false)}
          students={learners}
          onPromotionComplete={() => {
            setIsPromoteModalOpen(false);
            // Refresh data after promotion
            window.location.reload();
          }}
        />
      )}

      {/* Add Teacher Modal */}
      <TeachersManagementModal
        isOpen={isAddTeacherModalOpen}
        onClose={() => setIsAddTeacherModalOpen(false)}
        teachers={teachers}
        loadData={async () => {
          // Refresh teachers data after adding/editing
          const teacherResponse = await getTeachers();
          setTeachers(teacherResponse.data || []);
        }}
        onEditTeacher={(teacher) => {
          // Optional: Handle edit teacher if needed
          console.log('Edit teacher:', teacher);
        }}
      />

    </Layout>
  );
};

export default HeadTeacherPage;