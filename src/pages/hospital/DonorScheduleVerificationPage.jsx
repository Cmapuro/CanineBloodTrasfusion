import React from 'react'
import HospitalLayout from '../../components/layout/HospitalLayout'

/**
 * DonorScheduleVerificationPage Component
 * Frontend mockup for emergency QR verification
 */
export function DonorScheduleVerificationPage() {
  return (
    <HospitalLayout>
      <h1 className="text-4xl font-bold text-gray-900 mb-2">Emergency Verification</h1>
      <p className="text-gray-600 mb-8">Scan or enter a code to verify a canine donor before transfusion</p>
      <div className="grid lg:grid-cols-2 gap-8">
        <div className="card text-center">
          <div className="mx-auto mb-5 w-56 h-56 bg-gray-900 p-4 grid grid-cols-7 gap-1" aria-label="QR code placeholder">
            {Array.from({ length: 49 }, (_, index) => <span key={index} className={index % 3 === 0 || index % 7 === 0 ? 'bg-white' : 'bg-gray-900'} />)}
          </div>
          <p className="text-sm text-gray-500">QR Code Placeholder</p>
          <p className="text-xs text-gray-400 mt-2">Emergency verification code</p>
          <p className="text-2xl font-black tracking-[0.3em] text-blood-red mt-2">CNK-4829</p>
        </div>
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-5">Donor Information</h2>
          <div className="space-y-4">
            <div><p className="text-sm text-gray-500">Dog name</p><p className="font-semibold">Buddy</p></div>
            <div><p className="text-sm text-gray-500">Breed</p><p className="font-semibold">Golden Retriever</p></div>
            <div><p className="text-sm text-gray-500">DEA compatibility</p><p className="font-semibold">DEA 1 Compatible</p></div>
            <div><p className="text-sm text-gray-500">Vaccination status</p><span className="badge badge-success">Verified</span></div>
          </div>
          <button className="btn-primary w-full mt-8">Verify emergency donor</button>
        </div>
      </div>
    </HospitalLayout>
  )
}

export default DonorScheduleVerificationPage
