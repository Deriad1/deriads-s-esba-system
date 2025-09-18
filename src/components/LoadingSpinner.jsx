import React from "react";

const LoadingSpinner = ({ message = "Loading...", size = "md" }) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12"
  };

  const textSizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg"
  };

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="flex items-center space-x-3">
        <div className={`animate-spin rounded-full border-b-2 border-blue-600 ${sizeClasses[size]}`}></div>
        {message && (
          <span className={`${textSizeClasses[size]} text-gray-700`}>{message}</span>
        )}
      </div>
    </div>
  );
};

export default LoadingSpinner;