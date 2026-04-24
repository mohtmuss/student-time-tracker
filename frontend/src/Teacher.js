import { useState } from 'react';

function Teacher() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
      const response = await fetch(`${process.env.REACT_APP_API_URL}/login`, {
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

  const EyeIcon = ({ open }) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      {open ? (
        <>
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
          <circle cx="12" cy="12" r="3"/>
        </>
      ) : (
        <>
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
          <line x1="1" y1="1" x2="23" y2="23"/>
        </>
      )}
    </svg>
  );

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        .login-input {
          width: 100%;
          height: 50px;
          border: 1.5px solid rgba(255,255,255,0.15);
          border-radius: 12px;
          font-size: 14px;
          outline: none;
          font-family: inherit;
          background: rgba(255,255,255,0.08);
          box-sizing: border-box;
          transition: all 0.2s;
          color: #fff;
        }
        .login-input::placeholder { color: rgba(255,255,255,0.35); }
        .login-input:focus {
          border-color: #c9a227;
          background: rgba(255,255,255,0.12);
          box-shadow: 0 0 0 3px rgba(201,162,39,0.2);
        }
        .sign-in-btn {
          width: 100%;
          height: 50px;
          background: linear-gradient(135deg, #c9a227, #e0b830);
          color: #0b1120;
          border: none;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          letter-spacing: 0.08em;
          font-family: inherit;
          text-transform: uppercase;
          transition: all 0.2s;
          box-shadow: 0 4px 20px rgba(201,162,39,0.4);
        }
        .sign-in-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(201,162,39,0.55);
        }
        .sign-in-btn:active { transform: translateY(0); }
        .eye-btn:hover { color: #c9a227 !important; }
      `}</style>

      {/* Full page — moon background */}
      <div style={{
        height: '100vh',
        backgroundImage: 'url(/moon-bg.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Segoe UI', sans-serif",
        padding: '20px',
        boxShadow: 'inset 0 0 0 2000px rgba(0,0,0,0.35)'
      }}>

        {/* Card */}
        <div style={{
          width: '100%',
          maxWidth: 900,
          height: 560,
          borderRadius: 24,
          boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
          display: 'flex',
          overflow: 'hidden',
          animation: 'fadeIn 0.6s ease',
          border: '1px solid rgba(255,255,255,0.08)'
        }}>

          {/* LEFT — Decorative dark panel */}
          <div style={{
            width: '50%',
            background: 'linear-gradient(145deg, rgba(11,17,32,0.95) 0%, rgba(26,40,64,0.95) 50%, rgba(13,30,53,0.95) 100%)',
            backdropFilter: 'blur(20px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px',
            position: 'relative',
            overflow: 'hidden',
            flexShrink: 0
          }}>
            {/* Decorative circles */}
            <div style={{ position: 'absolute', top: -40, left: -40, width: 180, height: 180, borderRadius: '50%', border: '1px solid rgba(201,162,39,0.12)' }} />
            <div style={{ position: 'absolute', top: -10, left: -10, width: 110, height: 110, borderRadius: '50%', border: '1px solid rgba(201,162,39,0.18)' }} />
            <div style={{ position: 'absolute', bottom: -60, right: 20, width: 200, height: 200, borderRadius: '50%', border: '1px solid rgba(201,162,39,0.08)' }} />

            {/* Logo floating */}
            <div style={{
              width: 90, height: 90, borderRadius: '50%',
              border: '2px solid rgba(201,162,39,0.5)',
              background: 'rgba(201,162,39,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 20,
              animation: 'float 3s ease-in-out infinite',
              boxShadow: '0 0 40px rgba(201,162,39,0.2)'
            }}>
              <img
                src="/Millersville_Marauders_logo_svg.png"
                alt="Millersville"
                style={{ width: 56, height: 56, objectFit: 'contain' }}
              />
            </div>

            <h2 style={{ fontSize: 24, fontWeight: 700, color: '#fff', marginBottom: 8, textAlign: 'center' }}>
              Welcome Back!
            </h2>
            <div style={{ width: 30, height: 2, background: '#c9a227', borderRadius: 2, marginBottom: 16 }} />
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', textAlign: 'center', lineHeight: 1.8, maxWidth: 200 }}>
              Track student hours, manage attendance, and generate reports for the CAMP program.
            </p>

            {/* Feature pills */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 28 }}>
              {[
                ['🎓', 'Student Management'],
                ['⏱️', 'Time Tracking'],
                ['🤖', 'MoMo AI Assistant'],
              ].map(([icon, label]) => (
                <div key={label} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  background: 'rgba(201,162,39,0.08)',
                  border: '1px solid rgba(201,162,39,0.2)',
                  borderRadius: 20, padding: '6px 16px',
                  fontSize: 12, color: 'rgba(255,255,255,0.6)'
                }}>
                  <span>{icon}</span>
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Wavy SVG divider */}
          <div style={{
            width: 60,
            flexShrink: 0,
            background: 'linear-gradient(145deg, rgba(11,17,32,0.95) 0%, rgba(26,40,64,0.95) 50%, rgba(13,30,53,0.95) 100%)',
            position: 'relative'
          }}>
            <svg viewBox="0 0 60 560" preserveAspectRatio="none"
              style={{ position: 'absolute', right: 0, top: 0, height: '100%', width: '100%' }}>
              <path
                d="M0,0 C20,40 40,80 20,120 C0,160 40,200 20,240 C0,280 40,320 20,360 C0,400 40,440 20,480 C0,520 20,560 20,560 L60,560 L60,0 Z"
                fill="rgba(11,17,32,0.6)"
              />
            </svg>
          </div>

          {/* RIGHT — Form */}
          <div style={{
            flex: 1,
            padding: '48px 44px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            background: 'rgba(11,17,32,0.6)',
            backdropFilter: 'blur(20px)',
          }}>
            <h2 style={{ fontSize: 28, fontWeight: 700, color: '#fff', margin: '0 0 4px' }}>
              Hello! 👋
            </h2>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 32 }}>
              Sign in to your account
            </p>

            {/* Email */}
            <div style={{ position: 'relative', marginBottom: 16 }}>
              <span style={{
                position: 'absolute', left: 14, top: '50%',
                transform: 'translateY(-50%)', fontSize: 18
              }}>📧</span>
              <input
                className="login-input"
                type="email"
                placeholder="E-mail"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && document.getElementById('pw').focus()}
                style={{ paddingLeft: 44 }}
              />
            </div>

            {/* Password */}
            <div style={{ position: 'relative', marginBottom: 8 }}>
              <span style={{
                position: 'absolute', left: 14, top: '50%',
                transform: 'translateY(-50%)', fontSize: 18
              }}>🔒</span>
              <input
                id="pw"
                className="login-input"
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                style={{ paddingLeft: 44, paddingRight: 44 }}
              />
              <button
                className="eye-btn"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute', right: 14, top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none', border: 'none',
                  cursor: 'pointer', color: 'rgba(255,255,255,0.4)',
                  display: 'flex', alignItems: 'center',
                  padding: 0, transition: 'color 0.2s'
                }}
              >
                <EyeIcon open={showPassword} />
              </button>
            </div>

            {/* Error */}
            {error && (
              <div style={{
                fontSize: 12, color: '#ffaaaa',
                background: 'rgba(163,45,45,0.2)',
                border: '0.5px solid rgba(240,149,149,0.3)',
                borderRadius: 8, padding: '8px 12px',
                marginBottom: 12
              }}>
                ⚠️ {error}
              </div>
            )}

            {/* Sign in button */}
            <button
              className="sign-in-btn"
              onClick={handleLogin}
              disabled={loading}
              style={{ marginTop: 20, opacity: loading ? 0.7 : 1 }}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <span style={{
                    width: 16, height: 16,
                    border: '2px solid #0b1120',
                    borderTop: '2px solid transparent',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                    display: 'inline-block'
                  }}/>
                  Signing in...
                </span>
              ) : 'SIGN IN'}
            </button>

            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', textAlign: 'center', marginTop: 20 }}>
              Millersville University · CAMP Program
            </p>
          </div>

        </div>
      </div>
    </>
  );
}

export default Teacher;