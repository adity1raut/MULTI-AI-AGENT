import { useEffect, useState } from 'react'
import { useApplications } from '../../hooks/useApplications'
import ApplicationCard from '../../components/Application/ApplicationCard'
import LoadingSpinner from '../../components/common/LoadingSpinner'

function MyApplications() {
  const [applications, setApplications] = useState([])
  const { getMyApplications, loading, error } = useApplications()

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const data = await getMyApplications()
        setApplications(data.applications)
      } catch (err) {
        console.error(err)
      }
    }
    fetchApplications()
  }, [])

  if (loading) return <LoadingSpinner />
  if (error) return <div className="text-red-500">{error}</div>

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">My Applications</h1>
      </div>
      
      {applications.length === 0 ? (
        <div className="text-center py-12">
          <h2 className="text-xl font-medium text-gray-600">No applications found</h2>
          <p className="mt-2 text-gray-500">You haven't applied to any jobs yet</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {applications.map(application => (
            <ApplicationCard key={application.id} application={application} />
          ))}
        </div>
      )}
    </div>
  )
}

export default MyApplications