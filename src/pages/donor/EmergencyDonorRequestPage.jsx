import React, { useEffect, useState } from 'react'
import DonorLayout from '../../components/layout/DonorLayout'
import { getDonorMatches, respondToDonorMatch } from '../../services/relayService'
import QRCode from 'qrcode'

function RequestIcon({ type }) {
  const paths = {
    clinic: <><path d="M4 20h16M6 20V8h12v12M8 8V5h8v3M9 12h1M14 12h1M9 16h1M14 16h1" /><path d="M12 2v3" /></>,
    patient: <><circle cx="12" cy="8" r="3" /><path d="M5 20a7 7 0 0114 0" /></>,
    blood: <path d="M12 3s5 5.2 5 9a5 5 0 11-10 0c0-3.8 5-9 5-9z" />,
    map: <><path d="M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3V6z" /><path d="M9 3v15M15 6v15" /></>,
  }

  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">{paths[type]}</svg>
}
import OpenStreetMap from '../../components/common/OpenStreetMap'

function ClinicMap({ clinic }) {
  const latitude = Number(clinic?.latitude)
  const longitude = Number(clinic?.longitude)
  const hasCoordinates = Number.isFinite(latitude) && Number.isFinite(longitude)
  const directionsUrl = hasCoordinates
    ? `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(clinic?.name || 'veterinary clinic')}`

  return (
    <div className="mt-5 overflow-hidden rounded-2xl border border-red-100 bg-gray-50">
      <div className="flex items-center justify-between gap-3 border-b border-red-100 bg-white px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-bold text-gray-900"><span className="text-blood-red"><RequestIcon type="map" /></span> Clinic location</div>
        <a href={directionsUrl} target="_blank" rel="noreferrer" className="text-xs font-bold text-blood-red hover:underline">Get directions</a>
      </div>
      <OpenStreetMap latitude={latitude} longitude={longitude} title={clinic?.name} address={clinic?.address} />
    </div>
  )
}

export function EmergencyDonorRequestPage() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [responding, setResponding] = useState(null)
  const [verification, setVerification] = useState(null)
  const [error, setError] = useState('')

  const loadRequests = () => {
    setLoading(true)
    getDonorMatches()
      .then(setRequests)
      .catch(() => setError('Unable to load emergency donor requests.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadRequests()
  }, [])

  const respond = async (matchId, decision) => {
    setResponding(matchId)
    setError('')
    try {
      const result = await respondToDonorMatch(matchId, decision)
      setRequests((current) => current.filter((request) => request.match_id !== matchId))
      if (decision === 'accepted') {
        const qrDataUrl = await QRCode.toDataURL(result.qr_payload, {
          width: 240,
          margin: 2,
          errorCorrectionLevel: 'M',
        })
        setVerification({ ...result, qrDataUrl })
      }
    } catch (responseError) {
      setError(responseError.message || 'Unable to respond to this request.')
    } finally {
      setResponding(null)
    }
  }

  return (
    <DonorLayout>
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-blood-red">Donor coordination</p>
          <h1 className="mt-2 text-4xl font-extrabold text-gray-900">Emergency Donor Requests</h1>
          <p className="mt-2 max-w-2xl text-gray-600">Review requests approved by a partner clinic and decide whether your verified dog can help.</p>
        </div>
        <button type="button" onClick={loadRequests} className="btn-secondary">Refresh requests</button>
      </div>

      {error && <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {loading ? (
        <div className="card py-20 text-center text-gray-500">Checking for approved emergency requests...</div>
      ) : requests.length === 0 ? (
        <div className="card py-20 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600"><RequestIcon type="blood" /></div>
          <h2 className="mt-5 text-xl font-bold text-gray-900">No active emergency requests</h2>
          <p className="mx-auto mt-2 max-w-md text-gray-500">When a clinic approves your donor for a compatible request, it will appear here.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {requests.map((request) => (
            <article key={request.match_id} className="overflow-hidden rounded-3xl border border-red-100 bg-white shadow-sm">
              <div className="flex flex-col justify-between gap-4 border-b border-red-100 bg-gradient-to-r from-red-50 to-white p-5 sm:flex-row sm:items-start sm:p-6">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blood-red text-white"><RequestIcon type="clinic" /></span>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-blood-red">Requesting clinic</p>
                      <h2 className="text-xl font-extrabold text-gray-900">{request.clinic?.name || 'Veterinary clinic'}</h2>
                    </div>
                  </div>
                  {request.clinic?.address && <p className="mt-4 text-sm text-gray-600">{request.clinic.address}</p>}
                  {request.clinic?.phone && <p className="text-sm text-gray-500">{request.clinic.phone}</p>}
                </div>
                <span className="badge badge-danger self-start">{request.urgency_level}</span>
              </div>

              <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4 sm:p-6">
                <div className="flex items-center gap-3 rounded-2xl bg-gray-50 p-4"><span className="text-blood-red"><RequestIcon type="patient" /></span><div><p className="text-xs text-gray-500">Patient</p><p className="font-bold text-gray-900">{request.patient_name}</p></div></div>
                <div className="rounded-2xl bg-gray-50 p-4"><p className="text-xs text-gray-500">Breed / weight</p><p className="font-bold text-gray-900">{request.patient_breed || 'Not specified'}</p><p className="text-sm text-gray-500">{request.patient_weight_kg ? `${request.patient_weight_kg} kg` : 'Weight not specified'}</p></div>
                <div className="flex items-center gap-3 rounded-2xl bg-gray-50 p-4"><span className="text-blood-red"><RequestIcon type="blood" /></span><div><p className="text-xs text-gray-500">Blood needed</p><p className="font-bold text-gray-900">{request.blood_type}</p></div></div>
                <div className="rounded-2xl bg-gray-50 p-4"><p className="text-xs text-gray-500">Units / donor</p><p className="font-bold text-gray-900">{request.units_needed || 1} unit{request.units_needed === 1 ? '' : 's'} · {request.donor_name}</p><p className="text-sm text-emerald-700">{request.compatibility_score}% compatible</p></div>
              </div>

              {request.notes && <p className="px-5 text-sm text-gray-600 sm:px-6"><strong className="text-gray-900">Clinic notes:</strong> {request.notes}</p>}
              <div className="px-5 pb-5 sm:px-6"><ClinicMap clinic={request.clinic} /></div>

              <div className="flex flex-col gap-3 border-t border-gray-100 p-5 sm:flex-row sm:justify-end sm:p-6">
                <button type="button" disabled={responding === request.match_id} onClick={() => respond(request.match_id, 'declined')} className="btn-secondary sm:min-w-40">Decline</button>
                <button type="button" disabled={responding === request.match_id} onClick={() => respond(request.match_id, 'accepted')} className="btn-primary sm:min-w-40">{responding === request.match_id ? 'Processing...' : 'Accept and generate QR'}</button>
              </div>
            </article>
          ))}
        </div>
      )}

      {verification && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 text-center shadow-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">Request accepted</p>
            <h2 className="mt-2 text-2xl font-extrabold text-gray-900">Verification QR code</h2>
            <img src={verification.qrDataUrl} alt="Emergency donor verification QR code" className="mx-auto my-5 h-56 w-56 rounded-2xl border border-gray-100 p-3" />
            <p className="text-sm text-gray-500">Show this code when you arrive at the requesting clinic.</p>
            <p className="mt-3 text-3xl font-extrabold tracking-widest text-blood-red">{verification.verification_code}</p>
            <button type="button" onClick={() => setVerification(null)} className="btn-primary mt-5 w-full">Done</button>
          </div>
        </div>
      )}
    </DonorLayout>
  )
}

export default EmergencyDonorRequestPage
