import React from 'react'
import PublicLayout from '../../components/layout/PublicLayout'
import { HospitalCard } from '../../components/ui/HospitalCard'
import hospitalsData from '../../data/hospitals.json'
import hospitalService from '../../services/hospitalService'
import { useEffect, useState } from 'react'
import { LogoMark } from '../../components/common/LogoMark'

/**
 * HospitalListPage Component
 * Displays list of partner hospitals and blood facilities
 * Features: hospital cards with details, responsive grid layout
 */
export function HospitalListPage() {
  const [hospitals, setHospitals] = useState([])

  useEffect(() => {
    let mounted = true

    const load = async () => {
      try {
        const list = await hospitalService.getAllHospitals()
        if (mounted) setHospitals(list || [])
      } catch (e) {
        if (mounted) setHospitals(hospitalsData)
      }
    }

    load()

    const handleUpdate = (e) => {
      const updated = e?.detail?.hospitals
      if (updated) setHospitals(updated)
      else load()
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
            Authorized Veterinary Clinics
          </h1>
          <p className="text-gray-700 text-lg">
            Trusted partners and blood centers we coordinate with
          </p>
        </div>
      </section>

      {/* Hospitals Grid */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Summary */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {hospitals.length} Partner Facilities
            </h2>
            <p className="text-gray-600">
              All hospitals and blood centers are verified and accredited partners
            </p>
          </div>

          {/* Hospital Cards Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {hospitals.map((hospital) => (
              <HospitalCard
                key={hospital.id}
                hospital={hospital}
                onClick={() => console.log('Hospital clicked:', hospital)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Hospital Categories Section */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Our Network</h2>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Hospitals */}
            <div className="card text-center">
              <LogoMark size="md" className="mx-auto mb-4" alt="Category logo" />
              <h3 className="text-xl font-bold mb-2">General Hospitals</h3>
              <p className="text-gray-600">
                Full-service hospitals with complete blood banking facilities
              </p>
              <div className="mt-4 text-2xl font-bold text-blood-red">5</div>
            </div>

            {/* Specialist Hospitals */}
            <div className="card text-center">
              <LogoMark size="md" className="mx-auto mb-4" alt="Category logo" />
              <h3 className="text-xl font-bold mb-2">Specialist Centers</h3>
              <p className="text-gray-600">
                Specialized medical centers with specialized blood services
              </p>
              <div className="mt-4 text-2xl font-bold text-blood-red">2</div>
            </div>

            {/* Blood Banks */}
            <div className="card text-center">
              <LogoMark size="md" className="mx-auto mb-4" alt="Category logo" />
              <h3 className="text-xl font-bold mb-2">Blood Centers</h3>
              <p className="text-gray-600">
                Dedicated blood collection and distribution centers
              </p>
              <div className="mt-4 text-2xl font-bold text-blood-red">2</div>
            </div>
          </div>
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
