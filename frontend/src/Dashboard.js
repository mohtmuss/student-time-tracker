import '/App.css'
import { useState, useEffect } from 'react';
import StudentsPage from './StudentsPages';
import ChatBot from './ChatBot';
import AttendancePage from './AttendancePage';
import ReportsPage from './Reportspage';
import SettingsPage from './SettingsPage';

function Dashboard() {
  const [activePage, setActivePage] = useState('home');
  const [teacherEmail, setTeacherEmail] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/teacher';
      return;
    }
    const payload = JSON.parse(atob(token.split('.')[1]));
    setTeacherEmail(payload.sub || '');
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem('token');
    window.location.href = '/teacher';
  };

  const navItems = [
    {
      label: 'Home', page: 'home',
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
    },
    {
      label: 'Students', page: 'students',
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
    },
    {
      label: 'Attendance', page: 'attendance',
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
    },
    {
      label: 'Reports', page: 'reports',
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
    },
    {
      label: 'Settings', page: 'settings',
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 1.41 13.44M4.93 4.93a10 10 0 0 0-1.41 13.44"/></svg>
    },
  ];

  return (
    <div className="dashboard">
      <div className="sidebar">

        {/* Logo & Email */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '24px 16px 16px',
          borderBottom: '0.5px solid rgba(255,255,255,0.08)',
          marginBottom: '8px'
        }}>
          <img
            src="/Millersville_Marauders_logo_svg.png"
            alt="Millersville Marauders"
            style={{
              width: '80px',
              height: '80px',
              objectFit: 'contain',
              marginBottom: '12px'
            }}
          />
          <span style={{
            color: '#c9a227',
            fontSize: '11px',
            fontWeight: '600',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            marginBottom: '4px'
          }}>
            Millersville
          </span>
          <span style={{
            color: 'rgba(255,255,255,0.4)',
            fontSize: '11px',
            textAlign: 'center',
            wordBreak: 'break-all',
            padding: '0 8px'
          }}>
            {teacherEmail}
          </span>
        </div>

        {/* Nav */}
        <div style={{ padding: '8px 12px', flex: 1 }}>
          <p style={{
            fontSize: '10px',
            fontWeight: '600',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.2)',
            padding: '8px 8px 6px'
          }}>
            Main menu
          </p>

          {navItems.map(item => (
            <button
              key={item.page}
              onClick={() => setActivePage(item.page)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                width: '100%',
                padding: '10px 12px',
                marginBottom: '16px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: activePage === item.page ? '500' : '400',
                background: activePage === item.page ? 'rgba(201,162,39,0.12)' : 'transparent',
                color: activePage === item.page ? '#c9a227' : 'rgba(255,255,255,0.45)',
                textAlign: 'left',
                transition: 'background 0.12s, color 0.12s'
              }}
              onMouseEnter={e => {
                if (activePage !== item.page) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                  e.currentTarget.style.color = 'rgba(255,255,255,0.8)';
                }
              }}
              onMouseLeave={e => {
                if (activePage !== item.page) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'rgba(255,255,255,0.45)';
                }
              }}
            >
              {item.icon}
              {item.label}
              {activePage === item.page && (
                <span style={{
                  marginLeft: 'auto',
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: '#c9a227'
                }} />
              )}
            </button>
          ))}
        </div>

        {/* Sign Out */}
        <div style={{
          padding: '16px 12px',
          borderTop: '0.5px solid rgba(255,255,255,0.08)'
        }}>
          <button
            onClick={handleSignOut}
            style={{
              width: '100%',
              padding: '12px 16px',
              marginBottom: '24px',
              background: 'transparent',
              border: '1px solid rgba(226,75,74,0.4)',
              borderRadius: '8px',
              color: '#e24b4a',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'background 0.12s'
              
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(226,75,74,0.1)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Sign out
          </button>
        </div>

      </div>

      <div className="content">
        {activePage === 'home' && <ChatBot />}
        {activePage === 'students' && <StudentsPage />}
        {activePage === 'attendance' && <AttendancePage />}
        {activePage === 'reports' && <ReportsPage />}
        {activePage === 'settings' && <SettingsPage />}
      </div>
    </div>
  );
}

export default Dashboard;
