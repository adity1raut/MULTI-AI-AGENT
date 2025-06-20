import { useEffect, useState } from 'react';
import { getResume } from '../../utils/api.jsx';

export default function ResumePreview() {
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchResume = async () => {
      try {
        const data = await getResume();
        setResume(data);
      } catch (err) {
        setError(err.message || 'Failed to load resume');
      } finally {
        setLoading(false);
      }
    };
    
    fetchResume();
  }, []);

  if (loading) {
    return <div className="bg-white rounded-lg shadow-md p-6">
      <div className="animate-pulse space-y-4">
        <div className="h-6 bg-gray-200 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
      </div>
    </div>;
  }

  if (error) {
    return <div className="bg-white rounded-lg shadow-md p-6 text-red-600">{error}</div>;
  }

  if (!resume) {
    return <div className="bg-white rounded-lg shadow-md p-6 text-gray-500">
      No resume uploaded yet. Upload your resume to get started.
    </div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-4">Your Resume</h3>
      
      <div className="mb-4">
        <h4 className="font-medium text-gray-700">Contact Information</h4>
        <p className="text-gray-600">{resume.name}</p>
        <p className="text-gray-600">{resume.email}</p>
        {resume.phone && <p className="text-gray-600">{resume.phone}</p>}
      </div>
      
      {resume.technical_skills?.length > 0 && (
        <div className="mb-4">
          <h4 className="font-medium text-gray-700">Technical Skills</h4>
          <div className="flex flex-wrap gap-2 mt-2">
            {resume.technical_skills.map((skill, index) => (
              <span key={index} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}
      
      <div className="mt-4">
        <h4 className="font-medium text-gray-700">Experience Summary</h4>
        <p className="text-gray-600 mt-2 whitespace-pre-line">{resume.experience_summary}</p>
      </div>
    </div>
  );
}