import React, { useState } from 'react'
import PublicLayout from '../../components/layout/PublicLayout'
import { EmergencyRequestForm } from '../../components/ui/EmergencyRequestForm'
import { Modal } from '../../components/common/Modal'
import { LogoMark } from '../../components/common/LogoMark'

/**
 * EmergencyRequestPage Component
 * Page for submitting emergency blood requests
 * Features: request form, guidelines, contact information
 */
export function EmergencyRequestPage() {
  // State for form submission modal
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Handle form submission
  const handleFormSubmit = async (formData) => {
    setIsSubmitting(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))
    console.log('Emergency request submitted:', formData)
    setIsSubmitting(false)
    setShowConfirmation(true)
  }

  return (
    <PublicLayout>
      {/* Header */}
      <section className="bg-gradient-to-r from-red-600 to-red-700 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
              <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth="2">
                <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="text-sm font-semibold uppercase tracking-wider text-red-100">Emergency Services</span>
          </div>
          <h1 className="text-5xl font-extrabold mb-4 tracking-tight">
            Emergency Blood Request
          </h1>
          <p className="text-xl text-red-100 max-w-2xl">
            Quickly request blood units for critical canine emergency situations
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Form Section */}
            <div className="lg:col-span-2">
              <div className="card shadow-xl border-0 bg-white">
                <div className="border-b border-gray-100 pb-6 mb-6">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    Submit Emergency Request
                  </h2>
                  <p className="text-gray-600">
                    Fill out the form below to request emergency blood transfusion
                  </p>
                </div>
                <EmergencyRequestForm
                  onSubmit={handleFormSubmit}
                  loading={isSubmitting}
                />
              </div>
            </div>

            {/* Info Section */}
            <div className="space-y-6">
              {/* Guidelines */}
              <div className="card shadow-lg border-0 bg-gradient-to-br from-red-50 to-white">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blood-red text-white">
                    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="2">
                      <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">
                    Guidelines
                  </h3>
                </div>
                <ul className="space-y-3 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 mt-0.5 text-blood-red" stroke="currentColor" strokeWidth="2">
                      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Provide accurate patient information
                  </li>
                  <li className="flex items-start gap-2">
                    <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 mt-0.5 text-blood-red" stroke="currentColor" strokeWidth="2">
                      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Specify exact blood type needed
                  </li>
                  <li className="flex items-start gap-2">
                    <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 mt-0.5 text-blood-red" stroke="currentColor" strokeWidth="2">
                      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Include urgency level
                  </li>
                  <li className="flex items-start gap-2">
                    <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 mt-0.5 text-blood-red" stroke="currentColor" strokeWidth="2">
                      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Provide contact information
                  </li>
                  <li className="flex items-start gap-2">
                    <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 mt-0.5 text-blood-red" stroke="currentColor" strokeWidth="2">
                      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Our team will respond within 5 minutes
                  </li>
                </ul>
              </div>

              {/* Emergency Numbers */}
              <div className="card shadow-lg border-l-4 border-red-600 bg-gradient-to-r from-red-600 to-red-700 text-white">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="2">
                      <path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold">
                    Emergency Hotline
                  </h3>
                </div>
                <p className="text-sm text-red-100 mb-3">
                  For immediate assistance:
                </p>
                <p className="text-3xl font-bold tracking-wider mb-2">
                  1-800-BLOOD-911
                </p>
                <p className="text-xs text-red-200">
                  24/7 Emergency Support Available
                </p>
              </div>

              {/* Urgency Levels */}
              <div className="card shadow-lg border-0 bg-white">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-700">
                    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="2">
                      <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">
                    Urgency Levels
                  </h3>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-green-50 border border-green-100">
                    <span className="w-4 h-4 bg-green-500 rounded-full shadow-sm"></span>
                    <span className="font-medium text-gray-700">Low - Planned procedure</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-yellow-50 border border-yellow-100">
                    <span className="w-4 h-4 bg-yellow-500 rounded-full shadow-sm"></span>
                    <span className="font-medium text-gray-700">Medium - Scheduled surgery</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-orange-50 border border-orange-100">
                    <span className="w-4 h-4 bg-orange-500 rounded-full shadow-sm"></span>
                    <span className="font-medium text-gray-700">High - Urgent need</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-red-50 border border-red-100">
                    <span className="w-4 h-4 bg-red-600 rounded-full shadow-sm"></span>
                    <span className="font-medium text-gray-700">Critical - Life-threatening</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Our streamlined process ensures quick response times for emergency blood requests
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {/* Step 1 */}
            <div className="text-center group">
              <div className="w-16 h-16 bg-gradient-to-br from-blood-red to-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 font-bold text-2xl shadow-lg group-hover:scale-110 transition-transform">
                1
              </div>
              <h3 className="font-bold mb-2 text-gray-900">Submit Request</h3>
              <p className="text-sm text-gray-600">
                Fill out the emergency request form with patient details
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center group">
              <div className="w-16 h-16 bg-gradient-to-br from-blood-red to-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 font-bold text-2xl shadow-lg group-hover:scale-110 transition-transform">
                2
              </div>
              <h3 className="font-bold mb-2 text-gray-900">Verification</h3>
              <p className="text-sm text-gray-600">
                Our team verifies the request and matches donors
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center group">
              <div className="w-16 h-16 bg-gradient-to-br from-blood-red to-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 font-bold text-2xl shadow-lg group-hover:scale-110 transition-transform">
                3
              </div>
              <h3 className="font-bold mb-2 text-gray-900">Broadcast</h3>
              <p className="text-sm text-gray-600">
                Request sent to available donors in your area
              </p>
            </div>

            {/* Step 4 */}
            <div className="text-center group">
              <div className="w-16 h-16 bg-gradient-to-br from-blood-red to-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 font-bold text-2xl shadow-lg group-hover:scale-110 transition-transform">
                4
              </div>
              <h3 className="font-bold mb-2 text-gray-900">Fulfillment</h3>
              <p className="text-sm text-gray-600">
                Blood units delivered to your facility
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Confirmation Modal */}
      <Modal
        isOpen={showConfirmation}
        title="Request Submitted Successfully"
        onClose={() => setShowConfirmation(false)}
        onConfirm={() => setShowConfirmation(false)}
        confirmText="Close"
      >
        <div className="text-center">
          <LogoMark size="lg" className="mx-auto mb-4" alt="Request submitted logo" />
          <h3 className="text-lg font-bold mb-2 text-gray-900">
            Your emergency blood request has been submitted!
          </h3>
          <p className="text-gray-600 mb-4">
            Our team will start matching donors immediately. You will receive updates via phone and email.
          </p>
          <p className="text-sm text-blood-red font-semibold">
            Request ID: REQ-{Math.random().toString().substr(2, 8).toUpperCase()}
          </p>
        </div>
      </Modal>
    </PublicLayout>
  )
}

export default EmergencyRequestPage
