import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, ResponsiveContainer } from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

function ReportsPage() {
  const [students, setStudents] = useState([]);
  const [clockedIn, setClockedIn] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentHistory, setStudentHistory] = useState([]);
  const [weeklyProgress, setWeeklyProgress] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [totalHours, setTotalHours] = useState(0);
  const [reportType, setReportType] = useState('weekly');
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);

  function getWeekRange(offset) {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() + (offset * 7));
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    return { startOfWeek, endOfWeek };
  }

  function formatWeekLabel(offset) {
    const { startOfWeek, endOfWeek } = getWeekRange(offset);
    const options = { month: 'short', day: 'numeric' };
    return `${startOfWeek.toLocaleDateString('en-US', options)} - ${endOfWeek.toLocaleDateString('en-US', options)}`;
  }

  useEffect(() => {
    fetchStudents();
    fetchClockedIn();
  }, []);

  async function fetchStudents() {
    const response = await fetch('http://127.0.0.1:5000/students', {
      headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
    });
    const data = await response.json();
    setStudents(data);
  }

  async function fetchClockedIn() {
    const response = await fetch('http://127.0.0.1:5000/clocked-in-students');
    const data = await response.json();
    setClockedIn(data);
  }

  async function selectStudent(student, offset = currentWeekOffset) {
    setSelectedStudent(student);
    setSearch(`${student.first_name} ${student.last_name}`);
    setShowSuggestions(false);

    const response = await fetch(`http://127.0.0.1:5000/student-history/${student.student_id}`);
    const data = await response.json();

    const { startOfWeek, endOfWeek } = getWeekRange(offset);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayHours = {Sunday: 0, Monday: 0, Tuesday: 0, Wednesday: 0, Thursday: 0, Friday: 0, Saturday: 0};
    let total = 0;

    data.forEach(log => {
      if (log.clock_in && log.clock_out) {
        const clockIn = new Date(log.clock_in);
        const clockOut = new Date(log.clock_out);
        if (clockIn >= startOfWeek && clockIn <= endOfWeek) {
          const hours = (clockOut - clockIn) / 1000 / 60 / 60;
          const day = days[clockIn.getDay()];
          dayHours[day] += hours;
          total += hours;
        }
      }
    });

    setTotalHours(total.toFixed(2));
    setStudentHistory(days.map(day => ({
      day,
      hours: parseFloat(dayHours[day].toFixed(2))
    })));

    const progressResponse = await fetch(`http://127.0.0.1:5000/student-weekly-progress/${student.student_id}`);
    const progressData = await progressResponse.json();
    setWeeklyProgress(progressData);
  }

  async function downloadPDF() {
    const element = document.getElementById('report-content');
    const canvas = await html2canvas(element, {backgroundColor: '#0d0d1a'});
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const width = pdf.internal.pageSize.getWidth();
    const height = (canvas.height * width) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, width, height);
    pdf.save(`${selectedStudent.first_name}_${selectedStudent.last_name}_${reportType}_report.pdf`);
  }

  const suggestions = students.filter(s =>
    `${s.first_name} ${s.last_name}`.toLowerCase().includes(search.toLowerCase()) &&
    search.length > 0
  );

  return (
    <div className="attendance">

      {/* Search + Download */}
      <div className="att-section">
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '20px'}}>

          {/* Left — Search */}
          <div style={{flex: 1}}>
            <h2 style={{color: 'white', marginBottom: '16px'}}>Student Report</h2>
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

            {/* Report Type */}
            {selectedStudent && (
              <div style={{marginTop: '16px', display: 'flex', gap: '10px'}}>
                <button onClick={() => setReportType('weekly')} style={{padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', backgroundColor: reportType === 'weekly' ? '#5865F2' : '#1e1e3a', color: 'white'}}>
                  📅 Weekly
                </button>
                <button onClick={() => setReportType('monthly')} style={{padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', backgroundColor: reportType === 'monthly' ? '#5865F2' : '#1e1e3a', color: 'white'}}>
                  📆 Monthly
                </button>
                <button onClick={() => setReportType('semester')} style={{padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', backgroundColor: reportType === 'semester' ? '#5865F2' : '#1e1e3a', color: 'white'}}>
                  🎓 Semester
                </button>
              </div>
            )}
          </div>

          {/* Right — Download */}
          {selectedStudent && (
            <div style={{textAlign: 'right'}}>
              <button onClick={downloadPDF} className="download-btn">
                📄 Download {reportType} PDF
              </button>
            </div>
          )}

        </div>
      </div>

      {/* Report Content */}
      {selectedStudent && (
        <div id="report-content" className="att-section">
          <h2 style={{color: 'white'}}>
            {selectedStudent.first_name} {selectedStudent.last_name} — {reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report
          </h2>
          <p style={{color: '#aaa'}}>
            ID: {selectedStudent.student_id} | Status: {selectedStudent.status} | Graduation: {selectedStudent.graduation_year}
          </p>
          <p style={{color: '#5865F2', fontWeight: 'bold', marginTop: '8px'}}>
            Total Hours This Period: {totalHours} hrs
          </p>

          {/* Week Navigation */}
            {/* Week Navigation */}
<div style={{display: 'flex', alignItems: 'center', gap: '12px', margin: '20px 0'}}>
  <button
    onClick={() => {
      const newOffset = currentWeekOffset - 1;
      setCurrentWeekOffset(newOffset);
      selectStudent(selectedStudent, newOffset);
    }}
    style={{
      background: '#5865F2',
      color: 'white',
      border: 'none',
      padding: '6px 12px',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '14px'
    }}>
    ← Prev
  </button>

  <span style={{color: 'white', fontSize: '14px'}}>
    📅 {formatWeekLabel(currentWeekOffset)}
  </span>

  <button
    onClick={() => {
      const newOffset = currentWeekOffset + 1;
      setCurrentWeekOffset(newOffset);
      selectStudent(selectedStudent, newOffset);
    }}
    disabled={currentWeekOffset === 0}
    style={{
      background: currentWeekOffset === 0 ? '#333' : '#5865F2',
      color: 'white',
      border: 'none',
      padding: '6px 12px',
      borderRadius: '6px',
      cursor: currentWeekOffset === 0 ? 'not-allowed' : 'pointer',
      fontSize: '14px'
    }}>
    Next →
  </button>
</div> 
         
          {/* Bar Chart */}
          <h3 style={{color: 'white', marginTop: '20px'}}>📊 Hours by Day of Week</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={studentHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="day" stroke="#aaa" />
              <YAxis stroke="#aaa" />
              <Tooltip contentStyle={{backgroundColor: '#1e1e3a', border: 'none', color: 'white'}} />
              <Legend />
              <Bar dataKey="hours" fill="#5865F2" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>

          {/* Line Chart */}
          {(reportType === 'monthly' || reportType === 'semester') && weeklyProgress.length > 0 && (
            <div>
              <h3 style={{color: 'white', marginTop: '20px'}}>📈 Weekly Growth Progress</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={weeklyProgress}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="week" stroke="#aaa" />
                  <YAxis stroke="#aaa" />
                  <Tooltip contentStyle={{backgroundColor: '#1e1e3a', border: 'none', color: 'white'}} />
                  <Legend />
                  <Line type="monotone" dataKey="hours" stroke="#2ecc71" strokeWidth={3} dot={{fill: '#2ecc71', r: 5}} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

        </div>
      )}

    </div>
  );
}

export default ReportsPage;