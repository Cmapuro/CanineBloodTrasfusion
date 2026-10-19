import apiClient from './api'

export const getNearbyLocations = async (filters, signal) => {
  const response = await apiClient.get('/nearby-locations', { params: filters, signal })
  return response.data
}

export const getDonorLocationSharing = async () => {
  const response = await apiClient.get('/donor/location-sharing')
  return response.data
}

export const updateDonorLocationSharing = async (dogId, consent) => {
  const response = await apiClient.put(`/donor/dogs/${dogId}/location-sharing`, { consent })
  return response.data
}

export const updateDonorLocation = async (dogId, coordinates) => {
  const response = await apiClient.put(`/donor/dogs/${dogId}/location`, coordinates)
  return response.data
}
