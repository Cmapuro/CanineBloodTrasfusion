import React, { useEffect, useState } from 'react'
import DonorLayout from '../../components/layout/DonorLayout'
import { createDonorDog, getDonorClinics, getDonorDogs, getDonorProfile, saveDonorProfile, updateDonorDog } from '../../services/authService'
import { CANINE_BLOOD_TYPES } from '../../utils/bloodTypes'
import { useAuth } from '../../hooks/useAuth'

const emptyDog = {
  name: '',
  breed: '',
  age_years: '',
  sex: '',
  blood_type: '',
  weight_kg: '',
  clinic_id: '',
}

const verificationStyle = {
  verified: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  pending_review: 'bg-amber-50 text-amber-800 ring-amber-200',
  rejected: 'bg-red-50 text-red-700 ring-red-200',
  suspended: 'bg-slate-100 text-slate-600 ring-slate-200',
}

const verificationLabel = {
  verified: 'Verified by veterinarian',
  pending_review: 'Awaiting veterinarian review',
  rejected: 'Needs updates',
  suspended: 'Temporarily suspended',
}

export function DonorProfilePage() {
  const { updateUserProfile } = useAuth()
  const [profile, setProfile] = useState({ full_name: '', email: '', phone: '', address: '' })
  const [dogs, setDogs] = useState([])
  const [clinics, setClinics] = useState([])
  const [dogForm, setDogForm] = useState(emptyDog)
  const [editingDogId, setEditingDogId] = useState(null)
  const [passwordForm, setPasswordForm] = useState({ current_password: '', new_password: '', new_password_confirmation: '' })
  const [loading, setLoading] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingDog, setSavingDog] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    Promise.all([getDonorProfile(), getDonorDogs(), getDonorClinics()])
      .then(([profileData, dogData, clinicData]) => {
        setProfile(profileData)
        setDogs(dogData)
        setClinics(clinicData)
      })
      .catch((requestError) => setError(requestError.response?.data?.message || 'Unable to load your donor profiles.'))
      .finally(() => setLoading(false))
  }, [])

  const updateProfileField = (event) => setProfile((current) => ({ ...current, [event.target.name]: event.target.value }))

  const saveProfile = async (event) => {
    event.preventDefault()
    setSavingProfile(true)
    setError('')
    setMessage('')
    try {
      const payload = { ...profile }
      if (passwordForm.new_password) Object.assign(payload, passwordForm)
      const result = await saveDonorProfile(payload)
      setProfile(result.profile)
      updateUserProfile(result.profile)
      setPasswordForm({ current_password: '', new_password: '', new_password_confirmation: '' })
      setMessage(result.message)
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to save your account profile.')
    } finally {
      setSavingProfile(false)
    }
  }

  const submitDog = async (event) => {
    event.preventDefault()
    setSavingDog(true)
    setError('')
    setMessage('')
    const payload = {
      ...dogForm,
      age_years: Number(dogForm.age_years),
      blood_type: dogForm.blood_type || null,
      clinic_id: Number(dogForm.clinic_id),
      weight_kg: dogForm.weight_kg ? Number(dogForm.weight_kg) : null,
    }

    try {
      const result = editingDogId
        ? await updateDonorDog(editingDogId, payload)
        : await createDonorDog(payload)
      setDogs((current) => editingDogId
        ? current.map((dog) => dog.dog_id === editingDogId ? result.dog : dog)
        : [...current, result.dog])
      setDogForm(emptyDog)
      setEditingDogId(null)
      setMessage(result.message)
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to save this dog profile.')
    } finally {
      setSavingDog(false)
    }
  }

  const editDog = (dog) => {
    setEditingDogId(dog.dog_id)
    setDogForm({
      name: dog.name || '',
      breed: dog.breed || '',
      age_years: dog.age_years ?? '',
      sex: dog.sex || '',
      blood_type: dog.blood_type || '',
      weight_kg: dog.weight_kg || '',
      clinic_id: String(dog.clinic_id || ''),
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const cancelDogEdit = () => {
    setEditingDogId(null)
    setDogForm(emptyDog)
  }

  return (
    <DonorLayout>
      <header className="mb-8">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-blood-red">Owner account</p>
        <h1 className="mt-2 text-3xl font-extrabold text-gray-900 sm:text-4xl">Donor profile management</h1>
        <p className="mt-2 max-w-3xl text-gray-600">Manage your contact details and each dog registered to your account. Veterinary verification is tracked separately for every dog.</p>
      </header>

      {error && <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">{error}</div>}
      {message && <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800" role="status">{message}</div>}

      {loading ? <div className="card py-16 text-center text-gray-500">Loading your profiles...</div> : (
        <div className="space-y-6">
          <section className="card">
            <div className="mb-5 border-b border-red-100 pb-4">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-blood-red">Owner information</p>
              <h2 className="mt-1 text-xl font-extrabold text-gray-900">Account and contact details</h2>
            </div>
            <form onSubmit={saveProfile} className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="text-sm font-semibold text-gray-700">Owner name
                  <input required name="full_name" value={profile.full_name} onChange={updateProfileField} className="form-control mt-2" autoComplete="name" />
                </label>
                <label className="text-sm font-semibold text-gray-700">Email address
                  <input required type="email" name="email" value={profile.email} onChange={updateProfileField} className="form-control mt-2" autoComplete="email" />
                </label>
                <label className="text-sm font-semibold text-gray-700">Phone number
                  <input type="tel" name="phone" value={profile.phone || ''} onChange={updateProfileField} className="form-control mt-2" autoComplete="tel" />
                </label>
                <label className="text-sm font-semibold text-gray-700">Address <span className="font-normal text-gray-500">Optional</span>
                  <input name="address" value={profile.address || ''} onChange={updateProfileField} className="form-control mt-2" autoComplete="street-address" placeholder="Add an address if you choose" />
                </label>
              </div>

              <details className="rounded-xl border border-gray-200 px-4 py-3">
                <summary className="cursor-pointer text-sm font-semibold text-gray-800">Change password</summary>
                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                  <label className="text-sm font-medium text-gray-700">Current password
                    <input type="password" autoComplete="current-password" value={passwordForm.current_password} onChange={(event) => setPasswordForm((current) => ({ ...current, current_password: event.target.value }))} className="form-control mt-2" />
                  </label>
                  <label className="text-sm font-medium text-gray-700">New password
                    <input type="password" autoComplete="new-password" minLength="8" value={passwordForm.new_password} onChange={(event) => setPasswordForm((current) => ({ ...current, new_password: event.target.value }))} className="form-control mt-2" />
                  </label>
                  <label className="text-sm font-medium text-gray-700">Confirm new password
                    <input type="password" autoComplete="new-password" minLength="8" value={passwordForm.new_password_confirmation} onChange={(event) => setPasswordForm((current) => ({ ...current, new_password_confirmation: event.target.value }))} className="form-control mt-2" />
                  </label>
                </div>
              </details>

              <div className="flex justify-end">
                <button type="submit" disabled={savingProfile} className="btn-primary w-full sm:w-auto">{savingProfile ? 'Saving account...' : 'Save account details'}</button>
              </div>
            </form>
          </section>

          <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(19rem,0.8fr)]">
            <div className="card">
              <div className="mb-5 flex flex-wrap items-end justify-between gap-3 border-b border-red-100 pb-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-blood-red">Dog profile management</p>
                  <h2 className="mt-1 text-xl font-extrabold text-gray-900">Your dogs</h2>
                </div>
                <span className="rounded-full bg-red-50 px-3 py-1 text-sm font-semibold text-blood-red">{dogs.length} {dogs.length === 1 ? 'profile' : 'profiles'}</span>
              </div>

              {dogs.length === 0 ? (
                <div className="rounded-xl border border-dashed border-red-200 bg-red-50/50 px-5 py-8 text-center">
                  <h3 className="font-bold text-gray-900">No dog profiles yet</h3>
                  <p className="mt-1 text-sm text-gray-600">Add your first dog profile. You can register more dogs to the same owner account.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {dogs.map((dog) => (
                    <article key={dog.dog_id} className="rounded-xl border border-gray-200 p-4 sm:p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">{dog.name}</h3>
                          <p className="mt-1 text-sm text-gray-600">{dog.breed || 'Breed not specified'} · {dog.sex ? dog.sex[0].toUpperCase() + dog.sex.slice(1) : 'Gender not specified'} · {dog.age_years == null ? 'Age not specified' : `${dog.age_years} ${dog.age_years === 1 ? 'year' : 'years'}`}</p>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${verificationStyle[dog.eligibility_status] || verificationStyle.pending_review}`}>
                          {verificationLabel[dog.eligibility_status] || dog.eligibility_status?.replaceAll('_', ' ')}
                        </span>
                      </div>
                      <div className="mt-4 grid gap-3 border-t border-gray-100 pt-4 sm:grid-cols-3">
                        <div><p className="text-xs font-semibold uppercase text-gray-500">Canine blood type</p><p className="mt-1 font-semibold text-gray-900">{dog.blood_type || 'Not tested'}</p></div>
                        <div><p className="text-xs font-semibold uppercase text-gray-500">Veterinary clinic</p><p className="mt-1 font-semibold text-gray-900">{dog.clinic_name || 'Not selected'}</p></div>
                        <div><p className="text-xs font-semibold uppercase text-gray-500">Availability</p><p className="mt-1 font-semibold capitalize text-gray-900">{dog.availability_status?.replaceAll('_', ' ') || 'Unavailable'}</p></div>
                      </div>
                      <div className="mt-4 flex justify-end">
                        <button type="button" onClick={() => editDog(dog)} className="btn-secondary px-4 py-2 text-sm">Edit dog profile</button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>

            <form onSubmit={submitDog} className="card h-fit space-y-4">
              <div className="border-b border-red-100 pb-4">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-blood-red">{editingDogId ? 'Update dog' : 'Add another dog'}</p>
                <h2 className="mt-1 text-xl font-extrabold text-gray-900">{editingDogId ? 'Dog details' : 'New dog profile'}</h2>
              </div>
              <label className="block text-sm font-semibold text-gray-700">Dog name
                <input required maxLength="100" value={dogForm.name} onChange={(event) => setDogForm((current) => ({ ...current, name: event.target.value }))} className="form-control mt-2" />
              </label>
              <label className="block text-sm font-semibold text-gray-700">Breed
                <input value={dogForm.breed} onChange={(event) => setDogForm((current) => ({ ...current, breed: event.target.value }))} className="form-control mt-2" placeholder="e.g. Aspin" />
              </label>
              <label className="block text-sm font-semibold text-gray-700">Veterinary clinic
                <select required value={dogForm.clinic_id} onChange={(event) => setDogForm((current) => ({ ...current, clinic_id: event.target.value }))} className="form-control mt-2">
                  <option value="">Select a clinic</option>
                  {clinics.map((clinic) => <option key={clinic.clinic_id} value={clinic.clinic_id}>{clinic.name}{clinic.address ? ` · ${clinic.address}` : ''}</option>)}
                </select>
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-semibold text-gray-700">Age (years)
                  <input required type="number" min="0" max="30" value={dogForm.age_years} onChange={(event) => setDogForm((current) => ({ ...current, age_years: event.target.value }))} className="form-control mt-2" />
                </label>
                <label className="block text-sm font-semibold text-gray-700">Gender
                  <select required value={dogForm.sex} onChange={(event) => setDogForm((current) => ({ ...current, sex: event.target.value }))} className="form-control mt-2">
                    <option value="">Select</option><option value="female">Female</option><option value="male">Male</option>
                  </select>
                </label>
              </div>
              <label className="block text-sm font-semibold text-gray-700">Canine blood type <span className="font-normal text-gray-500">Optional until tested</span>
                <select value={dogForm.blood_type} onChange={(event) => setDogForm((current) => ({ ...current, blood_type: event.target.value }))} className="form-control mt-2">
                  <option value="">Not tested yet</option>
                  {CANINE_BLOOD_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
                </select>
              </label>
              <label className="block text-sm font-semibold text-gray-700">Weight (kg) <span className="font-normal text-gray-500">Optional</span>
                <input type="number" min="0.1" max="999.99" step="0.1" value={dogForm.weight_kg} onChange={(event) => setDogForm((current) => ({ ...current, weight_kg: event.target.value }))} className="form-control mt-2" />
              </label>

              <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-900">New and edited details require veterinarian review. Do not guess a blood type; an untested dog cannot be matched until a canine blood type is confirmed.</p>
              <button type="submit" disabled={savingDog} className="btn-primary w-full">{savingDog ? 'Saving dog...' : editingDogId ? 'Save and request review' : 'Add dog and request review'}</button>
              {editingDogId && <button type="button" onClick={cancelDogEdit} className="btn-secondary w-full">Cancel edit</button>}
            </form>
          </section>
        </div>
      )}
    </DonorLayout>
  )
}

export default DonorProfilePage