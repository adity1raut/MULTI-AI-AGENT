import { Bell, DollarSign, Edit3, Save } from 'lucide-react';

const PreferencesTab = ({ 
  formData, 
  handleInputChange, 
  isEditing, 
  setIsEditing, 
  updateLoading, 
  handleUpdateProfile,
  profile
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">Preferences</h3>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="flex items-center px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
        >
          <Edit3 size={16} className="mr-2" />
          {isEditing ? 'Cancel' : 'Edit'}
        </button>
      </div>

      {profile?.role === 'applicant' && (
        <>
          <div className="bg-gray-800 border border-gray-700 p-4 rounded-lg">
            <h4 className="flex items-center mb-4 text-sm font-medium text-gray-300">
              <DollarSign size={16} className="mr-2" />
              Job Preferences
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 text-xs text-gray-500">Desired Role</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.jobPreferences.desiredRole}
                    onChange={(e) => handleInputChange('jobPreferences.desiredRole', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-white text-sm"
                  />
                ) : (
                  <p className="text-sm text-white">{formData.jobPreferences.desiredRole || 'Not set'}</p>
                )}
              </div>
              <div>
                <label className="block mb-2 text-xs text-gray-500">Salary Range</label>
                {isEditing ? (
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      value={formData.jobPreferences.salaryRange.min}
                      onChange={(e) => handleInputChange('jobPreferences.salaryRange.min', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-white text-sm"
                      placeholder="Min"
                    />
                    <span className="text-gray-400">to</span>
                    <input
                      type="number"
                      value={formData.jobPreferences.salaryRange.max}
                      onChange={(e) => handleInputChange('jobPreferences.salaryRange.max', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-white text-sm"
                      placeholder="Max"
                    />
                  </div>
                ) : (
                  <p className="text-sm text-white">
                    {formData.jobPreferences.salaryRange.min || formData.jobPreferences.salaryRange.max
                      ? `$${formData.jobPreferences.salaryRange.min} - $${formData.jobPreferences.salaryRange.max}`
                      : 'Not set'}
                  </p>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      <div className="bg-gray-800 border border-gray-700 p-4 rounded-lg">
        <h4 className="flex items-center mb-4 text-sm font-medium text-gray-300">
          <Bell size={16} className="mr-2" />
          Notification Preferences
        </h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm text-gray-400">Email Notifications</label>
            {isEditing ? (
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.preferences.notifications.emailNotifications}
                  onChange={(e) => handleInputChange('preferences.notifications.emailNotifications', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            ) : (
              <span className={`px-2 py-1 text-xs rounded-full ${formData.preferences.notifications.emailNotifications ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                {formData.preferences.notifications.emailNotifications ? 'Enabled' : 'Disabled'}
              </span>
            )}
          </div>
          <div className="flex items-center justify-between">
            <label className="text-sm text-gray-400">Application Alerts</label>
            {isEditing ? (
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.preferences.notifications.applicationAlerts}
                  onChange={(e) => handleInputChange('preferences.notifications.applicationAlerts', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            ) : (
              <span className={`px-2 py-1 text-xs rounded-full ${formData.preferences.notifications.applicationAlerts ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                {formData.preferences.notifications.applicationAlerts ? 'Enabled' : 'Disabled'}
              </span>
            )}
          </div>
        </div>
      </div>

      {isEditing && (
        <button
          onClick={() => handleUpdateProfile('preferences')}
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

export default PreferencesTab;