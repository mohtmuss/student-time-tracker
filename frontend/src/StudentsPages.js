import { useState } from 'react';
import StudentProfile from './StudentProfile';

function StudentsPage({ students, clockedIn, refreshStudents, refreshClockedIn }) {
  const [view, setView] = useState('list');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [graduationYear, setGraduationYear] = useState('');
  const [status, setStatus] = useState('freshman');

  async function handleAddStudent() {
    const response = await fetch(`${process.env.REACT_APP_API_URL}/add-student`, {
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
      refreshStudents();
      setView('list');
    } else {
      alert('Error: ' + data.error);
    }
  }

  if (view !== 'list' && view !== 'add') {
    return (
      <StudentProfile
        student={view}
        onBack={() => setView('list')}
        refreshClockedIn={refreshClockedIn}
      />
    );
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

  const sortedStudents = [...students].sort((a, b) => {
    const aIn = clockedIn.includes(a.student_id);
    const bIn = clockedIn.includes(b.student_id);
    if (aIn && !bIn) return -1;
    if (!aIn && bIn) return 1;
    return 0;
  });

  return (
    <div>
      <div className="students-header">
        <h1>Students</h1>
        <button onClick={() => setView('add')}>+ Add Student</button>
      </div>
      {sortedStudents.map(student => (
        <div key={student.id} className="student-card" onClick={() => setView(student)}>
          <span className="green-circle" style={{
            backgroundColor: clockedIn.includes(student.student_id) ? '#2ecc71' : '#e74c3c'
          }}></span>
          <strong>{student.first_name} {student.last_name}</strong>
        </div>
      ))}
    </div>
  );
}


export default StudentsPage;