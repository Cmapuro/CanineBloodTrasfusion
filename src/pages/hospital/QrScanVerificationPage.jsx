import React, { useRef, useState } from 'react'
import HospitalLayout from '../../components/layout/HospitalLayout'
import QrCodeScanner from '../../components/ui/QrCodeScanner'
import { scanVerificationCode } from '../../services/relayService'

const ARCHIVE_KEY = 'archivedQRScans'

const readArchives = () => {
  try {
    const stored = JSON.parse(localStorage.getItem(ARCHIVE_KEY) || '[]')
    return Array.isArray(stored) ? stored : []
  } catch {
    return []
  }
}

export function QrScanVerificationPage() {
  const [isScanning, setIsScanning] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [scannedData, setScannedData] = useState(null)
  const [error, setError] = useState('')
  const [recentScans, setRecentScans] = useState(readArchives)
  const processingRef = useRef(false)

  const verifyPayload = async (rawValue) => {
    if (processingRef.current) return
    processingRef.current = true
    setIsVerifying(true)
    setError('')
    setIsScanning(false)

    try {
      const result = await scanVerificationCode(rawValue)
      const verified = {
        ...result.data,
        timestamp: result.data.scanned_at || new Date().toISOString(),
      }
      setScannedData(verified)

      const archive = {
        code: verified.code,
        donorName: verified.donor_name,
        timestamp: verified.timestamp,
        status: 'verified',
      }
      const nextArchives = [...readArchives(), archive].slice(-50)
      try {
        localStorage.setItem(ARCHIVE_KEY, JSON.stringify(nextArchives))
      } catch {
        // Verification is persisted by Laravel; the local archive is only a convenience.
      }
      setRecentScans(nextArchives)
    } catch (requestError) {
      setError(
        requestError.response?.data?.message
          || requestError.message
          || 'Unable to verify this QR code. Check your connection and try again.'
      )
    } finally {
      processingRef.current = false
      setIsVerifying(false)
    }
  }

  const handleCameraError = (cameraError) => {
    setIsScanning(false)
    const message = String(cameraError?.message || cameraError || '').toLowerCase()
    if (message.includes('permission') || message.includes('notallowed')) {
      setError('Camera access was denied. Allow camera permission in your browser or device settings, then try again.')
    } else if (message.includes('not found') || message.includes('device')) {
      setError('No camera was found. Connect a camera or enter the verification code manually.')
    } else {
      setError('Unable to start the camera. Use a secure browser context and check camera access.')
    }
  }

  const handleManualInput = (event) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const code = String(formData.get('qrCode') || '').trim()
    if (!code) {
      setError('Enter the verification code or scan its QR code.')
      return
    }
    void verifyPayload(code)
    event.currentTarget.reset()
  }

  const resetScan = () => {
    setScannedData(null)
    setError('')
    processingRef.current = false
  }

  return (
    <HospitalLayout>
      <header className="mb-8">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-blood-red">Clinic operations</p>
        <h1 className="mt-2 text-4xl font-extrabold text-gray-900">QR Code Verification</h1>
        <p className="mt-2 text-gray-600">Verify an accepted donor arrival against its active emergency request.</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(18rem,0.9fr)]">
        <section className="card">
          <div className="mb-5">
            <h2 className="text-2xl font-bold text-gray-900">Scan donor code</h2>
            <p className="mt-1 text-sm text-gray-600">The code is verified by the clinic API. A successful scan can only be processed once.</p>
          </div>

          {scannedData ? (
            <div className="space-y-5">
              <div className="rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-green-50 p-5" role="status">
                <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">Verified by clinic server</p>
                <h3 className="mt-1 text-xl font-extrabold text-gray-900">Donor arrival confirmed</h3>
                <p className="mt-1 text-sm text-emerald-800">Verification code {scannedData.code} is now marked as verified.</p>
              </div>
              <dl className="divide-y divide-gray-100">
                {[
                  ['Donor', scannedData.donor_name],
                  ['Dog ID', scannedData.dog_id],
                  ['Blood type', scannedData.blood_type],
                  ['Patient', scannedData.patient_name],
                  ['Clinic', scannedData.clinic_name],
                  ['Verified at', new Date(scannedData.timestamp).toLocaleString()],
                ].map(([label, value]) => (
                  <div key={label} className="flex flex-wrap justify-between gap-2 py-3 text-sm">
                    <dt className="text-gray-500">{label}</dt>
                    <dd className="font-semibold text-gray-900">{value || 'Not available'}</dd>
                  </div>
                ))}
              </dl>
              <button type="button" onClick={resetScan} className="btn-primary w-full">Scan another code</button>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="overflow-hidden rounded-xl border border-red-100 bg-gradient-to-br from-red-50 via-white to-pink-50 p-4">
                <QrCodeScanner
                  active={isScanning}
                  onDecode={(decodedText) => void verifyPayload(decodedText)}
                  onError={handleCameraError}
                  className={`min-h-64 overflow-hidden rounded-lg ${isScanning ? 'block' : 'hidden'}`}
                />
                {!isScanning && (
                  <div className="flex min-h-64 flex-col items-center justify-center text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-red-100 to-pink-100 text-blood-red">
                      <svg viewBox="0 0 24 24" fill="none" className="h-9 w-9" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                        <path d="M4 8V5a1 1 0 011-1h3m8 0h3a1 1 0 011 1v3m0 8v3a1 1 0 01-1 1h-3m-8 0H5a1 1 0 01-1-1v-3M7 7h4v4H7zm6 0h4v4h-4zm-6 6h4v4H7zm6 2v-2h4v4h-2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <p className="mt-3 font-semibold text-gray-900">Camera scanner ready</p>
                    <p className="mt-1 max-w-sm text-sm text-gray-600">Camera permission is requested when you start scanning.</p>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => { setError(''); setIsScanning((current) => !current) }}
                disabled={isVerifying}
                className="btn-primary w-full"
              >
                {isScanning ? 'Stop camera scan' : 'Start camera scan'}
              </button>

              <div className="relative py-1">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
                <div className="relative flex justify-center"><span className="bg-white px-3 text-sm text-gray-500">or enter code manually</span></div>
              </div>

              <form onSubmit={handleManualInput} className="space-y-3">
                <label htmlFor="qrCode" className="block text-sm font-semibold text-gray-700">Verification code</label>
                <input id="qrCode" name="qrCode" type="text" autoComplete="off" placeholder="CNK-..." className="form-control" disabled={isScanning || isVerifying} />
                <button type="submit" disabled={isScanning || isVerifying} className="btn-secondary w-full">
                  {isVerifying ? 'Verifying with clinic...' : 'Verify code'}
                </button>
              </form>

              {isVerifying && <p className="text-center text-sm font-medium text-blood-red" role="status">Checking code, expiry, and clinic request...</p>}
              {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}</div>}
            </div>
          )}
        </section>

        <aside className="space-y-6">
          <section className="card">
            <h2 className="text-lg font-bold text-gray-900">Verification checks</h2>
            <ul className="mt-4 space-y-3 text-sm text-gray-600">
              <li className="flex gap-3"><span className="font-bold text-blood-red">01</span><span>Only an authenticated clinic account can verify an arrival.</span></li>
              <li className="flex gap-3"><span className="font-bold text-blood-red">02</span><span>The code must belong to an active request for this clinic.</span></li>
              <li className="flex gap-3"><span className="font-bold text-blood-red">03</span><span>Expired, void, or previously processed codes are rejected.</span></li>
            </ul>
          </section>

          <section className="card">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-gray-900">Recent verified scans</h2>
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">This device</span>
            </div>
            <div className="mt-4 space-y-3">
              {recentScans.slice(-3).reverse().map((scan, index) => (
                <div key={`${scan.code}-${index}`} className="flex items-center justify-between gap-3 border-t border-gray-100 pt-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-900">{scan.donorName || 'Verified donor'}</p>
                    <p className="text-xs text-gray-500">{scan.code}</p>
                  </div>
                  <span className="shrink-0 text-xs font-semibold text-emerald-700">Verified</span>
                </div>
              ))}
              {recentScans.length === 0 && <p className="border-t border-gray-100 pt-3 text-sm text-gray-500">No verified scans on this device yet.</p>}
            </div>
            <p className="mt-4 text-xs text-gray-500">The authoritative verification status is stored by the clinic API.</p>
          </section>
        </aside>
      </div>
    </HospitalLayout>
  )
}

export default QrScanVerificationPage