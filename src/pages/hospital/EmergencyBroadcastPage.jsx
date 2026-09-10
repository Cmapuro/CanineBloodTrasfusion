import React, { useEffect, useState } from 'react'
import HospitalLayout from '../../components/layout/HospitalLayout'
import { EmergencyRequestForm } from '../../components/ui/EmergencyRequestForm'
import { Modal } from '../../components/common/Modal'
import { LogoMark } from '../../components/common/LogoMark'
import { createEmergencyRequest } from '../../services/hospitalService'
import { useContext } from 'react'
import { NotificationContext } from '../../context/NotificationContext'

/**
 * EmergencyBroadcastPage Component
 * Page for veterinary clinics to broadcast emergency canine transfusion requests
 */
export function EmergencyBroadcastPage() {
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [matchResult, setMatchResult] = useState(null)
  const [searching, setSearching] = useState(false)
  const [progress, setProgress] = useState(0)
  const { error } = useContext(NotificationContext)

  const handleSubmit = async (formData) => {
    setLoading(true)
    try {
      const result = await createEmergencyRequest({
        patient_name: formData.patientName,
        patient_breed: formData.patientBreed || null,
        patient_weight_kg: formData.patientWeightKg ? Number(formData.patientWeightKg) : null,
        blood_type: formData.bloodType,
        units_needed: Number(formData.quantity),
        urgency_level: { low: 'routine', medium: 'urgent', high: 'urgent', critical: 'critical' }[formData.urgencyLevel],
        notes: formData.reason || null,
      })
      setMatchResult(result)
      setProgress(0)
      setSearching(true)
      setShowConfirm(true)
    } catch (submitError) {
      error(submitError.message || submitError.errors?.blood_type?.[0] || 'Unable to create the emergency request.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!searching) return undefined

    const timer = window.setInterval(() => {
      setProgress((current) => {
        const next = Math.min(current + 8, 100)
        if (next === 100) {
          window.clearInterval(timer)
          window.setTimeout(() => setSearching(false), 450)
        }
        return next
      })
    }, 100)

    return () => window.clearInterval(timer)
  }, [searching])

  return (
    <HospitalLayout>
      <h1 className="text-4xl font-bold text-gray-900 mb-2">Emergency Canine Transfusion Request</h1>
      <p className="text-gray-600 mb-8">Broadcast an urgent case to compatible canine donors</p>

      <div className="max-w-2xl">
        <div className="card">
          <EmergencyRequestForm onSubmit={handleSubmit} loading={loading} />
        </div>
      </div>

      <Modal
        isOpen={showConfirm}
        title="Emergency request broadcast"
        onClose={() => setShowConfirm(false)}
        onConfirm={() => setShowConfirm(false)}
      >
        {searching ? (
          <div className="text-center py-3">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-red-50 text-blood-red">
              <svg viewBox="0 0 24 24" fill="none" className="h-10 w-10 animate-spin" aria-hidden="true">
                <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
                <path d="M16 16l4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </div>
            <p className="text-lg font-bold text-gray-900">AI is searching compatible donors</p>
            <p className="text-sm text-gray-500 mt-1">Checking blood type, eligibility, availability, and donation interval.</p>
            <div className="mt-6 h-2 overflow-hidden rounded-full bg-red-100">
              <div className="h-full rounded-full bg-gradient-to-r from-blood-red to-rose-400 transition-all duration-100" style={{ width: `${progress}%` }} />
            </div>
            <p className="mt-3 text-2xl font-extrabold text-blood-red">{progress}%</p>
          </div>
        ) : (
          <div className="text-center">
            <LogoMark size="lg" className="mx-auto mb-4" alt="Broadcast success logo" />
            <p className="text-gray-600">{matchResult?.message}</p>
            {matchResult?.matches?.length > 0 && (
            <div className="mt-5 text-left rounded-xl bg-red-50 p-4">
              <p className="font-semibold text-gray-900">AI matching started</p>
              <p className="text-sm text-gray-600 mt-1">{matchResult.matches.length} eligible donor{matchResult.matches.length === 1 ? '' : 's'} ranked. The top donor has been notified.</p>
              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="text-gray-600">Top match</span>
                <span className="font-semibold text-blood-red">{matchResult.matches[0].donor_name} · {matchResult.matches[0].blood_type}</span>
              </div>
            </div>
            )}
          </div>
        )}
      </Modal>
    </HospitalLayout>
  )
}

export default EmergencyBroadcastPage
