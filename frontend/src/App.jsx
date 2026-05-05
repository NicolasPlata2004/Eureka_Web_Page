import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentExam from './pages/StudentExam';
import StudentSyllabus from './pages/StudentSyllabus';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/teacher" element={<TeacherDashboard />} />
        <Route path="/exam" element={<StudentSyllabus />} />
        <Route path="/exam/play" element={<StudentExam />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
