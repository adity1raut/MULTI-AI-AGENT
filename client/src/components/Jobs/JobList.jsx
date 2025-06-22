import JobCard from './JobCard'
import LoadingSpinner from '../common/LoadingSpinner'

const JobList = ({ jobs, loading, error, showMatchScore = false }) => {
  if (loading) return <LoadingSpinner />
  if (error) return <div className="text-red-500">{error}</div>

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {jobs.map(job => (
        <JobCard 
          key={job.id} 
          job={job} 
          showMatchScore={showMatchScore}
          actionText="View Details"
          actionLink={`/jobs/${job.id}`}
        />
      ))}
    </div>
  )
}

export default JobList