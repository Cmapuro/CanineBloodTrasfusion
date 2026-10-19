import apiClient from './api'

export const getPublicClinics = async () => {
  const response = await apiClient.get('/clinics')
  return response.data.clinics
}

export const getClinicProfile = async () => {
  const response = await apiClient.get('/clinic/profile')
  return response.data
}

export const getClinicDashboardSummary = async () => {
  const response = await apiClient.get('/clinic/dashboard/summary')
  return response.data
}

export const saveClinicLocation = async (location) => {
  const response = await apiClient.put('/clinic/location', location)
  return response.data
}

export const getClinicDonorDogs = async () => {
  const response = await apiClient.get('/clinic/donor-dogs')
  return response.data.dogs
}

export const reviewClinicDonorDog = async (dogId, review) => {
  const response = await apiClient.patch(`/clinic/donor-dogs/${dogId}/verification`, review)
  return response.data
}
