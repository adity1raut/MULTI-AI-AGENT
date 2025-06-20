import { useParams, Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../utils/auth.jsx';
import { getJobDetails, applyToJob } from '../utils/api.jsx';
import ApplicantList from '../components/Application/ApplicantList';

export default function JobDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [applying, setApplying] = useState(false);
  const [applicationError, setApplicationError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchJob = async () => {
      try {
        setLoading(true);
        const data = await getJobDetails(id);
        setJob(data);
      } catch (err) {
        setError(err.message || 'Failed to fetch job details');
      } finally {
        setLoading(false);
      }
    };
    
    fetchJob();
  }, [id]);

  const handleApply = async () => {
    try {
      setApplying(true);
      setApplicationError('');
      await applyToJob(id);
      navigate('/applicant');
    } catch (err) {
      setApplicationError(err.message || 'Failed to apply to job');
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-8">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
    </div>;
  }

  if (error) {
    return <div className="p-4 bg-red-100 text-red-700 rounded">{error}</div>;
  }

  if (!job) {
    return <div className="text-gray-500 text-center py-8">Job not found</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        <div className="md:w-2/3">
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-2xl font-bold">{job.title}</h1>
                <p className="text-lg text-gray-600">{job.company} • {job.location}</p>
              </div>
              {user?.role === 'requester' && job.posted_by === user.uid && (
                <Link 
                  to={`/jobs/${job.id}/applicants`}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  View Applicants ({job.applicants?.length || 0})
                </Link>
              )}
            </div>
            
            <div className="prose max-w-none">
              <h3>Job Description</h3>
              <div dangerouslySetInnerHTML={{ __html: job.enhanced_description }} />
              
              {job.key_requirements?.length > 0 && (
                <>
                  <h3>Key Requirements</h3>
                  <ul>
                    {job.key_requirements.map((req, index) => (
                      <li key={index}>{req}</li>
                    ))}
                  </ul>
                </>
              )}
              
              {job.key_responsibilities?.length > 0 && (
                <>
                  <h3>Key Responsibilities</h3>
                  <ul>
                    {job.key_responsibilities.map((resp, index) => (
                      <li key={index}>{resp}</li>
                    ))}
                  </ul>
                </>
              )}
              
              {job.compensation_info && (
                <>
                  <h3>Compensation</h3>
                  <p>{job.compensation_info}</p>
                </>
              )}
            </div>
            
            {user?.role === 'applicant' && (
              <div className="mt-8">
                <button
                  onClick={handleApply}
                  disabled={applying}
                  className={`w-full md:w-auto px-6 py-3 rounded-lg font-medium ${
                    applying ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
                  } text-white`}
                >
                  {applying ? 'Applying...' : 'Apply Now'}
                </button>
                {applicationError && (
                  <div className="mt-2 text-red-600">{applicationError}</div>
                )}
              </div>
            )}
          </div>
        </div>
        
        <div className="md:w-1/3">
          {user?.role === 'requester' && job.posted_by === user.uid && (
            <ApplicantList applicants={job.applicants || []} />
          )}
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">About {job.company}</h3>
            <p className="text-gray-600">
              {job.additional_details || 'More information about the company would appear here.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}