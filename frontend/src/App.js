import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ClockIn from './ClockIn';
import Teacher from './Teacher';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ClockIn />} />
        <Route path="/teacher" element={<Teacher />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;