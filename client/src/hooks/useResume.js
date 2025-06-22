import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

export function useResume() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const { currentUser, accessToken } = useAuth()

  const uploadResume = async (formData) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/resume/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        body: formData
      })
      if (!response.ok) throw new Error('Failed to upload resume')
      return await response.json()
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const getResume = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/resume`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })
      if (!response.ok) throw new Error('Failed to fetch resume')
      return await response.json()
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    error,
    uploadResume,
    getResume
  }
}