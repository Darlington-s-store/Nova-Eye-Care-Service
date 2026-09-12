import { useState, useEffect, useCallback } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { apiService, Profile } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  Shield,
  ShieldCheck,
  UserPlus,
  Mail,
  Phone,
  KeyRound,
  Trash2,
  Unlock,
  Search,
  RefreshCw,
  Plus,
  Loader2,
  AlertTriangle,
  UserCheck,
  CheckCircle2,
  XCircle
} from "lucide-react";

interface PendingAdmin {
  email: string;
  createdAt: string;
}

export default function AdminManagement() {
  const { user: currentAuthUser } = useAuth();
  const [admins, setAdmins] = useState<Profile[]>([]);
  const [pendingAdmins, setPendingAdmins] = useState<PendingAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Create Admin Dialog
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newAdmin, setNewAdmin] = useState({
    email: "",
    fullName: "",
    phone: "",
    password: "",
    role: "admin"
  });

  // Password Reset Dialog
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [targetAdmin, setTargetAdmin] = useState<Profile | null>(null);
  const [newPassword, setNewPassword] = useState("");

  // Add Pending Invite Dialog
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);

  // Demote / Role Change Dialog
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [roleUpdating, setRoleUpdating] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>("admin");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [allProfiles, pending] = await Promise.all([
        apiService.profiles.getAll({ role: "admin" }),
        apiService.auth.getPendingAdmins().catch(() => [])
      ]);

      // Filter only admins and super_admins
      const adminList = (allProfiles || []).filter(
        p => p.role === "admin" || p.role === "super_admin"
      );
      setAdmins(adminList);
      setPendingAdmins(pending || []);
    } catch (err: unknown) {
      console.error("Failed to load admin management data:", err);
      toast.error("Failed to fetch administrator data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Create new Admin
  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdmin.email || !newAdmin.fullName || !newAdmin.password) {
      toast.error("Please fill in all required fields.");
      return;
    }
    if (newAdmin.password.length < 6) {
      toast.error("Password must be at least 6 characters long.");
      return;
    }

    setCreating(true);
    try {
      await apiService.auth.adminCreateUser({
        email: newAdmin.email,
        fullName: newAdmin.fullName,
        phone: newAdmin.phone,
        password: newAdmin.password,
        role: newAdmin.role
      });
      toast.success(`Administrator account created for ${newAdmin.email}`);
      setIsAddOpen(false);
      setNewAdmin({ email: "", fullName: "", phone: "", password: "", role: "admin" });
      await loadData();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Failed to create administrator account");
    } finally {
      setCreating(false);
    }
  };

  // Reset Admin Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetAdmin || !newPassword || newPassword.length < 6) {
      toast.error("Password must be at least 6 characters long.");
      return;
    }

    setResetting(true);
    try {
      await apiService.auth.adminResetPassword({
        userId: targetAdmin.id,
        newPassword
      });
      toast.success(`Password reset successfully for ${targetAdmin.email}`);
      setIsResetOpen(false);
      setNewPassword("");
      setTargetAdmin(null);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Failed to reset password");
    } finally {
      setResetting(false);
    }
  };

  // Change Role (Promote / Demote)
  const handleChangeRole = async () => {
    if (!targetAdmin) return;
    if (targetAdmin.id === currentAuthUser?.id && selectedRole !== "super_admin") {
      toast.error("Security restriction: You cannot demote your own Super Admin account.");
      return;
    }

    setRoleUpdating(true);
    try {
      await apiService.profiles.updateByAdmin(targetAdmin.id, {
        role: selectedRole
      });
      toast.success(`Role for ${targetAdmin.fullName || targetAdmin.email} updated to ${selectedRole}`);
      setIsRoleDialogOpen(false);
      setTargetAdmin(null);
      await loadData();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Failed to update role");
    } finally {
      setRoleUpdating(false);
    }
  };

  // Whitelist Invite Email
  const handleAddInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !inviteEmail.includes("@")) {
      toast.error("Please enter a valid email address.");
      return;
    }

    setInviting(true);
    try {
      await apiService.auth.addPendingAdmin(inviteEmail.trim().toLowerCase());
      toast.success(`${inviteEmail} added to authorized administrator whitelist.`);
      setInviteEmail("");
      setIsInviteOpen(false);
      await loadData();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Failed to add authorized email");
    } finally {
      setInviting(false);
    }
  };

  // Remove Whitelist Invite Email
  const handleRemoveInvite = async (email: string) => {
    if (confirm(`Remove ${email} from authorized administrator whitelist?`)) {
      try {
        await apiService.auth.removePendingAdmin(email);
        toast.success(`Authorization revoked for ${email}`);
        await loadData();
      } catch (error: unknown) {
        const err = error as { response?: { data?: { message?: string } } };
        toast.error(err.response?.data?.message || "Failed to revoke authorization");
      }
    }
  };

  // Unlock Admin Account
  const handleUnlockAdmin = async (admin: Profile) => {
    try {
      const res = await apiService.system.unlockUser({ userId: admin.id });
      toast.success(res.message || `Account for ${admin.email} unlocked successfully`);
      await loadData();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Failed to unlock account");
    }
  };

  const filteredAdmins = admins.filter(
    a =>
      (a.fullName && a.fullName.toLowerCase().includes(search.toLowerCase())) ||
      (a.email && a.email.toLowerCase().includes(search.toLowerCase())) ||
      (a.phone && a.phone.includes(search))
  );

  const superAdminCount = admins.filter(a => a.role === "super_admin").length;
  const regularAdminCount = admins.filter(a => a.role === "admin").length;

  return (
    <AdminLayout
      title="Administrator & Staff Authority"
      subtitle="Super Administrator central command: provision, promote, demote, and oversee all clinic administrators."
    >
      <div className="space-y-6 pb-12">
        {/* Top Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="rounded-xl border border-border/70 shadow-sm">
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Administrators</span>
              <Shield className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-black text-slate-900">{admins.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Authorized leadership personnel</p>
            </CardContent>
          </Card>

          <Card className="rounded-xl border border-amber-200/70 bg-amber-50/20 shadow-sm">
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700">Super Admins (&ldquo;Boss&rdquo;)</span>
              <ShieldCheck className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-black text-amber-900">{superAdminCount}</div>
              <p className="text-xs text-amber-700 mt-1">Full root system authority</p>
            </CardContent>
          </Card>

          <Card className="rounded-xl border border-border/70 shadow-sm">
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Regular Admins</span>
              <UserCheck className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-black text-slate-900">{regularAdminCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Restricted from monitoring &amp; settings</p>
            </CardContent>
          </Card>

          <Card className="rounded-xl border border-border/70 shadow-sm">
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Pending Whitelist</span>
              <Mail className="h-4 w-4 text-indigo-600" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-black text-slate-900">{pendingAdmins.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Authorized signup invitations</p>
            </CardContent>
          </Card>
        </div>

        {/* Action Header & Search */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-border/70 shadow-sm">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search administrators by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 text-xs rounded-xl"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsInviteOpen(true)}
              className="gap-2 rounded-xl text-xs h-10 border-border/80"
            >
              <Mail className="h-4 w-4 text-indigo-600" /> Whitelist Email
            </Button>
            <Button
              size="sm"
              onClick={() => setIsAddOpen(true)}
              className="gap-2 rounded-xl text-xs h-10 shadow-sm bg-primary hover:bg-primary/90"
            >
              <UserPlus className="h-4 w-4" /> Provision New Admin
            </Button>
          </div>
        </div>

        {/* Active Administrators Table */}
        <Card className="rounded-xl border border-border/70 shadow-sm">
          <CardHeader className="p-5 pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-900">
                <Shield className="h-4 w-4 text-primary" /> Active Clinic Administrators
              </CardTitle>
              <CardDescription className="text-xs">
                Administrators have operational access to appointments and patient records. Super Administrators additionally hold full system, monitoring, and administrative governance.
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={loadData}
              disabled={loading}
              className="h-8 w-8 p-0 rounded-lg"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </CardHeader>

          <CardContent className="p-5">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredAdmins.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Shield className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-30" />
                <p className="text-sm font-semibold">No administrator accounts match your search.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 uppercase font-semibold text-[11px] border-b">
                    <tr>
                      <th className="p-3">Administrator</th>
                      <th className="p-3">Role Tier</th>
                      <th className="p-3">Phone</th>
                      <th className="p-3">Registered On</th>
                      <th className="p-3 text-right">Administrative Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredAdmins.map((admin) => {
                      const isSuper = admin.role === "super_admin";
                      const isSelf = admin.id === currentAuthUser?.id;

                      return (
                        <tr key={admin.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-3">
                            <div className="font-bold text-slate-900 flex items-center gap-2">
                              {admin.fullName || "Administrator"}
                              {isSelf && (
                                <Badge variant="outline" className="text-[10px] text-primary border-primary/30">
                                  You
                                </Badge>
                              )}
                            </div>
                            <div className="text-muted-foreground font-mono text-[11px] flex items-center gap-1.5 mt-0.5">
                              <Mail className="h-3 w-3" /> {admin.email}
                            </div>
                          </td>

                          <td className="p-3">
                            {isSuper ? (
                              <Badge className="bg-amber-500/15 text-amber-700 border-amber-300 font-bold flex items-center gap-1 w-fit">
                                <ShieldCheck className="h-3 w-3 text-amber-600" /> Super Admin (&ldquo;Overall Boss&rdquo;)
                              </Badge>
                            ) : (
                              <Badge className="bg-primary/10 text-primary border-primary/20 font-semibold w-fit">
                                Clinic Admin
                              </Badge>
                            )}
                          </td>

                          <td className="p-3 text-slate-700">
                            {admin.phone ? (
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3 text-muted-foreground" /> {admin.phone}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>

                          <td className="p-3 text-muted-foreground whitespace-nowrap">
                            {admin.createdAt ? new Date(admin.createdAt).toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric"
                            }) : "—"}
                          </td>

                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Change Role button */}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setTargetAdmin(admin);
                                  setSelectedRole(admin.role || "admin");
                                  setIsRoleDialogOpen(true);
                                }}
                                disabled={isSelf}
                                className="h-8 text-xs rounded-lg gap-1 border-slate-200"
                                title={isSelf ? "You cannot modify your own role" : "Change administrative tier"}
                              >
                                <Shield className="h-3 w-3" /> Role
                              </Button>

                              {/* Reset Password button */}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setTargetAdmin(admin);
                                  setNewPassword("");
                                  setIsResetOpen(true);
                                }}
                                className="h-8 text-xs rounded-lg gap-1 border-slate-200 text-amber-700 hover:bg-amber-50"
                              >
                                <KeyRound className="h-3 w-3" /> Reset
                              </Button>

                              {/* Quick unlock button */}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleUnlockAdmin(admin)}
                                className="h-8 text-xs rounded-lg gap-1 border-slate-200 text-emerald-700 hover:bg-emerald-50"
                                title="Reset failed login counters and unlock account"
                              >
                                <Unlock className="h-3 w-3" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Whitelisted Admin Invitations */}
        <Card className="rounded-xl border border-border/70 shadow-sm">
          <CardHeader className="p-5 pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-900">
                <Mail className="h-4 w-4 text-indigo-600" /> Authorized Admin Whitelist Invitations
              </CardTitle>
              <CardDescription className="text-xs">
                Email addresses listed here are pre-approved to register or sign up as administrators. You can revoke invitations at any time.
              </CardDescription>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsInviteOpen(true)}
              className="h-8 text-xs gap-1.5 rounded-lg border-indigo-200 text-indigo-700 hover:bg-indigo-50"
            >
              <Plus className="h-3.5 w-3.5" /> Add Email
            </Button>
          </CardHeader>
          <CardContent className="p-5">
            {pendingAdmins.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                <CheckCircle2 className="h-7 w-7 text-emerald-500 mx-auto mb-1.5 opacity-80" />
                <p className="text-xs font-semibold text-slate-800">No Pending Whitelisted Invitations</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  All current administrative accounts are already registered and active.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {pendingAdmins.map((item) => (
                  <div key={item.email} className="py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xs">
                        @
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">{item.email}</p>
                        <p className="text-[11px] text-muted-foreground">
                          Authorized on {new Date(item.createdAt).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric"
                          })}
                        </p>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRemoveInvite(item.email)}
                      className="h-8 text-xs text-destructive hover:bg-destructive/10 rounded-lg gap-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Revoke
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 1. Provision New Administrator Modal */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-slate-900">
              <UserPlus className="h-5 w-5 text-primary" /> Provision New Administrator
            </DialogTitle>
            <DialogDescription className="text-xs">
              Directly create a new administrative profile with clinical credentials.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateAdmin} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label htmlFor="admin-name" className="text-xs">Full Name *</Label>
              <Input
                id="admin-name"
                required
                placeholder="Dr. Jane Doe"
                value={newAdmin.fullName}
                onChange={(e) => setNewAdmin(p => ({ ...p, fullName: e.target.value }))}
                className="rounded-xl h-10 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="admin-email" className="text-xs">Email Address *</Label>
              <Input
                id="admin-email"
                type="email"
                required
                placeholder="jane.doe@novaeyecare.com"
                value={newAdmin.email}
                onChange={(e) => setNewAdmin(p => ({ ...p, email: e.target.value }))}
                className="rounded-xl h-10 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="admin-phone" className="text-xs">Phone Number</Label>
              <Input
                id="admin-phone"
                placeholder="+233 XX XXX XXXX"
                value={newAdmin.phone}
                onChange={(e) => setNewAdmin(p => ({ ...p, phone: e.target.value }))}
                className="rounded-xl h-10 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="admin-password" className="text-xs">Initial Password *</Label>
              <Input
                id="admin-password"
                type="password"
                required
                placeholder="Minimum 6 characters"
                value={newAdmin.password}
                onChange={(e) => setNewAdmin(p => ({ ...p, password: e.target.value }))}
                className="rounded-xl h-10 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="admin-role" className="text-xs">Administrative Tier</Label>
              <Select
                value={newAdmin.role}
                onValueChange={(val) => setNewAdmin(p => ({ ...p, role: val }))}
              >
                <SelectTrigger id="admin-role" className="rounded-xl h-10 text-xs">
                  <SelectValue placeholder="Select tier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Clinic Administrator (Standard Access)</SelectItem>
                  <SelectItem value="super_admin">Super Administrator (&ldquo;Overall Boss&rdquo;)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddOpen(false)}
                className="rounded-xl h-9 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={creating}
                className="rounded-xl h-9 text-xs gap-1.5"
              >
                {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserPlus className="h-3.5 w-3.5" />}
                Provision Account
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* 2. Reset Password Modal */}
      <Dialog open={isResetOpen} onOpenChange={setIsResetOpen}>
        <DialogContent className="max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-slate-900">
              <KeyRound className="h-5 w-5 text-amber-600" /> Reset Administrator Password
            </DialogTitle>
            <DialogDescription className="text-xs">
              Set a new secure password for <strong>{targetAdmin?.email}</strong>. This will also clear any account lockout counters.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleResetPassword} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label htmlFor="reset-pass" className="text-xs">New Secure Password</Label>
              <Input
                id="reset-pass"
                type="password"
                required
                placeholder="At least 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="rounded-xl h-10 text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsResetOpen(false)}
                className="rounded-xl h-9 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={resetting}
                className="rounded-xl h-9 text-xs bg-amber-600 hover:bg-amber-700 text-white"
              >
                {resetting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Update Password"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* 3. Change Administrative Tier Modal */}
      <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <DialogContent className="max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-slate-900">
              <Shield className="h-5 w-5 text-primary" /> Modify Administrative Tier
            </DialogTitle>
            <DialogDescription className="text-xs">
              Update authority tier for <strong>{targetAdmin?.fullName || targetAdmin?.email}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Select Role</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger className="rounded-xl h-10 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="super_admin">Super Administrator (&ldquo;Overall Boss&rdquo;)</SelectItem>
                  <SelectItem value="admin">Clinic Administrator (Standard Admin)</SelectItem>
                  <SelectItem value="user">Demote to Patient / Client (Revoke Admin)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedRole === "user" && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
                <span>Demoting this user to Patient will immediately revoke their access to this Admin Dashboard.</span>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsRoleDialogOpen(false)}
                className="rounded-xl h-9 text-xs"
              >
                Cancel
              </Button>
              <Button
                onClick={handleChangeRole}
                disabled={roleUpdating}
                className="rounded-xl h-9 text-xs"
              >
                {roleUpdating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Confirm Role Change"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 4. Whitelist Pending Email Modal */}
      <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
        <DialogContent className="max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-slate-900">
              <Mail className="h-5 w-5 text-indigo-600" /> Whitelist Admin Invitation Email
            </DialogTitle>
            <DialogDescription className="text-xs">
              Authorized email addresses can self-register as an administrator from the signup portal.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddInvite} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label htmlFor="whitelist-email" className="text-xs">Doctor / Staff Email Address</Label>
              <Input
                id="whitelist-email"
                type="email"
                required
                placeholder="doctor@novaeyecare.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="rounded-xl h-10 text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsInviteOpen(false)}
                className="rounded-xl h-9 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={inviting}
                className="rounded-xl h-9 text-xs bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5"
              >
                {inviting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                Authorize Email
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
