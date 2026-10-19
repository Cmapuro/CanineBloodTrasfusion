import React from 'react'
import StatusBadge from './StatusBadge'

export function EmergencyRequestCard({ request, onAccept, onDecline, isProcessing = false, processingDecision = null }) {
  const responseDeadline = request.deadline
    ? new Date(request.deadline).toLocaleString()
    : 'Not specified'

  return (
    <article className="card border-l-4 border-red-500">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-blood-red font-bold">Emergency blood request</p>
          <h3 className="text-xl font-bold text-gray-900 mt-1">{request.patient}</h3>
          <p className="text-sm text-gray-600">{request.clinic}</p>
        </div>
        <StatusBadge status={request.urgency} />
      </div>
      <div className="grid grid-cols-2 gap-4 text-sm mb-5">
        <div><p className="text-gray-500">Required</p><p className="font-semibold">{request.required}</p></div>
        <div><p className="text-gray-500">Your dog</p><p className="font-semibold">{request.donor}</p></div>
        <div><p className="text-gray-500">Compatibility</p><p className="font-semibold">{request.compatibility == null ? 'Not provided' : `${request.compatibility}%`}</p></div>
        <div><p className="text-gray-500">Respond by</p><p className="font-semibold">{responseDeadline}</p></div>
      </div>
      <div className="flex flex-wrap gap-3">
        <button type="button" disabled={isProcessing} onClick={onAccept} className="btn-primary flex-1 min-w-32 disabled:cursor-not-allowed disabled:opacity-60">
          {processingDecision === 'accepted' ? 'Accepting...' : 'Accept and generate QR'}
        </button>
        <button type="button" disabled={isProcessing} onClick={onDecline} className="btn-secondary flex-1 min-w-32 disabled:cursor-not-allowed disabled:opacity-60">
          {processingDecision === 'declined' ? 'Declining...' : 'Decline'}
        </button>
      </div>
    </article>
  )
}

export default EmergencyRequestCard
