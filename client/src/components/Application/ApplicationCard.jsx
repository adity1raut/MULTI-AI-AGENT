import { Link } from 'react-router-dom'

const statusColors = {
  submitted: 'bg-blue-100 text-blue-800',
  reviewed: 'bg-yellow-100 text-yellow-800',
  accepted: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800'
}

const ApplicationCard = ({ application }) => {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
      <div className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{application.job_title}</h3>
            <p className="text-gray-600">{application.company}</p>
          </div>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusColors[application.status] || 'bg-gray-100 text-gray-800'}`}>
            {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
          </span>
        </div>
        
        <div className="mt-4 text-sm text-gray-500">
          Applied on {new Date(application.applied_at).toLocaleDateString()}
        </div>
        
        <div className="mt-6">
          <Link
            to={`/jobs/${application.job_id}`}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
          >
            View Job
          </Link>
        </div>
      </div>
    </div>
  )
}

export default ApplicationCard