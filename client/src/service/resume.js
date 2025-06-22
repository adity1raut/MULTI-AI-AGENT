export async function uploadResume(formData, accessToken) {
  const response = await fetch(`${import.meta.env.VITE_API_URL}/resume/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`
    },
    body: formData
  })
  if (!response.ok) throw new Error('Failed to upload resume')
  return await response.json()
}

export const resumeService = {
  uploadResume,
  async getResume(accessToken) {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/resume`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })
    if (!response.ok) throw new Error('Failed to fetch resume')
    return await response.json()
  },

  async analyzeResume(text, accessToken) {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/resume/analyze`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text })
    })
    if (!response.ok) throw new Error('Failed to analyze resume')
    return await response.json()
  }
}
