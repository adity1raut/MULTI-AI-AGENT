import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useJobs } from '../../hooks/useJobs'
import { useApplications } from '../../hooks/useApplications'
import { useAuth } from '../../contexts/AuthContext'
import LoadingSpinner from '../../components/common/LoadingSpinner'

function ViewJob() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [job, setJob] = useState(null)
  const [hasApplied, setHasApplied] = useState(false)
  const { getJobDetails } = useJobs()
  const { applyToJob, loading: applicationLoading } = useApplications()
  const { currentUser } = useAuth()

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const data = await getJobDetails(id)
        setJob(data)
        // Check if user has already applied
        if (currentUser?.role === 'applicant' && data.applicants) {
          const applied = data.applicants.some(app => app.applicant_id === currentUser.uid)
          setHasApplied(applied)
        }
      } catch (err) {
        console.error(err)
      }
    }
    fetchJob()
  }, [id, currentUser])

  const handleApply = async () => {
    try {
      await applyToJob(id)
      setHasApplied(true)
      navigate('/applications')
    } catch (err) {
      console.error('Application error:', err)
    }
  }

  if (!job) return <LoadingSpinner />

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
              <p className="mt-1 text-lg text-gray-600">{job.company} • {job.location}</p>
            </div>
            {currentUser?.role === 'requester' && (
              <button
                onClick={() => navigate(`/my-jobs/${id}/applicants`)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
              >
                View Applicants
              </button>
            )}
          </div>
        </div>
        
        <div className="px-4 py-5 sm:p-6">
          <div className="prose prose-indigo max-w-none">
            <h2>Job Description</h2>
            {job.enhanced_description.split('\n').map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
            
            {job.key_requirements?.length > 0 && (
              <>
                <h2>Key Requirements</h2>
                <ul>
                  {job.key_requirements.map((req, i) => (
                    <li key={i}>{req}</li>
                  ))}
                </ul>
              </>
            )}
            
            {job.key_responsibilities?.length > 0 && (
              <>
                <h2>Key Responsibilities</h2>
                <ul>
                  {job.key_responsibilities.map((resp, i) => (
                    <li key={i}>{resp}</li>
                  ))}
                </ul>
              </>
            )}
          </div>
          
          {currentUser?.role === 'applicant' && (
            <div className="mt-8">
              <button
                onClick={handleApply}
                disabled={hasApplied || applicationLoading}
                className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${hasApplied ? 'bg-green-600' : 'bg-indigo-600 hover:bg-indigo-700'} ${applicationLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {hasApplied ? 'Already Applied' : 'Apply Now'}
                {applicationLoading && (
                  <svg className="animate-spin -mr-1 ml-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ViewJob