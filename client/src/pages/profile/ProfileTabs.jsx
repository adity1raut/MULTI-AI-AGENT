import { useState } from 'react';
import { User, Building, Briefcase, Settings } from 'lucide-react';

const ProfileTabs = ({ profile, activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'general', label: 'General', icon: User },
    ...(profile?.role === 'requester' ? [{ id: 'company', label: 'Company', icon: Building }] : []),
    ...(profile?.role === 'applicant' ? [{ id: 'professional', label: 'Professional', icon: Briefcase }] : []),
    { id: 'preferences', label: 'Preferences', icon: Settings }
  ];

  return (
    <div className="bg-gray-900 border-x border-gray-800">
      <div className="flex space-x-1 p-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center px-4 py-3 rounded-lg transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-purple-600 to-blue-500 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <Icon size={18} className="mr-2" />
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ProfileTabs;