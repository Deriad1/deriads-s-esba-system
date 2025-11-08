import { useState } from 'react';
import PropTypes from 'prop-types';
import LoadingSpinner from '../../LoadingSpinner';

/**
 * ScoresTab Component
 *
 * Displays all entered scores for the class in a clean, readable format.
 * Allows viewing scores by subject with detailed breakdown.
 *
 * Features:
 * - View all subjects and their scores
 * - Filter by subject
 * - Shows test scores, exam, and totals
 * - Color-coded remarks
 */
const ScoresTab = ({
  students,
  marksData,
  subjects,
  isLoading
}) => {
  const [selectedSubject, setSelectedSubject] = useState('');

  /**
   * Get remark color class
   */
  const getRemarkColor = (remark) => {
    const remarkUpper = remark?.toUpperCase() || '';
    if (remarkUpper.includes('EXCELLENT') || remarkUpper.includes('DISTINCTION')) {
      return 'text-green-300 font-semibold';
    }
    if (remarkUpper.includes('GOOD') || remarkUpper.includes('CREDIT')) {
      return 'text-blue-300 font-semibold';
    }
    if (remarkUpper.includes('PASS') || remarkUpper.includes('FAIR')) {
      return 'text-yellow-300 font-semibold';
    }
    if (remarkUpper.includes('FAIL')) {
      return 'text-red-300 font-semibold';
    }
    return 'text-white/80';
  };

  // Filter subjects based on selection
  const displaySubjects = selectedSubject ? [selectedSubject] : subjects;

  return (
    <div>
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl p-6 mb-6 border border-white/30">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white drop-shadow-md">View Scores</h2>

          {/* Subject Filter */}
          <div className="flex items-center gap-3">
            <label className="text-sm text-white/80">Filter by Subject:</label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="p-2 bg-white/10 backdrop-blur-md border border-white/30 rounded-md text-white focus:ring-2 focus:ring-blue-400/50"
            >
              <option value="" className="bg-gray-800">All Subjects</option>
              {subjects.map(subject => (
                <option key={subject} value={subject} className="bg-gray-800">
                  {subject}
                </option>
              ))}
            </select>
          </div>
        </div>

        {isLoading ? (
          <LoadingSpinner message="Loading scores..." />
        ) : (
          <div>
            {displaySubjects.length === 0 ? (
              <div className="text-center py-8 text-white/70">
                <p>No subjects available.</p>
              </div>
            ) : (
              displaySubjects.map(subject => (
                <div key={subject} className="mb-6 p-4 bg-white/5 backdrop-blur-sm border border-white/20 rounded-lg">
                  <h3 className="text-lg font-medium mb-3 text-white drop-shadow-md">{subject}</h3>

                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-white/20">
                      <thead className="bg-white/20 backdrop-blur-md">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-white/90 uppercase tracking-wider">
                            Student
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-white/90 uppercase tracking-wider">
                            Test 1
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-white/90 uppercase tracking-wider">
                            Test 2
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-white/90 uppercase tracking-wider">
                            Test 3
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-white/90 uppercase tracking-wider">
                            Test 4
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-white/90 uppercase tracking-wider">
                            Exam
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-white/90 uppercase tracking-wider">
                            Total
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-white/90 uppercase tracking-wider">
                            Remark
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white/5 backdrop-blur-sm divide-y divide-white/10">
                        {students.map((student) => {
                          const studentId = student.idNumber || student.LearnerID;
                          const studentMarks = marksData[subject]?.[studentId] || {};

                          return (
                            <tr key={studentId} className="hover:bg-white/10 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-white drop-shadow-md">
                                  {student.firstName} {student.lastName}
                                </div>
                                <div className="text-xs text-white/70">{studentId}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-white/80">
                                {studentMarks.test1 ?? '-'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-white/80">
                                {studentMarks.test2 ?? '-'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-white/80">
                                {studentMarks.test3 ?? '-'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-white/80">
                                {studentMarks.test4 ?? '-'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-300 font-medium">
                                {studentMarks.exam ?? '-'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-bold">
                                {studentMarks.total ? parseFloat(studentMarks.total).toFixed(2) : '-'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <span className={getRemarkColor(studentMarks.remark)}>
                                  {studentMarks.remark || '-'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Subject Summary */}
                  <div className="mt-4 pt-4 border-t border-white/20">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-white/10 backdrop-blur-md p-3 rounded-lg border border-white/20">
                        <div className="text-xs text-white/80">Students with Scores</div>
                        <div className="text-lg font-bold text-white drop-shadow-md">
                          {students.filter(s => {
                            const sid = s.idNumber || s.LearnerID;
                            return marksData[subject]?.[sid]?.total;
                          }).length}
                        </div>
                      </div>
                      <div className="bg-white/10 backdrop-blur-md p-3 rounded-lg border border-white/20">
                        <div className="text-xs text-white/80">Missing Scores</div>
                        <div className="text-lg font-bold text-yellow-300 drop-shadow-md">
                          {students.filter(s => {
                            const sid = s.idNumber || s.LearnerID;
                            return !marksData[subject]?.[sid]?.total;
                          }).length}
                        </div>
                      </div>
                      <div className="bg-white/10 backdrop-blur-md p-3 rounded-lg border border-white/20">
                        <div className="text-xs text-white/80">Class Average</div>
                        <div className="text-lg font-bold text-blue-300 drop-shadow-md">
                          {(() => {
                            const totals = students
                              .map(s => marksData[subject]?.[s.idNumber || s.LearnerID]?.total)
                              .filter(t => t);
                            if (totals.length === 0) return '-';
                            const avg = totals.reduce((sum, t) => sum + parseFloat(t), 0) / totals.length;
                            return avg.toFixed(2);
                          })()}
                        </div>
                      </div>
                      <div className="bg-white/10 backdrop-blur-md p-3 rounded-lg border border-white/20">
                        <div className="text-xs text-white/80">Total Students</div>
                        <div className="text-lg font-bold text-white drop-shadow-md">
                          {students.length}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

ScoresTab.propTypes = {
  /** Array of student objects */
  students: PropTypes.arrayOf(
    PropTypes.shape({
      idNumber: PropTypes.string,
      LearnerID: PropTypes.string,
      firstName: PropTypes.string.isRequired,
      lastName: PropTypes.string.isRequired
    })
  ).isRequired,

  /** Marks data structure: { subject: { studentId: { test1, test2, test3, test4, exam, total, remark } } } */
  marksData: PropTypes.objectOf(
    PropTypes.objectOf(
      PropTypes.shape({
        test1: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        test2: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        test3: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        test4: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        exam: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        total: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        remark: PropTypes.string
      })
    )
  ).isRequired,

  /** Array of subject names */
  subjects: PropTypes.arrayOf(PropTypes.string).isRequired,

  /** Whether data is being loaded */
  isLoading: PropTypes.bool
};

ScoresTab.defaultProps = {
  isLoading: false
};

export default ScoresTab;
