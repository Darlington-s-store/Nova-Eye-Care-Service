import { Navigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, ShieldAlert, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireSuperAdmin?: boolean;
}

export const ProtectedRoute = ({ children, requireAdmin, requireSuperAdmin }: ProtectedRouteProps) => {
  const { session, isAdmin, isSuperAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    const redirectTo = (requireAdmin || requireSuperAdmin) ? "/admin/login" : "/login";
    return <Navigate to={redirectTo} state={{ from: location.pathname }} replace />;
  }

  if (requireSuperAdmin && !isSuperAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 border border-border shadow-lg text-center space-y-4">
          <div className="h-16 w-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto border border-amber-200">
            <ShieldAlert className="h-8 w-8 text-amber-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Access Restricted</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            This module requires <strong>Super Administrator</strong> authority (&ldquo;Overall Boss&rdquo;). Your current account does not have permission to view or manage this section.
          </p>
          <div className="pt-2">
            <Button asChild className="rounded-xl gap-2 w-full">
              <Link to="/admin">
                <ArrowLeft className="h-4 w-4" /> Return to Admin Overview
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
