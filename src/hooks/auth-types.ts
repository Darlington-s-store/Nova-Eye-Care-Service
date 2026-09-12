import { User } from "@/lib/api";

export type Role = "super_admin" | "admin" | "patient";

export interface NovaUser extends Omit<User, 'role'> {
  fullName: string;
  role: Role;
}

export interface AuthContextType {
  user: NovaUser | null;
  session: NovaUser | null;
  roles: Role[];
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isPatient: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
}
