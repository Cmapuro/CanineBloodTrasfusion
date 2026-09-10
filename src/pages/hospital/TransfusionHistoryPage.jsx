import React, { useState, useEffect } from 'react'
import HospitalLayout from '../../components/layout/HospitalLayout'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { TableComponent } from '../../components/ui/TableComponent'

export function TransfusionHistoryPage() {
  const [transfusionHistory, setTransfusionHistory] = useState([])
  const [filteredHistory, setFilteredHistory] = useState([])
  const [filterStatus, setFilterStatus] = useState('all')
  const [loading, setLoading] = useState(true)

  // Load transfusion history from localStorage (simulated database)
  useEffect(() => {
    loadTransfusionHistory()
    
    // Listen for custom event when QR is scanned
    const handleQRScan = () => {
      loadTransfusionHistory()
    }
    
    window.addEventListener('qr-scanned', handleQRScan)
    
    return () => {
      window.removeEventListener('qr-scanned', handleQRScan)
    }
  }, [])

  // Load and process transfusion history
  const loadTransfusionHistory = () => {
    setLoading(true)
    
    // Get archived QR scans
    const archivedScans = JSON.parse(localStorage.getItem('archivedQRScans') || '[]')
    
    // Get any existing transfusion history
    const existingHistory = JSON.parse(localStorage.getItem('transfusionHistory') || '[]')
    
    // Combine and process data
    const combinedHistory = [
      ...existingHistory,
      ...archivedScans.map(scan => ({
        id: scan.code,
        date: new Date(scan.timestamp).toISOString().split('T')[0],
        time: new Date(scan.timestamp).toLocaleTimeString(),
        donorName: scan.donorName,
        donorId: scan.donorId,
        bloodType: scan.bloodType,
        patientName: scan.patientName,
        clinicName: scan.clinicName,
        volume: '450 ml', // Default volume, would come from actual data
        status: scan.status === 'successfully_scanned' ? 'Completed' : 'Pending',
        qrCode: scan.code,
        scannedAt: scan.timestamp
      }))
    ]
    
    // Remove duplicates based on QR code
    const uniqueHistory = combinedHistory.filter((item, index, self) =>
      index === self.findIndex((t) => t.qrCode === item.qrCode)
    )
    
    // Sort by date (newest first)
    uniqueHistory.sort((a, b) => new Date(b.scannedAt || b.date) - new Date(a.scannedAt || a.date))
    
    setTransfusionHistory(uniqueHistory)
    setFilteredHistory(uniqueHistory)
    setLoading(false)
  }

  // Filter by status
  useEffect(() => {
    if (filterStatus === 'all') {
      setFilteredHistory(transfusionHistory)
    } else {
      setFilteredHistory(transfusionHistory.filter(item => 
        item.status.toLowerCase() === filterStatus.toLowerCase()
      ))
    }
  }, [filterStatus, transfusionHistory])

  const columns = [
    { key: 'date', label: 'Date', sortable: true, render: (val) => val || 'N/A' },
    { key: 'time', label: 'Time', sortable: true },
    { key: 'donorName', label: 'Donor Name', sortable: true },
    { key: 'donorId', label: 'Donor ID', sortable: true },
    { key: 'bloodType', label: 'Blood Type', sortable: true },
    { key: 'patientName', label: 'Patient Name', sortable: true },
    { key: 'volume', label: 'Volume' },
    { key: 'status', label: 'Status', render: (value) => <StatusBadge status={value} /> },
  ]

  // Calculate statistics
  const stats = {
    total: transfusionHistory.length,
    completed: transfusionHistory.filter(t => t.status === 'Completed').length,
    pending: transfusionHistory.filter(t => t.status === 'Pending').length,
    thisMonth: transfusionHistory.filter(t => {
      const date = new Date(t.scannedAt || t.date)
      const now = new Date()
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
    }).length
  }

  return (
    <HospitalLayout>
      <div className="mb-8">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-blood-red">Clinic Records</p>
        <h1 className="mt-2 text-4xl font-extrabold text-gray-900">Transfusion History</h1>
        <p className="mt-2 text-gray-600">Complete record of blood transfusions performed at your clinic</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth="2">
                <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Transfusions</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 text-green-600">
              <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth="2">
                <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth="2">
                <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth="2">
                <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-600">This Month</p>
              <p className="text-2xl font-bold text-gray-900">{stats.thisMonth}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Section */}
      <div className="card mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Transfusion Records</h2>
            <p className="text-sm text-gray-500">View and filter all transfusion history</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Filter by status:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="form-control py-2 px-3"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transfusion History Table */}
      {loading ? (
        <div className="card py-16 text-center text-gray-500">
          <div className="flex justify-center mb-4">
            <svg className="animate-spin h-8 w-8" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
          Loading transfusion history...
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="card py-16 text-center">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 text-gray-400" stroke="currentColor" strokeWidth="2">
                <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">No transfusion records found</h2>
          <p className="text-gray-500">
            {filterStatus !== 'all' 
              ? `No ${filterStatus} transfusions recorded yet.` 
              : 'Start scanning donor QR codes to build your transfusion history.'}
          </p>
        </div>
      ) : (
        <div className="card">
          <TableComponent
            columns={columns}
            data={filteredHistory}
            searchable
            paginated
          />
        </div>
      )}

      {/* Info Section */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="card bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500 text-white">
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="2">
                <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900">Automatic Updates</h3>
          </div>
          <p className="text-sm text-gray-700">
            This page automatically updates when you scan donor QR codes. Each successful scan creates a new transfusion record with "Completed" status.
          </p>
        </div>

        <div className="card bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500 text-white">
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="2">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900">Record Accuracy</h3>
          </div>
          <p className="text-sm text-gray-700">
            All records are timestamped and include donor information, blood type, patient details, and transfusion volume for complete traceability.
          </p>
        </div>
      </div>
    </HospitalLayout>
  )
}

export default TransfusionHistoryPage
