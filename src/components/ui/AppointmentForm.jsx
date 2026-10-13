import React, { useState } from 'react'
import { CANINE_BLOOD_TYPES } from '../../utils/bloodTypes'

/**
 * AppointmentForm Component
 * Form for scheduling blood donation appointments
 * Features: date/time picker, blood type selection, hospital selection, validation
 */
export function AppointmentForm({ onSubmit, hospitals = [], loading = false }) {
  // Form state
  const [formData, setFormData] = useState({
    hospitalID: '',
    appointmentDate: '',
    appointmentTime: '',
    bloodType: '',
    notes: '',
  })

  // Validation errors
  const [errors, setErrors] = useState({})

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }))
    }
  }

  // Validate form
  const validateForm = () => {
    const newErrors = {}

    if (!formData.hospitalID) newErrors.hospitalID = 'Please select a hospital'
    if (!formData.appointmentDate) newErrors.appointmentDate = 'Please select a date'
    if (!formData.appointmentTime) newErrors.appointmentTime = 'Please select a time'
    if (!formData.bloodType) newErrors.bloodType = 'Please select your blood type'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle submit
  const handleSubmit = (e) => {
    e.preventDefault()

    if (validateForm()) {
      onSubmit(formData)
      // Reset form
      setFormData({
        hospitalID: '',
        appointmentDate: '',
        appointmentTime: '',
        bloodType: '',
        notes: '',
      })
    }
  }

  // Get minimum date (today)
  const today = new Date().toISOString().split('T')[0]

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Hospital Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Hospital
        </label>
        <select
          name="hospitalID"
          value={formData.hospitalID}
          onChange={handleChange}
          className={`form-control ${errors.hospitalID ? 'border-red-500' : ''}`}
        >
          <option value="">-- Select a hospital --</option>
          {hospitals.map((hospital) => (
            <option key={hospital.id} value={hospital.id}>
              {hospital.name}
            </option>
          ))}
        </select>
        {errors.hospitalID && (
          <p className="text-red-600 text-sm mt-1">{errors.hospitalID}</p>
        )}
      </div>

      {/* Date Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Appointment Date
        </label>
        <input
          type="date"
          name="appointmentDate"
          value={formData.appointmentDate}
          onChange={handleChange}
          min={today}
          className={`form-control ${errors.appointmentDate ? 'border-red-500' : ''}`}
        />
        {errors.appointmentDate && (
          <p className="text-red-600 text-sm mt-1">{errors.appointmentDate}</p>
        )}
      </div>

      {/* Time Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Appointment Time
        </label>
        <input
          type="time"
          name="appointmentTime"
          value={formData.appointmentTime}
          onChange={handleChange}
          className={`form-control ${errors.appointmentTime ? 'border-red-500' : ''}`}
        />
        {errors.appointmentTime && (
          <p className="text-red-600 text-sm mt-1">{errors.appointmentTime}</p>
        )}
      </div>

      {/* Blood Type Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Blood Type
        </label>
        <select
          name="bloodType"
          value={formData.bloodType}
          onChange={handleChange}
          className={`form-control ${errors.bloodType ? 'border-red-500' : ''}`}
        >
          <option value="">-- Select your blood type --</option>
          {CANINE_BLOOD_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
        {errors.bloodType && (
          <p className="text-red-600 text-sm mt-1">{errors.bloodType}</p>
        )}
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Additional Notes (Optional)
        </label>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          placeholder="Any additional information..."
          rows={3}
          className="form-control"
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="btn-primary w-full"
      >
        {loading ? 'Scheduling...' : 'Schedule Appointment'}
      </button>
    </form>
  )
}

export default AppointmentForm
