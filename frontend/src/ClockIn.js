import { useState, useEffect } from 'react';

function ClockIn() {
  const [studentId, setStudentId] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [time, setTime] = useState('');
  const [dateStr, setDateStr] = useState('');

  useEffect(() => {
    function updateClock() {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      const s = String(now.getSeconds()).padStart(2, '0');
      setTime(`${h}:${m}:${s}`);
      setDateStr(now.toLocaleDateString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
      }));
    }
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // keep Render server alive
    const ping = () => {
      fetch(`${process.env.REACT_APP_API_URL}/`)
        .catch(() => {});
    };
    ping();
    const interval = setInterval(ping, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  function playSound(type) {
    const context = new AudioContext();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.frequency.value = type === 'in' ? 700 : 300;
    gain.gain.setValueAtTime(1, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.5);
    oscillator.start(context.currentTime);
    oscillator.stop(context.currentTime + 0.5);
  }

  function setStatus(msg, type) {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => { setMessage(''); setMessageType(''); }, 3000);
  }

  async function handleClockIn() {
    const response = await fetch(`${process.env.REACT_APP_API_URL}/clock-in`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ student_id: studentId })
    });
    const data = await response.json();
    if (response.ok) {
      playSound('in');
      setStatus('Clocked in: ' + studentId, 'success');
      setStudentId('');
    } else {
      setStatus('❌ ' + (data.error || 'Invalid Student ID!'), 'error');
    }
  }

  async function handleClockOut() {
    const response = await fetch(`${process.env.REACT_APP_API_URL}/clock-out`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ student_id: studentId })
    });
    const data = await response.json();
    if (response.ok) {
      playSound('out');
      setStatus('Clocked out: ' + studentId, 'error');
      setStudentId('');
    } else {
      setStatus('❌ ' + (data.error || 'Not clocked in!'), 'error');
    }
  }

  const inputStyle = {
    width: '100%', height: 52,
    background: '#12192b',
    border: '1.5px solid rgba(255,255,255,0.1)',
    borderRadius: 10,
    padding: '0 16px 0 44px',
    fontSize: 16, fontWeight: 600,
    color: '#fff', letterSpacing: '0.1em',
    outline: 'none', fontFamily: 'inherit',
    boxSizing: 'border-box'
  };

  const btnBase = {
    flex: 1, height: 48, border: 'none',
    borderRadius: 10, fontSize: 14, fontWeight: 600,
    cursor: studentId ? 'pointer' : 'not-allowed',
    fontFamily: 'inherit', display: 'flex',
    alignItems: 'center', justifyContent: 'center', gap: 8,
    opacity: studentId ? 1 : 0.3
  };

  return (
    <div style={{
      minHeight: '100vh', background: '#080c14',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '40px 20px', fontFamily: "'Segoe UI', sans-serif"
    }}>
      {/* Brand */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 32 }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          border: '2.5px solid #c9a227', background: '#12192b',
          display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12
        }}>
          <img
            src="/Millersville_Marauders_logo_svg.png"
            alt="Millersville"
            style={{ width: 52, height: 52, objectFit: 'contain' }}
          />
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#c9a227', marginBottom: 4 }}>
          Millersville University
        </div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.06em' }}>
          Student Time Tracker
        </div>
      </div>

      {/* Card */}
      <div style={{
        background: '#0e1525',
        border: '0.5px solid rgba(255,255,255,0.08)',
        borderRadius: 16, padding: '32px 28px',
        width: '100%', maxWidth: 380,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: 20,
        overflow: 'hidden'
      }}>
        {/* Clock */}
        <div style={{ fontSize: 32, fontWeight: 700, color: '#fff', letterSpacing: '0.04em' }}>
          {time}
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: -12, textAlign: 'center' }}>
          {dateStr}
        </div>

        <div style={{ width: '100%', height: 0.5, background: 'rgba(255,255,255,0.06)' }} />

        <div style={{ fontSize: 18, fontWeight: 600, color: '#fff' }}>Clock In / Out</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: -12 }}>Enter your student ID below</div>

        {/* Input */}
        <div style={{ width: '100%', position: 'relative' }}>
          <svg style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }}
            width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
          <input
            style={inputStyle}
            type="text"
            placeholder="Student ID (e.g. MM26)"
            value={studentId}
            maxLength={10}
            onChange={e => setStudentId(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === 'Enter' && studentId && handleClockIn()}
          />
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 12, width: '100%' }}>
          <button
            onClick={handleClockIn}
            disabled={!studentId}
            style={{ ...btnBase, background: '#1d9e75', color: '#fff' }}
          >
            Clock In
          </button>
          <button
            onClick={handleClockOut}
            disabled={!studentId}
            style={{ ...btnBase, background: '#2a1a1a', border: '1.5px solid #e24b4a', color: '#e24b4a' }}
          >
            Clock Out
          </button>
        </div>

        {/* Status */}
        <div style={{
          fontSize: 13, fontWeight: 500, textAlign: 'center', minHeight: 20,
          color: messageType === 'success' ? '#1d9e75' : messageType === 'error' ? '#e24b4a' : '#c9a227'
        }}>
          {message}
        </div>
      </div>
    </div>
  );
}

export default ClockIn;