import React, { useEffect, useState, useCallback } from "react";
import { apiService } from "@/lib/api";
import { AuthContext } from "./auth-context";
import { AuthContextType, NovaUser, Role } from "./auth-types";

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<NovaUser | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    const token = sessionStorage.getItem('nova_auth_token');
    if (!token) {
      setUser(null);
      setRoles([]);
      setLoading(false);
      return;
    }

    const attemptGetMe = async (isRetry = false): Promise<boolean> => {
      try {
        const data = await apiService.auth.getMe();
        
        // Map backend roles to frontend roles (super_admin, admin, patient)
        let frontendRole: Role = 'patient';
        if (data.role === 'super_admin') {
          frontendRole = 'super_admin';
        } else if (data.role === 'admin') {
          frontendRole = 'admin';
        }
        
        const mappedUser: NovaUser = {
          id: data.id,
          email: data.email,
          fullName: data.fullName,
          role: frontendRole
        };
        
        setUser(mappedUser);
        setRoles([frontendRole]);
        return true;
      } catch (err: unknown) {
        const axiosError = err as { response?: { status: number }; code?: string; message?: string };
        
        // If 401 Unauthorized, token is definitely invalid / expired
        if (axiosError.response?.status === 401) {
          sessionStorage.removeItem('nova_auth_token');
          setUser(null);
          setRoles([]);
          return false;
        }

        // If timeout or network failure and hasn't retried yet, retry once after a short delay (Render cold start)
        if (!isRetry && (axiosError.code === 'ECONNABORTED' || axiosError.message?.includes('timeout') || !axiosError.response)) {
          console.warn("Backend warming up, retrying auth check...");
          await new Promise(r => setTimeout(r, 2000));
          return attemptGetMe(true);
        }

        console.error("Auth check failed:", err);
        return false;
      }
    };

    try {
      await attemptGetMe(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
    
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'nova_auth_token') checkAuth();
    };
    
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [checkAuth]);

  const value: AuthContextType = {
    user,
    session: user,
    roles,
    isSuperAdmin: roles.includes("super_admin"),
    isAdmin: roles.includes("admin") || roles.includes("super_admin"),
    isPatient: roles.includes("patient") || roles.includes("admin") || roles.includes("super_admin"),
    loading,
    refresh: checkAuth
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
