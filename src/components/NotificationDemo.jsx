import React from "react";
import { useNotification } from "../context/NotificationContext";
import { useLoading } from "../context/LoadingContext";
import LoadingSpinner from "./LoadingSpinner";

const NotificationDemo = () => {
  const { showNotification } = useNotification();
  const { setLoading, isLoading, getLoadingMessage } = useLoading();
  const [loadingKey] = React.useState("demo");

  const showSuccessNotification = () => {
    showNotification({
      title: "Success!",
      message: "Operation completed successfully.",
      type: "success",
      duration: 3000
    });
  };

  const showErrorNotification = () => {
    showNotification({
      title: "Error!",
      message: "Something went wrong. Please try again.",
      type: "error",
      duration: 5000
    });
  };

  const showWarningNotification = () => {
    showNotification({
      title: "Warning",
      message: "This is a warning message.",
      type: "warning",
      duration: 4000
    });
  };

  const showInfoNotification = () => {
    showNotification({
      title: "Information",
      message: "Here's some useful information.",
      type: "info",
      duration: 3000
    });
  };

  const showNotificationWithAction = () => {
    showNotification({
      title: "Action Required",
      message: "You have a pending action that needs attention.",
      type: "info",
      duration: 0, // No auto-dismiss
      action: {
        label: "View Details",
        onClick: () => {
          alert("Action button clicked!");
        }
      }
    });
  };

  const simulateLoading = async () => {
    setLoading(loadingKey, true, "Processing your request...");
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    setLoading(loadingKey, false);
    showNotification({
      title: "Complete",
      message: "Data processing finished successfully.",
      type: "success"
    });
  };

  return (
    <div className="bg-white/10 backdrop-blur-xl border border-white/40 ring-1 ring-white/20 shadow-2xl rounded-lg p-6 mt-6">
      <h2 className="text-xl font-semibold mb-4">Enhanced Notifications & Loading Demo</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Notification Examples */}
        <div>
          <h3 className="font-medium mb-3">Notification Types</h3>
          <div className="space-y-2">
            <button
              onClick={showSuccessNotification}
              className="w-full bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-md transition-colors text-sm"
            >
              Success Notification
            </button>
            
            <button
              onClick={showErrorNotification}
              className="w-full bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-md transition-colors text-sm"
            >
              Error Notification
            </button>
            
            <button
              onClick={showWarningNotification}
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-2 px-4 rounded-md transition-colors text-sm"
            >
              Warning Notification
            </button>
            
            <button
              onClick={showInfoNotification}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md transition-colors text-sm"
            >
              Info Notification
            </button>
            
            <button
              onClick={showNotificationWithAction}
              className="w-full bg-purple-500 hover:bg-purple-600 text-white py-2 px-4 rounded-md transition-colors text-sm"
            >
              Notification with Action
            </button>
          </div>
        </div>
        
        {/* Loading Examples */}
        <div>
          <h3 className="font-medium mb-3">Loading States</h3>
          <div className="space-y-3">
            <button
              onClick={simulateLoading}
              disabled={isLoading(loadingKey)}
              className="w-full bg-indigo-500 hover:bg-indigo-600 text-white py-2 px-4 rounded-md transition-colors disabled:opacity-50 text-sm"
            >
              {isLoading(loadingKey) ? "Processing..." : "Simulate Loading"}
            </button>
            
            <div className="pt-2">
              <h4 className="text-sm font-medium mb-1">Current Loading State:</h4>
              <div className="flex items-center justify-between text-sm">
                <span>Demo Process:</span>
                <span className={isLoading(loadingKey) ? "text-green-600" : "text-gray-500"}>
                  {isLoading(loadingKey) ? "Loading" : "Idle"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Loading Spinner Demo */}
      <div className="mt-6">
        <h3 className="font-medium mb-3">Loading Spinner Examples</h3>
        <div className="flex flex-wrap gap-6">
          <div className="flex flex-col items-center">
            <LoadingSpinner message="Small spinner" size="sm" />
          </div>
          <div className="flex flex-col items-center">
            <LoadingSpinner message="Medium spinner" size="md" />
          </div>
          <div className="flex flex-col items-center">
            <LoadingSpinner message="Large spinner" size="lg" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationDemo;