import axios from 'axios';

// Request deduplication
const pendingRequests = new Map();
const requestPromises = new Map();

const generateRequestKey = (config) => {
  return `${config.method?.toUpperCase() || 'GET'}:${config.url}`;
};

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 15000
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const requestKey = generateRequestKey(config);
    
    // For GET requests (like /auth/verify), prevent duplicates
    if (config.method?.toLowerCase() === 'get') {
      if (requestPromises.has(requestKey)) {
        // Return the existing promise instead of making a new request
        return Promise.reject({ 
          __CANCEL__: true, 
          promise: requestPromises.get(requestKey) 
        });
      }
    }

    // Cancel any existing request with the same key
    if (pendingRequests.has(requestKey)) {
      const source = pendingRequests.get(requestKey);
      source.cancel('Duplicate request cancelled');
    }

    const cancelToken = axios.CancelToken.source();
    config.cancelToken = cancelToken.token;
    pendingRequests.set(requestKey, cancelToken);

    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    const requestKey = generateRequestKey(response.config);
    pendingRequests.delete(requestKey);
    requestPromises.delete(requestKey);
    return response;
  },
  async (error) => {
    // Handle our custom cancellation for duplicate requests
    if (error.__CANCEL__) {
      return error.promise;
    }

    if (error.config) {
      const requestKey = generateRequestKey(error.config);
      pendingRequests.delete(requestKey);
      requestPromises.delete(requestKey);
    }

    const originalRequest = error.config;
    
    // Handle 401 errors with token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error('No refresh token');
        
        const response = await axios.post('/api/auth/refresh', { refreshToken });
        const { accessToken } = response.data;
        
        localStorage.setItem('accessToken', accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// Wrapper function for GET requests with promise caching
const makeRequest = (requestFn, key) => {
  if (requestPromises.has(key)) {
    return requestPromises.get(key);
  }
  
  const promise = requestFn().finally(() => {
    requestPromises.delete(key);
  });
  
  requestPromises.set(key, promise);
  return promise;
};

export const loginWithGoogle = async (idToken) => {
  const response = await api.post('/auth/login', { idToken });
  return response.data;
};

export const verifyToken = async () => {
  return makeRequest(async () => {
    const response = await api.get('/auth/verify');
    return response.data;
  }, 'verify_token');
};

export const getProfile = async () => {
  return makeRequest(async () => {
    const response = await api.get('/user/profile');
    return response.data;
  }, 'get_profile');
};

export const updateProfile = async (data) => {
  const response = await api.put('/user/profile', data);
  return response.data;
};

export const logout = async () => {
  await api.post('/auth/logout');
};