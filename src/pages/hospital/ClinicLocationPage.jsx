import React, { useEffect, useState } from 'react'
import HospitalLayout from '../../components/layout/HospitalLayout'
import { getClinicProfile, saveClinicLocation } from '../../services/clinicService'
import OpenStreetMap from '../../components/common/OpenStreetMap'

export function ClinicLocationPage() {
  const [clinic, setClinic] = useState(null)
  const [form, setForm] = useState({
    email: '',
    address: '',
    contact_phone: '',
    latitude: '',
    longitude: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    getClinicProfile()
      .then((data) => {
        const clinicData = data || {}
        setClinic(clinicData)
        setForm({
          email: clinicData.email || '',
          address: clinicData.address || '',
          contact_phone: clinicData.contact_phone || '',
          latitude: clinicData.latitude || '7.4475',
          longitude: clinicData.longitude || '125.8078',
        })
      })
      .catch(() => setError('Unable to load clinic location.'))
      .finally(() => setLoading(false))
  }, [])

  const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }))

  const submit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setMessage('')
    setError('')

    try {
      const result = await saveClinicLocation({
        ...form,
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
      })
      setClinic(result.clinic || result)
      setMessage(result.message || 'Clinic profile saved successfully.')
    } catch (saveError) {
      setError(saveError.response?.data?.message || 'Unable to save clinic location.')
    } finally {
      setSaving(false)
    }
  }

  const latitude = Number(form.latitude)
  const longitude = Number(form.longitude)
  const hasPin = Number.isFinite(latitude) && Number.isFinite(longitude) && form.latitude !== '' && form.longitude !== ''

  return (
    <HospitalLayout>
      <div className="mb-8">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-blood-red">Clinic settings</p>
        <h1 className="mt-2 text-4xl font-extrabold text-gray-900">Clinic Profile</h1>
        <p className="mt-2 max-w-2xl text-gray-600">
          Manage your clinic details and save the permanent location donors will use for emergency requests.
        </p>
      </div>

      {loading ? (
        <div className="card py-16 text-center text-gray-500">Loading clinic profile...</div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="card bg-gradient-to-br from-red-50 to-pink-50 border border-red-100">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-blood-red">Clinic</p>
              <h2 className="mt-3 text-xl font-extrabold text-gray-900">{clinic?.name || 'CanineLink Clinic'}</h2>
              <p className="mt-2 text-sm text-gray-600">Accredited veterinary partner</p>
            </div>
            <div className="card">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-gray-500">Status</p>
              <div className="mt-3 flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                <span className="text-base font-bold text-gray-900">Active</span>
              </div>
              <p className="mt-2 text-sm text-gray-600">Verified emergency network access</p>
            </div>
            <div className="card">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-gray-500">Clinic ID</p>
              <p className="mt-3 text-2xl font-black tracking-wide text-blood-red">
                CL-{String(clinic?.clinic_id || '001').padStart(3, '0')}
              </p>
              <p className="mt-2 text-sm text-gray-600">Permanent registry reference</p>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <form onSubmit={submit} className="card space-y-5">
              <div className="flex items-center justify-between border-b border-red-100 pb-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-blood-red">Profile details</p>
                  <h2 className="mt-1 text-2xl font-extrabold text-gray-900">Clinic information</h2>
                </div>
                <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-blood-red">Verified</span>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">Clinic email</label>
                <input
                  required
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={update}
                  className="form-control"
                  placeholder="clinic@caninelink.test"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">Permanent address</label>
                <textarea
                  name="address"
                  value={form.address}
                  onChange={update}
                  rows={3}
                  className="form-control"
                  placeholder="Official clinic address"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">Contact phone</label>
                <input
                  name="contact_phone"
                  value={form.contact_phone}
                  onChange={update}
                  className="form-control"
                  placeholder="Clinic emergency phone"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">Latitude</label>
                  <input
                    required
                    type="number"
                    step="any"
                    min="-90"
                    max="90"
                    name="latitude"
                    value={form.latitude}
                    onChange={update}
                    className="form-control"
                    placeholder="7.4475"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">Longitude</label>
                  <input
                    required
                    type="number"
                    step="any"
                    min="-180"
                    max="180"
                    name="longitude"
                    value={form.longitude}
                    onChange={update}
                    className="form-control"
                    placeholder="125.8078"
                  />
                </div>
              </div>

              {message && (
                <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                  {message}
                </p>
              )}
              {error && (
                <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
              )}

              <button type="submit" disabled={saving} className="btn-primary w-full">
                {saving ? 'Saving profile...' : 'Save clinic profile'}
              </button>
            </form>

            <section className="card p-0 overflow-hidden">
              <div className="flex items-center justify-between border-b border-red-100 bg-gradient-to-r from-red-50 to-white px-5 py-4">
                <div>
                  <h2 className="font-bold text-gray-900">Map location</h2>
                  <p className="text-sm text-gray-500">This pin is visible to approved donors.</p>
                </div>
                <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                  Live pin
                </span>
              </div>

              {hasPin ? (
                <OpenStreetMap
                  latitude={latitude}
                  longitude={longitude}
                  title={clinic?.name}
                  address={form.address}
                  draggable
                  onPositionChange={({ latitude: nextLatitude, longitude: nextLongitude }) =>
                    setForm((current) => ({
                      ...current,
                      latitude: nextLatitude.toFixed(6),
                      longitude: nextLongitude.toFixed(6),
                    }))
                  }
                  className="h-[30rem]"
                />
              ) : (
                <div className="flex h-[30rem] items-center justify-center px-8 text-center text-gray-500">
                  Add the clinic coordinates to preview the map pin.
                </div>
              )}
            </section>
          </div>
        </div>
      )}
    </HospitalLayout>
  )
}

export default ClinicLocationPage
