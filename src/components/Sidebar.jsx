import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Sidebar = () => {
  const { user } = useAuth();
  const location = useLocation();

  let links = [];

  if (user?.role === "admin") {
    links = [
      { to: "/admin-dashboard", label: "Dashboard" },
      { to: "/manage-users", label: "Manage Users" },
    ];
  } else if (user?.role === "teacher") {
    links = [
      { to: "/teacher-dashboard", label: "Dashboard" },
      { to: "/my-classes", label: "My Classes" },
    ];
  }

  return (
    <aside className="w-64 bg-white shadow-md p-4">
      <nav className="flex flex-col gap-2">
        {links.map(link => (
          <Link key={link.to} to={link.to} className={`p-2 rounded-md ${location.pathname === link.to ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-gray-200"}`}>
            {link.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
