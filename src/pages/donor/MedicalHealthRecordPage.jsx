import React from 'react'
import DonorLayout from '../../components/layout/DonorLayout'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { TableComponent } from '../../components/ui/TableComponent'

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

export function MedicalHealthRecordPage() {
  return (
    <DonorLayout>
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-blood-red">Donor records</p>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Medical Health Record</h1>
        <p className="text-gray-600">Review your dog&apos;s clinical details, eligibility, and donation history.</p>
      </div>

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
    </DonorLayout>
  )
}

export default MedicalHealthRecordPage
