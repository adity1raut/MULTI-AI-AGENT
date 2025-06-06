import React, { createContext, useState, useEffect, useCallback } from 'react';
import { auth } from '../config/firebase';
import { GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut } from 'firebase/auth';
import { loginWithGoogle, verifyToken } from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);

  // Prevent multiple simultaneous token verifications
  const verifyUserToken = useCallback(async () => {
    if (isVerifying) return;
    
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setLoading(false);
      return;
    }

    setIsVerifying(true);
    try {
      const response = await verifyToken();
      setUser(response.user);
    } catch (error) {
      console.error('Token verification failed:', error);
      // Clear tokens if verification fails
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setUser(null);
    } finally {
      setIsVerifying(false);
      setLoading(false);
    }
  }, [isVerifying]);

  // Only verify token once on mount
  useEffect(() => {
    verifyUserToken();
  }, []); // Empty dependency array - only run once

  const signInWithGoogle = useCallback(async (options = {}) => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken();
      
      const response = await loginWithGoogle(idToken);
      
      // Store tokens
      localStorage.setItem('accessToken', response.accessToken);
      localStorage.setItem('refreshToken', response.refreshToken);
      
      setUser(response.user);
      return response;
    } catch (error) {
      console.error('Google sign-in error:', error);
      throw error;
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await firebaseSignOut(auth);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setUser(null);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }, []);

  const value = {
    user,
    loading,
    signInWithGoogle,
    signOut,
    verifyUserToken
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};