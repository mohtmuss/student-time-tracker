import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ClockIn from './ClockIn';
import Teacher from './Teacher';
import Dashboard from './Dashboard';



function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ClockIn />} />
        <Route path="/teacher" element={<Teacher />} />
       <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;