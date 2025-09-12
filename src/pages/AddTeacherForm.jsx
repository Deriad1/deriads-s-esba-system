import { useState } from "react";
import { useUsers } from "../context/UsersContext";

const AddTeacherForm = () => {
  const { addTeacher } = useUsers();
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [gender, setGender] = useState("male");

  const handleSubmit = (e) => {
    e.preventDefault();
    addTeacher({ firstName, email, password, gender });
    setFirstName(""); setEmail(""); setPassword(""); setGender("male");
    alert("Teacher added successfully!");
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-4 rounded shadow-md w-80">
      <h2 className="text-lg font-bold mb-4">Add Teacher</h2>
      <input type="text" placeholder="First Name" value={firstName} onChange={e => setFirstName(e.target.value)} className="border p-2 mb-2 w-full" required />
      <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="border p-2 mb-2 w-full" required />
      <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="border p-2 mb-2 w-full" required />
      <select value={gender} onChange={e => setGender(e.target.value)} className="border p-2 mb-4 w-full">
        <option value="male">Male</option>
        <option value="female">Female</option>
      </select>
      <button type="submit" className="bg-blue-600 text-white py-2 px-4 rounded w-full hover:bg-blue-700">Add Teacher</button>
    </form>
  );
};

export default AddTeacherForm;
