import React from 'react';
import { getGroupStatistics, getGroupDisplayName, getGroupColor, getGroupIcon } from '../utils/classGrouping';

/**
 * ClassGroupStats Component
 * Displays statistics for each class group
 */
const ClassGroupStats = ({ students, className = '' }) => {
  const stats = getGroupStatistics(students);

  const renderStatCard = (groupKey) => {
    const groupStats = stats[groupKey];
    if (!groupStats || groupKey === 'total' || (groupKey === 'OTHER' && groupStats.count === 0)) {
      return null;
    }

    return (
      <div
        key={groupKey}
        className="glass rounded-lg p-4 hover:shadow-lg transition-shadow"
        style={{ borderLeft: `4px solid ${getGroupColor(groupKey)}` }}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <span className="text-3xl mr-2">{getGroupIcon(groupKey)}</span>
            <h3 className="text-lg font-bold text-gray-800">
              {getGroupDisplayName(groupKey)}
            </h3>
          </div>
          <div
            className="text-2xl font-bold"
            style={{ color: getGroupColor(groupKey) }}
          >
            {groupStats.count}
          </div>
        </div>

        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Students</span>
          <span className="font-semibold">{groupStats.percentage}%</span>
        </div>

        {/* Progress bar */}
        <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full transition-all duration-500"
            style={{
              width: `${groupStats.percentage}%`,
              backgroundColor: getGroupColor(groupKey)
            }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 ${className}`}>
      {renderStatCard('KG')}
      {renderStatCard('PRIMARY')}
      {renderStatCard('JHS')}
    </div>
  );
};

export default ClassGroupStats;
