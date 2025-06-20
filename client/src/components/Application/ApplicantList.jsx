import { Link } from 'react-router-dom';

export default function ApplicantList({ applicants }) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-6">Applicants</h2>
        
        {applicants.length > 0 ? (
          <div className="space-y-4">
            {applicants.map(applicant => (
              <div key={applicant.id} className="border-b border-gray-200 pb-4 last:border-0">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">{applicant.name}</h3>
                    <p className="text-gray-600 text-sm">{applicant.email}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded ${
                    applicant.status === 'submitted' ? 'bg-blue-100 text-blue-800' :
                    applicant.status === 'reviewed' ? 'bg-yellow-100 text-yellow-800' :
                    applicant.status === 'accepted' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {applicant.status}
                  </span>
                </div>
                
                {applicant.technical_skills?.length > 0 && (
                  <div className="mt-2">
                    <h4 className="text-sm font-medium text-gray-700">Skills</h4>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {applicant.technical_skills.slice(0, 5).map((skill, index) => (
                        <span key={index} className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="mt-3 flex justify-end">
                  <Link 
                    to={`/resume/${applicant.id}`} 
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    View Resume
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No applicants yet</p>
        )}
      </div>
    </div>
  );
}