import React, { useEffect, useState } from 'react'
import HospitalLayout from '../../components/layout/HospitalLayout'
import { getClinicProfile, saveClinicLocation } from '../../services/clinicService'
import OpenStreetMap from '../../components/common/OpenStreetMap'

export function ClinicLocationPage() {
  const [clinic, setClinic] = useState(null)
  const [form, setForm] = useState({ email: '', address: '', contact_phone: '', latitude: '', longitude: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    getClinicProfile()
      .then((data) => {
        setClinic(data)
        setForm({
          email: data.email || '',
          address: data.address || '',
          contact_phone: data.contact_phone || '',
          latitude: data.latitude || '',
          longitude: data.longitude || '',
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
      const result = await saveClinicLocation({ ...form, latitude: Number(form.latitude), longitude: Number(form.longitude) })
      setClinic(result.clinic)
      setMessage(result.message)
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
        <p className="mt-2 max-w-2xl text-gray-600">Manage your clinic information and save the permanent location donors will use for emergency requests.</p>
      </div>

      {loading ? <div className="card py-16 text-center text-gray-500">Loading clinic profile...</div> : (
        <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <form onSubmit={submit} className="card space-y-5">
            <div className="rounded-2xl bg-red-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-blood-red">Accredited clinic profile</p>
              <h2 className="mt-1 text-xl font-extrabold text-gray-900">{clinic?.name}</h2>
              <p className="mt-1 text-sm text-gray-600">Clinic ID: CL-{String(clinic?.clinic_id || '').padStart(3, '0')}</p>
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">Clinic email</label>
              <input required type="email" name="email" value={form.email} onChange={update} className="form-control" placeholder="clinic@caninelink.test" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">Permanent address</label>
              <textarea name="address" value={form.address} onChange={update} rows={3} className="form-control" placeholder="Official clinic address" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">Contact phone</label>
              <input name="contact_phone" value={form.contact_phone} onChange={update} className="form-control" placeholder="Clinic emergency phone" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label className="mb-2 block text-sm font-semibold text-gray-700">Latitude</label><input required type="number" step="any" min="-90" max="90" name="latitude" value={form.latitude} onChange={update} className="form-control" placeholder="7.4475" /></div>
              <div><label className="mb-2 block text-sm font-semibold text-gray-700">Longitude</label><input required type="number" step="any" min="-180" max="180" name="longitude" value={form.longitude} onChange={update} className="form-control" placeholder="125.8078" /></div>
            </div>
            {message && <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{message}</p>}
            {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
            <button type="submit" disabled={saving} className="btn-primary w-full">{saving ? 'Saving profile...' : 'Save profile and permanent pin'}</button>
          </form>

          <section className="card p-0 overflow-hidden">
            <div className="flex items-center justify-between border-b border-red-100 bg-white px-5 py-4">
              <div><h2 className="font-bold text-gray-900">Permanent location preview</h2><p className="text-sm text-gray-500">This pin is shown to approved donors.</p></div>
              <span className="badge badge-success">Permanent pin</span>
            </div>
            {hasPin ? <OpenStreetMap latitude={latitude} longitude={longitude} title={clinic?.name} address={form.address} draggable onPositionChange={({ latitude: nextLatitude, longitude: nextLongitude }) => setForm((current) => ({ ...current, latitude: nextLatitude.toFixed(6), longitude: nextLongitude.toFixed(6) }))} className="h-[28rem]" /> : <div className="flex h-[28rem] items-center justify-center px-8 text-center text-gray-500">Enter latitude and longitude to preview the clinic pin.</div>}
          </section>
        </div>
      )}
    </HospitalLayout>
  )
}

export default ClinicLocationPage
