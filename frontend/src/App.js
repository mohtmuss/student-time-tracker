import { useState } from "react";

function App() {
  const [code, setCode] = useState("");
  const [verified, setVerified] = useState(false);
  const [studentName, setStudentName] = useState("");
  const [message, setMessage] = useState("");

  // VERIFY CODE
  const verifyCode = () => {
    fetch("http://127.0.0.1:5000/verify-code", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ code: code })
    })
    .then(res => res.json())
    .then(data => {
      if (data.name) {
        setVerified(true);
        setStudentName(data.name);
        setMessage("");
      } else {
        setMessage("Invalid code");
        setVerified(false);
      }
    });
  };

  // CLOCK IN
  const clockIn = () => {
    fetch("http://127.0.0.1:5000/clock-in", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ code: code })
    })
    .then(res => res.json())
    .then(data => setMessage(data.message));
  };

  // CLOCK OUT
  const clockOut = () => {
    fetch("http://127.0.0.1:5000/clock-out", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ code: code })
    })
    .then(res => res.json())
    .then(data => setMessage(data.message));
  };

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>

      <h1>Student Clock System</h1>

      {!verified && (
        <>
          <input
            placeholder="Enter your code (MM26)"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <br /><br />

          <button onClick={verifyCode}>Verify Code</button>

          <p style={{ color: "red" }}>{message}</p>
        </>
      )}

      {verified && (
        <>
          <h2>Welcome, {studentName}</h2>

          <button onClick={clockIn}>Clock In</button>
          <br /><br />

          <button onClick={clockOut}>Clock Out</button>

          <p>{message}</p>
        </>
      )}

    </div>
  );
}

export default App;