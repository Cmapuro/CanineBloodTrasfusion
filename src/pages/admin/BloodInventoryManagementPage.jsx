import React from 'react'
import AdminLayout from '../../components/layout/AdminLayout'
import { TableComponent } from '../../components/ui/TableComponent'
import { BloodAvailabilityCard } from '../../components/ui/BloodAvailabilityCard'
import bloodInventoryData from '../../data/bloodInventory.json'

/**
 * BloodInventoryManagementPage Component
 * Manage system-wide blood inventory
 */
export function BloodInventoryManagementPage() {
  return (
    <AdminLayout>
      <h1 className="text-4xl font-bold text-gray-900 mb-8">Blood Inventory Management</h1>

      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6">DEA Inventory by Veterinary Clinic</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bloodInventoryData.map((blood) => (
            <BloodAvailabilityCard key={blood.id} blood={blood} />
          ))}
        </div>
      </div>
    </AdminLayout>
  )
}

export default BloodInventoryManagementPage
