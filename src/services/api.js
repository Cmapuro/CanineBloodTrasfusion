import axios from 'axios'

/**
 * API Configuration and Axios Instance
 * Handles all HTTP requests to the backend API
 * In a real application, this would connect to an actual backend server
 */

// Laravel API base URL. Override this with VITE_API_URL for another environment.
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api'

/**
 * Create Axios instance with default configuration
 */
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // Request timeout (10 seconds)
  headers: {
    'Content-Type': 'application/json',
  },
})

/**
 * Request Interceptor
 * Adds authentication token to every request if available
 */
apiClient.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem('authToken')

    // Add token to Authorization header if available
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

/**
 * Response Interceptor
 * Handles common errors and token expiration
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized (token expired)
    if (error.response?.status === 401) {
      // Clear stored token
      localStorage.removeItem('authToken')
      localStorage.removeItem('user')

      const role = JSON.parse(localStorage.getItem('user') || 'null')?.role
      const loginPath = role === 'hospital' ? '/hospital/login' : role === 'admin' ? '/admin/login' : '/donor/login'
      window.location.href = loginPath
    }

    return Promise.reject(error)
  }
)

export default apiClient
