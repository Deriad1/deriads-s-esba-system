import { useState } from "react";
import Layout from "../components/Layout";
import { useUsers } from "../context/UsersContext";
import { useAuth } from "../context/AuthContext";
import BulkTeacherUploadModal from "../components/BulkTeacherUploadModal";

const ManageUsersPage = () => {
  const { teachers, addTeacher } = useUsers();
  const { user } = useAuth();
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [gender, setGender] = useState("male");
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false); // modal state
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false); // bulk upload modal
  const [visiblePasswords, setVisiblePasswords] = useState({}); // Track which passwords are visible

  const togglePasswordVisibility = (teacherId) => {
    setVisiblePasswords(prev => ({
      ...prev,
      [teacherId]: !prev[teacherId]
    }));
  };

  const filteredTeachers = teachers.filter(
    (t) =>
      (t.firstName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const resetForm = () => {
    setEditingTeacher(null);
    setFirstName("");
    setEmail("");
    setPassword("");
    setGender("male");
  };

  const startEdit = (teacher) => {
    setEditingTeacher(teacher.id);
    setFirstName(teacher.firstName);
    setEmail(teacher.email);
    setPassword(teacher.password);
    setGender(teacher.gender);
    setIsModalOpen(true); // open modal for editing
  };

  const handleSave = (e) => {
    e.preventDefault();
    const duplicateEmail = teachers.some(
      (t) => t.email === email && t.id !== editingTeacher
    );
    if (duplicateEmail) {
      alert("Email already exists!");
      return;
    }
    if (editingTeacher) {
      const index = teachers.findIndex((t) => t.id === editingTeacher);
      teachers[index] = { id: editingTeacher, firstName, email, password, gender };
      alert("Teacher updated successfully!");
      resetForm();
      setIsModalOpen(false);
    }
  };

  const handleAddTeacher = (e) => {
    e.preventDefault();
    if (teachers.some((t) => t.email === email)) {
      alert("Email already exists!");
      return;
    }
    addTeacher({ firstName, email, password, gender });
    alert("Teacher added successfully!");
    resetForm();
    setIsModalOpen(false);
  };

  const handleDelete = (id) => {
    if (id === user?.id) {
      alert("You cannot delete yourself!");
      return;
    }
    if (confirm("Are you sure you want to delete this teacher?")) {
      teachers.splice(teachers.findIndex((t) => t.id === id), 1);
      alert("Teacher deleted!");
    }
  };

  const handleBulkUploadSuccess = (count) => {
    alert(`Successfully uploaded ${count} teachers!`);
    // Refresh the page or reload teachers
    window.location.reload();
  };

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-4">Manage Users</h1>

      {/* Top Controls */}
      <div className="flex justify-between mb-4">
        <input
          type="text"
          placeholder="Search by name or email"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="glass-input border p-2 w-80"
        />
        <div className="flex gap-3">
          <button
            onClick={() => setIsBulkUploadOpen(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Bulk Upload
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="glass-button-primary text-white px-4 py-2 rounded"
          >
            Add Teacher
          </button>
        </div>
      </div>

      {/* Teacher Table */}
      <div className="glass-table">
        <table className="min-w-full rounded-lg">
          <thead className="glass-table-header">
            <tr>
              <th className="py-2 px-4">#</th>
              <th className="py-2 px-4">First Name</th>
              <th className="py-2 px-4">Email</th>
              <th className="py-2 px-4">Password</th>
              <th className="py-2 px-4">Gender</th>
              <th className="py-2 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTeachers.map((teacher, idx) => (
              <tr key={teacher.id} className="text-center glass-table-row">
                <td className="py-2 px-4">{idx + 1}</td>
                <td className="py-2 px-4">{teacher.firstName}</td>
                <td className="py-2 px-4">{teacher.email}</td>
                <td className="py-2 px-4">
                  <div className="flex items-center justify-center gap-2">
                    <span className="font-mono">
                      {visiblePasswords[teacher.id] ? teacher.password : '••••••••'}
                    </span>
                    <button
                      onClick={() => togglePasswordVisibility(teacher.id)}
                      className="p-1 hover:bg-gray-200 rounded transition-colors"
                      title={visiblePasswords[teacher.id] ? "Hide password" : "Show password"}
                    >
                      {visiblePasswords[teacher.id] ? (
                        <svg className="w-5 h-5 text-white/90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-white/90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </td>
                <td className="py-2 px-4">{teacher.gender}</td>
                <td className="py-2 px-4 flex justify-center gap-2">
                  <button
                    onClick={() => startEdit(teacher)}
                    className="glass-button px-2 py-1 rounded"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(teacher.id)}
                    className="glass-button-danger text-white px-2 py-1 rounded"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal for Add/Edit Teacher */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="glass-modal p-6 rounded shadow-md w-96">
            <h2 className="text-lg font-bold mb-4">
              {editingTeacher ? "Edit Teacher" : "Add Teacher"}
            </h2>
            <form onSubmit={editingTeacher ? handleSave : handleAddTeacher}>
              <input
                type="text"
                placeholder="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="glass-input border p-2 mb-2 w-full"
                required
              />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="glass-input border p-2 mb-2 w-full"
                required
              />
              <input
                type="text"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="glass-input border p-2 mb-2 w-full"
                required
              />
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="glass-input border p-2 mb-4 w-full"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
              <div className="flex justify-between">
                <button
                  type="submit"
                  className={`glass-button ${
                    editingTeacher ? "glass-button-success" : "glass-button-primary"
                  } text-white px-4 py-2 rounded`}
                >
                  {editingTeacher ? "Save Changes" : "Add Teacher"}
                </button>
                <button
                  type="button"
                  onClick={() => { resetForm(); setIsModalOpen(false); }}
                  className="glass-button px-4 py-2 rounded"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Upload Modal */}
      <BulkTeacherUploadModal
        isOpen={isBulkUploadOpen}
        onClose={() => setIsBulkUploadOpen(false)}
        onUploadSuccess={handleBulkUploadSuccess}
      />
    </Layout>
  );
};

export default ManageUsersPage;