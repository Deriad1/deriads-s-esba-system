import PropTypes from 'prop-types';

/**
 * DraftIndicator Component
 *
 * Displays visual indicator showing whether data is:
 * - Saved to server (green checkmark)
 * - Draft/local only (yellow dot)
 * - Syncing to server (blue spinner)
 *
 * Purpose: Helps users understand data persistence state at a glance
 *
 * @component
 * @example
 * // Show draft status
 * <DraftIndicator isDraft={true} />
 *
 * // Show saved status
 * <DraftIndicator isDraft={false} />
 *
 * // Compact display
 * <DraftIndicator isDraft={true} small />
 */
const DraftIndicator = ({ isDraft, isSyncing, small }) => {
  // Syncing state takes priority
  if (isSyncing) {
    return (
      <span
        className={`badge ${small ? 'badge-sm' : ''}`}
        style={{
          backgroundColor: '#3b82f6',
          color: 'white',
          padding: small ? '2px 6px' : '4px 8px',
          borderRadius: '4px',
          fontSize: small ? '10px' : '12px',
          fontWeight: '500',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px'
        }}
      >
        <span
          style={{
            display: 'inline-block',
            width: small ? '8px' : '10px',
            height: small ? '8px' : '10px',
            border: '2px solid white',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}
        />
        {!small && 'Syncing'}
      </span>
    );
  }

  // Draft state (local only - not saved to server)
  if (isDraft) {
    return (
      <span
        className={`badge ${small ? 'badge-sm' : ''}`}
        style={{
          backgroundColor: '#fbbf24',
          color: '#78350f',
          padding: small ? '2px 6px' : '4px 8px',
          borderRadius: '4px',
          fontSize: small ? '10px' : '12px',
          fontWeight: '500',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px'
        }}
        title="Data saved locally - not yet synced to server"
      >
        <span style={{ fontSize: small ? '10px' : '12px' }}>🟡</span>
        {!small && 'Draft (local)'}
      </span>
    );
  }

  // Saved state (synced to server)
  return (
    <span
      className={`badge ${small ? 'badge-sm' : ''}`}
      style={{
        backgroundColor: '#10b981',
        color: 'white',
        padding: small ? '2px 6px' : '4px 8px',
        borderRadius: '4px',
        fontSize: small ? '10px' : '12px',
        fontWeight: '500',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px'
      }}
      title="Data saved to server"
    >
      <span style={{ fontSize: small ? '10px' : '12px' }}>✅</span>
      {!small && 'Saved'}
    </span>
  );
};

DraftIndicator.propTypes = {
  /**
   * Whether the data is in draft state (local only)
   */
  isDraft: PropTypes.bool.isRequired,

  /**
   * Whether the data is currently being synced to server
   */
  isSyncing: PropTypes.bool,

  /**
   * Use compact display (icon only, smaller size)
   */
  small: PropTypes.bool
};

DraftIndicator.defaultProps = {
  isSyncing: false,
  small: false
};

// Add CSS animation for spinner
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  if (!document.querySelector('style[data-draft-indicator]')) {
    style.setAttribute('data-draft-indicator', '');
    document.head.appendChild(style);
  }
}

export default DraftIndicator;
