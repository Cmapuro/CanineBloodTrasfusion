import React from 'react'
import DonorLayout from '../../components/layout/DonorLayout'
import { DashboardCard } from '../../components/ui/DashboardCard'
import { useAuth } from '../../hooks/useAuth'
import { Link } from 'react-router-dom'
import { EmergencyRequestCard } from '../../components/ui/EmergencyRequestCard'

/**
 * DonorDashboard Component
 * Main dashboard for donors showing their statistics and quick actions
 */
export function DonorDashboard() {
  const { user } = useAuth()

  return (
    <DonorLayout>
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Welcome to CanineLink, {user?.name || 'Dog Owner'}!
        </h1>
        <p className="text-gray-600">Manage your dogs and help coordinate lifesaving transfusions</p>
      </div>

      {/* Stats Cards */}
      <div className="grid-responsive mb-12">
        <DashboardCard
          title="Registered Dogs"
          value="2"
          icon="DN"
          trend={{ direction: 'up', percentage: 20 }}
          color="blood-red"
        />
        <DashboardCard
          title="Successful Transfusions"
          value="5"
          icon="LS"
          color="green"
        />
        <DashboardCard
          title="Eligibility Status"
          value="Eligible"
          icon="DT"
          color="blue"
        />
      </div>

      {/* Quick Actions */}
      <div className="card mb-8">
        <h2 className="text-xl font-bold mb-4 text-gray-900">My Dogs</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <Link to="/donor/register" className="btn-primary text-center">Register dog donor</Link>
          <Link to="/donor/donation-history" className="btn-secondary text-center">Transfusion history</Link>
          <Link to="/donor/profile" className="btn-secondary text-center">Dog profiles</Link>
        </div>
      </div>

      {/* Recent Donations */}
      <div className="card">
        <h2 className="text-xl font-bold mb-4 text-gray-900">Emergency Requests</h2>
        <EmergencyRequestCard
          request={{ patient: 'Buddy', clinic: 'ABC Veterinary Clinic', required: 'DEA 1 Compatible', distance: '3 km', urgency: 'Critical' }}
          onAccept={() => {}}
          onDecline={() => {}}
        />
        <h2 className="text-xl font-bold mt-8 mb-4 text-gray-900">Donation History</h2>
        <div className="space-y-3">
          {[
            { date: 'May 15, 2026', hospital: 'Tagum Medical City', status: 'Completed' },
            { date: 'April 20, 2026', hospital: 'Christ the King Hospital', status: 'Completed' },
            { date: 'March 25, 2026', hospital: 'Davao Regional Medical Center', status: 'Completed' },
          ].map((donation, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-semibold text-gray-900">{donation.hospital}</p>
                <p className="text-sm text-gray-600">{donation.date}</p>
              </div>
              <span className="badge badge-success">{donation.status}</span>
            </div>
          ))}
        </div>
      </div>
    </DonorLayout>
  )
}

export default DonorDashboard
