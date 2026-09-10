import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { Modal } from './Modal'

export function FloatingNotification() {
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [logoutOpen, setLogoutOpen] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  // Simulate notification count - in real app, this would come from API
  useEffect(() => {
    const notifications = JSON.parse(localStorage.getItem('notifications') || '[]')
    const unread = notifications.filter(n => !n.read).length
    setUnreadCount(unread)
  }, [])

  const mockNotifications = [
    { id: 1, title: 'New Emergency Request', message: 'Blood type DEA 1.1+ needed urgently', time: '2 min ago', read: false },
    { id: 2, title: 'Donor Available', message: 'Buddy is available for donation', time: '15 min ago', read: false },
    { id: 3, title: 'QR Code Scanned', message: 'Transfusion record updated', time: '1 hour ago', read: true },
  ]

  const handleNotificationClick = (notification) => {
    setIsOpen(false)
    // Navigate to appropriate page based on notification type
    if (notification.title.includes('Emergency')) {
      navigate('/hospital/emergency-broadcast')
    } else if (notification.title.includes('Donor')) {
      navigate('/hospital/donor-list')
    } else if (notification.title.includes('QR')) {
      navigate('/hospital/transfusion-history')
    }
  }

  const handleViewAll = () => {
    setIsOpen(false)
    navigate('/hospital/notifications')
  }

  const handleLogout = async () => {
    await logout()
    setLogoutOpen(false)
    navigate(user?.role === 'hospital' ? '/hospital/login' : user?.role === 'admin' ? '/admin/login' : '/donor/login')
  }

  return (
    <>
      <div className="fixed top-4 right-4 z-50 flex items-center gap-3">
        {/* Notification Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-blood-red text-white shadow-lg hover:bg-red-700 transition-colors"
          aria-label="Notifications"
        >
          <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth="2">
            <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" strokeLinecap="round" strokeLinejoin="round" />
          </svg>

          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-yellow-400 text-xs font-bold text-gray-900">
              {unreadCount}
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
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-white shadow-2xl border border-gray-100 z-50 overflow-hidden">
            <div className="border-b border-gray-100 px-4 py-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-900">Notifications</h3>
                <span className="text-xs font-semibold text-blood-red">{unreadCount} unread</span>
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {mockNotifications.length === 0 ? (
                <div className="px-4 py-8 text-center text-gray-500">
                  <svg viewBox="0 0 24 24" fill="none" className="w-12 h-12 mx-auto mb-2 text-gray-300" stroke="currentColor" strokeWidth="1.5">
                    <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <p className="text-sm">No notifications yet</p>
                </div>
              ) : (
                mockNotifications.map((notification) => (
                  <button
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-1 h-2 w-2 rounded-full ${notification.read ? 'bg-gray-300' : 'bg-blood-red'}`} />
                      <div className="flex-1">
                        <p className={`text-sm font-semibold ${notification.read ? 'text-gray-600' : 'text-gray-900'}`}>
                          {notification.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">{notification.message}</p>
                        <p className="text-xs text-gray-400 mt-1">{notification.time}</p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>

            <div className="border-t border-gray-100 px-4 py-3">
              <button
                onClick={handleViewAll}
                className="w-full text-center text-sm font-semibold text-blood-red hover:text-red-700"
              >
                View All Notifications
              </button>
            </div>
          </div>
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
