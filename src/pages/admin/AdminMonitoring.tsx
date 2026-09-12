import { useState, useEffect, useCallback } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  ShieldAlert
} from "lucide-react";

export default function AdminMonitoring() {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [lockedUsers, setLockedUsers] = useState<LockedUserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [searchLog, setSearchLog] = useState<string>("");
  const [manualUnlockEmail, setManualUnlockEmail] = useState<string>("");
  const [unlocking, setUnlocking] = useState(false);

  const fetchDashboardData = useCallback(async (isSilent = false) => {
    if (!isSilent) setRefreshing(true);
    try {
      const [metricsData, logsData, lockedData] = await Promise.all([
        apiService.system.getMetrics(),
        apiService.system.getAuditLogs({ limit: 100 }),
        apiService.system.getLockedUsers()
      ]);
      setMetrics(metricsData);
      setAuditLogs(logsData);
      setLockedUsers(lockedData);
    } catch (err: any) {
      console.error("Failed to load monitoring telemetry:", err);
      if (!isSilent) {
        toast.error("Failed to fetch system telemetry");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

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
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to unlock account");
    } finally {
      setUnlocking(false);
    }
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case "LOGIN_SUCCESS":
        return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">Login Success</Badge>;
      case "LOGIN_FAILED":
      case "LOGIN_FAILED_UNKNOWN_USER":
        return <Badge className="bg-amber-50 text-amber-700 border-amber-200">Failed Login</Badge>;
      case "ACCOUNT_LOCKED":
      case "LOGIN_BLOCKED_LOCKED":
        return <Badge className="bg-red-50 text-red-700 border-red-200">Account Locked</Badge>;
      case "ACCOUNT_UNLOCKED":
        return <Badge className="bg-blue-50 text-blue-700 border-blue-200">Account Unlocked</Badge>;
      case "ROLE_CHANGED":
        return <Badge className="bg-purple-50 text-purple-700 border-purple-200">Role Modified</Badge>;
      case "SMS_BROADCAST":
        return <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200">SMS Broadcast</Badge>;
      case "ADMIN_USER_CREATED":
        return <Badge className="bg-cyan-50 text-cyan-700 border-cyan-200">User Created</Badge>;
      case "ADMIN_PASSWORD_RESET":
        return <Badge className="bg-orange-50 text-orange-700 border-orange-200">Password Reset</Badge>;
      default:
        return <Badge variant="outline">{action}</Badge>;
    }
  };

  const filteredLogs = auditLogs.filter((log) => {
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

        {/* System & Security Audit Logs Feed */}
        <Card className="rounded-xl border border-border/70 shadow-sm">
          <CardHeader className="p-5 pb-3 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-900">
                <ShieldCheck className="h-4 w-4 text-primary" /> Live Security Audit Log Feed
              </CardTitle>
              <CardDescription className="text-xs">
                Permanent event record tracking logins, lockout events, role modifications, SMS broadcasts, and account unlocks.
              </CardDescription>
            </div>

            {/* Filter controls */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Filter audit logs..."
                  value={searchLog}
                  onChange={(e) => setSearchLog(e.target.value)}
                  className="h-9 pl-8 text-xs w-44 rounded-lg"
                />
              </div>

              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="h-9 px-3 rounded-lg border border-input bg-background text-xs font-medium focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="all">All Event Types</option>
                <option value="LOGIN_SUCCESS">Login Success</option>
                <option value="LOGIN_FAILED">Login Failed</option>
                <option value="ACCOUNT_LOCKED">Account Locked</option>
                <option value="ACCOUNT_UNLOCKED">Account Unlocked</option>
                <option value="ROLE_CHANGED">Role Changed</option>
                <option value="SMS_BROADCAST">SMS Broadcast</option>
                <option value="ADMIN_PASSWORD_RESET">Password Reset</option>
              </select>
            </div>
          </CardHeader>
          <CardContent className="p-5">
            {filteredLogs.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <p className="text-sm font-medium">No audit log entries matching criteria.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 uppercase font-semibold text-[11px] border-b">
                    <tr>
                      <th className="p-3">Timestamp</th>
                      <th className="p-3">Action</th>
                      <th className="p-3">Account / Actor</th>
                      <th className="p-3">IP Address</th>
                      <th className="p-3">Event Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-3 text-muted-foreground font-mono whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit"
                          })}
                        </td>
                        <td className="p-3 whitespace-nowrap">{getActionBadge(log.action)}</td>
                        <td className="p-3">
                          <div className="font-semibold text-slate-900">{log.fullName || log.email || "System"}</div>
                          {log.role && (
                            <span className="text-[10px] text-muted-foreground uppercase font-bold">
                              {log.role}
                            </span>
                          )}
                        </td>
                        <td className="p-3 font-mono text-[11px] text-muted-foreground whitespace-nowrap">
                          {log.ip || "unknown"}
                        </td>
                        <td className="p-3 font-mono text-[11px] text-slate-600 max-w-xs truncate">
                          {typeof log.details === "object" ? JSON.stringify(log.details) : String(log.details)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
