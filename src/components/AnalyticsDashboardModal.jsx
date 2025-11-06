import React from 'react';
import AnalyticsDashboard from './AnalyticsDashboard';

const AnalyticsDashboardModal = ({ isOpen, onClose, analyticsData }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="glass-card-golden rounded-lg p-6 w-full max-w-6xl">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-white">Student Performance Analytics</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              &times;
            </button>
          </div>
          
          <div className="mt-4">
            {!analyticsData ? (
              <div className="text-center py-8">
                <p className="text-white/70">Loading analytics data...</p>
              </div>
            ) : (
              <AnalyticsDashboard
                analyticsData={analyticsData}
                viewType="scores"
              />
            )}
          </div>
          
          <div className="flex justify-end mt-6">
            <button
              onClick={onClose}
              className="glass-button px-4 py-2 rounded-md"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboardModal;