import React from 'react'
import { Link } from 'react-router-dom'
import { LogoMark } from './LogoMark'

function FooterIcon({ type }) {
  const common = 'w-4 h-4 stroke-[2.2]'

  if (type === 'email') {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={common} aria-hidden="true">
        <rect x="3.5" y="6" width="17" height="12" rx="2" stroke="currentColor" />
        <path d="M4.5 7L12 12.5L19.5 7" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }

  if (type === 'phone') {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={common} aria-hidden="true">
        <path d="M6.5 4.5H9L10.2 7.6L8.8 9.4C9.6 11 11 12.4 12.6 13.2L14.4 11.8L17.5 13V15.5C17.5 16.3 16.8 17 16 17C10.8 17 7 13.2 7 8C7 7.2 7.7 6.5 8.5 6.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }

  if (type === 'location') {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={common} aria-hidden="true">
        <path d="M12 20C12 20 6.5 15.3 6.5 10.5C6.5 7.5 8.9 5 12 5C15.1 5 17.5 7.5 17.5 10.5C17.5 15.3 12 20 12 20Z" stroke="currentColor" />
        <circle cx="12" cy="10.5" r="1.8" stroke="currentColor" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" className={common} aria-hidden="true">
      <path d="M4 12H20" stroke="currentColor" strokeLinecap="round" />
    </svg>
  )
}

/**
 * Footer Component
 * Application footer with copyright and links
 */
export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gradient-to-r from-blood-dark via-red-700 to-blood-red text-white py-10 mt-16 border-t border-red-300/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">
          {/* Company Info */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <LogoMark size="md" className="border border-white/30" alt="Footer logo" />
              <h3 className="text-lg font-bold tracking-wide">CanineLink</h3>
            </div>
            <p className="text-gray-100/85 text-sm leading-relaxed max-w-sm">
              Coordinating canine blood donors and emergency transfusions across the veterinary network.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4 text-white">Quick Links</h4>
            <ul className="space-y-3 text-sm text-gray-100/85">
              <li>
                <Link to="/about" className="hover:text-white transition underline-offset-4 hover:underline">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-white transition underline-offset-4 hover:underline">
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/" className="hover:text-white transition underline-offset-4 hover:underline">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/" className="hover:text-white transition underline-offset-4 hover:underline">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-semibold mb-4 text-white">Contact</h4>
            <ul className="space-y-3 text-base text-gray-100/95">
              <li className="flex items-start gap-3">
                <span className="mt-0.5 text-white"><FooterIcon type="email" /></span>
                <span className="font-medium">tagum@blooddonation.com</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 text-white"><FooterIcon type="phone" /></span>
                <span className="font-medium">CP: 09750784420</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 text-white"><FooterIcon type="location" /></span>
                <span className="font-medium">Tagum, Davao del Norte</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <hr className="border-white/25" />

        {/* Copyright */}
        <div className="mt-8 text-center text-gray-100/85 text-sm">
          <p>
            &copy; {currentYear} Smart Blood Donation Platform. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
