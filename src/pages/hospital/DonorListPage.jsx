import React, { useState } from 'react'
import HospitalLayout from '../../components/layout/HospitalLayout'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { TableComponent } from '../../components/ui/TableComponent'
import { Modal } from '../../components/common/Modal'
import donorsJson from '../../data/donors.json'

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

function RecordIcon({ type }) {
  const paths = {
    clinic: <><path d="M4 20h16M6 20V8h12v12M8 8V5h8v3M9 12h1M14 12h1M9 16h1M14 16h1" /></>,
    shield: <><path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3z" /><path d="M9 12l2 2 4-4" /></>,
    history: <><circle cx="12" cy="12" r="8" /><path d="M12 7v5l3 2" /></>,
  }
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">{paths[type]}</svg>
}

export function DonorListPage() {
  const [donors, setDonors] = useState(() => {
    const stored = localStorage.getItem('donors')
    return stored ? JSON.parse(stored) : donorsJson
  })
  const [selectedDonor, setSelectedDonor] = useState(null)
  const [viewMode, setViewMode] = useState('list')

  const columns = [
    { key: 'donorID', label: 'Donor ID', sortable: true },
    { key: 'firstName', label: 'Dog Name', render: (val, row) => `${row.firstName} ${row.lastName}` },
    { key: 'bloodType', label: 'DEA Compatibility', sortable: true },
    { key: 'age', label: 'Age', sortable: true, render: (val) => `${val} years` },
    { key: 'gender', label: 'Gender', sortable: true },
    { key: 'isEligible', label: 'Status', render: (val) => <StatusBadge status={val ? 'Available' : 'Unavailable'} /> },
  ]

  const handleViewDetails = (donor) => {
    setSelectedDonor(donor)
    setViewMode('details')
  }

  const handleBackToList = () => {
    setSelectedDonor(null)
    setViewMode('list')
  }

  return (
    <HospitalLayout>
      {viewMode === 'list' ? (
        <>
          <div className="mb-8">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-blood-red">Hospital Management</p>
            <h1 className="mt-2 text-4xl font-extrabold text-gray-900">Donor List</h1>
            <p className="mt-2 text-gray-600">View donor status and access complete medical health records</p>
          </div>

          <div className="card">
            <TableComponent
              columns={columns}
              data={donors}
              searchable
              actions={[
                {
                  label: 'View Details',
                  onClick: handleViewDetails,
                  icon: (
                    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none">
                      <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" stroke="currentColor" strokeWidth="1.2" />
                      <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" stroke="currentColor" strokeWidth="1.2" />
                    </svg>
                  )
                }
              ]}
            />
          </div>
        </>
      ) : (
        <>
          <div className="mb-8">
            <button
              onClick={handleBackToList}
              className="mb-4 flex items-center gap-2 text-sm font-semibold text-blood-red hover:text-red-700"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Back to Donor List
            </button>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-blood-red">Donor Information</p>
            <h1 className="mt-2 text-4xl font-extrabold text-gray-900">
              {selectedDonor?.firstName} {selectedDonor?.lastName}
            </h1>
            <p className="mt-2 text-gray-600">Complete medical health record and donation history</p>
          </div>

          <section className="mb-6 grid gap-4 md:grid-cols-[1.2fr_1fr]">
            <div className="rounded-2xl border border-red-100 bg-gradient-to-br from-red-50 to-white p-5 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blood-red text-white shadow-sm">
                  <RecordIcon type="clinic" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-blood-red">Donor Status</p>
                  <h2 className="mt-1 text-xl font-extrabold text-gray-900">
                    {selectedDonor?.isEligible ? 'Available for Donation' : 'Currently Unavailable'}
                  </h2>
                  <p className="mt-1 text-sm text-gray-600">
                    {selectedDonor?.isEligible
                      ? 'This donor is eligible for emergency blood transfusion requests.'
                      : 'This donor is temporarily unavailable for donation.'}
                  </p>
                  <p className="mt-3 text-sm font-semibold text-gray-700">Donor ID: {selectedDonor?.donorID}</p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                  <RecordIcon type="shield" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-900">Record legend</h2>
                  <p className="text-xs text-gray-500">What each status means</p>
                </div>
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
                  <h2 className="text-2xl font-bold text-gray-900">
                    {selectedDonor?.firstName} {selectedDonor?.lastName}
                  </h2>
                  <p className="text-gray-600">
                    Golden Retriever · {selectedDonor?.gender} · {selectedDonor?.age} years old
                  </p>
                </div>
                <StatusBadge status={selectedDonor?.isEligible ? 'Verified' : 'Unavailable'} />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-gray-500">Blood type</p>
                  <p className="text-lg font-semibold text-gray-900">{selectedDonor?.bloodType}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Weight</p>
                  <p className="text-lg font-semibold text-gray-900">28.5 kg</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Availability</p>
                  <p className={`text-lg font-semibold ${selectedDonor?.isEligible ? 'text-emerald-700' : 'text-red-700'}`}>
                    {selectedDonor?.isEligible ? 'Available to donate' : 'Unavailable'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Contact</p>
                  <p className="text-lg font-semibold text-gray-900">{selectedDonor?.phone}</p>
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
                  <StatusBadge status={selectedDonor?.isEligible ? 'Available' : 'Unavailable'} />
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
        </>
      )}
    </HospitalLayout>
  )
}

export default DonorListPage
