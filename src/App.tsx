import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { SignalRProvider } from "@/contexts/SignalRContext";
import { ChatStateProvider } from "@/contexts/ChatStateContext";
// Import Pages
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import ConfirmEmailPage from "@/pages/ConfirmEmailPage";
import HomePage from "@/pages/HomePage";
import PrivacyPolicyPage from "@/pages/PrivacyPolicyPage";
import TermsPage from "@/pages/TermsPage";
import NotFoundPage from "@/pages/NotFoundPage";
import ProtectedRoute from "@/components/Protected-route";
import ScrollToTop from "@/components/ScrollToTop";
import { AuthProvider } from "@/services/api/authContext";

// Import the BookingPage
import BookingPage from "@/pages/BookingPage";
import BookingConfirmationPage from "@/pages/BookingConfirmationPage";
import ServicesPage from "@/pages/ServicesPage";
import ServiceDetailsPage from "@/pages/ServiceDetailsPage";
import BookingsHistoryPage from "@/pages/BookingsHistoryPage";
import EmployeeDashboard from "@/pages/EmployeeDashboard";
import AdminDashboard from "@/pages/AdminDashboard";
import ChatPage from "@/pages/ChatPage";
import ProfilePage from "@/pages/ProfilePage";
import CustomerDashboard from "@/pages/CustomerDashboard";

function App() {
  return (
    <Router>
      <AuthProvider>
        <SignalRProvider>
        <ChatStateProvider>
        <ThemeProvider>
          <Toaster position="top-right" richColors />
          <ScrollToTop />
          <Routes>
            {/* Publika routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/confirm-email" element={<ConfirmEmailPage />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/service/:id" element={<ServiceDetailsPage />} />
            <Route path="/privacy" element={<PrivacyPolicyPage />} />
            <Route path="/terms" element={<TermsPage />} />

            {/* Skyddade routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <CustomerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/bookings"
              element={
                <ProtectedRoute>
                  <BookingPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/booking-confirmation/:bookingId?"
              element={
                <ProtectedRoute>
                  <BookingConfirmationPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/bookings/history"
              element={
                <ProtectedRoute>
                  <BookingsHistoryPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/employee"
              element={
                <ProtectedRoute>
                  <EmployeeDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/chat/:bookingId"
              element={
                <ProtectedRoute>
                  <ChatPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            {/* Redirect /home till /dashboard för bakåtkompatibilitet */}
            <Route path="/home" element={<Navigate to="/dashboard" replace />} />

            {/* Okända adresser */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </ThemeProvider>
        </ChatStateProvider>
        </SignalRProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
