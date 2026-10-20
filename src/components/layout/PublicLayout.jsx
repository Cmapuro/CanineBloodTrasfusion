import React from 'react'
import { Navbar } from '../common/Navbar'
import { Footer } from '../common/Footer'
import { NotificationAlert } from '../common/NotificationAlert'
import ChatbotWidget from '../common/ChatbotWidget'

/**
 * PublicLayout Component
 * Layout for public pages (no authentication required)
 * Includes: Navbar, Footer, NotificationAlert
 * No Sidebar since these are public pages
 */
export function PublicLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <Navbar />

      {/* Notification System */}
      <NotificationAlert />

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <Footer />
      <ChatbotWidget />
    </div>
  )
}

export default PublicLayout
