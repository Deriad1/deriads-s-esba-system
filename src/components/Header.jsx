import React, { useContext } from 'react';
import { GlobalSettingsContext } from '../contexts/GlobalSettingsProvider';

export default function Header() {
  const { settings } = useContext(GlobalSettingsContext);
  const logo = settings.logo_url;
  return (
    <header className="app-header">
      {logo ? <img src={logo} alt="logo" style={{height:48}} /> : <span>School</span>}
      {/* rest of header */}
    </header>
  );
}