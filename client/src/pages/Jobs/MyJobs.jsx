import { useEffect, useState } from 'react'
import { useJobs } from '../../hooks/useJobs'
import JobList from '../../components/jobs/JobList'
import { Link } from 'react-router-dom'

function MyJobs() {
  const [jobs, setJobs] = useState([])
  const { getMyJobs, loading, error } = useJobs()

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const data = await getMyJobs()
        setJobs(data.jobs)
      } catch (err) {
        console.error(err)
      }
    }
    fetchJobs()
  }, [])

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">My Posted Jobs</h1>
        <Link
          to="/post-job"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
        >
          Post New Job
        </Link>
      </div>
      
      <JobList jobs={jobs} loading={loading} error={error} />
    </div>
  )
}

export default MyJobs