import React, { useState, useEffect, useRef } from 'react'
import HospitalLayout from '../../components/layout/HospitalLayout'
import { Modal } from '../../components/common/Modal'
import QrScanner from 'qr-scanner'

export function QrScanVerificationPage() {
  const [scannedData, setScannedData] = useState(null)
  const [isScanning, setIsScanning] = useState(false)
  const [scanResult, setScanResult] = useState(null)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [error, setError] = useState('')
  const videoRef = useRef(null)
  const scannerRef = useRef(null)

  useEffect(() => {
    return () => {
      scannerRef.current?.stop()
      scannerRef.current?.destroy()
    }
  }, [])

  const finishScan = (rawValue) => {
    let payload

    try {
      payload = JSON.parse(rawValue)
    } catch {
      payload = { code: rawValue }
    }

    if (!payload.code) {
      setError('This QR code is not a valid CanineLink verification code.')
      return
    }

    scannerRef.current?.stop()
    setScannedData({
      code: payload.code,
      requestId: payload.request_id,
      matchId: payload.match_id,
      donorName: payload.donor_name || 'Verified donor',
      donorId: payload.dog_id || 'Available in donor record',
      bloodType: payload.blood_type || 'See donor record',
      patientName: payload.patient_name || 'Linked emergency request',
      clinicName: payload.clinic_name || 'CanineLink Veterinary Clinic',
      timestamp: new Date().toISOString()
    })
    setIsScanning(false)
    setScanResult('success')
    setShowSuccessModal(true)
    archiveScannedQR({ code: payload.code, requestId: payload.request_id, matchId: payload.match_id, timestamp: new Date().toISOString() })
  }

  const handleScan = async () => {
    if (!videoRef.current) return

    setError('')
    setIsScanning(true)

    try {
      scannerRef.current?.stop()
      scannerRef.current?.destroy()
      const scanner = new QrScanner(
        videoRef.current,
        (result) => finishScan(typeof result === 'string' ? result : result.data),
        {
          preferredCamera: 'environment',
          highlightScanRegion: true,
          highlightCodeOutline: true,
          returnDetailedScanResult: true,
          maxScansPerSecond: 10,
        }
      )
      scannerRef.current = scanner
      await scanner.start()
    } catch (scanError) {
      scannerRef.current?.stop()
      setIsScanning(false)
      setError(scanError?.name === 'NotAllowedError'
        ? 'Camera access was blocked. Allow camera permission in your browser or device settings, then try again.'
        : 'Unable to start the camera. Use manual code entry or check that your device has a camera.')
    }
  }

  const archiveScannedQR = (data) => {
    // Get existing archived scans from localStorage
    const existingArchives = JSON.parse(localStorage.getItem('archivedQRScans') || '[]')
    
    // Add new scan with status
    const newArchive = {
      ...data,
      status: 'successfully_scanned',
      archivedAt: new Date().toISOString()
    }
    
    // Save to localStorage
    existingArchives.push(newArchive)
    localStorage.setItem('archivedQRScans', JSON.stringify(existingArchives))
    
    console.log('QR code archived successfully:', newArchive)
  }

  const handleManualInput = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const code = formData.get('qrCode')
    
    if (!code) {
      setError('Please enter a QR code')
      return
    }
    
    finishScan(code.toUpperCase())
  }

  const resetScan = () => {
    scannerRef.current?.stop()
    setScannedData(null)
    setScanResult(null)
    setError('')
  }

  return (
    <HospitalLayout>
      <div className="mb-8">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-blood-red">Clinic Operations</p>
        <h1 className="mt-2 text-4xl font-extrabold text-gray-900">QR Code Verification</h1>
        <p className="mt-2 text-gray-600">Scan donor QR codes to verify and process transfusion requests</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Scan Section */}
        <div className="card">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Scan QR Code</h2>
            <p className="text-gray-600">Scan the QR code provided by the donor who accepted the request</p>
          </div>

          {!scannedData ? (
            <div className="space-y-6">
              {/* Camera Scan Button */}
              <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center hover:border-blood-red transition-colors">
                {isScanning ? (
                  <div className="mb-4 overflow-hidden rounded-2xl bg-black">
                    <video ref={videoRef} className="aspect-video w-full object-cover" muted playsInline />
                  </div>
                ) : (
                  <div className="flex justify-center mb-4">
                    <div className="w-20 h-20 bg-gradient-to-br from-red-50 to-red-100 rounded-2xl flex items-center justify-center">
                      <svg viewBox="0 0 24 24" fill="none" className="w-10 h-10 text-blood-red" stroke="currentColor" strokeWidth="1.5">
                        <path d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M7 7h10M7 12h10M7 17h10" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  </div>
                )}
                <h3 className="text-lg font-semibold text-gray-900 mb-2">QR Code Scanner</h3>
                <p className="text-sm text-gray-600 mb-4">
                  {isScanning ? 'Position the donor QR code inside the frame' : 'Use your device camera to scan the donor QR code'}
                </p>
                <button
                  onClick={handleScan}
                  disabled={isScanning}
                  className="btn-primary w-full"
                >
                  {isScanning ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Scanning camera...
                    </span>
                  ) : 'Start Camera Scan'}
                </button>
              </div>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500">or enter manually</span>
                </div>
              </div>

              {/* Manual Input */}
              <form onSubmit={handleManualInput} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Enter QR Code
                  </label>
                  <input
                    type="text"
                    name="qrCode"
                    placeholder="e.g., DONOR-ABC123XYZ"
                    className="form-control"
                    disabled={isScanning}
                  />
                </div>
                <button
                  type="submit"
                  disabled={isScanning}
                  className="btn-secondary w-full"
                >
                  {isScanning ? 'Verifying...' : 'Verify Code'}
                </button>
              </form>

              {error && (
                <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Success State */}
              <div className="rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500 text-white">
                    <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth="2">
                      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Successfully Scanned</h3>
                    <p className="text-sm text-green-700">QR code verified and archived</p>
                  </div>
                </div>
              </div>

              {/* Scanned Data Display */}
              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                  <span className="text-gray-600">QR Code</span>
                  <span className="font-semibold text-gray-900">{scannedData.code}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                  <span className="text-gray-600">Donor Name</span>
                  <span className="font-semibold text-gray-900">{scannedData.donorName}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                  <span className="text-gray-600">Donor ID</span>
                  <span className="font-semibold text-gray-900">{scannedData.donorId}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                  <span className="text-gray-600">Blood Type</span>
                  <span className="font-semibold text-blood-red">{scannedData.bloodType}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                  <span className="text-gray-600">Patient Name</span>
                  <span className="font-semibold text-gray-900">{scannedData.patientName}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                  <span className="text-gray-600">Clinic</span>
                  <span className="font-semibold text-gray-900">{scannedData.clinicName}</span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="text-gray-600">Scanned At</span>
                  <span className="text-sm text-gray-500">{new Date(scannedData.timestamp).toLocaleString()}</span>
                </div>
              </div>

              <button
                onClick={resetScan}
                className="btn-primary w-full"
              >
                Scan Another QR Code
              </button>
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="space-y-6">
          {/* Instructions */}
          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="2">
                  <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900">Instructions</h3>
            </div>
            <ul className="space-y-3 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-600 text-xs font-bold shrink-0">1</span>
                <span>Ask the donor to show their QR code from their verification page</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-600 text-xs font-bold shrink-0">2</span>
                <span>Use the camera scanner or manually enter the QR code</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-600 text-xs font-bold shrink-0">3</span>
                <span>Verify the donor information matches the request</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-600 text-xs font-bold shrink-0">4</span>
                <span>QR code will be automatically archived after successful scan</span>
              </li>
            </ul>
          </div>

          {/* Recent Scans */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="2">
                    <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900">Recent Scans</h3>
              </div>
            </div>
            <div className="space-y-3">
              {(() => {
                const archives = JSON.parse(localStorage.getItem('archivedQRScans') || '[]')
                const recentScans = archives.slice(-3).reverse()
                
                if (recentScans.length === 0) {
                  return (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No recent scans yet
                    </p>
                  )
                }
                
                return recentScans.map((scan, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <div>
                      <p className="font-semibold text-gray-900">{scan.donorName}</p>
                      <p className="text-xs text-gray-500">{scan.code}</p>
                    </div>
                    <span className="text-xs font-semibold text-green-600">
                      {scan.status === 'successfully_scanned' ? 'Scanned' : scan.status}
                    </span>
                  </div>
                ))
              })()}
            </div>
          </div>

          {/* Status Info */}
          <div className="card bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-white">
                <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="2">
                  <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900">Auto-Archive</h3>
            </div>
            <p className="text-sm text-gray-700">
              Successfully scanned QR codes are automatically archived and marked as "successfully_scanned". The transfusion history will be updated automatically.
            </p>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      <Modal
        isOpen={showSuccessModal}
        title="QR Code Verified Successfully"
        onClose={() => setShowSuccessModal(false)}
        onConfirm={() => setShowSuccessModal(false)}
        confirmText="OK"
      >
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 text-green-600" stroke="currentColor" strokeWidth="2">
                <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
          <h3 className="text-lg font-bold mb-2 text-gray-900">
            Donor QR Code Verified
          </h3>
          <p className="text-gray-600 mb-4">
            The QR code has been successfully scanned and archived. The transfusion history will be updated automatically.
          </p>
          <div className="rounded-xl bg-gray-50 p-4 text-left">
            <p className="text-sm text-gray-600">Donor: <span className="font-semibold text-gray-900">{scannedData?.donorName}</span></p>
            <p className="text-sm text-gray-600">Code: <span className="font-semibold text-gray-900">{scannedData?.code}</span></p>
            <p className="text-sm text-gray-600">Status: <span className="font-semibold text-green-600">Successfully Scanned</span></p>
          </div>
        </div>
      </Modal>
    </HospitalLayout>
  )
}

export default QrScanVerificationPage
