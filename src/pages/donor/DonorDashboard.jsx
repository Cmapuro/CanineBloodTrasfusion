import React, { useEffect, useState } from 'react'
import DonorLayout from '../../components/layout/DonorLayout'
import { DashboardCard } from '../../components/ui/DashboardCard'
import { useAuth } from '../../hooks/useAuth'
import { Link } from 'react-router-dom'
import { EmergencyRequestCard } from '../../components/ui/EmergencyRequestCard'
import QRCode from 'qrcode'
import { getDonorMatches, respondToDonorMatch } from '../../services/relayService'
import { getDonorDonationHistory } from '../../services/authService'

/**
 * DonorDashboard Component
 * Main dashboard for donors showing their statistics and quick actions
 */
export function DonorDashboard() {
  const { user } = useAuth()
  const [matches, setMatches] = useState([])
  const [responding, setResponding] = useState(null)
  const [verification, setVerification] = useState(null)
  const [loadingMatches, setLoadingMatches] = useState(true)
  const [requestError, setRequestError] = useState('')
  const [donationHistory, setDonationHistory] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [historyError, setHistoryError] = useState('')

  const loadMatches = async () => {
    setLoadingMatches(true)
    setRequestError('')
    try {
      const result = await getDonorMatches()
      setMatches(Array.isArray(result) ? result : [])
    } catch (error) {
      setRequestError(error.response?.data?.message || 'Unable to load emergency requests. Please try again.')
    } finally {
      setLoadingMatches(false)
    }
  }

  useEffect(() => {
    loadMatches()
    getDonorDonationHistory()
      .then((donations) => setDonationHistory(Array.isArray(donations) ? donations : []))
      .catch((error) => setHistoryError(error.response?.data?.message || 'Unable to load donation history.'))
      .finally(() => setLoadingHistory(false))
  }, [])

  const respond = async (matchId, decision) => {
    setResponding({ matchId, decision })
    setRequestError('')
    try {
      const result = await respondToDonorMatch(matchId, decision)
      setMatches((current) => current.filter((match) => match.match_id !== matchId))
      if (decision === 'accepted') {
        const qrDataUrl = await QRCode.toDataURL(result.qr_payload, { width: 240, margin: 2, errorCorrectionLevel: 'M' })
        setVerification({ ...result, qrDataUrl })
      }
    } catch (error) {
      setRequestError(error.response?.data?.message || error.message || 'Unable to respond to this request. Please try again.')
    } finally {
      setResponding(null)
    }
  }

  return (
    <DonorLayout>
      {/* Welcome Section */}
      <div className="mb-8">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-blood-red">Dog owner dashboard</p>
        <h1 className="mb-2 text-3xl font-bold text-gray-900 sm:text-4xl">
          Your donor dashboard
        </h1>
        <p className="text-gray-600">Welcome, {user?.name || 'Dog Owner'}. Manage your dogs, donor requests, and transfusion records.</p>
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
          value={loadingHistory ? '...' : historyError ? '—' : donationHistory.length}
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

      <section className="mb-8" aria-labelledby="dashboard-emergency-requests">
        <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-blood-red">Donor coordination</p>
            <h2 id="dashboard-emergency-requests" className="mt-1 text-2xl font-bold text-gray-900">Emergency Requests</h2>
            <p className="mt-1 text-sm text-gray-600">Requests approved by a clinic for one of your dogs.</p>
          </div>
          <button type="button" onClick={loadMatches} disabled={loadingMatches} className="btn-secondary self-start sm:self-auto">
            {loadingMatches ? 'Refreshing...' : 'Refresh requests'}
          </button>
        </div>

        {requestError && <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{requestError}</p>}

        {loadingMatches ? (
          <div className="card py-10 text-center text-gray-500" role="status">Checking for emergency requests...</div>
        ) : matches.length === 0 ? (
          <div className="card py-10 text-center">
            <h3 className="font-bold text-gray-900">No active emergency requests</h3>
            <p className="mt-1 text-sm text-gray-500">New clinic-approved requests for your dogs will appear here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {matches.map((match) => (
              <EmergencyRequestCard
                key={match.match_id}
                request={{
                  patient: match.patient_name || 'Patient name unavailable',
                  clinic: match.clinic?.name || 'Veterinary clinic',
                  required: match.blood_type || 'Blood type not specified',
                  donor: match.donor_name || 'Registered dog',
                  compatibility: match.compatibility_score,
                  deadline: match.response_deadline,
                  urgency: match.urgency_level || 'Urgent',
                }}
                isProcessing={responding !== null}
                processingDecision={responding?.matchId === match.match_id ? responding.decision : null}
                onAccept={() => respond(match.match_id, 'accepted')}
                onDecline={() => respond(match.match_id, 'declined')}
              />
            ))}
          </div>
        )}
      </section>

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

      <div className="card">
        <h2 className="text-xl font-bold mt-8 mb-4 text-gray-900">Donation History</h2>
        {loadingHistory ? (
          <p className="text-sm text-gray-500">Loading recorded donations...</p>
        ) : historyError ? (
          <p className="text-sm text-red-700" role="alert">{historyError}</p>
        ) : donationHistory.length === 0 ? (
          <p className="text-sm text-gray-500">No donations recorded yet.</p>
        ) : (
          <div className="space-y-3">
            {donationHistory.slice(0, 3).map((donation) => (
              <div key={donation.donation_id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-gray-50 p-3">
                <div>
                  <p className="font-semibold text-gray-900">{donation.clinic_name}</p>
                  <p className="text-sm text-gray-600">{donation.dog_name} · {donation.donation_date ? new Date(`${donation.donation_date}T00:00:00`).toLocaleDateString() : 'Date not recorded'}</p>
                </div>
                <span className="badge badge-success">Completed</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </DonorLayout>
  )
}

export default DonorDashboard
