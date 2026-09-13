import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AuthProvider } from "./hooks/AuthProvider";

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
import AdminManagement from "./pages/admin/AdminManagement.tsx";
import AdminMonitoring from "./pages/admin/AdminMonitoring.tsx";

const queryClient = new QueryClient();

export const AdminApp = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            {/* Authentication */}
            <Route path="/login" element={<AdminLogin />} />
            <Route path="/admin/login" element={<AdminLogin />} />

            {/* Dashboard Overview */}
            <Route path="/" element={<ProtectedRoute requireAdmin><AdminOverview /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminOverview /></ProtectedRoute>} />

            {/* Analytics */}
            <Route path="/analytics" element={<ProtectedRoute requireAdmin><AdminAnalytics /></ProtectedRoute>} />
            <Route path="/admin/analytics" element={<ProtectedRoute requireAdmin><AdminAnalytics /></ProtectedRoute>} />

            {/* Appointments */}
            <Route path="/appointments" element={<ProtectedRoute requireAdmin><AdminAppointments /></ProtectedRoute>} />
            <Route path="/admin/appointments" element={<ProtectedRoute requireAdmin><AdminAppointments /></ProtectedRoute>} />

            {/* Reviews */}
            <Route path="/reviews" element={<ProtectedRoute requireAdmin><AdminReviews /></ProtectedRoute>} />
            <Route path="/admin/reviews" element={<ProtectedRoute requireAdmin><AdminReviews /></ProtectedRoute>} />

            {/* Users & Patients */}
            <Route path="/users" element={<ProtectedRoute requireAdmin><AdminUsers /></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute requireAdmin><AdminUsers /></ProtectedRoute>} />

            {/* Notifications */}
            <Route path="/notifications" element={<ProtectedRoute requireAdmin><AdminNotifications /></ProtectedRoute>} />
            <Route path="/admin/notifications" element={<ProtectedRoute requireAdmin><AdminNotifications /></ProtectedRoute>} />

            {/* Chatbot & FAQ */}
            <Route path="/chatbot" element={<ProtectedRoute requireAdmin><AdminChatbot /></ProtectedRoute>} />
            <Route path="/admin/chatbot" element={<ProtectedRoute requireAdmin><AdminChatbot /></ProtectedRoute>} />

            {/* Settings */}
            <Route path="/settings" element={<ProtectedRoute requireAdmin><AdminSettings /></ProtectedRoute>} />
            <Route path="/admin/settings" element={<ProtectedRoute requireAdmin><AdminSettings /></ProtectedRoute>} />

            {/* Services */}
            <Route path="/services" element={<ProtectedRoute requireAdmin><AdminServices /></ProtectedRoute>} />
            <Route path="/admin/services" element={<ProtectedRoute requireAdmin><AdminServices /></ProtectedRoute>} />

            {/* CMS */}
            <Route path="/cms" element={<ProtectedRoute requireAdmin><AdminCMS /></ProtectedRoute>} />
            <Route path="/admin/cms" element={<ProtectedRoute requireAdmin><AdminCMS /></ProtectedRoute>} />

            {/* Screenings */}
            <Route path="/screenings" element={<ProtectedRoute requireAdmin><AdminScreenings /></ProtectedRoute>} />
            <Route path="/admin/screenings" element={<ProtectedRoute requireAdmin><AdminScreenings /></ProtectedRoute>} />

            {/* SMS Campaigns */}
            <Route path="/sms" element={<ProtectedRoute requireAdmin><AdminSMS /></ProtectedRoute>} />
            <Route path="/admin/sms" element={<ProtectedRoute requireAdmin><AdminSMS /></ProtectedRoute>} />

            {/* Administrator Management (Super Admin) */}
            <Route path="/administrators" element={<ProtectedRoute requireSuperAdmin><AdminManagement /></ProtectedRoute>} />
            <Route path="/admin/administrators" element={<ProtectedRoute requireSuperAdmin><AdminManagement /></ProtectedRoute>} />

            {/* Security & System Monitoring (Super Admin) */}
            <Route path="/monitoring" element={<ProtectedRoute requireSuperAdmin><AdminMonitoring /></ProtectedRoute>} />
            <Route path="/admin/monitoring" element={<ProtectedRoute requireSuperAdmin><AdminMonitoring /></ProtectedRoute>} />

            {/* Fallback to root */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default AdminApp;
