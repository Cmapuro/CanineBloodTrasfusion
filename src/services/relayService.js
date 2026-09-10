import apiClient from './api'

export const getClinicMatches = async () => {
  const response = await apiClient.get('/clinic/matches')
  return response.data
}

export const approveClinicMatch = async (matchId) => {
  const response = await apiClient.post(`/matches/${matchId}/approve`)
  return response.data
}

export const getDonorMatches = async () => {
  const response = await apiClient.get('/donor/matches')
  return response.data
}

export const respondToDonorMatch = async (matchId, decision) => {
  const response = await apiClient.post(`/matches/${matchId}/respond`, { decision })
  return response.data
}

export const getDonorVerificationCodes = async () => {
  const response = await apiClient.get('/donor/verification-codes')
  return response.data
}

export const archiveDonorVerificationCode = async (codeId) => {
  const response = await apiClient.post(`/donor/verification-codes/${codeId}/archive`)
  return response.data
}
