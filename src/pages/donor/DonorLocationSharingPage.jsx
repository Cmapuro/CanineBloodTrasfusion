import React, { useEffect, useState } from 'react'
import DonorLayout from '../../components/layout/DonorLayout'
import { getDonorLocationSharing, updateDonorLocation, updateDonorLocationSharing } from '../../services/nearbyLocationService'

export function DonorLocationSharingPage() {
  const [dogs, setDogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [savingDog, setSavingDog] = useState(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    getDonorLocationSharing()
      .then((data) => setDogs(data.dogs || []))
      .catch((requestError) => setError(requestError.response?.data?.message || 'Unable to load your dogs.'))
      .finally(() => setLoading(false))
  }, [])

  const toggleConsent = async (dog) => {
    const consent = !Boolean(dog.location_sharing_consent)
    setSavingDog(dog.dog_id)
    setError('')
    setMessage('')
    try {
      await updateDonorLocationSharing(dog.dog_id, consent)
      setDogs((current) => current.map((item) => item.dog_id === dog.dog_id
        ? { ...item, location_sharing_consent: consent, location_updated_at: consent ? item.location_updated_at : null }
        : item))
      setMessage(`${dog.name}'s approximate location sharing is ${consent ? 'enabled' : 'disabled'}.`)
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to save your location-sharing preference.')
    } finally {
      setSavingDog(null)
    }
  }

  const updateApproximateLocation = (dog) => {
    if (!navigator.geolocation) {
      setError('This browser does not support location services.')
      return
    }

    setSavingDog(dog.dog_id)
    setError('')
    setMessage('')
    navigator.geolocation.getCurrentPosition(async ({ coords }) => {
      try {
        const result = await updateDonorLocation(dog.dog_id, {
          latitude: coords.latitude,
          longitude: coords.longitude,
        })
        setDogs((current) => current.map((item) => item.dog_id === dog.dog_id
          ? { ...item, location_updated_at: result.location_updated_at }
          : item))
        setMessage(`A new encrypted location was saved for ${dog.name}. Clinics receive an approximate distance, not your coordinates.`)
      } catch (requestError) {
        setError(requestError.response?.data?.message || 'Unable to update your location.')
      } finally {
        setSavingDog(null)
      }
    }, (geoError) => {
      setError(geoError.code === 1
        ? 'Location permission was denied. No location was saved.'
        : 'Your current location is unavailable. No location was saved.')
      setSavingDog(null)
    }, { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 })
  }

  return (
    <DonorLayout>
      <header className="mb-8">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-blood-red">Privacy controls</p>
        <h1 className="mt-2 text-3xl font-extrabold text-gray-900 sm:text-4xl">Donor location sharing</h1>
        <p className="mt-2 max-w-3xl text-gray-600">
          This optional setting may be used to estimate distance for donor matching. It does not reveal your coordinates. A clinic can see your current location only after you accept an emergency request and grant temporary, request-specific permission.
        </p>
      </header>

      <section className="card max-w-3xl">
        <div className="mb-5 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm leading-relaxed text-blue-900">
          This preference is separate from emergency location sharing. Your precise location stays private unless you explicitly share it for an active request. You can turn this preference off at any time.
        </div>
        {error && <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">{error}</p>}
        {message && <p className="mb-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800" role="status">{message}</p>}
        {loading ? <p className="py-8 text-center text-gray-500">Loading your dogs…</p> : dogs.length === 0 ? (
          <p className="py-8 text-center text-gray-600">There are no registered dogs on your account yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {dogs.map((dog) => (
              <li key={dog.dog_id} className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-bold text-gray-900">{dog.name}</h2>
                  <p className="mt-1 text-sm text-gray-600">
                    Verification: {dog.eligibility_status.replaceAll('_', ' ')} · Availability: {dog.availability_status.replaceAll('_', ' ')}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={savingDog === dog.dog_id}
                  aria-pressed={Boolean(dog.location_sharing_consent)}
                  onClick={() => toggleConsent(dog)}
                  className={dog.location_sharing_consent ? 'btn-primary w-full sm:w-auto' : 'btn-secondary w-full sm:w-auto'}
                >
                  {savingDog === dog.dog_id ? 'Saving…' : dog.location_sharing_consent ? 'Distance estimate on · Turn off' : 'Allow distance estimate'}
                </button>
                {dog.location_sharing_consent && (
                  <div className="sm:text-right">
                    <button
                      type="button"
                      disabled={savingDog === dog.dog_id}
                      onClick={() => updateApproximateLocation(dog)}
                      className="text-sm font-semibold text-blood-red hover:underline disabled:opacity-50"
                    >
                      Update my location
                    </button>
                    <p className="mt-1 text-xs text-gray-500">
                      Last update: {dog.location_updated_at ? new Date(dog.location_updated_at).toLocaleString() : 'not available'}
                    </p>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </DonorLayout>
  )
}

export default DonorLocationSharingPage
