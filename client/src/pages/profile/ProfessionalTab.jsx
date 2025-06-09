import { useState } from 'react';
import { MapPin, Briefcase, Linkedin, Github, Globe, X, Edit3, Save } from 'lucide-react';

const ProfessionalTab = ({ 
  formData, 
  handleInputChange, 
  isEditing, 
  setIsEditing, 
  updateLoading, 
  handleUpdateProfile,
  addSkill,
  removeSkill
}) => {
  const [newSkill, setNewSkill] = useState('');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">Professional Information</h3>
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
            <MapPin size={16} className="mr-2" />
            Location
          </label>
          {isEditing ? (
            <input
              type="text"
              value={formData.profile.location}
              onChange={(e) => handleInputChange('profile.location', e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-white"
            />
          ) : (
            <p className="font-medium text-white">{formData.profile.location || 'Not set'}</p>
          )}
        </div>

        <div className="bg-gray-800 border border-gray-700 p-4 rounded-lg">
          <label className="flex items-center mb-2 text-sm text-gray-400">
            <Briefcase size={16} className="mr-2" />
            Experience
          </label>
          {isEditing ? (
            <input
              type="text"
              value={formData.profile.experience}
              onChange={(e) => handleInputChange('profile.experience', e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-white"
            />
          ) : (
            <p className="font-medium text-white">{formData.profile.experience || 'Not set'}</p>
          )}
        </div>
      </div>

      {/* Skills */}
      <div className="bg-gray-800 border border-gray-700 p-4 rounded-lg">
        <label className="block mb-2 text-sm text-gray-400">Skills</label>
        <div className="flex flex-wrap gap-2 mb-4">
          {formData.profile.skills.map((skill, index) => (
            <span
              key={index}
              className="px-3 py-1 bg-blue-600 text-white rounded-full text-sm flex items-center"
            >
              {skill}
              {isEditing && (
                <button
                  onClick={() => removeSkill(skill)}
                  className="ml-2 hover:text-red-300"
                >
                  <X size={14} />
                </button>
              )}
            </span>
          ))}
        </div>
        {isEditing && (
          <div className="flex space-x-2">
            <input
              type="text"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              placeholder="Add a skill"
              className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-white"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  addSkill(newSkill);
                  setNewSkill('');
                }
              }}
            />
            <button
              onClick={() => {
                addSkill(newSkill);
                setNewSkill('');
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Add
            </button>
          </div>
        )}
      </div>

      {/* Social Links */}
      <div className="bg-gray-800 border border-gray-700 p-4 rounded-lg">
        <label className="block mb-4 text-sm text-gray-400">Social Links</label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="flex items-center mb-1 text-xs text-gray-500">
              <Linkedin size={14} className="mr-1" />
              LinkedIn
            </label>
            {isEditing ? (
              <input
                type="url"
                value={formData.profile.socialLinks.linkedin}
                onChange={(e) => handleInputChange('profile.socialLinks.linkedin', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-white text-sm"
              />
            ) : (
              <p className="text-sm text-white">{formData.profile.socialLinks.linkedin || 'Not set'}</p>
            )}
          </div>
          <div>
            <label className="flex items-center mb-1 text-xs text-gray-500">
              <Github size={14} className="mr-1" />
              GitHub
            </label>
            {isEditing ? (
              <input
                type="url"
                value={formData.profile.socialLinks.github}
                onChange={(e) => handleInputChange('profile.socialLinks.github', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-white text-sm"
              />
            ) : (
              <p className="text-sm text-white">{formData.profile.socialLinks.github || 'Not set'}</p>
            )}
          </div>
          <div>
            <label className="flex items-center mb-1 text-xs text-gray-500">
              <Globe size={14} className="mr-1" />
              Personal Website
            </label>
            {isEditing ? (
              <input
                type="url"
                value={formData.profile.socialLinks.website}
                onChange={(e) => handleInputChange('profile.socialLinks.website', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-white text-sm"
              />
            ) : (
              <p className="text-sm text-white">{formData.profile.socialLinks.website || 'Not set'}</p>
            )}
          </div>
        </div>
      </div>

      {isEditing && (
        <button
          onClick={() => handleUpdateProfile('professional')}
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

export default ProfessionalTab;