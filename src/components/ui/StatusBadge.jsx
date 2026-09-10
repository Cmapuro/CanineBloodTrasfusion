import React from 'react'

export function StatusBadge({ status }) {
  const tone = {
    Available: 'badge-success',
    Verified: 'badge-success',
    Completed: 'badge-success',
    'In Transit': 'bg-blue-100 text-blue-800',
    Pending: 'badge-warning',
    'Pending Verification': 'badge-warning',
    Critical: 'badge-danger',
    Cancelled: 'badge-danger',
  }[status] || 'bg-gray-100 text-gray-700'

  return <span className={`badge ${tone}`}>{status}</span>
}

export default StatusBadge
