import { useState } from 'react';

function App() {
  const [studentId, setStudentId] = useState('');

  return (
    <div>
      <h1>Student Time Tracker</h1>

      <input
        type="text"
        placeholder="Enter Student ID"
        value={studentId}
        onChange={(e) => setStudentId(e.target.value)}
      />

      <button disabled={studentId === ''}>Clock In</button>
      <button disabled={studentId === ''}>Clock Out</button>
    </div>
  );
}

export default App;