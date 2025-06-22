import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
import BrowseJobs from './pages/Jobs/BrowseJobs'
import MyJobs from './pages/Jobs/MyJobs'
import PostJob from './pages/Jobs/PostJob'
import ViewJob from './pages/Jobs/ViewJob'
import MyApplications from './pages/Applications/MyApplications'
import ViewApplicants from './pages/Applications/ViewApplicants'
import UploadResume from './pages/Resume/UploadResume'
import ViewResume from './pages/Resume/ViewResume'
import ProtectedRoute from './components/common/ProtectedRoute'
import Header from './components/common/Header'
import Footer from './components/common/Footer'
import Login from './components/auth/Login'
import Signup from './components/auth/Signup'

function App() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          
          <Route element={<ProtectedRoute allowedRoles={['applicant', 'requester']} />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
          
          <Route element={<ProtectedRoute allowedRoles={['applicant']} />}>
            <Route path="/jobs" element={<BrowseJobs />} />
            <Route path="/jobs/:id" element={<ViewJob />} />
            <Route path="/applications" element={<MyApplications />} />
            <Route path="/resume/upload" element={<UploadResume />} />
            <Route path="/resume" element={<ViewResume />} />
          </Route>
          
          <Route element={<ProtectedRoute allowedRoles={['requester']} />}>
            <Route path="/my-jobs" element={<MyJobs />} />
            <Route path="/post-job" element={<PostJob />} />
            <Route path="/my-jobs/:id" element={<ViewJob />} />
            <Route path="/my-jobs/:id/applicants" element={<ViewApplicants />} />
          </Route>
        </Routes>
      </main>
      <Footer />
    </div>
  )
}

export default App