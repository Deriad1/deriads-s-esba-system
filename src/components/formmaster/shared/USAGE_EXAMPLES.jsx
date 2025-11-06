/**
 * Usage Examples for FormMaster Shared Components
 *
 * This file demonstrates how to use the shared components
 * created in Phase 1 of the FormMaster refactoring.
 *
 * These examples can be used as reference when implementing
 * the tab components in Phase 2 and beyond.
 */

import { DraftIndicator, SyncStatusPanel } from './index';
import { useFormMasterState } from '../../../hooks/useFormMasterState';

/**
 * Example 1: Using DraftIndicator in a form field
 */
export const DraftIndicatorExample = () => {
  const { state, actions } = useFormMasterState();

  return (
    <div>
      <h3>Student Remarks</h3>
      <table>
        <thead>
          <tr>
            <th>Student</th>
            <th>Remark</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {/* Example student rows */}
          <tr>
            <td>John Doe</td>
            <td>
              <select
                value={state.formData.remarks['student123'] || ''}
                onChange={(e) => actions.updateRemark('student123', e.target.value)}
              >
                <option value="">Select</option>
                <option value="EXCELLENT">EXCELLENT</option>
                <option value="VERY GOOD">VERY GOOD</option>
                <option value="GOOD">GOOD</option>
              </select>
            </td>
            <td>
              {/* Show draft indicator based on sync status */}
              <DraftIndicator
                isDraft={state.syncStatus.remarks === 'draft'}
                isSyncing={state.syncStatus.remarks === 'syncing'}
                small
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

/**
 * Example 2: Using SyncStatusPanel at the top of a tab
 */
export const SyncStatusPanelExample = () => {
  const { state, actions } = useFormMasterState();

  // Calculate stats
  const drafts = Object.keys(state.formData.remarks).filter(
    id => state.formData.remarks[id] && state.syncStatus.remarks === 'draft'
  ).length;

  const saved = Object.keys(state.formData.remarks).filter(
    id => state.formData.remarks[id] && state.syncStatus.remarks === 'saved'
  ).length;

  const pending = state.syncStatus.remarks === 'draft' ? drafts : 0;

  const handleSyncAll = async () => {
    // Set syncing status
    actions.setSyncStatus('remarks', 'syncing');

    try {
      // Call API to save all remarks
      // await saveAllRemarks(state.formData.remarks);

      // On success, mark as saved
      actions.setSyncStatus('remarks', 'saved');
    } catch (error) {
      // On error, keep as draft
      actions.setSyncStatus('remarks', 'draft');
    }
  };

  return (
    <div>
      <SyncStatusPanel
        drafts={drafts}
        saved={saved}
        pending={pending}
        onSyncAll={handleSyncAll}
        isSyncing={state.syncStatus.remarks === 'syncing'}
        showDetails={true}
      />

      {/* Rest of the tab content */}
    </div>
  );
};

/**
 * Example 3: Combined usage in a typical tab component
 */
export const TypicalTabExample = ({ students }) => {
  const { state, actions } = useFormMasterState();

  // Calculate sync stats
  const getDraftCount = () => {
    return Object.keys(state.formData.attendance).filter(
      id => state.formData.attendance[id] && state.syncStatus.attendance === 'draft'
    ).length;
  };

  const getSavedCount = () => {
    return Object.keys(state.formData.attendance).filter(
      id => state.formData.attendance[id] && state.syncStatus.attendance === 'saved'
    ).length;
  };

  const handleSaveAll = async () => {
    actions.setSyncStatus('attendance', 'syncing');
    try {
      // Save to server
      // await saveAllAttendance(state.formData.attendance);
      actions.setSyncStatus('attendance', 'saved');
    } catch (error) {
      actions.setSyncStatus('attendance', 'draft');
    }
  };

  return (
    <div className="p-6">
      {/* Sync status at the top */}
      <SyncStatusPanel
        drafts={getDraftCount()}
        saved={getSavedCount()}
        pending={state.syncStatus.attendance === 'draft' ? getDraftCount() : 0}
        onSyncAll={handleSaveAll}
        isSyncing={state.syncStatus.attendance === 'syncing'}
      />

      {/* Form content */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-4">Term Attendance</h3>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Student
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Days Present
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {students.map(student => {
              const studentId = student.idNumber || student.id;
              const hasValue = state.formData.attendance[studentId];
              const isDraft = hasValue && state.syncStatus.attendance === 'draft';

              return (
                <tr key={studentId}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {student.firstName} {student.lastName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="number"
                      min="0"
                      max="365"
                      value={state.formData.attendance[studentId] || ''}
                      onChange={(e) => actions.updateAttendance(studentId, e.target.value)}
                      className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {hasValue && (
                      <DraftIndicator
                        isDraft={isDraft}
                        isSyncing={state.syncStatus.attendance === 'syncing'}
                        small
                      />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Save button at the bottom */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSaveAll}
          disabled={state.syncStatus.attendance === 'syncing'}
          className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {state.syncStatus.attendance === 'syncing' ? 'Saving...' : 'Save All to Server'}
        </button>
      </div>
    </div>
  );
};

/**
 * Example 4: Using with NotificationContext
 */
export const WithNotificationsExample = () => {
  const { state, actions } = useFormMasterState();
  // In real implementation, import from context
  // const { showNotification } = useNotification();

  const handleSave = async () => {
    actions.setSyncStatus('remarks', 'syncing');

    try {
      // Save to server
      // const response = await saveRemarks(state.formData.remarks);

      // On success
      actions.setSyncStatus('remarks', 'saved');

      // Show success notification
      // showNotification({
      //   message: 'Remarks saved successfully!',
      //   type: 'success'
      // });
    } catch (error) {
      // On error
      actions.setSyncStatus('remarks', 'draft');

      // Show error notification
      // showNotification({
      //   message: 'Error saving remarks: ' + error.message,
      //   type: 'error'
      // });
    }
  };

  return (
    <div>
      {/* Component content */}
      <button onClick={handleSave}>
        Save Remarks
      </button>
    </div>
  );
};

/**
 * Example 5: Compact display for inline use
 */
export const CompactDisplayExample = () => {
  const { state } = useFormMasterState();

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-600">Student remarks:</span>
      <DraftIndicator
        isDraft={state.syncStatus.remarks === 'draft'}
        small
      />
    </div>
  );
};
