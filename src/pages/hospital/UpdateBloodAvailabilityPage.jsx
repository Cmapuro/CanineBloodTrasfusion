import React, { useState } from 'react'
import HospitalLayout from '../../components/layout/HospitalLayout'
import { TableComponent } from '../../components/ui/TableComponent'
import { Modal } from '../../components/common/Modal'

/**
 * UpdateBloodAvailabilityPage Component
 * Page for veterinary clinics to update donor availability
 */
export function UpdateBloodAvailabilityPage() {
  const [showModal, setShowModal] = useState(false)

  const bloodData = [
    { id: 1, bloodType: 'DEA 1 Compatible', quantity: 25, unit: 'donors', status: 'Available', expiry: 'Verified' },
    { id: 2, bloodType: 'DEA 1 Negative', quantity: 8, unit: 'donors', status: 'Available', expiry: 'Verified' },
    { id: 3, bloodType: 'DEA 4 Compatible', quantity: 5, unit: 'donors', status: 'Critical', expiry: 'Review needed' },
    { id: 4, bloodType: 'DEA 7 Compatible', quantity: 0, unit: 'donors', status: 'Unavailable', expiry: 'No matches' },
  ]

  const columns = [
    { key: 'bloodType', label: 'DEA Compatibility', sortable: true },
    { key: 'quantity', label: 'Available Donors', sortable: true },
    { key: 'status', label: 'Status', render: (value) => <span className={`badge ${value === 'Available' ? 'badge-success' : value === 'Critical' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>{value}</span> },
    { key: 'expiry', label: 'Verification', sortable: true },
  ]

  return (
    <HospitalLayout>
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Canine Donor Availability</h1>
          <p className="text-gray-600">Update DEA compatibility and verified donor availability</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          + Add donor group
        </button>
      </div>

      <div className="card">
        <TableComponent
          columns={columns}
          data={bloodData}
          searchable
          actions={[{ label: 'Edit', onClick: () => {} }, { label: 'Delete', onClick: () => {}, variant: 'danger' }]}
        />
      </div>

      <Modal
        isOpen={showModal}
        title="Add donor availability"
        onClose={() => setShowModal(false)}
        onConfirm={() => setShowModal(false)}
        confirmText="Add"
      >
        <form className="space-y-4">
          <input type="text" placeholder="DEA compatibility" className="form-control" />
          <input type="number" placeholder="Available donor count" className="form-control" />
          <input type="text" placeholder="Verification note" className="form-control" />
        </form>
      </Modal>
    </HospitalLayout>
  )
}

export default UpdateBloodAvailabilityPage
