import { useState } from 'react';
import StudentsPage from './StudentsPages';
import ChatBot from './ChatBot';
import AttendancePage from './AttendancePage';
import ReportsPage from './Reportspage';
function Dashboard() {
  const [activePage, setActivePage] = useState('home');

  return (
    <div className="dashboard">
      <div className="sidebar">
        <h2>Menu</h2>
        <button onClick={() => setActivePage('home')}>🏠 Home</button>
        <button onClick={() => setActivePage('students')}>👥 Students</button>
        <button onClick={() => setActivePage('attendance')}>⏱️ Attendance</button>
        <button onClick={() => setActivePage('reports')}>📊 Reports</button>
        <button onClick={() => setActivePage('settings')}>⚙️ Settings</button>
      </div>

      <div className="content">
        {activePage === 'home' && <ChatBot />}
        {activePage === 'students' && <StudentsPage />}
        {activePage === 'attendance' && <AttendancePage />}
        {activePage === 'reports' && <ReportsPage />}
        {activePage === 'settings' && <h1>Settings</h1>}
      </div>
    </div>
  );
}

export default Dashboard;