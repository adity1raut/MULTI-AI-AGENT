import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

function Profile() {
  const { currentUser, logout } = useAuth()
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    if (currentUser) {
      // In a real app, you might fetch additional profile data here
      setProfile({
        name: currentUser.displayName,
        email: currentUser.email,
        role: currentUser.role,
        photoURL: currentUser.photoURL
      })
    }
  }, [currentUser])

  if (!profile) return null

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">Your Profile</h1>
        </div>
        
        <div className="px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
            <div>
              <h4 className="text-sm font-medium text-gray-500">Name</h4>
              <p className="mt-1 text-sm text-gray-900">{profile.name || 'Not provided'}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">Email</h4>
              <p className="mt-1 text-sm text-gray-900">{profile.email}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">Account Type</h4>
              <p className="mt-1 text-sm text-gray-900">
                {profile.role === 'applicant' ? 'Job Applicant' : 'Job Requester'}
              </p>
            </div>
            {profile.photoURL && (
              <div>
                <h4 className="text-sm font-medium text-gray-500">Profile Photo</h4>
                <img 
                  src={profile.photoURL} 
                  alt="Profile" 
                  className="mt-1 h-16 w-16 rounded-full"
                />
              </div>
            )}
          </div>
          
          <div className="mt-8 flex justify-end">
            <button
              onClick={logout}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile