import React, { createContext, useEffect, useState, useCallback } from 'react'
import { getCurrentUser, loginUser, logoutUser } from '../services/authService'

/**
 * AuthContext - Manages authentication state across the application
 * Provides user data, authentication status, and login/logout functionality
 */
export const AuthContext = createContext()

const backendRoles = {
  donor: 'dog_owner',
  hospital: 'clinic_admin',
  admin: 'gov_admin',
}

const frontendRoles = {
  dog_owner: 'donor',
  clinic_admin: 'hospital',
  clinic_staff: 'hospital',
  gov_admin: 'admin',
}

const normalizeUser = (userData) => ({
  ...userData,
  id: userData.user_id ?? userData.id,
  name: userData.full_name ?? userData.name,
  role: frontendRoles[userData.role] ?? userData.role,
  backendRole: userData.role,
})

/**
 * AuthProvider Component - Wraps the application to provide authentication context
 * @component
 */
export function AuthProvider({ children }) {
  // State to store currently authenticated user (initialize from localStorage)
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user')
      return stored ? JSON.parse(stored) : null
    } catch (e) {
      return null
    }
  })

  // State to track loading during authentication
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem('authToken')))

  // State to store authentication errors
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!localStorage.getItem('authToken')) {
      return
    }

    getCurrentUser()
      .then((userData) => {
        const normalized = normalizeUser(userData)
        setUser(normalized)
        localStorage.setItem('user', JSON.stringify(normalized))
      })
      .catch(() => {
        localStorage.removeItem('authToken')
        localStorage.removeItem('user')
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [])

  /**
   * Login function - Authenticates user
   * In a real app, this would call an API endpoint
   * For now, we're using dummy data
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {string} role - User role (donor, hospital, admin)
   * @returns {Promise} Authentication result
   */
  const login = useCallback(async (email, password, role) => {
    setLoading(true)
    setError(null)
    try {
      const response = await loginUser(email, password)
      if (response.user?.role !== backendRoles[role]) {
        throw new Error('This account belongs to a different login portal.')
      }
      const userData = normalizeUser(response.user)

      // If someone is already logged in with a different role, prevent cross-login
      const current = user
      if (current && current.role && current.role !== role) {
        const err = new Error(`Already logged in as ${current.role}. Please logout first.`)
        setError(err.message)
        throw err
      }

      setUser(userData)
      localStorage.setItem('user', JSON.stringify(userData))
      return userData
    } catch (err) {
      const errorMsg = err.message || 'Login failed'
      setError(errorMsg)
      throw err
    } finally {
      setLoading(false)
    }
  }, [user])

  /**
   * Logout function - Clears user data
   */
  const logout = useCallback(async () => {
    try {
      if (localStorage.getItem('authToken')) {
        await logoutUser()
      }
    } finally {
      setUser(null)
      localStorage.removeItem('user')
      localStorage.removeItem('authToken')
      setError(null)
    }
  }, [])

  /**
   * Check if user is authenticated
   * @returns {boolean} True if user is logged in
   */
  const isAuthenticated = useCallback(() => {
    return user !== null
  }, [user])

  /**
   * Check if user has a specific role
   * @param {string} role - Role to check
   * @returns {boolean} True if user has the role
   */
  const hasRole = useCallback(
    (role) => {
      return user && user.role === role
    },
    [user]
  )

  // (Initialization handled synchronously in useState above)

  // Context value to be provided
  const value = {
    user,
    loading,
    error,
    login,
    logout,
    isAuthenticated,
    hasRole,
    backendRoles,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
