import React, { useState } from 'react'
import AdminLayout from '../../components/layout/AdminLayout'
import { TableComponent } from '../../components/ui/TableComponent'
import hospitalsJson from '../../data/hospitals.json'
import { Modal } from '../../components/common/Modal'

/**
 * ManageHospitalsPage Component
 * Manage partner hospitals
 */
export function ManageHospitalsPage() {
  const [hospitals, setHospitals] = useState(() => {
    const stored = localStorage.getItem('hospitals')
    const dataVersion = localStorage.getItem('hospitals-data-version')
    if (dataVersion !== 'v2') {
      localStorage.setItem('hospitals-data-version', 'v2')
      localStorage.setItem('hospitals', JSON.stringify(hospitalsJson))
      return hospitalsJson
    }
    return stored ? JSON.parse(stored) : hospitalsJson
  })
  const [editing, setEditing] = useState(null)
  const [adding, setAdding] = useState(false)

  const columns = [
    { key: 'name', label: 'Hospital Name', sortable: true },
    { key: 'city', label: 'City', sortable: true },
    { key: 'phone', label: 'Phone', sortable: false },
    { key: 'type', label: 'Type', sortable: true },
  ]

  const saveHospitals = (updated) => {
    setHospitals(updated)
    localStorage.setItem('hospitals', JSON.stringify(updated))
    localStorage.setItem('hospitals-data-version', 'v2')
    // Notify other parts of the app that hospitals data changed
    try {
      window.dispatchEvent(new CustomEvent('hospitals-updated', { detail: { hospitals: updated } }))
    } catch (e) {
      // ignore
    }
  }

  const handleEdit = (row) => {
    setEditing({ ...row })
  }

  const handleDelete = (row) => {
    if (!confirm(`Delete hospital "${row.name}"?`)) return
    const updated = hospitals.filter((h) => h.id !== row.id)
    saveHospitals(updated)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setEditing((prev) => ({ ...prev, [name]: value }))
  }

  const handleSave = () => {
    const updated = hospitals.map((h) => (h.id === editing.id ? editing : h))
    saveHospitals(updated)
    setEditing(null)
  }

  const handleAdd = () => {
    const newClinic = {
      ...adding,
      id: hospitals.reduce((highestId, hospital) => Math.max(highestId, hospital.id || 0), 0) + 1,
    }
    saveHospitals([...hospitals, newClinic])
    setAdding(null)
  }

  const handleFormChange = (setter) => (e) => {
    const { name, value } = e.target
    setter((previous) => ({ ...previous, [name]: value }))
  }

  return (
    <AdminLayout>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-blood-red">Provincial Network</p>
          <h1 className="mt-2 text-4xl font-bold text-gray-900">Veterinary Clinics</h1>
          <p className="mt-2 text-gray-600">Manage the clinics authorized to coordinate CanineLink transfusions.</p>
        </div>
        <button type="button" onClick={() => setAdding({ name: '', type: 'Veterinary clinic', city: '', phone: '', email: '', address: '' })} className="btn-primary inline-flex items-center justify-center gap-2 sm:w-auto">
          <span className="text-xl leading-none">+</span>
          Add Clinic
        </button>
      </div>
      <div className="card">
        <TableComponent
          columns={columns}
          data={hospitals}
          searchable
          actions={[
            { label: 'Edit', onClick: handleEdit, icon: (<svg viewBox="0 0 24 24" className="w-4 h-4" fill="none"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" stroke="currentColor" strokeWidth="1.2"/></svg>) },
            { label: 'Delete', onClick: handleDelete, variant: 'danger', icon: (<svg viewBox="0 0 24 24" className="w-4 h-4" fill="none"><path d="M3 6h18" stroke="currentColor" strokeWidth="1.2"/><path d="M8 6v12a2 2 0 002 2h4a2 2 0 002-2V6" stroke="currentColor" strokeWidth="1.2"/></svg>) },
          ]}
        />
      </div>

      <Modal isOpen={!!editing || !!adding} title={editing ? `Edit ${editing.name}` : 'Add Veterinary Clinic'} onClose={() => { setEditing(null); setAdding(false) }} onConfirm={editing ? handleSave : handleAdd} confirmText={editing ? 'Save' : 'Add Clinic'}>
        {(editing || adding) && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input name="name" value={(editing || adding).name} onChange={editing ? handleChange : handleFormChange(setAdding)} className="form-control" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <input name="type" value={(editing || adding).type} onChange={editing ? handleChange : handleFormChange(setAdding)} className="form-control" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input name="city" value={(editing || adding).city} onChange={editing ? handleChange : handleFormChange(setAdding)} className="form-control" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input name="phone" value={(editing || adding).phone} onChange={editing ? handleChange : handleFormChange(setAdding)} className="form-control" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input name="email" type="email" value={(editing || adding).email || ''} onChange={editing ? handleChange : handleFormChange(setAdding)} className="form-control" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input name="address" value={(editing || adding).address || ''} onChange={editing ? handleChange : handleFormChange(setAdding)} className="form-control" required />
            </div>
          </div>
        )}
      </Modal>
    </AdminLayout>
  )
}

export default ManageHospitalsPage
