import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import PublicLayout from '../../components/layout/PublicLayout'
import { useAuth } from '../../hooks/useAuth'
import { useContext } from 'react'
import { NotificationContext } from '../../context/NotificationContext'
import { LogoMark } from '../../components/common/LogoMark'
import { PasswordInput } from '../../components/common/PasswordInput'

/**
 * DonorLoginPage Component
 * Login page for donors
 * Features: email/password form, validation, role-based authentication
 */
export function DonorLoginPage() {
  // Navigation hook
  const navigate = useNavigate()

  // Auth context
  const { login, isAuthenticated, user } = useAuth()

  // If already authenticated, redirect to the correct dashboard
  useEffect(() => {
    if (isAuthenticated()) {
      navigate(`/${user?.role}/dashboard`)
    }
  }, [isAuthenticated, user, navigate])

  // Notification context
  const { success, error } = useContext(NotificationContext)

  // Form state
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

  // Loading state
  const [isLoading, setIsLoading] = useState(false)

  // Error state
  const [formError, setFormError] = useState('')

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    setFormError('')
  }

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setFormError('')

    try {
      // Validate inputs
      if (!formData.email || !formData.password) {
        setFormError('Please enter email and password')
        setIsLoading(false)
        return
      }

      // Call login function
      await login(formData.email, formData.password, 'donor')

      // Show success message
      success('Login successful!')

      // Redirect to donor dashboard
      navigate('/donor/dashboard')
    } catch (err) {
      setFormError(err.message || 'Login failed. Please try again.')
      error('Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <PublicLayout>
      <section className="min-h-screen bg-gradient-to-r from-blood-red to-blood-dark flex items-center justify-center py-8">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="w-full max-w-md mx-auto">
            {/* Card */}
            <div className="w-full bg-white rounded-lg shadow-lg p-6 sm:p-8">
              {/* Header */}
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-blood-light rounded-full flex items-center justify-center mx-auto mb-4">
                  <LogoMark size="md" className="border border-red-100" alt="Donor login logo" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Login</h1>
                <p className="text-gray-600 text-sm mt-2">
                  Sign in to your donor account
                </p>
              </div>

              {/* Error Alert */}
              {formError && (
                <div className="bg-red-100 border border-red-300 text-red-800 px-4 py-3 rounded mb-6">
                  {formError}
                </div>
              )}

              {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                    className="form-control"
                    required
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <PasswordInput
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    required
                  />
                </div>

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="w-4 h-4" />
                    <span className="text-gray-600">Remember me</span>
                  </label>
                  <a href="#" className="text-blood-red hover:text-blood-dark">
                    Forgot password?
                  </a>
                </div>

                {/* Submit Button */}
                <button type="submit" disabled={isLoading} className="btn-primary w-full">
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </button>
              </form>

              {/* Divider */}
              <div className="my-6 flex items-center gap-4">
                <hr className="flex-1" />
                <span className="text-gray-600 text-sm">OR</span>
                <hr className="flex-1" />
              </div>

              {/* Sign Up Link */}
              <p className="text-center text-gray-600">
                Don't have an account?{' '}
                <Link to="/donor/register" className="text-blood-red font-semibold hover:text-blood-dark">
                  Register here
                </Link>
              </p>

              {/* Other Login Options */}
              <div className="mt-6 space-y-3">
                <p className="text-center text-gray-600 text-sm">Other login options:</p>
                <div className="flex gap-2">
                  <Link
                    to="/hospital/login"
                    className="flex-1 btn-secondary text-center text-sm"
                  >
                    Clinic Login
                  </Link>
                  <Link
                    to="/admin/login"
                    className="flex-1 btn-secondary text-center text-sm"
                  >
                    Admin Login
                  </Link>
                </div>
              </div>

              {/* Demo Credentials */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg text-sm">
                <p className="font-semibold text-blue-900 mb-2">Demo Credentials:</p>
                <p className="text-blue-800">Donor: donor@caninelink.test / Donor@12345</p>
                <p className="text-blue-800">Clinic admin: dr.kang@caninelink.test / DrKang@12345</p>
                <p className="text-blue-800">Admin: admin@caninelink.test / Admin@12345</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  )
}

export default DonorLoginPage
