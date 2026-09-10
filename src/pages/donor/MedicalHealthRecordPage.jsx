import React from 'react'
import DonorLayout from '../../components/layout/DonorLayout'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { TableComponent } from '../../components/ui/TableComponent'
import { useAuth } from '../../hooks/useAuth'

const vaccinations = [
  { vaccine: 'Rabies', administered: '2026-01-18', expiration: '2027-01-18', status: 'Valid' },
  { vaccine: 'DHPP', administered: '2025-11-04', expiration: '2026-11-04', status: 'Valid' },
  { vaccine: 'Bordetella', administered: '2025-09-20', expiration: '2026-09-20', status: 'Expiring soon' },
]

const medicalHistory = [
  { date: '2026-02-12', entry: 'Annual wellness examination', recordedBy: 'CanineLink Veterinary Clinic' },
  { date: '2025-11-04', entry: 'Routine vaccination and health screening', recordedBy: 'CanineLink Veterinary Clinic' },
]

const donationHistory = [
  { date: '2026-05-15', clinic: 'CanineLink Veterinary Clinic', recipient: 'Buddy', volume: '450 ml', status: 'Completed' },
  { date: '2025-11-22', clinic: 'PawCare Veterinary Clinic', recipient: 'Coco', volume: '400 ml', status: 'Completed' },
]

const recordChanges = [
  { date: '2026-06-02 · 09:42', title: 'Availability updated', detail: 'Buddy marked available for emergency donor matching.', tone: 'green' },
  { date: '2026-05-15 · 16:18', title: 'Donation recorded', detail: 'Donation completed at CanineLink Veterinary Clinic.', tone: 'blue' },
  { date: '2026-02-12 · 11:05', title: 'Eligibility verified', detail: 'Licensed veterinarian approved the donor profile.', tone: 'red' },
  { date: '2025-11-04 · 14:26', title: 'Vaccination record added', detail: 'DHPP vaccination certificate was recorded.', tone: 'slate' },
]

function RecordIcon({ type }) {
  const paths = {
    clinic: <><path d="M4 20h16M6 20V8h12v12M8 8V5h8v3M9 12h1M14 12h1M9 16h1M14 16h1" /></>,
    shield: <><path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3z" /><path d="M9 12l2 2 4-4" /></>,
    history: <><circle cx="12" cy="12" r="8" /><path d="M12 7v5l3 2" /></>,
  }
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">{paths[type]}</svg>
}

export function MedicalHealthRecordPage() {
  const { user } = useAuth()
  const clinicName = user?.clinic?.name || 'CanineLink Clinic 2'
  const clinicId = user?.clinic?.clinic_id ? `CL-${String(user.clinic.clinic_id).padStart(3, '0')}` : 'CL-002'

  return (
    <DonorLayout>
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-blood-red">Donor records</p>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Medical Health Record</h1>
        <p className="text-gray-600">Review your dog&apos;s clinical details, eligibility, and donation history.</p>
      </div>

      <section className="mb-6 grid gap-4 md:grid-cols-[1.2fr_1fr]">
        <div className="rounded-2xl border border-red-100 bg-gradient-to-br from-red-50 to-white p-5 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blood-red text-white shadow-sm"><RecordIcon type="clinic" /></div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-blood-red">Clinic of record</p>
              <h2 className="mt-1 text-xl font-extrabold text-gray-900">{clinicName}</h2>
              <p className="mt-1 text-sm text-gray-600">This clinic maintains Buddy&apos;s verified health record.</p>
              <p className="mt-3 text-sm font-semibold text-gray-700">Tagum Veterinary Network · Clinic ID {clinicId}</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700"><RecordIcon type="shield" /></div>
            <div><h2 className="font-bold text-gray-900">Record legend</h2><p className="text-xs text-gray-500">What each status means</p></div>
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-semibold">
            <span className="badge badge-success">Verified / Valid</span>
            <span className="badge badge-warning">Review soon</span>
            <span className="badge badge-danger">Action needed</span>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr] mb-6">
        <section className="card">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
            <div>
              <p className="text-sm text-gray-500">Registered donor</p>
              <h2 className="text-2xl font-bold text-gray-900">Buddy</h2>
              <p className="text-gray-600">Golden Retriever · Male · 4 years old</p>
            </div>
            <StatusBadge status="Verified" />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <p className="text-sm text-gray-500">Blood type</p>
              <p className="text-lg font-semibold text-gray-900">DEA 1.1+</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Weight</p>
              <p className="text-lg font-semibold text-gray-900">28.5 kg</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Availability</p>
              <p className="text-lg font-semibold text-emerald-700">Available to donate</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Next eligible donation</p>
              <p className="text-lg font-semibold text-gray-900">2026-08-15</p>
            </div>
          </div>
        </section>

        <section className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Eligibility status</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <span className="text-gray-600">Veterinary verification</span>
              <StatusBadge status="Verified" />
            </div>
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <span className="text-gray-600">Current availability</span>
              <StatusBadge status="Available" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Donation cooldown</span>
              <span className="font-semibold text-emerald-700">Clear</span>
            </div>
          </div>
        </section>
      </div>

      <section className="card mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Vaccination details</h2>
            <p className="text-sm text-gray-500">Current vaccination records submitted for verification.</p>
          </div>
        </div>
        <TableComponent
          columns={[
            { key: 'vaccine', label: 'Vaccine', sortable: true },
            { key: 'administered', label: 'Date administered', sortable: true },
            { key: 'expiration', label: 'Expiration date', sortable: true },
            { key: 'status', label: 'Status', render: (value) => <StatusBadge status={value} /> },
          ]}
          data={vaccinations}
          searchable={false}
          paginated={false}
        />
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Relevant medical history</h2>
          <div className="space-y-4">
            {medicalHistory.map((item) => (
              <div key={`${item.date}-${item.entry}`} className="border-l-4 border-blood-red pl-4">
                <p className="text-sm font-semibold text-blood-red">{item.date}</p>
                <p className="font-medium text-gray-900">{item.entry}</p>
                <p className="text-sm text-gray-500">Recorded by {item.recordedBy}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Donation history</h2>
          <TableComponent
            columns={[
              { key: 'date', label: 'Date', sortable: true },
              { key: 'clinic', label: 'Clinic', sortable: true },
              { key: 'recipient', label: 'Recipient', sortable: true },
              { key: 'volume', label: 'Volume' },
              { key: 'status', label: 'Status', render: (value) => <StatusBadge status={value} /> },
            ]}
            data={donationHistory}
            searchable={false}
            paginated={false}
          />
        </section>
      </div>

      <section className="card mt-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-blood-red"><RecordIcon type="history" /></div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Record history</h2>
            <p className="text-sm text-gray-500">Every verification, donation, and availability change is dated.</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {recordChanges.map((change) => (
            <div key={`${change.date}-${change.title}`} className="flex gap-4 rounded-2xl border border-gray-100 bg-gray-50/70 p-4">
              <span className={`mt-1 h-3 w-3 shrink-0 rounded-full ${change.tone === 'green' ? 'bg-emerald-500' : change.tone === 'blue' ? 'bg-blue-500' : change.tone === 'red' ? 'bg-blood-red' : 'bg-slate-400'}`} />
              <div><p className="text-xs font-bold uppercase tracking-wide text-gray-500">{change.date}</p><p className="mt-1 font-bold text-gray-900">{change.title}</p><p className="mt-1 text-sm text-gray-600">{change.detail}</p></div>
            </div>
          ))}
        </div>
      </section>
    </DonorLayout>
  )
}

export default MedicalHealthRecordPage
