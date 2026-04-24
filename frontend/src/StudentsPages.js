import { useState } from 'react';
import StudentProfile from './StudentProfile';

const GROUPS = ['all', 'freshman', 'sophomore', 'junior', 'senior', 'alumni'];

const GROUP_LABELS = {
  all: '👥 All Students',
  freshman: '🎒 Freshman',
  sophomore: '📚 Sophomore',
  junior: '🎓 Junior',
  senior: '🏆 Senior',
  alumni: '🎉 Alumni'
};

// Shows "Mohamed I. Mussa" if middle name exists, otherwise "Mohamed Mussa"
function getDisplayName(student) {
  if (student.middle_name) {
    return `${student.first_name} ${student.middle_name[0].toUpperCase()}. ${student.last_name}`;
  }
  return `${student.first_name} ${student.last_name}`;
}

function StudentsPage({ students, clockedIn, refreshStudents, refreshClockedIn }) {
  const [view, setView] = useState('list');
  const [showModal, setShowModal] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [showMiddleName, setShowMiddleName] = useState(false);
  const [email, setEmail] = useState('');
  const [graduationYear, setGraduationYear] = useState('');
  const [groupIndex, setGroupIndex] = useState(0);
  const [modalMessage, setModalMessage] = useState('');

  function openModal() {
    setFirstName('');
    setLastName('');
    setMiddleName('');
    setEmail('');
    setGraduationYear('');
    setModalMessage('');
    setShowMiddleName(false);
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setModalMessage('');
    setShowMiddleName(false);
    setMiddleName('');
  }

  async function handleAddStudent() {
    if (!firstName || !lastName || !email || !graduationYear) {
      setModalMessage('❌ Please fill in all fields');
      return;
    }

    if (showMiddleName && !middleName.trim()) {
      setModalMessage('❌ Please provide a middle name to distinguish this student');
      return;
    }

    const response = await fetch(`${process.env.REACT_APP_API_URL}/add-student`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + localStorage.getItem('token')
      },
      body: JSON.stringify({
        first_name: firstName,
        last_name: lastName,
        middle_name: middleName.trim() || null,
        email: email,
        graduation_year: graduationYear
      })
    });

    const data = await response.json();

    // Duplicate name — ask for middle name
    if (response.status === 409) {
      setShowMiddleName(true);
      setModalMessage(`⚠️ ${data.message}`);
      return;
    }

    if (response.ok) {
      setModalMessage(`✅ Student added! ID: ${data.student_id}`);
      refreshStudents();
      setTimeout(() => closeModal(), 1500);
    } else {
      setModalMessage('❌ ' + data.error);
    }
  }

  if (view !== 'list') {
    return (
      <StudentProfile
        student={view}
        onBack={() => setView('list')}
        refreshClockedIn={refreshClockedIn}
      />
    );
  }

  const sortedStudents = [...students].sort((a, b) => {
    const aIn = clockedIn.includes(a.student_id);
    const bIn = clockedIn.includes(b.student_id);
    if (aIn && !bIn) return -1;
    if (!aIn && bIn) return 1;
    return 0;
  });

  const currentGroup = GROUPS[groupIndex];
  const filteredStudents = currentGroup === 'all'
    ? sortedStudents
    : sortedStudents.filter(s => s.status === currentGroup);

  const inputStyle = {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid var(--border-subtle)',
    background: 'var(--bg-input)',
    color: 'var(--text-primary)',
    fontSize: '14px',
    boxSizing: 'border-box',
    marginBottom: '0'
  };

  return (
    <div>

      {/* Modal Overlay */}
      {showModal && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
          style={{
            position: 'fixed', inset: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 9999
          }}
        >
          <div style={{
            background: 'var(--bg-secondary)',
            borderRadius: '16px',
            padding: '32px',
            width: '480px',
            maxWidth: '90vw',
            boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '20px' }}>
                ➕ Add New Student
              </h2>
              <button onClick={closeModal} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: '20px', color: 'var(--text-muted)', padding: '4px'
              }}>✕</button>
            </div>

            {/* Info note */}
            <p style={{
              margin: 0, fontSize: '13px',
              color: 'var(--text-muted)',
              background: 'var(--bg-primary)',
              padding: '10px 14px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)'
            }}>
              ℹ️ Status is automatically determined from the graduation year.
            </p>

            {/* First + Last Name */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>
                  First Name *
                </label>
                <input
                  type="text"
                  placeholder="First name..."
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>
                  Last Name *
                </label>
                <input
                  type="text"
                  placeholder="Last name..."
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Middle Name — only appears when duplicate detected */}
            {showMiddleName && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', color: '#c9a227', fontWeight: '600' }}>
                  ⚠️ Middle Name (needed to distinguish)
                </label>
                <input
                  type="text"
                  placeholder={`e.g. Ibrahim → ${firstName} I. ${lastName}`}
                  value={middleName}
                  onChange={(e) => setMiddleName(e.target.value)}
                  autoFocus
                  style={{
                    ...inputStyle,
                    border: '1px solid #c9a227',
                  }}
                />
              </div>
            )}

            {/* Email */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>
                Email *
              </label>
              <input
                type="email"
                placeholder="student@millersville.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={inputStyle}
              />
            </div>

            {/* Graduation Year */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>
                Graduation Year *
              </label>
              <input
                type="number"
                placeholder="e.g. 2027"
                value={graduationYear}
                onChange={(e) => setGraduationYear(e.target.value)}
                style={inputStyle}
              />
            </div>

            {/* Message */}
            {modalMessage && (
              <p style={{
                margin: 0, fontSize: '14px', fontWeight: '500',
                color: modalMessage.startsWith('✅') ? '#2ecc71' :
                       modalMessage.startsWith('⚠️') ? '#c9a227' : '#e74c3c'
              }}>
                {modalMessage}
              </p>
            )}

            {/* Buttons */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
              <button onClick={closeModal} style={{
                flex: 1, padding: '12px', borderRadius: '8px',
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                cursor: 'pointer', fontWeight: '600', fontSize: '14px'
              }}>
                Cancel
              </button>
              <button onClick={handleAddStudent} style={{
                flex: 2, padding: '12px', borderRadius: '8px',
                border: 'none', background: '#c9a227',
                color: 'black', cursor: 'pointer',
                fontWeight: '700', fontSize: '14px'
              }}>
                {showMiddleName ? 'Add with Middle Name' : 'Add Student'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="students-header">
        <h1 style={{ color: 'var(--text-primary)' }}>Students</h1>
        <button onClick={openModal} style={{
          backgroundColor: '#c9a227', color: 'black',
          border: 'none', borderRadius: '8px',
          padding: '10px 20px', cursor: 'pointer',
          fontWeight: '700', fontSize: '14px'
        }}>
          + Add Student
        </button>
      </div>

      {/* Group Slider */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        margin: '16px 0', padding: '12px 20px',
        background: 'var(--bg-secondary)', borderRadius: '12px',
        border: '1px solid var(--border-color)'
      }}>
        <button
          onClick={() => setGroupIndex(i => (i - 1 + GROUPS.length) % GROUPS.length)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: '20px', color: 'var(--text-primary)',
            padding: '4px 12px', borderRadius: '6px'
          }}>←</button>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>
            {GROUP_LABELS[currentGroup]}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
            {filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''}
          </div>
        </div>

        <button
          onClick={() => setGroupIndex(i => (i + 1) % GROUPS.length)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: '20px', color: 'var(--text-primary)',
            padding: '4px 12px', borderRadius: '6px'
          }}>→</button>
      </div>

      {/* Dot Indicators */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginBottom: '16px' }}>
        {GROUPS.map((_, i) => (
          <div key={i} onClick={() => setGroupIndex(i)} style={{
            width: i === groupIndex ? '20px' : '6px',
            height: '6px', borderRadius: '3px',
            backgroundColor: i === groupIndex ? '#c9a227' : 'var(--border-subtle)',
            cursor: 'pointer', transition: 'all 0.2s'
          }} />
        ))}
      </div>

      {/* Student List */}
      {filteredStudents.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontSize: '14px' }}>
          No {currentGroup === 'all' ? '' : currentGroup} students found
        </div>
      ) : (
        filteredStudents.map(student => (
          <div key={student.id} className="student-card" onClick={() => setView(student)}>
            <span className="green-circle" style={{
              backgroundColor: clockedIn.includes(student.student_id) ? '#2ecc71' : '#e74c3c'
            }}></span>
            <strong>{getDisplayName(student)}</strong>
            <span style={{
              marginLeft: 'auto', fontSize: '11px',
              color: 'var(--text-muted)', textTransform: 'capitalize'
            }}>
              {student.status}
            </span>
          </div>
        ))
      )}
    </div>
  );
}

export default StudentsPage;