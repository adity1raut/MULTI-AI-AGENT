import { useEffect, useState } from 'react';
import { useAuth } from '../utils/auth.jsx';
import { getMatchedJobs, getMyApplications } from '../utils/api.jsx';
import JobCard from '../components/Jobs/JobCard';
import ResumeForm from '../components/Resume/ResumeForm';
import ResumePreview from '../components/Resume/ResumePreview';

export default function ApplicantDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('matched');
  const [matchedJobs, setMatchedJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        if (activeTab === 'matched') {
          const jobs = await getMatchedJobs();
          setMatchedJobs(jobs);
        } else {
          const apps = await getMyApplications();
          setApplications(apps);
        }
      } catch (err) {
        setError(err.message || 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [activeTab]);

  const handleResumeUpload = async (file) => {
    try {
      // Call API to upload resume
      // After successful upload, refresh matched jobs
      const jobs = await getMatchedJobs();
      setMatchedJobs(jobs);
    } catch (err) {
      throw err;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        <div className="md:w-1/3">
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Welcome, {user?.displayName || 'Applicant'}</h2>
            <p className="text-gray-600 mb-4">Upload your resume to find matching jobs</p>
            
            <ResumeForm onSubmit={handleResumeUpload} />
          </div>
          
          <ResumePreview />
        </div>
        
        <div className="md:w-2/3">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex border-b border-gray-200 mb-6">
              <button
                className={`py-2 px-4 font-medium ${activeTab === 'matched' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
                onClick={() => setActiveTab('matched')}
              >
                Matching Jobs
              </button>
              <button
                className={`py-2 px-4 font-medium ${activeTab === 'applications' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
                onClick={() => setActiveTab('applications')}
              >
                My Applications
              </button>
            </div>
            
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : error ? (
              <div className="p-4 bg-red-100 text-red-700 rounded">{error}</div>
            ) : activeTab === 'matched' ? (
              <div className="space-y-6">
                {matchedJobs.length > 0 ? (
                  matchedJobs.map(job => (
                    <JobCard key={job.id} job={job} />
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-8">No matching jobs found. Upload your resume to get personalized matches.</p>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {applications.length > 0 ? (
                  applications.map(app => (
                    <div key={app.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <h3 className="text-lg font-semibold">{app.job_title}</h3>
                      <p className="text-gray-600">{app.company}</p>
                      <div className="mt-2 flex justify-between items-center">
                        <span className={`px-2 py-1 text-xs rounded ${
                          app.status === 'submitted' ? 'bg-blue-100 text-blue-800' :
                          app.status === 'reviewed' ? 'bg-yellow-100 text-yellow-800' :
                          app.status === 'accepted' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {app.status}
                        </span>
                        <span className="text-sm text-gray-500">
                          Applied on {new Date(app.applied_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-8">You haven't applied to any jobs yet.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}