import React from 'react'
import { Link } from 'react-router-dom'
import PublicLayout from '../../components/layout/PublicLayout'
import { LogoMark } from '../../components/common/LogoMark'
import donors from '../../data/donors.json'
import hospitals from '../../data/hospitals.json'

function FeatureIcon({ type }) {
  const common = 'w-6 h-6 stroke-[2.2]'

  if (type === 'search') {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={common} aria-hidden="true">
        <circle cx="11" cy="11" r="6" stroke="currentColor" />
        <path d="M20 20L16.2 16.2" stroke="currentColor" strokeLinecap="round" />
      </svg>
    )
  }

  if (type === 'donation') {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={common} aria-hidden="true">
        <path d="M12 4C12 4 7 9 7 12.5C7 15.5 9.2 18 12 18C14.8 18 17 15.5 17 12.5C17 9 12 4 12 4Z" stroke="currentColor" />
        <path d="M12 11V15" stroke="currentColor" strokeLinecap="round" />
      </svg>
    )
  }

  if (type === 'emergency') {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={common} aria-hidden="true">
        <path d="M12 3L20 17H4L12 3Z" stroke="currentColor" />
        <path d="M12 9V12" stroke="currentColor" strokeLinecap="round" />
        <circle cx="12" cy="14.8" r="0.9" fill="currentColor" />
      </svg>
    )
  }

  if (type === 'analytics') {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={common} aria-hidden="true">
        <path d="M5 19V10" stroke="currentColor" strokeLinecap="round" />
        <path d="M12 19V6" stroke="currentColor" strokeLinecap="round" />
        <path d="M19 19V13" stroke="currentColor" strokeLinecap="round" />
        <path d="M3 19H21" stroke="currentColor" strokeLinecap="round" />
      </svg>
    )
  }

  if (type === 'network') {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={common} aria-hidden="true">
        <circle cx="6" cy="12" r="2.2" stroke="currentColor" />
        <circle cx="18" cy="7" r="2.2" stroke="currentColor" />
        <circle cx="18" cy="17" r="2.2" stroke="currentColor" />
        <path d="M8.2 11.2L15.8 7.8" stroke="currentColor" />
        <path d="M8.2 12.8L15.8 16.2" stroke="currentColor" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" className={common} aria-hidden="true">
      <path d="M6 17L8 15C8.6 14.4 9.4 14.4 10 15L12 17L14 15C14.6 14.4 15.4 14.4 16 15L18 17" stroke="currentColor" strokeLinecap="round" />
      <path d="M12 4V10" stroke="currentColor" strokeLinecap="round" />
      <circle cx="12" cy="13.5" r="1.6" stroke="currentColor" />
    </svg>
  )
}

const features = [
  {
    title: 'Real-Time Search',
    description: 'Find compatible canine blood donors across authorized veterinary clinics instantly.',
    icon: 'search',
  },
  {
    title: 'Easy Donation',
    description: 'Schedule appointments, track donation history, and manage your donor profile effortlessly.',
    icon: 'donation',
  },
  {
    title: 'Emergency Requests',
    description: 'Instantly broadcast emergency blood requests to available donors in your network.',
    icon: 'emergency',
  },
  {
    title: 'Analytics',
    description: 'Track blood inventory, donation trends, and generate comprehensive reports.',
    icon: 'analytics',
  },
  {
    title: 'Veterinary Network',
    description: 'Connect with trusted veterinary clinics and canine donors across the province.',
    icon: 'network',
  },
  {
    title: 'Notifications',
    description: 'Get real-time notifications about appointments, eligibility, and blood requests.',
    icon: 'notification',
  },
]

/**
 * HomePage Component
 * Landing page for the application
 * Features: hero section, features, call-to-action buttons
 */
export function HomePage() {
  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="home-hero text-white py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-12 lg:gap-20 items-center">
            {/* Left Content */}
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-red-50 mb-7">
                <span className="w-2 h-2 rounded-full bg-rose-300 animate-pulse" />
                A connected veterinary donor network
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.05] tracking-tight mb-6 max-w-3xl">
                The right canine donor, when every minute matters.
              </h1>
              <p className="text-lg sm:text-xl mb-9 text-red-50/85 max-w-2xl leading-relaxed">
                CanineLink helps veterinary clinics coordinate compatible donors, emergency requests, and verified donation records in one trusted network.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link to="/donor/register" className="inline-flex items-center justify-center bg-white text-blood-red hover:bg-red-50 font-semibold py-3.5 px-7 rounded-xl transition shadow-lg shadow-black/10">
                  Register as Donor
                </Link>
                <Link to="/hospitals" className="inline-flex items-center justify-center border border-white/35 bg-white/10 text-white hover:bg-white hover:text-blood-red font-semibold py-3.5 px-7 rounded-xl transition">
                  View veterinary clinics
                </Link>
              </div>
              <div className="mt-9 flex flex-wrap gap-x-7 gap-y-3 text-sm text-red-50/75">
                <span>Verified veterinary partners</span>
                <span>Live donor coordination</span>
                <span>Secure records</span>
              </div>
            </div>

            {/* Right status panel */}
            <div className="home-hero-panel">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-red-100/70">CanineLink network</p>
                  <p className="text-lg font-bold text-white mt-1">Donor coordination, simplified</p>
                </div>
                <span className="inline-flex items-center gap-2 rounded-full bg-emerald-400/15 px-3 py-1.5 text-xs font-semibold text-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-300" /> Live
                </span>
              </div>
              <div className="flex items-center gap-5 mb-8">
              <LogoMark
                size="xl"
                rounded="rounded-3xl"
                className="border-2 border-white/20 bg-white p-4 w-28 h-28 shadow-xl"
                alt="Hero logo"
              />
                <div>
                  <p className="text-2xl font-extrabold text-white">Ready to respond</p>
                  <p className="text-sm text-red-50/70 mt-1">From first alert to verified arrival.</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-white/10 border border-white/10 p-4">
                  <p className="text-2xl font-bold text-white">24/7</p>
                  <p className="text-xs text-red-50/65 mt-1">Network readiness</p>
                </div>
                <div className="rounded-2xl bg-white/10 border border-white/10 p-4">
                  <p className="text-2xl font-bold text-white">1:1</p>
                  <p className="text-xs text-red-50/65 mt-1">Clinic-to-donor link</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 lg:py-24 bg-[#fffafa]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-12">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-blood-red mb-3">Built for the moment that matters</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">One clear workflow for donors and clinics.</h2>
            <p className="text-gray-600 leading-relaxed">Everything teams need to find, verify, and coordinate canine blood donations without losing time between systems.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feature) => (
              <div key={feature.title} className="home-feature-tile group">
                <div className="mb-6 w-12 h-12 rounded-xl bg-red-50 text-blood-red flex items-center justify-center border border-red-100 group-hover:bg-blood-red group-hover:text-white transition-colors">
                  <FeatureIcon type={feature.icon} />
                </div>
                <h3 className="text-lg font-bold mb-2 text-gray-900">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-20 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-blood-red mb-3">Start with one good decision</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-5 text-gray-900">Make every donor connection count.</h2>
          <p className="text-lg text-gray-600 mb-10 max-w-2xl mx-auto">Join the veterinary network that keeps donor information clear and emergency coordination moving.</p>

          <div className="flex flex-col sm:flex-row justify-center gap-6">
            <Link to="/donor/register" className="btn-primary px-8 py-3 text-lg">
              Get Started as Donor
            </Link>
            <Link to="/hospitals" className="btn-secondary px-8 py-3 text-lg">
              View Partner Hospitals
            </Link>
            <Link to="/contact" className="btn-secondary px-8 py-3 text-lg">
              Contact Us
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-red-50 border-y border-red-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            {(() => {
              const totalDonors = Array.isArray(donors) ? donors.length : 0
              const totalHospitals = Array.isArray(hospitals) ? hospitals.length : 0
              const successfulDonations = Array.isArray(donors)
                ? donors.reduce((s, d) => s + (d.totalDonations || 0), 0)
                : 0
              const livesSaved = Math.round(successfulDonations * 1) // 1:1 mapping (adjust as needed)

              return (
                <>
                  <div>
                    <div className="text-5xl font-bold text-blood-red mb-2">{totalDonors.toLocaleString()}+</div>
                    <p className="text-gray-700 font-medium">Active Donors</p>
                  </div>
                  <div>
                    <div className="text-5xl font-bold text-blood-red mb-2">{totalHospitals.toLocaleString()}+</div>
                    <p className="text-gray-700 font-medium">Partner Hospitals</p>
                  </div>
                  <div>
                    <div className="text-5xl font-bold text-blood-red mb-2">{successfulDonations.toLocaleString()}+</div>
                    <p className="text-gray-700 font-medium">Successful Donations</p>
                  </div>
                  <div>
                    <div className="text-5xl font-bold text-blood-red mb-2">{livesSaved.toLocaleString()}+</div>
                    <p className="text-gray-700 font-medium">Lives Saved</p>
                  </div>
                </>
              )
            })()}
          </div>
        </div>
      </section>
    </PublicLayout>
  )
}

export default HomePage
