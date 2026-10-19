import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import PublicLayout from '../../components/layout/PublicLayout'
import { useContext } from 'react'
import { NotificationContext } from '../../context/NotificationContext'
import { Modal } from '../../components/common/Modal'
import { PasswordInput } from '../../components/common/PasswordInput'
import { validateEmail, validatePhone } from '../../utils/validators'
import { CANINE_BLOOD_TYPES } from '../../utils/bloodTypes'
import { registerDonor } from '../../services/authService'
import { getPublicClinics } from '../../services/clinicService'
import { useAuth } from '../../hooks/useAuth'

/**
 * DonorRegistrationPage Component
 * Registration page for a new canine donor
 * Features: mock form validation, auto-generated donor ID, DEA compatibility selection
 */
export function DonorRegistrationPage() {
  const navigate = useNavigate()
  const { success, error } = useContext(NotificationContext)
  const { acceptRegistration } = useAuth()

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    dogName: '',
    breed: '',
    ageYears: '',
    weightKg: '',
    sex: '',
    bloodType: '',
    clinicId: '',
    agreeTerms: false,
  })
  const [clinics, setClinics] = useState([])
  const [loadingClinics, setLoadingClinics] = useState(true)
  const [clinicError, setClinicError] = useState('')
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [formError, setFormError] = useState('')
  const [showPrivacyModal, setShowPrivacyModal] = useState(false)
  const [breedListOpen, setBreedListOpen] = useState(false)
  const [activeBreedIndex, setActiveBreedIndex] = useState(0)

  const dogBreeds = [
    'Aspin', 'Australian Cattle Dog', 'Australian Shepherd', 'Beagle', 'Bernese Mountain Dog',
    'Bichon Frise', 'Border Collie', 'Boxer', 'Bulldog', 'Cavalier King Charles Spaniel',
    'Chihuahua', 'Cocker Spaniel', 'Dachshund', 'Doberman Pinscher', 'French Bulldog',
    'German Shepherd', 'Golden Retriever', 'Great Dane', 'Jack Russell Terrier', 'Labrador Retriever',
    'Maltese', 'Mixed breed', 'Pomeranian', 'Poodle', 'Pug', 'Rottweiler', 'Shih Tzu',
    'Siberian Husky', 'Yorkshire Terrier',
  ]
  const matchingBreeds = dogBreeds.filter((breed) =>
    breed.toLowerCase().includes(formData.breed.trim().toLowerCase())
  )

  const loadClinics = async () => {
    setLoadingClinics(true)
    setClinicError('')
    try {
      const activeClinics = await getPublicClinics()
      setClinics(Array.isArray(activeClinics) ? activeClinics : [])
    } catch {
      setClinicError('Unable to load clinics. Check your connection and try again.')
    } finally {
      setLoadingClinics(false)
    }
  }

  useEffect(() => {
    loadClinics()
  }, [])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    if (name === 'agreeTerms' && type === 'checkbox' && checked) {
      setShowPrivacyModal(true)
      return
    }

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
    if (name === 'breed') {
      setBreedListOpen(true)
      setActiveBreedIndex(0)
    }
    setFormError('')
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const selectBreed = (breed) => {
    setFormData((prev) => ({ ...prev, breed }))
    setBreedListOpen(false)
    setActiveBreedIndex(0)
    if (errors.breed) {
      setErrors((prev) => ({ ...prev, breed: '' }))
    }
  }

  const handleBreedKeyDown = (e) => {
    if (e.key === 'Escape') {
      setBreedListOpen(false)
    } else if (e.key === 'ArrowDown' && matchingBreeds.length > 0) {
      e.preventDefault()
      setBreedListOpen(true)
      setActiveBreedIndex((index) => Math.min(index + 1, matchingBreeds.length - 1))
    } else if (e.key === 'ArrowUp' && matchingBreeds.length > 0) {
      e.preventDefault()
      setActiveBreedIndex((index) => Math.max(index - 1, 0))
    } else if (e.key === 'Enter' && breedListOpen && matchingBreeds[activeBreedIndex]) {
      e.preventDefault()
      selectBreed(matchingBreeds[activeBreedIndex])
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Enter your full name.'
    }
    if (!validateEmail(formData.email)) {
      newErrors.email = 'Enter a valid email address.'
    }
    if (!validatePhone(formData.phone)) {
      newErrors.phone = 'Enter a valid phone number.'
    }
    if (!formData.password || formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }
    if (!formData.dogName.trim()) {
      newErrors.dogName = 'Enter your dog’s name.'
    }
    if (!formData.breed.trim()) {
      newErrors.breed = 'Select or enter your dog’s breed.'
    }
    if (!formData.ageYears || Number(formData.ageYears) < 1 || Number(formData.ageYears) > 15) {
      newErrors.age = 'Dog age must be between 1 and 15 years'
    }
    if (!['male', 'female'].includes(formData.sex)) {
      newErrors.sex = 'Select your dog’s sex.'
    }
    if (formData.weightKg && (Number(formData.weightKg) < 0.1 || Number(formData.weightKg) > 999.99)) {
      newErrors.weightKg = 'Weight must be between 0.1 and 999.99 kg.'
    }
    if (!formData.clinicId) {
      newErrors.clinicId = 'Choose a veterinary clinic to review this dog.'
    }
    if (!formData.agreeTerms) {
      newErrors.agreeTerms = 'You must agree to terms and conditions'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      error('Please fix the errors in the form')
      return
    }

    setIsLoading(true)
    setFormError('')

    try {
      const response = await registerDonor({
        full_name: formData.fullName.trim(),
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        clinic_id: Number(formData.clinicId),
        dog_name: formData.dogName.trim(),
        breed: formData.breed.trim(),
        age_years: Number(formData.ageYears),
        sex: formData.sex,
        weight_kg: formData.weightKg ? Number(formData.weightKg) : null,
        blood_type: formData.bloodType || null,
      })
      acceptRegistration(response)
      success(`${response.dog.name} is registered and pending review at ${response.dog.clinic_name}.`)
      navigate('/donor/dashboard', { replace: true })
    } catch (err) {
      const formFields = {
        full_name: 'fullName',
        dog_name: 'dogName',
        age_years: 'age',
        weight_kg: 'weightKg',
        blood_type: 'bloodType',
        clinic_id: 'clinicId',
      }
      const serverErrors = err.errors
        ? Object.fromEntries(Object.entries(err.errors).map(([field, messages]) => [formFields[field] || field, messages[0]]))
        : {}
      setErrors((current) => ({ ...current, ...serverErrors }))
      const message = err.message || 'Registration failed. Please try again.'
      setFormError(message)
      error(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <PublicLayout>
      <section className="min-h-screen bg-gray-50 py-12">
        <div className="mx-auto max-w-2xl px-4">
          <header className="mb-8 text-center">
            <h1 className="mb-2 text-4xl font-bold text-blood-red">Register Dog Donor</h1>
            <p className="text-gray-600">Create your owner account and register your dog for clinic review.</p>
          </header>

          <div className="rounded-lg bg-white p-6 shadow-soft sm:p-8">
            <div className="mb-8 rounded-lg bg-blue-50 p-4">
              <p className="text-sm text-blue-800">
                <span className="font-semibold">Your owner account and first dog profile</span> will be created together.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {formError && <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{formError}</p>}

              <section aria-labelledby="owner-account-heading">
                <div className="mb-4 border-b border-red-100 pb-2">
                  <h2 id="owner-account-heading" className="text-lg font-bold text-gray-900">Owner account</h2>
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Full name" name="fullName" error={errors.fullName}>
                    <input autoComplete="name" type="text" name="fullName" value={formData.fullName} onChange={handleChange} className="form-control" required />
                  </Field>
                  <Field label="Phone number" name="phone" error={errors.phone}>
                    <input autoComplete="tel" type="tel" name="phone" value={formData.phone} onChange={handleChange} className="form-control" required />
                  </Field>
                  <Field label="Email address" name="email" error={errors.email} className="sm:col-span-2">
                    <input autoComplete="email" type="email" name="email" value={formData.email} onChange={handleChange} className="form-control" required />
                  </Field>
                  <Field label="Password" name="password" error={errors.password}>
                    <PasswordInput autoComplete="new-password" name="password" value={formData.password} onChange={handleChange} className="form-control" required />
                  </Field>
                  <Field label="Confirm password" name="confirmPassword" error={errors.confirmPassword}>
                    <PasswordInput autoComplete="new-password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} className="form-control" required />
                  </Field>
                </div>
              </section>

              <section aria-labelledby="dog-profile-heading">
                <div className="mb-4 border-b border-red-100 pb-2">
                  <h2 id="dog-profile-heading" className="text-lg font-bold text-gray-900">Dog donor profile</h2>
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Dog’s name" name="dogName" error={errors.dogName}>
                    <input type="text" name="dogName" value={formData.dogName} onChange={handleChange} className="form-control" required />
                  </Field>
                  <div
                    className="relative"
                    onBlur={(e) => {
                      if (!e.currentTarget.contains(e.relatedTarget)) setBreedListOpen(false)
                    }}
                  >
                    <label htmlFor="donor-registration-breed" className="mb-2 block text-sm font-semibold text-gray-800">Breed</label>
                    <input
                      id="donor-registration-breed"
                      type="text"
                      name="breed"
                      value={formData.breed}
                      onChange={handleChange}
                      onFocus={() => setBreedListOpen(true)}
                      onKeyDown={handleBreedKeyDown}
                      placeholder="Search or enter a breed"
                      className={`form-control ${errors.breed ? 'border-red-500' : ''}`}
                      autoComplete="off"
                      role="combobox"
                      aria-autocomplete="list"
                      aria-expanded={breedListOpen}
                      aria-controls="donor-registration-breed-list"
                      aria-activedescendant={breedListOpen && matchingBreeds[activeBreedIndex] ? `donor-registration-breed-option-${activeBreedIndex}` : undefined}
                      aria-invalid={Boolean(errors.breed)}
                      aria-describedby={errors.breed ? 'donor-registration-breed-error' : 'donor-registration-breed-hint'}
                      required
                    />
                    {breedListOpen && (
                      <div id="donor-registration-breed-list" role="listbox" className="absolute left-0 right-0 top-full z-30 mt-1 max-h-56 overflow-y-auto rounded-lg border border-red-100 bg-white p-1 text-gray-800 shadow-lg">
                        {matchingBreeds.length ? matchingBreeds.map((breed) => {
                          const optionIndex = matchingBreeds.indexOf(breed)
                          return (
                            <button
                              key={breed}
                              id={`donor-registration-breed-option-${optionIndex}`}
                              type="button"
                              role="option"
                              aria-selected={optionIndex === activeBreedIndex}
                              onMouseDown={(e) => e.preventDefault()}
                              onMouseEnter={() => setActiveBreedIndex(optionIndex)}
                              onClick={() => selectBreed(breed)}
                              className={`block w-full rounded-md px-3 py-2 text-left text-sm ${optionIndex === activeBreedIndex ? 'bg-red-50 font-semibold text-blood-red' : 'text-gray-800 hover:bg-gray-50'}`}
                            >
                              {breed}
                            </button>
                          )
                        }) : (
                          <p className="px-3 py-2 text-sm text-gray-500">No preset match. Your typed breed will be used.</p>
                        )}
                      </div>
                    )}
                    <p id="donor-registration-breed-hint" className="mt-1 text-xs text-gray-500">Choose a suggestion or type a breed not listed.</p>
                    {errors.breed && <p id="donor-registration-breed-error" className="mt-1 text-sm text-red-600">{errors.breed}</p>}
                  </div>
                  <Field label="Age (years)" name="ageYears" error={errors.age}>
                    <input type="number" name="ageYears" value={formData.ageYears} onChange={handleChange} min="1" max="15" step="1" className="form-control" required />
                  </Field>
                  <Field label="Sex" name="sex" error={errors.sex}>
                    <select name="sex" value={formData.sex} onChange={handleChange} className="form-control" required>
                      <option value="">Choose sex</option>
                      <option value="female">Female</option>
                      <option value="male">Male</option>
                    </select>
                  </Field>
                  <Field label="Weight in kg (optional)" name="weightKg" error={errors.weightKg}>
                    <input type="number" name="weightKg" value={formData.weightKg} onChange={handleChange} min="0.1" max="999.99" step="0.1" placeholder="Leave blank if unknown" className="form-control" />
                  </Field>
                  <Field label="DEA blood type (optional)" name="bloodType" error={errors.bloodType}>
                    <select name="bloodType" value={formData.bloodType} onChange={handleChange} className="form-control">
                      <option value="">Unknown or not tested</option>
                      {CANINE_BLOOD_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
                    </select>
                  </Field>
                </div>
              </section>

              <section aria-labelledby="clinic-review-heading">
                <div className="mb-4 border-b border-red-100 pb-2">
                  <h2 id="clinic-review-heading" className="text-lg font-bold text-gray-900">Veterinary clinic</h2>
                  <p className="mt-1 text-sm text-gray-600">Choose the clinic that will review your dog’s donor registration.</p>
                </div>
                <div>
                  <label htmlFor="donor-registration-clinicId" className="mb-2 block text-sm font-semibold text-gray-800">Clinic for veterinary review</label>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <select id="donor-registration-clinicId" name="clinicId" value={formData.clinicId} onChange={handleChange} className={`form-control ${errors.clinicId || clinicError ? 'border-red-500' : ''}`} aria-invalid={Boolean(errors.clinicId || clinicError)} aria-describedby={errors.clinicId || clinicError ? 'donor-registration-clinicId-error' : undefined} required disabled={loadingClinics || clinics.length === 0}>
                      <option value="">{loadingClinics ? 'Loading active clinics...' : clinics.length ? 'Select a clinic' : 'No active clinics available'}</option>
                      {clinics.map((clinic) => (
                        <option key={clinic.clinic_id} value={clinic.clinic_id}>
                          {clinic.name}{clinic.address ? ` — ${clinic.address}` : ''}
                        </option>
                      ))}
                    </select>
                    {clinicError && <button type="button" onClick={loadClinics} disabled={loadingClinics} className="btn-secondary shrink-0">Retry</button>}
                  </div>
                  {(errors.clinicId || clinicError) && <p id="donor-registration-clinicId-error" className="mt-1 text-sm text-red-600">{errors.clinicId || clinicError}</p>}
                </div>
              </section>

              <div className="border-t border-red-100 pt-6">
                <label className="flex items-start gap-3 text-sm text-gray-700">
                  <input type="checkbox" name="agreeTerms" checked={formData.agreeTerms} onChange={handleChange} className="mt-1 h-4 w-4 accent-blood-red" />
                  <span>I agree to the Terms and Conditions and Privacy Policy.</span>
                </label>
                {errors.agreeTerms && <p className="mt-2 text-sm text-red-600">{errors.agreeTerms}</p>}
                <button type="submit" disabled={isLoading || loadingClinics || clinics.length === 0} className="btn-primary mt-6 w-full disabled:cursor-not-allowed disabled:opacity-60">
                  {isLoading ? 'Creating account and dog profile...' : 'Create donor account'}
                </button>
              </div>
            </form>
          </div>

          <p className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/donor/login" className="font-semibold text-blood-red hover:text-blood-dark">Sign in</Link>
          </p>
        </div>
      </section>

      <Modal
        isOpen={showPrivacyModal}
        title="Privacy Notice — Data Privacy Act (Philippines)"
        onClose={() => setShowPrivacyModal(false)}
        onConfirm={() => {
          // user accepted the privacy notice
          setFormData((prev) => ({ ...prev, agreeTerms: true }))
          setShowPrivacyModal(false)
        }}
        confirmText="I accept"
        cancelText="Cancel"
      >
        <div className="space-y-3 text-sm text-gray-700">
          <p>Your contact details and your dog’s profile will be used to manage donor registration, clinic review, and emergency donation coordination.</p>
          <p>The selected clinic receives the dog information needed to review eligibility. Other owners cannot view your account or dog profile.</p>
          <p>You may request access to, correction of, or deletion of your personal information under the Data Privacy Act of 2012 by contacting CanineLink support.</p>
        </div>
      </Modal>
    </PublicLayout>
  )
}

function Field({ label, name, error, hint, className = '', children }) {
  const fieldId = `donor-registration-${name}`

  return (
    <div className={className}>
      <label htmlFor={fieldId} className="mb-2 block text-sm font-semibold text-gray-800">{label}</label>
      {React.cloneElement(children, {
        id: fieldId,
        'aria-invalid': Boolean(error),
        'aria-describedby': error ? `${fieldId}-error` : undefined,
        className: `${children.props.className || ''} ${error ? 'border-red-500' : ''}`.trim(),
      })}
      {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
      {error && <p id={`${fieldId}-error`} className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  )
}

export default DonorRegistrationPage
