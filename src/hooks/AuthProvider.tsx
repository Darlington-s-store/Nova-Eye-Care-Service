import React, { useEffect, useState, useCallback } from "react";
import { apiService } from "@/lib/api";
import { AuthContext } from "./auth-context";
import { AuthContextType, NovaUser, Role } from "./auth-types";

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<NovaUser | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem('nova_auth_token');
    if (!token) {
      setUser(null);
      setRoles([]);
      setLoading(false);
      return;
    }

    try {
      const data = await apiService.auth.getMe();
      
      // Map backend 'user' role to frontend 'patient' role
      const frontendRole: Role = data.role === 'admin' ? 'admin' : 'patient';
      
      const mappedUser: NovaUser = {
        id: data.id,
        email: data.email,
        fullName: data.fullName,
        role: frontendRole
      };
      
      setUser(mappedUser);
      setRoles([frontendRole]);
    } catch (err: unknown) {
      console.error("Auth check failed:", err);
      const axiosError = err as { response?: { status: number } };
      if (axiosError.response?.status === 401) {
        localStorage.removeItem('nova_auth_token');
        setUser(null);
        setRoles([]);
      }
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
    isAdmin: roles.includes("admin"),
    isPatient: roles.includes("patient") || roles.includes("admin"),
    loading,
    refresh: checkAuth
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
