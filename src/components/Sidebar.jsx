import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";

const Sidebar = ({ isOpen, onClose }) => {
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

  const handleLinkClick = () => {
    // Close mobile drawer when link is clicked
    if (onClose) {
      onClose();
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar - Desktop: always visible, Mobile: drawer */}
      <aside
        className={`
          fixed md:static inset-y-0 left-0 z-50
          w-64 bg-white shadow-md p-4
          transform transition-transform duration-300 ease-in-out
          md:transform-none
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Close button for mobile */}
        <button
          onClick={onClose}
          className="md:hidden absolute top-4 right-4 text-gray-500 hover:text-gray-700"
          aria-label="Close sidebar"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <nav className="flex flex-col gap-2 mt-12 md:mt-0">
          {links.map(link => (
            <Link
              key={link.to}
              to={link.to}
              onClick={handleLinkClick}
              className={`p-3 md:p-2 rounded-md text-base md:text-sm transition-colors ${
                location.pathname === link.to
                  ? "bg-blue-600 text-white"
                  : "text-gray-700 hover:bg-gray-200 active:bg-gray-300"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
