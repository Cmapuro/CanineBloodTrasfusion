import React, { useState } from 'react'
import { BLOOD_TYPES } from '../../utils/bloodTypes'

/**
 * EmergencyRequestForm Component
 * Form for submitting emergency blood requests
 * Features: blood type selection, quantity input, urgency level, validation
 */
export function EmergencyRequestForm({ onSubmit, loading = false }) {
  // Form state
  const [formData, setFormData] = useState({
    bloodType: '',
    quantity: '',
    urgencyLevel: 'high',
    patientName: '',
    patientBreed: '',
    patientWeightKg: '',
    reason: '',
    contactPerson: '',
    contactPhone: '',
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
    // Clear error when user starts typing
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

    if (!formData.bloodType) newErrors.bloodType = 'Please select a blood type'
    if (!formData.quantity) newErrors.quantity = 'Please enter quantity'
    if (parseInt(formData.quantity) <= 0) newErrors.quantity = 'Quantity must be greater than 0'
    if (!formData.patientName) newErrors.patientName = 'Patient name is required'
    if (!formData.contactPerson) newErrors.contactPerson = 'Contact person name is required'
    if (!formData.contactPhone) newErrors.contactPhone = 'Contact phone is required'

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
        bloodType: '',
        quantity: '',
        urgencyLevel: 'high',
        patientName: '',
        patientBreed: '',
        patientWeightKg: '',
        reason: '',
        contactPerson: '',
        contactPhone: '',
      })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Blood Type Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Blood Type Needed
        </label>
        <select
          name="bloodType"
          value={formData.bloodType}
          onChange={handleChange}
          className={`form-control ${errors.bloodType ? 'border-red-500' : ''}`}
        >
          <option value="">-- Select blood type --</option>
          {BLOOD_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
        {errors.bloodType && (
          <p className="text-red-600 text-sm mt-1">{errors.bloodType}</p>
        )}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Patient Breed</label>
          <input type="text" name="patientBreed" value={formData.patientBreed} onChange={handleChange} placeholder="e.g. Labrador Retriever" className="form-control" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Patient Weight (kg)</label>
          <input type="number" min="0.1" step="0.1" name="patientWeightKg" value={formData.patientWeightKg} onChange={handleChange} placeholder="e.g. 24.5" className="form-control" />
        </div>
      </div>

      {/* Quantity */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Quantity (Units)
        </label>
        <input
          type="number"
          name="quantity"
          value={formData.quantity}
          onChange={handleChange}
          placeholder="Enter quantity needed"
          min="1"
          className={`form-control ${errors.quantity ? 'border-red-500' : ''}`}
        />
        {errors.quantity && (
          <p className="text-red-600 text-sm mt-1">{errors.quantity}</p>
        )}
      </div>

      {/* Urgency Level */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Urgency Level
        </label>
        <select
          name="urgencyLevel"
          value={formData.urgencyLevel}
          onChange={handleChange}
          className="form-control"
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
      </div>

      {/* Patient Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Patient Name
        </label>
        <input
          type="text"
          name="patientName"
          value={formData.patientName}
          onChange={handleChange}
          placeholder="Enter patient name"
          className={`form-control ${errors.patientName ? 'border-red-500' : ''}`}
        />
        {errors.patientName && (
          <p className="text-red-600 text-sm mt-1">{errors.patientName}</p>
        )}
      </div>

      {/* Reason */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Reason for Request
        </label>
        <textarea
          name="reason"
          value={formData.reason}
          onChange={handleChange}
          placeholder="Reason for emergency blood request"
          rows={3}
          className="form-control"
        />
      </div>

      {/* Contact Person */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Contact Person Name
        </label>
        <input
          type="text"
          name="contactPerson"
          value={formData.contactPerson}
          onChange={handleChange}
          placeholder="Enter contact person name"
          className={`form-control ${errors.contactPerson ? 'border-red-500' : ''}`}
        />
        {errors.contactPerson && (
          <p className="text-red-600 text-sm mt-1">{errors.contactPerson}</p>
        )}
      </div>

      {/* Contact Phone */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Contact Phone Number
        </label>
        <input
          type="tel"
          name="contactPhone"
          value={formData.contactPhone}
          onChange={handleChange}
          placeholder="Enter phone number"
          className={`form-control ${errors.contactPhone ? 'border-red-500' : ''}`}
        />
        {errors.contactPhone && (
          <p className="text-red-600 text-sm mt-1">{errors.contactPhone}</p>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="btn-primary w-full"
      >
        {loading ? 'Submitting...' : 'Submit Emergency Request'}
      </button>
    </form>
  )
}

export default EmergencyRequestForm
