import apiClient from './api'

export const askChatbot = async (message) => {
  const response = await apiClient.post('/chatbot/chat', { message }, { timeout: 25000 })
  return response.data
}

export const submitChatbotFeedback = async (feedback) => {
  const response = await apiClient.post('/chatbot/feedback', feedback)
  return response.data
}

const adminPath = '/admin/chatbot'

export const getChatbotKnowledge = async () => {
  const response = await apiClient.get(`${adminPath}/knowledge`)
  return response.data
}

export const createChatbotFaq = async (faq) => {
  const response = await apiClient.post(`${adminPath}/faqs`, faq)
  return response.data
}

export const updateChatbotFaq = async (faqId, faq) => {
  const response = await apiClient.put(`${adminPath}/faqs/${faqId}`, faq)
  return response.data
}

export const approveChatbotFaq = async (faqId) => {
  const response = await apiClient.post(`${adminPath}/faqs/${faqId}/approve`)
  return response.data
}

export const disableChatbotFaq = async (faqId) => {
  const response = await apiClient.post(`${adminPath}/faqs/${faqId}/disable`)
  return response.data
}

export const deleteChatbotFaq = async (faqId) => {
  const response = await apiClient.delete(`${adminPath}/faqs/${faqId}`)
  return response.data
}

export const getChatbotFaqHistory = async (faqId) => {
  const response = await apiClient.get(`${adminPath}/faqs/${faqId}/history`)
  return response.data
}

export const rollbackChatbotFaq = async (faqId, versionId) => {
  const response = await apiClient.post(`${adminPath}/faqs/${faqId}/rollback/${versionId}`)
  return response.data
}

export const reviewChatbotSuggestion = async (suggestionId, decision, faq) => {
  const response = await apiClient.post(`${adminPath}/suggestions/${suggestionId}/review`, {
    decision,
    ...faq,
  })
  return response.data
}

export const evaluateChatbotKnowledge = async (question, scope, faqId) => {
  const response = await apiClient.post(`${adminPath}/evaluate`, { question, scope, faq_id: faqId })
  return response.data
}
