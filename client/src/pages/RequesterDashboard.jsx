import { useEffect, useState } from 'react';
import { useAuth } from '../utils/auth.jsx';
import { getMyJobs } from '../utils/api.jsx';
import JobCard from '../components/Jobs/JobCard';
import JobForm from '../components/Jobs/JobForm';

export default function RequesterDashboard() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingJob, setEditingJob] = useState(null);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);
        const data = await getMyJobs();
        setJobs(data);
      } catch (err) {
        setError(err.message || 'Failed to fetch jobs');
      } finally {
        setLoading(false);
      }
    };
    
    fetchJobs();
  }, []);

  const handleCreateJob = async (formData) => {
    try {
      // Call API to create job
      // After success, refresh jobs list
      const data = await getMyJobs();
      setJobs(data);
      setShowForm(false);
    } catch (err) {
      throw err;
    }
  };

  const handleEditJob = (job) => {
    setEditingJob(job);
    setShowForm(true);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">My Job Postings</h1>
        <button
          onClick={() => {
            setEditingJob(null);
            setShowForm(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          Post New Job
        </button>
      </div>

      {showForm ? (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">
            {editingJob ? 'Edit Job Posting' : 'Create New Job Posting'}
          </h2>
          <JobForm 
            initialData={editingJob || {}} 
            onSubmit={handleCreateJob} 
            onCancel={() => setShowForm(false)}
          />
        </div>
      ) : null}

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="p-4 bg-red-100 text-red-700 rounded">{error}</div>
      ) : jobs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {jobs.map(job => (
            <div key={job.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800">{job.title}</h3>
                    <p className="text-gray-600">{job.company} • {job.location}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => handleEditJob(job)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Edit
                    </button>
                  </div>
                </div>
                
                <div className="mt-4">
                  <p className="text-gray-700 line-clamp-2">{job.description}</p>
                </div>
                
                <div className="mt-6 flex justify-between items-center">
                  <span className="text-sm text-gray-500">
                    {job.applicants?.length || 0} applicants
                  </span>
                  <a 
                    href={`/jobs/${job.id}/applicants`} 
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    View Applicants
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-500 mb-4">You haven't posted any jobs yet.</p>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            Post Your First Job
          </button>
        </div>
      )}
    </div>
  );
}