import { useState, useEffect } from 'react';

const LogoWatermark = ({ opacity = 0.1, size = '360px', className = '' }) => {
  const [logoUrl, setLogoUrl] = useState('');

  useEffect(() => {
    // Get logo from localStorage
    const storedLogo = localStorage.getItem('schoolLogo');
    if (storedLogo) {
      setLogoUrl(storedLogo);
    }

    // Listen for logo updates
    const handleStorageChange = (e) => {
      if (e.key === 'schoolLogo') {
        setLogoUrl(e.newValue || '');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom events for same-tab updates
    const handleLogoUpdate = (e) => {
      setLogoUrl(e.detail || '');
    };
    
    window.addEventListener('logoUpdated', handleLogoUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('logoUpdated', handleLogoUpdate);
    };
  }, []);

  if (!logoUrl) {
    return null;
  }

  return (
    <div 
      className={`fixed inset-0 flex items-center justify-center pointer-events-none z-0 ${className}`}
      style={{
        backgroundImage: `url(${logoUrl})`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        backgroundSize: size,
        opacity: opacity
      }}
    />
  );
};

export default LogoWatermark;