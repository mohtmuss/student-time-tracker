import { useState, useEffect } from 'react';

function StudentProfile({ student, onBack }) {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    fetch(`http://127.0.0.1:5000/student-history/${student.student_id}`)
      .then(res => res.json())
      .then(data => setHistory(data));
  }, [student]);

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

      <h2>Clock In/Out History</h2>
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