import { Mail, User, Shield, Calendar, Edit3, Save } from 'lucide-react';

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

export default GeneralTab;