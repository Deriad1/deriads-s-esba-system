import React, { createContext, useEffect, useState } from 'react';

// eslint-disable-next-line react-refresh/only-export-components
export const GlobalSettingsContext = createContext({
  settings: {},
  setSetting: async () => {}
});

export function GlobalSettingsProvider({ children }) {
  const [settings, setSettings] = useState(() => {
    try { 
      // TODO: Migrate to PostgreSQL-based settings storage
      return JSON.parse(localStorage.getItem('app_settings')) || {}; 
    } catch { 
      return {}; 
    }
  });

  // apply styles to document
  const applySettings = (s) => {
    if (typeof document === 'undefined') return;
    const bg = s.background_url || '';
    document.body.style.backgroundImage = bg ? `url('${bg}')` : '';
    document.body.style.backgroundSize = bg ? 'cover' : '';
    document.body.style.backgroundRepeat = 'no-repeat';
    // css var for logo
    document.documentElement.style.setProperty('--site-logo-url', s.logo_url ? `url('${s.logo_url}')` : 'none');
  };

  useEffect(() => {
    applySettings(settings);
    // TODO: Migrate to PostgreSQL-based settings storage
    localStorage.setItem('app_settings', JSON.stringify(settings));
  }, [settings]);

  // fetch from API once
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/settings');
        if (!res.ok) {
          console.warn('Settings API not available, using localStorage only');
          return;
        }
        const data = await res.json();
        if (data && data.data) {
          setSettings(prev => ({ ...prev, ...data.data }));
        }
      } catch (error) {
        console.warn('Failed to load settings from API, using localStorage:', error.message);
        /* ignore - use localStorage settings */
      }
    }
    load();
  }, []);

  const setSetting = async (key, value) => {
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value })
      });
      setSettings(prev => ({ ...prev, [key]: value }));
    } catch (e) { console.error(e); }
  };

  return (
    <GlobalSettingsContext.Provider value={{ settings, setSetting }}>
      {children}
    </GlobalSettingsContext.Provider>
  );
}