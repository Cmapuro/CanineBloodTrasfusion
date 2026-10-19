import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import HospitalLayout from '../../components/layout/HospitalLayout'
import { DashboardCard } from '../../components/ui/DashboardCard'
import { DonorCard } from '../../components/ui/DonorCard'
import { getClinicMatches, approveClinicMatch } from '../../services/relayService'
import { getClinicDashboardSummary, getClinicDonorDogs } from '../../services/clinicService'

/**
 * HospitalDashboard Component
 * Main dashboard for veterinary clinics
 */
export function HospitalDashboard() {
  const [matches, setMatches] = useState([])
  const [busyMatch, setBusyMatch] = useState(null)
  const [summary, setSummary] = useState(null)
  const [loadingSummary, setLoadingSummary] = useState(true)
  const [summaryError, setSummaryError] = useState('')
  const [donors, setDonors] = useState([])
  const [loadingDonors, setLoadingDonors] = useState(true)
  const [donorError, setDonorError] = useState('')

  const loadSummary = async () => {
    setLoadingSummary(true)
    setSummaryError('')
    try {
      setSummary(await getClinicDashboardSummary())
    } catch (error) {
      setSummaryError(error.response?.data?.message || 'Unable to load clinic totals.')
    } finally {
      setLoadingSummary(false)
    }
  }

  const loadDonors = async () => {
    setLoadingDonors(true)
    setDonorError('')
    try {
      const clinicDogs = await getClinicDonorDogs()
      setDonors(Array.isArray(clinicDogs) ? clinicDogs : [])
    } catch (error) {
      setDonorError(error.response?.data?.message || 'Unable to load clinic donors.')
    } finally {
      setLoadingDonors(false)
    }
  }

  useEffect(() => {
    getClinicMatches().then(setMatches).catch(() => setMatches([]))
    loadSummary()
    loadDonors()
  }, [])

  const summaryValue = (key) => loadingSummary ? '...' : summaryError ? '—' : (summary?.[key] ?? 0)
  const availableDonors = donors.filter((dog) => dog.eligibility_status === 'verified' && dog.availability_status === 'available')

  const approve = async (matchId) => {
    setBusyMatch(matchId)
    try {
      await approveClinicMatch(matchId)
      setMatches((current) => current.map((match) => match.match_id === matchId ? { ...match, status: 'notified' } : match))
    } finally {
      setBusyMatch(null)
    }
  }

  return (
    <HospitalLayout>
      <h1 className="text-4xl font-bold text-gray-900 mb-2">Veterinary Clinic Dashboard</h1>
      <p className="text-gray-600 mb-8">Match canine donors and coordinate emergency transfusions</p>

      {summaryError && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          <span>{summaryError}</span>
          <button type="button" onClick={loadSummary} disabled={loadingSummary} className="font-semibold underline">
            Retry totals
          </button>
        </div>
      )}

      <div className="grid-responsive mb-12">
        <DashboardCard title="Active Canine Donors" value={summaryValue('active_donors')} icon="DN" color="blood-red" />
        <DashboardCard title="Pending Verification" value={summaryValue('pending_verification')} icon="VD" color="yellow" />
        <DashboardCard title="Emergency Requests" value={summaryValue('emergency_requests')} icon="ER" color="blue" />
        <DashboardCard title="Available Donors" value={summaryValue('available_donors')} icon="BI" color="green" />
        <DashboardCard title="Completed Transfusions" value={summaryValue('completed_transfusions')} icon="LS" color="blue" />
      </div>

      {matches.length > 0 && (
        <section className="card mb-10 border-rose-200 bg-rose-50/60">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-blood-red">Cross-clinic relay</p>
              <h2 className="text-2xl font-bold text-gray-900">Donor approvals waiting for Clinic 2</h2>
              <p className="text-gray-600 mt-1">Review compatible donors before they are offered to the owner.</p>
            </div>
            <span className="badge badge-warning">{matches.length} pending</span>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {matches.map((match) => (
              <div key={match.match_id} className="rounded-2xl bg-white border border-red-100 p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-gray-900">{match.donor_name}</p>
                    <p className="text-sm text-gray-500">Request for {match.patient_name}</p>
                  </div>
                  <span className="badge badge-success">{match.compatibility_score}% match</span>
                </div>
                <div className="mt-4 flex items-center justify-between text-sm">
                  <span className="text-gray-600">Needed: <strong>{match.blood_type}</strong></span>
                  <span className="text-gray-600">Donor: <strong>{match.donor_blood_type}</strong></span>
                </div>
                <button type="button" disabled={busyMatch === match.match_id || match.status === 'notified'} onClick={() => approve(match.match_id)} className="btn-primary w-full mt-5">
                  {match.status === 'notified' ? 'Donor notified' : busyMatch === match.match_id ? 'Approving...' : 'Approve donor'}
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="flex items-center justify-between mb-6">
        <div><h2 className="text-2xl font-bold text-gray-900">Available Clinic Donors</h2><p className="text-gray-600 mt-1">Verified, available dogs registered with your clinic</p></div>
        <Link to="/hospital/donor-list?filter=all" className="btn-primary">View all donors</Link>
      </div>
      {donorError ? (
        <div className="card flex flex-wrap items-center justify-between gap-3" role="alert">
          <p className="text-sm text-red-700">{donorError}</p>
          <button type="button" onClick={loadDonors} disabled={loadingDonors} className="btn-secondary">Retry</button>
        </div>
      ) : loadingDonors ? (
        <div className="card py-10 text-center text-gray-500" role="status">Loading clinic donor records...</div>
      ) : availableDonors.length === 0 ? (
        <div className="card py-10 text-center">
          <h3 className="font-bold text-gray-900">No available clinic donors</h3>
          <p className="mt-1 text-sm text-gray-500">Verified donors marked available will appear here.</p>
          <Link to="/hospital/donor-list?filter=all" className="btn-secondary mt-4 inline-flex">Review clinic donor records</Link>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {availableDonors.slice(0, 6).map((donor) => <DonorCard key={donor.dog_id} donor={donor} />)}
        </div>
      )}
    </HospitalLayout>
  )
}

export default HospitalDashboard
