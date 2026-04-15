import { useState } from 'react';
import "./App.css"

function ClockIn() {
  const [studentId, setStudentId] = useState('');
  const [message, setMessage] = useState('');
  const [flash, setFlash] = useState('');

  function playSound(type) {
    const context = new AudioContext();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.connect(gain);
    gain.connect(context.destination);
    if (type === 'in') {
      oscillator.frequency.value = 700;
    } else {
      oscillator.frequency.value = 300;
    }
    gain.gain.setValueAtTime(1, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.5);
    oscillator.start(context.currentTime);
    oscillator.stop(context.currentTime + 0.5);
  }

  async function handleClockIn() {
    playSound('in');
    setFlash('green');
    setMessage('✅ Clocked in: ' + studentId);
    await fetch('http://127.0.0.1:5000/clock-in', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ student_id: studentId })
    });
    setTimeout(() => {
      setFlash('');
      setStudentId('');
      setMessage('');
    }, 3000);
  }

  async function handleClockOut() {
    playSound('out');
    setFlash('red');
    setMessage('🔴 Clocked out: ' + studentId);
    await fetch('http://127.0.0.1:5000/clock-out', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ student_id: studentId })
    });
    setTimeout(() => {
      setFlash('');
      setStudentId('');
      setMessage('');
    }, 3000);
  }

  return (
    <div className="container" style={{backgroundColor: flash || 'black'}}>
      <h1>Student Time Tracker</h1>
      <input
        type="text"
        placeholder="Enter Student ID"
        value={studentId}
        onChange={(e) => setStudentId(e.target.value.toUpperCase())}
      />
      <div className="buttons">
        <button disabled={studentId === ''} onClick={handleClockIn}>Clock In</button>
        <button disabled={studentId === ''} onClick={handleClockOut}>Clock Out</button>
      </div>
      <p>{message}</p>
    </div>
  );
}

export default ClockIn;