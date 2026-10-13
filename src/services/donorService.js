import apiClient from './api'
import donorsData from '../data/donors.json'

/**
 * Donor Service
 * Handles all donor-related API calls and operations
 */

/**
 * Get all donors
 * @returns {Promise} List of all donors
 */
export const getAllDonors = async () => {
  try {
    // Using local dummy data instead of API call for demonstration
    return Promise.resolve(donorsData)
  } catch (error) {
    throw error
  }
}

/**
 * Get donor by ID
 * @param {number} donorID - Donor ID
 * @returns {Promise} Donor data
 */
export const getDonorById = async (donorID) => {
  try {
    const donors = donorsData
    const donor = donors.find((d) => d.id === parseInt(donorID))
    return Promise.resolve(donor)
  } catch (error) {
    throw error
  }
}

/**
 * Get donations history for a donor
 * @param {number} donorID - Donor ID
 * @returns {Promise} Donations history
 */
export const getDonationHistory = async (donorID) => {
  try {
    const response = await apiClient.get(`/donors/${donorID}/donation-history`)
    return response.data
  } catch (error) {
    throw error.response?.data || error
  }
}

export const getOwnDonationHistory = async () => {
  const response = await apiClient.get('/donor/donation-history')
  return response.data
}

/**
 * Check if donor is eligible to donate
 * @param {number} donorID - Donor ID
 * @returns {Promise} Eligibility status
 */
export const checkEligibility = async (donorID) => {
  try {
    const donor = donorsData.find((d) => d.id === parseInt(donorID))
    return Promise.resolve({
      donorID,
      isEligible: donor?.isEligible || false,
      reason: donor?.isEligible ? 'Eligible to donate' : 'Not eligible',
    })
  } catch (error) {
    throw error
  }
}

/**
 * Schedule a donation appointment
 * @param {number} donorID - Donor ID
 * @param {object} appointmentData - Appointment details
 * @returns {Promise} Appointment confirmation
 */
export const scheduleAppointment = async (donorID, appointmentData) => {
  try {
    const response = await apiClient.post(`/donors/${donorID}/appointments`, appointmentData)
    return response.data
  } catch (error) {
    throw error.response?.data || error
  }
}

/**
 * Get scheduled appointments for donor
 * @param {number} donorID - Donor ID
 * @returns {Promise} List of appointments
 */
export const getAppointments = async (donorID) => {
  try {
    const response = await apiClient.get(`/donors/${donorID}/appointments`)
    return response.data
  } catch (error) {
    throw error.response?.data || error
  }
}

/**
 * Cancel appointment
 * @param {number} appointmentID - Appointment ID
 * @returns {Promise} Cancellation response
 */
export const cancelAppointment = async (appointmentID) => {
  try {
    const response = await apiClient.delete(`/appointments/${appointmentID}`)
    return response.data
  } catch (error) {
    throw error.response?.data || error
  }
}

/**
 * Update donor profile
 * @param {number} donorID - Donor ID
 * @param {object} updateData - Profile update data
 * @returns {Promise} Updated donor data
 */
export const updateDonorProfile = async (donorID, updateData) => {
  try {
    const response = await apiClient.put(`/donors/${donorID}`, updateData)
    return response.data
  } catch (error) {
    throw error.response?.data || error
  }
}

/**
 * Get donor notifications
 * @param {number} donorID - Donor ID
 * @returns {Promise} List of notifications
 */
export const getDonorNotifications = async (donorID) => {
  try {
    const response = await apiClient.get(`/donors/${donorID}/notifications`)
    return response.data
  } catch (error) {
    throw error.response?.data || error
  }
}

/**
 * Mark notification as read
 * @param {number} notificationID - Notification ID
 * @returns {Promise} Update response
 */
export const markNotificationAsRead = async (notificationID) => {
  try {
    const response = await apiClient.put(`/notifications/${notificationID}/read`)
    return response.data
  } catch (error) {
    throw error.response?.data || error
  }
}

export default {
  getAllDonors,
  getDonorById,
  getDonationHistory,
  getOwnDonationHistory,
  checkEligibility,
  scheduleAppointment,
  getAppointments,
  cancelAppointment,
  updateDonorProfile,
  getDonorNotifications,
  markNotificationAsRead,
}
