import { useState, useEffect } from 'react';
import StudentProfile from './StudentProfile';

function StudentsPage() {
  const [view, setView] = useState('list');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [graduationYear, setGraduationYear] = useState('');
  const [status, setStatus] = useState('freshman');
  const [students, setStudents] = useState([]);
  const [clockedInIds, setClockedInIds] = useState([]);

  useEffect(() => {
    fetchStudents();
    fetchClockedIn();
  }, []);
 async function fetchClockedIn() {
  const response = await fetch('http://127.0.0.1:5000/clocked-in-students');
  const data = await response.json();
  setClockedInIds(data);
}
  async function fetchStudents() {
    const response = await fetch('http://127.0.0.1:5000/students', {
      headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
    });
    const data = await response.json();
    setStudents(data);
  }

  async function handleAddStudent() {
    const response = await fetch('http://127.0.0.1:5000/add-student', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + localStorage.getItem('token')
      },
      body: JSON.stringify({
        first_name: firstName,
        last_name: lastName,
        email: email,
        graduation_year: graduationYear,
        status: status
      })
    });
    const data = await response.json();
    if (response.ok) {
      alert('Student added! ID: ' + data.student_id);
      setFirstName('');
      setLastName('');
      setEmail('');
      setGraduationYear('');
      setStatus('freshman');
      fetchStudents();
      setView('list');
    } else {
      alert('Error: ' + data.error);
    }
  }

  if (view !== 'list' && view !== 'add') {
    return <StudentProfile student={view} onBack={() => setView('list')} />;
  }

  if (view === 'add') {
    return (
      <div>
        <button onClick={() => setView('list')}>← Back</button>
        <h1>Add New Student</h1>
        <input type="text" placeholder="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
        <input type="text" placeholder="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input type="number" placeholder="Graduation Year" value={graduationYear} onChange={(e) => setGraduationYear(e.target.value)} />
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="freshman">Freshman</option>
          <option value="sophomore">Sophomore</option>
          <option value="junior">Junior</option>
          <option value="senior">Senior</option>
          <option value="alumni">Alumni</option>
        </select>
        <button onClick={handleAddStudent}>Add Student</button>
      </div>
    );
  }

  return (
    <div>
      <div className="students-header">
        <h1>Students</h1>
        <button onClick={() => setView('add')}>+ Add Student</button>
      </div>
      {students.map(student => (
  <div key={student.id} className="student-card" onClick={() => setView(student)}>
    <span className="green-circle" style={{
      backgroundColor: clockedInIds.includes(student.student_id) ? '#2ecc71' : '#e74c3c'
    }}></span>
    <strong>{student.first_name} {student.last_name}</strong>
  </div>
))}
    </div>
  );
}

export default StudentsPage;