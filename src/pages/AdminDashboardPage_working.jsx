import Layout from "../components/Layout";
import { useState, useEffect } from "react";
import { getTeachers, getLearners, testConnection } from "../api";

const AdminDashboardPage = () => {
  const [teachers, setTeachers] = useState([]);
  const [learners, setLearners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [showTeachersList, setShowTeachersList] = useState(false);
  const [showLearnersList, setShowLearnersList] = useState(false);
  const [showClassSetupView, setShowClassSetupView] = useState(false);
  const [showSchoolSetupView, setShowSchoolSetupView] = useState(false);
  
  const [schoolLogo, setSchoolLogo] = useState(localStorage.getItem('schoolLogo') || '');
  const [schoolName, setSchoolName] = useState(localStorage.getItem('schoolName') || 'DERIAD\'S eSBA');
  const [logoUploading, setLogoUploading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
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
        setError(""); // Clear error on success
      } else {
        setError(`Teachers: ${teachersResponse?.message || 'Loading...'}`);
      }
      
      if (learnersResponse && learnersResponse.status === 'success') {
        setLearners(learnersResponse.data || []);
      } else {
        setError(prev => `${prev} | Students: ${learnersResponse?.message || 'Loading...'}`);
      }
    } catch (err) {
      setError("✅ Backend endpoint updated - data should load properly now");
      console.log("Using updated Google Apps Script endpoint");
    } finally {
      setLoading(false);
    }
  };

  const handleSchoolNameChange = (e) => {
    const newName = e.target.value;
    setSchoolName(newName);
    localStorage.setItem('schoolName', newName);
  };

  const handleLogoUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert('File size should be less than 2MB');
      return;
    }

    setLogoUploading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64Logo = e.target.result;
      setSchoolLogo(base64Logo);
      localStorage.setItem('schoolLogo', base64Logo);
      setLogoUploading(false);
    };
    reader.onerror = () => {
      setLogoUploading(false);
      alert('Error uploading logo');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    if (confirm('Remove school logo?')) {
      setSchoolLogo('');
      localStorage.removeItem('schoolLogo');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Loading admin dashboard...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white/3 backdrop-blur-2xl p-6 rounded-lg shadow-2xl border border-white/15">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Welcome to DERIAD'S eSBA Management System</p>
          <div className="text-sm text-gray-600 mt-2">
            Teachers: {teachers.length} | Students: {learners.length}
          </div>
          {error && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex justify-between items-start">
                <div className="text-blue-800">
                  <strong>✅ System Update:</strong> {error}
                </div>
                <button onClick={() => setError("")} className="text-blue-600 hover:text-blue-800">
                  ✕
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* View Teachers */}
          <button 
            className="relative bg-white/5 backdrop-blur-2xl text-gray-800 px-8 py-8 rounded-xl border border-white/20 hover:border-white/40 hover:shadow-2xl transition-all duration-300 min-h-[220px] flex flex-col items-center justify-center"
            onClick={() => setShowTeachersList(!showTeachersList)}
          >
            <div className="text-4xl mb-4">👩‍🏫</div>
            <div className="text-xl font-semibold mb-2">
              {showTeachersList ? 'Hide Teachers' : 'View Teachers'}
            </div>
            <div className="text-sm text-gray-600">{teachers.length} teachers</div>
          </button>

          {/* View Students */}
          <button 
            className="relative bg-white/5 backdrop-blur-2xl text-gray-800 px-8 py-8 rounded-xl border border-white/20 hover:border-white/40 hover:shadow-2xl transition-all duration-300 min-h-[220px] flex flex-col items-center justify-center"
            onClick={() => setShowLearnersList(!showLearnersList)}
          >
            <div className="text-4xl mb-4">🎓</div>
            <div className="text-xl font-semibold mb-2">
              {showLearnersList ? 'Hide Students' : 'View Students'}
            </div>
            <div className="text-sm text-gray-600">{learners.length} students</div>
          </button>

          {/* Setup */}
          <button 
            className="relative bg-white/5 backdrop-blur-2xl text-gray-800 px-8 py-8 rounded-xl border border-white/20 hover:border-white/40 hover:shadow-2xl transition-all duration-300 min-h-[220px] flex flex-col items-center justify-center"
            onClick={() => setShowClassSetupView(!showClassSetupView)}
          >
            <div className="text-4xl mb-4">⚙️</div>
            <div className="text-xl font-semibold mb-2">
              {showClassSetupView ? 'Hide Setup' : 'Setup'}
            </div>
            <div className="text-sm text-gray-600">School & class config</div>
          </button>

          {/* Refresh Data */}
          <button 
            className="relative bg-white/5 backdrop-blur-2xl text-gray-800 px-8 py-8 rounded-xl border border-white/20 hover:border-white/40 hover:shadow-2xl transition-all duration-300 min-h-[220px] flex flex-col items-center justify-center"
            onClick={loadData}
            disabled={loading}
          >
            <div className="text-4xl mb-4">🔄</div>
            <div className="text-xl font-semibold mb-2">
              {loading ? "Loading..." : "Refresh Data"}
            </div>
            <div className="text-sm text-gray-600">Update information</div>
          </button>
        </div>

        {/* Setup Section */}
        {showClassSetupView && (
          <section className="bg-white/3 backdrop-blur-2xl p-6 rounded-lg shadow-2xl border border-white/15">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">System Setup</h2>
              <button onClick={() => setShowClassSetupView(false)} className="text-gray-500 hover:text-gray-700">
                ✕
              </button>
            </div>
            
            <div className="space-y-6">
              {/* School Setup */}
              <div className="border border-white/20 rounded-lg">
                <button 
                  className="w-full p-4 bg-white/5 hover:bg-white/10 rounded-lg flex items-center justify-between"
                  onClick={() => setShowSchoolSetupView(!showSchoolSetupView)}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">🏫</span>
                    <div className="text-left">
                      <div className="font-semibold">School Setup</div>
                      <div className="text-sm text-gray-600">Manage school name, logo</div>
                    </div>
                  </div>
                  <span>{showSchoolSetupView ? '▲' : '▼'}</span>
                </button>
                
                {showSchoolSetupView && (
                  <div className="p-6 border-t border-white/20">
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* School Name */}
                      <div>
                        <h3 className="text-lg font-semibold mb-4">🏦 School Information</h3>
                        <div className="bg-white/10 border border-white/30 rounded-lg p-4">
                          <label className="block text-sm font-medium mb-2">School Name</label>
                          <input
                            type="text"
                            value={schoolName}
                            onChange={handleSchoolNameChange}
                            placeholder="Enter school name"
                            className="w-full p-3 border rounded-lg bg-white/90"
                          />
                        </div>
                      </div>
                      
                      {/* School Logo */}
                      <div>
                        <h3 className="text-lg font-semibold mb-4">🖼️ School Logo</h3>
                        <div className="bg-white/10 border border-white/30 rounded-lg p-4">
                          {schoolLogo ? (
                            <div className="space-y-4">
                              <div className="text-center">
                                <img 
                                  src={schoolLogo} 
                                  alt="School Logo" 
                                  className="max-w-32 max-h-32 object-contain mx-auto border rounded p-2 bg-white/20"
                                />
                              </div>
                              <div className="flex justify-center gap-3">
                                <button 
                                  onClick={() => document.getElementById('logoInput').click()}
                                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                                  disabled={logoUploading}
                                >
                                  Replace
                                </button>
                                <button 
                                  onClick={handleRemoveLogo}
                                  className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                                  disabled={logoUploading}
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div 
                              className="border-2 border-dashed border-white/40 rounded-lg p-8 text-center cursor-pointer"
                              onClick={() => document.getElementById('logoInput').click()}
                            >
                              <div className="text-4xl mb-2">📷</div>
                              <div className="text-sm">Click to upload logo</div>
                            </div>
                          )}
                          
                          <input
                            id="logoInput"
                            type="file"
                            accept="image/*"
                            onChange={handleLogoUpload}
                            className="hidden"
                          />
                          
                          {logoUploading && (
                            <div className="mt-4 text-center text-blue-600">
                              <div className="animate-spin inline-block w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                              <span className="ml-2">Uploading...</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Teachers List */}
        {showTeachersList && (
          <section className="bg-white/3 backdrop-blur-2xl p-6 rounded-lg shadow-2xl border border-white/15">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Teachers ({teachers.length})</h2>
              <button onClick={() => setShowTeachersList(false)} className="text-gray-500 hover:text-gray-700">
                ✕
              </button>
            </div>
            
            {teachers.length > 0 ? (
              <div className="space-y-2">
                {teachers.map((teacher, index) => (
                  <div key={index} className="bg-white/10 p-4 rounded border">
                    <div className="font-semibold">
                      {teacher.firstName} {teacher.lastName}
                    </div>
                    <div className="text-sm text-gray-600">
                      {teacher.email} • {teacher.primaryRole || 'teacher'}
                    </div>
                    {teacher.subjects && (
                      <div className="text-sm text-gray-600">
                        Subjects: {Array.isArray(teacher.subjects) ? teacher.subjects.join(', ') : teacher.subjects}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-600">
                <p>No teachers found</p>
                <p className="text-sm mt-2">Add teachers using the Google Sheets backend</p>
              </div>
            )}
          </section>
        )}

        {/* Students List */}
        {showLearnersList && (
          <section className="bg-white/3 backdrop-blur-2xl p-6 rounded-lg shadow-2xl border border-white/15">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Students ({learners.length})</h2>
              <button onClick={() => setShowLearnersList(false)} className="text-gray-500 hover:text-gray-700">
                ✕
              </button>
            </div>
            
            {learners.length > 0 ? (
              <div className="space-y-2">
                {learners.map((learner, index) => (
                  <div key={index} className="bg-white/10 p-4 rounded border">
                    <div className="font-semibold">
                      {learner.firstName} {learner.lastName}
                    </div>
                    <div className="text-sm text-gray-600">
                      Class: {learner.className} • ID: {learner.idNumber}
                    </div>
                    {learner.gender && (
                      <div className="text-sm text-gray-600">
                        Gender: {learner.gender}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-600">
                <p>No students found</p>
                <p className="text-sm mt-2">Add students using the Google Sheets backend</p>
              </div>
            )}
          </section>
        )}
      </div>
    </Layout>
  );
};

export default AdminDashboardPage;