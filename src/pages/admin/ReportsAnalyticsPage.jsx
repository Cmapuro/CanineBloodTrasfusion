import React from 'react'
import AdminLayout from '../../components/layout/AdminLayout'
import { DashboardCard } from '../../components/ui/DashboardCard'
import { AnalyticsBarChart } from '../../components/ui/AnalyticsBarChart'

/**
 * ReportsAnalyticsPage Component
 * System reports and analytics
 */
export function ReportsAnalyticsPage() {
  const monthlyStatistics = [
    { label: 'Donations', value: 850, note: 'Monthly total' },
    { label: 'New Donors', value: 125, note: 'Registered this month' },
    { label: 'Blood Requests', value: 45, note: 'Incoming demand' },
    { label: 'Fulfilled', value: 43, note: 'Completed requests' },
  ]

  const bloodTypeDistribution = [
    { label: 'O+', value: 250 },
    { label: 'A+', value: 180 },
    { label: 'B+', value: 120 },
    { label: 'AB+', value: 60 },
  ]

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900">Reports & Analytics</h1>
        <p className="text-gray-600 mt-2">Performance overview with responsive chart summaries.</p>
      </div>

      <div className="grid-responsive mb-12">
        <DashboardCard title="Avg Response Time" value="12 min" icon="RT" />
        <DashboardCard title="Success Rate" value="98.5%" icon="SR" />
        <DashboardCard title="Blood Saved Lives" value="15,000+" icon="LV" />
        <DashboardCard title="Donor Satisfaction" value="96%" icon="DS" />
      </div>

      <div className="grid xl:grid-cols-2 gap-8 mb-8">
        <AnalyticsBarChart
          title="Monthly Statistics"
          subtitle="Donation and request activity for the current month"
          data={monthlyStatistics}
          formatter={(value) => value.toLocaleString()}
        />

        <AnalyticsBarChart
          title="DEA Compatibility Distribution"
          subtitle="Current availability by blood type"
          data={bloodTypeDistribution}
          formatter={(value) => `${value}`}
          colorClass="bg-gradient-to-t from-blood-dark to-blood-red"
        />
      </div>

      <div className="card">
        <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Insights</h2>
            <p className="text-sm text-gray-500 mt-1">Quick summary for admin decisions.</p>
          </div>
          <span className="badge badge-blood">Live summary</span>
        </div>

        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            { label: 'Response efficiency', value: 'Fast', tone: 'text-green-600' },
            { label: 'Donor growth', value: '+15%', tone: 'text-blood-red' },
            { label: 'Request completion', value: '95.6%', tone: 'text-blue-600' },
            { label: 'Inventory health', value: 'Stable', tone: 'text-amber-600' },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl border border-red-100 bg-red-50/40 p-4">
              <p className="text-sm text-gray-500">{item.label}</p>
              <p className={`text-2xl font-bold mt-2 ${item.tone}`}>{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  )
}

export default ReportsAnalyticsPage
