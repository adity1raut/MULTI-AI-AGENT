import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useJobs } from '../hooks/useJobs'
import { useResume } from '../hooks/useResume'
import JobCard from '../components/jobs/JobCard'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { Link } from 'react-router-dom'

function Dashboard() {
  const { currentUser } = useAuth()
  const { getMatchedJobs, loading: jobsLoading } = useJobs()
  const { getResume, loading: resumeLoading } = useResume()
  const [matchedJobs, setMatchedJobs] = useState([])
  const [hasResume, setHasResume] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      if (currentUser?.role === 'applicant') {
        try {
          const jobs = await getMatchedJobs()
          setMatchedJobs(jobs.slice(0, 3))
          
          const resume = await getResume()
          setHasResume(!!resume)
        } catch (error) {
          console.error('Dashboard data fetch error:', error)
        }
      }
    }
    fetchData()
  }, [currentUser])

  if (jobsLoading || resumeLoading) return <LoadingSpinner />

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold mb-8">Welcome, {currentUser?.displayName || 'User'}!</h1>
      
      {currentUser?.role === 'applicant' && (
        <>
          {!hasResume && (
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-8">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    You haven't uploaded a resume yet. <Link to="/resume/upload" className="font-medium text-blue-700 hover:text-blue-600">Upload your resume</Link> to get matched with jobs.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <h2 className="text-xl font-semibold mb-4">Recommended Jobs For You</h2>
          {matchedJobs.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {matchedJobs.map(job => (
                <JobCard 
                  key={job.id} 
                  job={job} 
                  showMatchScore={true}
                  actionText="View Details"
                  actionLink={`/jobs/${job.id}`}
                />
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No recommended jobs found. Try updating your resume.</p>
          )}
        </>
      )}
      
      {currentUser?.role === 'requester' && (
        <>
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Link
              to="/post-job"
              className="bg-white p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow"
            >
              <h3 className="text-lg font-medium text-gray-900 mb-2">Post a New Job</h3>
              <p className="text-gray-600">Create a new job posting to find qualified candidates</p>
            </Link>
            <Link
              to="/my-jobs"
              className="bg-white p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow"
            >
              <h3 className="text-lg font-medium text-gray-900 mb-2">View My Jobs</h3>
              <p className="text-gray-600">Manage your existing job postings</p>
            </Link>
          </div>
        </>
      )}
    </div>
  )
}

export default Dashboard