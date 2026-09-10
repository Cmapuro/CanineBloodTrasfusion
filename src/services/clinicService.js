import apiClient from './api'

export const getClinicProfile = async () => {
  const response = await apiClient.get('/clinic/profile')
  return response.data
}

export const saveClinicLocation = async (location) => {
  const response = await apiClient.put('/clinic/location', location)
  return response.data
}
