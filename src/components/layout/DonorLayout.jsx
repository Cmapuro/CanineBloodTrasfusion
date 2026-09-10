/**
 * DonorLayout Component
 * Layout for donor pages (requires donor authentication)
 * Includes: Sidebar, Footer, NotificationAlert, FloatingNotification
 */
import React, { useEffect, useState } from 'react'
import { Sidebar } from '../common/Sidebar'
import { Footer } from '../common/Footer'
import { NotificationAlert } from '../common/NotificationAlert'
import { FloatingNotification } from '../common/FloatingNotification'
import { getDonorMatches, respondToDonorMatch } from '../../services/relayService'
import QRCode from 'qrcode'

/**
 * DonorLayout Component
 * Layout for donor pages (requires donor authentication)
 * Includes: Sidebar, Footer, NotificationAlert, FloatingNotification
 */
export function DonorLayout({ children }) {
  const [emergencyMatch, setEmergencyMatch] = useState(null)
  const [popupOpen, setPopupOpen] = useState(false)
  const [popupMinimized, setPopupMinimized] = useState(false)
  const [responding, setResponding] = useState(false)
  const [verification, setVerification] = useState(null)
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    try {
      return window.innerWidth < 768 ? 0 : 288
    } catch (e) {
      return 288
    }
  })

  useEffect(() => {
    const handleSidebarWidth = (event) => {
      const nextWidth = event?.detail?.width
      if (typeof nextWidth === 'number') {
        setSidebarWidth(nextWidth)
      }
    }

    window.addEventListener('admin-sidebar-width', handleSidebarWidth)

    return () => {
      window.removeEventListener('admin-sidebar-width', handleSidebarWidth)
    }
  }, [])

  useEffect(() => {
    getDonorMatches().then((matches) => {
      const pending = matches.find((match) => !sessionStorage.getItem(`donor-match-seen-${match.match_id}`))
      if (pending) {
        setEmergencyMatch(pending)
        setPopupOpen(true)
        setPopupMinimized(false)
      }
    }).catch(() => {})
  }, [])

  const closePopup = () => {
    if (emergencyMatch) sessionStorage.setItem(`donor-match-seen-${emergencyMatch.match_id}`, 'true')
    setPopupOpen(false)
  }

  const respond = async (decision) => {
    if (!emergencyMatch) return
    setResponding(true)
    try {
      const result = await respondToDonorMatch(emergencyMatch.match_id, decision)
      if (decision === 'accepted') {
        const qrDataUrl = await QRCode.toDataURL(result.qr_payload, { width: 220, margin: 2, errorCorrectionLevel: 'M' })
        setVerification({ ...result, qrDataUrl })
      } else {
        closePopup()
      }
    } finally {
      setResponding(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Notification System */}
      <NotificationAlert />

      {/* Floating Notification Icon */}
      <FloatingNotification />

      {popupOpen && emergencyMatch && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
          <div className={`${popupMinimized ? 'fixed bottom-5 right-5 max-w-sm' : 'w-full max-w-lg'} overflow-hidden rounded-3xl bg-white shadow-2xl transition-all`}>
            <div className="flex items-start justify-between gap-4 bg-gradient-to-r from-blood-dark to-blood-red p-5 text-white">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-100/75">Emergency donor request</p>
                <h2 className="mt-2 text-xl font-extrabold">Your dog may help save a life</h2>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setPopupMinimized((current) => !current)} className="rounded-lg p-2 text-red-100 hover:bg-white/15 hover:text-white" aria-label={popupMinimized ? 'Expand request' : 'Minimize request'} title={popupMinimized ? 'Expand' : 'Minimize'}>
                  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true"><path d={popupMinimized ? 'M8 14l4-4 4 4' : 'M8 10l4 4 4-4'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </button>
                <button type="button" onClick={closePopup} className="rounded-lg p-2 text-red-100 hover:bg-white/15 hover:text-white" aria-label="Exit request popup" title="Exit">
                  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
                </button>
              </div>
            </div>
            {!popupMinimized && <div className="space-y-5 p-6">
              <div className="rounded-2xl border border-red-100 bg-red-50/70 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-blood-red">Requesting clinic</p>
                    <p className="mt-1 text-lg font-bold text-gray-900">{emergencyMatch.clinic?.name || 'Veterinary clinic'}</p>
                  </div>
                  <span className="badge badge-danger">{emergencyMatch.urgency_level}</span>
                </div>
                <p className="mt-3 text-sm text-gray-600">Patient: <strong>{emergencyMatch.patient_name}</strong></p>
                <p className="text-sm text-gray-600">Blood needed: <strong>{emergencyMatch.blood_type}</strong> · Your donor: <strong>{emergencyMatch.donor_name}</strong></p>
                {emergencyMatch.clinic?.address && <p className="mt-3 text-sm text-gray-500">{emergencyMatch.clinic.address}</p>}
                {emergencyMatch.clinic?.phone && <p className="text-sm text-gray-500">{emergencyMatch.clinic.phone}</p>}
              </div>
              <p className="text-sm text-gray-500">You can accept or decline this request. Accepting generates a verification QR code for the clinic.</p>
              <div className="flex gap-3">
                <button type="button" onClick={() => respond('declined')} disabled={responding} className="btn-secondary flex-1">Decline</button>
                <button type="button" onClick={() => respond('accepted')} disabled={responding} className="btn-primary flex-1">{responding ? 'Processing...' : 'Accept request'}</button>
              </div>
            </div>}
            {popupMinimized && <button type="button" onClick={() => setPopupMinimized(false)} className="w-full px-5 py-3 text-left text-sm font-semibold text-gray-700 hover:bg-red-50">View emergency request from {emergencyMatch.clinic?.name || 'the clinic'}</button>}
          </div>
        </div>
      )}

      {verification && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 text-center shadow-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">Request accepted</p>
            <h2 className="mt-2 text-2xl font-extrabold text-gray-900">Your verification QR code</h2>
            <img src={verification.qrDataUrl} alt="Verification QR code" className="mx-auto my-5 h-52 w-52 rounded-2xl border border-gray-100 p-3" />
            <p className="text-sm text-gray-500">Show this at the requesting clinic.</p>
            <p className="mt-3 text-3xl font-extrabold tracking-widest text-blood-red">{verification.verification_code}</p>
            <button type="button" onClick={() => { setVerification(null); closePopup() }} className="btn-primary mt-5 w-full">Done</button>
          </div>
        </div>
      )}

      {/* Main Content with Sidebar */}
      <div className="flex flex-1">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <main
          className="flex-1 transition-all"
          style={{ marginLeft: sidebarWidth }}
        >
          <div className="p-6 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Footer aligned with sidebar */}
      <div
        style={{
          marginLeft: sidebarWidth,
          width: sidebarWidth ? `calc(100% - ${sidebarWidth}px)` : '100%',
        }}
      >
        <Footer />
      </div>
    </div>
  )
}

export default DonorLayout
