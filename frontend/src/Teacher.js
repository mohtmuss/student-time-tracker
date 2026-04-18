import { useState } from 'react';

function Teacher() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setError('');
    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch('http://127.0.0.1:5000/login', {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('token', data.token);
        window.location.href = '/dashboard';
      } else {
        setError('Invalid email or password. Please try again.');
      }
    } catch {
      setError('Cannot connect to server. Is Flask running?');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: "'Segoe UI', sans-serif" }}>

      <div style={{
        width: '45%', background: '#0b1120',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '40px 32px',
        borderRight: '0.5px solid rgba(201,162,39,0.2)'
      }}>
        <div style={{
          width: 110, height: 110, borderRadius: '50%',
          border: '2.5px solid #c9a227', background: '#12192b',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 20
        }}>
          <img
            src="/Millersville_Marauders_logo_svg.png"
            alt="Millersville"
            style={{ width: 70, height: 70, objectFit: 'contain' }}
          />
        </div>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#c9a227', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>
          Millersville
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginBottom: 28 }}>
          University · Pennsylvania
        </div>
        <div style={{ width: 40, height: 1, background: 'rgba(201,162,39,0.3)', marginBottom: 24 }} />
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', textAlign: 'center', lineHeight: 1.7, maxWidth: 200 }}>
          Student time tracking portal for faculty
        </div>
      </div>

      <div style={{
        flex: 1, background: '#fff',
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center', padding: '48px 40px'
      }}>
        <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#c9a227', marginBottom: 8 }}>
          Teacher portal
        </p>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0b1120', marginBottom: 6 }}>
          Welcome back
        </h1>
        <p style={{ fontSize: 13, color: '#888', marginBottom: 28 }}>
          Sign in to access your dashboard
        </p>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#444', marginBottom: 6 }}>Email address</label>
          <input
            type="email"
            placeholder="you@millersville.edu"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && document.getElementById('pw').focus()}
            style={{ width: '100%', height: 44, padding: '0 14px', border: '1.5px solid #e8e8e8', borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit', background: '#fafafa' }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#444', marginBottom: 6 }}>Password</label>
          <input
            id="pw"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            style={{ width: '100%', height: 44, padding: '0 14px', border: '1.5px solid #e8e8e8', borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit', background: '#fafafa' }}
          />
        </div>

        {error && (
          <div style={{ fontSize: 12, color: '#a32d2d', background: '#fcebeb', border: '0.5px solid #f09595', borderRadius: 6, padding: '8px 12px', marginBottom: 12 }}>
            {error}
          </div>
        )}

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            width: '100%', height: 46, background: '#0b1120',
            color: '#c9a227', border: 'none', borderRadius: 8,
            fontSize: 14, fontWeight: 600, cursor: 'pointer',
            letterSpacing: '0.04em', fontFamily: 'inherit',
            opacity: loading ? 0.7 : 1
          }}
        >
          {loading ? 'Signing in...' : 'Sign in to dashboard'}
        </button>
      </div>
    </div>
  );
}

export default Teacher;