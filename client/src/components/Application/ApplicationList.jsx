import { Link } from 'react-router-dom';

export default function ApplicationList({ applications }) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-6">Your Applications</h2>
        
        {applications.length > 0 ? (
          <div className="space-y-4">
            {applications.map(application => (
              <div key={application.id} className="border-b border-gray-200 pb-4 last:border-0">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">{application.job_title}</h3>
                    <p className="text-gray-600 text-sm">{application.company}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded ${
                    application.status === 'submitted' ? 'bg-blue-100 text-blue-800' :
                    application.status === 'reviewed' ? 'bg-yellow-100 text-yellow-800' :
                    application.status === 'accepted' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {application.status}
                  </span>
                </div>
                
                <div className="mt-3 flex justify-between items-center">
                  <span className="text-sm text-gray-500">
                    Applied on {new Date(application.applied_at).toLocaleDateString()}
                  </span>
                  <Link 
                    to={`/jobs/${application.job_id}`} 
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    View Job
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">You haven't applied to any jobs yet.</p>
            <Link 
              to="/jobs" 
              className="text-blue-600 hover:underline font-medium"
            >
              Browse available jobs
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}