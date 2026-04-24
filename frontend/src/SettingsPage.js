import { useState } from 'react';

function SettingsPage() {
  const [accessKey, setAccessKey] = useState('');
  const [message, setMessage] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');

  async function handleErase() {
    const response = await fetch(`${process.env.REACT_APP_API_URL}/erase-timelogs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ access_key: accessKey })
    });
    if (response.ok) {
      setMessage('✅ All time logs erased successfully!');
      setAccessKey('');
      setShowConfirm(false);
      setError('');
    } else {
      setError('❌ Invalid access key!');
    }
  }

  return (
    <div className="attendance">
      <div className="att-section">
        <h2>⚙️ Settings</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
          Manage system data and access
        </p>

        {/* Danger Zone */}
        <div style={{
          border: '2px solid #e74c3c',
          borderRadius: '12px',
          padding: '24px',
          marginTop: '20px'
        }}>
          <h3 style={{ color: '#e74c3c', marginBottom: '8px' }}>⚠️ Danger Zone</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>
            Erase all clock in/out history. This action cannot be undone!
          </p>

          {!showConfirm ? (
            <button
              onClick={() => setShowConfirm(true)}
              style={{
                backgroundColor: '#e74c3c', color: 'white',
                border: 'none', padding: '12px 24px',
                borderRadius: '8px', cursor: 'pointer', fontSize: '16px'
              }}>
              🗑️ Erase All Time Logs
            </button>
          ) : (
            <div>
              <p style={{ color: 'var(--text-primary)', marginBottom: '12px' }}>
                Enter access key to confirm:
              </p>
              <input
                type="password"
                placeholder="Enter access key..."
                value={accessKey}
                onChange={(e) => setAccessKey(e.target.value)}
                style={{
                  padding: '10px', borderRadius: '8px',
                  border: '2px solid #e74c3c',
                  backgroundColor: 'var(--bg-input)',
                  color: 'var(--text-primary)',
                  fontSize: '16px', width: '250px', marginRight: '12px'
                }}
              />
              <button
                onClick={handleErase}
                style={{
                  backgroundColor: '#e74c3c', color: 'white',
                  border: 'none', padding: '10px 20px',
                  borderRadius: '8px', cursor: 'pointer',
                  fontSize: '16px', marginRight: '8px'
                }}>
                Confirm Erase
              </button>
              <button
                onClick={() => { setShowConfirm(false); setAccessKey(''); setError(''); }}
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-subtle)',
                  padding: '10px 20px', borderRadius: '8px',
                  cursor: 'pointer', fontSize: '16px'
                }}>
                Cancel
              </button>
              {error && <p style={{ color: '#e74c3c', marginTop: '12px' }}>{error}</p>}
            </div>
          )}

          {message && (
            <p style={{ color: '#2ecc71', marginTop: '16px', fontWeight: 'bold' }}>{message}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;