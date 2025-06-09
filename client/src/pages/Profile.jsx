import { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { 
  User, 
  Mail, 
  Calendar, 
  Shield, 
  Camera, 
  Edit3, 
  Save, 
  X, 
  CheckCircle,
  AlertCircle,
  Clock,
  Briefcase
} from 'lucide-react';
import Sidebar from "../components/Sidebar";

const Profile = () => {
  const { user, getUserProfile, updateUserProfile, loading } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    displayName: '',
    photoURL: '',
    additionalInfo: {
      bio: '',
      phone: '',
      location: '',
      skills: '',
      experience: '',
      website: ''
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Load profile data
  useEffect(() => {
    const loadProfile = async () => {
      if (user) {
        try {
          const profileData = await getUserProfile();
          setProfile(profileData);
          
          // Initialize edit form with current data
          setEditForm({
            displayName: profileData.displayName || '',
            photoURL: profileData.photoURL || '',
            additionalInfo: {
              bio: profileData.additionalInfo?.bio || '',
              phone: profileData.additionalInfo?.phone || '',
              location: profileData.additionalInfo?.location || '',
              skills: profileData.additionalInfo?.skills || '',
              experience: profileData.additionalInfo?.experience || '',
              website: profileData.additionalInfo?.website || ''
            }
          });
        } catch (error) {
          setError('Failed to load profile data');
          console.error('Profile load error:', error);
        }
      }
    };

    loadProfile();
  }, [user, getUserProfile]);

  // Handle form input changes
  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setEditForm(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setEditForm(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  // Handle profile update
  const handleSaveProfile = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const updatedProfile = await updateUserProfile(editForm);
      setProfile(updatedProfile);
      setIsEditing(false);
      setSuccess('Profile updated successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      setError(error.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    if (profile) {
      setEditForm({
        displayName: profile.displayName || '',
        photoURL: profile.photoURL || '',
        additionalInfo: {
          bio: profile.additionalInfo?.bio || '',
          phone: profile.additionalInfo?.phone || '',
          location: profile.additionalInfo?.location || '',
          skills: profile.additionalInfo?.skills || '',
          experience: profile.additionalInfo?.experience || '',
          website: profile.additionalInfo?.website || ''
        }
      });
    }
    setIsEditing(false);
    setError(null);
  };

  // Format date
  const formatDate = (dateValue) => {
    if (!dateValue) return 'N/A';
    
    try {
      let date;
      if (dateValue._seconds) {
        // Firestore timestamp
        date = new Date(dateValue._seconds * 1000);
      } else if (typeof dateValue === 'string') {
        date = new Date(dateValue);
      } else {
        date = dateValue;
      }
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  if (loading || !profile) {
    return (
      <div className="min-h-screen bg-black text-white flex">
        <div className="sticky top-0 h-screen bg-black">
          <Sidebar isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen(!isSidebarOpen)} />
        </div>
        <div className={`flex-1 transition-margin duration-200 ease-in-out ${isSidebarOpen ? "ml-64" : "ml-0"} flex items-center justify-center`}>
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span>Loading profile...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex">
      <div className="sticky top-0 h-screen bg-black">
        <Sidebar isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen(!isSidebarOpen)} />
      </div>

      <div className={`flex-1 transition-margin duration-200 ease-in-out ${isSidebarOpen ? "ml-64" : "ml-0"} flex flex-col`}>
        {/* Header */}
        <div className="p-6 border-b border-gray-800 bg-black">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Profile</h2>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                <Edit3 size={16} />
                <span>Edit Profile</span>
              </button>
            ) : (
              <div className="flex space-x-2">
                <button
                  onClick={handleSaveProfile}
                  disabled={isLoading}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors"
                >
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Save size={16} />
                  )}
                  <span>{isLoading ? 'Saving...' : 'Save'}</span>
                </button>
                <button
                  onClick={handleCancelEdit}
                  disabled={isLoading}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 rounded-lg transition-colors"
                >
                  <X size={16} />
                  <span>Cancel</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Profile Content */}
        <div className="flex-1 p-6 overflow-y-auto bg-black">
          {/* Status Messages */}
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-900/50 border border-red-800 text-red-200 flex items-start">
              <AlertCircle size={20} className="mr-2 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 rounded-lg bg-green-900/50 border border-green-800 text-green-200 flex items-start">
              <CheckCircle size={20} className="mr-2 flex-shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          <div className="max-w-4xl mx-auto">
            {/* Profile Header Card */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 mb-6">
              <div className="flex flex-col md:flex-row items-start md:items-center space-y-6 md:space-y-0 md:space-x-6">
                {/* Profile Picture */}
                <div className="relative">
                  {isEditing ? (
                    <div className="space-y-2">
                      <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-800 border-2 border-gray-700">
                        {editForm.photoURL ? (
                          <img
                            src={editForm.photoURL}
                            alt="Profile"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <User size={32} className="text-gray-400" />
                          </div>
                        )}
                      </div>
                      <input
                        type="url"
                        placeholder="Photo URL"
                        className="w-32 px-2 py-1 text-xs bg-gray-800 border border-gray-700 rounded text-white"
                        value={editForm.photoURL}
                        onChange={(e) => handleInputChange('photoURL', e.target.value)}
                      />
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-800 border-2 border-gray-700">
                      {profile.photoURL ? (
                        <img
                          src={profile.photoURL}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <User size={32} className="text-gray-400" />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Profile Info */}
                <div className="flex-1">
                  <div className="space-y-4">
                    {/* Name */}
                    <div>
                      {isEditing ? (
                        <input
                          type="text"
                          placeholder="Display Name"
                          className="text-2xl font-bold bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white w-full md:w-auto"
                          value={editForm.displayName}
                          onChange={(e) => handleInputChange('displayName', e.target.value)}
                        />
                      ) : (
                        <h1 className="text-2xl font-bold">{profile.displayName || 'No name set'}</h1>
                      )}
                    </div>

                    {/* Role Badge */}
                    <div className="flex items-center space-x-2">
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                        profile.role === 'requester' 
                          ? 'bg-blue-900/50 text-blue-300 border border-blue-800' 
                          : 'bg-green-900/50 text-green-300 border border-green-800'
                      }`}>
                        <div className="flex items-center space-x-1">
                          {profile.role === 'requester' ? <Briefcase size={14} /> : <User size={14} />}
                          <span className="capitalize">{profile.role}</span>
                        </div>
                      </div>
                      {profile.emailVerified && (
                        <div className="px-2 py-1 bg-green-900/30 text-green-400 rounded-full text-xs flex items-center space-x-1">
                          <CheckCircle size={12} />
                          <span>Verified</span>
                        </div>
                      )}
                    </div>

                    {/* Bio */}
                    <div>
                      {isEditing ? (
                        <textarea
                          placeholder="Tell us about yourself..."
                          rows="3"
                          className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white resize-none"
                          value={editForm.additionalInfo.bio}
                          onChange={(e) => handleInputChange('additionalInfo.bio', e.target.value)}
                        />
                      ) : (
                        <p className="text-gray-300">
                          {profile.additionalInfo?.bio || 'No bio available'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Details Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Contact Information */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <h3 className="text-xl font-semibold mb-4 flex items-center">
                  <Mail className="mr-2" size={20} />
                  Contact Information
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Mail size={16} className="text-gray-400" />
                    <span className="text-gray-300">{profile.email}</span>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <span className="text-gray-400 text-sm w-16">Phone:</span>
                    {isEditing ? (
                      <input
                        type="tel"
                        placeholder="Phone number"
                        className="flex-1 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white"
                        value={editForm.additionalInfo.phone}
                        onChange={(e) => handleInputChange('additionalInfo.phone', e.target.value)}
                      />
                    ) : (
                      <span className="text-gray-300">
                        {profile.additionalInfo?.phone || 'Not provided'}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-3">
                    <span className="text-gray-400 text-sm w-16">Location:</span>
                    {isEditing ? (
                      <input
                        type="text"
                        placeholder="City, Country"
                        className="flex-1 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white"
                        value={editForm.additionalInfo.location}
                        onChange={(e) => handleInputChange('additionalInfo.location', e.target.value)}
                      />
                    ) : (
                      <span className="text-gray-300">
                        {profile.additionalInfo?.location || 'Not provided'}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-3">
                    <span className="text-gray-400 text-sm w-16">Website:</span>
                    {isEditing ? (
                      <input
                        type="url"
                        placeholder="https://yourwebsite.com"
                        className="flex-1 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white"
                        value={editForm.additionalInfo.website}
                        onChange={(e) => handleInputChange('additionalInfo.website', e.target.value)}
                      />
                    ) : (
                      <span className="text-gray-300">
                        {profile.additionalInfo?.website ? (
                          <a 
                            href={profile.additionalInfo.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 underline"
                          >
                            {profile.additionalInfo.website}
                          </a>
                        ) : (
                          'Not provided'
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Account Information */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <h3 className="text-xl font-semibold mb-4 flex items-center">
                  <Shield className="mr-2" size={20} />
                  Account Information
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Calendar size={16} className="text-gray-400" />
                    <span className="text-sm text-gray-400">Joined:</span>
                    <span className="text-gray-300">{formatDate(profile.createdAt)}</span>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Clock size={16} className="text-gray-400" />
                    <span className="text-sm text-gray-400">Last Login:</span>
                    <span className="text-gray-300">{formatDate(profile.lastLogin)}</span>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span className="text-sm text-gray-400">User ID:</span>
                    <span className="text-gray-300 font-mono text-xs">{profile.uid}</span>
                  </div>
                </div>
              </div>

              {/* Professional Information */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 lg:col-span-2">
                <h3 className="text-xl font-semibold mb-4 flex items-center">
                  <Briefcase className="mr-2" size={20} />
                  Professional Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Skills</label>
                    {isEditing ? (
                      <textarea
                        placeholder="List your skills (comma separated)"
                        rows="3"
                        className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white resize-none"
                        value={editForm.additionalInfo.skills}
                        onChange={(e) => handleInputChange('additionalInfo.skills', e.target.value)}
                      />
                    ) : (
                      <p className="text-gray-300">
                        {profile.additionalInfo?.skills || 'No skills listed'}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Experience</label>
                    {isEditing ? (
                      <textarea
                        placeholder="Describe your experience"
                        rows="3"
                        className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white resize-none"
                        value={editForm.additionalInfo.experience}
                        onChange={(e) => handleInputChange('additionalInfo.experience', e.target.value)}
                      />
                    ) : (
                      <p className="text-gray-300">
                        {profile.additionalInfo?.experience || 'No experience listed'}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-800 bg-black text-center text-gray-500">
          <p>© {new Date().getFullYear()} Pravesh. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default Profile ;