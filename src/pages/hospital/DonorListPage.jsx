import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import HospitalLayout from '../../components/layout/HospitalLayout'
import { getClinicDonorDogs, reviewClinicDonorDog } from '../../services/clinicService'
import { CANINE_BLOOD_TYPES } from '../../utils/bloodTypes'

const statusLabels = {
  pending_review: 'Awaiting review',
  verified: 'Verified by veterinarian',
  rejected: 'Rejected',
  suspended: 'Suspended',
}

const statusClasses = {
  pending_review: 'bg-amber-50 text-amber-800 ring-amber-200',
  verified: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  rejected: 'bg-red-50 text-red-700 ring-red-200',
  suspended: 'bg-slate-100 text-slate-700 ring-slate-200',
}

export function DonorListPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [dogs, setDogs] = useState([])
  const [filter, setFilter] = useState(() => {
    const requestedFilter = searchParams.get('filter')
    return ['pending_review', 'verified', 'rejected', 'all'].includes(requestedFilter) ? requestedFilter : 'pending_review'
  })
  const [reviewForms, setReviewForms] = useState({})
  const [savingDog, setSavingDog] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const refreshDogs = () => getClinicDonorDogs().then(setDogs)

  useEffect(() => {
    refreshDogs()
      .catch((requestError) => setError(requestError.response?.data?.message || 'Unable to load your clinic donor profiles.'))
      .finally(() => setLoading(false))
  }, [])

  const updateReviewForm = (dog, field, value) => {
    setReviewForms((current) => ({
      ...current,
      [dog.dog_id]: {
        decision: current[dog.dog_id]?.decision || 'approved',
        blood_type: current[dog.dog_id]?.blood_type || dog.blood_type || '',
        notes: current[dog.dog_id]?.notes || '',
        [field]: value,
      },
    }))
  }

  const submitReview = async (dog) => {
    const values = reviewForms[dog.dog_id] || {
      decision: 'approved',
      blood_type: dog.blood_type || '',
      notes: '',
    }
    setSavingDog(dog.dog_id)
    setError('')
    setMessage('')
    try {
      const result = await reviewClinicDonorDog(dog.dog_id, {
        decision: values.decision,
        blood_type: values.blood_type || null,
        notes: values.notes || null,
      })
      setMessage(result.message)
      await refreshDogs()
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to save the veterinarian review.')
    } finally {
      setSavingDog(null)
    }
  }

  const visibleDogs = dogs.filter((dog) => filter === 'all' || dog.eligibility_status === filter)
  const pendingCount = dogs.filter((dog) => dog.eligibility_status === 'pending_review').length

  return (
    <HospitalLayout>
      <header className="mb-7">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-blood-red">Clinic operations</p>
        <h1 className="mt-2 text-3xl font-extrabold text-gray-900 sm:text-4xl">Donor profile review</h1>
        <p className="mt-2 max-w-3xl text-gray-600">Review dogs assigned to your clinic, confirm canine blood type, and record a veterinarian decision.</p>
      </header>

      {error && <p className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">{error}</p>}
      {message && <p className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800" role="status">{message}</p>}

      <section className="card">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4 border-b border-red-100 pb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Clinic donor dogs</h2>
            <p className="mt-1 text-sm text-gray-500">{pendingCount} profile{pendingCount === 1 ? '' : 's'} awaiting review</p>
          </div>
          <label className="text-sm font-semibold text-gray-700">
            Review status
            <select value={filter} onChange={(event) => {
              const nextFilter = event.target.value
              setFilter(nextFilter)
              setSearchParams(nextFilter === 'pending_review' ? {} : { filter: nextFilter })
            }} className="form-control mt-1 min-w-48">
              <option value="pending_review">Awaiting review</option>
              <option value="verified">Verified</option>
              <option value="rejected">Rejected</option>
              <option value="all">All clinic dogs</option>
            </select>
          </label>
        </div>

        {loading ? <p className="py-12 text-center text-gray-500">Loading clinic donor profiles...</p> : visibleDogs.length === 0 ? (
          <div className="py-12 text-center">
            <h3 className="font-bold text-gray-900">No profiles in this view</h3>
            <p className="mt-1 text-sm text-gray-500">Dog profiles assigned to your clinic will appear here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {visibleDogs.map((dog) => {
              const values = reviewForms[dog.dog_id] || {
                decision: 'approved',
                blood_type: dog.blood_type || '',
                notes: '',
              }
              return (
                <article key={dog.dog_id} className="rounded-xl border border-gray-200 p-4 sm:p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{dog.name}</h3>
                      <p className="mt-1 text-sm text-gray-600">{dog.breed || 'Breed not supplied'} · {dog.sex || 'Sex not supplied'} · {dog.date_of_birth ? `${new Date(`${dog.date_of_birth}T00:00:00`).toLocaleDateString()} date of birth` : 'Age not supplied'}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${statusClasses[dog.eligibility_status] || statusClasses.pending_review}`}>
                      {statusLabels[dog.eligibility_status] || dog.eligibility_status}
                    </span>
                  </div>

                  <dl className="mt-4 grid gap-3 border-t border-gray-100 pt-4 sm:grid-cols-2 xl:grid-cols-4">
                    <div><dt className="text-xs font-semibold uppercase text-gray-500">Owner</dt><dd className="mt-1 text-sm font-semibold text-gray-900">{dog.owner_name}</dd></div>
                    <div><dt className="text-xs font-semibold uppercase text-gray-500">Owner contact</dt><dd className="mt-1 break-all text-sm text-gray-700">{dog.owner_email}{dog.owner_phone ? ` · ${dog.owner_phone}` : ''}</dd></div>
                    <div><dt className="text-xs font-semibold uppercase text-gray-500">Submitted canine type</dt><dd className="mt-1 text-sm font-semibold text-gray-900">{dog.blood_type || 'Not tested'}</dd></div>
                    <div><dt className="text-xs font-semibold uppercase text-gray-500">Availability</dt><dd className="mt-1 text-sm capitalize text-gray-700">{dog.availability_status?.replaceAll('_', ' ')}</dd></div>
                  </dl>

                  {dog.review_notes && <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">Previous review note: {dog.review_notes}</p>}

                  <div className="mt-5 grid gap-3 border-t border-gray-100 pt-4 md:grid-cols-[minmax(12rem,0.8fr)_minmax(12rem,0.8fr)_minmax(14rem,1.4fr)_auto] md:items-end">
                    <label className="text-sm font-semibold text-gray-700">Veterinarian decision
                      <select value={values.decision} onChange={(event) => updateReviewForm(dog, 'decision', event.target.value)} className="form-control mt-1">
                        <option value="approved">Approve / verify</option>
                        <option value="needs_more_info">Request more information</option>
                        <option value="rejected">Reject</option>
                      </select>
                    </label>
                    <label className="text-sm font-semibold text-gray-700">Confirmed canine blood type
                      <select value={values.blood_type} onChange={(event) => updateReviewForm(dog, 'blood_type', event.target.value)} className="form-control mt-1">
                        <option value="">Not confirmed</option>
                        {CANINE_BLOOD_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
                      </select>
                    </label>
                    <label className="text-sm font-semibold text-gray-700">Review notes
                      <input value={values.notes} onChange={(event) => updateReviewForm(dog, 'notes', event.target.value)} maxLength="2000" className="form-control mt-1" placeholder="Findings or follow-up needed" />
                    </label>
                    <button type="button" disabled={savingDog === dog.dog_id} onClick={() => submitReview(dog)} className="btn-primary md:min-w-32">
                      {savingDog === dog.dog_id ? 'Saving...' : 'Save review'}
                    </button>
                  </div>
                  {values.decision === 'approved' && !values.blood_type && <p className="mt-2 text-xs text-amber-800">A canine blood type must be confirmed before approval.</p>}
                </article>
              )
            })}
          </div>
        )}
      </section>
    </HospitalLayout>
  )
}

export default DonorListPage