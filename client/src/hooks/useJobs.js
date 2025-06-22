import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

export function useJobs() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const { currentUser, accessToken } = useAuth()

  const getAllJobs = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/jobs`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })
      if (!response.ok) throw new Error('Failed to fetch jobs')
      const data = await response.json()
      return data.jobs
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const getMatchedJobs = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/jobs/match`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })
      if (!response.ok) throw new Error('Failed to fetch matched jobs')
      const data = await response.json()
      return data.jobs
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const postJob = async (formData) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/jobs/post`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        body: formData
      })
      if (!response.ok) throw new Error('Failed to post job')
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
    getAllJobs,
    getMatchedJobs,
    postJob
  }
}