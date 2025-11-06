import React from 'react';

const PerformanceChart = ({ data, title, type = 'bar' }) => {
  if (!data || data.length === 0) {
    return (
      <div className="glass-extra-transparent rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        <div className="text-center py-8 text-gray-500">
          <p>No data available for visualization</p>
        </div>
      </div>
    );
  }

  // For bar charts
  if (type === 'bar') {
    const maxValue = Math.max(...data.map(item => item.value));
    
    return (
      <div className="glass-extra-transparent rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        <div className="flex items-end justify-between h-64 mt-8">
          {data.map((item, index) => (
            <div key={index} className="flex flex-col items-center flex-1 px-2">
              <div className="text-xs text-gray-700 mb-2">{item.value}</div>
              <div 
                className="w-full bg-gradient-to-t from-blue-500 to-blue-300 rounded-t-lg transition-all duration-500 ease-in-out hover:opacity-75"
                style={{ height: `${(item.value / maxValue) * 90}%` }}
              ></div>
              <div className="text-xs mt-2 text-center text-gray-700 truncate w-full">
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // For pie charts
  if (type === 'pie') {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    let startAngle = 0;
    
    const colors = [
      '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', 
      '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
    ];
    
    return (
      <div className="glass-extra-transparent rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        <div className="flex flex-col items-center">
          <div className="relative w-48 h-48">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              {data.map((item, index) => {
                const percentage = (item.value / total) * 100;
                const endAngle = startAngle + (percentage * 3.6);
                
                // Calculate coordinates for arc
                const x1 = 50 + 40 * Math.cos((Math.PI / 180) * (startAngle - 90));
                const y1 = 50 + 40 * Math.sin((Math.PI / 180) * (startAngle - 90));
                const x2 = 50 + 40 * Math.cos((Math.PI / 180) * (endAngle - 90));
                const y2 = 50 + 40 * Math.sin((Math.PI / 180) * (endAngle - 90));
                
                const largeArcFlag = percentage > 50 ? 1 : 0;
                
                const pathData = `M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
                
                const color = colors[index % colors.length];
                const path = (
                  <path
                    key={index}
                    d={pathData}
                    fill={color}
                    stroke="#fff"
                    strokeWidth="0.5"
                  />
                );
                
                startAngle = endAngle;
                return path;
              })}
              <circle cx="50" cy="50" r="15" fill="#fff" />
              <text x="50" y="50" textAnchor="middle" dy="0.3em" fontSize="8" fontWeight="bold">
                {total}
              </text>
            </svg>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-2 w-full">
            {data.map((item, index) => (
              <div key={index} className="flex items-center">
                <div 
                  className="w-4 h-4 rounded-full mr-2" 
                  style={{ backgroundColor: colors[index % colors.length] }}
                ></div>
                <span className="text-sm text-gray-700 truncate">
                  {item.label}: {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // For line charts
  if (type === 'line') {
    const maxValue = Math.max(...data.map(item => item.value));
    const minValue = Math.min(...data.map(item => item.value));
    const range = maxValue - minValue || 1; // Avoid division by zero
    
    return (
      <div className="glass-extra-transparent rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        <div className="relative h-64 mt-8">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            {/* Grid lines */}
            {[0, 25, 50, 75, 100].map((y, i) => (
              <line
                key={i}
                x1="0"
                y1={y}
                x2="100"
                y2={y}
                stroke="#e5e7eb"
                strokeWidth="0.2"
              />
            ))}
            
            {/* Data line */}
            <polyline
              fill="none"
              stroke="#3B82F6"
              strokeWidth="1"
              points={data.map((item, index) => {
                const x = (index / (data.length - 1 || 1)) * 100;
                const y = 100 - ((item.value - minValue) / range) * 100;
                return `${x},${y}`;
              }).join(' ')}
            />
            
            {/* Data points */}
            {data.map((item, index) => {
              const x = (index / (data.length - 1 || 1)) * 100;
              const y = 100 - ((item.value - minValue) / range) * 100;
              return (
                <circle
                  key={index}
                  cx={x}
                  cy={y}
                  r="1.5"
                  fill="#3B82F6"
                />
              );
            })}
          </svg>
          
          {/* X-axis labels */}
          <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-600 px-2">
            {data.map((item, index) => (
              <span key={index} className="truncate" style={{ width: `${100 / data.length}%` }}>
                {item.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default PerformanceChart;