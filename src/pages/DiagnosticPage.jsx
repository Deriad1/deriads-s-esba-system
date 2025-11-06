import { useState } from 'react';
import { useGlobalSettings } from '../context/GlobalSettingsContext';

const DiagnosticPage = () => {
  const { settings } = useGlobalSettings();
  const [localStorageData, setLocalStorageData] = useState(null);

  const checkLocalStorage = () => {
    const raw = localStorage.getItem('globalSettings');
    let parsed = null;
    let error = null;

    if (raw) {
      try {
        parsed = JSON.parse(raw);
        console.log('✅ localStorage data parsed successfully:', parsed);
      } catch (e) {
        error = e.message;
        console.error('❌ Parse error:', e);
      }
    } else {
      error = 'No globalSettings found in localStorage';
      console.warn('⚠️  No data in localStorage');
    }

    setLocalStorageData({ raw, parsed, error });
  };

  const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Development-only warning banner */}
      <div style={{
        background: isDevelopment ? '#fff3cd' : '#f8d7da',
        border: `2px solid ${isDevelopment ? '#ffc107' : '#dc3545'}`,
        padding: '15px',
        marginBottom: '20px',
        borderRadius: '5px',
        color: '#000'
      }}>
        <h3 style={{ margin: '0 0 10px 0' }}>
          {isDevelopment ? '⚠️  Development Diagnostic Tool' : '🚫 WARNING: Production Environment'}
        </h3>
        <p style={{ margin: 0 }}>
          {isDevelopment
            ? 'This page is for debugging only and should not be accessible in production.'
            : 'This page should NOT be accessible in production! Please remove this route or add environment checks.'}
        </p>
      </div>

      <h1>🔍 Global Settings Diagnostic</h1>
      <p style={{ color: '#666', marginBottom: '20px' }}>
        Compare settings from React Context vs localStorage to debug state persistence issues.
      </p>

      <button
        onClick={checkLocalStorage}
        style={{
          padding: '12px 24px',
          marginBottom: '20px',
          cursor: 'pointer',
          background: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          fontSize: '14px',
          fontWeight: 'bold'
        }}
      >
        📦 Check localStorage
      </button>

      {/* Side-by-side comparison */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
        {/* Context Data */}
        <div style={{ border: '2px solid #28a745', borderRadius: '5px', padding: '15px', background: '#f8f9fa' }}>
          <h2 style={{ color: '#28a745', marginTop: 0 }}>🔴 Live Context Data</h2>
          <p style={{ fontSize: '12px', color: '#666', marginTop: '-10px' }}>
            Current state in React (useGlobalSettings hook)
          </p>
          <pre style={{
            background: '#fff',
            padding: '15px',
            overflow: 'auto',
            maxHeight: '500px',
            border: '1px solid #ddd',
            borderRadius: '3px',
            fontSize: '12px'
          }}>
            {JSON.stringify(settings, null, 2)}
          </pre>
        </div>

        {/* localStorage Data */}
        <div style={{ border: '2px solid #007bff', borderRadius: '5px', padding: '15px', background: '#f8f9fa' }}>
          <h2 style={{ color: '#007bff', marginTop: 0 }}>💾 localStorage Data</h2>
          <p style={{ fontSize: '12px', color: '#666', marginTop: '-10px' }}>
            Persisted data on disk (click button to load)
          </p>
          {localStorageData ? (
            localStorageData.error ? (
              <div style={{ background: '#f8d7da', padding: '15px', borderRadius: '3px', color: '#721c24' }}>
                <strong>❌ Error:</strong> {localStorageData.error}
                {localStorageData.raw && (
                  <details style={{ marginTop: '10px' }}>
                    <summary style={{ cursor: 'pointer' }}>View raw data</summary>
                    <pre style={{ background: '#fff', padding: '10px', marginTop: '10px', overflow: 'auto' }}>
                      {localStorageData.raw}
                    </pre>
                  </details>
                )}
              </div>
            ) : (
              <pre style={{
                background: '#fff',
                padding: '15px',
                overflow: 'auto',
                maxHeight: '500px',
                border: '1px solid #ddd',
                borderRadius: '3px',
                fontSize: '12px'
              }}>
                {JSON.stringify(localStorageData.parsed, null, 2)}
              </pre>
            )
          ) : (
            <div style={{ background: '#e7f3ff', padding: '30px', textAlign: 'center', borderRadius: '3px', color: '#004085' }}>
              Click "Check localStorage" button to load data
            </div>
          )}
        </div>
      </div>

      {/* Background Image Diagnostic */}
      <div style={{ border: '2px solid #6c757d', borderRadius: '5px', padding: '20px', background: '#f8f9fa' }}>
        <h2 style={{ color: '#6c757d', marginTop: 0 }}>🖼️  Background Image Diagnostic</h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
          {/* Context Image Info */}
          <div>
            <h3 style={{ fontSize: '16px', marginBottom: '10px' }}>From Context:</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <tbody>
                <tr style={{ borderBottom: '1px solid #ddd' }}>
                  <td style={{ padding: '8px', fontWeight: 'bold' }}>Has Image:</td>
                  <td style={{ padding: '8px' }}>
                    {settings.backgroundImage
                      ? <span style={{ color: '#28a745', fontWeight: 'bold' }}>✅ YES</span>
                      : <span style={{ color: '#dc3545', fontWeight: 'bold' }}>❌ NO</span>
                    }
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid #ddd' }}>
                  <td style={{ padding: '8px', fontWeight: 'bold' }}>Data Length:</td>
                  <td style={{ padding: '8px' }}>{settings.backgroundImage?.length || 0} characters</td>
                </tr>
                <tr>
                  <td style={{ padding: '8px', fontWeight: 'bold' }}>Data Type:</td>
                  <td style={{ padding: '8px' }}>
                    {settings.backgroundImage?.startsWith('data:image/')
                      ? <span style={{ color: '#28a745' }}>✅ Valid base64</span>
                      : <span style={{ color: '#dc3545' }}>❌ Invalid format</span>
                    }
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* localStorage Image Info */}
          <div>
            <h3 style={{ fontSize: '16px', marginBottom: '10px' }}>From localStorage:</h3>
            {localStorageData?.parsed ? (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #ddd' }}>
                    <td style={{ padding: '8px', fontWeight: 'bold' }}>Has Image:</td>
                    <td style={{ padding: '8px' }}>
                      {localStorageData.parsed.backgroundImage
                        ? <span style={{ color: '#28a745', fontWeight: 'bold' }}>✅ YES</span>
                        : <span style={{ color: '#dc3545', fontWeight: 'bold' }}>❌ NO</span>
                      }
                    </td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #ddd' }}>
                    <td style={{ padding: '8px', fontWeight: 'bold' }}>Data Length:</td>
                    <td style={{ padding: '8px' }}>{localStorageData.parsed.backgroundImage?.length || 0} characters</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px', fontWeight: 'bold' }}>Data Type:</td>
                    <td style={{ padding: '8px' }}>
                      {localStorageData.parsed.backgroundImage?.startsWith('data:image/')
                        ? <span style={{ color: '#28a745' }}>✅ Valid base64</span>
                        : <span style={{ color: '#dc3545' }}>❌ Invalid format</span>
                      }
                    </td>
                  </tr>
                </tbody>
              </table>
            ) : (
              <div style={{ background: '#e7f3ff', padding: '20px', textAlign: 'center', borderRadius: '3px', color: '#004085' }}>
                Load localStorage data to see comparison
              </div>
            )}
          </div>
        </div>

        {/* Image Previews */}
        {settings.backgroundImage && (
          <div style={{ marginTop: '20px' }}>
            <h3 style={{ fontSize: '16px', marginBottom: '10px' }}>Data Preview (first 100 characters):</h3>
            <pre style={{ background: '#fff', padding: '10px', overflow: 'auto', border: '1px solid #ddd', borderRadius: '3px', fontSize: '11px' }}>
              {settings.backgroundImage.substring(0, 100)}...
            </pre>

            <h3 style={{ fontSize: '16px', marginTop: '20px', marginBottom: '10px' }}>Visual Rendering Test:</h3>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
              <div>
                <p style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '10px' }}>From Context:</p>
                <img
                  src={settings.backgroundImage}
                  alt="Context Background"
                  style={{ maxWidth: '300px', maxHeight: '300px', border: '2px solid #28a745', borderRadius: '5px' }}
                  onError={(e) => {
                    e.target.style.border = '2px solid #dc3545';
                    e.target.alt = '❌ Failed to load image from context';
                  }}
                />
              </div>
              {localStorageData?.parsed?.backgroundImage && (
                <div>
                  <p style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '10px' }}>From localStorage:</p>
                  <img
                    src={localStorageData.parsed.backgroundImage}
                    alt="localStorage Background"
                    style={{ maxWidth: '300px', maxHeight: '300px', border: '2px solid #007bff', borderRadius: '5px' }}
                    onError={(e) => {
                      e.target.style.border = '2px solid #dc3545';
                      e.target.alt = '❌ Failed to load image from localStorage';
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Comparison Status */}
      {localStorageData?.parsed && (
        <div style={{ marginTop: '20px', padding: '15px', background: '#f8f9fa', border: '2px solid #6c757d', borderRadius: '5px' }}>
          <h3 style={{ marginTop: 0 }}>🔄 Sync Status</h3>
          <p>
            <strong>Context vs localStorage:</strong>{' '}
            {JSON.stringify(settings) === JSON.stringify(localStorageData.parsed)
              ? <span style={{ color: '#28a745', fontWeight: 'bold' }}>✅ IN SYNC</span>
              : <span style={{ color: '#ffc107', fontWeight: 'bold' }}>⚠️  OUT OF SYNC</span>
            }
          </p>
          {JSON.stringify(settings) !== JSON.stringify(localStorageData.parsed) && (
            <p style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
              💡 Tip: Settings might be out of sync if you made changes but haven't saved, or if there was an error during persistence.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default DiagnosticPage;
