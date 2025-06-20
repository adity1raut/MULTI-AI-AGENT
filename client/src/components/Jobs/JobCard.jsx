import { Link } from 'react-router-dom';

export default function JobCard({ job }) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <div className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-xl font-semibold text-gray-800">{job.title}</h3>
            <p className="text-gray-600">{job.company} • {job.location}</p>
          </div>
          {job.match_score && (
            <span className="bg-green-100 text-green-800 text-sm font-medium px-2.5 py-0.5 rounded">
              {job.match_score}% Match
            </span>
          )}
        </div>
        
        <div className="mt-4">
          <p className="text-gray-700 line-clamp-2">{job.description}</p>
        </div>
        
        <div className="mt-4 flex flex-wrap gap-2">
          {job.key_requirements?.slice(0, 3).map((skill, index) => (
            <span key={index} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
              {skill}
            </span>
          ))}
        </div>
        
        <div className="mt-6 flex justify-between items-center">
          <span className="text-sm text-gray-500">
            Posted {new Date(job.created_at).toLocaleDateString()}
          </span>
          <Link 
            to={`/jobs/${job.id}`} 
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
}