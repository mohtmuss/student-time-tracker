import { useState } from 'react';
import StudentsPage from './StudentsPages';

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
        {activePage === 'home' && 

         <div>
    <h1>Welcome to the Dashboard!</h1>
    <div className="cards">
      <div className="card">
        <p>Total Students</p>
        <h2>0</h2>
      </div>
      <div className="card">
        <p>Clocked In Now</p>
        <h2>0</h2>
      </div>
      <div className="card">
        <p>Total Hours Today</p>
        <h2>0</h2>
      </div>
    </div>
  </div>








        }
        {activePage === 'students' && <StudentsPage />}
        {activePage === 'attendance' && <h1>Attendance</h1>}
        {activePage === 'reports' && <h1>Reports</h1>}
        {activePage === 'settings' && <h1>Settings</h1>}
      </div>
    </div>
  );
}

export default Dashboard;