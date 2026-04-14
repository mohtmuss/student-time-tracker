import { useState } from 'react';

function App() {
  const [studentId, setStudentId] = useState('');
  const [message, setMessage] = useState('');

  function handleClockIn(){
  setMessage('✅ Clocked in: ' + studentId )
  setTimeout(() => {
    setStudentId('');
    setMessage('');

  }, 3000)
}

function handleClockOut(){
  setMessage('🔴 Clocked out: ' + studentId);
  setTimeout(()=>{
    setStudentId('');
    setMessage('');
  } , 3000)
}



  return (
    <div>
      <h1>Student Time Tracker</h1>

      <input
        type="text"
        placeholder="Enter Student ID"
        value={studentId}
        onChange={(e) => setStudentId(e.target.value)}
      />

      <button disabled={studentId === ''} onClick={handleClockIn}>Clock In</button>
      <button disabled={studentId === ''} onClick={handleClockOut}>Clock Out</button>
      <p>{message}</p>
    </div>
  );
}



export default App;