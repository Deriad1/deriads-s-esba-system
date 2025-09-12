import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const Navbar = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();          // Clear user authentication state
    navigate("/login"); // Redirect to login page
  };

  return (
    <nav className="bg-gray-800 text-white p-4 flex justify-between">
      <div>eSBA System</div>
      <button
        className="bg-red-600 px-3 py-1 rounded hover:bg-red-700"
        onClick={handleLogout}
      >
        Logout
      </button>
    </nav>
  );
};

export default Navbar;
