import React, { useState } from "react";
import Layout from "../components/Layout";
import { useNotification } from "../context/NotificationContext";
import { useLoading } from "../context/LoadingContext";
import LoadingSpinner from "../components/LoadingSpinner";

const NotificationDemoPage = () => {
  const { showNotification } = useNotification();
  const { setLoading, isLoading, getLoadingMessage } = useLoading();
  const [loadingKey, setLoadingKey] = useState("demo");

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

  const simulateDifferentLoading = async () => {
    const key = "different";
    setLoading(key, true, "Loading different data...");
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setLoading(key, false);
    showNotification({
      message: "Different data loaded.",
      type: "info"
    });
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Notification & Loading Demo</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Notification Examples */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/40 ring-1 ring-white/20 shadow-2xl rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Notification Examples</h2>
            <div className="space-y-4">
              <button
                onClick={showSuccessNotification}
                className="w-full bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-md transition-colors"
              >
                Show Success Notification
              </button>
              
              <button
                onClick={showErrorNotification}
                className="w-full bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-md transition-colors"
              >
                Show Error Notification
              </button>
              
              <button
                onClick={showWarningNotification}
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-2 px-4 rounded-md transition-colors"
              >
                Show Warning Notification
              </button>
              
              <button
                onClick={showInfoNotification}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md transition-colors"
              >
                Show Info Notification
              </button>
              
              <button
                onClick={showNotificationWithAction}
                className="w-full bg-purple-500 hover:bg-purple-600 text-white py-2 px-4 rounded-md transition-colors"
              >
                Show Notification with Action
              </button>
            </div>
          </div>
          
          {/* Loading Examples */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/40 ring-1 ring-white/20 shadow-2xl rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Loading Examples</h2>
            <div className="space-y-4">
              <button
                onClick={simulateLoading}
                disabled={isLoading(loadingKey)}
                className="w-full bg-indigo-500 hover:bg-indigo-600 text-white py-2 px-4 rounded-md transition-colors disabled:opacity-50"
              >
                {isLoading(loadingKey) ? "Processing..." : "Simulate Loading"}
              </button>
              
              <button
                onClick={simulateDifferentLoading}
                disabled={isLoading("different")}
                className="w-full bg-teal-500 hover:bg-teal-600 text-white py-2 px-4 rounded-md transition-colors disabled:opacity-50"
              >
                {isLoading("different") ? "Loading..." : "Simulate Different Loading"}
              </button>
              
              <div className="pt-4">
                <h3 className="font-medium mb-2">Current Loading States:</h3>
                <ul className="text-sm space-y-1">
                  <li className="flex justify-between">
                    <span>Demo:</span>
                    <span className={isLoading(loadingKey) ? "text-green-600" : "text-gray-500"}>
                      {isLoading(loadingKey) ? "Loading" : "Idle"}
                    </span>
                  </li>
                  <li className="flex justify-between">
                    <span>Different:</span>
                    <span className={isLoading("different") ? "text-green-600" : "text-gray-500"}>
                      {isLoading("different") ? "Loading" : "Idle"}
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        
        {/* Loading Spinner Demo */}
        <div className="mt-8 bg-white/10 backdrop-blur-xl border border-white/40 ring-1 ring-white/20 shadow-2xl rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Loading Spinner Examples</h2>
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
        
        {/* Current Loading Message */}
        {isLoading(loadingKey) && (
          <div className="mt-6 bg-white/10 backdrop-blur-xl border border-white/40 ring-1 ring-white/20 shadow-2xl rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Current Loading Message</h2>
            <p className="text-lg">{getLoadingMessage(loadingKey)}</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default NotificationDemoPage;