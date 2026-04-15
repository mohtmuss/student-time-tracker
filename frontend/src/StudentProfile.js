import { useState, useEffect } from 'react';

function StudentProfile({ student, onBack }) {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    fetch(`http://127.0.0.1:5000/student-history/${student.student_id}`)
      .then(res => res.json())
      .then(data => setHistory(data));
  }, [student]);

  function calculateHours(clockIn, clockOut) {
    if (!clockOut) return 'In progress';
    const diff = new Date(clockOut) - new Date(clockIn);
    const hours = (diff / 1000 / 60 / 60).toFixed(2);
    return hours + ' hrs';
  }

  function calculateWeeklyTotal() {
    const total = history.reduce((sum, log) => {
      if (!log.clock_out) return sum;
      const diff = new Date(log.clock_out) - new Date(log.clock_in);
      return sum + diff / 1000 / 60 / 60;
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
              <td>{log.date}</td>
              <td>{log.clock_in}</td>
              <td>{log.clock_out || '—'}</td>
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