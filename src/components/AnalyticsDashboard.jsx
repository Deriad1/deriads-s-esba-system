import React from 'react';
import EnhancedAnalyticsDashboard from './EnhancedAnalyticsDashboard';

const AnalyticsDashboard = ({ analyticsData, className, subject, viewType = "scores" }) => {
  if (!analyticsData) {
    return (
      <div className="glass-card rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Analytics Dashboard</h3>
        <div className="text-center py-8 text-gray-500">
          <p>No analytics data available</p>
        </div>
      </div>
    );
  }

  // Data preparation moved to EnhancedAnalyticsDashboard component

  return (
    <EnhancedAnalyticsDashboard 
      analyticsData={analyticsData} 
      className={className} 
      subject={subject} 
      viewType={viewType} 
    />
  );
};

export default AnalyticsDashboard;