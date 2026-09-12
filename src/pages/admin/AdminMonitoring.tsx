import { useState, useEffect, useCallback, useMemo } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { apiService, SystemMetrics, AuditLogItem, LockedUserItem } from "@/lib/api";
import { toast } from "sonner";
import {
  ShieldCheck,
  Activity,
  Server,
  Database,
  Lock,
  Unlock,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Cpu,
  HardDrive,
  Radio,
  Users,
  MessageSquare,
  Mail,
  Search,
  Filter,
  ShieldAlert,
  Calendar,
  Eye,
  FileText,
  Globe,
  Sparkles,
  Copy,
  ChevronRight,
  Info,
  X,
  UserCheck,
  Laptop
} from "lucide-react";

interface UserOption {
  id: string;
  fullName: string | null;
  email: string | null;
  role?: string;
}

export default function AdminMonitoring() {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [lockedUsers, setLockedUsers] = useState<LockedUserItem[]>([]);
  const [allUsers, setAllUsers] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [selectedUserId, setSelectedUserId] = useState<string>("all");
  const [searchLog, setSearchLog] = useState<string>("");
  const [manualUnlockEmail, setManualUnlockEmail] = useState<string>("");
  const [unlocking, setUnlocking] = useState(false);
  const [inspectLog, setInspectLog] = useState<AuditLogItem | null>(null);

  const fetchDashboardData = useCallback(async (isSilent = false) => {
    if (!isSilent) setRefreshing(true);
    try {
      const [metricsData, logsData, lockedData, usersData] = await Promise.all([
        apiService.system.getMetrics(),
        apiService.system.getAuditLogs({ 
          limit: 200,
          userId: selectedUserId !== "all" ? selectedUserId : undefined,
          category: categoryFilter !== "all" ? categoryFilter : undefined,
        }),
        apiService.system.getLockedUsers(),
        apiService.profiles.getAll().catch(() => [])
      ]);
      setMetrics(metricsData);
      setAuditLogs(logsData);
      setLockedUsers(lockedData);
      if (usersData && Array.isArray(usersData)) {
        setAllUsers(usersData);
      }
    } catch (err: unknown) {
      console.error("Failed to load monitoring telemetry:", err);
      if (!isSilent) {
        toast.error("Failed to fetch system telemetry");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedUserId, categoryFilter]);

  useEffect(() => {
    fetchDashboardData();
    // Poll every 15 seconds for live telemetry updates
    const interval = setInterval(() => {
      fetchDashboardData(true);
    }, 15000);
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  const handleUnlockUser = async (userId?: string, email?: string) => {
    setUnlocking(true);
    try {
      const res = await apiService.system.unlockUser({ userId, email });
      toast.success(res.message || "Account unlocked successfully");
      setManualUnlockEmail("");
      await fetchDashboardData(true);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Failed to unlock account");
    } finally {
      setUnlocking(false);
    }
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      // Auth & Security
      case "LOGIN_SUCCESS":
        return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1"><Lock className="w-3 h-3" /> Login Success</Badge>;
      case "LOGIN_FAILED":
      case "LOGIN_FAILED_UNKNOWN_USER":
        return <Badge className="bg-amber-50 text-amber-700 border-amber-200 gap-1"><AlertTriangle className="w-3 h-3" /> Failed Login</Badge>;
      case "ACCOUNT_LOCKED":
      case "LOGIN_BLOCKED_LOCKED":
        return <Badge className="bg-red-50 text-red-700 border-red-200 gap-1"><ShieldAlert className="w-3 h-3" /> Account Locked</Badge>;
      case "ACCOUNT_UNLOCKED":
        return <Badge className="bg-blue-50 text-blue-700 border-blue-200 gap-1"><Unlock className="w-3 h-3" /> Account Unlocked</Badge>;
      case "ROLE_CHANGED":
        return <Badge className="bg-purple-50 text-purple-700 border-purple-200 gap-1"><ShieldCheck className="w-3 h-3" /> Role Modified</Badge>;
      case "REGISTER_SUCCESS":
        return <Badge className="bg-teal-50 text-teal-700 border-teal-200 gap-1"><UserCheck className="w-3 h-3" /> Registered Account</Badge>;

      // Appointments
      case "APPOINTMENT_BOOKED":
        return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 gap-1"><Calendar className="w-3 h-3 text-emerald-600" /> Booked Appointment</Badge>;
      case "APPOINTMENT_UPDATED":
        return <Badge className="bg-sky-50 text-sky-700 border-sky-200 gap-1"><Calendar className="w-3 h-3 text-sky-600" /> Updated Appointment</Badge>;
      case "APPOINTMENT_STATUS_UPDATED":
        return <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 gap-1"><Calendar className="w-3 h-3 text-indigo-600" /> Status Changed</Badge>;
      case "APPOINTMENT_CANCELLED":
        return <Badge className="bg-rose-50 text-rose-700 border-rose-200 gap-1"><Calendar className="w-3 h-3 text-rose-600" /> Cancelled Booking</Badge>;
      case "APPOINTMENT_DELETED":
        return <Badge className="bg-red-50 text-red-700 border-red-200 gap-1"><Calendar className="w-3 h-3 text-red-600" /> Deleted Booking</Badge>;

      // Clinical & Screenings
      case "EYE_SCREENING_RECORDED":
        return <Badge className="bg-indigo-100 text-indigo-800 border-indigo-300 gap-1"><Eye className="w-3 h-3 text-indigo-600" /> Screening Recorded</Badge>;
      case "EYE_SCREENING_UPDATED":
        return <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 gap-1"><Eye className="w-3 h-3 text-indigo-600" /> Screening Updated</Badge>;
      case "MEDICAL_HISTORY_UPDATED":
        return <Badge className="bg-teal-50 text-teal-700 border-teal-200 gap-1"><FileText className="w-3 h-3 text-teal-600" /> Medical History</Badge>;

      // Reviews
      case "REVIEW_SUBMITTED":
        return <Badge className="bg-amber-50 text-amber-700 border-amber-200 gap-1"><Sparkles className="w-3 h-3 text-amber-600" /> Review Submitted</Badge>;
      case "REVIEW_APPROVED":
        return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1"><Sparkles className="w-3 h-3 text-emerald-600" /> Review Approved</Badge>;
      case "REVIEW_REJECTED":
        return <Badge className="bg-slate-50 text-slate-700 border-slate-200 gap-1"><Sparkles className="w-3 h-3 text-slate-400" /> Review Rejected</Badge>;
      case "REVIEW_DELETED":
        return <Badge className="bg-rose-50 text-rose-700 border-rose-200 gap-1"><Sparkles className="w-3 h-3 text-rose-600" /> Review Deleted</Badge>;

      // Communications & Admin
      case "SMS_BROADCAST":
      case "SMS_SENT":
        return <Badge className="bg-violet-50 text-violet-700 border-violet-200 gap-1"><MessageSquare className="w-3 h-3 text-violet-600" /> SMS Dispatched</Badge>;
      case "UPDATE_CMS_CONTENT":
        return <Badge className="bg-slate-100 text-slate-800 border-slate-300 gap-1"><FileText className="w-3 h-3 text-slate-600" /> Website Content</Badge>;
      case "ADMIN_USER_CREATED":
        return <Badge className="bg-cyan-50 text-cyan-700 border-cyan-200 gap-1"><Users className="w-3 h-3" /> Admin Created</Badge>;
      case "ADMIN_PASSWORD_RESET":
        return <Badge className="bg-orange-50 text-orange-700 border-orange-200 gap-1"><Lock className="w-3 h-3" /> Password Reset</Badge>;
      case "PAGE_VIEW":
        return <Badge className="bg-zinc-100 text-zinc-700 border-zinc-300 gap-1"><Globe className="w-3 h-3 text-zinc-500" /> Page Visit</Badge>;

      default:
        return <Badge variant="outline">{action}</Badge>;
    }
  };

  const selectedUserObj = useMemo(() => {
    if (selectedUserId === "all") return null;
    return allUsers.find(u => u.id === selectedUserId) || null;
  }, [allUsers, selectedUserId]);

  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      const matchesAction = actionFilter === "all" || log.action === actionFilter;
      const q = searchLog.toLowerCase();
      const matchesSearch =
        !q ||
        log.action.toLowerCase().includes(q) ||
        (log.email && log.email.toLowerCase().includes(q)) ||
        (log.fullName && log.fullName.toLowerCase().includes(q)) ||
        (log.ip && log.ip.includes(q)) ||
        (log.details && JSON.stringify(log.details).toLowerCase().includes(q));
      return matchesAction && matchesSearch;
    });
  }, [auditLogs, actionFilter, searchLog]);

  return (
    <AdminLayout
      title="System & Security Monitoring"
      subtitle="Real-time telemetry, server performance, account lockout controls, and audit logs."
    >
      <div className="space-y-6 pb-12">
        {/* Top Control Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-border/70 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                Live Telemetry Active
                <Badge variant="outline" className="text-[10px] font-normal text-muted-foreground">
                  Refreshes every 15s
                </Badge>
              </p>
              <p className="text-xs text-muted-foreground">
                Last checked: {metrics?.timestamp ? new Date(metrics.timestamp).toLocaleTimeString() : "Syncing..."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchDashboardData()}
              disabled={refreshing}
              className="gap-2 rounded-lg text-xs h-9 w-full sm:w-auto"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
              Refresh Telemetry
            </Button>
          </div>
        </div>

        {/* Security Alerts Banner (if any) */}
        {metrics?.security.alerts && metrics.security.alerts.length > 0 && (
          <div className="space-y-2">
            {metrics.security.alerts.map((alert, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 shadow-sm"
              >
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
                <div className="text-sm font-medium flex-1">{alert.message}</div>
                <Badge className="bg-amber-600 text-white text-xs">Security Notice</Badge>
              </div>
            ))}
          </div>
        )}

        {/* Key Telemetry Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Uptime & Node Engine */}
          <Card className="rounded-xl border border-border/70 shadow-sm hover:shadow transition-shadow">
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Server Uptime</span>
              <Clock className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-black text-slate-900">
                {metrics?.system.uptimeFormatted || "—"}
              </div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                <Server className="h-3.5 w-3.5" /> Node {metrics?.system.nodeVersion || "—"} ({metrics?.system.platform})
              </p>
            </CardContent>
          </Card>

          {/* Database Roundtrip Latency */}
          <Card className="rounded-xl border border-border/70 shadow-sm hover:shadow transition-shadow">
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Database Latency</span>
              <Database className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900">
                  {metrics?.database.latencyMs !== undefined ? `${metrics.database.latencyMs}ms` : "—"}
                </span>
                <Badge
                  className={`text-[10px] font-semibold ${
                    (metrics?.database.latencyMs || 0) < 300
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-amber-50 text-amber-700 border-amber-200"
                  }`}
                >
                  {(metrics?.database.latencyMs || 0) < 300 ? "Optimal" : "Normal"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Neon Pool: {metrics?.database.pool.idle || 0} idle / {metrics?.database.pool.total || 0} total
              </p>
            </CardContent>
          </Card>

          {/* Node Process Memory (RSS & Heap) */}
          <Card className="rounded-xl border border-border/70 shadow-sm hover:shadow transition-shadow">
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Memory Footprint</span>
              <HardDrive className="h-4 w-4 text-indigo-600" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-black text-slate-900">
                {metrics?.system.memory.rssMB ? `${metrics.system.memory.rssMB} MB` : "—"}
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
                <div
                  className="bg-indigo-600 h-1.5 rounded-full"
                  style={{ width: `${Math.min(100, parseFloat(metrics?.system.memory.heapUtilizationPercent || "50"))}%` }}
                />
              </div>
              <p className="text-[11px] text-muted-foreground mt-1.5">
                Heap: {metrics?.system.memory.heapUsedMB || "0"} / {metrics?.system.memory.heapTotalMB || "0"} MB ({metrics?.system.memory.heapUtilizationPercent || "0"}%)
              </p>
            </CardContent>
          </Card>

          {/* Locked Accounts & Brute Force Guard */}
          <Card className="rounded-xl border border-border/70 shadow-sm hover:shadow transition-shadow">
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Security Guard</span>
              <ShieldAlert className="h-4 w-4 text-rose-600" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="flex items-baseline gap-2">
                <span className={`text-2xl font-black ${(metrics?.security.lockedAccountsCount || 0) > 0 ? "text-rose-600" : "text-slate-900"}`}>
                  {metrics?.security.lockedAccountsCount || 0}
                </span>
                <span className="text-xs font-medium text-muted-foreground">Locked Out</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {metrics?.security.failedLogins24h || 0} failed attempts in last 24h
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Infrastructure & Third-Party Service Health */}
        <Card className="rounded-xl border border-border/70 shadow-sm">
          <CardHeader className="p-5 pb-3 border-b border-slate-100">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" /> Integrated Services & Health Status
            </CardTitle>
            <CardDescription className="text-xs">
              Live status of backend connectors, communications gateways, and persistence layers.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Database */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Database className="h-5 w-5 text-emerald-600" />
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">PostgreSQL Cloud DB</h4>
                      <p className="text-xs text-muted-foreground">Neon Serverless (Frankfurt)</p>
                    </div>
                  </div>
                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">
                    Connected
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground pt-2 border-t border-slate-200/60 flex justify-between">
                  <span>Latency: {metrics?.database.latencyMs || 0}ms</span>
                  <span>{metrics?.security.totalUsers || 0} Registered Users</span>
                </div>
              </div>

              {/* SMS Gateway */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <MessageSquare className="h-5 w-5 text-blue-600" />
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Arkesel SMS Gateway</h4>
                      <p className="text-xs text-muted-foreground">Sender: {metrics?.providers.sms.senderId || "NovaEyeCare"}</p>
                    </div>
                  </div>
                  <Badge
                    className={
                      metrics?.providers.sms.status === "configured"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 text-xs"
                        : "bg-blue-50 text-blue-700 border-blue-200 text-xs"
                    }
                  >
                    {metrics?.providers.sms.status === "configured" ? "Active" : "Simulation Ready"}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground pt-2 border-t border-slate-200/60 flex justify-between">
                  <span>Batch Capacity: 25 / chunk</span>
                  <span>Direct Delivery</span>
                </div>
              </div>

              {/* Email Gateway */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Mail className="h-5 w-5 text-purple-600" />
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Email Dispatcher</h4>
                      <p className="text-xs text-muted-foreground">Nodemailer SMTP</p>
                    </div>
                  </div>
                  <Badge
                    className={
                      metrics?.providers.email.status === "configured"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 text-xs"
                        : "bg-blue-50 text-blue-700 border-blue-200 text-xs"
                    }
                  >
                    {metrics?.providers.email.status === "configured" ? "Active" : "Fallback Mode"}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground pt-2 border-t border-slate-200/60 flex justify-between">
                  <span>OTP & Notifications</span>
                  <span>TLS Encrypted</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Lockout & Brute-Force Management */}
        <Card className="rounded-xl border border-border/70 shadow-sm">
          <CardHeader className="p-5 pb-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-900">
                <Lock className="h-4 w-4 text-rose-600" /> Account Lockouts & Failed Attempts
              </CardTitle>
              <CardDescription className="text-xs">
                Accounts are automatically locked for 15 minutes after 5 failed password attempts. Administrators can manually unlock accounts immediately.
              </CardDescription>
            </div>

            {/* Quick manual unlock by email */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Input
                placeholder="Enter user email to unlock..."
                value={manualUnlockEmail}
                onChange={(e) => setManualUnlockEmail(e.target.value)}
                className="h-9 text-xs w-full sm:w-64 rounded-lg"
              />
              <Button
                size="sm"
                onClick={() => handleUnlockUser(undefined, manualUnlockEmail)}
                disabled={!manualUnlockEmail || unlocking}
                className="h-9 text-xs rounded-lg gap-1.5 shrink-0"
              >
                <Unlock className="h-3.5 w-3.5" /> Unlock
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-5">
            {lockedUsers.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                <p className="text-sm font-semibold text-slate-800">All Patient & Staff Accounts Secure</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  No accounts are currently locked or experiencing repeated failed login attempts.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 uppercase font-semibold text-[11px] border-b">
                    <tr>
                      <th className="p-3">User / Patient</th>
                      <th className="p-3">Role</th>
                      <th className="p-3">Failed Attempts</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Locked Until</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {lockedUsers.map((u) => {
                      const isCurrentlyLocked = u.lockedUntil && new Date(u.lockedUntil) > new Date();
                      return (
                        <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-3">
                            <div className="font-semibold text-slate-900">{u.fullName || "—"}</div>
                            <div className="text-muted-foreground font-mono text-[11px]">{u.email}</div>
                          </td>
                          <td className="p-3">
                            <Badge variant="outline" className="capitalize text-[11px]">
                              {u.role || "user"}
                            </Badge>
                          </td>
                          <td className="p-3 font-semibold">
                            <span className={u.failedAttempts >= 5 ? "text-rose-600 font-bold" : "text-amber-600"}>
                              {u.failedAttempts} / 5
                            </span>
                          </td>
                          <td className="p-3">
                            {isCurrentlyLocked ? (
                              <Badge className="bg-rose-50 text-rose-700 border-rose-200 flex items-center gap-1 w-fit">
                                <Lock className="h-3 w-3" /> Locked Out
                              </Badge>
                            ) : (
                              <Badge className="bg-amber-50 text-amber-700 border-amber-200">
                                Warning Level
                              </Badge>
                            )}
                          </td>
                          <td className="p-3 text-muted-foreground">
                            {u.lockedUntil ? new Date(u.lockedUntil).toLocaleTimeString() : "—"}
                          </td>
                          <td className="p-3 text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUnlockUser(u.id, u.email)}
                              disabled={unlocking}
                              className="h-8 text-xs gap-1.5 rounded-lg border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                            >
                              <Unlock className="h-3 w-3" /> Unlock Now
                            </Button>
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

        {/* Comprehensive User Activity & Security Audit Monitoring Center */}
        <Card className="rounded-xl border border-border/70 shadow-sm overflow-hidden">
          <CardHeader className="p-5 pb-4 border-b border-slate-100 bg-slate-50/50">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-900">
                  <Activity className="h-5 w-5 text-primary animate-pulse" /> User Activity & Telemetry Monitor
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Real-time activity tracking across all patients, doctors, and system administrators.
                </CardDescription>
              </div>

              {/* User filter selector and Search */}
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Specific User Filter Dropdown */}
                <div className="flex items-center gap-1.5 bg-white border border-input rounded-lg px-2.5 py-1">
                  <Users className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <select
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    aria-label="Filter by user"
                    className="text-xs bg-transparent border-0 focus:ring-0 focus:outline-none max-w-[180px] truncate font-medium text-slate-800"
                  >
                    <option value="all">All Users & Patients</option>
                    {allUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.fullName || u.email || "Unnamed User"} ({u.role || "patient"})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Text Filter Input */}
                <div className="relative">
                  <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search name, IP, email..."
                    value={searchLog}
                    onChange={(e) => setSearchLog(e.target.value)}
                    className="h-8 pl-8 text-xs w-44 rounded-lg bg-white"
                  />
                </div>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setSelectedUserId("all");
                    setCategoryFilter("all");
                    setActionFilter("all");
                    setSearchLog("");
                  }}
                  className="h-8 text-xs text-muted-foreground hover:text-slate-900"
                  title="Reset all filters"
                >
                  Reset
                </Button>
              </div>
            </div>

            {/* Category Filter Badges */}
            <div className="flex flex-wrap gap-1.5 pt-3 border-t border-slate-200/60 mt-3">
              {[
                { id: "all", label: "All Activities", icon: Activity },
                { id: "appointments", label: "Appointments", icon: Calendar },
                { id: "clinical", label: "Screenings & EHR", icon: Eye },
                { id: "auth", label: "Auth & Security", icon: Lock },
                { id: "reviews", label: "Reviews", icon: Sparkles },
                { id: "sms", label: "SMS Alerts", icon: MessageSquare },
                { id: "admin", label: "Admin Operations", icon: ShieldCheck },
                { id: "portal", label: "Portal Visits", icon: Globe }
              ].map((cat) => {
                const isSelected = categoryFilter === cat.id;
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setCategoryFilter(cat.id)}
                    className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full transition-all ${
                      isSelected
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100/70"
                    }`}
                  >
                    <Icon className="h-3 w-3" />
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </CardHeader>

          {/* Active User Filter Alert Banner (if user selected) */}
          {selectedUserObj && (
            <div className="bg-primary/5 border-b border-primary/20 px-5 py-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs">
                  {selectedUserObj.fullName ? selectedUserObj.fullName[0].toUpperCase() : "U"}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">
                      Tracking: {selectedUserObj.fullName || "Guest Patient"}
                    </span>
                    <Badge variant="outline" className="text-[10px] capitalize">
                      {selectedUserObj.role || "patient"}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground font-mono">
                    {selectedUserObj.email} • ID: {selectedUserObj.id}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Badge className="bg-primary text-primary-foreground text-xs">
                  {filteredLogs.length} Events Recorded
                </Badge>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedUserId("all")}
                  className="h-7 text-xs gap-1 rounded-md"
                >
                  <X className="h-3 w-3" /> Clear User Filter
                </Button>
              </div>
            </div>
          )}

          <CardContent className="p-0">
            {filteredLogs.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                <Activity className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm font-semibold text-slate-800">No User Activity Recorded</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {selectedUserId !== "all" 
                    ? "This user has no recorded actions matching the current filter."
                    : "No system events matching the selected filters."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 uppercase font-semibold text-[11px] border-b">
                    <tr>
                      <th className="p-3.5 pl-5">Timestamp</th>
                      <th className="p-3.5">Action Performed</th>
                      <th className="p-3.5">User / Actor</th>
                      <th className="p-3.5">IP & Client</th>
                      <th className="p-3.5">Event Context</th>
                      <th className="p-3.5 pr-5 text-right">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredLogs.map((log) => {
                      const detailsObj = typeof log.details === "object" && log.details !== null ? log.details : null;
                      const hasDetails = !!detailsObj && Object.keys(detailsObj).length > 0;
                      
                      return (
                        <tr key={log.id} className="hover:bg-slate-50/70 transition-colors group">
                          {/* Timestamp */}
                          <td className="p-3.5 pl-5 text-muted-foreground font-mono whitespace-nowrap">
                            <div className="text-slate-900 font-medium">
                              {new Date(log.createdAt).toLocaleTimeString("en-GB", {
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit"
                              })}
                            </div>
                            <div className="text-[10px] text-muted-foreground">
                              {new Date(log.createdAt).toLocaleDateString("en-GB", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric"
                              })}
                            </div>
                          </td>

                          {/* Action Badge */}
                          <td className="p-3.5 whitespace-nowrap">
                            {getActionBadge(log.action)}
                          </td>

                          {/* User / Actor */}
                          <td className="p-3.5">
                            <button
                              onClick={() => log.userId && setSelectedUserId(log.userId)}
                              className={`text-left ${log.userId ? "hover:underline cursor-pointer" : ""}`}
                              title={log.userId ? "Click to isolate this user's activities" : undefined}
                            >
                              <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                                {log.fullName || log.email || "System Service"}
                                {log.role === "super_admin" && (
                                  <Badge className="bg-amber-500/15 text-amber-700 text-[9px] py-0 px-1 font-bold">
                                    Boss
                                  </Badge>
                                )}
                              </div>
                              {log.email && (
                                <div className="text-muted-foreground font-mono text-[10px]">{log.email}</div>
                              )}
                            </button>
                          </td>

                          {/* IP Address & Agent */}
                          <td className="p-3.5 font-mono text-[11px] text-muted-foreground whitespace-nowrap">
                            <div className="text-slate-700">{log.ip || "—"}</div>
                            {detailsObj && detailsObj.userAgent && (
                              <div className="text-[9px] text-muted-foreground/70 truncate max-w-[120px]" title={String(detailsObj.userAgent)}>
                                <Laptop className="w-2.5 h-2.5 inline mr-1" />
                                {String(detailsObj.userAgent).slice(0, 25)}...
                              </div>
                            )}
                          </td>

                          {/* Event Summary */}
                          <td className="p-3.5 text-slate-600 max-w-sm">
                            <div className="truncate font-mono text-[11px]">
                              {detailsObj ? (
                                <span>
                                  {detailsObj.patientName ? `Patient: ${detailsObj.patientName}` : ""}
                                  {detailsObj.service ? ` • ${detailsObj.service}` : ""}
                                  {detailsObj.newStatus ? ` • Status: ${detailsObj.newStatus}` : ""}
                                  {detailsObj.diagnosis ? ` • Diagnosis: ${detailsObj.diagnosis}` : ""}
                                  {detailsObj.section ? ` • Section: ${detailsObj.section}` : ""}
                                  {!detailsObj.patientName && !detailsObj.service && !detailsObj.diagnosis
                                    ? JSON.stringify(detailsObj).slice(0, 60)
                                    : ""}
                                </span>
                              ) : (
                                String(log.details || "—")
                              )}
                            </div>
                          </td>

                          {/* Action button */}
                          <td className="p-3.5 pr-5 text-right">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setInspectLog(log)}
                              className="h-7 text-xs gap-1 opacity-80 group-hover:opacity-100 hover:bg-slate-200/60"
                            >
                              <Info className="h-3.5 w-3.5" /> Inspect
                            </Button>
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

        {/* Payload Inspection Modal */}
        <Dialog open={!!inspectLog} onOpenChange={(open) => !open && setInspectLog(null)}>
          <DialogContent className="max-w-lg rounded-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                <ShieldCheck className="h-5 w-5 text-primary" />
                Audit Event Inspection
              </DialogTitle>
              <DialogDescription className="text-xs">
                Detailed telemetry payload and metadata for audit event ID #{inspectLog?.id}
              </DialogDescription>
            </DialogHeader>

            {inspectLog && (
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border text-xs">
                  <div>
                    <span className="text-muted-foreground text-[10px] uppercase font-bold">Action</span>
                    <div className="mt-0.5">{getActionBadge(inspectLog.action)}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-[10px] uppercase font-bold">Timestamp</span>
                    <p className="font-semibold text-slate-800 mt-0.5">
                      {new Date(inspectLog.createdAt).toLocaleString("en-GB")}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-[10px] uppercase font-bold">User / Actor</span>
                    <p className="font-semibold text-slate-800 mt-0.5">
                      {inspectLog.fullName || inspectLog.email || "System"}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-[10px] uppercase font-bold">IP Address</span>
                    <p className="font-mono text-slate-800 mt-0.5">{inspectLog.ip || "unknown"}</p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">Raw Context Payload (JSON)</span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs gap-1"
                      onClick={() => {
                        navigator.clipboard.writeText(JSON.stringify(inspectLog.details, null, 2));
                        toast.success("Payload copied to clipboard");
                      }}
                    >
                      <Copy className="h-3 w-3" /> Copy JSON
                    </Button>
                  </div>
                  <pre className="p-3.5 bg-slate-950 text-emerald-400 font-mono text-xs rounded-xl overflow-x-auto max-h-60 border border-slate-800">
                    {typeof inspectLog.details === "object"
                      ? JSON.stringify(inspectLog.details, null, 2)
                      : String(inspectLog.details)}
                  </pre>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
