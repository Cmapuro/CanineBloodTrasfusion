import React, { useEffect, useState } from 'react'
import DonorLayout from '../../components/layout/DonorLayout'
import { TableComponent } from '../../components/ui/TableComponent'
import { getDonorDonationHistory } from '../../services/authService'

/**
 * DonationHistoryPage Component
 * Shows a dog's past transfusion donation history
 */
export function DonationHistoryPage() {
  const [donationData, setDonationData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadDonationHistory = async () => {
    setLoading(true)
    setError('')
    try {
      const donations = await getDonorDonationHistory()
      setDonationData(Array.isArray(donations) ? donations : [])
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || 'Unable to load donation history.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDonationHistory()
  }, [])

  const columns = [
    { key: 'donation_date', label: 'Date', sortable: true, render: (value) => value ? new Date(`${value}T00:00:00`).toLocaleDateString() : 'Not recorded' },
    { key: 'dog_name', label: 'Donor Dog', sortable: true },
    { key: 'clinic_name', label: 'Veterinary Clinic', sortable: true },
    { key: 'blood_type', label: 'Dog Blood Type', sortable: true, render: (value) => value || 'Not recorded' },
    { key: 'product_type', label: 'Product', sortable: true, render: (value) => value?.replaceAll('_', ' ') || 'Not recorded' },
    { key: 'volume_ml', label: 'Volume (mL)', sortable: true, render: (value) => value == null ? 'Not recorded' : Number(value).toLocaleString() },
    { key: 'recipient_name', label: 'Recipient', sortable: true, render: (value) => value || 'Emergency patient' },
  ]

  return (
    <DonorLayout>
      <h1 className="text-4xl font-bold text-gray-900 mb-2">Donation History</h1>
      <p className="text-gray-600 mb-8">Recorded donations for your registered dogs</p>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          <p>{error}</p>
          <button type="button" onClick={loadDonationHistory} className="mt-2 font-semibold underline">Try again</button>
        </div>
      )}

      {loading ? (
        <div className="card py-12 text-center text-gray-500" role="status">Loading donation history...</div>
      ) : donationData.length === 0 ? (
        <div className="card py-12 text-center">
          <h2 className="font-bold text-gray-900">No donations recorded yet</h2>
          <p className="mt-2 text-sm text-gray-500">Completed donations recorded by your veterinary clinic will appear here.</p>
        </div>
      ) : (
        <div className="card">
          <TableComponent columns={columns} data={donationData} searchable paginated itemsPerPage={10} />
        </div>
      )}
    </DonorLayout>
  )
}

export default DonationHistoryPage
