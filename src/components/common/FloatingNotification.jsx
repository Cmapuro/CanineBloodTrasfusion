import React, { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { getNotifications, markNotificationRead } from '../../services/notificationService'
import { Modal } from './Modal'

const notificationDestinations = {
  donor: {
    emergency_request: '/donor/emergency-requests',
    match_found: '/donor/emergency-requests',
    verification_result: '/donor/verification-qr',
    default: '/donor/notifications',
  },
  hospital: {
    emergency_request: '/hospital/emergency-request-history',
    match_found: '/hospital/emergency-broadcast',
    verification_result: '/hospital/qr-scan-verification',
    default: '/hospital/notifications',
  },
  admin: {
    default: '/admin/notifications',
  },
}

const notificationTime = (value) => {
  const timestamp = new Date(value).getTime()
  if (Number.isNaN(timestamp)) return 'Date unavailable'

  const elapsedSeconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000))
  if (elapsedSeconds < 60) return 'Just now'
  if (elapsedSeconds < 3600) return `${Math.floor(elapsedSeconds / 60)} min ago`
  if (elapsedSeconds < 86400) return `${Math.floor(elapsedSeconds / 3600)} hr ago`
  if (elapsedSeconds < 604800) return `${Math.floor(elapsedSeconds / 86400)} days ago`
  return new Date(timestamp).toLocaleDateString()
}

export function FloatingNotification() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState(null)
  const [isOpen, setIsOpen] = useState(false)
  const [logoutOpen, setLogoutOpen] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const loadNotifications = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true)

    try {
      const data = await getNotifications()
      setNotifications(Array.isArray(data) ? data : [])
      setError('')
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Notifications could not be refreshed.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadNotifications(true)
    const intervalId = window.setInterval(() => {
      if (document.visibilityState === 'visible') loadNotifications()
    }, 10000)

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') loadNotifications()
    }

    document.addEventListener('visibilitychange', handleVisibility)
    return () => {
      window.clearInterval(intervalId)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [loadNotifications])

  const unreadCount = notifications.filter((notification) => !notification.is_read).length
  const recentNotifications = notifications.slice(0, 4)
  const allNotificationsPath = notificationDestinations[user?.role]?.default || '/donor/notifications'

  const handleNotificationClick = async (notification) => {
    setIsOpen(false)
    if (!notification.is_read) {
      setBusyId(notification.notification_id)
      try {
        await markNotificationRead(notification.notification_id)
        setNotifications((current) => current.map((item) =>
          item.notification_id === notification.notification_id
            ? { ...item, is_read: true }
            : item
        ))
      } catch (requestError) {
        setError(requestError.response?.data?.message || 'Unable to mark this notification as read.')
      } finally {
        setBusyId(null)
      }
    }

    const roleDestinations = notificationDestinations[user?.role]
    navigate(roleDestinations?.[notification.type] || roleDestinations?.default || allNotificationsPath)
  }

  const handleLogout = async () => {
    await logout()
    setLogoutOpen(false)
    navigate(user?.role === 'hospital' ? '/hospital/login' : user?.role === 'admin' ? '/admin/login' : '/donor/login')
  }

  return (
    <>
      <div className="fixed right-4 top-4 z-50 flex items-center gap-3">
        <button
          type="button"
          onClick={() => {
            setIsOpen((open) => !open)
            if (!isOpen) loadNotifications()
          }}
          className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-blood-red text-white shadow-lg transition-colors hover:bg-red-700"
          aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
          aria-expanded={isOpen}
          aria-haspopup="dialog"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" stroke="currentColor" strokeWidth="2">
            <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-yellow-400 px-1 text-xs font-bold text-gray-900">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setLogoutOpen(true)}
          className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#b91c1c] via-[#dc2626] to-[#ec4899] px-3.5 py-2.5 text-sm font-bold text-white shadow-[0_12px_24px_rgba(190,24,93,0.35)] ring-1 ring-white/30 transition-all duration-200 hover:scale-[1.01] hover:shadow-[0_16px_28px_rgba(190,24,93,0.45)]"
          aria-label="Logout"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2.2">
            <path d="M10 4H5.5A1.5 1.5 0 004 5.5v13A1.5 1.5 0 005.5 20H10" strokeLinecap="round" />
            <path d="M13 8l4 4-4 4M8 12h9" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Logout
        </button>
      </div>

      {isOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default"
            aria-label="Close notifications"
            onClick={() => setIsOpen(false)}
          />
          <section
            className="fixed right-4 top-[4.5rem] z-50 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl"
            aria-label="Notifications"
            aria-live="polite"
          >
            <header className="flex items-center justify-between border-b border-gray-100 px-4 py-4">
              <h2 className="font-bold text-gray-900">Notifications</h2>
              <span className="text-xs font-semibold text-blood-red">{unreadCount} unread</span>
            </header>

            {error && (
              <div className="flex items-center justify-between gap-2 border-b border-red-100 bg-red-50 px-4 py-2 text-xs text-red-700" role="alert">
                <span>{error}</span>
                <button type="button" onClick={() => loadNotifications(true)} className="shrink-0 font-semibold underline">
                  Retry
                </button>
              </div>
            )}

            <div className="max-h-96 overflow-y-auto">
              {loading && notifications.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-gray-500" role="status">Loading notifications...</p>
              ) : recentNotifications.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-gray-500">No notifications yet.</p>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {recentNotifications.map((notification) => (
                    <li key={notification.notification_id}>
                      <button
                        type="button"
                        onClick={() => handleNotificationClick(notification)}
                        disabled={busyId === notification.notification_id}
                        className="flex w-full items-start gap-3 px-4 py-4 text-left transition-colors hover:bg-gray-50 disabled:opacity-60"
                      >
                        <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${
                          notification.is_read ? 'bg-gray-300' : 'bg-red-600'
                        }`} aria-label={notification.is_read ? 'Read' : 'Unread'} />
                        <span className="min-w-0 flex-1">
                          <span className={`block text-sm ${notification.is_read ? 'font-medium text-gray-600' : 'font-semibold text-gray-900'}`}>
                            {notification.title}
                          </span>
                          <span className="mt-1 block text-sm text-gray-500">{notification.message}</span>
                          <time className="mt-1.5 block text-xs text-gray-400" dateTime={notification.created_at}>
                            {notificationTime(notification.created_at)}
                          </time>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <footer className="border-t border-gray-100 px-4 py-3">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false)
                  navigate(allNotificationsPath)
                }}
                className="w-full text-center text-sm font-semibold text-blood-red hover:text-red-700"
              >
                View All Notifications
              </button>
            </footer>
          </section>
        </>
      )}

      <Modal
        isOpen={logoutOpen}
        title="Sign out of CanineLink?"
        onClose={() => setLogoutOpen(false)}
        onConfirm={handleLogout}
        confirmText="Yes, sign out"
        cancelText="Stay signed in"
        isDangerous
      >
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-blood-red">↗</div>
          <p className="text-gray-600">Your current session will be closed on this device.</p>
        </div>
      </Modal>
    </>
  )
}

export default FloatingNotification
