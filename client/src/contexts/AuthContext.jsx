import { createContext, useContext, useEffect, useState } from 'react'
import { firebaseAuth } from '../service/auth'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [accessToken, setAccessToken] = useState(null)
  const [refreshToken, setRefreshToken] = useState(null)

  // Initialize auth state
  useEffect(() => {
    const tokens = JSON.parse(localStorage.getItem('tokens'))
    if (tokens) {
      setAccessToken(tokens.accessToken)
      setRefreshToken(tokens.refreshToken)
      
      // Verify token with backend
      verifyToken(tokens.accessToken)
    } else {
      setLoading(false)
    }
  }, [])

  const verifyToken = async (token) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/verify`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) throw new Error('Token verification failed')
      
      const data = await response.json()
      setCurrentUser(data.user)
    } catch (error) {
      console.error('Token verification error:', error)
      logout()
    } finally {
      setLoading(false)
    }
  }

  const login = async (role) => {
    try {
      const { user, accessToken, refreshToken } = await firebaseAuth.loginWithGoogle(role)
      localStorage.setItem('tokens', JSON.stringify({ accessToken, refreshToken }))
      setCurrentUser(user)
      setAccessToken(accessToken)
      setRefreshToken(refreshToken)
      return user
    } catch (error) {
      throw error
    }
  }

  const signup = async (role) => {
    try {
      const { user, accessToken, refreshToken } = await firebaseAuth.signupWithGoogle(role)
      localStorage.setItem('tokens', JSON.stringify({ accessToken, refreshToken }))
      setCurrentUser(user)
      setAccessToken(accessToken)
      setRefreshToken(refreshToken)
      return user
    } catch (error) {
      throw error
    }
  }

  const logout = async () => {
    try {
      if (accessToken) {
        await firebaseAuth.logout(accessToken)
      }
      localStorage.removeItem('tokens')
      setCurrentUser(null)
      setAccessToken(null)
      setRefreshToken(null)
    } catch (error) {
      throw error
    }
  }

  const refresh = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refreshToken })
      })

      if (!response.ok) throw new Error('Token refresh failed')

      const { accessToken } = await response.json()
      localStorage.setItem('tokens', JSON.stringify({ accessToken, refreshToken }))
      setAccessToken(accessToken)
      return accessToken
    } catch (error) {
      logout()
      throw error
    }
  }

  const value = {
    currentUser,
    accessToken,
    login,
    signup,
    logout,
    refresh,
    loading
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}