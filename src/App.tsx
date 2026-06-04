import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation, Navigate } from "react-router-dom";
// Updated routes for separate premium Login & Signup screens
import { useEffect, useState } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { apiService } from "@/lib/api";
import { AuthProvider } from "./hooks/AuthProvider";
import Index from "./pages/Index.tsx";
import Maintenance from "./pages/Maintenance.tsx";
import Services from "./pages/Services.tsx";
import Book from "./pages/Book.tsx";
import Contact from "./pages/Contact.tsx";
import Dvla from "./pages/Dvla.tsx";
import About from "./pages/About.tsx";
import Reviews from "./pages/Reviews.tsx";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import ForgotPassword from "./pages/ForgotPassword.tsx";
import ResetPassword from "./pages/ResetPassword.tsx";
import VerifyOtp from "./pages/VerifyOtp.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import Profile from "./pages/Profile.tsx";
import AdminLogin from "./pages/admin/AdminLogin.tsx";
import AdminOverview from "./pages/admin/AdminOverview.tsx";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminAppointments from "./pages/admin/AdminAppointments.tsx";
import AdminReviews from "./pages/admin/AdminReviews.tsx";
import AdminUsers from "./pages/admin/AdminUsers.tsx";
import AdminNotifications from "./pages/admin/AdminNotifications.tsx";
import AdminChatbot from "./pages/admin/AdminChatbot.tsx";
import AdminSettings from "./pages/admin/AdminSettings.tsx";
import AdminServices from "./pages/admin/AdminServices.tsx";
import AdminCMS from "./pages/admin/AdminCMS.tsx";
import AdminScreenings from "./pages/admin/AdminScreenings.tsx";
import AdminSMS from "./pages/admin/AdminSMS.tsx";
import RegisterPatient from "./pages/RegisterPatient.tsx";
import MedicalHistory from "./pages/MedicalHistory.tsx";
import Notifications from "./pages/Notifications.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const MaintenanceManager = ({ children }: { children: React.ReactNode }) => {
  const [maintenance, setMaintenance] = useState<boolean | null>(null);
  const location = useLocation();

  useEffect(() => {
    // Safety timeout: render the app after 5s even if the settings request hangs
    const timeout = setTimeout(() => {
      setMaintenance(prev => {
        if (prev === null) {
          console.warn("Settings check timed out — rendering app normally");
          return false;
        }
        return prev;
      });
    }, 5000);

    const check = async () => {
      try {
        const data = await apiService.settings.get();
        if (data) {
          const isMaint = !!data.maintenanceMode;
          console.log("Maintenance mode check:", isMaint);
          setMaintenance(isMaint);
        } else {
          setMaintenance(false);
        }
      } catch (e) {
        console.error("Failed to check maintenance mode:", e);
        setMaintenance(false);
      }
    };
    check();

    return () => clearTimeout(timeout);
  }, []);

  if (maintenance === null) return null;
  
  const isAdminPath = location.pathname.startsWith("/admin");
  const isAuthPath = ["/login", "/signup", "/forgot-password", "/reset-password"].includes(location.pathname);
  
  // Using a stable fragment container prevents DOM nodes from being "orphaned" 
  // during the abrupt switch to Maintenance mode, fixing the removeChild error.
  return (
    <>
      {maintenance && !isAdminPath && !isAuthPath ? <Maintenance /> : children}
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <MaintenanceManager>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/services" element={<Services />} />
              <Route path="/book" element={<Book />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/dvla" element={<Dvla />} />
              <Route path="/about" element={<About />} />
              <Route path="/reviews" element={<Reviews />} />

              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/verify-otp" element={<VerifyOtp />} />

              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/register-patient" element={<ProtectedRoute><RegisterPatient /></ProtectedRoute>} />
              <Route path="/medical-history" element={<ProtectedRoute><MedicalHistory /></ProtectedRoute>} />
              <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />

              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminOverview /></ProtectedRoute>} />
              <Route path="/admin/analytics" element={<ProtectedRoute requireAdmin><AdminAnalytics /></ProtectedRoute>} />
              <Route path="/admin/appointments" element={<ProtectedRoute requireAdmin><AdminAppointments /></ProtectedRoute>} />
              <Route path="/admin/reviews" element={<ProtectedRoute requireAdmin><AdminReviews /></ProtectedRoute>} />
              <Route path="/admin/users" element={<ProtectedRoute requireAdmin><AdminUsers /></ProtectedRoute>} />
              <Route path="/admin/notifications" element={<ProtectedRoute requireAdmin><AdminNotifications /></ProtectedRoute>} />
              <Route path="/admin/chatbot" element={<ProtectedRoute requireAdmin><AdminChatbot /></ProtectedRoute>} />
              <Route path="/admin/settings" element={<ProtectedRoute requireAdmin><AdminSettings /></ProtectedRoute>} />
              <Route path="/admin/services" element={<ProtectedRoute requireAdmin><AdminServices /></ProtectedRoute>} />
              <Route path="/admin/cms" element={<ProtectedRoute requireAdmin><AdminCMS /></ProtectedRoute>} />
              <Route path="/admin/screenings" element={<ProtectedRoute requireAdmin><AdminScreenings /></ProtectedRoute>} />
              <Route path="/admin/sms" element={<ProtectedRoute requireAdmin><AdminSMS /></ProtectedRoute>} />

            </Routes>
          </MaintenanceManager>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
