import { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { getProfile, updateProfile } from '../services/api';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const { user, signOut } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true; // Prevent state updates if component unmounts

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
          setDisplayName(response.profile.displayName || '');
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

    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, [user]); // Only depend on user

  const handleUpdateProfile = async () => {
    try {
      setError(null);
      await updateProfile({ displayName });
      setProfile({ ...profile, displayName });
    } catch (error) {
      console.error('Update profile error:', error);
      setError('Failed to update profile');
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

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh'
      }}>
        Loading profile...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        gap: '1rem',
        padding: '2rem',
        textAlign: 'center'
      }}>
        <h1>Error</h1>
        <p style={{ color: 'red' }}>{error}</p>
        <button onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    );
  }

  if (!profile) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh'
      }}>
        No profile data available
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      gap: '1rem',
      padding: '2rem',
      textAlign: 'center'
    }}>
      <h1>Profile</h1>
      {profile.photoURL && (
        <img 
          src={profile.photoURL}
          alt="Profile"
          style={{
            width: '96px',
            height: '96px',
            borderRadius: '50%',
            objectFit: 'cover'
          }}
        />
      )}
      <p><strong>Email:</strong> {profile.email}</p>
      <p><strong>UID:</strong> {profile.uid}</p>
      {profile.createdAt && (
        <p><strong>Created:</strong> {new Date(profile.createdAt).toLocaleString()}</p>
      )}
      {profile.lastLogin && (
        <p><strong>Last Login:</strong> {new Date(profile.lastLogin).toLocaleString()}</p>
      )}
      
      <div style={{ margin: '1rem 0' }}>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Display Name"
          style={{
            padding: '0.5rem',
            marginRight: '0.5rem',
            border: '1px solid #ccc',
            borderRadius: '4px'
          }}
        />
        <button 
          onClick={handleUpdateProfile}
          style={{
            padding: '0.5rem 1rem',
            background: '#3182ce',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Update Name
        </button>
      </div>
      
      <button 
        onClick={handleLogout}
        style={{
          padding: '0.5rem 1rem',
          background: '#e53e3e',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Logout
      </button>
    </div>
  );
};

export default Profile;