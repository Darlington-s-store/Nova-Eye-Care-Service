import { User } from "@/lib/api";

export type Role = "admin" | "patient";

export interface NovaUser extends User {
  fullName: string;
}

export interface AuthContextType {
  user: NovaUser | null;
  session: NovaUser | null;
  roles: Role[];
  isAdmin: boolean;
  isPatient: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
}
