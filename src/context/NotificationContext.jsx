import React, { createContext, useContext, useState, useCallback } from "react";

const NotificationContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotification must be used within a NotificationProvider");
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const showNotification = useCallback((notification) => {
    const id = Date.now() + Math.random();
    const newNotification = {
      id,
      type: notification.type || "info", // info, success, warning, error
      message: notification.message,
      title: notification.title || null,
      duration: notification.duration || 5000, // Auto-dismiss after 5 seconds by default
      action: notification.action || null, // Optional action button
      ...notification
    };

    setNotifications(prev => [...prev, newNotification]);

    // Auto-dismiss notification
    if (newNotification.duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, newNotification.duration);
    }

    return id;
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return (
    <NotificationContext.Provider value={{ 
      notifications, 
      showNotification, 
      removeNotification, 
      clearNotifications 
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;