import { Link } from 'react-router-dom'

const JobCard = ({ job, showMatchScore = false, actionText = 'View', actionLink }) => {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow">
      <div className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
            <p className="text-gray-600">{job.company} • {job.location}</p>
          </div>
          {showMatchScore && job.match_score && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
              {job.match_score}% Match
            </span>
          )}
        </div>
        
        <div className="mt-4">
          <p className="text-gray-700 line-clamp-3">{job.enhanced_description || job.description}</p>
        </div>
        
        <div className="mt-4 flex flex-wrap gap-2">
          {job.key_requirements?.slice(0, 3).map((skill, index) => (
            <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {skill}
            </span>
          ))}
        </div>
        
        <div className="mt-6">
          <Link
            to={actionLink}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            {actionText}
          </Link>
        </div>
      </div>
    </div>
  )
}

export default JobCard