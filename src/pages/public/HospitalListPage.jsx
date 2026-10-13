import React, { useEffect, useState } from 'react'
import PublicLayout from '../../components/layout/PublicLayout'
import { HospitalCard } from '../../components/ui/HospitalCard'
import hospitalsData from '../../data/hospitals.json'
import { getPublicClinics } from '../../services/hospitalService'

/**
 * HospitalListPage Component
 * Displays list of partner hospitals and blood facilities
 * Features: hospital cards with details, responsive grid layout
 */
export function HospitalListPage() {
  const [hospitals, setHospitals] = useState([])
  const [loading, setLoading] = useState(true)
  const [usingFallback, setUsingFallback] = useState(false)

  useEffect(() => {
    let mounted = true

    const load = async () => {
      try {
        const list = await getPublicClinics()
        if (mounted) {
          setHospitals(list)
          setUsingFallback(false)
        }
      } catch (e) {
        if (mounted) {
          setHospitals(hospitalsData)
          setUsingFallback(true)
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }

    load()

    const handleUpdate = (event) => {
      const updated = event?.detail?.hospitals
      if (Array.isArray(updated)) {
        setHospitals(updated)
        setUsingFallback(true)
      } else {
        setLoading(true)
        load()
      }
    }
    window.addEventListener('hospitals-updated', handleUpdate)

    return () => {
      mounted = false
      window.removeEventListener('hospitals-updated', handleUpdate)
    }
  }, [])

  return (
    <PublicLayout>
      {/* Header */}
      <section className="bg-blood-light py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-blood-red mb-4">
            Accredited Veterinary Clinics
          </h1>
          <p className="text-gray-700 text-lg">
            Trusted accredited clinics we coordinate with for donor support and emergency response
          </p>
        </div>
      </section>

      {/* Hospitals Grid */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Summary */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{hospitals.length} Accredited Clinics</h2>
            <p className="text-gray-600">
              All listed veterinary clinics are verified accredited providers in our donor network
            </p>
            {usingFallback && <p className="mt-3 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900" role="status">Live clinic data is unavailable. Showing saved directory information; directions require verified coordinates.</p>}
          </div>

          {/* Hospital Cards Grid */}
          {loading ? (
            <div className="card py-16 text-center text-gray-500" role="status">Loading partner clinics...</div>
          ) : hospitals.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {hospitals.map((hospital) => <HospitalCard key={hospital.id} hospital={hospital} />)}
            </div>
          ) : (
            <div className="card py-16 text-center">
              <h3 className="text-xl font-bold text-gray-900">No active clinics listed</h3>
              <p className="mt-2 text-gray-600">Please check back later for participating veterinary clinics.</p>
            </div>
          )}
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Need More Information?</h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            For more details about any facility or to schedule a visit, please contact us
          </p>
          <a href="/contact" className="btn-primary px-8 py-3">
            Contact Us
          </a>
        </div>
      </section>
    </PublicLayout>
  )
}

export default HospitalListPage
