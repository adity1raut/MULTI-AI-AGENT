import { useAuth } from '../contexts/AuthContext'

export const useApi = () => {
  const { accessToken, refresh } = useAuth()

  const api = async (url, options = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    }

    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}${url}`, {
        ...options,
        headers
      })

      // If token expired, try to refresh it
      if (response.status === 401) {
        const newAccessToken = await refresh()
        headers['Authorization'] = `Bearer ${newAccessToken}`
        
        const retryResponse = await fetch(`${import.meta.env.VITE_API_URL}${url}`, {
          ...options,
          headers
        })
        return await retryResponse.json()
      }

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Request failed')
      }

      return await response.json()
    } catch (error) {
      throw error
    }
  }

  return api
}