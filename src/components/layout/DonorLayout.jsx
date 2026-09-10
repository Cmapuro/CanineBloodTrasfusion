/**
 * DonorLayout Component
 * Layout for donor pages (requires donor authentication)
 * Includes: Navbar, Sidebar, Footer, NotificationAlert
 */
import React, { useEffect, useState } from 'react'
import { Sidebar } from '../common/Sidebar'
import { Footer } from '../common/Footer'
import { NotificationAlert } from '../common/NotificationAlert'

/**
 * DonorLayout Component
 * Layout for donor pages (requires donor authentication)
 * Includes: Navbar, Sidebar, Footer, NotificationAlert
 */
export function DonorLayout({ children }) {
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

      {/* Main Content with Sidebar */}
      <div className="flex flex-1">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <main
          className="flex-1 transition-all"
          style={{ marginLeft: sidebarWidth }}
        >
          <div className="p-6 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Footer aligned with sidebar */}
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

export default DonorLayout
