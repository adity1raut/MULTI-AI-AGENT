import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ApplicantDashboard from './pages/ApplicantDashboard';
import RequesterDashboard from './pages/RequesterDashboard';
import JobBoard from './pages/JobBoard';
import ProfilePage from './pages/ProfilePage';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/Auth/ProtectedRoute';

function App() {
  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            
            {/* Protected routes */}
            <Route element={<ProtectedRoute role="applicant" />}>
              <Route path="/applicant" element={<ApplicantDashboard />} />
            </Route>
            
            <Route element={<ProtectedRoute role="requester" />}>
              <Route path="/requester" element={<RequesterDashboard />} />
            </Route>
            
            <Route path="/jobs" element={<JobBoard />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;