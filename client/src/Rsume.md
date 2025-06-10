import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ResumeProcessor = () => {
  // State for file upload and processing
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingError, setProcessingError] = useState('');
  const [processedResume, setProcessedResume] = useState(null);
  
  // State for resumes list
  const [resumes, setResumes] = useState([]);
  const [isLoadingResumes, setIsLoadingResumes] = useState(false);
  
  // State for skills analytics
  const [skillsAnalytics, setSkillsAnalytics] = useState(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);
  
  // State for skills search
  const [searchTerm, setSearchTerm] = useState('');
  const [searchCategory, setSearchCategory] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  
  // State for UI
  const [activeTab, setActiveTab] = useState('upload');
  const [showRawData, setShowRawData] = useState(false);

  // Process resume file
  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setProcessingError('Please select a file first');
      return;
    }

    setIsProcessing(true);
    setProcessingError('');
    setProcessedResume(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('http://localhost:5000/api/process-resume', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setProcessedResume(response.data);
      // Refresh resumes list after successful upload
      fetchResumes();
    } catch (error) {
      console.error('Error processing resume:', error);
      setProcessingError(error.response?.data?.error || 'Failed to process resume');
    } finally {
      setIsProcessing(false);
    }
  };

  // Fetch all resumes
  const fetchResumes = async () => {
    setIsLoadingResumes(true);
    try {
      const response = await axios.get('http://localhost:5000/api/resumes');
      setResumes(response.data);
    } catch (error) {
      console.error('Error fetching resumes:', error);
    } finally {
      setIsLoadingResumes(false);
    }
  };

  // Fetch skills analytics
  const fetchSkillsAnalytics = async () => {
    setIsLoadingAnalytics(true);
    try {
      const response = await axios.get('http://localhost:5000/api/skills-analytics');
      setSkillsAnalytics(response.data);
    } catch (error) {
      console.error('Error fetching skills analytics:', error);
    } finally {
      setIsLoadingAnalytics(false);
    }
  };

  // Search skills
  const handleSkillSearch = async (e) => {
    e.preventDefault();
    setIsSearching(true);
    try {
      const response = await axios.get('http://localhost:5000/api/skills/search', {
        params: {
          skill: searchTerm,
          category: searchCategory
        }
      });
      setSearchResults(response.data);
    } catch (error) {
      console.error('Error searching skills:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Load initial data
  useEffect(() => {
    fetchResumes();
    fetchSkillsAnalytics();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8">Resume Processing System</h1>
      
      {/* Navigation Tabs */}
      <div className="flex border-b mb-6">
        <button
          className={`py-2 px-4 font-medium ${activeTab === 'upload' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
          onClick={() => setActiveTab('upload')}
        >
          Upload Resume
        </button>
        <button
          className={`py-2 px-4 font-medium ${activeTab === 'resumes' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
          onClick={() => setActiveTab('resumes')}
        >
          View Resumes
        </button>
        <button
          className={`py-2 px-4 font-medium ${activeTab === 'analytics' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
          onClick={() => setActiveTab('analytics')}
        >
          Skills Analytics
        </button>
        <button
          className={`py-2 px-4 font-medium ${activeTab === 'search' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
          onClick={() => setActiveTab('search')}
        >
          Search Skills
        </button>
      </div>
      
      {/* Upload Resume Tab */}
      {activeTab === 'upload' && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Upload Resume</h2>
          <form onSubmit={handleFileUpload}>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2" htmlFor="resumeFile">
                Select PDF or DOCX file:
              </label>
              <input
                type="file"
                id="resumeFile"
                accept=".pdf,.docx"
                onChange={(e) => setFile(e.target.files[0])}
                className="w-full px-3 py-2 border rounded"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isProcessing}
              className={`bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isProcessing ? 'Processing...' : 'Process Resume'}
            </button>
            {processingError && (
              <p className="mt-2 text-red-500">{processingError}</p>
            )}
          </form>
          
          {/* Processed Resume Results */}
          {processedResume && (
            <div className="mt-8 border-t pt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Processed Resume Results</h3>
                <button
                  onClick={() => setShowRawData(!showRawData)}
                  className="text-sm text-blue-500 hover:text-blue-700"
                >
                  {showRawData ? 'Hide Raw Data' : 'Show Raw Data'}
                </button>
              </div>
              
              {showRawData ? (
                <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
                  {JSON.stringify(processedResume, null, 2)}
                </pre>
              ) : (
                <div className="space-y-6">
                  <div className="bg-gray-50 p-4 rounded">
                    <h4 className="font-medium text-gray-800 mb-2">Contact Information</h4>
                    <p>Name: {processedResume.contact_info.name || 'Not found'}</p>
                    <p>Email: {processedResume.contact_info.email || 'Not found'}</p>
                    <p>Phone: {processedResume.contact_info.phone || 'Not found'}</p>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded">
                    <h4 className="font-medium text-gray-800 mb-2">Technical Skills ({processedResume.technical_skills.length})</h4>
                    <div className="flex flex-wrap gap-2">
                      {processedResume.technical_skills.length > 0 ? (
                        processedResume.technical_skills.map((skill, index) => (
                          <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                            {skill}
                          </span>
                        ))
                      ) : (
                        <p className="text-gray-500">No technical skills identified</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded">
                    <h4 className="font-medium text-gray-800 mb-2">Programming Languages ({processedResume.programming_languages.length})</h4>
                    <div className="flex flex-wrap gap-2">
                      {processedResume.programming_languages.length > 0 ? (
                        processedResume.programming_languages.map((lang, index) => (
                          <span key={index} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                            {lang}
                          </span>
                        ))
                      ) : (
                        <p className="text-gray-500">No programming languages identified</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded">
                    <h4 className="font-medium text-gray-800 mb-2">Professional Summary</h4>
                    <div className="whitespace-pre-line text-gray-700">
                      {processedResume.summary}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      
      {/* View Resumes Tab */}
      {activeTab === 'resumes' && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Resumes Database ({resumes.length})</h2>
          
          {isLoadingResumes ? (
            <p>Loading resumes...</p>
          ) : resumes.length === 0 ? (
            <p>No resumes found in database.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="py-2 px-4 border">Name</th>
                    <th className="py-2 px-4 border">Email</th>
                    <th className="py-2 px-4 border">Tech Skills</th>
                    <th className="py-2 px-4 border">Languages</th>
                    <th className="py-2 px-4 border">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {resumes.map((resume) => (
                    <tr key={resume.id} className="hover:bg-gray-50">
                      <td className="py-2 px-4 border">{resume.name || 'Unknown'}</td>
                      <td className="py-2 px-4 border">{resume.email || 'None'}</td>
                      <td className="py-2 px-4 border">
                        {resume.technical_skills?.slice(0, 3).map((skill, i) => (
                          <span key={i} className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-1 mb-1">
                            {skill}
                          </span>
                        ))}
                        {resume.technical_skills?.length > 3 && (
                          <span className="text-gray-500 text-xs">+{resume.technical_skills.length - 3} more</span>
                        )}
                      </td>
                      <td className="py-2 px-4 border">
                        {resume.programming_languages?.map((lang, i) => (
                          <span key={i} className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded mr-1 mb-1">
                            {lang}
                          </span>
                        ))}
                      </td>
                      <td className="py-2 px-4 border text-sm">
                        {new Date(resume.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
      
      {/* Skills Analytics Tab */}
      {activeTab === 'analytics' && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Skills Analytics</h2>
          
          {isLoadingAnalytics ? (
            <p>Loading analytics...</p>
          ) : skillsAnalytics ? (
            <div className="space-y-8">
              <div className="bg-white p-4 rounded shadow">
                <h3 className="font-medium text-lg mb-3">Overview</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-3 rounded">
                    <p className="text-sm text-gray-600">Total Resumes</p>
                    <p className="text-2xl font-bold">{skillsAnalytics.total_resumes}</p>
                  </div>
                  <div className="bg-green-50 p-3 rounded">
                    <p className="text-sm text-gray-600">Unique Skills</p>
                    <p className="text-2xl font-bold">{skillsAnalytics.total_unique_skills}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-4 rounded shadow">
                <h3 className="font-medium text-lg mb-3">Most Frequent Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {skillsAnalytics.most_frequent_skills.map((skill, index) => (
                    <div key={index} className="bg-gray-100 p-2 rounded flex items-center">
                      <span className="font-medium mr-2">{skill.skill_name}</span>
                      <span className="text-sm text-gray-600">({skill.frequency} resumes)</span>
                      <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                        skill.category === 'technical' ? 'bg-blue-100 text-blue-800' :
                        skill.category === 'programming' ? 'bg-green-100 text-green-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {skill.category}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="bg-white p-4 rounded shadow">
                <h3 className="font-medium text-lg mb-3">Skills by Category</h3>
                {Object.entries(skillsAnalytics.skills_by_category).map(([category, skills]) => (
                  <div key={category} className="mb-4">
                    <h4 className="font-medium capitalize mb-2">{category} ({skills.length})</h4>
                    <div className="flex flex-wrap gap-2">
                      {skills.slice(0, 20).map((skill, index) => (
                        <span key={index} className="bg-gray-100 px-3 py-1 rounded-full text-sm">
                          {skill.skill_name} ({skill.frequency})
                        </span>
                      ))}
                      {skills.length > 20 && (
                        <span className="text-gray-500 text-sm">+{skills.length - 20} more</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p>No analytics data available.</p>
          )}
        </div>
      )}
      
      {/* Search Skills Tab */}
      {activeTab === 'search' && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Search Skills</h2>
          
          <form onSubmit={handleSkillSearch} className="bg-white p-4 rounded shadow mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-gray-700 mb-1">Skill Name</label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="e.g. JavaScript, Python"
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-1">Category</label>
                <select
                  value={searchCategory}
                  onChange={(e) => setSearchCategory(e.target.value)}
                  className="w-full px-3 py-2 border rounded"
                >
                  <option value="">All Categories</option>
                  <option value="technical">Technical</option>
                  <option value="soft">Soft Skills</option>
                  <option value="programming">Programming</option>
                  <option value="framework">Frameworks</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={isSearching}
                  className={`bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 ${isSearching ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isSearching ? 'Searching...' : 'Search Skills'}
                </button>
              </div>
            </div>
          </form>
          
          {searchResults && (
            <div className="bg-white p-4 rounded shadow">
              <h3 className="font-medium text-lg mb-4">
                Found {searchResults.total_matches} results
                {searchTerm && ` for "${searchTerm}"`}
                {searchCategory && ` in ${searchCategory} category`}
              </h3>
              
              {searchResults.total_matches > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full border">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="py-2 px-4 border">Skill</th>
                        <th className="py-2 px-4 border">Category</th>
                        <th className="py-2 px-4 border">Resume</th>
                        <th className="py-2 px-4 border">Confidence</th>
                      </tr>
                    </thead>
                    <tbody>
                      {searchResults.skills.map((skill, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="py-2 px-4 border font-medium">{skill.skill_name}</td>
                          <td className="py-2 px-4 border capitalize">{skill.category}</td>
                          <td className="py-2 px-4 border">
                            <div>
                              <p>{skill.resume_name || 'Unknown'}</p>
                              <p className="text-sm text-gray-600">{skill.resume_email}</p>
                            </div>
                          </td>
                          <td className="py-2 px-4 border">
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                              <div 
                                className={`h-2.5 rounded-full ${
                                  skill.confidence_score > 75 ? 'bg-green-500' :
                                  skill.confidence_score > 50 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${skill.confidence_score}%` }}
                              ></div>
                            </div>
                            <span className="text-xs text-gray-600">{skill.confidence_score}%</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500">No matching skills found.</p>
              )}
            </div>
          )}
        </div>
      )}
      
      <footer className="mt-12 text-center text-gray-500 text-sm">
        <p>Resume Processing System &copy; {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
};

export default ResumeProcessor;