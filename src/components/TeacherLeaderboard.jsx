import React, { useState, useEffect } from 'react';
import { getTeacherProgressStats } from '../api-client';

const TeacherLeaderboard = ({ isVisible = true }) => {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await getTeacherProgressStats();
      if (response.status === 'success') {
        // Sort by progress descending
        const sortedStats = [...response.data].sort((a, b) => b.progress - a.progress);
        setStats(sortedStats);
      } else {
        setError(response.message);
      }
    } catch (err) {
      console.error('Error loading leaderboard:', err);
      setError('Failed to load teacher leaderboard');
    } finally {
      setLoading(false);
    }
  };

  // ✅ FIXED: Removed loadLeaderboard from dependencies to prevent infinite loop
  useEffect(() => {
    if (!isVisible) return;

    // Load immediately
    loadLeaderboard();

    // Set up auto-refresh every 30 seconds
    const interval = setInterval(() => {
      loadLeaderboard();
    }, 30000);

    // Cleanup interval on unmount
    return () => {
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible]); // Only re-run when isVisible changes

  const getProgressColor = (progress) => {
    if (progress >= 90) return 'bg-green-500';
    if (progress >= 75) return 'bg-blue-500';
    if (progress >= 50) return 'bg-yellow-500';
    if (progress >= 25) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'head_teacher': return 'bg-purple-100 text-purple-800';
      case 'form_master': return 'bg-indigo-100 text-indigo-800';
      case 'class_teacher': return 'bg-teal-100 text-teal-800';
      case 'subject_teacher': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getMedalColor = (index) => {
    if (index === 0) return 'text-yellow-500';
    if (index === 1) return 'text-gray-400';
    if (index === 2) return 'text-amber-700';
    return 'text-gray-300';
  };

  if (!isVisible) return null;

  return (
    <div className="glass-card-golden rounded-xl shadow-xl">
      <div className="p-5 border-b border-gray-200/30">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold text-white text-shadow">🏆 Teacher Progress Leaderboard</h3>
          <button 
            onClick={loadLeaderboard}
            disabled={loading}
            className="glass-button text-sm px-3 py-1 rounded-lg disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Refreshing...
              </span>
            ) : 'Refresh'}
          </button>
        </div>
        <p className="text-sm text-white/90 mt-2 text-shadow">
          Based on scores entered vs. total possible entries • Updates every 30 seconds
        </p>
      </div>
      
      {error && (
        <div className="p-4 bg-red-50/50 border-b border-red-200/30 rounded-t-xl">
          <p className="text-red-700 font-medium">{error}</p>
        </div>
      )}
      
      <div className="overflow-y-auto max-h-96">
        {loading && stats.length === 0 ? (
          <div className="p-10 text-center">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-3 text-white/90 font-medium">Loading leaderboard...</p>
          </div>
        ) : stats.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-white/80 font-medium">No teacher data available</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200/30">
            {stats.map((teacher, index) => (
              <div key={teacher.teacherId} className="p-4 hover:bg-white/10 transition-all duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex flex-col items-center">
                      <span className={`text-2xl font-bold ${getMedalColor(index)}`}>
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🏅'}
                      </span>
                      <span className="text-xs font-medium text-white/80 mt-1">
                        #{index + 1}
                      </span>
                    </div>
                    
                    <div>
                      <div className="text-lg font-bold text-white text-shadow">
                        {teacher.firstName} {teacher.lastName}
                      </div>
                      <div className="text-sm text-white/90 text-shadow">
                        {teacher.email}
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {teacher.roles.slice(0, 2).map(role => (
                          <span 
                            key={role} 
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(role)}`}
                          >
                            {role.replace('_', ' ')}
                          </span>
                        ))}
                        {teacher.roles.length > 2 && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            +{teacher.roles.length - 2}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end">
                    <div className="text-lg font-bold text-white text-shadow">
                      {teacher.progress}%
                    </div>
                    <div className="w-32 bg-gray-200 rounded-full h-2.5 mt-2">
                      <div 
                        className={`h-2.5 rounded-full ${getProgressColor(teacher.progress)}`}
                        style={{ width: `${teacher.progress}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-white/80 mt-2 text-shadow">
                      {teacher.scoresEntered}/{teacher.totalPossible} scores
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="p-4 bg-gray-50/30 border-t border-gray-200/30 rounded-b-xl text-sm text-white/90 text-shadow">
        <p>Teachers are ranked by their completion percentage of student score entries.</p>
      </div>
    </div>
  );
};

export default TeacherLeaderboard;