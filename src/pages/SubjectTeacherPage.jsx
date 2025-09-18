import Layout from "../components/Layout";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { getLearners, updateStudentScores, getClassPerformanceTrends } from "../api";
import PerformanceChart from "../components/PerformanceChart";
import TrendAnalysisChart from "../components/TrendAnalysisChart";

const SubjectTeacherPage = () => {
  const { user } = useAuth();
  
  const [learners, setLearners] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [marks, setMarks] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedStudents, setSavedStudents] = useState(new Set()); // Track saved students
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showTrendAnalysis, setShowTrendAnalysis] = useState(false); // New state for trend analysis
  const [classTrendData, setClassTrendData] = useState(null); // New state for trend data
  // State for modals
  const [showScoresModal, setShowScoresModal] = useState(false);

  // Get user's subjects
  const getUserSubjects = () => {
    if (Array.isArray(user?.subjects)) {
      return user.subjects;
    }
    return [];
  };

  // Get user's classes
  const getUserClasses = () => {
    if (Array.isArray(user?.classes)) {
      return user.classes.filter(cls => cls !== 'ALL');
    }
    return [];
  };

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

  // Initialize marks when class/subject changes
  useEffect(() => {
    if (selectedClass && selectedSubject && filteredLearners.length > 0) {
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
  }, [selectedClass, selectedSubject, filteredLearners.length]);

  const handleMarkChange = (studentId, field, value) => {
    // Allow only numbers and decimal points
    if (value && !/^\d*\.?\d*$/.test(value)) return;
    
    setMarks(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
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

  // Save individual student marks
  const saveStudentMarks = async (studentId) => {
    if (!selectedClass || !selectedSubject) {
      alert("Please select a class and subject first.");
      return;
    }

    // Check if user has permission for this subject
    if (!getUserSubjects().includes(selectedSubject)) {
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
        // Update saved students set
        setSavedStudents(prev => new Set(prev).add(studentId));
        // Show success message without interrupting workflow
        console.log(`Student marks saved successfully for ${studentId}!`);
      } else {
        alert("Error saving student marks: " + response.message);
      }
    } catch (error) {
      console.error("Save student marks error:", error);
      alert("Error saving student marks: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  // Save all marks
  const saveAllMarks = async () => {
    if (!selectedClass || !selectedSubject) {
      alert("Please select a class and subject first.");
      return;
    }

    // Check if user has permission for this subject
    if (!getUserSubjects().includes(selectedSubject)) {
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
        alert(`All marks saved successfully! (${successCount} students)`);
      } else {
        alert(`Saved ${successCount} students successfully. ${errorCount} failed.`);
      }
      
    } catch (error) {
      console.error("Save all marks error:", error);
      alert("Error saving marks: " + error.message);
    } finally {
      setSaving(false);
      setShowScoresModal(false); // Close modal after saving
    }
  };

  // Save progress - save only the marks that have been entered
  const saveProgress = async () => {
    if (!selectedClass || !selectedSubject) {
      alert("Please select a class and subject first.");
      return;
    }

    // Check if user has permission for this subject
    if (!getUserSubjects().includes(selectedSubject)) {
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

  // Print broadsheet
  const printBroadsheet = () => {
    if (!selectedClass || !selectedSubject) {
      alert("Please select a class and subject first.");
      return;
    }

    try {
      let tableRows = '';
      const studentsWithData = filteredLearners.filter(learner => {
        const studentId = learner.idNumber || learner.LearnerID;
        const studentMarks = marks[studentId] || {};
        const totals = calculateTotals(studentMarks);
        return totals.finalTotal > 0; // Only include students with scores
      });

      studentsWithData.forEach((learner) => {
        const studentId = learner.idNumber || learner.LearnerID;
        const studentMarks = marks[studentId] || {};
        
        const totals = calculateTotals(studentMarks);
        const position = positions[studentId] || '-';
        const remarks = getRemarks(totals.finalTotal);
        
        tableRows += `
          <tr>
            <td style="border: 1px solid black; padding: 4px;">${learner.firstName} ${learner.lastName}</td>
            <td style="border: 1px solid black; padding: 4px; text-align: center;">${studentMarks.test1 || 0}</td>
            <td style="border: 1px solid black; padding: 4px; text-align: center;">${studentMarks.test2 || 0}</td>
            <td style="border: 1px solid black; padding: 4px; text-align: center;">${studentMarks.test3 || 0}</td>
            <td style="border: 1px solid black; padding: 4px; text-align: center;">${studentMarks.test4 || 0}</td>
            <td style="border: 1px solid black; padding: 4px; text-align: center;">${totals.testsTotal}</td>
            <td style="border: 1px solid black; padding: 4px; text-align: center;">${totals.testsScaled.toFixed(1)}</td>
            <td style="border: 1px solid black; padding: 4px; text-align: center;">${studentMarks.exam || 0}</td>
            <td style="border: 1px solid black; padding: 4px; text-align: center;">${totals.examScaled.toFixed(1)}</td>
            <td style="border: 1px solid black; padding: 4px; text-align: center; font-weight: bold;">${totals.finalTotal.toFixed(1)}</td>
            <td style="border: 1px solid black; padding: 4px; text-align: center; font-weight: bold;">${position}</td>
            <td style="border: 1px solid black; padding: 4px; text-align: center;">${remarks}</td>
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
            <title>Broadsheet - ${selectedSubject} - ${selectedClass}</title>
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
              <div class="school-name">DERIAD'S eSBA</div>
              <div class="broadsheet-title">Subject Broadsheet</div>
              <div class="details">
                Subject: ${selectedSubject} | Class: ${selectedClass} | 
                Teacher: ${user?.name} | Date: ${new Date().toLocaleDateString()}
              </div>
            </div>
            <table>
              <thead>
                <tr>
                  <th class="student-name">Student Name</th>
                  <th>Test 1<br/>(15)</th>
                  <th>Test 2<br/>(15)</th>
                  <th>Test 3<br/>(15)</th>
                  <th>Test 4<br/>(15)</th>
                  <th>Tests Total<br/>(60)</th>
                  <th>50%</th>
                  <th>Exam<br/>(100)</th>
                  <th>50%</th>
                  <th>Final Total<br/>(100)</th>
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

    // Performance distribution data
    const performanceData = [
      { label: 'Excellent', value: 0, color: '#10B981' },
      { label: 'Very Good', value: 0, color: '#3B82F6' },
      { label: 'Good', value: 0, color: '#8B5CF6' },
      { label: 'Satisfactory', value: 0, color: '#F59E0B' },
      { label: 'Fair', value: 0, color: '#F97316' },
      { label: 'Needs Improvement', value: 0, color: '#EF4444' }
    ];

    // Student scores data for charts
    const studentScores = [];
    const studentScoresForLine = [];

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
        
        // Add to student scores for bar chart
        studentScores.push({
          label: `${learner.firstName} ${learner.lastName.charAt(0)}.`,
          value: parseFloat(finalTotal.toFixed(1))
        });
        
        // Add to student scores for line chart (full name for better readability)
        studentScoresForLine.push({
          label: `${learner.firstName} ${learner.lastName}`,
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
      studentScoresForLine: studentScoresForLine.slice(0, 10), // Limit to 10 for line chart readability
      averageScore,
      totalStudents: studentsWithData.length
    };
  };

  const analyticsData = getAnalyticsData();

  // Load trend data when class and subject are selected
  useEffect(() => {
    if (selectedClass && selectedSubject) {
      loadTrendData();
    }
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
        <div className="bg-white/10 backdrop-blur-xl border border-white/40 ring-1 ring-white/20 shadow-2xl rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900">Subject Teacher Dashboard</h1>
          <p className="text-gray-600 mt-1">Enter scores for your assigned subjects</p>
          
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
        <div className="bg-white/10 backdrop-blur-xl border border-white/40 ring-1 ring-white/20 shadow-2xl rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Enter Student Scores</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Class</label>
              <select
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50"
                value={selectedClass}
                onChange={e => setSelectedClass(e.target.value)}
              >
                <option value="">Choose Class</option>
                {getUserClasses().map(cls => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Subject</label>
              <select
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50"
                value={selectedSubject}
                onChange={e => setSelectedSubject(e.target.value)}
              >
                <option value="">Choose Subject</option>
                {getUserSubjects().map(sub => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>

            <div className="flex items-end gap-2">
              <button 
                className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                onClick={() => setShowScoresModal(true)}
                disabled={!selectedClass || !selectedSubject}
              >
                Enter Scores
              </button>
              
              <button 
                className="flex-1 bg-green-600 text-white px-4 py-3 rounded-md hover:bg-green-700 disabled:bg-gray-400 transition-colors"
                onClick={printBroadsheet}
                disabled={!selectedClass || !selectedSubject}
              >
                Print
              </button>
            </div>
            
            <div className="flex items-end">
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
            </div>
            
            {/* New Trend Analysis Button */}
            <div className="flex items-end">
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

          {/* Current Selection Info */}
          {selectedClass && selectedSubject && (
            <div className="bg-blue-50/30 border border-blue-200/50 rounded-md p-4 backdrop-blur-sm">
              <h3 className="font-semibold text-blue-900">
                {selectedSubject} - {selectedClass}
              </h3>
              <p className="text-blue-700 text-sm">
                {filteredLearners.length} students | Teacher: {user?.name}
              </p>
            </div>
          )}
        </div>

        {/* Analytics Section */}
        {showAnalytics && selectedClass && selectedSubject && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900">Performance Analytics</h2>
            
            {analyticsData ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Performance Distribution */}
                <PerformanceChart 
                  data={analyticsData.performanceData} 
                  title="Performance Distribution" 
                  type="pie" 
                />
                
                {/* Student Scores Bar Chart */}
                <PerformanceChart 
                  data={analyticsData.studentScores} 
                  title="Student Scores (Bar)" 
                  type="bar" 
                />
                
                {/* Student Scores Line Chart */}
                <PerformanceChart 
                  data={analyticsData.studentScoresForLine} 
                  title="Student Scores (Line)" 
                  type="line" 
                />
                
                {/* Summary Stats */}
                <div className="bg-white/10 backdrop-blur-xl border border-white/40 ring-1 ring-white/20 shadow-2xl rounded-lg p-6 md:col-span-2">
                  <h3 className="text-lg font-semibold mb-4">Summary Statistics</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50/30 border border-blue-200/50 rounded-lg p-4 text-center">
                      <div className="text-3xl font-bold text-blue-600">{analyticsData.totalStudents}</div>
                      <div className="text-gray-700">Students Assessed</div>
                    </div>
                    <div className="bg-green-50/30 border border-green-200/50 rounded-lg p-4 text-center">
                      <div className="text-3xl font-bold text-green-600">{analyticsData.averageScore}</div>
                      <div className="text-gray-700">Average Score</div>
                    </div>
                    <div className="bg-purple-50/30 border border-purple-200/50 rounded-lg p-4 text-center">
                      <div className="text-3xl font-bold text-purple-600">
                        {analyticsData.performanceData.find(d => d.label === 'Excellent')?.value || 0}
                      </div>
                      <div className="text-gray-700">Excellent Students</div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white/10 backdrop-blur-xl border border-white/40 ring-1 ring-white/20 shadow-2xl rounded-lg p-6">
                <div className="text-center py-8 text-gray-500">
                  <p>No data available for analytics. Please enter student scores first.</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Trend Analysis Section */}
        {showTrendAnalysis && selectedClass && selectedSubject && (
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

        {/* Scores Entry Modal */}
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

                {/* Marks Entry Table */}
                {selectedClass && selectedSubject && filteredLearners.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300 text-sm">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="border border-gray-300 p-3 text-left">Student Name</th>
                          <th className="border border-gray-300 p-2">Test 1<br/>(0-15)</th>
                          <th className="border border-gray-300 p-2">Test 2<br/>(0-15)</th>
                          <th className="border border-gray-300 p-2">Test 3<br/>(0-15)</th>
                          <th className="border border-gray-300 p-2">Test 4<br/>(0-15)</th>
                          <th className="border border-gray-300 p-2">Tests Total</th>
                          <th className="border border-gray-300 p-2">50%</th>
                          <th className="border border-gray-300 p-2">Exam<br/>(0-100)</th>
                          <th className="border border-gray-300 p-2">50%</th>
                          <th className="border border-gray-300 p-2">Final Total</th>
                          <th className="border border-gray-300 p-2">Position</th>
                          <th className="border border-gray-300 p-2">Remarks</th>
                          <th className="border border-gray-300 p-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredLearners.map(learner => {
                          const studentId = learner.idNumber || learner.LearnerID;
                          const studentMarks = marks[studentId] || {};
                          const totals = calculateTotals(studentMarks);
                          const position = positions[studentId];
                          const remarks = getRemarks(totals.finalTotal);
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
                                    placeholder="0"
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
                                  placeholder="0"
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
                              
                              <td className="border border-gray-300 p-3 text-center">
                                <button
                                  onClick={() => saveStudentMarks(studentId)}
                                  disabled={saving}
                                  className={`px-3 py-1 rounded text-sm flex items-center justify-center ${
                                    isSaved 
                                      ? 'bg-green-100 text-green-800' 
                                      : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                                  }`}
                                  title={isSaved ? "Saved" : "Save student marks"}
                                >
                                  {saving ? (
                                    <span className="flex items-center">
                                      <span className="animate-spin rounded-full h-3 w-3 border-b-2 border-current mr-1"></span>
                                      Saving...
                                    </span>
                                  ) : isSaved ? (
                                    <span className="flex items-center">
                                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                      </svg>
                                      Saved
                                    </span>
                                  ) : (
                                    'Save'
                                  )}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    
                    <div className="mt-4 text-xs text-gray-600">
                      <strong>Grading Scale:</strong> 80-100: Excellent | 70-79: Very Good | 60-69: Good | 50-59: Satisfactory | 40-49: Fair | Below 40: Needs Improvement
                    </div>
                  </div>
                ) : selectedClass && selectedSubject ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No students found in {selectedClass}</p>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>Please select both a class and subject to enter marks</p>
                  </div>
                )}

                {/* Modal Action Buttons */}
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
                    {saving ? "Saving..." : "Save All Marks"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default SubjectTeacherPage;