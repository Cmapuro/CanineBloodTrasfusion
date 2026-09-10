import React, { useEffect, useState } from 'react'
import DonorLayout from '../../components/layout/DonorLayout'
import { getNotifications, markAllNotificationsRead, markNotificationRead } from '../../services/notificationService'

/**
 * NotificationsPage Component
 * Shows donor's notifications
 */
export function NotificationsPage() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadNotifications = () => {
    setLoading(true)
    getNotifications().then(setNotifications).catch(() => setError('Unable to load notifications.')).finally(() => setLoading(false))
  }

  useEffect(() => {
    loadNotifications()
  }, [])

  const markRead = async (notificationId) => {
    await markNotificationRead(notificationId)
    setNotifications((current) => current.map((notification) => notification.notification_id === notificationId ? { ...notification, is_read: true } : notification))
  }

  const markAllRead = async () => {
    await markAllNotificationsRead()
    setNotifications((current) => current.map((notification) => ({ ...notification, is_read: true })))
  }

  return (
    <DonorLayout>
      <h1 className="text-4xl font-bold text-gray-900 mb-2">Notifications</h1>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <p className="text-gray-600">Emergency requests, QR codes, health records, and transfusion history updates.</p>
        <div className="flex gap-2"><button type="button" onClick={loadNotifications} className="btn-secondary text-sm">Refresh</button><button type="button" onClick={markAllRead} className="btn-primary text-sm">Mark all read</button></div>
      </div>

      {error && <div className="mb-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {loading ? <div className="card py-16 text-center text-gray-500">Loading notifications...</div> : notifications.length === 0 ? <div className="card py-16 text-center text-gray-500">No notifications yet.</div> : <div className="space-y-4">
        {notifications.map((notif) => (
          <div key={notif.notification_id} className={`card border-l-4 ${notif.is_read ? 'border-gray-200 opacity-75' : 'border-blood-red'}`}>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-gray-900">{notif.title}</h3>
                <p className="text-gray-600 text-sm mt-1">{notif.message}</p>
                <p className="text-xs text-gray-500 mt-2">{new Date(notif.created_at).toLocaleString()}</p>
              </div>
              {!notif.is_read && <button type="button" onClick={() => markRead(notif.notification_id)} className="text-xs font-semibold text-blood-red hover:underline">Mark read</button>}
            </div>
          </div>
        ))}
      </div>}
    </DonorLayout>
  )
}

export default NotificationsPage
