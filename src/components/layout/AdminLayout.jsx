import React, { useEffect, useState } from 'react'
import { Sidebar } from '../common/Sidebar'
import { Footer } from '../common/Footer'
import { NotificationAlert } from '../common/NotificationAlert'
import { FloatingNotification } from '../common/FloatingNotification'

/**
 * AdminLayout Component
 * Layout for admin pages (requires admin authentication)
 * Includes: Sidebar, Footer, NotificationAlert, FloatingNotification
 */
export function AdminLayout({ children }) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    try {
      return window.innerWidth < 768 ? 0 : 288
    } catch (e) {
      return 288
    }
  })

  useEffect(() => {
    const handleSidebarWidth = (event) => {
      const nextWidth = event?.detail?.width
      if (typeof nextWidth === 'number') {
        setSidebarWidth(nextWidth)
      }
    }

    window.addEventListener('admin-sidebar-width', handleSidebarWidth)

    return () => {
      window.removeEventListener('admin-sidebar-width', handleSidebarWidth)
    }
  }, [])

  return (
    <div className="min-h-screen flex flex-col">
      {/* Notification System */}
      <NotificationAlert />

      {/* Floating Notification Icon */}
      <FloatingNotification />

      {/* Main Content with Sidebar */}
      <div className="flex flex-1">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <main
          className="flex-1 transition-all"
          style={{ marginLeft: sidebarWidth }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </div>
        </main>
      </div>

      {/* Footer */}
      <div
        style={{
          marginLeft: sidebarWidth,
          width: sidebarWidth ? `calc(100% - ${sidebarWidth}px)` : '100%',
        }}
      >
        <Footer />
      </div>
    </div>
  )
}

export default AdminLayout
