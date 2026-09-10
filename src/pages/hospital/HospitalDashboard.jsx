import React, { useEffect, useState } from 'react'
import HospitalLayout from '../../components/layout/HospitalLayout'
import { DashboardCard } from '../../components/ui/DashboardCard'
import { DonorCard } from '../../components/ui/DonorCard'
import { getClinicMatches, approveClinicMatch } from '../../services/relayService'

/**
 * HospitalDashboard Component
 * Main dashboard for veterinary clinics
 */
export function HospitalDashboard() {
  const [matches, setMatches] = useState([])
  const [busyMatch, setBusyMatch] = useState(null)

  useEffect(() => {
    getClinicMatches().then(setMatches).catch(() => setMatches([]))
  }, [])

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

      <div className="grid-responsive mb-12">
        <DashboardCard title="Active Canine Donors" value="64" icon="DN" color="blood-red" />
        <DashboardCard title="Pending Verification" value="8" icon="VD" color="yellow" />
        <DashboardCard title="Emergency Requests" value="12" icon="ER" color="blue" />
        <DashboardCard title="Available Donors" value="42" icon="BI" color="green" />
        <DashboardCard title="Completed Transfusions" value="86" icon="LS" color="blue" />
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
