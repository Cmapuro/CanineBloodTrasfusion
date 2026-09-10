import React, { useState } from 'react'
import AdminLayout from '../../components/layout/AdminLayout'
import { TableComponent } from '../../components/ui/TableComponent'
import donorsJson from '../../data/donors.json'
import { Modal } from '../../components/common/Modal'

/**
 * ManageDonorsPage Component
 * Manage registered canine donors
 */
export function ManageDonorsPage() {
  const [donors, setDonors] = useState(() => {
    const stored = localStorage.getItem('donors')
    return stored ? JSON.parse(stored) : donorsJson
  })
  const [editing, setEditing] = useState(null)

  const columns = [
    { key: 'donorID', label: 'Donor ID', sortable: true },
    { key: 'firstName', label: 'Dog Name', render: (val, row) => `${row.firstName} ${row.lastName}` },
    { key: 'bloodType', label: 'DEA Compatibility', sortable: true },
    { key: 'age', label: 'Age', sortable: true, render: (val) => `${val} years` },
    { key: 'gender', label: 'Breed', render: () => 'Golden Retriever' },
    { key: 'isEligible', label: 'Availability', render: (val) => <span className={`badge ${val ? 'badge-success' : 'bg-red-100 text-red-800'}`}>{val ? 'Available' : 'Unavailable'}</span> },
  ]

  const saveDonors = (updated) => {
    setDonors(updated)
    localStorage.setItem('donors', JSON.stringify(updated))
  }

  const handleEdit = (row) => {
    setEditing({ ...row })
  }

  const handleSuspend = (row) => {
    if (!confirm(`Suspend donor "${row.firstName} ${row.lastName}"?`)) return
    const updated = donors.map((d) => (d.id === row.id ? { ...d, isEligible: false } : d))
    saveDonors(updated)
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setEditing((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleSave = () => {
    const updated = donors.map((d) => (d.id === editing.id ? editing : d))
    saveDonors(updated)
    setEditing(null)
  }

  return (
    <AdminLayout>
      <h1 className="text-4xl font-bold text-gray-900 mb-2">Canine Donor Management</h1>
      <p className="text-gray-600 mb-8">Review dog profiles, health status, and donation eligibility</p>
      <div className="card">
        <TableComponent columns={columns} data={donors} searchable actions={[
          { label: 'Edit', onClick: handleEdit, icon: (<svg viewBox="0 0 24 24" className="w-4 h-4" fill="none"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" stroke="currentColor" strokeWidth="1.2"/></svg>) },
          { label: 'Suspend', onClick: handleSuspend, variant: 'danger', icon: (<svg viewBox="0 0 24 24" className="w-4 h-4" fill="none"><path d="M6 7l6 6-6 6" stroke="currentColor" strokeWidth="1.2"/></svg>) },
        ]} />
      </div>

      <Modal isOpen={!!editing} title={editing ? `Edit ${editing.firstName} ${editing.lastName}` : ''} onClose={() => setEditing(null)} onConfirm={handleSave} confirmText="Save">
        {editing && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
              <input name="firstName" value={editing.firstName} onChange={handleChange} className="form-control" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              <input name="lastName" value={editing.lastName} onChange={handleChange} className="form-control" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input name="email" value={editing.email} onChange={handleChange} className="form-control" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input name="phone" value={editing.phone} onChange={handleChange} className="form-control" />
            </div>
            <div>
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" name="isEligible" checked={editing.isEligible} onChange={handleChange} />
                <span className="text-sm">Eligible to donate</span>
              </label>
            </div>
          </div>
        )}
      </Modal>
    </AdminLayout>
  )
}

export default ManageDonorsPage
