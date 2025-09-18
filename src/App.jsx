import React from 'react';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { LoadingProvider } from './context/LoadingContext';
import Routes from './Routes';
import Notification from './components/Notification';
import './App.css';

function App() {
  return (
    <NotificationProvider>
      <LoadingProvider>
        <AuthProvider>
          <div className="App">
            <Routes />
            <Notification />
          </div>
        </AuthProvider>
      </LoadingProvider>
    </NotificationProvider>
  );
}

export default App;