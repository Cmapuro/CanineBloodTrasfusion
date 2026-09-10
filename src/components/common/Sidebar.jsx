import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { LogoMark } from './LogoMark'

function SidebarIcon({ name, active }) {
  const tone = 'currentColor'
  switch (name) {
    case 'DB':
      return (
        <svg viewBox="0 0 24 24" fill="none" className="sidebar-icon" aria-hidden="true">
          <path d="M4 4h7v7H4zM13 4h7v4h-7zM13 10h7v10h-7zM4 13h7v7H4z" stroke={tone} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'HP':
      return (
        <svg viewBox="0 0 24 24" fill="none" className="sidebar-icon" aria-hidden="true">
          <path d="M5 10h14v10H5z" stroke={tone} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12 3l5 5H7l5-5z" stroke={tone} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'DN':
      return (
        <svg viewBox="0 0 24 24" fill="none" className="sidebar-icon" aria-hidden="true">
          <circle cx="12" cy="8" r="3.2" stroke={tone} strokeWidth="1.5" />
          <path d="M4 20v-1.1a4.5 4.5 0 014.5-4.5h7a4.5 4.5 0 014.5 4.5V20" stroke={tone} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'IV':
      return (
        <svg viewBox="0 0 24 24" fill="none" className="sidebar-icon" aria-hidden="true">
          <rect x="3.5" y="6.5" width="17" height="12.5" rx="3" stroke={tone} strokeWidth="1.5" />
          <path d="M8 6.5V4.5h8V6.5" stroke={tone} strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      )
    case 'EM':
      return (
        <svg viewBox="0 0 24 24" fill="none" className="sidebar-icon" aria-hidden="true">
          <path d="M12 3l8.5 15H3.5L12 3z" stroke={tone} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12 9v4" stroke={tone} strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="12" cy="16.8" r="1.1" fill={tone} />
        </svg>
      )
    case 'RP':
      return (
        <svg viewBox="0 0 24 24" fill="none" className="sidebar-icon" aria-hidden="true">
          <path d="M6 2.5h8.5l3.5 3.5V20a1.8 1.8 0 01-1.8 1.8H6A1.8 1.8 0 014.2 20V4.3A1.8 1.8 0 016 2.5z" stroke={tone} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M8 9h8M8 13h8" stroke={tone} strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      )
    case 'AP':
      return (
        <svg viewBox="0 0 24 24" fill="none" className="sidebar-icon" aria-hidden="true">
          <path d="M8 2v4M16 2v4M4 9h16" stroke={tone} strokeWidth="1.5" strokeLinecap="round" />
          <rect x="3.5" y="5.5" width="17" height="15" rx="3" stroke={tone} strokeWidth="1.5" />
          <path d="M8 13h8" stroke={tone} strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      )
    case 'HS':
      return (
        <svg viewBox="0 0 24 24" fill="none" className="sidebar-icon" aria-hidden="true">
          <path d="M6 4h12M6 20h12M7 4v16M17 4v16" stroke={tone} strokeWidth="1.5" strokeLinecap="round" />
          <path d="M9 8h6M9 12h6M9 16h4" stroke={tone} strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      )
    case 'NT':
      return (
        <svg viewBox="0 0 24 24" fill="none" className="sidebar-icon" aria-hidden="true">
          <path d="M6 8a6 6 0 1112 0v4l2 3H4l2-3V8z" stroke={tone} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M10 19a2 2 0 004 0" stroke={tone} strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      )
    case 'PF':
      return (
        <svg viewBox="0 0 24 24" fill="none" className="sidebar-icon" aria-hidden="true">
          <circle cx="12" cy="8" r="3" stroke={tone} strokeWidth="1.5" />
          <path d="M5 20a7 7 0 0114 0" stroke={tone} strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      )
    case 'BI':
      return (
        <svg viewBox="0 0 24 24" fill="none" className="sidebar-icon" aria-hidden="true">
          <path d="M12 3s5 5.2 5 9a5 5 0 11-10 0c0-3.8 5-9 5-9z" stroke={tone} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'ER':
      return (
        <svg viewBox="0 0 24 24" fill="none" className="sidebar-icon" aria-hidden="true">
          <path d="M12 4v7" stroke={tone} strokeWidth="1.5" strokeLinecap="round" />
          <path d="M12 18h.01" stroke={tone} strokeWidth="2.5" strokeLinecap="round" />
          <path d="M4 20h16L12 3 4 20z" stroke={tone} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'LO':
      return (
        <svg viewBox="0 0 24 24" fill="none" className="sidebar-icon" aria-hidden="true">
          <path d="M10 4H5.5A1.5 1.5 0 004 5.5v13A1.5 1.5 0 005.5 20H10" stroke={tone} strokeWidth="1.6" strokeLinecap="round" />
          <path d="M13 8l4 4-4 4M8 12h9" stroke={tone} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'VD':
      return (
        <svg viewBox="0 0 24 24" fill="none" className="sidebar-icon" aria-hidden="true">
          <path d="M5 13l4 4L19 7" stroke={tone} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M4 4h16v16H4z" stroke={tone} strokeWidth="1.2" strokeOpacity="0.35" />
        </svg>
      )
    default:
      return (
        <svg viewBox="0 0 24 24" fill="none" className="sidebar-icon" aria-hidden="true">
          <circle cx="12" cy="12" r="10" stroke={tone} strokeWidth="1.2" />
        </svg>
      )
  }
}

/**
 * Sidebar Component
 * Side navigation panel for authenticated users
 * Features: role-based navigation, collapsible menu, active link highlighting
 */
export function Sidebar() {
  // Track sidebar open/close state
  const [isOpen, setIsOpen] = useState(true)

  // Collapse sidebar by default on small screens
  useEffect(() => {
    try {
      if (window.innerWidth < 768) {
        setIsOpen(false)
      }
    } catch (e) {
      // ignore (SSR safety)
    }
  }, [])

  useEffect(() => {
    const handleToggle = () => {
      setIsOpen((current) => !current)
    }

    const handleClose = () => {
      if (window.innerWidth < 768) {
        setIsOpen(false)
      }
    }

    window.addEventListener('admin-sidebar-toggle', handleToggle)
    window.addEventListener('admin-sidebar-close', handleClose)

    const emitWidth = (openState) => {
      const isDesktop = window.innerWidth >= 768
      const width = isDesktop ? (openState ? 288 : 80) : 0
      window.dispatchEvent(
        new CustomEvent('admin-sidebar-width', {
          detail: { width, isOpen: openState, isDesktop },
        })
      )
    }

    emitWidth(isOpen)

    const handleResize = () => emitWidth(isOpen)
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('admin-sidebar-toggle', handleToggle)
      window.removeEventListener('admin-sidebar-close', handleClose)
      window.removeEventListener('resize', handleResize)
    }
  }, [isOpen])

  useEffect(() => {
    const isDesktop = window.innerWidth >= 768
    const width = isDesktop ? (isOpen ? 288 : 80) : 0
    window.dispatchEvent(
      new CustomEvent('admin-sidebar-width', {
        detail: { width, isOpen, isDesktop },
      })
    )
  }, [isOpen])

  // Get authentication context
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  // Get current location
  const location = useLocation()

  // Define menu items based on user role
  const getMenuItems = () => {
    const baseItem = {
      icon: 'DB',
      label: 'Dashboard',
      path: `/${user?.role}/dashboard`,
    }

    const menusByRole = {
      donor: [
        baseItem,
        {
          icon: 'AP',
          label: 'Donation Schedule',
          path: '/donor/schedule-appointment',
        },
        {
          icon: 'HS',
          label: 'Transfusion History',
          path: '/donor/donation-history',
        },
        {
          icon: 'HS',
          label: 'Medical Health Record',
          path: '/donor/medical-health-record',
        },
        {
          icon: 'NT',
          label: 'Notifications',
          path: '/donor/notifications',
        },
        {
          icon: 'PF',
          label: 'Profile',
          path: '/donor/profile',
        },
      ],
      hospital: [
        baseItem,
        {
          icon: 'BI',
          label: 'Donor Availability',
          path: '/hospital/update-blood-availability',
        },
        {
          icon: 'ER',
          label: 'Emergency Requests',
          path: '/hospital/emergency-broadcast',
        },
        {
          icon: 'HS',
          label: 'Request History',
          path: '/hospital/emergency-request-history',
        },
        {
          icon: 'VD',
          label: 'QR Verification',
          path: '/hospital/donor-schedule-verification',
        },
      ],
      admin: [
        baseItem,
        {
          icon: 'HP',
          label: 'Veterinary Clinics',
          path: '/admin/manage-hospitals',
        },
        {
          icon: 'DN',
          label: 'Canine Donors',
          path: '/admin/manage-donors',
        },
        {
          icon: 'IV',
          label: 'DEA Inventory',
          path: '/admin/blood-inventory',
        },
        {
          icon: 'EM',
          label: 'Emergency Requests',
          path: '/admin/emergency-requests',
        },
        {
          icon: 'RP',
          label: 'Reports',
          path: '/admin/reports',
        },
      ],
    }

    return menusByRole[user?.role] || []
  }

  const menuItems = getMenuItems()

  // Check if link is active
  const isActive = (path) => location.pathname === path

  return (
    <>
      {/* Sidebar */}
      <aside
        className={`sidebar-shell ${isOpen ? 'sidebar-open' : 'sidebar-collapsed'} ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        <div className={`sidebar-top ${isOpen ? '' : 'justify-center'}`}>
          <div className={`hidden md:flex items-center gap-3 ${isOpen ? '' : 'justify-center'}`}>
            <div className="sidebar-brand-mark">
              <LogoMark size="sm" rounded="rounded-xl" alt="CanineLink logo" />
            </div>
            {isOpen && (
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-white/60">CanineLink</p>
                <p className="text-sm font-semibold text-white">Veterinary Network</p>
              </div>
            )}
          </div>

          {/* Toggle Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="sidebar-toggle"
            title={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" aria-hidden="true">
              <path d={isOpen ? 'M15 18l-6-6 6-6' : 'M9 18l6-6-6-6'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* Menu Items */}
        <nav className="sidebar-menu">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`sidebar-link ${isActive(item.path) ? 'sidebar-link-active' : 'text-white/80 hover:bg-white/10 hover:text-white'}`}
              title={isOpen ? '' : item.label}
              onClick={() => {
                if (window.innerWidth < 768) {
                  setIsOpen(false)
                }
              }}
            >
              {isActive(item.path) && <span className="sidebar-bar" />}
              <div className={`sidebar-icon-wrap ${isActive(item.path) ? 'sidebar-icon-wrap-active' : ''}`}>
                <SidebarIcon name={item.icon} active={isActive(item.path)} />
              </div>
              {isOpen && <span className="font-medium">{item.label}</span>}
            </Link>
          ))}

          <button
            type="button"
            onClick={async () => {
              await logout()
              navigate('/donor/login')
            }}
            className="sidebar-link sidebar-logout w-full text-left text-white/80 hover:bg-white/10 hover:text-white"
            title={isOpen ? '' : 'Logout'}
          >
            <div className="sidebar-icon-wrap">
              <SidebarIcon name="LO" active={false} />
            </div>
            {isOpen && <span className="font-medium">Logout</span>}
          </button>
        </nav>
      </aside>

      {/* Overlay for small screens when sidebar is open */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden
        />
      )}

      {/* Floating mobile toggle when sidebar is collapsed */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed left-4 top-4 md:hidden z-50 w-12 h-12 rounded-2xl bg-blood-red text-white shadow-lg flex items-center justify-center"
          aria-label="Open admin sidebar"
        >
          <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" aria-hidden="true">
            <path d="M5 7h14M5 12h14M5 17h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
      )}
    </>
  )
}

export default Sidebar
