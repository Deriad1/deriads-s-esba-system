import { useState, useEffect } from 'react';
import { getClassAggregates } from '../api-client';
import { calculateClassAggregates, getAggregateInterpretation, formatAggregateDisplay, CORE_SUBJECTS } from '../utils/aggregateHelpers';
import { useNotification } from '../context/NotificationContext';

/**
 * Mock Exam Aggregates Component
 * Displays aggregate scores for students in a class
 * Aggregate = Sum of 4 core subjects + best 2 elective subjects
 */
const MockExamAggregates = ({ assessmentId, className, assessmentName }) => {
  const [aggregates, setAggregates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState({});
  const { showNotification } = useNotification();

  useEffect(() => {
    if (assessmentId && className) {
      loadAggregates();
    }
  }, [assessmentId, className]);

  const loadAggregates = async () => {
    setLoading(true);
    try {
      const response = await getClassAggregates(assessmentId, className);

      if (response.status === 'success') {
        // Calculate aggregates for all students
        const studentsWithAggregates = calculateClassAggregates(response.data || []);
        setAggregates(studentsWithAggregates);
      } else {
        showNotification({
          message: 'Error loading aggregates: ' + response.message,
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Error loading aggregates:', error);
      showNotification({
        message: 'Error loading aggregates: ' + error.message,
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleBreakdown = (studentId) => {
    setShowBreakdown(prev => ({
      ...prev,
      [studentId]: !prev[studentId]
    }));
  };

  if (loading) {
    return (
      <div className="glass-strong rounded-lg shadow-lg p-6">
        <div className="text-center py-8">
          <div className="text-lg text-white">Loading aggregates...</div>
        </div>
      </div>
    );
  }

  if (aggregates.length === 0) {
    return (
      <div className="glass-strong rounded-lg shadow-lg p-6">
        <div className="text-center py-8 text-white">
          <p>No aggregate data available yet.</p>
          <p className="text-sm mt-2">Students need scores in all 4 core subjects + at least 2 electives.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-strong rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-white">Mock Exam Aggregates</h2>
            <p className="text-white/80 mt-1">{assessmentName} - {className}</p>
            <p className="text-sm text-white/70 mt-2">
              Aggregate = 4 Core Subjects + Best 2 Electives (Lower is better)
            </p>
          </div>
          <button
            onClick={loadAggregates}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Refresh
          </button>
        </div>

        {/* Core Subjects Info */}
        <div className="mt-4 p-4 glass-light rounded-lg border border-blue-300/50">
          <p className="text-sm font-semibold text-white">Core Subjects:</p>
          <p className="text-sm text-white/80">{CORE_SUBJECTS.join(', ')}</p>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-strong rounded-lg shadow-lg p-4">
          <p className="text-sm text-white/80">Total Students</p>
          <p className="text-3xl font-bold text-white">{aggregates.length}</p>
        </div>
        <div className="glass-strong rounded-lg shadow-lg p-4">
          <p className="text-sm text-gray-600">Eligible for Aggregate</p>
          <p className="text-3xl font-bold text-green-600">
            {aggregates.filter(s => s.eligibleForAggregate).length}
          </p>
        </div>
        <div className="glass-strong rounded-lg shadow-lg p-4">
          <p className="text-sm text-gray-600">Best Aggregate</p>
          <p className="text-3xl font-bold text-blue-600">
            {aggregates.find(s => s.eligibleForAggregate)?.aggregate || 'N/A'}
          </p>
        </div>
        <div className="glass-strong rounded-lg shadow-lg p-4">
          <p className="text-sm text-gray-600">Average Aggregate</p>
          <p className="text-3xl font-bold text-purple-600">
            {(() => {
              const eligible = aggregates.filter(s => s.eligibleForAggregate);
              if (eligible.length === 0) return 'N/A';
              const avg = eligible.reduce((sum, s) => sum + s.aggregate, 0) / eligible.length;
              return avg.toFixed(1);
            })()}
          </p>
        </div>
      </div>

      {/* Aggregates Table */}
      <div className="glass-strong rounded-lg shadow-lg p-6">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-white/20 text-sm shadow-lg">
            <thead>
              <tr className="glass-light">
                <th className="border border-white/20 p-3 text-left">Position</th>
                <th className="border border-white/20 p-3 text-left">Student Name</th>
                <th className="border border-white/20 p-3 text-center">Aggregate</th>
                <th className="border border-white/20 p-3 text-center">Interpretation</th>
                <th className="border border-white/20 p-3 text-center">Status</th>
                <th className="border border-white/20 p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {aggregates.map((student, index) => {
                const aggregateDisplay = formatAggregateDisplay(student);
                const interpretation = getAggregateInterpretation(student.aggregate);
                const isExpanded = showBreakdown[student.studentId];

                return (
                  <React.Fragment key={student.studentId}>
                    <tr className="hover:glass-light">
                      <td className="border border-white/20 p-3 text-center font-bold">
                        {student.eligibleForAggregate ? (
                          <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${
                            index === 0 ? 'bg-yellow-400 text-yellow-900' :
                            index === 1 ? 'bg-gray-300 text-gray-800' :
                            index === 2 ? 'bg-orange-400 text-orange-900' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {index + 1}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="border border-white/20 p-3 font-medium">
                        {student.firstName} {student.lastName}
                      </td>
                      <td className="border border-white/20 p-3 text-center">
                        <span className="text-2xl font-bold text-gray-900">
                          {aggregateDisplay.display}
                        </span>
                      </td>
                      <td className="border border-white/20 p-3 text-center">
                        {student.eligibleForAggregate ? (
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border-2 ${interpretation.class}`}>
                            {interpretation.interpretation}
                          </span>
                        ) : (
                          <span className="text-white/70">-</span>
                        )}
                      </td>
                      <td className="border border-white/20 p-3 text-center text-xs">
                        {student.eligibleForAggregate ? (
                          <span className="text-green-600 font-medium">✓ Eligible</span>
                        ) : (
                          <span className="text-red-600" title={student.message}>
                            ✗ Not Eligible
                          </span>
                        )}
                      </td>
                      <td className="border border-white/20 p-3 text-center">
                        <button
                          onClick={() => toggleBreakdown(student.studentId)}
                          className="px-3 py-1 bg-blue-100 text-blue-800 hover:bg-blue-200 rounded text-xs"
                        >
                          {isExpanded ? 'Hide' : 'Show'} Breakdown
                        </button>
                      </td>
                    </tr>

                    {/* Breakdown Row */}
                    {isExpanded && (
                      <tr>
                        <td colSpan="6" className="border border-white/20 p-4 glass-light">
                          {student.eligibleForAggregate ? (
                            <div className="space-y-4">
                              {/* Core Subjects */}
                              <div>
                                <h4 className="font-semibold text-sm text-white/90 mb-2">
                                  Core Subjects (4 subjects)
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
                                  {Object.entries(student.coreGrades).map(([subject, info]) => (
                                    <div key={subject} className="flex justify-between items-center p-2 bg-white rounded border">
                                      <span className="text-xs font-medium">{subject}</span>
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs text-white/70">{info.percentage}%</span>
                                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded font-bold text-xs">
                                          Grade {info.grade}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Best 2 Electives */}
                              <div>
                                <h4 className="font-semibold text-sm text-white/90 mb-2">
                                  Best 2 Elective Subjects
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                  {student.bestTwoGrades.map((info) => (
                                    <div key={info.subject} className="flex justify-between items-center p-2 bg-white rounded border border-green-200">
                                      <span className="text-xs font-medium">{info.subject}</span>
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs text-white/70">{info.percentage}%</span>
                                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded font-bold text-xs">
                                          Grade {info.grade}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Calculation */}
                              <div className="p-3 bg-blue-50 rounded border border-blue-200">
                                <p className="text-sm font-semibold text-blue-900">
                                  Aggregate Calculation:
                                </p>
                                <p className="text-xs text-blue-700 mt-1">
                                  {Object.values(student.coreGrades).map(g => g.grade).join(' + ')}
                                  {' + '}
                                  {student.bestTwoGrades.map(g => g.grade).join(' + ')}
                                  {' = '}
                                  <span className="font-bold text-lg">{student.aggregate}</span>
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-4">
                              <p className="text-red-600 font-medium">{student.message}</p>
                              {student.missingCoreSubjects.length > 0 && (
                                <p className="text-sm text-gray-600 mt-2">
                                  Missing core subjects: {student.missingCoreSubjects.join(', ')}
                                </p>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MockExamAggregates;
