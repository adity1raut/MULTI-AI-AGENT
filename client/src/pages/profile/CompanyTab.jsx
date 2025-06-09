import { Building, Globe, Edit3, Save } from 'lucide-react';

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

export default CompanyTab;