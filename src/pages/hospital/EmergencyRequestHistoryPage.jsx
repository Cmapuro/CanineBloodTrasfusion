import React, { useEffect, useState } from 'react'
import HospitalLayout from '../../components/layout/HospitalLayout'
import { TableComponent } from '../../components/ui/TableComponent'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { getEmergencyRequestHistory } from '../../services/hospitalService'

const formatUrgency = (value) => ({ critical: 'Critical', urgent: 'Urgent', routine: 'Routine' }[value] || value)
const formatStatus = (value) => value?.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())

export function EmergencyRequestHistoryPage() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    getEmergencyRequestHistory()
      .then((data) => setRequests(Array.isArray(data) ? data : []))
      .catch(() => setLoadError('Unable to load emergency request history.'))
      .finally(() => setLoading(false))
  }, [])

  const rows = requests.map((request) => ({
    ...request,
    urgency: formatUrgency(request.urgency_level),
    displayStatus: formatStatus(request.status),
    created: request.created_at ? new Date(request.created_at).toLocaleString() : '—',
    matches: `${request.match_count} donor${request.match_count === 1 ? '' : 's'}`,
  }))

  return (
    <HospitalLayout>
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-blood-red">Clinic coordination</p>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Emergency Request History</h1>
        <p className="text-gray-600">Review submitted cases and the donor search status for your clinic.</p>
      </div>

      {loadError && <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">{loadError}</div>}
      <div className="card">
        {loading ? (
          <div className="py-16 text-center text-gray-500">Loading emergency request history...</div>
        ) : (
          <TableComponent
            columns={[
              { key: 'created', label: 'Submitted', sortable: true },
              { key: 'patient_name', label: 'Patient', sortable: true },
              { key: 'blood_type', label: 'Blood type', sortable: true },
              { key: 'units_needed', label: 'Units' },
              { key: 'urgency', label: 'Urgency', render: (value) => <StatusBadge status={value} /> },
              { key: 'displayStatus', label: 'Status', render: (value) => <StatusBadge status={value} /> },
              { key: 'matches', label: 'AI matches' },
            ]}
            data={rows}
            searchable
            paginated
            itemsPerPage={8}
          />
        )}
      </div>
    </HospitalLayout>
  )
}

export default EmergencyRequestHistoryPage
