import React from 'react';
import PropTypes from 'prop-types';
import { useLoading } from '../../context/LoadingContext';
import LoadingSpinner from '../LoadingSpinner';

/**
 * MarksTab Component
 *
 * Displays marks for all subjects taught by the form master
 * Read-only view for monitoring student performance
 */
const MarksTab = ({
  students,
  marksData,
  subjects,
  errors
}) => {
  const { isLoading } = useLoading();

  const getGrade = (total) => {
    const totalNum = parseFloat(total);
    if (isNaN(totalNum) || totalNum <= 0) return '';
    if (totalNum >= 80) return 'A';
    if (totalNum >= 70) return 'B';
    if (totalNum >= 60) return 'C';
    if (totalNum >= 50) return 'D';
    if (totalNum >= 40) return 'E';
    return 'F';
  };

  return (
    <div className="bg-white shadow rounded-lg p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4">Student Marks Overview</h2>
      <p className="text-sm text-gray-600 mb-4">
        View marks for all subjects. To edit scores, use the "Enter Scores" view.
      </p>

      {isLoading('marks') ? (
        <LoadingSpinner message="Loading marks data..." />
      ) : (
        subjects.map(subject => (
          <div key={subject} className="mb-8 last:mb-0">
            <h3 className="text-lg font-medium mb-3 text-indigo-600">{subject}</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm border border-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th rowSpan="2" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r">
                      Student
                    </th>
                    <th colSpan="6" className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r bg-blue-50">
                      Class Score (60 → 50%)
                    </th>
                    <th colSpan="2" className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r bg-green-50">
                      Exam (100 → 50%)
                    </th>
                    <th rowSpan="2" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r">
                      Total (100)
                    </th>
                    <th rowSpan="2" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Grade
                    </th>
                  </tr>
                  <tr>
                    <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase bg-blue-50">T1 (15)</th>
                    <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase bg-blue-50">T2 (15)</th>
                    <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase bg-blue-50">T3 (15)</th>
                    <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase bg-blue-50">T4 (15)</th>
                    <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase bg-blue-50">Total (60)</th>
                    <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase bg-blue-50 border-r">50%</th>
                    <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase bg-green-50">Score (100)</th>
                    <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase bg-green-50 border-r">50%</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {students.map((learner) => {
                    const studentId = learner.idNumber || learner.LearnerID;
                    const studentMarks = marksData[subject]?.[studentId] || {};

                    const test1 = studentMarks.test1 || '-';
                    const test2 = studentMarks.test2 || '-';
                    const test3 = studentMarks.test3 || '-';
                    const test4 = studentMarks.test4 || '-';
                    const testsTotal = studentMarks.testsTotal || '-';
                    const classScore50 = studentMarks.classScore50 || '-';
                    const exam = studentMarks.exam || '-';
                    const examScore50 = studentMarks.examScore50 || '-';
                    const total = studentMarks.total || '-';
                    const grade = getGrade(total);

                    return (
                      <tr key={`${subject}-${studentId}`} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap border-r">
                          <div className="text-sm font-medium text-gray-900">
                            {learner.firstName} {learner.lastName}
                          </div>
                          <div className="text-xs text-gray-500">{studentId}</div>
                        </td>
                        <td className="px-2 py-3 text-center">{test1}</td>
                        <td className="px-2 py-3 text-center">{test2}</td>
                        <td className="px-2 py-3 text-center">{test3}</td>
                        <td className="px-2 py-3 text-center">{test4}</td>
                        <td className="px-2 py-3 text-center bg-blue-50 font-semibold text-blue-900">
                          {testsTotal}
                        </td>
                        <td className="px-2 py-3 text-center bg-blue-100 border-r font-bold text-blue-900">
                          {classScore50}
                        </td>
                        <td className="px-2 py-3 text-center">{exam}</td>
                        <td className="px-2 py-3 text-center bg-green-100 border-r font-bold text-green-900">
                          {examScore50}
                        </td>
                        <td className="px-2 py-3 text-center border-r font-bold text-lg text-indigo-600">
                          {total}
                        </td>
                        <td className="px-2 py-3 text-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            grade === 'A' ? 'bg-green-100 text-green-800' :
                            grade === 'B' ? 'bg-blue-100 text-blue-800' :
                            grade === 'C' ? 'bg-yellow-100 text-yellow-800' :
                            grade === 'D' ? 'bg-orange-100 text-orange-800' :
                            grade === 'E' || grade === 'F' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {grade || '-'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

MarksTab.propTypes = {
  students: PropTypes.arrayOf(PropTypes.object).isRequired,
  marksData: PropTypes.object.isRequired,
  subjects: PropTypes.arrayOf(PropTypes.string).isRequired,
  errors: PropTypes.object
};

MarksTab.defaultProps = {
  errors: {}
};

export default MarksTab;
