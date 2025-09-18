import React from 'react';

const TrendAnalysisChart = ({ data, title }) => {
  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="bg-white/10 backdrop-blur-xl border border-white/40 ring-1 ring-white/20 shadow-2xl rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        <div className="text-center py-8 text-gray-500">
          <p>No trend data available</p>
        </div>
      </div>
    );
  }

  // Extract terms and values
  const terms = Object.keys(data);
  const values = terms.map(term => data[term].averageScore || 0);
  
  // Find min and max values for scaling
  const maxValue = Math.max(...values, 100);
  const minValue = Math.min(...values, 0);
  const range = maxValue - minValue || 1;
  
  return (
    <div className="bg-white/10 backdrop-blur-xl border border-white/40 ring-1 ring-white/20 shadow-2xl rounded-lg p-6">
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
          
          {/* Y-axis labels */}
          <text x="0" y="5" fontSize="3" fill="#6b7280">100</text>
          <text x="0" y="25" fontSize="3" fill="#6b7280">75</text>
          <text x="0" y="50" fontSize="3" fill="#6b7280">50</text>
          <text x="0" y="75" fontSize="3" fill="#6b7280">25</text>
          <text x="0" y="95" fontSize="3" fill="#6b7280">0</text>
          
          {/* Data line */}
          <polyline
            fill="none"
            stroke="#3B82F6"
            strokeWidth="1"
            points={terms.map((term, index) => {
              const x = (index / (terms.length - 1 || 1)) * 100;
              const value = data[term].averageScore || 0;
              const y = 100 - ((value - minValue) / range) * 100;
              return `${x},${y}`;
            }).join(' ')}
          />
          
          {/* Data points */}
          {terms.map((term, index) => {
            const x = (index / (terms.length - 1 || 1)) * 100;
            const value = data[term].averageScore || 0;
            const y = 100 - ((value - minValue) / range) * 100;
            return (
              <g key={term}>
                <circle
                  cx={x}
                  cy={y}
                  r="2"
                  fill="#3B82F6"
                />
                <text 
                  x={x} 
                  y={y - 5} 
                  textAnchor="middle" 
                  fontSize="3" 
                  fill="#3B82F6"
                  fontWeight="bold"
                >
                  {value.toFixed(1)}
                </text>
              </g>
            );
          })}
        </svg>
        
        {/* X-axis labels */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-600 px-2">
          {terms.map((term, index) => (
            <span key={term} className="truncate" style={{ width: `${100 / terms.length}%` }}>
              {term}
            </span>
          ))}
        </div>
      </div>
      
      {/* Summary statistics */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="bg-blue-50/30 border border-blue-200/50 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-blue-600">
            {values.length > 0 ? Math.max(...values).toFixed(1) : '0'}
          </div>
          <div className="text-xs text-gray-700">Highest Score</div>
        </div>
        <div className="bg-green-50/30 border border-green-200/50 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-green-600">
            {values.length > 0 ? (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1) : '0'}
          </div>
          <div className="text-xs text-gray-700">Average Score</div>
        </div>
        <div className="bg-purple-50/30 border border-purple-200/50 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-purple-600">
            {values.length > 0 ? Math.min(...values).toFixed(1) : '0'}
          </div>
          <div className="text-xs text-gray-700">Lowest Score</div>
        </div>
      </div>
    </div>
  );
};

export default TrendAnalysisChart;