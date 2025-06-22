import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useApplications } from '../../hooks/useApplications'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import ApplicantDetails from '../../components/Application/ApplicantDetails'

function ViewApplicants() {
  const { jobId } = useParams()
  const [applicants, setApplicants] = useState([])
  const [selectedApplicant, setSelectedApplicant] = useState(null)
  const { getJobApplicants, loading, error } = useApplications()

  useEffect(() => {
    const fetchApplicants = async () => {
      try {
        const data = await getJobApplicants(jobId)
        setApplicants(data.applicants)
        if (data.applicants.length > 0) {
          setSelectedApplicant(data.applicants[0])
        }
      } catch (err) {
        console.error(err)
      }
    }
    fetchApplicants()
  }, [jobId])

  if (loading) return <LoadingSpinner />
  if (error) return <div className="text-red-500">{error}</div>

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">Job Applicants</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Applicants ({applicants.length})
              </h3>
            </div>
            <div className="divide-y divide-gray-200">
              {applicants.map(applicant => (
                <div 
                  key={applicant.applicant_id}
                  onClick={() => setSelectedApplicant(applicant)}
                  className={`px-4 py-4 hover:bg-gray-50 cursor-pointer ${selectedApplicant?.applicant_id === applicant.applicant_id ? 'bg-indigo-50' : ''}`}
                >
                  <h4 className="text-sm font-medium text-gray-900">{applicant.name || 'No name provided'}</h4>
                  <p className="mt-1 text-sm text-gray-500">{applicant.email}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {applicant.technical_skills?.slice(0, 3).map((skill, index) => (
                      <span key={index} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="lg:col-span-2">
          {selectedApplicant ? (
            <ApplicantDetails applicant={selectedApplicant} />
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">Select an applicant to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ViewApplicants