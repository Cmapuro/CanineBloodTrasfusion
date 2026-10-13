import React, { useEffect, useState } from 'react'
import DonorLayout from '../../components/layout/DonorLayout'
import { TableComponent } from '../../components/ui/TableComponent'
import { getOwnDonationHistory } from '../../services/donorService'

/**
 * DonationHistoryPage Component
 * Shows a dog's past transfusion donation history
 */
export function DonationHistoryPage() {
  const [donationData, setDonationData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getOwnDonationHistory()
      .then(setDonationData)
      .catch((requestError) => setError(requestError.response?.data?.message || 'Unable to load your donation history.'))
      .finally(() => setLoading(false))
  }, [])

  const columns = [
    { key: 'donation_date', label: 'Date', sortable: true },
    { key: 'clinic_name', label: 'Veterinary Clinic', sortable: true },
    { key: 'dog_name', label: 'Donor Dog', sortable: true },
    { key: 'patient_name', label: 'Recipient', sortable: true },
    { key: 'blood_type', label: 'Canine Blood Type', sortable: true },
    { key: 'product_type', label: 'Product' },
    { key: 'volume_ml', label: 'Volume (ml)' },
  ]

  return (
    <DonorLayout>
      <h1 className="text-4xl font-bold text-gray-900 mb-2">Donation History</h1>
      <p className="text-gray-600 mb-8">Completed donation records from your registered dogs</p>

      {error && <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">{error}</p>}
      <div className="card">
        {loading ? <p className="py-12 text-center text-gray-500">Loading donation history…</p> : <TableComponent
          columns={columns}
          data={donationData}
          searchable
          paginated
          itemsPerPage={10}
        />}
      </div>
    </DonorLayout>
  )
}

export default DonationHistoryPage
