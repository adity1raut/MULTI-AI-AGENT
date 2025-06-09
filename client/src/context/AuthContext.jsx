import { createContext, useState, useEffect, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';

// Firebase configuration - replace with your actual config
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Create AuthContext
export const AuthContext = createContext();

const API_BASE_URL = 'http://localhost:5000'; // Adjust to your backend URL

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [accessToken, setAccessToken] = useState(localStorage.getItem('accessToken'));
  const [refreshToken, setRefreshToken] = useState(localStorage.getItem('refreshToken'));

  // API helper function
  const apiCall = async (endpoint, options = {}) => {
    const url = `${API_BASE_URL}${endpoint}`;
    const defaultHeaders = {
      'Content-Type': 'application/json',
    };

    if (accessToken && !options.skipAuth) {
      defaultHeaders.Authorization = `Bearer ${accessToken}`;
    }

    const config = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw {
        status: response.status,
        message: data.error || 'Request failed',
        needsSignup: data.needsSignup || false,
        ...data
      };
    }

    return data;
  };

  // Token management
  const setTokens = (access, refresh) => {
    setAccessToken(access);
    setRefreshToken(refresh);
    if (access) {
      localStorage.setItem('accessToken', access);
    } else {
      localStorage.removeItem('accessToken');
    }
    if (refresh) {
      localStorage.setItem('refreshToken', refresh);
    } else {
      localStorage.removeItem('refreshToken');
    }
  };

  const clearTokens = () => {
    setAccessToken(null);
    setRefreshToken(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  };

  // Refresh access token
  const refreshAccessToken = async () => {
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const data = await apiCall('/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
        skipAuth: true,
      });

      setTokens(data.accessToken, refreshToken);
      setUser(data.user);
      return data.accessToken;
    } catch (error) {
      clearTokens();
      setUser(null);
      throw error;
    }
  };

  // Verify current token
  const verifyToken = async () => {
    if (!accessToken) return null;

    try {
      const data = await apiCall('/auth/verify');
      setUser(data.user);
      return data.user;
    } catch (error) {
      if (error.status === 401 && refreshToken) {
        try {
          await refreshAccessToken();
          const data = await apiCall('/auth/verify');
          setUser(data.user);
          return data.user;
        } catch (refreshError) {
          clearTokens();
          setUser(null);
          return null;
        }
      } else {
        clearTokens();
        setUser(null);
        return null;
      }
    }
  };

  // Sign up with Google
  const signUpWithGoogle = async (options = {}) => {
    setLoading(true);
    setError(null);

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();

      const data = await apiCall('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
          idToken,
          role: options.role
        }),
        signal: options.signal,
        skipAuth: true,
      });

      setTokens(data.accessToken, data.refreshToken);
      setUser(data.user);
      return data;
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Sign in with Google
  const signInWithGoogle = async (options = {}) => {
    setLoading(true);
    setError(null);

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();

      const data = await apiCall('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          idToken,
          role: options.role
        }),
        signal: options.signal,
        skipAuth: true,
      });

      setTokens(data.accessToken, data.refreshToken);
      setUser(data.user);
      return data;
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Sign out
  const logout = async () => {
    setLoading(true);
    
    try {
      // Call backend logout endpoint
      if (accessToken) {
        await apiCall('/auth/logout', { method: 'POST' });
      }
    } catch (error) {
      console.error('Backend logout error:', error);
    }

    try {
      // Sign out from Firebase
      await signOut(auth);
    } catch (error) {
      console.error('Firebase logout error:', error);
    }

    // Clear local state
    clearTokens();
    setUser(null);
    setError(null);
    setLoading(false);
  };

  // Get user profile
  const getUserProfile = async () => {
    try {
      const data = await apiCall('/user/profile');
      return data.profile;
    } catch (error) {
      if (error.status === 401 && refreshToken) {
        await refreshAccessToken();
        const data = await apiCall('/user/profile');
        return data.profile;
      }
      throw error;
    }
  };

  // Update user profile
  const updateUserProfile = async (profileData) => {
    try {
      const data = await apiCall('/user/profile', {
        method: 'PUT',
        body: JSON.stringify(profileData),
      });
      
      // Update local user state
      setUser(prevUser => ({
        ...prevUser,
        ...data.profile,
        displayName: data.profile.displayName || prevUser.displayName,
        photoURL: data.profile.photoURL || prevUser.photoURL,
      }));
      
      return data.profile;
    } catch (error) {
      if (error.status === 401 && refreshToken) {
        await refreshAccessToken();
        const data = await apiCall('/user/profile', {
          method: 'PUT',
          body: JSON.stringify(profileData),
        });
        
        setUser(prevUser => ({
          ...prevUser,
          ...data.profile,
          displayName: data.profile.displayName || prevUser.displayName,
          photoURL: data.profile.photoURL || prevUser.photoURL,
        }));
        
        return data.profile;
      }
      throw error;
    }
  };

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      if (accessToken) {
        try {
          await verifyToken();
        } catch (error) {
          console.error('Token verification failed:', error);
        }
      }
      
      if (mounted) {
        setLoading(false);
      }
    };

    // Listen to Firebase auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser && user) {
        // User signed out from Firebase, clear our state
        clearTokens();
        setUser(null);
      }
      
      if (mounted) {
        setLoading(false);
      }
    });

    initializeAuth();

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  // Auto-refresh token before expiry
  useEffect(() => {
    if (!accessToken || !refreshToken) return;

    const refreshInterval = setInterval(async () => {
      try {
        await refreshAccessToken();
      } catch (error) {
        console.error('Auto token refresh failed:', error);
      }
    }, 50 * 60 * 1000); // Refresh every 50 minutes

    return () => clearInterval(refreshInterval);
  }, [accessToken, refreshToken]);

  const value = {
    user,
    loading,
    error,
    accessToken,
    refreshToken,
    signUpWithGoogle,
    signInWithGoogle,
    logout,
    getUserProfile,
    updateUserProfile,
    refreshAccessToken,
    verifyToken,
    setError: (error) => setError(error),
    clearError: () => setError(null),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};