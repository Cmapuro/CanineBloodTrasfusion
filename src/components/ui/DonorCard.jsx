import React from 'react'
import { Link } from 'react-router-dom'
import StatusBadge from './StatusBadge'

export function DonorCard({ donor }) {
  const availability = donor.availability_status?.replaceAll('_', ' ')
  const availabilityLabel = availability
    ? availability.replace(/\b\w/g, (letter) => letter.toUpperCase())
    : 'Unavailable'

  return (
    <article className="card flex h-full flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center text-3xl" role="img" aria-label="Dog">
            🐶
          </div>
          <div>
            <h3 className="font-bold text-gray-900">{donor.name}</h3>
            <p className="text-sm text-gray-500">{donor.breed || 'Breed not recorded'}</p>
          </div>
        </div>
        <StatusBadge status={availabilityLabel} />
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div><p className="text-gray-500">Canine blood type</p><p className="font-semibold text-gray-900">{donor.blood_type || 'Not recorded'}</p></div>
        <div><p className="text-gray-500">Weight</p><p className="font-semibold text-gray-900">{donor.weight_kg ? `${donor.weight_kg} kg` : 'Not recorded'}</p></div>
        <div><p className="text-gray-500">Eligibility</p><p className="font-semibold capitalize text-gray-900">{donor.eligibility_status?.replaceAll('_', ' ') || 'Not recorded'}</p></div>
        <div><p className="text-gray-500">Owner</p><p className="font-semibold text-gray-900">{donor.owner_name || 'Not recorded'}</p></div>
      </div>
      <Link to="/hospital/donor-list?filter=verified" className="btn-secondary mt-auto w-full text-center">View verified donors</Link>
    </article>
  )
}

export default DonorCard
