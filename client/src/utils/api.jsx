const API_BASE_URL = 'http://localhost:5000';

async function fetchWithAuth(url, options = {}) {
  const token = localStorage.getItem('accessToken');
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers,
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Request failed');
  }
  
  return response.json();
}

// Auth API
export const login = (credentials) => {
  return fetchWithAuth('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
};

export const signup = (userData) => {
  return fetchWithAuth('/auth/signup', {
    method: 'POST',
    body: JSON.stringify(userData),
  });
};

export const refreshToken = () => {
  return fetchWithAuth('/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({
      refreshToken: localStorage.getItem('refreshToken'),
    }),
  });
};

// Profile API
export const getProfile = () => {
  return fetchWithAuth('/user/profile');
};

export const updateProfile = (profileData) => {
  return fetchWithAuth('/user/profile', {
    method: 'PUT',
    body: JSON.stringify(profileData),
  });
};

// Resume API
export const uploadResume = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  return fetchWithAuth('/resume/upload', {
    method: 'POST',
    headers: {
      // Let browser set Content-Type with boundary
    },
    body: formData,
  });
};

export const getResume = () => {
  return fetchWithAuth('/resume');
};

// Jobs API
export const getJobs = () => {
  return fetchWithAuth('/jobs');
};

export const getJobDetails = (jobId) => {
  return fetchWithAuth(`/jobs/${jobId}`);
};

export const postJob = (jobData) => {
  return fetchWithAuth('/jobs/post', {
    method: 'POST',
    body: JSON.stringify(jobData),
  });
};

export const updateJob = (jobId, jobData) => {
  return fetchWithAuth(`/jobs/${jobId}`, {
    method: 'PUT',
    body: JSON.stringify(jobData),
  });
};

export const deleteJob = (jobId) => {
  return fetchWithAuth(`/jobs/${jobId}`, {
    method: 'DELETE',
  });
};

export const getMyJobs = () => {
  return fetchWithAuth('/jobs/my-jobs');
};

export const getMatchedJobs = () => {
  return fetchWithAuth('/jobs/match');
};

// Applications API
export const applyToJob = (jobId) => {
  return fetchWithAuth(`/jobs/${jobId}/apply`, {
    method: 'POST',
  });
};

export const getJobApplicants = (jobId) => {
  return fetchWithAuth(`/jobs/${jobId}/applicants`);
};

export const getMyApplications = () => {
  return fetchWithAuth('/applications/my-applications');
};