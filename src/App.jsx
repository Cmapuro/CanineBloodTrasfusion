import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { NotificationProvider } from './context/NotificationContext'
import ProtectedRoute from './components/common/ProtectedRoute'

// Public Pages
import HomePage from './pages/public/HomePage'
import HospitalListPage from './pages/public/HospitalListPage'
import AboutPage from './pages/public/AboutPage'
import ContactPage from './pages/public/ContactPage'

// Donor Pages
import DonorLoginPage from './pages/donor/DonorLoginPage'
import DonorRegistrationPage from './pages/donor/DonorRegistrationPage'
import DonorDashboard from './pages/donor/DonorDashboard'
import DonationHistoryPage from './pages/donor/DonationHistoryPage'
import NotificationsPage from './pages/donor/NotificationsPage'
import DonorProfilePage from './pages/donor/DonorProfilePage'
import MedicalHealthRecordPage from './pages/donor/MedicalHealthRecordPage'
import EmergencyDonorRequestPage from './pages/donor/EmergencyDonorRequestPage'
import VerificationQrPage from './pages/donor/VerificationQrPage'

// Hospital Pages
import HospitalLoginPage from './pages/hospital/HospitalLoginPage'
import HospitalDashboard from './pages/hospital/HospitalDashboard'
import UpdateBloodAvailabilityPage from './pages/hospital/UpdateBloodAvailabilityPage'
import EmergencyBroadcastPage from './pages/hospital/EmergencyBroadcastPage'
import DonorScheduleVerificationPage from './pages/hospital/DonorScheduleVerificationPage'
import DonorEligibilityPage from './pages/hospital/DonorEligibilityPage'
import EmergencyRequestHistoryPage from './pages/hospital/EmergencyRequestHistoryPage'
import ClinicLocationPage from './pages/hospital/ClinicLocationPage'
import DonorListPage from './pages/hospital/DonorListPage'
import QrScanVerificationPage from './pages/hospital/QrScanVerificationPage'
import TransfusionHistoryPage from './pages/hospital/TransfusionHistoryPage'

// Admin Pages
import AdminLoginPage from './pages/admin/AdminLoginPage'
import AdminDashboard from './pages/admin/AdminDashboard'
import ManageHospitalsPage from './pages/admin/ManageHospitalsPage'
import ManageDonorsPage from './pages/admin/ManageDonorsPage'
import BloodInventoryManagementPage from './pages/admin/BloodInventoryManagementPage'
import EmergencyRequestsMonitoringPage from './pages/admin/EmergencyRequestsMonitoringPage'
import ReportsAnalyticsPage from './pages/admin/ReportsAnalyticsPage'

/**
 * App Component - Main application component that sets up routing and context providers
 * This component wraps the entire application with necessary providers for authentication
 * and notifications management.
 */
function App() {
  return (
    <Router>
      <AuthProvider>
        <NotificationProvider>
          <Routes>
            {/* ===== PUBLIC ROUTES ===== */}
            <Route path="/" element={<HomePage />} />
            <Route path="/hospitals" element={<HospitalListPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />

            {/* ===== DONOR ROUTES ===== */}
            <Route path="/donor/login" element={<DonorLoginPage />} />
            <Route path="/donor/register" element={<DonorRegistrationPage />} />
            
            {/* Protected Donor Routes */}
            <Route
              path="/donor/dashboard"
              element={
                <ProtectedRoute requiredRole="donor">
                  <DonorDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/donor/donation-history"
              element={
                <ProtectedRoute requiredRole="donor">
                  <DonationHistoryPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/donor/medical-health-record"
              element={
                <ProtectedRoute requiredRole="donor">
                  <MedicalHealthRecordPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/donor/notifications"
              element={
                <ProtectedRoute requiredRole="donor">
                  <NotificationsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/donor/emergency-requests"
              element={
                <ProtectedRoute requiredRole="donor">
                  <EmergencyDonorRequestPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/donor/verification-qr"
              element={
                <ProtectedRoute requiredRole="donor">
                  <VerificationQrPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/donor/profile"
              element={
                <ProtectedRoute requiredRole="donor">
                  <DonorProfilePage />
                </ProtectedRoute>
              }
            />

            {/* ===== HOSPITAL ROUTES ===== */}
            <Route path="/hospital/login" element={<HospitalLoginPage />} />
            
            {/* Protected Hospital Routes */}
            <Route
              path="/hospital/dashboard"
              element={
                <ProtectedRoute requiredRole="hospital">
                  <HospitalDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/hospital/update-blood-availability"
              element={
                <ProtectedRoute requiredRole="hospital">
                  <UpdateBloodAvailabilityPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/hospital/emergency-broadcast"
              element={
                <ProtectedRoute requiredRole="hospital">
                  <EmergencyBroadcastPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/hospital/emergency-request-history"
              element={
                <ProtectedRoute requiredRole="hospital">
                  <EmergencyRequestHistoryPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/hospital/clinic-location"
              element={
                <ProtectedRoute requiredRole="hospital">
                  <ClinicLocationPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/hospital/profile"
              element={
                <ProtectedRoute requiredRole="hospital">
                  <ClinicLocationPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/hospital/donor-schedule-verification"
              element={
                <ProtectedRoute requiredRole="hospital">
                  <DonorScheduleVerificationPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/hospital/donor-eligibility"
              element={
                <ProtectedRoute requiredRole="hospital">
                  <DonorEligibilityPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/hospital/donor-list"
              element={
                <ProtectedRoute requiredRole="hospital">
                  <DonorListPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/hospital/qr-scan-verification"
              element={
                <ProtectedRoute requiredRole="hospital">
                  <QrScanVerificationPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/hospital/transfusion-history"
              element={
                <ProtectedRoute requiredRole="hospital">
                  <TransfusionHistoryPage />
                </ProtectedRoute>
              }
            />

            {/* ===== ADMIN ROUTES ===== */}
            <Route path="/admin/login" element={<AdminLoginPage />} />
            
            {/* Protected Admin Routes */}
            <Route
              path="/admin"
              element={<Navigate to="/admin/dashboard" replace />}
            />
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/manage-hospitals"
              element={
                <ProtectedRoute requiredRole="admin">
                  <ManageHospitalsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/manage-donors"
              element={
                <ProtectedRoute requiredRole="admin">
                  <ManageDonorsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/blood-inventory"
              element={
                <ProtectedRoute requiredRole="admin">
                  <BloodInventoryManagementPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/emergency-requests"
              element={
                <ProtectedRoute requiredRole="admin">
                  <EmergencyRequestsMonitoringPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/reports"
              element={
                <ProtectedRoute requiredRole="admin">
                  <ReportsAnalyticsPage />
                </ProtectedRoute>
              }
            />

            {/* 404 Not Found - Fallback Route */}
            <Route
              path="*"
              element={
                <div className="flex items-center justify-center min-h-screen bg-gray-100">
                  <div className="text-center">
                    <h1 className="text-4xl font-bold text-blood-red mb-2">404</h1>
                    <p className="text-xl text-gray-700 mb-4">Page not found</p>
                    <a href="/" className="btn-primary">
                      Go to Home
                    </a>
                  </div>
                </div>
              }
            />
          </Routes>
        </NotificationProvider>
      </AuthProvider>
    </Router>
  )
}

export default App
