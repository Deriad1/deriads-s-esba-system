import React from 'react';
import { getAllClassGroups, getGroupColor, getGroupIcon } from '../utils/classGrouping';

/**
 * ClassGroupFilter Component
 * Displays buttons to filter by class groups (KG, Primary, JHS)
 */
const ClassGroupFilter = ({ selectedGroup, onGroupChange, showAll = true, className = '' }) => {
  const classGroups = getAllClassGroups();

  return (
    <div className={`flex flex-wrap gap-3 ${className}`}>
      {showAll && (
        <button
          onClick={() => onGroupChange('ALL')}
          className={`px-4 py-2 rounded-lg font-semibold transition-all ${
            selectedGroup === 'ALL'
              ? 'glass-button-primary text-white shadow-lg scale-105'
              : 'glass hover:shadow-md'
          }`}
        >
          <span className="mr-2">📋</span>
          All Classes
        </button>
      )}

      {classGroups.map(group => (
        <button
          key={group.key}
          onClick={() => onGroupChange(group.key)}
          className={`px-4 py-2 rounded-lg font-semibold transition-all ${
            selectedGroup === group.key
              ? 'text-white shadow-lg scale-105'
              : 'glass hover:shadow-md'
          }`}
          style={{
            backgroundColor: selectedGroup === group.key ? getGroupColor(group.key) : undefined,
            borderColor: getGroupColor(group.key),
            borderWidth: '2px'
          }}
        >
          <span className="mr-2">{getGroupIcon(group.key)}</span>
          {group.shortName}
        </button>
      ))}
    </div>
  );
};

export default ClassGroupFilter;
