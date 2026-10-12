import React, { useEffect, useMemo, useState } from 'react'
import L from 'leaflet'
import { MapContainer, Marker, Popup, TileLayer, CircleMarker, useMap } from 'react-leaflet'
import { Link } from 'react-router-dom'
import 'leaflet/dist/leaflet.css'
import HospitalLayout from '../../components/layout/HospitalLayout'
import { getNearbyLocations } from '../../services/nearbyLocationService'

const TAGUM_CENTER = { latitude: 7.4475, longitude: 125.8078 }

const clinicIcon = L.divIcon({
  className: 'nearby-map-icon nearby-map-icon-clinic',
  html: '<span aria-hidden="true">+</span>',
  iconSize: [34, 34],
  iconAnchor: [17, 17],
  popupAnchor: [0, -17],
})

const donorIcon = L.divIcon({
  className: 'nearby-map-icon nearby-map-icon-donor',
  html: '<span aria-hidden="true">♥</span>',
  iconSize: [34, 34],
  iconAnchor: [17, 17],
  popupAnchor: [0, -17],
})

function FollowMapCenter({ center, selected }) {
  const map = useMap()

  useEffect(() => {
    map.setView([center.latitude, center.longitude], selected ? 13 : 12)
  }, [center, map, selected])

  return null
}

function DirectionsLink({ location, center }) {
  const route = `${center.latitude},${center.longitude};${location.latitude},${location.longitude}`
  const url = `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${encodeURIComponent(route)}`

  return (
    <a href={url} target="_blank" rel="noreferrer" className="text-sm font-semibold text-blood-red hover:underline">
      Directions
    </a>
  )
}

export function NearbyLocationsPage() {
  const [center, setCenter] = useState(TAGUM_CENTER)
  const [hasDeviceLocation, setHasDeviceLocation] = useState(false)
  const [radius, setRadius] = useState('10')
  const [type, setType] = useState('all')
  const [availability, setAvailability] = useState('available')
  const [bloodType, setBloodType] = useState('')
  const [eligibility, setEligibility] = useState('verified')
  const [locations, setLocations] = useState([])
  const [bloodTypes, setBloodTypes] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [locationMessage, setLocationMessage] = useState('')

  const filters = useMemo(() => ({
    latitude: center.latitude,
    longitude: center.longitude,
    radius,
    type,
    availability,
    blood_type: bloodType || undefined,
    eligibility,
  }), [center, radius, type, availability, bloodType, eligibility])

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError('')

    getNearbyLocations(filters, controller.signal)
      .then((data) => {
        setLocations(data.locations || [])
        setBloodTypes(data.blood_types || [])
      })
      .catch((requestError) => {
        if (requestError.code === 'ERR_CANCELED') return
        setError(requestError.response?.data?.message || 'Unable to load nearby locations. Check your connection and try again.')
        setLocations([])
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
  }, [filters])

  const locateMe = () => {
    setLocationMessage('')
    if (!navigator.geolocation) {
      setLocationMessage('This browser does not support location services.')
      return
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setCenter({ latitude: coords.latitude, longitude: coords.longitude })
        setHasDeviceLocation(true)
        setLocationMessage('Showing locations near your current position.')
      },
      (geoError) => {
        const messages = {
          1: 'Location permission was denied. Allow location access in your browser settings to search near you.',
          2: 'Your current location is unavailable. Check your device location settings and try again.',
          3: 'The location request timed out. Please try again.',
        }
        setLocationMessage(messages[geoError.code] || 'Unable to get your current location.')
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
    )
  }

  const donorCount = locations.filter((location) => location.type === 'donor').length
  const clinicCount = locations.filter((location) => location.type === 'clinic').length

  return (
    <HospitalLayout>
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-blood-red">Clinic coordination</p>
          <h1 className="mt-2 text-3xl font-extrabold text-gray-900 sm:text-4xl">Nearby locations</h1>
          <p className="mt-2 max-w-3xl text-gray-600">
            Find participating veterinary clinics and consented, verified donors around Tagum City.
            Donor pins represent an approximate registered-clinic area, never a home address.
          </p>
        </div>
        <Link to="/hospital/profile" className="btn-secondary shrink-0 text-center">
          Edit my clinic address
        </Link>
      </header>

      <section className="card mb-5" aria-label="Map filters">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <label className="text-sm font-semibold text-gray-700">
            Search radius
            <select value={radius} onChange={(event) => setRadius(event.target.value)} className="form-control mt-2">
              <option value="5">5 km</option>
              <option value="10">10 km</option>
              <option value="20">20 km</option>
            </select>
          </label>
          <label className="text-sm font-semibold text-gray-700">
            Locations
            <select value={type} onChange={(event) => setType(event.target.value)} className="form-control mt-2">
              <option value="all">Clinics and donors</option>
              <option value="clinic">Clinics only</option>
              <option value="donor">Donors only</option>
            </select>
          </label>
          <label className="text-sm font-semibold text-gray-700">
            Donor availability
            <select value={availability} onChange={(event) => setAvailability(event.target.value)} className="form-control mt-2">
              <option value="available">Available now</option>
              <option value="all">All verified donors</option>
            </select>
          </label>
          <label className="text-sm font-semibold text-gray-700">
            Blood type
            <select value={bloodType} onChange={(event) => setBloodType(event.target.value)} className="form-control mt-2">
              <option value="">All blood types</option>
              {bloodTypes.map((code) => <option key={code} value={code}>{code}</option>)}
            </select>
          </label>
          <label className="text-sm font-semibold text-gray-700">
            Donor eligibility
            <select value={eligibility} onChange={(event) => setEligibility(event.target.value)} className="form-control mt-2">
              <option value="verified">Verified and eligible</option>
              <option value="hidden">Hide donor locations</option>
            </select>
          </label>
        </div>
        <div className="mt-4 flex flex-col gap-3 border-t border-red-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-gray-600" aria-live="polite">
            {clinicCount} clinic{clinicCount === 1 ? '' : 's'} · {donorCount} approximate donor area{donorCount === 1 ? '' : 's'} within {radius} km
          </p>
          <button type="button" onClick={locateMe} className="btn-secondary w-full sm:w-auto">
            Use my current location
          </button>
        </div>
        {locationMessage && <p className="mt-3 rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-800" role="status">{locationMessage}</p>}
      </section>

      <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(18rem,0.8fr)]">
        <section className="card min-w-0 overflow-hidden p-0" aria-label="Nearby locations map">
          <div className="relative h-[28rem] sm:h-[36rem]">
            <MapContainer center={[TAGUM_CENTER.latitude, TAGUM_CENTER.longitude]} zoom={12} scrollWheelZoom className="h-full w-full">
              <FollowMapCenter center={center} selected={hasDeviceLocation} />
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {hasDeviceLocation && (
                <CircleMarker
                  center={[center.latitude, center.longitude]}
                  radius={8}
                  pathOptions={{ color: '#1d4ed8', fillColor: '#3b82f6', fillOpacity: 0.9, weight: 3 }}
                >
                  <Popup>Your current location</Popup>
                </CircleMarker>
              )}
              {locations.map((location) => (
                <Marker
                  key={location.id}
                  position={[location.latitude, location.longitude]}
                  icon={location.type === 'clinic' ? clinicIcon : donorIcon}
                  eventHandlers={{ click: () => setSelectedId(location.id) }}
                >
                  <Popup>
                    <strong>{location.name}</strong>
                    {location.address && <><br />{location.address}</>}
                    {location.type === 'clinic' && location.contact_phone && <><br />{location.contact_phone}</>}
                    {location.type === 'donor' && <><br />Blood type: {location.blood_type}<br />{location.donor_count} consented donor{location.donor_count === 1 ? '' : 's'}<br />{location.availability_status === 'available' ? 'Available now' : 'Not currently available'}<br />Approximate clinic area only.</>}
                    <br />{location.distance_km} km away
                    <br /><DirectionsLink location={location} center={center} />
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
            {loading && (
              <div className="absolute inset-0 z-[500] flex items-center justify-center bg-white/70" role="status">
                <span className="rounded-xl bg-white px-4 py-3 text-sm font-semibold text-gray-700 shadow">Loading nearby locations…</span>
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-2 border-t border-red-100 px-5 py-3 text-xs text-gray-600">
            <span><i className="mr-2 inline-block h-3 w-3 rounded-full bg-rose-600 align-middle" />Veterinary clinic</span>
            <span><i className="mr-2 inline-block h-3 w-3 rounded-full bg-emerald-600 align-middle" />Approximate donor area</span>
            {hasDeviceLocation && <span><i className="mr-2 inline-block h-3 w-3 rounded-full bg-blue-600 align-middle" />Your location</span>}
          </div>
        </section>

        <aside className="card max-h-[44rem] overflow-y-auto p-4 sm:p-5" aria-label="Nearby locations list">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-gray-900">Results</h2>
            <span className="badge badge-blood">{locations.length}</span>
          </div>
          {error && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">
              <p>{error}</p>
              <button type="button" onClick={() => setCenter((current) => ({ ...current }))} className="mt-2 font-bold underline">Try again</button>
            </div>
          )}
          {loading && <p className="py-8 text-center text-sm text-gray-500">Searching within {radius} km…</p>}
          {!loading && !error && locations.length === 0 && (
            <div className="rounded-2xl bg-slate-50 px-5 py-10 text-center">
              <p className="font-semibold text-gray-800">No nearby results</p>
              <p className="mt-2 text-sm text-gray-500">Try a larger radius, adjust filters, or use your current location.</p>
            </div>
          )}
          <ul className="space-y-3">
            {locations.map((location) => (
              <li key={location.id}>
                <article className={`rounded-2xl border p-4 transition ${selectedId === location.id ? 'border-blood-red bg-red-50' : 'border-slate-200 bg-white'}`}>
                  <button type="button" className="w-full text-left" onClick={() => setSelectedId(location.id)}>
                    <span className={`badge ${location.type === 'clinic' ? 'badge-blood' : 'badge-success'}`}>
                      {location.type === 'clinic' ? 'Clinic' : 'Donor area'}
                    </span>
                    <h3 className="mt-2 font-bold text-gray-900">{location.name}</h3>
                    {location.address && <p className="mt-1 text-sm text-gray-600">{location.address}</p>}
                    {location.type === 'donor' && (
                      <p className="mt-1 text-sm text-gray-600">
                        {location.blood_type} · {location.donor_count} donor{location.donor_count === 1 ? '' : 's'} · {location.availability_status === 'available' ? 'Available' : 'Not available now'}
                      </p>
                    )}
                    <p className="mt-2 text-sm text-gray-500">{location.distance_km} km away</p>
                  </button>
                  <div className="mt-3 flex items-center justify-between">
                    {location.contact_phone && <a href={`tel:${location.contact_phone}`} className="text-sm font-semibold text-gray-700">{location.contact_phone}</a>}
                    <DirectionsLink location={location} center={center} />
                  </div>
                </article>
              </li>
            ))}
          </ul>
          <p className="mt-5 border-t border-slate-100 pt-4 text-xs leading-relaxed text-gray-500">
            Donor pins are deliberately approximate and require owner consent. This map supports coordination only; veterinary professionals determine medical suitability.
          </p>
        </aside>
      </div>
    </HospitalLayout>
  )
}

export default NearbyLocationsPage
