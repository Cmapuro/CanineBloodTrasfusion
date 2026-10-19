import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import AdminLayout from '../../components/layout/AdminLayout'
import HospitalLayout from '../../components/layout/HospitalLayout'
import { getNotifications, markAllNotificationsRead, markNotificationRead } from '../../services/notificationService'

const notificationTime = (value) => {
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? 'Date unavailable'
    : date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

export function HospitalNotificationsPage() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)
  const [markingAll, setMarkingAll] = useState(false)
  const [error, setError] = useState('')

  const loadNotifications = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true)
    try {
      const data = await getNotifications()
      setNotifications(Array.isArray(data) ? data : [])
      setError('')
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load notifications. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadNotifications(true)
    const intervalId = window.setInterval(() => {
      if (document.visibilityState === 'visible') loadNotifications()
    }, 15000)

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
  const visibleNotifications = useMemo(
    () => filter === 'unread'
      ? notifications.filter((notification) => !notification.is_read)
      : notifications,
    [filter, notifications]
  )

  const markRead = async (notificationId) => {
    setBusyId(notificationId)
    setError('')
    try {
      await markNotificationRead(notificationId)
      setNotifications((current) => current.map((notification) =>
        notification.notification_id === notificationId
          ? { ...notification, is_read: true }
          : notification
      ))
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to mark this notification as read.')
    } finally {
      setBusyId(null)
    }
  }

  const markAllRead = async () => {
    setMarkingAll(true)
    setError('')
    setError('')
    try {
      await markAllNotificationsRead()
      setNotifications((current) => current.map((notification) => ({ ...notification, is_read: true })))
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to mark notifications as read.')
    } finally {
      setMarkingAll(false)
    }
  }

  const Layout = user?.role === 'admin' ? AdminLayout : HospitalLayout
  const workspaceName = user?.role === 'admin' ? 'Veterinary network' : 'Clinic workspace'
  const accountLabel = user?.role === 'admin' ? 'your account' : 'your clinic account'

  return (
    <Layout>
      <div className="mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-red-800 via-red-700 to-rose-600 px-6 py-8 text-white shadow-lg sm:px-9">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-red-100">{workspaceName}</p>
            <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Notifications</h1>
            <p className="mt-2 max-w-2xl text-sm text-red-50 sm:text-base">
              Stay up to date on donor activity, emergency coordination, and clinic account updates.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-white/20 bg-white/10 px-4 py-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8">
                <path d="M6 8a6 6 0 1112 0v4l2 3H4l2-3V8Z" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M10 19a2 2 0 004 0" strokeLinecap="round" />
              </svg>
            </span>
            <div>
              <p className="text-2xl font-bold leading-none">{unreadCount}</p>
              <p className="mt-1 text-xs text-red-100">unread</p>
            </div>
          </div>
        </div>
      </div>

      <section className="card">
        <div className="flex flex-col gap-4 border-b border-gray-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Recent activity</h2>
            <p className="mt-1 text-sm text-gray-500">Notifications sent to {accountLabel}.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => loadNotifications(true)}
              disabled={loading}
              className="btn-secondary text-sm"
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
            <button
              type="button"
              onClick={markAllRead}
              disabled={markingAll || unreadCount === 0}
              className="btn-primary text-sm disabled:cursor-not-allowed disabled:opacity-50"
            >
              {markingAll ? 'Updating...' : 'Mark all as read'}
            </button>
          </div>
        </div>

        <div className="flex gap-2 border-b border-gray-100 py-4" role="tablist" aria-label="Notification filters">
          {[
            { id: 'all', label: 'All notifications', count: notifications.length },
            { id: 'unread', label: 'Unread', count: unreadCount },
          ].map((option) => (
            <button
              key={option.id}
              type="button"
              role="tab"
              aria-selected={filter === option.id}
              onClick={() => setFilter(option.id)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                filter === option.id
                  ? 'bg-red-50 text-blood-red'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
              }`}
            >
              {option.label}
              <span className="ml-2 text-xs opacity-70">{option.count}</span>
            </button>
          ))}
        </div>

        {error && (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
            <span>{error}</span>
            {!loading && (
              <button type="button" onClick={() => loadNotifications(true)} className="font-semibold underline">
                Try again
              </button>
            )}
          </div>
        )}

        {loading ? (
          <div className="py-16 text-center text-sm text-gray-500" role="status">Loading notifications...</div>
        ) : visibleNotifications.length === 0 ? (
          <div className="py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-50 text-gray-400">
              <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7" stroke="currentColor" strokeWidth="1.5">
                <path d="M6 8a6 6 0 1112 0v4l2 3H4l2-3V8Z" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M10 19a2 2 0 004 0" strokeLinecap="round" />
              </svg>
            </div>
            <h3 className="mt-4 font-bold text-gray-900">
              {filter === 'unread' ? 'You are all caught up' : 'No notifications yet'}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {filter === 'unread'
                ? 'Unread clinic updates will appear here.'
                : 'Clinic updates and emergency activity will appear here.'}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {visibleNotifications.map((notification) => (
              <li key={notification.notification_id} className="py-5 first:pt-5 last:pb-1">
                <div className="flex items-start gap-4">
                  <span className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                    notification.is_read ? 'bg-gray-100 text-gray-500' : 'bg-red-50 text-blood-red'
                  }`} aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.7">
                      <path d="M6 8a6 6 0 1112 0v4l2 3H4l2-3V8Z" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M10 19a2 2 0 004 0" strokeLinecap="round" />
                    </svg>
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className={`font-semibold ${notification.is_read ? 'text-gray-700' : 'text-gray-900'}`}>
                        {notification.title}
                      </h3>
                      {!notification.is_read && <span className="h-2 w-2 rounded-full bg-blood-red" aria-label="Unread" />}
                    </div>
                    <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-gray-600">{notification.message}</p>
                    <time className="mt-2 block text-xs text-gray-400" dateTime={notification.created_at}>
                      {notificationTime(notification.created_at)}
                    </time>
                  </div>
                  {!notification.is_read && (
                    <button
                      type="button"
                      onClick={() => markRead(notification.notification_id)}
                      disabled={busyId === notification.notification_id}
                      className="shrink-0 rounded-lg px-2 py-1 text-xs font-semibold text-blood-red hover:bg-red-50 disabled:opacity-50"
                    >
                      {busyId === notification.notification_id ? 'Saving...' : 'Mark read'}
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </Layout>
  )
}

export default HospitalNotificationsPage
