import { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from './AuthContext'
import { jobsService } from '../service/jobs'
import { firebaseAuth } from '../service/auth'

const JobContext = createContext()

export function JobProvider({ children }) {
  const { currentUser, accessToken } = useAuth()
  const [jobs, setJobs] = useState([])
  const [matchedJobs, setMatchedJobs] = useState([])
  const [myJobs, setMyJobs] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const getAllJobs = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await jobsService.getAllJobs(accessToken)
      setJobs(data.jobs)
      return data.jobs
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const getMatchedJobs = async () => {
    if (currentUser?.role !== 'applicant') return
    
    setLoading(true)
    setError(null)
    try {
      const data = await jobsService.getMatchedJobs(accessToken)
      setMatchedJobs(data.jobs)
      return data.jobs
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const getMyJobs = async () => {
    if (currentUser?.role !== 'requester') return
    
    setLoading(true)
    setError(null)
    try {
      const data = await jobsService.getMyJobs(accessToken)
      setMyJobs(data.jobs)
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
      const job = await jobsService.postJob(formData, accessToken)
      setMyJobs(prev => [job, ...prev])
      return job
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const getJobDetails = async (jobId) => {
    setLoading(true)
    setError(null)
    try {
      return await jobsService.getJobDetails(jobId, accessToken)
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const applyToJob = async (jobId) => {
    setLoading(true)
    setError(null)
    try {
      const application = await jobsService.applyToJob(jobId, accessToken)
      setJobs(prev => prev.map(job => 
        job.id === jobId 
          ? { ...job, applicants: [...(job.applicants || []), application] } 
          : job
      ))
      return application
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Load initial data based on user role
  useEffect(() => {
    if (!currentUser) return
    
    if (currentUser.role === 'applicant') {
      getMatchedJobs()
      getAllJobs()
    } else if (currentUser.role === 'requester') {
      getMyJobs()
    }
  }, [currentUser])

  const value = {
    jobs,
    matchedJobs,
    myJobs,
    loading,
    error,
    getAllJobs,
    getMatchedJobs,
    getMyJobs,
    postJob,
    getJobDetails,
    applyToJob,
    refreshJobs: () => {
      if (currentUser?.role === 'applicant') {
        getMatchedJobs()
        getAllJobs()
      } else if (currentUser?.role === 'requester') {
        getMyJobs()
      }
    }
  }

  return (
    <JobContext.Provider value={value}>
      {children}
    </JobContext.Provider>
  )
}

export function useJobs() {
  const context = useContext(JobContext)
  if (context === undefined) {
    throw new Error('useJobs must be used within a JobProvider')
  }
  return context
}