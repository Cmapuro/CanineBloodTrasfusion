import React from 'react'
import StatusBadge from './StatusBadge'

export function DonorCard({ donor }) {
  return (
    <article className="card flex flex-col gap-4 h-full">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center text-3xl" role="img" aria-label="Dog">
            🐶
          </div>
          <div>
            <h3 className="font-bold text-gray-900">{donor.name}</h3>
            <p className="text-sm text-gray-500">{donor.breed}</p>
          </div>
        </div>
        <StatusBadge status={donor.availability} />
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div><p className="text-gray-500">DEA compatibility</p><p className="font-semibold text-gray-900">{donor.bloodType}</p></div>
        <div><p className="text-gray-500">Distance</p><p className="font-semibold text-gray-900">{donor.distance}</p></div>
        <div><p className="text-gray-500">Weight</p><p className="font-semibold text-gray-900">{donor.weight}</p></div>
        <div><p className="text-gray-500">Match score</p><p className="font-semibold text-blood-red">{donor.score}%</p></div>
      </div>
      <button className="btn-secondary w-full mt-auto">View donor profile</button>
    </article>
  )
}

export default DonorCard
