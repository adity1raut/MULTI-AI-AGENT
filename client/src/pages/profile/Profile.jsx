import { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { getProfile, updateProfile } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { LogOut, Mail, User, Shield, Calendar, Edit3, Save, Building, Globe, Bell, DollarSign, MapPin, Briefcase, Linkedin, Github, X, Camera } from 'lucide-react';
import Sidebar from "../../components/Sidebar";
import ProfileHeader from './ProfileHeader';
import ProfileTabs from './ProfileTabs';
import ProfessionalTab from './ProfessionalTab';
import PreferencesTab from './PreferencesTab';

const Profile = () => {
  const { user, signOut } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [updateLoading, setUpdateLoading] = useState(false);
  const navigate = useNavigate();

  // Form states for different sections
  const [formData, setFormData] = useState({
    displayName: '',
    companyInfo: {
      companyName: '',
      companySize: '',
      industry: '',
      website: '',
      description: ''
    },
    profile: {
      skills: [],
      experience: '',
      education: [],
      location: '',
      bio: '',
      resume: '',
      portfolio: '',
      socialLinks: {
        linkedin: '',
        github: '',
        website: ''
      }
    },
    jobPreferences: {
      desiredRole: '',
      salaryRange: { min: 0, max: 0 },
      jobType: [],
      preferredLocations: [],
      industries: []
    },
    preferences: {
      notifications: {
        emailNotifications: true,
        applicationAlerts: true,
        jobPostingReminders: true
      },
      jobAlerts: true,
      profileVisibility: 'public'
    }
  });

  // GeneralTab Component
  const GeneralTab = ({ 
    profile, 
    formData, 
    handleInputChange, 
    isEditing, 
    setIsEditing, 
    updateLoading, 
    handleUpdateProfile 
  }) => {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold">General Information</h3>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Edit3 size={16} className="mr-2" />
            {isEditing ? 'Cancel' : 'Edit'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Email */}
          <div className="bg-gray-800 border border-gray-700 p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <Mail size={18} className="text-blue-400 mr-2" />
              <p className="text-sm text-gray-400">Email Address</p>
            </div>
            <p className="font-medium text-white">{profile?.email || 'Not provided'}</p>
          </div>

          {/* Display Name */}
          <div className="bg-gray-800 border border-gray-700 p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <User size={18} className="text-green-400 mr-2" />
              <p className="text-sm text-gray-400">Display Name</p>
            </div>
            {isEditing ? (
              <input
                type="text"
                value={formData.displayName}
                onChange={(e) => handleInputChange('displayName', e.target.value)}
                placeholder="Enter display name"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400"
              />
            ) : (
              <p className="font-medium text-white">{profile?.displayName || 'Not set'}</p>
            )}
          </div>

          {/* Role */}
          <div className="bg-gray-800 border border-gray-700 p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <Shield size={18} className="text-purple-400 mr-2" />
              <p className="text-sm text-gray-400">Account Type</p>
            </div>
            <p className="font-medium text-white capitalize">{profile?.role || 'User'}</p>
          </div>

          {/* Member Since */}
          <div className="bg-gray-800 border border-gray-700 p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <Calendar size={18} className="text-purple-400 mr-2" />
              <p className="text-sm text-gray-400">Member Since</p>
            </div>
            <p className="font-medium text-white">
              {profile?.createdAt ? new Date(profile.createdAt.seconds * 1000).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              }) : 'Not available'}
            </p>
          </div>
        </div>

        {isEditing && (
          <div className="flex space-x-4">
            <button
              onClick={() => handleUpdateProfile('general')}
              disabled={updateLoading}
              className="flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-500 text-white rounded-lg hover:from-purple-700 hover:to-blue-600 transition-all duration-300 disabled:opacity-50"
            >
              <Save size={16} className="mr-2" />
              {updateLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>
    );
  };

  // CompanyTab Component
  const CompanyTab = ({ 
    formData, 
    handleInputChange, 
    isEditing, 
    setIsEditing, 
    updateLoading, 
    handleUpdateProfile 
  }) => {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold">Company Information</h3>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Edit3 size={16} className="mr-2" />
            {isEditing ? 'Cancel' : 'Edit'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-800 border border-gray-700 p-4 rounded-lg">
            <label className="flex items-center mb-2 text-sm text-gray-400">
              <Building size={16} className="mr-2" />
              Company Name
            </label>
            {isEditing ? (
              <input
                type="text"
                value={formData.companyInfo.companyName}
                onChange={(e) => handleInputChange('companyInfo.companyName', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-white"
              />
            ) : (
              <p className="font-medium text-white">{formData.companyInfo.companyName || 'Not set'}</p>
            )}
          </div>

          <div className="bg-gray-800 border border-gray-700 p-4 rounded-lg">
            <label className="flex items-center mb-2 text-sm text-gray-400">
              <Globe size={16} className="mr-2" />
              Website
            </label>
            {isEditing ? (
              <input
                type="url"
                value={formData.companyInfo.website}
                onChange={(e) => handleInputChange('companyInfo.website', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-white"
              />
            ) : (
              <p className="font-medium text-white">{formData.companyInfo.website || 'Not set'}</p>
            )}
          </div>

          <div className="bg-gray-800 border border-gray-700 p-4 rounded-lg">
            <label className="block mb-2 text-sm text-gray-400">Company Size</label>
            {isEditing ? (
              <select
                value={formData.companyInfo.companySize}
                onChange={(e) => handleInputChange('companyInfo.companySize', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-white"
              >
                <option value="">Select company size</option>
                <option value="1-10">1-10 employees</option>
                <option value="11-50">11-50 employees</option>
                <option value="51-200">51-200 employees</option>
                <option value="201-1000">201-1000 employees</option>
                <option value="1000+">1000+ employees</option>
              </select>
            ) : (
              <p className="font-medium text-white">{formData.companyInfo.companySize || 'Not set'}</p>
            )}
          </div>

          <div className="bg-gray-800 border border-gray-700 p-4 rounded-lg">
            <label className="block mb-2 text-sm text-gray-400">Industry</label>
            {isEditing ? (
              <input
                type="text"
                value={formData.companyInfo.industry}
                onChange={(e) => handleInputChange('companyInfo.industry', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-white"
              />
            ) : (
              <p className="font-medium text-white">{formData.companyInfo.industry || 'Not set'}</p>
            )}
          </div>
        </div>

        <div className="bg-gray-800 border border-gray-700 p-4 rounded-lg">
          <label className="block mb-2 text-sm text-gray-400">Company Description</label>
          {isEditing ? (
            <textarea
              value={formData.companyInfo.description}
              onChange={(e) => handleInputChange('companyInfo.description', e.target.value)}
              rows={4}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-white"
            />
          ) : (
            <p className="font-medium text-white">{formData.companyInfo.description || 'Not set'}</p>
          )}
        </div>

        {isEditing && (
          <button
            onClick={() => handleUpdateProfile('company')}
            disabled={updateLoading}
            className="flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-500 text-white rounded-lg hover:from-purple-700 hover:to-blue-600 transition-all duration-300 disabled:opacity-50"
          >
            <Save size={16} className="mr-2" />
            {updateLoading ? 'Saving...' : 'Save Changes'}
          </button>
        )}
      </div>
    );
  };

  useEffect(() => {
    let isMounted = true;

    const fetchProfile = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setError(null);
        const response = await getProfile();
        
        if (isMounted) {
          setProfile(response.profile);
          setFormData({
            displayName: response.profile.displayName || '',
            companyInfo: response.profile.companyInfo || {
              companyName: '',
              companySize: '',
              industry: '',
              website: '',
              description: ''
            },
            profile: response.profile.profile || {
              skills: [],
              experience: '',
              education: [],
              location: '',
              bio: '',
              resume: '',
              portfolio: '',
              socialLinks: {
                linkedin: '',
                github: '',
                website: ''
              }
            },
            jobPreferences: response.profile.jobPreferences || {
              desiredRole: '',
              salaryRange: { min: 0, max: 0 },
              jobType: [],
              preferredLocations: [],
              industries: []
            },
            preferences: {
              ...response.profile.preferences,
              notifications: response.profile.preferences?.notifications || {
                emailNotifications: true,
                applicationAlerts: true,
                jobPostingReminders: true
              }
            }
          });
        }
      } catch (error) {
        console.error('Fetch profile error:', error);
        if (isMounted) {
          setError('Failed to load profile');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchProfile();

    return () => {
      isMounted = false;
    };
  }, [user]);

  const handleUpdateProfile = async (section = null) => {
    try {
      setUpdateLoading(true);
      setError(null);
      
      let updateData = {};
      
      if (section) {
        switch (section) {
          case 'general':
            updateData = { displayName: formData.displayName };
            break;
          case 'company':
            updateData = { companyInfo: formData.companyInfo };
            break;
          case 'professional':
            updateData = { profile: formData.profile };
            break;
          case 'preferences':
            updateData = { 
              jobPreferences: formData.jobPreferences,
              preferences: formData.preferences
            };
            break;
          default:
            updateData = formData;
        }
      } else {
        updateData = formData;
      }

      const response = await updateProfile(updateData);
      setProfile(response.profile);
      setIsEditing(false);
      
      // Show success message
      const successMessage = document.createElement('div');
      successMessage.className = 'fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50';
      successMessage.textContent = 'Profile updated successfully!';
      document.body.appendChild(successMessage);
      setTimeout(() => document.body.removeChild(successMessage), 3000);
      
    } catch (error) {
      console.error('Update profile error:', error);
      setError(error.response?.data?.error || 'Failed to update profile');
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      setError('Failed to logout');
    }
  };

  const handleInputChange = (path, value) => {
    setFormData(prev => {
      const newData = { ...prev };
      const keys = path.split('.');
      let current = newData;
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {};
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return newData;
    });
  };

  const addSkill = (skill) => {
    if (skill && !formData.profile.skills.includes(skill)) {
      handleInputChange('profile.skills', [...formData.profile.skills, skill]);
    }
  };

  const removeSkill = (skillToRemove) => {
    handleInputChange('profile.skills', formData.profile.skills.filter(skill => skill !== skillToRemove));
  };

  const addEducation = (education) => {
    handleInputChange('profile.education', [...formData.profile.education, education]);
  };

  const removeEducation = (index) => {
    const newEducation = formData.profile.education.filter((_, i) => i !== index);
    handleInputChange('profile.education', newEducation);
  };

  const updateEducation = (index, field, value) => {
    const newEducation = [...formData.profile.education];
    newEducation[index] = { ...newEducation[index], [field]: value };
    handleInputChange('profile.education', newEducation);
  };

  const addJobType = (type) => {
    if (type && !formData.jobPreferences.jobType.includes(type)) {
      handleInputChange('jobPreferences.jobType', [...formData.jobPreferences.jobType, type]);
    }
  };

  const removeJobType = (typeToRemove) => {
    handleInputChange('jobPreferences.jobType', 
      formData.jobPreferences.jobType.filter(type => type !== typeToRemove)
    );
  };

  const addPreferredLocation = (location) => {
    if (location && !formData.jobPreferences.preferredLocations.includes(location)) {
      handleInputChange('jobPreferences.preferredLocations', 
        [...formData.jobPreferences.preferredLocations, location]
      );
    }
  };

  const removePreferredLocation = (locationToRemove) => {
    handleInputChange('jobPreferences.preferredLocations', 
      formData.jobPreferences.preferredLocations.filter(location => location !== locationToRemove)
    );
  };

  const addIndustry = (industry) => {
    if (industry && !formData.jobPreferences.industries.includes(industry)) {
      handleInputChange('jobPreferences.industries', 
        [...formData.jobPreferences.industries, industry]
      );
    }
  };

  const removeIndustry = (industryToRemove) => {
    handleInputChange('jobPreferences.industries', 
      formData.jobPreferences.industries.filter(industry => industry !== industryToRemove)
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex">
        <div className="sticky top-0 h-screen bg-black">
          <Sidebar isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen(!isSidebarOpen)} />
        </div>
        <div className={`flex-1 transition-margin duration-200 ease-in-out ${isSidebarOpen ? "ml-64" : "ml-0"} flex flex-col`}>
          <div className="p-6 border-b border-gray-800 bg-black">
            <h2 className="text-2xl font-bold">Profile</h2>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-gray-400">Loading your profile...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="min-h-screen bg-black text-white flex">
        <div className="sticky top-0 h-screen bg-black">
          <Sidebar isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen(!isSidebarOpen)} />
        </div>
        <div className={`flex-1 transition-margin duration-200 ease-in-out ${isSidebarOpen ? "ml-64" : "ml-0"} flex flex-col`}>
          <div className="p-6 border-b border-gray-800 bg-black">
            <h2 className="text-2xl font-bold">Profile</h2>
          </div>
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="max-w-md w-full bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl p-8 text-center space-y-4">
              <div className="text-red-400 bg-red-900/50 border border-red-800 p-3 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <span>{error}</span>
              </div>
              <button 
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-500 text-white rounded-lg hover:from-purple-700 hover:to-blue-600 transition-all duration-300"
              >
                Retry
              </button>
            </div>
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
        <div className="p-6 border-b border-gray-800 bg-black">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Profile</h2>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>

        <div className="flex-1 p-6 overflow-y-auto bg-black">
          <div className="max-w-4xl mx-auto">
            <ProfileHeader 
              profile={profile} 
              user={user}
              isEditing={isEditing}
              setIsEditing={setIsEditing}
            />
            <ProfileTabs 
              profile={profile} 
              activeTab={activeTab} 
              setActiveTab={setActiveTab} 
            />

            {/* Tab Content */}
            <div className="bg-gray-900 border border-gray-800 rounded-b-2xl p-8">
              {error && (
                <div className="mb-6 p-3 rounded-lg bg-red-900/50 border border-red-800 text-red-400 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  {error}
                </div>
              )}

              {activeTab === 'general' && (
                <GeneralTab
                  profile={profile}
                  formData={formData}
                  handleInputChange={handleInputChange}
                  isEditing={isEditing}
                  setIsEditing={setIsEditing}
                  updateLoading={updateLoading}
                  handleUpdateProfile={handleUpdateProfile}
                />
              )}

              {activeTab === 'company' && (
                <CompanyTab
                  profile={profile}
                  formData={formData}
                  handleInputChange={handleInputChange}
                  isEditing={isEditing}
                  setIsEditing={setIsEditing}
                  updateLoading={updateLoading}
                  handleUpdateProfile={handleUpdateProfile}
                />
              )}

              {activeTab === 'professional' && (
                <ProfessionalTab
                  profile={profile}
                  formData={formData}
                  handleInputChange={handleInputChange}
                  addSkill={addSkill}
                  removeSkill={removeSkill}
                  isEditing={isEditing}
                  setIsEditing={setIsEditing}
                  updateLoading={updateLoading}
                  handleUpdateProfile={handleUpdateProfile}
                />
              )}

              {activeTab === 'preferences' && (
                <PreferencesTab
                  profile={profile}
                  formData={formData}
                  handleInputChange={handleInputChange}
                  isEditing={isEditing}
                  setIsEditing={setIsEditing}
                  updateLoading={updateLoading}
                  handleUpdateProfile={handleUpdateProfile}
                />
              )}
            </div>

            {/* Action Buttons */}
            {isEditing && (
              <div className="mt-6 flex justify-end space-x-4">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-6 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors"
                  disabled={updateLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleUpdateProfile()}
                  disabled={updateLoading}
                  className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-500 text-white rounded-lg hover:from-purple-700 hover:to-blue-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {updateLoading && (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  )}
                  <span>{updateLoading ? 'Saving...' : 'Save All Changes'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;