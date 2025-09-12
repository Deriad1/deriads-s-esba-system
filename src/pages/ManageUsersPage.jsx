import { useState } from "react";
import Layout from "../components/Layout";
import { useUsers } from "../context/UsersContext";
import { useAuth } from "../context/AuthContext";

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

  const filteredTeachers = teachers.filter(
    (t) =>
      t.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.email.toLowerCase().includes(searchTerm.toLowerCase())
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
          className="border p-2 w-80"
        />
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Add Teacher
        </button>
      </div>

      {/* Teacher Table */}
      <table className="min-w-full bg-white shadow-md rounded mb-4">
        <thead className="bg-gray-200">
          <tr>
            <th className="py-2 px-4">#</th>
            <th className="py-2 px-4">First Name</th>
            <th className="py-2 px-4">Email</th>
            <th className="py-2 px-4">Gender</th>
            <th className="py-2 px-4">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredTeachers.map((teacher, idx) => (
            <tr key={teacher.id} className="text-center border-b">
              <td className="py-2 px-4">{idx + 1}</td>
              <td className="py-2 px-4">{teacher.firstName}</td>
              <td className="py-2 px-4">{teacher.email}</td>
              <td className="py-2 px-4">{teacher.gender}</td>
              <td className="py-2 px-4 flex justify-center gap-2">
                <button
                  onClick={() => startEdit(teacher)}
                  className="bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(teacher.id)}
                  className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modal for Add/Edit Teacher */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded shadow-md w-96">
            <h2 className="text-lg font-bold mb-4">
              {editingTeacher ? "Edit Teacher" : "Add Teacher"}
            </h2>
            <form onSubmit={editingTeacher ? handleSave : handleAddTeacher}>
              <input
                type="text"
                placeholder="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="border p-2 mb-2 w-full"
                required
              />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border p-2 mb-2 w-full"
                required
              />
              <input
                type="text"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border p-2 mb-2 w-full"
                required
              />
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="border p-2 mb-4 w-full"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
              <div className="flex justify-between">
                <button
                  type="submit"
                  className={`py-2 px-4 rounded text-white ${
                    editingTeacher ? "bg-green-600 hover:bg-green-700" : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  {editingTeacher ? "Save Changes" : "Add Teacher"}
                </button>
                <button
                  type="button"
                  onClick={() => { resetForm(); setIsModalOpen(false); }}
                  className="py-2 px-4 rounded bg-gray-500 hover:bg-gray-600 text-white"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default ManageUsersPage;
