import React from 'react'
import HospitalLayout from '../../components/layout/HospitalLayout'
import { DashboardCard } from '../../components/ui/DashboardCard'
import { DonorCard } from '../../components/ui/DonorCard'

/**
 * HospitalDashboard Component
 * Main dashboard for veterinary clinics
 */
export function HospitalDashboard() {
  return (
    <HospitalLayout>
      <h1 className="text-4xl font-bold text-gray-900 mb-2">Veterinary Clinic Dashboard</h1>
      <p className="text-gray-600 mb-8">Match canine donors and coordinate emergency transfusions</p>

      <div className="grid-responsive mb-12">
        <DashboardCard title="Active Canine Donors" value="64" icon="DN" color="blood-red" />
        <DashboardCard title="Pending Verification" value="8" icon="VD" color="yellow" />
        <DashboardCard title="Emergency Requests" value="12" icon="ER" color="blue" />
        <DashboardCard title="Available Donors" value="42" icon="BI" color="green" />
        <DashboardCard title="Completed Transfusions" value="86" icon="LS" color="blue" />
      </div>

      <div className="flex items-center justify-between mb-6">
        <div><h2 className="text-2xl font-bold text-gray-900">Recommended Donors</h2><p className="text-gray-600 mt-1">Best available matches for today&apos;s cases</p></div>
        <button className="btn-primary">View all donors</button>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { name: 'Buddy', breed: 'Golden Retriever', bloodType: 'DEA 1 Compatible', distance: '2.5 km away', score: 95, weight: '32 kg', availability: 'Available' },
          { name: 'Luna', breed: 'Labrador Retriever', bloodType: 'DEA 1 Compatible', distance: '4.1 km away', score: 91, weight: '28 kg', availability: 'Available' },
          { name: 'Milo', breed: 'German Shepherd', bloodType: 'DEA 1 Negative', distance: '6.8 km away', score: 87, weight: '35 kg', availability: 'Pending Verification' },
        ].map((donor) => <DonorCard key={donor.name} donor={donor} />)}
      </div>
    </HospitalLayout>
  )
}

export default HospitalDashboard
