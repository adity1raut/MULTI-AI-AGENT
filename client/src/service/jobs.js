export const jobsService = {
  async getAllJobs(accessToken) {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/jobs`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })
    if (!response.ok) throw new Error('Failed to fetch jobs')
    return await response.json()
  },

  async getMatchedJobs(accessToken) {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/jobs/match`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })
    if (!response.ok) throw new Error('Failed to fetch matched jobs')
    return await response.json()
  },

  async postJob(formData, accessToken) {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/jobs/post`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      },
      body: formData
    })
    if (!response.ok) throw new Error('Failed to post job')
    return await response.json()
  },

  async getJobDetails(jobId, accessToken) {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/jobs/${jobId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })
    if (!response.ok) throw new Error('Failed to fetch job details')
    return await response.json()
  },

  async applyToJob(jobId, accessToken) {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/jobs/${jobId}/apply`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })
    if (!response.ok) throw new Error('Failed to apply to job')
    return await response.json()
  }
}