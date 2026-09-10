import React from 'react'
import AdminLayout from '../../components/layout/AdminLayout'
import { TableComponent } from '../../components/ui/TableComponent'

/**
 * EmergencyRequestsMonitoringPage Component
 * Monitor emergency canine transfusion requests
 */
export function EmergencyRequestsMonitoringPage() {
  const emergencyRequests = [
    { id: 'ER-1048', hospital: 'ABC Veterinary Clinic', patient: 'Buddy', bloodType: 'DEA 1 Compatible', quantity: 1, urgency: 'Critical', date: '2026-05-15', status: 'Fulfilled' },
    { id: 'ER-1049', hospital: 'PawCare Veterinary Clinic', patient: 'Coco', bloodType: 'DEA 1 Negative', quantity: 2, urgency: 'High', date: '2026-05-14', status: 'Pending' },
  ]

  const columns = [
    { key: 'id', label: 'Request ID', sortable: true },
    { key: 'patient', label: 'Canine Patient', sortable: true },
    { key: 'hospital', label: 'Veterinary Clinic', sortable: true },
    { key: 'bloodType', label: 'Required DEA Type', sortable: true },
    { key: 'urgency', label: 'Urgency', render: (val) => <span className={`badge ${val === 'Critical' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>{val}</span> },
    { key: 'status', label: 'Status', render: (val) => <span className={`badge ${val === 'Fulfilled' ? 'badge-success' : 'bg-yellow-100 text-yellow-800'}`}>{val}</span> },
  ]

  return (
    <AdminLayout>
      <h1 className="text-4xl font-bold text-gray-900 mb-2">Emergency Transfusion Requests</h1>
      <p className="text-gray-600 mb-8">Monitor urgent canine cases across the veterinary network</p>
      <div className="card">
        <TableComponent columns={columns} data={emergencyRequests} searchable />
      </div>
    </AdminLayout>
  )
}

export default EmergencyRequestsMonitoringPage
