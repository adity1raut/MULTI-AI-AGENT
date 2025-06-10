import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import Profile from './pages/Profile';
import ProtectedRoute from './components/ProtectedRoute';
import Landing from './pages/LandingPage';
import SignUp from './pages/SignUp';
import ApplicantDashboard from './pages/Dashboard/ApplicantDashboard';
import JobPostingForm from './pages/Recruiter/JobPostingFrom';
import ViewJobApplications from './pages/Recruiter/ViewJobApplications';

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path='/signup' element={<SignUp />} />
          <Route path='/home' element={<Landing />} />
          <Route path='/applicant-dashboard' element={<ApplicantDashboard />} />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/post-job"
            element={
              <ProtectedRoute >
                <JobPostingForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-jobs"
            element={
              <ProtectedRoute >
                <ViewJobApplications />
              </ProtectedRoute>
            }
          />

          <Route path="/" element={<Navigate to="/profile" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;