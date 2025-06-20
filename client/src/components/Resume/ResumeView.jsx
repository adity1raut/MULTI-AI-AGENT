import { useEffect, useState } from 'react';
import { getResume } from '../../utils/api.jsx';

export default function ResumeView() {
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
    return <div className="flex justify-center py-8">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
    </div>;
  }

  if (error) {
    return <div className="p-4 bg-red-100 text-red-700 rounded">{error}</div>;
  }

  if (!resume) {
    return <div className="text-gray-500 text-center py-8">No resume found</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6">{resume.name || 'Resume'}</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-2">Professional Summary</h3>
            <div className="whitespace-pre-line text-gray-700">{resume.summary}</div>
          </div>
          
          {resume.experience_summary && resume.experience_summary !== 'Not available' && (
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-2">Work Experience</h3>
              <div className="whitespace-pre-line text-gray-700">{resume.experience_summary}</div>
            </div>
          )}
          
          {resume.projects && resume.projects !== 'Not available' && (
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-2">Projects</h3>
              <div className="whitespace-pre-line text-gray-700">{resume.projects}</div>
            </div>
          )}
        </div>
        
        <div>
          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-2">Contact</h3>
            <p className="text-gray-700">{resume.email}</p>
            {resume.phone && <p className="text-gray-700">{resume.phone}</p>}
          </div>
          
          {resume.technical_skills?.length > 0 && (
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-2">Technical Skills</h3>
              <div className="flex flex-wrap gap-2">
                {resume.technical_skills.map((skill, index) => (
                  <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {resume.education_summary && resume.education_summary !== 'Not available' && (
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-2">Education</h3>
              <div className="whitespace-pre-line text-gray-700">{resume.education_summary}</div>
            </div>
          )}
          
          {resume.certifications && resume.certifications !== 'Not available' && (
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-2">Certifications</h3>
              <div className="whitespace-pre-line text-gray-700">{resume.certifications}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}