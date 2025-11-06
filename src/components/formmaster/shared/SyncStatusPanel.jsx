import PropTypes from 'prop-types';
import { useNotification } from '../../../context/NotificationContext';

/**
 * SyncStatusPanel Component
 *
 * Displays overall sync status showing:
 * - Items saved to server
 * - Items in draft (local only)
 * - Items pending sync
 * - "Sync All" button when there are pending items
 *
 * Purpose: Provides users with clear overview of data persistence state
 *          and ability to bulk sync all local changes to server
 *
 * @component
 * @example
 * <SyncStatusPanel
 *   drafts={5}
 *   saved={20}
 *   pending={3}
 *   onSyncAll={handleSyncAll}
 *   isSyncing={false}
 * />
 */
const SyncStatusPanel = ({
  drafts,
  saved,
  pending,
  onSyncAll,
  isSyncing,
  showDetails
}) => {
  const { showNotification } = useNotification();

  const handleSyncClick = () => {
    if (pending === 0) {
      showNotification({
        message: 'No pending items to sync',
        type: 'info'
      });
      return;
    }

    if (typeof onSyncAll === 'function') {
      onSyncAll();
    }
  };

  return (
    <div
      className="sync-status-panel"
      style={{
        backgroundColor: '#f9fafb',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '20px'
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: showDetails ? '12px' : '0'
        }}
      >
        <div>
          <h4
            style={{
              margin: '0 0 8px 0',
              fontSize: '14px',
              fontWeight: '600',
              color: '#374151',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span style={{ fontSize: '16px' }}>📊</span>
            Sync Status
          </h4>

          {showDetails && (
            <div
              style={{
                display: 'flex',
                gap: '16px',
                fontSize: '13px',
                color: '#6b7280'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '14px' }}>✅</span>
                <span>
                  <strong style={{ color: '#10b981' }}>{saved}</strong> saved
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '14px' }}>🟡</span>
                <span>
                  <strong style={{ color: '#f59e0b' }}>{drafts}</strong> draft
                </span>
              </div>

              {pending > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '14px' }}>⏳</span>
                  <span>
                    <strong style={{ color: '#3b82f6' }}>{pending}</strong> pending
                  </span>
                </div>
              )}
            </div>
          )}

          {!showDetails && (
            <div style={{ fontSize: '13px', color: '#6b7280' }}>
              <strong style={{ color: '#10b981' }}>{saved}</strong> saved •{' '}
              <strong style={{ color: '#f59e0b' }}>{drafts}</strong> draft
              {pending > 0 && (
                <>
                  {' • '}
                  <strong style={{ color: '#3b82f6' }}>{pending}</strong> pending
                </>
              )}
            </div>
          )}
        </div>

        {pending > 0 && (
          <button
            onClick={handleSyncClick}
            disabled={isSyncing}
            style={{
              backgroundColor: isSyncing ? '#9ca3af' : '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: '500',
              cursor: isSyncing ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'background-color 0.2s',
              opacity: isSyncing ? 0.7 : 1
            }}
            onMouseEnter={(e) => {
              if (!isSyncing) {
                e.currentTarget.style.backgroundColor = '#2563eb';
              }
            }}
            onMouseLeave={(e) => {
              if (!isSyncing) {
                e.currentTarget.style.backgroundColor = '#3b82f6';
              }
            }}
          >
            {isSyncing ? (
              <>
                <span
                  style={{
                    display: 'inline-block',
                    width: '12px',
                    height: '12px',
                    border: '2px solid white',
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }}
                />
                Syncing...
              </>
            ) : (
              <>
                <span>🔄</span>
                Sync All to Server
              </>
            )}
          </button>
        )}
      </div>

      {/* Help text when there are drafts but no pending */}
      {drafts > 0 && pending === 0 && !isSyncing && (
        <div
          style={{
            marginTop: '12px',
            padding: '8px 12px',
            backgroundColor: '#fef3c7',
            border: '1px solid #fbbf24',
            borderRadius: '4px',
            fontSize: '12px',
            color: '#78350f'
          }}
        >
          💡 <strong>Tip:</strong> Your changes are saved locally. Click individual save buttons to sync to server.
        </div>
      )}

      {/* Success message when everything is saved */}
      {saved > 0 && drafts === 0 && pending === 0 && (
        <div
          style={{
            marginTop: '12px',
            padding: '8px 12px',
            backgroundColor: '#d1fae5',
            border: '1px solid #10b981',
            borderRadius: '4px',
            fontSize: '12px',
            color: '#065f46'
          }}
        >
          ✅ All changes are synced to server
        </div>
      )}
    </div>
  );
};

SyncStatusPanel.propTypes = {
  /**
   * Number of items in draft state (local only)
   */
  drafts: PropTypes.number.isRequired,

  /**
   * Number of items saved to server
   */
  saved: PropTypes.number.isRequired,

  /**
   * Number of items pending sync to server
   */
  pending: PropTypes.number.isRequired,

  /**
   * Callback function to sync all pending items
   */
  onSyncAll: PropTypes.func,

  /**
   * Whether sync operation is in progress
   */
  isSyncing: PropTypes.bool,

  /**
   * Show detailed breakdown of stats
   */
  showDetails: PropTypes.bool
};

SyncStatusPanel.defaultProps = {
  onSyncAll: null,
  isSyncing: false,
  showDetails: false
};

export default SyncStatusPanel;
