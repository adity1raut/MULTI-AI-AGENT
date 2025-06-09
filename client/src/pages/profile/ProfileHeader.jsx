import { User, Camera } from 'lucide-react';

const ProfileHeader = ({ profile }) => {
  return (
    <div className="bg-gradient-to-r from-purple-600 to-blue-500 p-8 rounded-t-2xl text-center">
      <div className="relative inline-block">
        {profile?.photoURL ? (
          <img 
            src={profile.photoURL}
            alt="Profile"
            className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg mx-auto"
          />
        ) : (
          <div className="w-24 h-24 rounded-full bg-gray-700 border-4 border-white shadow-lg mx-auto flex items-center justify-center">
            <User size={32} className="text-gray-400" />
          </div>
        )}
        <div className="absolute -bottom-2 -right-2 bg-gray-800 rounded-full p-2 border-2 border-white cursor-pointer hover:bg-gray-700 transition-colors">
          <Camera size={16} className="text-gray-400" />
        </div>
      </div>
      <h1 className="text-2xl font-bold text-white mt-4">
        {profile?.displayName || profile?.email?.split('@')[0] || 'User'}
      </h1>
      <p className="text-purple-100 opacity-90 capitalize">
        {profile?.role || 'User'} • Member since {new Date(profile?.createdAt?.seconds * 1000 || Date.now()).getFullYear()}
      </p>
    </div>
  );
};

export default ProfileHeader;