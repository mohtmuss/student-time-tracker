import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, ResponsiveContainer } from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

function ReportsPage({ students, clockedIn }) {
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

  async function selectStudent(student, offset = currentWeekOffset) {
    setSelectedStudent(student);
    setSearch(`${student.first_name} ${student.last_name}`);
    setShowSuggestions(false);

    const response = await fetch(`${process.env.REACT_APP_API_URL}/student-history/${student.student_id}`);
    const data = await response.json();

    const { startOfWeek, endOfWeek } = getWeekRange(offset);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayHours = { Sunday: 0, Monday: 0, Tuesday: 0, Wednesday: 0, Thursday: 0, Friday: 0, Saturday: 0 };
    let total = 0;

    data.forEach(log => {
      if (log.clock_in && log.clock_out) {
        const clockIn = new Date(log.clock_in);
        const clockOut = new Date(log.clock_out);
        if (clockIn >= startOfWeek && clockIn <= endOfWeek) {
          const hours = (clockOut - clockIn) / 1000 / 60 / 60;
          dayHours[days[clockIn.getDay()]] += hours;
          total += hours;
        }
      }
    });

    setTotalHours(total.toFixed(2));
    setStudentHistory(days.map(day => ({ day, hours: parseFloat(dayHours[day].toFixed(2)) })));

    const progressResponse = await fetch(`${process.env.REACT_APP_API_URL}/student-weekly-progress/${student.student_id}`);
    setWeeklyProgress(await progressResponse.json());
  }

  async function downloadPDF() {
    const element = document.getElementById('report-content');
    const canvas = await html2canvas(element, { backgroundColor: 'var(--bg-primary)' });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const width = pdf.internal.pageSize.getWidth();
    pdf.addImage(imgData, 'PNG', 0, 0, width, (canvas.height * width) / canvas.width);
    pdf.save(`${selectedStudent.first_name}_${selectedStudent.last_name}_${reportType}_report.pdf`);
  }

  const suggestions = students.filter(s =>
    `${s.first_name} ${s.last_name}`.toLowerCase().includes(search.toLowerCase()) && search.length > 0
  );

  const btnStyle = (active) => ({
    padding: '8px 16px', borderRadius: '8px', border: 'none',
    cursor: 'pointer', color: 'white',
    backgroundColor: active ? '#5865F2' : 'var(--bg-secondary)',
    outline: active ? 'none' : '1px solid var(--border-subtle)'
  });

  return (
    <div className="attendance">

      {/* Search + Download */}
      <div className="att-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '20px' }}>
          <div style={{ flex: 1 }}>
            <h2 style={{ marginBottom: '16px' }}>Student Report</h2>
            <div className="search-wrapper">
              <input
                type="text"
                placeholder="Search student..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setShowSuggestions(true); setSelectedStudent(null); }}
                className="att-search"
              />
              {showSuggestions && suggestions.length > 0 && (
                <div className="suggestions">
                  {suggestions.map(student => (
                    <div key={student.student_id} className="suggestion-item" onClick={() => selectStudent(student)}>
                      <span className="green-circle" style={{
                        backgroundColor: clockedIn.includes(student.student_id) ? '#2ecc71' : '#e74c3c'
                      }}></span>
                      {student.first_name} {student.last_name} — {student.student_id}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {selectedStudent && (
              <div style={{ marginTop: '16px', display: 'flex', gap: '10px' }}>
                <button onClick={() => setReportType('weekly')} style={btnStyle(reportType === 'weekly')}>📅 Weekly</button>
                <button onClick={() => setReportType('monthly')} style={btnStyle(reportType === 'monthly')}>📆 Monthly</button>
                <button onClick={() => setReportType('semester')} style={btnStyle(reportType === 'semester')}>🎓 Semester</button>
              </div>
            )}
          </div>

          {selectedStudent && (
            <div style={{ textAlign: 'right' }}>
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
          <h2>{selectedStudent.first_name} {selectedStudent.last_name} — {reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report</h2>
          <p style={{ color: 'var(--text-muted)' }}>
            ID: {selectedStudent.student_id} | Status: {selectedStudent.status} | Graduation: {selectedStudent.graduation_year}
          </p>
          <p style={{ color: '#5865F2', fontWeight: 'bold', marginTop: '8px' }}>
            Total Hours This Period: {totalHours} hrs
          </p>

          {/* Week Navigation */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '20px 0' }}>
            <button
              onClick={() => { const n = currentWeekOffset - 1; setCurrentWeekOffset(n); selectStudent(selectedStudent, n); }}
              style={{ background: '#5865F2', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}>
              ← Prev
            </button>
            <span style={{ color: 'var(--text-primary)', fontSize: '14px' }}>📅 {formatWeekLabel(currentWeekOffset)}</span>
            <button
              onClick={() => { const n = currentWeekOffset + 1; setCurrentWeekOffset(n); selectStudent(selectedStudent, n); }}
              disabled={currentWeekOffset === 0}
              style={{ background: currentWeekOffset === 0 ? 'var(--bg-secondary)' : '#5865F2', color: currentWeekOffset === 0 ? 'var(--text-muted)' : 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: currentWeekOffset === 0 ? 'not-allowed' : 'pointer', fontSize: '14px' }}>
              Next →
            </button>
          </div>

          {/* Bar Chart */}
          <h3 style={{ color: 'var(--text-primary)', marginTop: '20px' }}>📊 Hours by Day of Week</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={studentHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
              <XAxis dataKey="day" stroke="var(--chart-axis)" />
              <YAxis stroke="var(--chart-axis)" />
              <Tooltip contentStyle={{ backgroundColor: 'var(--tooltip-bg)', border: 'none', color: 'var(--tooltip-color)' }} />
              <Legend />
              <Bar dataKey="hours" fill="#5865F2" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>

          {/* Line Chart */}
          {(reportType === 'monthly' || reportType === 'semester') && weeklyProgress.length > 0 && (
            <div>
              <h3 style={{ color: 'var(--text-primary)', marginTop: '20px' }}>📈 Weekly Growth Progress</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={weeklyProgress}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                  <XAxis dataKey="week" stroke="var(--chart-axis)" />
                  <YAxis stroke="var(--chart-axis)" />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--tooltip-bg)', border: 'none', color: 'var(--tooltip-color)' }} />
                  <Legend />
                  <Line type="monotone" dataKey="hours" stroke="#2ecc71" strokeWidth={3} dot={{ fill: '#2ecc71', r: 5 }} />
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