import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function AttendancePage({ students, clockedIn }) {
  const [search, setSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentHistory, setStudentHistory] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  async function selectStudent(student) {
    setSelectedStudent(student);
    setSearch(`${student.first_name} ${student.last_name}`);
    setShowSuggestions(false);

    const response = await fetch(`${process.env.REACT_APP_API_URL}/student-history/${student.student_id}`);
    const data = await response.json();

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayHours = {Sunday: 0, Monday: 0, Tuesday: 0, Wednesday: 0, Thursday: 0, Friday: 0, Saturday: 0};

    data.forEach(log => {
      if (log.clock_in && log.clock_out) {
        const clockIn = new Date(log.clock_in);
        const clockOut = new Date(log.clock_out);
        const hours = (clockOut - clockIn) / 1000 / 60 / 60;
        const day = days[clockIn.getDay()];
        dayHours[day] += hours;
      }
    });

    const chartData = days.map(day => ({
      day,
      hours: parseFloat(dayHours[day].toFixed(2))
    }));

    setStudentHistory(chartData);
  }

  const suggestions = students.filter(s =>
    `${s.first_name} ${s.last_name}`.toLowerCase().includes(search.toLowerCase()) &&
    search.length > 0
  );

  const totalStudents = students.length;
  const clockedInCount = clockedIn.length;
  const clockedOutCount = totalStudents - clockedInCount;

  return (
    <div className="attendance">
      {/* Summary Cards */}
      <div className="attendance-cards">
        <div className="att-card purple">
          <p>Total Students</p>
          <h2>{totalStudents}</h2>
        </div>
        <div className="att-card green">
          <p>Clocked In Now</p>
          <h2>{clockedInCount}</h2>
        </div>
        <div className="att-card red">
          <p>Clocked Out</p>
          <h2>{clockedOutCount}</h2>
        </div>
      </div>

      {/* Search */}
      <div className="att-section">
        <h2>Student Report</h2>
        <div className="search-wrapper">
          <input
            type="text"
            placeholder="Search student..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setShowSuggestions(true);
              setSelectedStudent(null);
            }}
            className="att-search"
          />
          {showSuggestions && suggestions.length > 0 && (
            <div className="suggestions">
              {suggestions.map(student => (
                <div
                  key={student.student_id}
                  className="suggestion-item"
                  onClick={() => selectStudent(student)}
                >
                  <span className="green-circle" style={{
                    backgroundColor: clockedIn.includes(student.student_id) ? '#2ecc71' : '#e74c3c'
                  }}></span>
                  {student.first_name} {student.last_name} — {student.student_id}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Student Graph */}
        {selectedStudent && (
          <div>
            <h3 style={{color: 'white', marginTop: '20px'}}>
              {selectedStudent.first_name} {selectedStudent.last_name} — Hours by Day
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={studentHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="day" stroke="#aaa" />
                <YAxis stroke="#aaa" />
                <Tooltip contentStyle={{backgroundColor: '#1e1e3a', border: 'none', color: 'white'}} />
                <Legend />
                <Bar dataKey="hours" fill="#5865F2" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}

export default AttendancePage;