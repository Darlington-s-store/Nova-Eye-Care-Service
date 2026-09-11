import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { apiService, Profile, SMSLog, SMSStats } from "@/lib/api";
import { 
  Send, History, BarChart3, Loader2, Search, CheckCircle, XCircle, 
  Clock, Users, RefreshCw, Smartphone, Sparkles, Filter, Check, 
  RotateCcw, UserCheck, Calendar, FileText, Glasses,
  AlertCircle, ChevronRight, X, Trash2
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

type RecipientMode = "all" | "selected" | "group" | "custom";
type GroupFilter = "registered" | "pending_registration" | "appointments";

const CLINICAL_TEMPLATES = [
  {
    id: "reminder",
    title: "Appointment Reminder",
    icon: Calendar,
    text: "Reminder: You have an upcoming eye consultation at Nova Eye Care clinic. Please arrive 10 minutes prior to your scheduled time. Call 0544172089 for enquiries."
  },
  {
    id: "results",
    title: "Screening Results Ready",
    icon: FileText,
    text: "Hello from Nova Eye Care: Your comprehensive eye examination results and notes are now available on your patient portal. Visit novaeyecare.com to review."
  },
  {
    id: "glasses",
    title: "Prescription Ready",
    icon: Glasses,
    text: "Notice: Your optical lenses / prescription eyewear is ready for collection at Nova Eye Care. Visit our clinic during working hours (Mon-Sat)."
  },
  {
    id: "checkup",
    title: "Routine Checkup Alert",
    icon: Sparkles,
    text: "Nova Eye Care: It has been over 6 months since your last vision check. Protect your eyesight by scheduling your routine eye examination today."
  },
  {
    id: "notice",
    title: "Clinic Hours Notice",
    icon: AlertCircle,
    text: "Nova Eye Care Update: Clinic hours are Monday to Friday 8:00 AM - 5:00 PM, and Saturday 9:00 AM - 2:00 PM. We look forward to serving your vision needs."
  }
];

export default function AdminSMS() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [logs, setLogs] = useState<SMSLog[]>([]);
  const [stats, setStats] = useState<SMSStats | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [profilesLoading, setProfilesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  
  // Composer State
  const [recipientMode, setRecipientMode] = useState<RecipientMode>("all");
  const [selectedGroup, setSelectedGroup] = useState<GroupFilter>("registered");
  const [selectedPatientIds, setSelectedPatientIds] = useState<string[]>([]);
  const [customPhonesInput, setCustomPhonesInput] = useState("");
  const [patientSearch, setPatientSearch] = useState("");
  const [message, setMessage] = useState("");

  // History Tab Filter State
  const [historySearch, setHistorySearch] = useState("");
  const [historyStatusFilter, setHistoryStatusFilter] = useState<"all" | "sent" | "failed">("all");
  const [activeTab, setActiveTab] = useState("compose");

  // Clear logs modal state
  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);
  const [clearType, setClearType] = useState<"failed" | "all">("failed");
  const [clearing, setClearing] = useState(false);

  const openClearConfirm = (type: "failed" | "all") => {
    setClearType(type);
    setIsClearDialogOpen(true);
  };

  const handleConfirmClearLogs = async () => {
    setClearing(true);
    try {
      const res = await apiService.sms.clearLogs(clearType);
      toast.success(res.message || "Message logs cleared");
      setIsClearDialogOpen(false);
      fetchData();
    } catch {
      toast.error("Failed to clear message logs");
    } finally {
      setClearing(false);
    }
  };

  const handleDeleteLog = async (id: number) => {
    try {
      await apiService.sms.deleteLog(id);
      toast.success("Log entry deleted");
      setLogs(prev => prev.filter(l => l.id !== id));
      fetchData();
    } catch {
      toast.error("Failed to delete log entry");
    }
  };

  // Read URL params (e.g. from Admin Users page)
  useEffect(() => {
    const phoneParam = searchParams.get("phone");
    const nameParam = searchParams.get("name");

    if (phoneParam) {
      setRecipientMode("custom");
      setCustomPhonesInput(phoneParam);
      setActiveTab("compose");
      if (nameParam) {
        toast.info(`Ready to compose SMS to ${nameParam} (${phoneParam})`);
      }
    }
  }, [searchParams]);

  useEffect(() => {
    fetchData();
    loadProfiles();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [logsData, statsData] = await Promise.all([
        apiService.sms.getLogs(),
        apiService.sms.getStats()
      ]);
      setLogs(logsData || []);
      setStats(statsData);
    } catch (error) {
      toast.error("Failed to fetch SMS data");
    } finally {
      setLoading(false);
    }
  };

  const loadProfiles = async () => {
    setProfilesLoading(true);
    try {
      const data = await apiService.profiles.getAll();
      setProfiles(data || []);
    } catch (error) {
      console.error("Failed to load profiles for SMS", error);
    } finally {
      setProfilesLoading(false);
    }
  };

  // Patients with valid phones
  const patientsWithPhones = useMemo(() => {
    return profiles.filter(p => p.phone && p.phone.trim().length >= 8);
  }, [profiles]);

  // Registered vs Pending breakdown
  const registeredPatients = useMemo(() => {
    return patientsWithPhones.filter(p => p.registrationCompleted);
  }, [patientsWithPhones]);

  const pendingPatients = useMemo(() => {
    return patientsWithPhones.filter(p => !p.registrationCompleted);
  }, [patientsWithPhones]);

  // Filtered patients for the picker
  const filteredPatients = useMemo(() => {
    if (!patientSearch.trim()) return patientsWithPhones;
    const q = patientSearch.toLowerCase();
    return patientsWithPhones.filter(p => 
      (p.fullName && p.fullName.toLowerCase().includes(q)) ||
      (p.phone && p.phone.includes(q)) ||
      (p.email && p.email.toLowerCase().includes(q))
    );
  }, [patientsWithPhones, patientSearch]);

  // Parsed custom phones
  const parsedCustomPhones = useMemo(() => {
    if (!customPhonesInput.trim()) return [];
    return [...new Set(
      customPhonesInput
        .split(/[\n,;]+/)
        .map(p => p.replace(/\s+/g, "").trim())
        .filter(p => p.length >= 8)
    )];
  }, [customPhonesInput]);

  // Effective recipient count based on active mode
  const effectiveRecipientCount = useMemo(() => {
    switch (recipientMode) {
      case "all":
        return patientsWithPhones.length;
      case "group":
        if (selectedGroup === "registered") return registeredPatients.length;
        if (selectedGroup === "pending_registration") return pendingPatients.length;
        return patientsWithPhones.length;
      case "selected":
        return selectedPatientIds.length;
      case "custom":
        return parsedCustomPhones.length;
    }
  }, [recipientMode, selectedGroup, patientsWithPhones, registeredPatients, pendingPatients, selectedPatientIds, parsedCustomPhones]);

  // Toggle patient selection
  const togglePatient = (id: string) => {
    setSelectedPatientIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const selectAllFiltered = () => {
    const filteredIds = filteredPatients.map(p => p.id);
    setSelectedPatientIds(prev => [...new Set([...prev, ...filteredIds])]);
  };

  const clearSelection = () => {
    setSelectedPatientIds([]);
  };

  const applyTemplate = (tplText: string) => {
    setMessage(tplText);
    toast.success("Template inserted into composer");
  };

  // SMS character & segment calculation
  const messageLength = message.length;
  const smsSegments = Math.max(1, Math.ceil(messageLength / 160));

  const handleSend = async () => {
    if (!message.trim()) {
      toast.error("Please enter a message to send");
      return;
    }

    if (effectiveRecipientCount === 0) {
      toast.error("No valid recipients selected. Please choose at least one recipient.");
      return;
    }

    setSending(true);
    try {
      let recipientPayload: 'all' | 'registered' | 'pending_registration' | 'appointments' | string[];

      if (recipientMode === "all") {
        recipientPayload = "all";
      } else if (recipientMode === "group") {
        recipientPayload = selectedGroup;
      } else if (recipientMode === "selected") {
        const phoneList = profiles
          .filter(p => selectedPatientIds.includes(p.id) && p.phone)
          .map(p => p.phone.trim());
        recipientPayload = phoneList;
      } else {
        recipientPayload = parsedCustomPhones;
      }

      const result = await apiService.sms.sendBulk({
        message: message.trim(),
        recipients: recipientPayload
      });

      toast.success(result.message || "Messages processed successfully");
      setMessage("");
      if (recipientMode === "custom") {
        setCustomPhonesInput("");
      }
      // Refresh logs & stats
      fetchData();
      setActiveTab("history");
    } catch (error: unknown) {
      let errorMsg = "Failed to send SMS";
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { message?: string } } };
        if (axiosError.response?.data?.message) {
          errorMsg = axiosError.response.data.message;
        }
      } else if (error instanceof Error) {
        errorMsg = error.message;
      }
      toast.error(errorMsg);
    } finally {
      setSending(false);
    }
  };

  const handleResendLog = (log: SMSLog) => {
    setRecipientMode("custom");
    setCustomPhonesInput(log.phone);
    setMessage(log.message);
    setActiveTab("compose");
    toast.info(`Loaded message and recipient (${log.phone}) into composer`);
  };

  // Filtered logs for History Tab
  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.phone.includes(historySearch) || 
      log.message.toLowerCase().includes(historySearch.toLowerCase());
    
    if (!matchesSearch) return false;
    if (historyStatusFilter === "sent") return log.status === "sent";
    if (historyStatusFilter === "failed") return log.status === "failed";
    return true;
  });

  const deliveryRate = stats?.total && stats.total > 0
    ? Math.round(((stats.sent || 0) / stats.total) * 100)
    : 100;

  const getLogFailureReason = (log: SMSLog) => {
    if (log.status !== "failed") return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const resp = log.providerResponse as any;
    if (!resp) return "Delivery failed";
    
    const destStatus = resp?.data?.destinations?.[0]?.status;
    const label = destStatus?.label || resp?.handshake?.label || "";
    
    if (label === "DS_REJECTED_SENDER_UNREGISTERED") {
      return 'Sender ID "NovaCare" awaiting approval in SMSOnlineGH dashboard';
    }
    if (label === "HSHK_ERR_UA_AUTH") {
      return "API authentication failure on SMSOnlineGH";
    }
    if (label.includes("INSUFFICIENT") || label.includes("BALANCE") || label.includes("CREDIT")) {
      return "Insufficient SMS credits on SMSOnlineGH";
    }
    if (label.includes("DESTINATION") || label.includes("INVALID")) {
      return "Unreachable or invalid phone number";
    }
    return label ? `Provider error: ${label}` : "Provider delivery failed";
  };

  const hasSenderUnregisteredError = useMemo(() => {
    return logs.some(log => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const resp = log.providerResponse as any;
      const label = resp?.data?.destinations?.[0]?.status?.label;
      return label === "DS_REJECTED_SENDER_UNREGISTERED";
    });
  }, [logs]);

  return (
    <AdminLayout 
      title="SMS Communication Center" 
      subtitle="Broadcast clinical notices, schedule alerts, and manage direct patient messaging via SMSOnlineGH."
    >
      <div className="space-y-8 pb-12">
        {/* Unregistered Sender Warning Banner */}
        {hasSenderUnregisteredError && (
          <div className="p-4 sm:p-5 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row items-start gap-4 text-amber-950 shadow-sm animate-in fade-in duration-300">
            <div className="h-9 w-9 rounded-xl bg-amber-100 border border-amber-300/60 flex items-center justify-center text-amber-700 shrink-0">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div className="text-xs space-y-1.5 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-bold text-sm text-amber-950">
                  SMS Gateway Status: Sender ID &ldquo;NovaCare&rdquo; Awaiting Registration Approval
                </p>
                <Badge className="bg-amber-200/80 text-amber-900 border-amber-300 text-[10px] uppercase font-bold">
                  Action Required
                </Badge>
              </div>
              <p className="text-amber-800 leading-relaxed">
                Messages dispatched through your SMSOnlineGH gateway are failing with error code <code>DS_REJECTED_SENDER_UNREGISTERED</code>. 
                Under National Communications Authority (NCA) Ghana telecom regulations, custom alphanumeric sender names must be added and approved in your SMSOnlineGH account before network operators (MTN, Telecel, AT) permit message delivery.
              </p>
              <div className="pt-1 flex flex-wrap items-center gap-4">
                <a
                  href="https://www.smsonlinegh.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-amber-950 underline hover:text-black inline-flex items-center gap-1 text-xs"
                >
                  Open SMSOnlineGH Dashboard &rarr; SMS Messaging &rarr; Add Sender ID
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <Card className="p-5 border border-slate-200/80 shadow-sm hover:shadow-md bg-white rounded-2xl transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold text-slate-500 uppercase text-[11px] tracking-wider">Total Dispatches</span>
              <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <BarChart3 className="h-4 w-4" />
              </div>
            </div>
            <p className="text-3xl font-black text-slate-900 tracking-tight">{stats?.total || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">All outbound SMS attempts</p>
          </Card>

          <Card className="p-5 border border-emerald-100 shadow-sm hover:shadow-md bg-white rounded-2xl transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold text-emerald-600 uppercase text-[11px] tracking-wider">Delivered</span>
              <div className="h-9 w-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                <CheckCircle className="h-4 w-4" />
              </div>
            </div>
            <p className="text-3xl font-black text-emerald-600 tracking-tight">{stats?.sent || 0}</p>
            <div className="flex items-center gap-1.5 mt-1">
              <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none text-[10px] px-1.5 py-0 font-bold">
                {deliveryRate}% Rate
              </Badge>
              <span className="text-xs text-muted-foreground">Successful</span>
            </div>
          </Card>

          <Card className="p-5 border border-rose-100 shadow-sm hover:shadow-md bg-white rounded-2xl transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold text-rose-600 uppercase text-[11px] tracking-wider">Undelivered</span>
              <div className="h-9 w-9 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
                <XCircle className="h-4 w-4" />
              </div>
            </div>
            <p className="text-3xl font-black text-rose-600 tracking-tight">{stats?.failed || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">Rejected or invalid numbers</p>
          </Card>

          <Card className="p-5 border border-cyan-100 shadow-sm hover:shadow-md bg-white rounded-2xl transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold text-cyan-700 uppercase text-[11px] tracking-wider">Patient Reach</span>
              <div className="h-9 w-9 rounded-xl bg-cyan-50 border border-cyan-200 flex items-center justify-center text-cyan-700">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <p className="text-3xl font-black text-cyan-700 tracking-tight">{patientsWithPhones.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Patients with active phone numbers</p>
          </Card>
        </div>

        {/* Tabs for Compose vs History */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-slate-100 p-1.5 rounded-2xl mb-6 inline-flex border border-slate-200">
            <TabsTrigger 
              value="compose" 
              className="rounded-xl px-5 py-2.5 gap-2 text-sm font-semibold data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm"
            >
              <Send className="h-4 w-4" /> Compose & Send Message
            </TabsTrigger>
            <TabsTrigger 
              value="history" 
              className="rounded-xl px-5 py-2.5 gap-2 text-sm font-semibold data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm"
            >
              <History className="h-4 w-4" /> Message Delivery Logs ({logs.length})
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: COMPOSE */}
          <TabsContent value="compose" className="space-y-6 animate-in fade-in-50 duration-200">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Left 7 Columns: Form Controls */}
              <div className="lg:col-span-7 space-y-6">
                <Card className="p-6 sm:p-7 border border-slate-200/80 shadow-sm rounded-2xl bg-white space-y-6">
                  
                  {/* Step 1: Select Recipients */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b pb-3">
                      <div>
                        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                          <Users className="h-5 w-5 text-primary" />
                          1. Target Recipients
                        </h2>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Choose who receives this message dispatch
                        </p>
                      </div>
                      <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 px-3 py-1 font-semibold text-xs rounded-full">
                        {effectiveRecipientCount} {effectiveRecipientCount === 1 ? 'Recipient' : 'Recipients'} Selected
                      </Badge>
                    </div>

                    {/* Mode Selector Buttons */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <Button
                        type="button"
                        variant={recipientMode === "all" ? "default" : "outline"}
                        onClick={() => setRecipientMode("all")}
                        className="rounded-xl h-11 text-xs sm:text-sm font-semibold"
                      >
                        All Patients
                      </Button>
                      <Button
                        type="button"
                        variant={recipientMode === "selected" ? "default" : "outline"}
                        onClick={() => setRecipientMode("selected")}
                        className="rounded-xl h-11 text-xs sm:text-sm font-semibold relative"
                      >
                        Selected ({selectedPatientIds.length})
                      </Button>
                      <Button
                        type="button"
                        variant={recipientMode === "group" ? "default" : "outline"}
                        onClick={() => setRecipientMode("group")}
                        className="rounded-xl h-11 text-xs sm:text-sm font-semibold"
                      >
                        Patient Groups
                      </Button>
                      <Button
                        type="button"
                        variant={recipientMode === "custom" ? "default" : "outline"}
                        onClick={() => setRecipientMode("custom")}
                        className="rounded-xl h-11 text-xs sm:text-sm font-semibold"
                      >
                        Custom Number
                      </Button>
                    </div>

                    {/* Mode A: All Patients */}
                    {recipientMode === "all" && (
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3 text-sm text-slate-700">
                        <Users className="h-5 w-5 text-primary shrink-0" />
                        <div>
                          <p className="font-semibold">Broadcast to entire patient database</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            This message will be queued for all <strong>{patientsWithPhones.length}</strong> patients with registered phone numbers.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Mode B: Specific Patient Picker */}
                    {recipientMode === "selected" && (
                      <div className="space-y-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                          <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                            <Input
                              value={patientSearch}
                              onChange={(e) => setPatientSearch(e.target.value)}
                              placeholder="Search by name, phone or email..."
                              className="pl-9 h-9 text-xs bg-white rounded-lg"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <Button 
                              type="button" 
                              variant="outline" 
                              size="sm" 
                              onClick={selectAllFiltered}
                              className="h-9 text-xs rounded-lg bg-white"
                            >
                              Select All Filtered
                            </Button>
                            {selectedPatientIds.length > 0 && (
                              <Button 
                                type="button" 
                                variant="ghost" 
                                size="sm" 
                                onClick={clearSelection}
                                className="h-9 text-xs text-muted-foreground hover:text-rose-600 rounded-lg"
                              >
                                Clear
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Selected Chips */}
                        {selectedPatientIds.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto p-1">
                            {selectedPatientIds.map(id => {
                              const p = profiles.find(item => item.id === id);
                              if (!p) return null;
                              return (
                                <span 
                                  key={id}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-primary/10 text-primary border border-primary/20"
                                >
                                  {p.fullName || "Patient"} ({p.phone})
                                  <button
                                    type="button"
                                    onClick={() => togglePatient(id)}
                                    className="hover:text-rose-600 transition-colors"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </span>
                              );
                            })}
                          </div>
                        )}

                        {/* Patient List */}
                        <div className="max-h-52 overflow-y-auto divide-y divide-slate-200/80 bg-white rounded-xl border border-slate-200">
                          {profilesLoading ? (
                            <div className="p-8 text-center text-muted-foreground">
                              <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-primary" />
                              <p className="text-xs">Loading patient directory...</p>
                            </div>
                          ) : filteredPatients.length === 0 ? (
                            <div className="p-8 text-center text-xs text-muted-foreground">
                              No patients found matching "{patientSearch}"
                            </div>
                          ) : (
                            filteredPatients.map(patient => {
                              const isSelected = selectedPatientIds.includes(patient.id);
                              return (
                                <div
                                  key={patient.id}
                                  onClick={() => togglePatient(patient.id)}
                                  className={`p-2.5 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                                    isSelected ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-slate-50"
                                  }`}
                                >
                                  <div className="flex items-center gap-3 min-w-0">
                                    <div className={`h-5 w-5 rounded border flex items-center justify-center transition-colors ${
                                      isSelected ? "bg-primary border-primary text-white" : "border-slate-300 bg-white"
                                    }`}>
                                      {isSelected && <Check className="h-3 w-3" />}
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-xs font-bold text-slate-800 truncate">
                                        {patient.fullName || "Unnamed Patient"}
                                      </p>
                                      <p className="text-[11px] text-muted-foreground truncate">
                                        {patient.phone} {patient.email ? `• ${patient.email}` : ""}
                                      </p>
                                    </div>
                                  </div>
                                  {patient.registrationCompleted && (
                                    <Badge variant="secondary" className="text-[10px] bg-green-50 text-green-700 border-green-200 shrink-0">
                                      Registered
                                    </Badge>
                                  )}
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}

                    {/* Mode C: Group Filter */}
                    {recipientMode === "group" && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                        <div 
                          onClick={() => setSelectedGroup("registered")}
                          className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                            selectedGroup === "registered" 
                              ? "bg-white border-primary shadow-sm ring-1 ring-primary/30" 
                              : "bg-white/70 border-slate-200 hover:bg-white"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                              <UserCheck className="h-4 w-4 text-emerald-600" />
                              <span className="text-xs font-bold text-slate-800">Fully Registered</span>
                            </div>
                            <Badge className="bg-emerald-100 text-emerald-700 border-none text-[10px]">
                              {registeredPatients.length} Patients
                            </Badge>
                          </div>
                          <p className="text-[11px] text-muted-foreground">
                            Patients who have completed their initial clinical and EHR onboarding.
                          </p>
                        </div>

                        <div 
                          onClick={() => setSelectedGroup("pending_registration")}
                          className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                            selectedGroup === "pending_registration" 
                              ? "bg-white border-primary shadow-sm ring-1 ring-primary/30" 
                              : "bg-white/70 border-slate-200 hover:bg-white"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-amber-600" />
                              <span className="text-xs font-bold text-slate-800">Pending Registration</span>
                            </div>
                            <Badge className="bg-amber-100 text-amber-700 border-none text-[10px]">
                              {pendingPatients.length} Patients
                            </Badge>
                          </div>
                          <p className="text-[11px] text-muted-foreground">
                            Users who signed up but have not completed full clinical registration.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Mode D: Custom Numbers */}
                    {recipientMode === "custom" && (
                      <div className="space-y-2 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                        <label className="text-xs font-bold text-slate-700">
                          Direct Phone Number(s)
                        </label>
                        <Textarea
                          value={customPhonesInput}
                          onChange={(e) => setCustomPhonesInput(e.target.value)}
                          placeholder="e.g. 0241234567, 0559876543, 233240000000 (separate by comma or newline)"
                          rows={3}
                          className="rounded-xl border-slate-200 bg-white text-xs font-mono"
                        />
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                          <span>
                            Detected numbers: <strong className="text-primary">{parsedCustomPhones.length}</strong>
                          </span>
                          <span>Format: Ghana local (024X...) or International (23324X...)</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Step 2: Message Content */}
                  <div className="space-y-4 pt-2 border-t">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        2. Message Content
                      </h2>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-xs font-bold ${messageLength > 160 ? 'text-amber-600' : 'text-slate-500'}`}>
                          {messageLength} chars
                        </span>
                        <span className="text-slate-300">|</span>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-semibold text-slate-600 border-slate-300">
                          {smsSegments} SMS {smsSegments === 1 ? 'Unit' : 'Units'}
                        </Badge>
                      </div>
                    </div>

                    {/* Quick Templates */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-primary" />
                        Quick Clinical Templates
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {CLINICAL_TEMPLATES.map(tpl => {
                          const IconComp = tpl.icon;
                          return (
                            <button
                              key={tpl.id}
                              type="button"
                              onClick={() => applyTemplate(tpl.text)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-primary/10 hover:text-primary text-slate-700 rounded-lg transition-colors border border-slate-200"
                            >
                              <IconComp className="h-3.5 w-3.5 shrink-0" />
                              {tpl.title}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <Textarea 
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Type your clinical update, reminder, or general announcement here..."
                      rows={5}
                      className="rounded-xl border-slate-200 p-4 text-sm leading-relaxed focus-visible:ring-primary/20"
                    />

                    <p className="text-[11px] text-muted-foreground italic">
                      * Sender ID is set to <strong>NovaCare</strong> via SMSOnlineGH v5. Standard telecom SMS rates apply.
                    </p>
                  </div>

                  {/* Step 3: Dispatch Actions */}
                  <div className="pt-4 border-t flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                    <div className="text-xs text-muted-foreground space-y-0.5">
                      <div className="flex items-center gap-1.5 font-medium text-slate-700">
                        <Clock className="h-3.5 w-3.5 text-primary" />
                        Delivery: Immediate Dispatch
                      </div>
                      <p>
                        Total SMS Volume: <strong>{effectiveRecipientCount * smsSegments}</strong> message units
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {message && (
                        <Button 
                          type="button" 
                          variant="ghost" 
                          onClick={() => setMessage("")}
                          disabled={sending}
                          className="rounded-xl text-xs"
                        >
                          Clear
                        </Button>
                      )}
                      <Button 
                        type="button"
                        onClick={handleSend} 
                        disabled={sending || !message.trim() || effectiveRecipientCount === 0}
                        size="lg"
                        className="rounded-xl px-8 gap-2 font-bold shadow-sm"
                      >
                        {sending ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Dispatching...
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4" />
                            Send SMS ({effectiveRecipientCount})
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Right 5 Columns: Live Smartphone Mockup & Info Card */}
              <div className="lg:col-span-5 space-y-6">
                {/* Live Mockup */}
                <Card className="border border-slate-200/90 shadow-sm rounded-2xl p-6 bg-slate-50 flex flex-col items-center">
                  <div className="flex items-center justify-between w-full mb-4 px-1">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <Smartphone className="h-4 w-4 text-primary" />
                      Live Handset Preview
                    </h3>
                    <Badge variant="outline" className="text-[10px] bg-white">
                      Sender: NovaCare
                    </Badge>
                  </div>

                  {/* Phone Screen Frame */}
                  <div className="w-full max-w-[320px] rounded-[38px] p-3.5 bg-slate-900 shadow-xl border-4 border-slate-800">
                    {/* Speaker notch */}
                    <div className="h-4 w-28 bg-slate-800 rounded-full mx-auto mb-2 flex items-center justify-center">
                      <div className="h-1.5 w-8 bg-slate-700 rounded-full"></div>
                    </div>

                    {/* Inside Screen */}
                    <div className="bg-slate-100 rounded-[26px] overflow-hidden min-h-[380px] flex flex-col justify-between p-3.5 text-slate-800">
                      {/* Top App Header */}
                      <div className="text-center border-b border-slate-200 pb-2 mb-3">
                        <div className="h-10 w-10 rounded-full bg-primary text-white font-bold flex items-center justify-center mx-auto text-xs mb-1 shadow-sm">
                          NC
                        </div>
                        <p className="font-bold text-xs text-slate-800">NovaCare</p>
                        <p className="text-[9px] text-muted-foreground">SMS Notification</p>
                      </div>

                      {/* SMS Chat Bubble */}
                      <div className="flex-1 flex flex-col justify-start space-y-2">
                        <div className="text-[10px] text-center text-muted-foreground my-1">
                          Today • {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>

                        <div className="bg-white border border-slate-200 text-slate-800 p-3 rounded-2xl rounded-tl-sm text-xs leading-relaxed shadow-sm max-w-[95%]">
                          {message.trim() ? (
                            message
                          ) : (
                            <span className="text-slate-400 italic">
                              Your composed message will render here in real-time...
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Bottom Footer Note */}
                      <div className="pt-2 text-center text-[10px] text-slate-400 border-t border-slate-200">
                        SMSOnlineGH • Direct Telecom Route
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Best Practice Tips */}
                <Card className="p-5 border border-slate-200/80 shadow-sm rounded-2xl bg-white space-y-2.5">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-primary" />
                    SMS Best Practices
                  </h4>
                  <ul className="text-xs text-muted-foreground space-y-1.5 pl-4 list-disc">
                    <li>Keep messages concise under <strong>160 characters</strong> to prevent multiple billing units.</li>
                    <li>Always include Nova Eye Care contact info (e.g. <code>0544172089</code>) for patient callbacks.</li>
                    <li>Verify phone numbers for patients whose messages previously bounced or failed.</li>
                  </ul>
                </Card>
              </div>

            </div>
          </TabsContent>

          {/* TAB 2: MESSAGE HISTORY */}
          <TabsContent value="history" className="animate-in fade-in-50 duration-200">
            <Card className="border border-slate-200/80 shadow-sm rounded-2xl overflow-hidden bg-white">
              
              {/* Table Controls */}
              <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50">
                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                  <div className="relative w-full sm:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      value={historySearch}
                      onChange={(e) => setHistorySearch(e.target.value)}
                      placeholder="Search recipient phone or content..."
                      className="pl-9 rounded-xl border-slate-200 bg-white h-10 text-xs"
                    />
                  </div>

                  {/* Status Filter Chips */}
                  <div className="flex items-center bg-white border border-slate-200 p-0.5 rounded-xl text-xs">
                    <button
                      type="button"
                      onClick={() => setHistoryStatusFilter("all")}
                      className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                        historyStatusFilter === "all" ? "bg-primary text-white" : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      All ({logs.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setHistoryStatusFilter("sent")}
                      className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                        historyStatusFilter === "sent" ? "bg-emerald-600 text-white" : "text-slate-600 hover:text-emerald-700"
                      }`}
                    >
                      Delivered
                    </button>
                    <button
                      type="button"
                      onClick={() => setHistoryStatusFilter("failed")}
                      className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                        historyStatusFilter === "failed" ? "bg-rose-600 text-white" : "text-slate-600 hover:text-rose-700"
                      }`}
                    >
                      Failed
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {stats?.failed && stats.failed > 0 ? (
                    <Button 
                      type="button"
                      variant="outline" 
                      onClick={() => openClearConfirm("failed")} 
                      size="sm" 
                      className="gap-1.5 text-rose-600 border-rose-200 hover:bg-rose-50 rounded-xl h-10 text-xs font-semibold"
                      title="Delete all failed message dispatch records"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Clear Failed ({stats.failed})
                    </Button>
                  ) : null}

                  {logs.length > 0 && (
                    <Button 
                      type="button"
                      variant="outline" 
                      onClick={() => openClearConfirm("all")} 
                      size="sm" 
                      className="gap-1.5 text-slate-600 border-slate-200 hover:bg-rose-50 hover:text-rose-600 rounded-xl h-10 text-xs"
                      title="Clear all message records"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Clear All History
                    </Button>
                  )}

                  <Button 
                    type="button"
                    variant="outline" 
                    onClick={fetchData} 
                    size="sm" 
                    className="gap-2 text-slate-600 rounded-xl h-10 border-slate-200 hover:bg-white"
                  >
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
                  </Button>
                </div>
              </div>

              {/* Logs Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      <th className="p-4">Recipient</th>
                      <th className="p-4">Message Content</th>
                      <th className="p-4 text-center">Status</th>
                      <th className="p-4 text-right">Sent Date</th>
                      <th className="p-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {loading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <tr key={i} className="animate-pulse">
                          <td className="p-4"><div className="h-4 w-28 bg-slate-200 rounded"></div></td>
                          <td className="p-4"><div className="h-4 w-72 bg-slate-200 rounded"></div></td>
                          <td className="p-4 text-center"><div className="h-4 w-16 bg-slate-200 rounded mx-auto"></div></td>
                          <td className="p-4 text-right"><div className="h-4 w-28 bg-slate-200 rounded ml-auto"></div></td>
                          <td className="p-4 text-right"><div className="h-4 w-12 bg-slate-200 rounded ml-auto"></div></td>
                        </tr>
                      ))
                    ) : filteredLogs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-16 text-center text-muted-foreground">
                          <History className="h-10 w-10 mx-auto mb-3 opacity-25 text-slate-400" />
                          <p className="font-medium">No message records found.</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Dispatched messages and provider receipts will appear here.
                          </p>
                        </td>
                      </tr>
                    ) : (
                      filteredLogs.map((log) => {
                        const matchedPatient = profiles.find(p => p.phone && p.phone.trim() === log.phone);

                        return (
                          <tr key={log.id} className="hover:bg-slate-50/80 transition-colors group">
                            <td className="p-4">
                              <p className="font-bold text-slate-900 font-mono text-xs">{log.phone}</p>
                              {matchedPatient && (
                                <p className="text-[11px] text-muted-foreground">
                                  {matchedPatient.fullName}
                                </p>
                              )}
                            </td>
                            <td className="p-4 max-w-md">
                              <p className="text-slate-700 leading-relaxed break-words">{log.message}</p>
                            </td>
                            <td className="p-4 text-center">
                              {log.status === 'sent' ? (
                                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 rounded-full font-bold uppercase text-[10px] px-2.5 py-0.5">
                                  Delivered
                                </Badge>
                              ) : (
                                <div className="space-y-1">
                                  <Badge variant="destructive" className="bg-rose-50 text-rose-700 border-rose-200 rounded-full font-bold uppercase text-[10px] px-2.5 py-0.5">
                                    Failed
                                  </Badge>
                                  <p className="text-[10px] text-rose-600 font-medium max-w-[200px] leading-tight mx-auto">
                                    {getLogFailureReason(log)}
                                  </p>
                                </div>
                              )}
                            </td>
                            <td className="p-4 text-right text-slate-500 font-medium">
                              <div>{new Date(log.createdAt).toLocaleDateString()}</div>
                              <div className="text-[10px] text-muted-foreground">
                                {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </td>
                            <td className="p-4 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleResendLog(log)}
                                  className="h-8 px-2.5 text-xs text-primary hover:text-primary hover:bg-primary/10 rounded-lg gap-1"
                                >
                                  <RotateCcw className="h-3.5 w-3.5" />
                                  Reuse
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteLog(log.id)}
                                  className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                  title="Delete log entry"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Clear Logs Confirmation Dialog */}
        <Dialog open={isClearDialogOpen} onOpenChange={setIsClearDialogOpen}>
          <DialogContent className="max-w-md rounded-2xl p-6">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold flex items-center gap-2 text-rose-600">
                <Trash2 className="h-5 w-5 text-rose-600" />
                {clearType === "failed" ? "Clear Failed SMS Logs?" : "Clear All SMS History Logs?"}
              </DialogTitle>
              <DialogDescription className="mt-2 text-slate-600 leading-relaxed text-xs">
                {clearType === "failed" 
                  ? "Are you sure you want to permanently delete all failed SMS dispatch records? This cannot be undone."
                  : "Are you sure you want to permanently delete all SMS dispatch history records from the system? This action cannot be undone."
                }
              </DialogDescription>
            </DialogHeader>

            <div className="flex justify-end gap-3 pt-4 border-t mt-4">
              <Button 
                type="button" 
                variant="outline" 
                className="rounded-xl text-xs"
                onClick={() => setIsClearDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                type="button" 
                className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs"
                onClick={handleConfirmClearLogs}
                disabled={clearing}
              >
                {clearing ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Clearing...
                  </>
                ) : (
                  clearType === "failed" ? "Delete Failed Logs" : "Delete All Logs"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
