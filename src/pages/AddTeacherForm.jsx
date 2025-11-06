import { useState } from "react";
import { useUsers } from "../context/UsersContext";
import { useNotification } from "../context/NotificationContext";

const AddTeacherForm = () => {
  const { addTeacher } = useUsers();
  const { showNotification } = useNotification();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [gender, setGender] = useState("male");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // ✅ FIXED: Added lastName which is required by the API
      await addTeacher({ firstName, lastName, email, password, gender });

      // Show success notification
      showNotification({
        type: "success",
        title: "Success",
        message: "Teacher added successfully!",
        duration: 5000
      });

      // Reset form only on success
      setFirstName("");
      setLastName("");
      setEmail("");
      setPassword("");
      setGender("male");
    } catch (error) {
      // Display user-friendly error message
      showNotification({
        type: "error",
        title: "Error",
        message: error.message || "Failed to add teacher. Please try again.",
        duration: 7000
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-4 rounded shadow-md w-80">
      <h2 className="text-lg font-bold mb-4">Add Teacher</h2>

      <div className="mb-2">
        <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
          First Name
        </label>
        <input
          id="firstName"
          type="text"
          placeholder="First Name"
          value={firstName}
          onChange={e => setFirstName(e.target.value)}
          className="border p-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
          disabled={isLoading}
        />
      </div>

      <div className="mb-2">
        <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
          Last Name
        </label>
        <input
          id="lastName"
          type="text"
          placeholder="Last Name"
          value={lastName}
          onChange={e => setLastName(e.target.value)}
          className="border p-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
          disabled={isLoading}
        />
      </div>

      <div className="mb-2">
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          Email
        </label>
        <input
          id="email"
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="border p-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
          disabled={isLoading}
        />
      </div>

      <div className="mb-2">
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
          Password
        </label>
        <input
          id="password"
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="border p-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
          disabled={isLoading}
        />
      </div>

      <div className="mb-4">
        <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">
          Gender
        </label>
        <select
          id="gender"
          value={gender}
          onChange={e => setGender(e.target.value)}
          className="border p-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isLoading}
        >
          <option value="male">Male</option>
          <option value="female">Female</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="bg-blue-600 text-white py-2 px-4 rounded w-full hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? "Adding Teacher..." : "Add Teacher"}
      </button>
    </form>
  );
};

export default AddTeacherForm;
