import React from 'react';
import { groupClasses, getGroupDisplayName, getGroupColor, getGroupIcon } from '../utils/classGrouping';

/**
 * GroupedClassList Component
 * Displays classes grouped by their educational level
 */
const GroupedClassList = ({
  classes,
  onClassSelect,
  selectedClass = null,
  showCounts = false,
  studentCounts = {}
}) => {
  const grouped = groupClasses(classes);

  const renderClassGroup = (groupKey, classList) => {
    if (classList.length === 0) return null;

    return (
      <div key={groupKey} className="glass rounded-lg p-4 mb-4">
        <div className="flex items-center mb-3">
          <span className="text-2xl mr-2">{getGroupIcon(groupKey)}</span>
          <h3
            className="text-lg font-bold"
            style={{ color: getGroupColor(groupKey) }}
          >
            {getGroupDisplayName(groupKey)}
          </h3>
          <span className="ml-2 text-sm text-gray-600">
            ({classList.length} {classList.length === 1 ? 'class' : 'classes'})
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {classList.map(className => {
            const isSelected = selectedClass === className;
            const count = studentCounts[className] || 0;

            return (
              <button
                key={className}
                onClick={() => onClassSelect && onClassSelect(className)}
                className={`p-3 rounded-lg font-semibold transition-all ${
                  isSelected
                    ? 'text-white shadow-lg scale-105'
                    : 'glass hover:shadow-md hover:scale-102'
                }`}
                style={{
                  backgroundColor: isSelected ? getGroupColor(groupKey) : undefined,
                  borderColor: getGroupColor(groupKey),
                  borderWidth: '2px'
                }}
              >
                <div className="text-center">
                  <div className="text-base font-bold">{className}</div>
                  {showCounts && (
                    <div className="text-xs mt-1 opacity-80">
                      {count} {count === 1 ? 'student' : 'students'}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {renderClassGroup('KG', grouped.KG)}
      {renderClassGroup('PRIMARY', grouped.PRIMARY)}
      {renderClassGroup('JHS', grouped.JHS)}
      {grouped.OTHER.length > 0 && renderClassGroup('OTHER', grouped.OTHER)}
    </div>
  );
};

export default GroupedClassList;
