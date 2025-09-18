import React from "react";
import { useNotification } from './context/NotificationContext';
import { useLoading } from './context/LoadingContext';
import LoadingSpinner from './components/LoadingSpinner';

const NotificationTest = () => {
  const { showNotification } = useNotification();
  const { setLoading, isLoading, getLoadingMessage } = useLoading();
  const loadingKey = "test";

  const testNotifications = () => {
    // Test success notification
    showNotification({
      title: "Test Success",
      message: "Success notification is working!",
      type: "success",
      duration: 3000
    });

    // Test error notification
    setTimeout(() => {
      showNotification({
        title: "Test Error",
        message: "Error notification is working!",
        type: "error",
        duration: 3000
      });
    }, 1000);

    // Test warning notification
    setTimeout(() => {
      showNotification({
        title: "Test Warning",
        message: "Warning notification is working!",
        type: "warning",
        duration: 3000
      });
    }, 2000);

    // Test info notification
    setTimeout(() => {
      showNotification({
        title: "Test Info",
        message: "Info notification is working!",
        type: "info",
        duration: 3000
      });
    }, 3000);

    // Test notification with action
    setTimeout(() => {
      showNotification({
        title: "Test Action",
        message: "Notification with action button is working!",
        type: "info",
        duration: 0,
        action: {
          label: "Click Me",
          onClick: () => {
            alert("Action button clicked!");
          }
        }
      });
    }, 4000);
  };

  const testLoading = async () => {
    setLoading(loadingKey, true, "Testing loading state...");
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    setLoading(loadingKey, false);
    showNotification({
      title: "Test Complete",
      message: "Loading state test completed successfully!",
      type: "success"
    });
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1>Notification & Loading System Test</h1>
      <p>Click the buttons below to test the notification and loading systems.</p>
      
      <div style={{ marginTop: "20px" }}>
        <button 
          onClick={testNotifications}
          style={{ 
            padding: "10px 20px", 
            backgroundColor: "#007bff", 
            color: "white", 
            border: "none", 
            borderRadius: "4px",
            marginRight: "10px",
            cursor: "pointer"
          }}
        >
          Test Notifications
        </button>
        
        <button 
          onClick={testLoading}
          disabled={isLoading(loadingKey)}
          style={{ 
            padding: "10px 20px", 
            backgroundColor: isLoading(loadingKey) ? "#6c757d" : "#28a745", 
            color: "white", 
            border: "none", 
            borderRadius: "4px",
            cursor: isLoading(loadingKey) ? "not-allowed" : "pointer"
          }}
        >
          {isLoading(loadingKey) ? "Loading..." : "Test Loading"}
        </button>
      </div>
      
      {isLoading(loadingKey) && (
        <div style={{ marginTop: "20px" }}>
          <LoadingSpinner message={getLoadingMessage(loadingKey)} size="md" />
        </div>
      )}
      
      <div style={{ marginTop: "20px" }}>
        <h2>Instructions:</h2>
        <ol>
          <li>Click "Test Notifications" to see different notification types</li>
          <li>Click "Test Loading" to see the loading spinner</li>
          <li>Check that notifications appear and disappear correctly</li>
          <li>Verify that the action button in the last notification works</li>
        </ol>
      </div>
    </div>
  );
};

export default NotificationTest;