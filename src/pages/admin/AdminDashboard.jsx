import React from 'react'
import AdminLayout from '../../components/layout/AdminLayout'
import { DashboardCard } from '../../components/ui/DashboardCard'
import { AnalyticsBarChart } from '../../components/ui/AnalyticsBarChart'
import donorsJson from '../../data/donors.json'
import hospitalsJson from '../../data/hospitals.json'

function useTotals() {
  const storedDonors = localStorage.getItem('donors')
  const storedHospitals = localStorage.getItem('hospitals')
  const donors = storedDonors ? JSON.parse(storedDonors) : donorsJson
  const hospitals = storedHospitals ? JSON.parse(storedHospitals) : hospitalsJson
  const successfulTransfusions = donors.reduce((s, d) => s + (d.totalDonations || 0), 0) + 18
  return { donorsCount: donors.length + 42, clinicsCount: hospitals.length + 8, successfulTransfusions }
}

/**
 * AdminDashboard Component
 * Main admin dashboard
 */
export function AdminDashboard() {
  const totals = useTotals()
  const transfusions = [
    { label: 'Completed', value: 86 },
    { label: 'Pending', value: 14 },
    { label: 'Cancelled', value: 5 },
  ]
  const emergencyTrends = [
    { label: 'Mon', value: 8 }, { label: 'Tue', value: 12 }, { label: 'Wed', value: 9 },
    { label: 'Thu', value: 15 }, { label: 'Fri', value: 11 }, { label: 'Sat', value: 18 },
    { label: 'Sun', value: 10 },
  ]

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900">Provincial Veterinary Office Dashboard</h1>
        <p className="text-gray-600 mt-2">CanineLink coordination overview</p>
      </div>

      <div className="grid-responsive mb-12">
        <DashboardCard title="Registered Canine Donors" value={totals.donorsCount.toLocaleString()} icon="DN" trend={{ direction: 'up', percentage: 15 }} color="blood-red" />
        <DashboardCard title="Successful Transfusions" value={totals.successfulTransfusions.toLocaleString()} icon="VD" trend={{ direction: 'up', percentage: 23 }} color="green" />
        <DashboardCard title="Emergency Blood Requests" value="156" icon="ER" trend={{ direction: 'down', percentage: 8 }} color="yellow" />
        <DashboardCard title="Authorized Veterinary Clinics" value={totals.clinicsCount.toLocaleString()} icon="HP" trend={{ direction: 'up', percentage: 5 }} color="blue" />
      </div>

      <div className="grid xl:grid-cols-2 gap-8 mb-8">
        <AnalyticsBarChart
          title="Canine Transfusion Statistics"
          subtitle="Completed, pending, and cancelled coordination cases"
          data={transfusions}
          formatter={(value) => `${value}`}
          colorClass="bg-gradient-to-t from-blood-dark to-blood-red"
        />

        <AnalyticsBarChart
          title="Emergency Request Trends"
          subtitle="Daily emergency cases across the veterinary network"
          data={emergencyTrends}
          formatter={(value) => `${value} cases`}
          colorClass="bg-gradient-to-t from-blood-red to-rose-400"
        />

        <div className="card">
          <h2 className="text-xl font-bold mb-4">Veterinary Clinic Activity</h2>
          <div className="space-y-3">
            {['PawCare Veterinary Clinic · 24 requests handled', 'Happy Tails Animal Hospital · 19 requests handled', 'North Valley Vet Center · 15 requests handled', 'City Paws Clinic · 12 requests handled'].map((activity, idx) => (
              <p key={idx} className="text-gray-600 text-sm py-2 border-b last:border-0">{activity}</p>
            ))}
          </div>
        </div>

        <div className="card">
          <h2 className="text-xl font-bold mb-4">Donor Availability Status</h2>
          <div className="space-y-3">
            {[
              { name: 'Available now', status: '42 donors' },
              { name: 'Pending verification', status: '8 donors' },
              { name: 'In recovery', status: '13 donors' },
              { name: 'Emergency response rate', status: '94%' },
            ].map((service, idx) => (
              <div key={idx} className="flex items-center justify-between py-2 border-b last:border-0">
                <span className="text-gray-700">{service.name}</span>
                <span className="text-xs font-bold px-2 py-1 bg-green-100 text-green-800 rounded">
                  {service.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

export default AdminDashboard
