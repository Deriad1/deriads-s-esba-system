import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useGlobalSettings } from '../context/GlobalSettingsContext';

const TeacherNavbar = ({ setShowSettingsPanel }) => {
  const { user, logout } = useAuth();
  const { settings } = useGlobalSettings();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Debugging: Log the global settings
  console.log('TeacherNavbar - Global Settings:', settings);

  // For the main dashboard links, we'll use anchor links to scroll to sections
  const navItems = [
    { name: 'Dashboard', path: '/teacher' },
    { name: 'Classes', path: '/teacher#classes' },
    { name: 'Students', path: '/teacher#students' },
    { name: 'Performance', path: '/teacher#performance' },
  ];

  if (user?.role === 'headteacher') {
    navItems.push({ name: 'Admin', path: '/headteacher' });
  }

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  // Function to handle anchor link clicks
  const handleAnchorClick = (e, path) => {
    // If we're already on the teacher page, scroll to the section
    if (location.pathname === '/teacher' && path.startsWith('/teacher#')) {
      e.preventDefault();
      const sectionId = path.split('#')[1];
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
    closeMenu();
  };

  return (
    <>
      {/* Mobile menu button */}
      <div className="md:hidden fixed top-4 right-4 z-50">
        <button
          onClick={toggleMenu}
          className="glass-button p-2 rounded-md text-white text-shadow"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {isMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu overlay */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={closeMenu}
        ></div>
      )}

      {/* Horizontal navbar for desktop, slide-down menu for mobile */}
      <nav 
        className={`glass-navbar w-full p-4 flex flex-col md:flex-row md:items-center md:justify-between fixed md:static z-50 transform transition-transform duration-300 ease-in-out md:translate-x-0 ${ 
          isMenuOpen ? 'translate-y-0' : '-translate-y-full'
        } md:translate-y-0`}
      >
        <div className="flex items-center mb-4 md:mb-0">
          {settings.schoolLogo && settings.schoolLogo !== '' ? (
            <img 
              src={settings.schoolLogo} 
              alt="School Logo" 
              className="h-10 w-10 object-contain mr-2"
            />
          ) : (
            <div className="bg-gray-200 border-2 border-dashed rounded-xl w-10 h-10 mr-2" />
          )}
          <h1 className="text-xl font-bold text-white text-shadow">{settings.schoolName || 'DERIAD\'S eSBA'}</h1>
        </div>

        {/* Navigation items */}
        <ul className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4 mb-4 md:mb-0">
          {navItems.map((item) => (
            <li key={item.path}>
              {item.path.startsWith('/teacher#') ? (
                <a
                  href={item.path}
                  onClick={(e) => handleAnchorClick(e, item.path)}
                  className={`block py-2 px-4 rounded-lg transition duration-200 text-shadow ${ 
                    location.pathname === '/teacher' && window.location.hash === `#${item.path.split('#')[1]}`
                      ? 'bg-white/5 text-white'
                      : 'text-gray-300 hover:bg-white/3 hover:text-white'
                  }`}
                >
                  {item.name}
                </a>
              ) : (
                <Link
                  to={item.path}
                  onClick={closeMenu}
                  className={`block py-2 px-4 rounded-lg transition duration-200 text-shadow ${ 
                    location.pathname === item.path
                      ? 'bg-white/5 text-white'
                      : 'text-gray-300 hover:bg-white/3 hover:text-white'
                  }`}
                >
                  {item.name}
                </Link>
              )}
            </li>
          ))}
        </ul>

        {/* User profile section */}
        <div className="glass-extra-transparent p-3 rounded-lg flex items-center">
          <div className="bg-gray-200 border-2 border-dashed rounded-xl w-8 h-8 mr-2" />
          <div className="mr-3 hidden md:block">
            <p className="text-sm font-medium text-white text-shadow">{user?.name}</p>
            <p className="text-xs text-gray-300 capitalize text-shadow">{user?.role}</p>
          </div>
          <button
            onClick={() => setShowSettingsPanel(true)}
            className="py-1 px-3 bg-blue-600/80 hover:bg-blue-600/90 text-white rounded-lg transition duration-200 text-sm text-shadow mr-2"
          >
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
  <path d="M19.8293 10.1707C19.9234 10.7839 20 11.3899 20 12C20 12.6101 19.9234 13.2161 19.8293 13.8293L21.8259 15.413C22.0683 15.6019 22.1385 15.9249 22.0054 16.201L20.0054 19.799C19.8723 20.0751 19.5552 20.2251 19.262 20.1228L16.8982 19.14C16.2313 19.623 15.4936 20.0169 14.6993 20.292L14.3359 22.8025C14.2983 23.0796 14.0582 23.2857 13.7715 23.2857H10.2285C9.94184 23.2857 9.70174 23.0796 9.66413 22.8025L9.30075 20.292C8.50639 20.0169 7.76872 19.623 7.10183 19.14L4.73799 20.1228C4.44482 20.2251 4.12771 20.0751 3.9946 19.799L1.9946 16.201C1.86149 15.9249 1.93172 15.6019 2.17411 15.413L4.17073 13.8293C4.07664 13.2161 4 12.6101 4 12C4 11.3899 4.07664 10.7839 4.17073 10.1707L2.17411 8.58696C1.93172 8.39811 1.86149 8.07505 1.9946 7.79901L3.9946 4.20099C4.12771 3.92495 4.44482 3.7749 4.73799 3.87723L7.10183 4.86004C7.76872 4.37699 8.50639 3.98314 9.30075 3.70801L9.66413 1.19751C9.70174 0.92044 9.94184 0.714286 10.2285 0.714286H13.7715C14.0582 0.714286 14.2983 0.92044 14.3359 1.19751L14.6993 3.70801C15.4936 3.98314 16.2313 4.37699 16.8982 4.86004L19.262 3.87723C19.5552 3.7749 19.8723 3.92495 20.0054 4.20099L22.0054 7.79901C22.1385 8.07505 22.0683 8.39811 21.8259 8.58696L19.8293 10.1707ZM12 16C9.79086 16 8 14.2091 8 12C8 9.79086 9.79086 8 12 8C14.2091 8 16 9.79086 16 12C16 14.2091 14.2091 16 12 16Z"></path>
</svg>
          </button>
          <button
            onClick={() => { logout(); closeMenu(); }}
            className="py-1 px-3 bg-red-600/80 hover:bg-red-600/90 text-white rounded-lg transition duration-200 text-sm text-shadow"
          >
            Logout
          </button>
        </div>
      </nav>
    </>
  );
};

export default TeacherNavbar;
