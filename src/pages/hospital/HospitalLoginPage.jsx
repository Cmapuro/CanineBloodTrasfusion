import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import PublicLayout from '../../components/layout/PublicLayout'
import { useAuth } from '../../hooks/useAuth'
import { useContext } from 'react'
import { NotificationContext } from '../../context/NotificationContext'
import { LogoMark } from '../../components/common/LogoMark'
import { PasswordInput } from '../../components/common/PasswordInput'

/**
 * HospitalLoginPage Component
 * Login page for veterinary clinics
 */
export function HospitalLoginPage() {
  const navigate = useNavigate()
  const { login, isAuthenticated, user } = useAuth()

  useEffect(() => {
    if (isAuthenticated()) {
      navigate(`/${user?.role}/dashboard`)
    }
  }, [isAuthenticated, user, navigate])
  const { success, error } = useContext(NotificationContext)

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

  const [isLoading, setIsLoading] = useState(false)
  const [formError, setFormError] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setFormError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setFormError('')

    try {
      if (!formData.email || !formData.password) {
        setFormError('Please enter email and password')
        setIsLoading(false)
        return
      }

      await login(formData.email, formData.password, 'hospital')
      success('Clinic login successful!')
      navigate('/hospital/dashboard')
    } catch (err) {
      setFormError('Login failed')
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
            <div className="w-full bg-white rounded-lg shadow-lg p-6 sm:p-8">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-blood-light rounded-full flex items-center justify-center mx-auto mb-4">
                  <LogoMark size="md" className="border border-red-100" alt="Clinic login logo" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Clinic Login</h1>
                <p className="text-gray-600 text-sm mt-2">Sign in to your veterinary clinic account</p>
              </div>

              {formError && (
                <div className="bg-red-100 border border-red-300 text-red-800 px-4 py-3 rounded mb-6">
                  {formError}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter clinic email"
                    className="form-control"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                  <PasswordInput
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter password"
                    required
                  />
                </div>

                <button type="submit" disabled={isLoading} className="btn-primary w-full">
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </button>
              </form>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg text-sm">
                <p className="font-semibold text-blue-900 mb-2">Demo Credentials:</p>
                <p className="text-blue-800">Clinic admin: dr.kang@caninelink.test / DrKang@12345</p>
                <p className="text-blue-800">Donor: donor@caninelink.test / Donor@12345</p>
                <p className="text-blue-800">Admin: admin@caninelink.test / Admin@12345</p>
              </div>

              <div className="mt-6 space-y-3">
                <p className="text-center text-gray-600 text-sm">Other login options:</p>
                <div className="flex gap-2">
                  <Link to="/donor/login" className="flex-1 btn-secondary text-center text-sm">
                    Donor Login
                  </Link>
                  <Link to="/admin/login" className="flex-1 btn-secondary text-center text-sm">
                    Admin Login
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  )
}

export default HospitalLoginPage
