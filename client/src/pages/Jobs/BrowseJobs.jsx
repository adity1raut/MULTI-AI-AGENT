import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useJobs } from '../../hooks/useJobs'
import JobCard from '../../components/jobs/JobCard'
import LoadingSpinner from '../../components/common/LoadingSpinner'

function BrowseJobs() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { getMatchedJobs } = useJobs()

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true)
        const matchedJobs = await getMatchedJobs()
        setJobs(matchedJobs)
      } catch (err) {
        setError(err.message || 'Failed to load jobs')
      } finally {
        setLoading(false)
      }
    }

    fetchJobs()
  }, [])

  if (loading) return <LoadingSpinner />
  if (error) return <div className="text-red-500">{error}</div>

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Jobs Matching Your Skills</h1>
        <Link 
          to="/resume/upload" 
          className="text-indigo-600 hover:text-indigo-800 font-medium"
        >
          Update Your Resume
        </Link>
      </div>
      
      {jobs.length === 0 ? (
        <div className="text-center py-12">
          <h2 className="text-xl font-medium text-gray-600">No matching jobs found</h2>
          <p className="mt-2 text-gray-500">Try updating your resume to get better matches</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {jobs.map(job => (
            <JobCard 
              key={job.id} 
              job={job} 
              showMatchScore={true}
              actionText="Apply Now"
              actionLink={`/jobs/${job.id}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default BrowseJobs