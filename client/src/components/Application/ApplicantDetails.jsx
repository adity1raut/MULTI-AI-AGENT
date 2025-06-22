const ApplicantDetails = ({ applicant }) => {
  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          Applicant Information
        </h3>
      </div>
      <div className="px-4 py-5 sm:p-6">
        <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
          <div>
            <h4 className="text-sm font-medium text-gray-500">Name</h4>
            <p className="mt-1 text-sm text-gray-900">{applicant.name || 'Not provided'}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500">Email</h4>
            <p className="mt-1 text-sm text-gray-900">{applicant.email}</p>
          </div>
          <div className="sm:col-span-2">
            <h4 className="text-sm font-medium text-gray-500">Skills</h4>
            <div className="mt-1 flex flex-wrap gap-2">
              {applicant.technical_skills?.map((skill, index) => (
                <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {skill}
                </span>
              ))}
            </div>
          </div>
          <div className="sm:col-span-2">
            <h4 className="text-sm font-medium text-gray-500">Summary</h4>
            <p className="mt-1 text-sm text-gray-900 whitespace-pre-line">
              {applicant.summary || 'No summary available'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ApplicantDetails