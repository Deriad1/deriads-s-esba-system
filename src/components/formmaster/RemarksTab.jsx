import React from 'react';
import PropTypes from 'prop-types';
import { useLoading } from '../../context/LoadingContext';
import LoadingSpinner from '../LoadingSpinner';

/**
 * RemarksTab Component
 *
 * Handles:
 * - Term attendance (days present)
 * - Remarks selection
 * - Attitude input
 * - Interest input
 * - Comments input
 * - Footnote information
 * - Bulk save functionality
 */
const RemarksTab = ({
  students,
  formData,
  errors,
  footnoteInfo,
  syncStatus,
  onAttendanceChange,
  onRemarkChange,
  onAttitudeChange,
  onInterestChange,
  onCommentChange,
  onFootnoteChange,
  onSaveAll,
  onSaveFootnote,
  saving
}) => {
  const { isLoading } = useLoading();

  const getSyncIndicator = (field) => {
    const status = syncStatus[field];
    if (status === 'saved') {
      return <span className="ml-2 text-green-600 text-xs">✓ Saved</span>;
    } else if (status === 'draft') {
      return <span className="ml-2 text-yellow-600 text-xs">● Draft (local)</span>;
    } else if (status === 'syncing') {
      return <span className="ml-2 text-blue-600 text-xs">⟳ Syncing...</span>;
    }
    return null;
  };

  return (
    <div>
      {/* Main Remarks Table */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Attendance & Remarks</h2>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-green-600">✓</span>
              <span className="text-gray-600">Saved to server</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-yellow-600">●</span>
              <span className="text-gray-600">Draft (local only)</span>
            </div>
          </div>
        </div>

        {isLoading('learners') ? (
          <LoadingSpinner message="Loading students..." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Attendance
                    {getSyncIndicator('attendance')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Remarks
                    {getSyncIndicator('remarks')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Attitude
                    {getSyncIndicator('attitude')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Interest
                    {getSyncIndicator('interest')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Comments
                    {getSyncIndicator('comments')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {students.map((learner) => {
                  const studentId = learner.idNumber || learner.LearnerID;
                  return (
                    <tr key={studentId}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {learner.firstName} {learner.lastName}
                        </div>
                        <div className="text-sm text-gray-500">{studentId}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="number"
                          min="0"
                          max="365"
                          value={formData.attendance[studentId] || ""}
                          onChange={(e) => onAttendanceChange(studentId, e.target.value)}
                          className="w-24 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                          placeholder="Days"
                        />
                        {errors[studentId] && (
                          <div className="text-red-500 text-sm mt-1">{errors[studentId]}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={formData.remarks[studentId] || ""}
                          onChange={(e) => onRemarkChange(studentId, e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select remark</option>
                          <option value="RESPECTFUL">RESPECTFUL</option>
                          <option value="WELL-BEHAVED">WELL-BEHAVED</option>
                          <option value="DISRESPECTFUL">DISRESPECTFUL</option>
                          <option value="CALM">CALM</option>
                          <option value="HUMBLE">HUMBLE</option>
                          <option value="APPROACHABLE">APPROACHABLE</option>
                          <option value="BULLY">BULLY</option>
                          <option value="TRUANT">TRUANT</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="text"
                          list={`attitude-options-${studentId}`}
                          value={formData.attitude[studentId] || ""}
                          onChange={(e) => onAttitudeChange(studentId, e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                          placeholder="Select or type attitude"
                        />
                        <datalist id={`attitude-options-${studentId}`}>
                          <option value="HARDWORKING" />
                          <option value="DEPENDABLE" />
                          <option value="NOT SERIOUS IN CLASS" />
                          <option value="LAZY" />
                          <option value="SLOW" />
                        </datalist>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="text"
                          list={`interest-options-${studentId}`}
                          value={formData.interest[studentId] || ""}
                          onChange={(e) => onInterestChange(studentId, e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                          placeholder="Select or type interest"
                        />
                        <datalist id={`interest-options-${studentId}`}>
                          <option value="SPORTS" />
                          <option value="READING" />
                          <option value="DRUMMING" />
                          <option value="SINGING" />
                        </datalist>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="text"
                          list={`comments-options-${studentId}`}
                          value={formData.comments[studentId] || ""}
                          onChange={(e) => onCommentChange(studentId, e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                          placeholder="Select or type comments"
                        />
                        <datalist id={`comments-options-${studentId}`}>
                          <option value="Has Improved" />
                          <option value="Keep it up!" />
                          <option value="More room For Improvement" />
                          <option value="Hardworking" />
                          <option value="Must Buck-Up" />
                        </datalist>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={onSaveAll}
            disabled={saving}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving ? "Saving..." : "Save All to Server"}
          </button>
        </div>
      </div>

      {/* Footnote Section */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Footnote Information</h2>
          {syncStatus.footnote === 'draft' && (
            <span className="text-yellow-600 text-sm">● Draft (local only)</span>
          )}
          {syncStatus.footnote === 'saved' && (
            <span className="text-green-600 text-sm">✓ Saved to server</span>
          )}
        </div>
        <textarea
          value={footnoteInfo}
          onChange={(e) => onFootnoteChange(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          rows="3"
          placeholder="Enter any additional information for reports..."
        />
        <p className="text-sm text-gray-500 mt-2">
          This information will be included at the bottom of printed reports.
        </p>
        <div className="mt-3 flex justify-end">
          <button
            onClick={onSaveFootnote}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
          >
            Save Footnote to Server
          </button>
        </div>
      </div>
    </div>
  );
};

RemarksTab.propTypes = {
  students: PropTypes.arrayOf(PropTypes.object).isRequired,
  formData: PropTypes.shape({
    attendance: PropTypes.object.isRequired,
    remarks: PropTypes.object.isRequired,
    attitude: PropTypes.object.isRequired,
    interest: PropTypes.object.isRequired,
    comments: PropTypes.object.isRequired
  }).isRequired,
  errors: PropTypes.object,
  footnoteInfo: PropTypes.string,
  syncStatus: PropTypes.object,
  onAttendanceChange: PropTypes.func.isRequired,
  onRemarkChange: PropTypes.func.isRequired,
  onAttitudeChange: PropTypes.func.isRequired,
  onInterestChange: PropTypes.func.isRequired,
  onCommentChange: PropTypes.func.isRequired,
  onFootnoteChange: PropTypes.func.isRequired,
  onSaveAll: PropTypes.func.isRequired,
  onSaveFootnote: PropTypes.func.isRequired,
  saving: PropTypes.bool
};

RemarksTab.defaultProps = {
  errors: {},
  footnoteInfo: '',
  syncStatus: {},
  saving: false
};

export default RemarksTab;
