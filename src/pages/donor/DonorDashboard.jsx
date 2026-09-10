import React, { useEffect, useState } from 'react'
import DonorLayout from '../../components/layout/DonorLayout'
import { DashboardCard } from '../../components/ui/DashboardCard'
import { useAuth } from '../../hooks/useAuth'
import { Link } from 'react-router-dom'
import { EmergencyRequestCard } from '../../components/ui/EmergencyRequestCard'
import QRCode from 'qrcode'
import { getDonorMatches, respondToDonorMatch } from '../../services/relayService'

/**
 * DonorDashboard Component
 * Main dashboard for donors showing their statistics and quick actions
 */
export function DonorDashboard() {
  const { user } = useAuth()
  const [matches, setMatches] = useState([])
  const [responding, setResponding] = useState(null)
  const [verification, setVerification] = useState(null)

  useEffect(() => {
    getDonorMatches().then(setMatches).catch(() => setMatches([]))
  }, [])

  const respond = async (matchId, decision) => {
    setResponding(matchId)
    try {
      const result = await respondToDonorMatch(matchId, decision)
      setMatches((current) => current.filter((match) => match.match_id !== matchId))
      if (decision === 'accepted') {
        const qrDataUrl = await QRCode.toDataURL(result.qr_payload, { width: 240, margin: 2, errorCorrectionLevel: 'M' })
        setVerification({ ...result, qrDataUrl })
      }
    } finally {
      setResponding(null)
    }
  }

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
      {matches.length > 0 && (
        <div className="card mb-8 border-rose-200 bg-rose-50/60">
          <p className="text-sm font-bold uppercase tracking-wide text-blood-red mb-2">Emergency donor request</p>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">A clinic needs your help</h2>
          <p className="text-gray-600 mb-5">Your verified dog has been selected as a compatible donor. Accepting will generate a verification QR code.</p>
          <div className="space-y-4">
            {matches.map((match) => (
              <div key={match.match_id} className="rounded-2xl bg-white border border-red-100 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-bold text-gray-900">For patient: {match.patient_name}</p>
                    <p className="text-sm text-gray-600">Blood needed: {match.blood_type} · Your donor: {match.donor_name}</p>
                  </div>
                  <span className="badge badge-danger">{match.urgency_level}</span>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 mt-5">
                  <button type="button" disabled={responding === match.match_id} onClick={() => respond(match.match_id, 'accepted')} className="btn-primary flex-1">
                    {responding === match.match_id ? 'Processing...' : 'Accept request'}
                  </button>
                  <button type="button" disabled={responding === match.match_id} onClick={() => respond(match.match_id, 'declined')} className="btn-secondary flex-1">
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {verification && (
        <div className="card mb-8 border-emerald-200 bg-emerald-50/60">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <img src={verification.qrDataUrl} alt="Donor verification QR code" className="w-48 h-48 rounded-xl bg-white p-3 shadow-sm" />
            <div className="text-center md:text-left">
              <p className="text-sm font-bold uppercase tracking-wide text-emerald-700">Accepted successfully</p>
              <h2 className="text-2xl font-bold text-gray-900 mt-1">Show this code at the clinic</h2>
              <p className="text-gray-600 mt-2">The clinic can scan this QR code to verify your arrival.</p>
              <p className="text-3xl font-extrabold tracking-widest text-blood-red mt-4">{verification.verification_code}</p>
              <p className="text-xs text-gray-500 mt-2">Expires {new Date(verification.expires_at).toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}

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
