import { useEffect, useState } from 'react';
import { useAuth } from '../utils/auth.jsx';
import { getProfile, updateProfile } from '../utils/api.jsx';
import ApplicantProfile from '../components/Profile/ApplicantProfile';
import RequesterProfile from '../components/Profile/RequesterProfile';
import ProfileForm from '../components/Profile/ProfileForm';

export default function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
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
      {editMode ? (
        <div className="bg-white rounded-lg shadow-md p-6 max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Edit Profile</h1>
          <ProfileForm 
            user={profile} 
            onSubmit={handleUpdateProfile} 
            onCancel={() => setEditMode(false)}
          />
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold">My Profile</h1>
            <button
              onClick={() => setEditMode(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            >
              Edit Profile
            </button>
          </div>
          
          {user.role === 'applicant' ? (
            <ApplicantProfile profile={profile} />
          ) : (
            <RequesterProfile profile={profile} />
          )}
        </>
      )}
    </div>
  );
}