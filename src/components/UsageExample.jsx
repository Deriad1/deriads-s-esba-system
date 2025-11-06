import React from "react";
import { useNotification } from '../context/NotificationContext';
import { useLoading } from '../context/LoadingContext';
import LoadingSpinner from '../components/LoadingSpinner';

/**
 * Example component demonstrating how to use the new notification and loading systems
 * This component shows best practices for implementing the enhanced UX features
 */
const UsageExample = () => {
  const { showNotification } = useNotification();
  const { setLoading, isLoading, getLoadingMessage } = useLoading();
  
  // Unique keys for different operations
  const loadingKeys = {
    userCreation: "userCreation",
    dataFetch: "dataFetch",
    fileUpload: "fileUpload"
  };

  // Example 1: Show different types of notifications
  const showNotificationExamples = () => {
    // Success notification
    showNotification({
      title: "Success!",
      message: "User account created successfully.",
      type: "success",
      duration: 3000
    });

    // Error notification with action
    setTimeout(() => {
      showNotification({
        title: "Connection Error",
        message: "Failed to connect to the server.",
        type: "error",
        duration: 0, // No auto-dismiss
        action: {
          label: "Retry",
          onClick: () => {
            showNotification({
              message: "Retrying connection...",
              type: "info"
            });
          }
        }
      });
    }, 1000);

    // Warning notification
    setTimeout(() => {
      showNotification({
        title: "Low Storage",
        message: "Your storage is almost full. Please clean up some files.",
        type: "warning",
        duration: 5000
      });
    }, 2000);

    // Info notification
    setTimeout(() => {
      showNotification({
        title: "New Feature",
        message: "Check out our new analytics dashboard!",
        type: "info",
        duration: 4000
      });
    }, 3000);
  };

  // Example 2: Simulate user creation with loading state
  const createUser = async () => {
    try {
      setLoading(loadingKeys.userCreation, true, "Creating user account...");
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Randomly succeed or fail for demo purposes
      const success = Math.random() > 0.5;
      
      if (success) {
        showNotification({
          title: "Account Created",
          message: "User account has been created successfully.",
          type: "success"
        });
      } else {
        throw new Error("Failed to create user account");
      }
    } catch (error) {
      showNotification({
        title: "Creation Failed",
        message: error.message,
        type: "error",
        action: {
          label: "Retry",
          onClick: createUser
        }
      });
    } finally {
      setLoading(loadingKeys.userCreation, false);
    }
  };

  // Example 3: Simulate data fetching with loading state
  const fetchData = async () => {
    try {
      setLoading(loadingKeys.dataFetch, true, "Fetching data from server...");
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Randomly succeed or fail for demo purposes
      const success = Math.random() > 0.3;
      
      if (success) {
        showNotification({
          title: "Data Loaded",
          message: "Successfully loaded 127 records.",
          type: "success"
        });
      } else {
        throw new Error("Network timeout while fetching data");
      }
    } catch (error) {
      showNotification({
        title: "Fetch Failed",
        message: error.message,
        type: "error"
      });
    } finally {
      setLoading(loadingKeys.dataFetch, false);
    }
  };

  // Example 4: Simulate file upload with progress
  const uploadFile = async () => {
    try {
      setLoading(loadingKeys.fileUpload, true, "Uploading file...");
      
      // Simulate upload progress
      for (let i = 1; i <= 5; i++) {
        await new Promise(resolve => setTimeout(resolve, 500));
        setLoading(loadingKeys.fileUpload, true, `Uploading file... ${i * 20}%`);
      }
      
      // Randomly succeed or fail for demo purposes
      const success = Math.random() > 0.2;
      
      if (success) {
        showNotification({
          title: "Upload Complete",
          message: "File uploaded successfully.",
          type: "success"
        });
      } else {
        throw new Error("Upload failed due to network error");
      }
    } catch (error) {
      showNotification({
        title: "Upload Failed",
        message: error.message,
        type: "error"
      });
    } finally {
      setLoading(loadingKeys.fileUpload, false);
    }
  };

  return (
    <div className="glass-ultra rounded-lg p-6 mt-6">
      <h2 className="text-xl font-semibold mb-4">Usage Examples</h2>
      <p className="text-gray-700 mb-6">
        This component demonstrates how to use the enhanced notification and loading systems.
        Click the buttons below to see examples of different notification types and loading states.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Notification Examples */}
        <div className="space-y-4">
          <h3 className="font-medium text-lg">Notification Examples</h3>
          <button
            onClick={showNotificationExamples}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md transition-colors"
          >
            Show All Notification Types
          </button>
          <p className="text-sm text-gray-600">
            This will show success, error, warning, and info notifications with different configurations.
          </p>
        </div>
        
        {/* Loading Examples */}
        <div className="space-y-4">
          <h3 className="font-medium text-lg">Loading Examples</h3>
          <div className="space-y-3">
            <button
              onClick={createUser}
              disabled={isLoading(loadingKeys.userCreation)}
              className="w-full bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-md transition-colors disabled:opacity-50"
            >
              {isLoading(loadingKeys.userCreation) ? "Creating..." : "Create User"}
            </button>
            
            <button
              onClick={fetchData}
              disabled={isLoading(loadingKeys.dataFetch)}
              className="w-full bg-purple-500 hover:bg-purple-600 text-white py-2 px-4 rounded-md transition-colors disabled:opacity-50"
            >
              {isLoading(loadingKeys.dataFetch) ? "Fetching..." : "Fetch Data"}
            </button>
            
            <button
              onClick={uploadFile}
              disabled={isLoading(loadingKeys.fileUpload)}
              className="w-full bg-indigo-500 hover:bg-indigo-600 text-white py-2 px-4 rounded-md transition-colors disabled:opacity-50"
            >
              {isLoading(loadingKeys.fileUpload) ? "Uploading..." : "Upload File"}
            </button>
          </div>
        </div>
      </div>
      
      {/* Loading Spinners */}
      <div className="mt-8">
        <h3 className="font-medium text-lg mb-4">Current Loading States</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass-ultra-light p-4 rounded-lg">
            <h4 className="font-medium mb-2">User Creation</h4>
            <p className="text-sm mb-2">
              Status: {isLoading(loadingKeys.userCreation) ? "Loading" : "Idle"}
            </p>
            {isLoading(loadingKeys.userCreation) && (
              <LoadingSpinner message={getLoadingMessage(loadingKeys.userCreation)} size="sm" />
            )}
          </div>
          
          <div className="glass-ultra-light p-4 rounded-lg">
            <h4 className="font-medium mb-2">Data Fetch</h4>
            <p className="text-sm mb-2">
              Status: {isLoading(loadingKeys.dataFetch) ? "Loading" : "Idle"}
            </p>
            {isLoading(loadingKeys.dataFetch) && (
              <LoadingSpinner message={getLoadingMessage(loadingKeys.dataFetch)} size="sm" />
            )}
          </div>
          
          <div className="glass-ultra-light p-4 rounded-lg">
            <h4 className="font-medium mb-2">File Upload</h4>
            <p className="text-sm mb-2">
              Status: {isLoading(loadingKeys.fileUpload) ? "Loading" : "Idle"}
            </p>
            {isLoading(loadingKeys.fileUpload) && (
              <LoadingSpinner message={getLoadingMessage(loadingKeys.fileUpload)} size="sm" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UsageExample;