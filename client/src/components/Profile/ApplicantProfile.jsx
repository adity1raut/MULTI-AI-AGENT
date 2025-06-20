import { useEffect, useState } from 'react';
import { useAuth } from '../../utils/auth.jsx';
import { getProfile, updateProfile } from '../../utils/api.jsx';
import ResumeView from '../Resume/ResumeView';
import ProfileForm from '../Profile/ProfileForm';

export default function ApplicantProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const data = await getProfile();
        setProfile(data.profile);
      } catch (err) {
        setError(err.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfile();
  }, []);

  const handleUpdateProfile = async (formData) => {
    try {
      setLoading(true);
      const data = await updateProfile(formData);
      setProfile(data.profile);
      setEditMode(false);
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-8">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
    </div>;
  }

  if (error) {
    return <div className="p-4 bg-red-100 text-red-700 rounded">{error}</div>;
  }

  if (!profile) {
    return <div className="text-gray-500 text-center py-8">No profile found</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">My Profile</h1>
        <button
          onClick={() => setEditMode(!editMode)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          {editMode ? 'Cancel' : 'Edit Profile'}
        </button>
      </div>

      {editMode ? (
        <div className="bg-white rounded-lg shadow-md p-6 max-w-3xl mx-auto">
          <h2 className="text-xl font-bold mb-6">Edit Profile</h2>
          <ProfileForm 
            user={profile} 
            onSubmit={handleUpdateProfile}
          />
        </div>
      ) : (
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

              {profile.additionalInfo?.github && (
                <div className="mb-4">
                  <a 
                    href={profile.additionalInfo.github} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-gray-800 hover:underline flex items-center"
                  >
                    <span className="mr-2">GitHub</span>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                  </a>
                </div>
              )}

              {profile.additionalInfo?.portfolio && (
                <div className="mb-4">
                  <a 
                    href={profile.additionalInfo.portfolio} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Portfolio Website
                  </a>
                </div>
              )}

              {profile.additionalInfo?.bio && (
                <div className="mt-4">
                  <h3 className="font-medium text-gray-700 mb-2">About</h3>
                  <p className="text-gray-600 whitespace-pre-line">{profile.additionalInfo.bio}</p>
                </div>
              )}
            </div>

            <div className="md:w-2/3">
              <ResumeView />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}