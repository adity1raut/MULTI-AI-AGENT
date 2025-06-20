export default function RequesterProfile({ profile }) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex flex-col md:flex-row gap-8">
        <div className="md:w-1/3">
          <div className="flex flex-col items-center mb-6">
            <img 
              src={profile.photoURL || '/default-avatar.png'} 
              alt="Profile" 
              className="w-32 h-32 rounded-full object-cover mb-4"
            />
            <h2 className="text-xl font-bold">{profile.displayName}</h2>
            <p className="text-gray-600">{profile.email}</p>
          </div>

          {profile.additionalInfo?.linkedin && (
            <div className="mb-4">
              <a 
                href={profile.additionalInfo.linkedin} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline flex items-center"
              >
                <span className="mr-2">LinkedIn</span>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
              </a>
            </div>
          )}

          {profile.additionalInfo?.bio && (
            <div className="mt-4">
              <h3 className="font-medium text-gray-700 mb-2">About</h3>
              <p className="text-gray-600 whitespace-pre-line">{profile.additionalInfo.bio}</p>
            </div>
          )}

          <div className="mt-6">
            <a 
              href="/profile/edit" 
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Edit Profile
            </a>
          </div>
        </div>

        <div className="md:w-2/3">
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Recruiter Information</h3>
            <p className="text-gray-600 mb-4">
              As a recruiter, you can post jobs and review applicants through your dashboard.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div className="bg-white p-4 rounded-lg shadow">
                <h4 className="font-medium text-gray-700">Posted Jobs</h4>
                <p className="text-2xl font-bold mt-2">12</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <h4 className="font-medium text-gray-700">Active Applicants</h4>
                <p className="text-2xl font-bold mt-2">45</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}