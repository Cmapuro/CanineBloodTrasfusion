import React from 'react'
import DonorLayout from '../../components/layout/DonorLayout'
import { TableComponent } from '../../components/ui/TableComponent'

/**
 * DonationHistoryPage Component
 * Shows a dog's past transfusion donation history
 */
export function DonationHistoryPage() {
  const donationData = [
    { id: 1, date: '2026-05-15', hospital: 'ABC Veterinary Clinic', recipient: 'Buddy', bloodType: 'DEA 1 Compatible', status: 'Completed' },
    { id: 2, date: '2026-04-20', hospital: 'PawCare Veterinary Clinic', recipient: 'Coco', bloodType: 'DEA 1 Compatible', status: 'Completed' },
    { id: 3, date: '2026-03-25', hospital: 'North Valley Vet Center', recipient: 'Max', bloodType: 'DEA 1 Compatible', status: 'Completed' },
  ]

  const columns = [
    { key: 'date', label: 'Date', sortable: true },
    { key: 'hospital', label: 'Veterinary Clinic', sortable: true },
    { key: 'recipient', label: 'Recipient Dog', sortable: true },
    { key: 'bloodType', label: 'DEA Compatibility', sortable: true },
    { key: 'status', label: 'Status', render: (value) => <span className="badge badge-success">{value}</span> },
  ]

  return (
    <DonorLayout>
      <h1 className="text-4xl font-bold text-gray-900 mb-2">Donation History</h1>
      <p className="text-gray-600 mb-8">Your canine donor coordination records</p>

      <div className="card">
        <TableComponent
          columns={columns}
          data={donationData}
          searchable
          paginated
          itemsPerPage={10}
        />
      </div>
    </DonorLayout>
  )
}

export default DonationHistoryPage
