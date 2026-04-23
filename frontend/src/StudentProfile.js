import { useState, useEffect, useCallback} from 'react';

function StudentProfile({ student, onBack, refreshClockedIn }) {
  const [history, setHistory] = useState([]);
  const [clockedIn, setClockedIn] = useState(false);
  const [clockMessage, setClockMessage] = useState('');
  const [showAddEntry, setShowAddEntry] = useState(false);

  const [entryClockIn, setEntryClockIn] = useState('');
  const [entryClockOut, setEntryClockOut] = useState('');
  const [entryMessage, setEntryMessage] = useState('');

  const fetchHistory = useCallback(() => {
    fetch(`${process.env.REACT_APP_API_URL}/student-history/${student.student_id}`)
      .then(res => res.json())
      .then(data => {
        const sorted = [...data].sort((a, b) => {
          if (!a.clock_out) return -1;
          if (!b.clock_out) return 1;
          return new Date(b.clock_in) - new Date(a.clock_in);
        });
        setHistory(sorted);
      });
  }, [student.student_id]);

  const checkClockedIn = useCallback(() => {
    fetch(`${process.env.REACT_APP_API_URL}/clocked-in-students`)
      .then(res => res.json())
      .then(data => setClockedIn(data.includes(student.student_id)));
  }, [student.student_id]);

  useEffect(() => {
    fetchHistory();
    checkClockedIn();
  }, [fetchHistory, checkClockedIn]);
  
  async function handleClockIn() {
    const res = await fetch(`${process.env.REACT_APP_API_URL}/clock-in`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ student_id: student.student_id })
    });
    const data = await res.json();
    if (res.ok) {
      setClockedIn(true);
      setClockMessage('✅ Clocked in successfully!');
      fetchHistory();
      refreshClockedIn();
    } else {
      setClockMessage('❌ ' + data.error);
    }
    setTimeout(() => setClockMessage(''), 3000);
  }

  async function handleClockOut() {
    const res = await fetch(`${process.env.REACT_APP_API_URL}/clock-out`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ student_id: student.student_id })
    });
    const data = await res.json();
    if (res.ok) {
      setClockedIn(false);
      setClockMessage('🔴 Clocked out successfully!');
      fetchHistory();
      refreshClockedIn();
    } else {
      setClockMessage('❌ ' + data.error);
    }
    setTimeout(() => setClockMessage(''), 3000);
  }

  async function handleAddEntry() {
    if (!entryClockIn || !entryClockOut) {
      setEntryMessage('❌ Please fill in all fields');
      return;
    }
    const today = new Date().toISOString().split('T')[0];
    const res = await fetch(`${process.env.REACT_APP_API_URL}/manual-clock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        student_id: student.student_id,
        date: today,
        clock_in: entryClockIn,
        clock_out: entryClockOut
      })
    });
    const data = await res.json();
    if (res.ok) {
      setEntryMessage('✅ Entry added!');
      setEntryClockIn('');
      setEntryClockOut('');
      fetchHistory();
      setTimeout(() => {
        setEntryMessage('');
        setShowAddEntry(false);
      }, 2000);
    } else {
      setEntryMessage('❌ ' + data.error);
    }
  }

  function formatTime(dateTimeStr) {
    if (!dateTimeStr) return '—';
    const date = new Date(dateTimeStr);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }

  function formatDate(dateStr) {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  function calculateHours(clockIn, clockOut) {
    if (!clockOut) return 'In progress';
    const diff = new Date(clockOut) - new Date(clockIn);
    const hours = (diff / 1000 / 60 / 60).toFixed(2);
    return hours + ' hrs';
  }

  function calculateWeeklyTotal() {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    const total = history.reduce((sum, log) => {
      if (!log.clock_out) return sum;
      const clockIn = new Date(log.clock_in);
      if (clockIn >= startOfWeek && clockIn <= endOfWeek) {
        const diff = new Date(log.clock_out) - clockIn;
        return sum + diff / 1000 / 60 / 60;
      }
      return sum;
    }, 0);
    return total.toFixed(2);
  }

  const weeklyTotal = calculateWeeklyTotal();
  const meetsRequirement = weeklyTotal >= 6;

  return (
    <div>
      <button onClick={onBack}>← Back</button>
      <h1>{student.first_name} {student.last_name}</h1>
      <p>Student ID: {student.student_id}</p>
      <p>Email: {student.email}</p>
      <p>Status: {student.status}</p>
      <p>Graduation Year: {student.graduation_year}</p>

      {/* Weekly Summary */}
      <div className="weekly-summary" style={{
        backgroundColor: meetsRequirement ? '#1a3a1a' : '#3a1a1a',
        border: `2px solid ${meetsRequirement ? '#2ecc71' : '#e74c3c'}`,
        padding: '16px',
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <h3 style={{color: meetsRequirement ? '#2ecc71' : '#e74c3c'}}>
          {meetsRequirement ? '✅ Meeting requirement' : '⚠️ Below 6 hrs requirement'}
        </h3>
        <p style={{color: 'white'}}>Weekly Total: <strong>{weeklyTotal} hrs</strong> / 6 hrs required</p>
      </div>

      {/* Clock In / Out Buttons */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
        <button
          onClick={handleClockIn}
          disabled={clockedIn}
          style={{
            padding: '12px 24px',
            borderRadius: '8px',
            border: 'none',
            cursor: clockedIn ? 'not-allowed' : 'pointer',
            backgroundColor: clockedIn ? '#333' : '#2ecc71',
            color: 'white',
            fontWeight: '600',
            fontSize: '14px',
            opacity: clockedIn ? 0.5 : 1
          }}>
          🟢 Clock In
        </button>
        <button
          onClick={handleClockOut}
          disabled={!clockedIn}
          style={{
            padding: '12px 24px',
            borderRadius: '8px',
            border: 'none',
            cursor: !clockedIn ? 'not-allowed' : 'pointer',
            backgroundColor: !clockedIn ? '#333' : '#e74c3c',
            color: 'white',
            fontWeight: '600',
            fontSize: '14px',
            opacity: !clockedIn ? 0.5 : 1
          }}>
          🔴 Clock Out
        </button>
      </div>

      {/* Clock Message */}
      {clockMessage && (
        <p style={{ color: 'white', marginBottom: '16px', fontWeight: '500' }}>
          {clockMessage}
        </p>
      )}

      {/* History Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h2 style={{ margin: 0, color: 'white' }}>Clock In/Out History</h2>
        <button
          onClick={() => setShowAddEntry(!showAddEntry)}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            backgroundColor: '#5865F2',
            color: 'white',
            fontWeight: '600',
            fontSize: '13px'
          }}>
          {showAddEntry ? 'Cancel' : '+ Add Entry'}
        </button>
      </div>

      {/* Add Entry Form */}
      {showAddEntry && (
        <div style={{
          background: '#1e1e3a',
          border: '1px solid #5865F2',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ color: '#aaa', fontSize: '12px' }}>🕐 Clock In</label>
              <input
                type="time"
                value={entryClockIn}
                onChange={(e) => setEntryClockIn(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #333',
                  background: '#0d0d1a',
                  color: 'white',
                  fontSize: '14px'
                }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ color: '#aaa', fontSize: '12px' }}>🕑 Clock Out</label>
              <input
                type="time"
                value={entryClockOut}
                onChange={(e) => setEntryClockOut(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #333',
                  background: '#0d0d1a',
                  color: 'white',
                  fontSize: '14px'
                }}
              />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={handleAddEntry}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: '#2ecc71',
                color: 'white',
                fontWeight: '600',
                fontSize: '14px'
              }}>
              Save Entry
            </button>
            {entryMessage && (
              <p style={{ color: 'white', margin: 0, fontWeight: '500' }}>
                {entryMessage}
              </p>
            )}
          </div>
        </div>
      )}

      {/* History Table */}
      <table className="history-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Clock In</th>
            <th>Clock Out</th>
            <th>Total Hours</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {history.map(log => (
            <tr key={log.id}>
              <td>{formatDate(log.date)}</td>
              <td>{formatTime(log.clock_in)}</td>
              <td>{formatTime(log.clock_out)}</td>
              <td>{calculateHours(log.clock_in, log.clock_out)}</td>
              <td>{log.clock_out ? '✅ Done' : '🟢 Active'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default StudentProfile;