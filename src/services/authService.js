import apiClient from './api'

/**
 * Authentication Service
 * Handles login, registration, and logout operations
 */

/**
 * Login user with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {string} role - User role (donor, hospital, admin)
 * @returns {Promise} Login response with user data and token
 */
export const loginUser = async (email, password) => {
  try {
    const response = await apiClient.post('/auth/login', {
      email,
      password,
    })

    // Store token in localStorage
    if (response.data.token) {
      localStorage.setItem('authToken', response.data.token)
    }

    return response.data
  } catch (error) {
    throw error.response?.data || error
  }
}

/**
 * Register a new donor
 * @param {object} userData - User registration data
 * @returns {Promise} Registration response with user data
 */
export const registerDonor = async (userData) => {
  try {
    const response = await apiClient.post('/auth/register', {
      ...userData,
      role: 'dog_owner',
    })
    return response.data
  } catch (error) {
    throw error.response?.data || error
  }
}

/**
 * Register a new hospital
 * @param {object} hospitalData - Hospital registration data
 * @returns {Promise} Registration response with hospital data
 */
export const registerHospital = async (hospitalData) => {
  try {
    const response = await apiClient.post('/auth/register', {
      ...hospitalData,
      role: 'clinic_admin',
    })
    return response.data
  } catch (error) {
    throw error.response?.data || error
  }
}

/**
 * Logout user
 * Clears authentication token
 */
export const logoutUser = () => {
  return apiClient.post('/auth/logout').finally(() => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('user')
  })
}

/**
 * Get current user profile
 * @returns {Promise} Current user data
 */
export const getCurrentUser = async () => {
  try {
    const response = await apiClient.get('/me')
    return response.data
  } catch (error) {
    throw error.response?.data || error
  }
}

/**
 * Update user profile
 * @param {object} updateData - Data to update
 * @returns {Promise} Updated user data
 */
export const updateProfile = async (updateData) => {
  try {
    const response = await apiClient.put('/auth/profile', updateData)
    return response.data
  } catch (error) {
    throw error.response?.data || error
  }
}

/**
 * Change password
 * @param {string} currentPassword - Current password
 * @param {string} newPassword - New password
 * @returns {Promise} Password change response
 */
export const changePassword = async (currentPassword, newPassword) => {
  try {
    const response = await apiClient.post('/auth/change-password', {
      currentPassword,
      newPassword,
    })
    return response.data
  } catch (error) {
    throw error.response?.data || error
  }
}

export default {
  loginUser,
  registerDonor,
  registerHospital,
  logoutUser,
  getCurrentUser,
  updateProfile,
  changePassword,
}
