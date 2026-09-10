import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { LogoMark } from './LogoMark';
import { Modal } from './Modal';
import { createPortal } from 'react-dom';

/**
 * Navbar Component
 * Top navigation bar for the application
 * Displays different navigation options based on user role
 * Features: logo, navigation links, user menu, logout functionality
 */
export function Navbar() {
  // Get authentication context
  const { user, logout, isAuthenticated } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);

  // Get current location to highlight active link
  const location = useLocation();

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Handle logout
  const handleLogout = () => {
    logout();
    setLogoutOpen(false);
  };

  // Public navigation links
  const publicLinks = [
    { path: '/', label: 'Home' },
    { path: '/search-blood', label: 'Find a Canine Donor' },
    { path: '/hospitals', label: 'Veterinary Clinics' },
    { path: '/emergency-request', label: 'Emergency Request' },
    { path: '/about', label: 'About' },
  ];

  // Donor navigation links
  const donorLinks = [
    { path: '/donor/dashboard', label: 'Dashboard' },
    { path: '/donor/schedule-appointment', label: 'Donation Schedule' },
    { path: '/donor/medical-health-record', label: 'Medical Health Record' },
    { path: '/donor/donation-history', label: 'Transfusion History' },
    { path: '/donor/notifications', label: 'Notifications' },
  ];

  // Hospital navigation links
  const hospitalLinks = [
    { path: '/hospital/dashboard', label: 'Dashboard' },
    { path: '/hospital/update-blood-availability', label: 'Donor Availability' },
    { path: '/hospital/emergency-broadcast', label: 'Emergency Requests' },
  ];

  // Admin navigation links
  const adminLinks = [
    { path: '/admin/dashboard', label: 'Dashboard' },
    { path: '/admin/manage-hospitals', label: 'Veterinary Clinics' },
    { path: '/admin/manage-donors', label: 'Canine Donors' },
    { path: '/admin/blood-inventory', label: 'DEA Inventory' },
  ];

  // Determine which links to show based on user role
  const getNavLinks = () => {
    if (!isAuthenticated()) return publicLinks;

    if (user?.role === 'donor') return donorLinks;
    if (user?.role === 'hospital') return hospitalLinks;
    if (user?.role === 'admin') return adminLinks;

    return publicLinks;
  };

  const navLinks = getNavLinks();

  // Check if link is active
  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-white/95 shadow-soft sticky top-0 z-50 border-b border-red-100 transition-all duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo and Brand */}
          <Link to="/" className="flex items-center gap-3">
            <LogoMark size="lg" className="shadow-sm" alt="Logo" />
            <span className="hidden sm:inline text-sm md:text-lg font-bold text-blood-red max-w-[560px] truncate">
              CanineLink
            </span>
          </Link>

          {/* Navigation Links */}
          {user?.role !== 'admin' && (
            <>
              <div className="hidden md:flex items-center gap-3 bg-red-50/70 rounded-xl px-3 py-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`text-base font-medium px-4 py-2.5 rounded-lg transition-all ${
                      isActive(link.path)
                        ? 'bg-white text-blood-red shadow-sm'
                        : 'text-gray-600 hover:text-blood-red hover:bg-white/80'
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>

              {/* Mobile menu toggle */}
              <button
                className="md:hidden text-gray-700 p-2 rounded-lg"
                aria-label="Open menu"
                onClick={() => setMobileOpen((s) => !s)}
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d={
                      mobileOpen
                        ? 'M6 18L18 6M6 6l12 12'
                        : 'M4 6h16M4 12h16M4 18h16'
                    }
                  />
                </svg>
              </button>
            </>
          )}

          {/* User Menu */}
          <div className="flex items-center gap-4 flex-nowrap">
            {isAuthenticated() ? (
              <>
                <span className="hidden sm:inline text-sm text-gray-600 whitespace-nowrap">
                  {user?.email}
                </span>
                <button
                  onClick={() => setLogoutOpen(true)}
                  className="btn-primary text-base px-5 py-2.5 whitespace-nowrap"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/donor/login"
                  className="btn-secondary text-base px-4 py-2.5 whitespace-nowrap"
                >
                  Donor Login
                </Link>
                <Link
                  to="/hospital/login"
                  className="btn-primary text-base px-4 py-2.5 whitespace-nowrap"
                >
                  Clinic Login
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-red-100">
          <div className="px-4 py-3 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileOpen(false)}
                className={`block px-3 py-2 rounded-md ${isActive(link.path) ? 'bg-red-50 text-blood-red' : 'text-gray-700 hover:bg-red-50'}`}
              >
                {link.label}
              </Link>
            ))}

            <div className="pt-2 border-t border-red-100 flex gap-2">
              {isAuthenticated() ? (
                <button
                  onClick={() => setLogoutOpen(true)}
                  className="btn-primary w-full"
                >
                  Logout
                </button>
              ) : (
                <>
                  <Link
                    to="/donor/login"
                    onClick={() => setMobileOpen(false)}
                    className="btn-secondary w-full text-center"
                  >
                    Donor Login
                  </Link>
                  <Link
                    to="/hospital/login"
                    onClick={() => setMobileOpen(false)}
                    className="btn-primary w-full text-center"
                  >
                    Clinic Login
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {logoutOpen &&
        createPortal(
          <Modal
            isOpen={logoutOpen}
            title="Confirm logout"
            onClose={() => setLogoutOpen(false)}
            onConfirm={handleLogout}
            confirmText="Yes, logout"
            cancelText="Stay signed in"
            isDangerous
          >
            <p className="text-gray-600 leading-relaxed">
              Are you sure you want to log out now? You will need to sign in
              again to access your dashboard.
            </p>
          </Modal>,
          document.body,
        )}
    </nav>
  );
}

export default Navbar;
