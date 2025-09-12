import Layout from "../components/Layout";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { getLearners, updateStudentScores } from "../api";
import { useNavigate, useLocation } from "react-router-dom";

const TeacherDashboardPage = ({ role }) => {
  const { user, switchUserRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [learners, setLearners] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [marks, setMarks] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

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

  // Get available classes - either user's assigned classes or all classes from learners
  const availableClasses = userClasses.length > 0 ? userClasses : [...new Set(learners.map(l => l.className))].filter(Boolean);

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

  // Save all marks
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

  const getRoleSpecificActions = () => {
    const actions = [];
    
    // All teacher roles can enter scores
    if (userSubjects.length > 0) {
      actions.push('Enter Scores');
    }
    
    // Role-specific actions
    switch(currentRole) {
      case 'admin':
        actions.push('Manage System', 'View All Reports', 'Assign Roles');
        break;
      case 'head_teacher':
        actions.push('View School Reports', 'Manage Teachers');
        break;
      case 'class_teacher':
        actions.push('Manage Class', 'Enter Remarks');
        break;
      case 'subject_teacher':
        actions.push('Enter Subject Scores');
        break;
      case 'form_master':
        actions.push('Manage Form Class', 'Enter Remarks');
        break;
      default:
        actions.push('Basic Teacher Functions');
    }
    
    return actions;
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
        {/* Header with Role Info */}
        <div className="bg-white p-6 rounded-lg shadow">
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
            
            <div className="text-right text-sm text-gray-500">
              <div>Available Actions:</div>
              <ul className="mt-1">
                {getRoleSpecificActions().map(action => (
                  <li key={action} className="text-xs">• {action}</li>
                ))}
              </ul>
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

        {/* No subjects warning */}
        {userSubjects.length === 0 && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <div className="flex">
              <div className="text-yellow-800">
                <p className="font-bold">No subjects assigned</p>
                <p>Please contact the administrator to assign subjects to your account.</p>
              </div>
            </div>
          </div>
        )}

        {/* Class & Subject Selection */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Enter Student Scores</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Class</label>
              <select
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={selectedClass}
                onChange={e => setSelectedClass(e.target.value)}
              >
                <option value="">Choose Class</option>
                {availableClasses.map(cls => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Subject</label>
              <select
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={selectedSubject}
                onChange={e => setSelectedSubject(e.target.value)}
              >
                <option value="">Choose Subject</option>
                {userSubjects.map(sub => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>

            <div className="flex items-end gap-2">
              <button 
                className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                onClick={saveAllMarks}
                disabled={saving || !selectedClass || !selectedSubject}
              >
                {saving ? "Saving..." : "Save All Marks"}
              </button>
              
              <button 
                className="flex-1 bg-green-600 text-white px-4 py-3 rounded-md hover:bg-green-700 disabled:bg-gray-400 transition-colors"
                onClick={printBroadsheet}
                disabled={!selectedClass || !selectedSubject}
              >
                Print
              </button>
            </div>
          </div>

          {/* Current Selection Info */}
          {selectedClass && selectedSubject && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
              <h3 className="font-semibold text-blue-900">
                {selectedSubject} - {selectedClass}
              </h3>
              <p className="text-blue-700 text-sm">
                {filteredLearners.length} students | Teacher: {user?.name}
              </p>
            </div>
          )}

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
                  </tr>
                </thead>
                <tbody>
                  {filteredLearners.map(learner => {
                    const studentId = learner.idNumber || learner.LearnerID;
                    const studentMarks = marks[studentId] || {};
                    const totals = calculateTotals(studentMarks);
                    const position = positions[studentId];
                    const remarks = getRemarks(totals.finalTotal);

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
        </div>
      </div>
    </Layout>
  );
};

export default TeacherDashboardPage;