import { useEffect, useState } from 'react'
import { useResume } from '../../hooks/useResume'
import SkillsDisplay from '../../components/resume/SkillsDisplay'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { Link } from 'react-router-dom'

function ViewResume() {
  const [resume, setResume] = useState(null)
  const { getResume, loading, error } = useResume()

  useEffect(() => {
    const fetchResume = async () => {
      try {
        const data = await getResume()
        setResume(data)
      } catch (err) {
        console.error(err)
      }
    }
    fetchResume()
  }, [])

  if (loading) return <LoadingSpinner />
  if (error) return <div className="text-red-500">{error}</div>
  if (!resume) return (
    <div className="text-center py-12">
      <h2 className="text-xl font-medium text-gray-600">No resume found</h2>
      <p className="mt-4">
        <Link 
          to="/resume/upload" 
          className="text-indigo-600 hover:text-indigo-800 font-medium"
        >
          Upload your resume
        </Link> to get started
      </p>
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold leading-6 text-gray-900">
            {resume.name || 'My Resume'}
          </h1>
          <div className="mt-2 flex flex-wrap gap-4">
            {resume.email && <p className="text-gray-600">{resume.email}</p>}
            {resume.phone && <p className="text-gray-600">{resume.phone}</p>}
          </div>
        </div>
        
        <div className="px-4 py-5 sm:p-6">
          <SkillsDisplay 
            skills={resume.technical_skills} 
            title="Technical Skills" 
          />
          
          <SkillsDisplay 
            skills={resume.programming_languages} 
            title="Programming Languages" 
          />
          
          <SkillsDisplay 
            skills={resume.frameworks_tools} 
            title="Frameworks & Tools" 
          />
          
          <SkillsDisplay 
            skills={resume.soft_skills} 
            title="Soft Skills" 
          />
          
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Professional Summary</h3>
            <div className="prose prose-indigo">
              {resume.summary.split('\n').map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>
          </div>
          
          <div className="flex justify-end">
            <Link
              to="/resume/upload"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Update Resume
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ViewResume