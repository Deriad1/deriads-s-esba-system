import Layout from "../components/Layout";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { getLearners, updateFormMasterRemarks, getClassPerformanceTrends } from "../api";
import PerformanceChart from "../components/PerformanceChart";
import TrendAnalysisChart from "../components/TrendAnalysisChart";

const ClassTeacherPage = () => {
  const { user } = useAuth();
  
  const [learners, setLearners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedClass, setSelectedClass] = useState("");
  const [remarks, setRemarks] = useState({});
  const [attendance, setAttendance] = useState({});
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showTrendAnalysis, setShowTrendAnalysis] = useState(false); // New state for trend analysis
  const [classTrendData, setClassTrendData] = useState(null); // New state for trend data

  // Get user's assigned classes
  const getUserClasses = () => {
    if (Array.isArray(user?.classes)) {
      return user.classes.filter(cls => cls !== 'ALL');
    }
    return [];
  };

  // Load trend data when class is selected
  useEffect(() => {
    if (selectedClass) {
      loadTrendData();
    }
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

  // Initialize remarks and attendance when class changes
  useEffect(() => {
    if (selectedClass && filteredLearners.length > 0) {
      const newRemarks = {};
      const newAttendance = {};
      filteredLearners.forEach(learner => {
        const key = learner.idNumber || learner.LearnerID;
        newRemarks[key] = "";
        newAttendance[key] = "";
      });
      setRemarks(newRemarks);
      setAttendance(newAttendance);
    }
  }, [selectedClass, filteredLearners.length]);

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

  // Save all remarks and attendance
  const saveAllData = async () => {
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
            const response = await updateFormMasterRemarks({
              studentId,
              className: selectedClass,
              term: 'Term 3',
              remarks: studentRemark || "",
              attendance: studentAttendance || ""
            });
            
            if (response.status === 'success') {
              successCount++;
            } else {
              errorCount++;
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

  // Get analytics data for the selected class
  const getAnalyticsData = () => {
    if (!selectedClass) return null;

    // Get students with data entered
    const studentsWithData = filteredLearners.filter(learner => {
      const studentId = learner.idNumber || learner.LearnerID;
      return (remarks[studentId] && remarks[studentId].trim() !== "") || 
             (attendance[studentId] && attendance[studentId].trim() !== "");
    });

    if (studentsWithData.length === 0) return null;

    // Calculate attendance statistics
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
  };

  const analyticsData = getAnalyticsData();

  // Print class report
  const printClassReport = () => {
    if (!selectedClass) {
      alert("Please select a class first.");
      return;
    }

    try {
      let tableRows = '';
      filteredLearners.forEach((learner) => {
        const studentId = learner.idNumber || learner.LearnerID;
        const studentRemark = remarks[studentId] || '';
        const studentAttendance = attendance[studentId] || '';
        
        tableRows += `
          <tr>
            <td style="border: 1px solid black; padding: 4px;">${learner.firstName} ${learner.lastName}</td>
            <td style="border: 1px solid black; padding: 4px; text-align: center;">${studentAttendance}</td>
            <td style="border: 1px solid black; padding: 4px;">${studentRemark}</td>
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
                Class: ${selectedClass} | Class Teacher: ${user?.name} | Date: ${new Date().toLocaleDateString()}
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
        <div className="bg-white p-6 rounded-lg shadow">
          <h1 className="text-2xl font-bold text-gray-900">Class Teacher Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage your assigned class and enter student remarks</p>
          
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              CLASS TEACHER
            </span>
            {getUserClasses().length > 0 && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                {getUserClasses().length} Assigned Class{getUserClasses().length !== 1 ? 'es' : ''}
              </span>
            )}
          </div>
        </div>

        {/* No classes warning */}
        {getUserClasses().length === 0 && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <div className="flex">
              <div className="text-yellow-800">
                <p className="font-bold">No classes assigned</p>
                <p>Please contact the administrator to assign classes to your account.</p>
              </div>
            </div>
          </div>
        )}

        {/* Class Selection */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Class Management</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Class</label>
              <select
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={selectedClass}
                onChange={e => setSelectedClass(e.target.value)}
              >
                <option value="">Choose Class</option>
                {getUserClasses().map(cls => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
              </select>
            </div>

            <div className="flex items-end gap-2">
              <button 
                className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                onClick={saveAllData}
                disabled={saving || !selectedClass}
              >
                {saving ? "Saving..." : "Save All Data"}
              </button>
              
              <button 
                className="flex-1 bg-green-600 text-white px-4 py-3 rounded-md hover:bg-green-700 disabled:bg-gray-400 transition-colors"
                onClick={printClassReport}
                disabled={!selectedClass}
              >
                Print Report
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
                disabled={!selectedClass}
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
                disabled={!selectedClass}
              >
                {showTrendAnalysis ? "Hide Trends" : "Show Trends"}
              </button>
            </div>
          </div>

          {/* Current Selection Info */}
          {selectedClass && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
              <h3 className="font-semibold text-blue-900">
                Class: {selectedClass}
              </h3>
              <p className="text-blue-700 text-sm">
                {filteredLearners.length} students | Class Teacher: {user?.name}
              </p>
            </div>
          )}

          {/* Analytics Section */}
          {showAnalytics && selectedClass && (
            <div className="space-y-6 mt-6">
              <h2 className="text-xl font-bold text-gray-900">Class Analytics</h2>
              
              {analyticsData ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Summary Stats */}
                  <div className="bg-white/10 backdrop-blur-xl border border-white/40 ring-1 ring-white/20 shadow-2xl rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4">Attendance Summary</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-blue-50/30 border border-blue-200/50 rounded-lg p-4 text-center">
                        <div className="text-3xl font-bold text-blue-600">{analyticsData.totalStudents}</div>
                        <div className="text-gray-700">Students with Data</div>
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
                <div className="bg-white/10 backdrop-blur-xl border border-white/40 ring-1 ring-white/20 shadow-2xl rounded-lg p-6">
                  <div className="text-center py-8 text-gray-500">
                    <p>No data available for analytics. Please enter student data first.</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Trend Analysis Section */}
          {showTrendAnalysis && selectedClass && (
            <div className="space-y-6 mt-6">
              <h2 className="text-xl font-bold text-gray-900">Class Performance Trends</h2>
              
              {classTrendData ? (
                <div className="grid grid-cols-1 gap-6">
                  <TrendAnalysisChart 
                    data={classTrendData} 
                    title={`Class Performance Trend: ${selectedClass}`}
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

          {/* Remarks and Attendance Entry Table */}
          {selectedClass && filteredLearners.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300 text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 p-3 text-left">Student Name</th>
                    <th className="border border-gray-300 p-3">Attendance</th>
                    <th className="border border-gray-300 p-3 text-left">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLearners.map(learner => {
                    const studentId = learner.idNumber || learner.LearnerID;
                    
                    return (
                      <tr key={studentId} className="hover:bg-gray-50">
                        <td className="border border-gray-300 p-3 font-medium">
                          {learner.firstName} {learner.lastName}
                        </td>
                        
                        <td className="border border-gray-300 p-1 text-center">
                          <input 
                            type="text"
                            value={attendance[studentId] || ''}
                            onChange={(e) => handleAttendanceChange(studentId, e.target.value)}
                            className="w-20 p-2 border rounded text-center focus:ring-2 focus:ring-blue-500"
                            placeholder="Days"
                            maxLength="3"
                          />
                        </td>
                        
                        <td className="border border-gray-300 p-1">
                          <textarea
                            value={remarks[studentId] || ''}
                            onChange={(e) => handleRemarkChange(studentId, e.target.value)}
                            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter remarks..."
                            rows="2"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : selectedClass ? (
            <div className="text-center py-8 text-gray-500">
              <p>No students found in {selectedClass}</p>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>Please select a class to manage student remarks and attendance</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ClassTeacherPage;