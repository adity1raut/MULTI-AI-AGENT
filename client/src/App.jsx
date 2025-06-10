// import React, { useState } from 'react';
// import { Upload, FileText, List, User, Mail, Phone, Loader2, ArrowLeft, Code, Brain, Wrench, Award, TrendingUp, BarChart3 } from 'lucide-react';

// function App() {
//   // State management
//   const [file, setFile] = useState(null);
//   const [resumeData, setResumeData] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [view, setView] = useState('upload'); // 'upload', 'result', 'list', or 'analytics'
//   const [allResumes, setAllResumes] = useState([]);
//   const [analytics, setAnalytics] = useState(null);

//   // Handle file selection
//   const handleFileChange = (e) => {
//     setFile(e.target.files[0]);
//   };

//   // Process the uploaded resume
//   const processResume = async () => {
//     if (!file) return;

//     setLoading(true);
//     const formData = new FormData();
//     formData.append('file', file);

//     try {
//       const response = await fetch('http://localhost:5000/api/process-resume', {
//         method: 'POST',
//         body: formData
//       });
      
//       if (!response.ok) {
//         throw new Error('Network response was not ok');
//       }
      
//       const data = await response.json();
//       setResumeData(data);
//       setView('result');
//     } catch (error) {
//       console.error('Error:', error);
//       alert('Error processing resume: ' + error.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Fetch all resumes from the database
//   const fetchAllResumes = async () => {
//     setLoading(true);
//     try {
//       const response = await fetch('http://localhost:5000/api/resumes');
//       const data = await response.json();
//       setAllResumes(data);
//       setView('list');
//     } catch (error) {
//       console.error('Error:', error);
//       alert('Error fetching resumes');
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Fetch skills analytics
//   const fetchAnalytics = async () => {
//     setLoading(true);
//     try {
//       const response = await fetch('http://localhost:5000/api/skills-analytics');
//       const data = await response.json();
//       setAnalytics(data);
//       setView('analytics');
//     } catch (error) {
//       console.error('Error:', error);
//       alert('Error fetching analytics');
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Skills display component
//   const SkillsSection = ({ title, skills, icon: Icon, color }) => {
//     if (!skills || skills.length === 0) return null;
    
//     return (
//       <div className="mb-6">
//         <h3 className={`text-lg font-semibold mb-3 flex items-center gap-2 ${color}`}>
//           <Icon size={20} />
//           {title}
//         </h3>
//         <div className="flex flex-wrap gap-2">
//           {skills.map((skill, index) => (
//             <span 
//               key={index} 
//               className={`px-3 py-1 rounded-full text-sm font-medium ${
//                 color.includes('blue') ? 'bg-blue-100 text-blue-800' :
//                 color.includes('green') ? 'bg-green-100 text-green-800' :
//                 color.includes('purple') ? 'bg-purple-100 text-purple-800' :
//                 color.includes('orange') ? 'bg-orange-100 text-orange-800' :
//                 'bg-gray-100 text-gray-800'
//               }`}
//             >
//               {skill}
//             </span>
//           ))}
//         </div>
//       </div>
//     );
//   };

//   // Analytics chart component
//   const AnalyticsChart = ({ title, data, color }) => {
//     const entries = Object.entries(data || {});
//     if (entries.length === 0) return null;

//     const maxValue = Math.max(...entries.map(([_, count]) => count));

//     return (
//       <div className="bg-white p-6 rounded-lg shadow-md mb-6">
//         <h3 className="text-lg font-semibold mb-4">{title}</h3>
//         <div className="space-y-3">
//           {entries.slice(0, 8).map(([skill, count]) => (
//             <div key={skill} className="flex items-center">
//               <div className="w-32 text-sm font-medium truncate">{skill}</div>
//               <div className="flex-1 mx-3">
//                 <div className="bg-gray-200 rounded-full h-4">
//                   <div 
//                     className={`h-4 rounded-full ${color}`}
//                     style={{ width: `${(count / maxValue) * 100}%` }}
//                   ></div>
//                 </div>
//               </div>
//               <div className="w-8 text-sm text-gray-600">{count}</div>
//             </div>
//           ))}
//         </div>
//       </div>
//     );
//   };

//   return (
//     <div className="min-h-screen bg-gray-50">
//       <div className="max-w-6xl mx-auto py-8 px-4">
//         <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">
//           Enhanced Resume Processor
//         </h1>

//         {/* Navigation buttons */}
//         <div className="flex justify-center gap-4 mb-8 flex-wrap">
//           <button 
//             onClick={() => setView('upload')}
//             className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
//               view === 'upload' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
//             }`}
//           >
//             <Upload size={18} />
//             Upload Resume
//           </button>
//           <button 
//             onClick={fetchAllResumes}
//             className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
//               view === 'list' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
//             }`}
//           >
//             <List size={18} />
//             View All Resumes
//           </button>
//           <button 
//             onClick={fetchAnalytics}
//             className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
//               view === 'analytics' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
//             }`}
//           >
//             <BarChart3 size={18} />
//             Skills Analytics
//           </button>
//         </div>

//         {/* Loading indicator */}
//         {loading && (
//           <div className="flex justify-center my-8">
//             <div className="flex items-center gap-2">
//               <Loader2 size={32} className="animate-spin text-blue-600" />
//               <span className="text-gray-600">Processing...</span>
//             </div>
//           </div>
//         )}

//         {/* Upload view */}
//         {view === 'upload' && !loading && (
//           <div className="max-w-2xl mx-auto">
//             <div className="bg-white p-8 rounded-lg shadow-md">
//               <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
//                 <FileText size={24} />
//                 Upload Resume for Analysis
//               </h2>
              
//               <div className="mb-6">
//                 <label className="flex items-center justify-center gap-3 px-6 py-4 bg-blue-50 border-2 border-dashed border-blue-300 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors">
//                   <Upload size={24} className="text-blue-600" />
//                   <span className="text-blue-600 font-medium">
//                     {file ? file.name : 'Select PDF or DOCX file'}
//                   </span>
//                   <input
//                     type="file"
//                     className="hidden"
//                     accept=".pdf,.docx"
//                     onChange={handleFileChange}
//                   />
//                 </label>
//               </div>
              
//               {file && (
//                 <button
//                   onClick={processResume}
//                   className="w-full px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
//                 >
//                   Process Resume & Extract Skills
//                 </button>
//               )}
//             </div>
//           </div>
//         )}

//         {/* Result view */}
//         {view === 'result' && resumeData && !loading && (
//           <div className="max-w-4xl mx-auto">
//             <button 
//               onClick={() => setView('upload')}
//               className="flex items-center gap-2 text-blue-600 mb-6 hover:text-blue-800 transition-colors"
//             >
//               <ArrowLeft size={18} />
//               Back to upload
//             </button>

//             <div className="bg-white p-8 rounded-lg shadow-md">
//               <div className="flex items-center gap-3 mb-6">
//                 <User size={32} className="text-blue-600" />
//                 <h2 className="text-3xl font-bold text-gray-800">
//                   {resumeData.contact_info.name || 'Professional Profile'}
//                 </h2>
//               </div>
              
//               {/* Contact Information */}
//               <div className="grid md:grid-cols-2 gap-4 mb-8 p-4 bg-gray-50 rounded-lg">
//                 <div className="flex items-center gap-2">
//                   <Mail size={18} className="text-gray-500" />
//                   <span><strong>Email:</strong> {resumeData.contact_info.email || 'Not available'}</span>
//                 </div>
//                 <div className="flex items-center gap-2">
//                   <Phone size={18} className="text-gray-500" />
//                   <span><strong>Phone:</strong> {resumeData.contact_info.phone || 'Not available'}</span>
//                 </div>
//               </div>

//               {/* Skills Sections */}
//               <div className="grid lg:grid-cols-2 gap-6 mb-8">
//                 <div>
//                   <SkillsSection 
//                     title="Technical Skills" 
//                     skills={resumeData.technical_skills} 
//                     icon={Code} 
//                     color="text-blue-600"
//                   />
//                   <SkillsSection 
//                     title="Programming Languages" 
//                     skills={resumeData.programming_languages} 
//                     icon={Code} 
//                     color="text-green-600"
//                   />
//                 </div>
//                 <div>
//                   <SkillsSection 
//                     title="Frameworks & Tools" 
//                     skills={resumeData.frameworks_tools} 
//                     icon={Wrench} 
//                     color="text-purple-600"
//                   />
//                   <SkillsSection 
//                     title="Soft Skills" 
//                     skills={resumeData.soft_skills} 
//                     icon={Brain} 
//                     color="text-orange-600"
//                   />
//                 </div>
//               </div>

//               {/* Certifications */}
//               {resumeData.certifications && resumeData.certifications !== 'Not available' && (
//                 <div className="mb-8">
//                   <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-yellow-600">
//                     <Award size={20} />
//                     Certifications
//                   </h3>
//                   <p className="text-gray-700 bg-yellow-50 p-4 rounded-lg">
//                     {resumeData.certifications}
//                   </p>
//                 </div>
//               )}

//               {/* Professional Summary */}
//               <div className="mb-6">
//                 <h3 className="text-xl font-semibold mb-4 text-gray-800">Professional Summary</h3>
//                 <div className="prose max-w-none">
//                   <pre className="whitespace-pre-wrap text-gray-700 bg-gray-50 p-6 rounded-lg font-sans">
//                     {resumeData.summary}
//                   </pre>
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* List view */}
//         {view === 'list' && !loading && (
//           <div>
//             <button 
//               onClick={() => setView('upload')}
//               className="flex items-center gap-2 text-blue-600 mb-6 hover:text-blue-800 transition-colors"
//             >
//               <ArrowLeft size={18} />
//               Back to upload
//             </button>

//             <h2 className="text-3xl font-bold mb-6 flex items-center gap-2">
//               <List size={32} />
//               All Processed Resumes
//             </h2>
            
//             {allResumes.length === 0 ? (
//               <div className="text-center py-12">
//                 <FileText size={64} className="mx-auto text-gray-400 mb-4" />
//                 <p className="text-gray-600">No resumes found. Upload some resumes to get started!</p>
//               </div>
//             ) : (
//               <div className="grid gap-6">
//                 {allResumes.map((resume) => (
//                   <div key={resume.id} className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
//                     <div className="flex justify-between items-start mb-4">
//                       <div>
//                         <h3 className="text-xl font-bold text-gray-800">{resume.name || 'Unknown'}</h3>
//                         <p className="text-gray-600">{resume.email}</p>
//                         {resume.phone && <p className="text-gray-600">{resume.phone}</p>}
//                       </div>
//                       <button 
//                         onClick={() => {
//                           setResumeData({
//                             contact_info: {
//                               name: resume.name,
//                               email: resume.email,
//                               phone: resume.phone
//                             },
//                             technical_skills: resume.technical_skills,
//                             soft_skills: resume.soft_skills,
//                             programming_languages: resume.programming_languages,
//                             frameworks_tools: resume.frameworks_tools,
//                             certifications: resume.certifications,
//                             summary: resume.summary,
//                             experience_summary: resume.experience_summary,
//                             education_summary: resume.education_summary
//                           });
//                           setView('result');
//                         }}
//                         className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
//                       >
//                         View Details
//                       </button>
//                     </div>
                    
//                     {/* Skills preview */}
//                     <div className="grid md:grid-cols-2 gap-4">
//                       {resume.technical_skills && resume.technical_skills.length > 0 && (
//                         <div>
//                           <h4 className="font-semibold text-blue-600 mb-2">Technical Skills</h4>
//                           <div className="flex flex-wrap gap-1">
//                             {resume.technical_skills.slice(0, 5).map((skill, i) => (
//                               <span key={i} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
//                                 {skill}
//                               </span>
//                             ))}
//                             {resume.technical_skills.length > 5 && (
//                               <span className="text-gray-500 text-xs">+{resume.technical_skills.length - 5} more</span>
//                             )}
//                           </div>
//                         </div>
//                       )}
                      
//                       {resume.programming_languages && resume.programming_languages.length > 0 && (
//                         <div>
//                           <h4 className="font-semibold text-green-600 mb-2">Programming Languages</h4>
//                           <div className="flex flex-wrap gap-1">
//                             {resume.programming_languages.slice(0, 5).map((lang, i) => (
//                               <span key={i} className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
//                                 {lang}
//                               </span>
//                             ))}
//                             {resume.programming_languages.length > 5 && (
//                               <span className="text-gray-500 text-xs">+{resume.programming_languages.length - 5} more</span>
//                             )}
//                           </div>
//                         </div>
//                       )}
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             )}
//           </div>
//         )}

//         {/* Analytics view */}
//         {view === 'analytics' && !loading && (
//           <div>
//             <button 
//               onClick={() => setView('upload')}
//               className="flex items-center gap-2 text-blue-600 mb-6 hover:text-blue-800 transition-colors"
//             >
//               <ArrowLeft size={18} />
//               Back to upload
//             </button>

//             <h2 className="text-3xl font-bold mb-6 flex items-center gap-2">
//               <TrendingUp size={32} />
//               Skills Analytics Dashboard
//             </h2>

//             {analytics ? (
//               <div>
//                 <div className="bg-white p-6 rounded-lg shadow-md mb-6">
//                   <h3 className="text-xl font-semibold mb-2">Overview</h3>
//                   <p className="text-gray-600">
//                     Total Resumes Processed: <span className="font-bold text-blue-600">{analytics.total_resumes}</span>
//                   </p>
//                 </div>

//                 <div className="grid lg:grid-cols-2 gap-6">
//                   <AnalyticsChart 
//                     title="Most Common Technical Skills" 
//                     data={analytics.most_common_technical_skills}
//                     color="bg-blue-500"
//                   />
//                   <AnalyticsChart 
//                     title="Most Common Programming Languages" 
//                     data={analytics.most_common_programming_languages}
//                     color="bg-green-500"
//                   />
//                 </div>
                
//                 <AnalyticsChart 
//                   title="Most Common Frameworks & Tools" 
//                   data={analytics.most_common_frameworks_tools}
//                   color="bg-purple-500"
//                 />
//               </div>
//             ) : (
//               <div className="text-center py-12">
//                 <BarChart3 size={64} className="mx-auto text-gray-400 mb-4" />
//                 <p className="text-gray-600">No analytics data available. Process some resumes first!</p>
//               </div>
//             )}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

// export default App;


import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import Profile from './pages/Profile';
import ProtectedRoute from './components/ProtectedRoute';
import Landing from './pages/LandingPage';
import SignUp from './pages/SignUp';
import ApplicantDashboard from './pages/Dashboard/ApplicantDashboard';
import JobPostingForm from './pages/Recruiter/JobPostingFrom';
import ViewJobApplications from './pages/Recruiter/ViewJobApplications';

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path='/signup' element={<SignUp />} />
          <Route path='/home' element={<Landing />} />
          <Route path='/applicant-dashboard' element={<ApplicantDashboard />} />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/post-job"
            element={
              <ProtectedRoute >
                <JobPostingForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-jobs"
            element={
              <ProtectedRoute >
                <ViewJobApplications />
              </ProtectedRoute>
            }
          />

          <Route path="/" element={<Navigate to="/profile" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;