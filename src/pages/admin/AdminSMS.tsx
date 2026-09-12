import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { apiService, Profile, SMSLog, SMSStats } from "@/lib/api";
import { 
  Send, History, Loader2, Search, CheckCircle, XCircle, 
  Clock, Users, RefreshCw, Sparkles, Check, 
  RotateCcw, UserCheck, Calendar, FileText, Glasses,
  AlertCircle, X, Trash2
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

type RecipientMode = "all" | "selected" | "group" | "custom";
type GroupFilter = "registered" | "pending_registration" | "appointments";

const MESSAGE_TEMPLATES = [
  {
    id: "reminder",
    title: "Appointment Reminder",
    icon: Calendar,
    text: "Reminder: You have an upcoming eye consultation at Nova Eye Care. Please arrive 10 minutes before your time. Call 0544172089 if you need to reschedule."
  },
  {
    id: "results",
    title: "Test Results Ready",
    icon: FileText,
    text: "Hello, your eye examination results are now ready to view in your Nova Eye Care patient portal at novaeyecareservice.com."
  },
  {
    id: "glasses",
    title: "Glasses Ready",
    icon: Glasses,
    text: "Your prescription glasses / lenses are ready for pickup at Nova Eye Care. You can collect them Monday to Saturday during clinic hours."
  },
  {
    id: "checkup",
    title: "Checkup Reminder",
    icon: Sparkles,
    text: "Hello from Nova Eye Care. It has been over 6 months since your last eye check. Protect your eyesight by booking a routine visit."
  },
  {
    id: "hours",
    title: "Working Hours",
    icon: Clock,
    text: "Nova Eye Care is open Monday to Friday from 8:00 AM to 5:00 PM, and Saturday from 9:00 AM to 2:00 PM. Call 0544172089 for bookings."
  }
];

export default function AdminSMS() {
  const [searchParams] = useSearchParams();

  const [logs, setLogs] = useState<SMSLog[]>([]);
  const [stats, setStats] = useState<SMSStats | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [profilesLoading, setProfilesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  
  // Composer
  const [recipientMode, setRecipientMode] = useState<RecipientMode>("all");
  const [selectedGroup, setSelectedGroup] = useState<GroupFilter>("registered");
  const [selectedPatientIds, setSelectedPatientIds] = useState<string[]>([]);
  const [customPhonesInput, setCustomPhonesInput] = useState("");
  const [patientSearch, setPatientSearch] = useState("");
  const [message, setMessage] = useState("");

  // History Filter
  const [historySearch, setHistorySearch] = useState("");
  const [historyStatusFilter, setHistoryStatusFilter] = useState<"all" | "sent" | "failed">("all");
  const [activeTab, setActiveTab] = useState("compose");

  // Modal State
  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);
  const [clearType, setClearType] = useState<"failed" | "all">("failed");
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    const phoneParam = searchParams.get("phone");
    const nameParam = searchParams.get("name");

    if (phoneParam) {
      setRecipientMode("custom");
      setCustomPhonesInput(phoneParam);
      setActiveTab("compose");
      if (nameParam) {
        toast.info(`Sending message to ${nameParam} (${phoneParam})`);
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
    } catch {
      toast.error("Failed to load SMS records");
    } finally {
      setLoading(false);
    }
  };

  const loadProfiles = async () => {
    setProfilesLoading(true);
    try {
      const data = await apiService.profiles.getAll({ role: "patient" });
      setProfiles((data || []).filter(p => p.role !== 'admin' && p.role !== 'super_admin'));
    } catch {
      console.error("Failed to load patient contacts");
    } finally {
      setProfilesLoading(false);
    }
  };

  const patientsWithPhones = useMemo(() => {
    return profiles.filter(p => p.phone && p.phone.trim().length >= 8);
  }, [profiles]);

  const registeredPatients = useMemo(() => {
    return patientsWithPhones.filter(p => p.registrationCompleted);
  }, [patientsWithPhones]);

  const pendingPatients = useMemo(() => {
    return patientsWithPhones.filter(p => !p.registrationCompleted);
  }, [patientsWithPhones]);

  const filteredPatients = useMemo(() => {
    if (!patientSearch.trim()) return patientsWithPhones;
    const q = patientSearch.toLowerCase();
    return patientsWithPhones.filter(p => 
      (p.fullName && p.fullName.toLowerCase().includes(q)) ||
      (p.phone && p.phone.includes(q)) ||
      (p.email && p.email.toLowerCase().includes(q))
    );
  }, [patientsWithPhones, patientSearch]);

  const parsedCustomPhones = useMemo(() => {
    if (!customPhonesInput.trim()) return [];
    return [...new Set(
      customPhonesInput
        .split(/[\n,;]+/)
        .map(p => p.replace(/\s+/g, "").trim())
        .filter(p => p.length >= 8)
    )];
  }, [customPhonesInput]);

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
  };

  const messageLength = message.length;
  const smsUnits = Math.max(1, Math.ceil(messageLength / 160));

  const handleSend = async () => {
    if (!message.trim()) {
      toast.error("Please type a message first");
      return;
    }

    if (effectiveRecipientCount === 0) {
      toast.error("Please select at least one recipient");
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
        recipientPayload = profiles
          .filter(p => selectedPatientIds.includes(p.id) && p.phone)
          .map(p => p.phone.trim());
      } else {
        recipientPayload = parsedCustomPhones;
      }

      const result = await apiService.sms.sendBulk({
        message: message.trim(),
        recipients: recipientPayload
      });

      toast.success(result.message || "Message sent successfully");
      setMessage("");
      if (recipientMode === "custom") {
        setCustomPhonesInput("");
      }
      fetchData();
      setActiveTab("history");
    } catch (error: unknown) {
      let errorMsg = "Could not send SMS";
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
    toast.info(`Loaded message to ${log.phone}`);
  };

  const handleDeleteLog = async (id: number) => {
    try {
      await apiService.sms.deleteLog(id);
      toast.success("Message removed");
      setLogs(prev => prev.filter(l => l.id !== id));
      fetchData();
    } catch {
      toast.error("Could not delete message");
    }
  };

  const openClearConfirm = (type: "failed" | "all") => {
    setClearType(type);
    setIsClearDialogOpen(true);
  };

  const handleConfirmClearLogs = async () => {
    setClearing(true);
    try {
      const res = await apiService.sms.clearLogs(clearType);
      toast.success(res.message || "Messages cleared");
      setIsClearDialogOpen(false);
      fetchData();
    } catch {
      toast.error("Could not clear messages");
    } finally {
      setClearing(false);
    }
  };

  const getLogFailureReason = (log: SMSLog) => {
    if (log.status !== "failed") return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const resp = log.providerResponse as any;
    if (!resp) return "Delivery failed";
    
    const destStatus = resp?.data?.destinations?.[0]?.status;
    const label = destStatus?.label || resp?.handshake?.label || "";
    
    if (label === "DS_REJECTED_SENDER_UNREGISTERED") {
      return 'Sender ID "NovaCare" awaiting approval on SMSOnlineGH';
    }
    if (label === "HSHK_ERR_UA_AUTH") {
      return "SMSOnlineGH API key error";
    }
    if (label.includes("INSUFFICIENT") || label.includes("BALANCE") || label.includes("CREDIT")) {
      return "Low SMS balance on SMSOnlineGH";
    }
    if (label.includes("DESTINATION") || label.includes("INVALID")) {
      return "Invalid phone number";
    }
    return label ? `Error: ${label}` : "Failed to deliver";
  };

  const hasSenderUnregisteredError = useMemo(() => {
    return logs.some(log => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const resp = log.providerResponse as any;
      const label = resp?.data?.destinations?.[0]?.status?.label;
      return label === "DS_REJECTED_SENDER_UNREGISTERED";
    });
  }, [logs]);

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.phone.includes(historySearch) || 
      log.message.toLowerCase().includes(historySearch.toLowerCase());
    
    if (!matchesSearch) return false;
    if (historyStatusFilter === "sent") return log.status === "sent";
    if (historyStatusFilter === "failed") return log.status === "failed";
    return true;
  });

  return (
    <AdminLayout 
      title="SMS Messages" 
      subtitle="Send appointment reminders, test results, and clinic announcements to your patients."
    >
      <div className="space-y-6 pb-12">
        {/* Simple Status Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 border rounded-xl bg-white shadow-none">
            <p className="text-xs text-muted-foreground font-medium">Total Sent</p>
            <p className="text-2xl font-bold mt-1">{stats?.total || 0}</p>
          </Card>

          <Card className="p-4 border rounded-xl bg-white shadow-none">
            <p className="text-xs text-emerald-600 font-medium">Delivered</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{stats?.sent || 0}</p>
          </Card>

          <Card className="p-4 border rounded-xl bg-white shadow-none">
            <p className="text-xs text-rose-600 font-medium">Failed</p>
            <p className="text-2xl font-bold text-rose-600 mt-1">{stats?.failed || 0}</p>
          </Card>

          <Card className="p-4 border rounded-xl bg-white shadow-none">
            <p className="text-xs text-muted-foreground font-medium">Patients with Phone</p>
            <p className="text-2xl font-bold mt-1">{patientsWithPhones.length}</p>
          </Card>
        </div>

        {/* Sender ID Warning (Simple & Human) */}
        {hasSenderUnregisteredError && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 text-amber-900 text-sm">
            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-amber-950">
                Notice: The sender name &ldquo;NovaCare&rdquo; needs approval on SMSOnlineGH
              </p>
              <p className="text-amber-800 text-xs leading-relaxed">
                Messages to Ghanaian networks require the sender name to be registered first. Log in at{" "}
                <a 
                  href="https://www.smsonlinegh.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="font-semibold underline hover:text-amber-950"
                >
                  smsonlinegh.com
                </a>{" "}
                under <em>SMS Messaging &rarr; Sender Names</em> to add &ldquo;NovaCare&rdquo;.
              </p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-slate-100 p-1 rounded-xl mb-4 inline-flex">
            <TabsTrigger 
              value="compose" 
              className="rounded-lg px-4 py-2 text-xs font-semibold data-[state=active]:bg-white"
            >
              <Send className="h-3.5 w-3.5 mr-1.5" /> Send Message
            </TabsTrigger>
            <TabsTrigger 
              value="history" 
              className="rounded-lg px-4 py-2 text-xs font-semibold data-[state=active]:bg-white"
            >
              <History className="h-3.5 w-3.5 mr-1.5" /> Sent History ({logs.length})
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: COMPOSE */}
          <TabsContent value="compose" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Main Composer */}
              <div className="lg:col-span-2 space-y-5">
                <Card className="p-6 border rounded-xl bg-white shadow-none space-y-5">
                  
                  {/* Recipient Selection */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                        Choose Recipients
                      </label>
                      <span className="text-xs text-muted-foreground font-medium">
                        {effectiveRecipientCount} {effectiveRecipientCount === 1 ? 'person' : 'people'} selected
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <Button
                        type="button"
                        variant={recipientMode === "all" ? "default" : "outline"}
                        onClick={() => setRecipientMode("all")}
                        size="sm"
                        className="rounded-lg text-xs"
                      >
                        All Patients ({patientsWithPhones.length})
                      </Button>
                      <Button
                        type="button"
                        variant={recipientMode === "selected" ? "default" : "outline"}
                        onClick={() => setRecipientMode("selected")}
                        size="sm"
                        className="rounded-lg text-xs"
                      >
                        Select Patients {selectedPatientIds.length > 0 && `(${selectedPatientIds.length})`}
                      </Button>
                      <Button
                        type="button"
                        variant={recipientMode === "group" ? "default" : "outline"}
                        onClick={() => setRecipientMode("group")}
                        size="sm"
                        className="rounded-lg text-xs"
                      >
                        Patient Groups
                      </Button>
                      <Button
                        type="button"
                        variant={recipientMode === "custom" ? "default" : "outline"}
                        onClick={() => setRecipientMode("custom")}
                        size="sm"
                        className="rounded-lg text-xs"
                      >
                        Custom Number
                      </Button>
                    </div>

                    {/* Mode A: All Patients */}
                    {recipientMode === "all" && (
                      <div className="p-3 bg-slate-50 border rounded-lg text-xs text-slate-600">
                        Will be sent to all <strong>{patientsWithPhones.length}</strong> patients with a valid phone number.
                      </div>
                    )}

                    {/* Mode B: Patient Checklist */}
                    {recipientMode === "selected" && (
                      <div className="space-y-2 p-3 bg-slate-50 border rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className="relative flex-1">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                            <Input
                              value={patientSearch}
                              onChange={(e) => setPatientSearch(e.target.value)}
                              placeholder="Search by patient name or phone..."
                              className="pl-8 h-8 text-xs bg-white"
                            />
                          </div>
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm" 
                            onClick={selectAllFiltered}
                            className="h-8 text-xs"
                          >
                            Select All
                          </Button>
                          {selectedPatientIds.length > 0 && (
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="sm" 
                              onClick={clearSelection}
                              className="h-8 text-xs text-rose-600"
                            >
                              Clear
                            </Button>
                          )}
                        </div>

                        {/* Selected Chips */}
                        {selectedPatientIds.length > 0 && (
                          <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto py-1">
                            {selectedPatientIds.map(id => {
                              const p = profiles.find(item => item.id === id);
                              if (!p) return null;
                              return (
                                <span 
                                  key={id}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-white border text-slate-700 font-medium"
                                >
                                  {p.fullName || "Patient"} ({p.phone})
                                  <button
                                    type="button"
                                    onClick={() => togglePatient(id)}
                                    className="hover:text-rose-600"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </span>
                              );
                            })}
                          </div>
                        )}

                        {/* List */}
                        <div className="max-h-48 overflow-y-auto divide-y bg-white rounded border">
                          {profilesLoading ? (
                            <div className="p-4 text-center text-xs text-muted-foreground">
                              Loading patients...
                            </div>
                          ) : filteredPatients.length === 0 ? (
                            <div className="p-4 text-center text-xs text-muted-foreground">
                              No matching patients found
                            </div>
                          ) : (
                            filteredPatients.map(patient => {
                              const isSelected = selectedPatientIds.includes(patient.id);
                              return (
                                <div
                                  key={patient.id}
                                  onClick={() => togglePatient(patient.id)}
                                  className={`p-2 flex items-center justify-between gap-2 cursor-pointer text-xs ${
                                    isSelected ? "bg-primary/5" : "hover:bg-slate-50"
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <div className={`h-4 w-4 rounded border flex items-center justify-center ${
                                      isSelected ? "bg-primary border-primary text-white" : "border-slate-300"
                                    }`}>
                                      {isSelected && <Check className="h-3 w-3" />}
                                    </div>
                                    <span className="font-medium text-slate-800">
                                      {patient.fullName || "Patient"}
                                    </span>
                                    <span className="text-muted-foreground font-mono">
                                      {patient.phone}
                                    </span>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}

                    {/* Mode C: Groups */}
                    {recipientMode === "group" && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 border rounded-lg">
                        <button 
                          type="button"
                          onClick={() => setSelectedGroup("registered")}
                          className={`p-3 rounded-lg border text-left transition-colors ${
                            selectedGroup === "registered" 
                              ? "bg-white border-primary shadow-xs" 
                              : "bg-white/60 border-slate-200"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold text-slate-800">Registered Patients</span>
                            <Badge variant="secondary" className="text-[10px]">
                              {registeredPatients.length}
                            </Badge>
                          </div>
                          <p className="text-[11px] text-muted-foreground">
                            Patients with complete profile records.
                          </p>
                        </button>

                        <button 
                          type="button"
                          onClick={() => setSelectedGroup("pending_registration")}
                          className={`p-3 rounded-lg border text-left transition-colors ${
                            selectedGroup === "pending_registration" 
                              ? "bg-white border-primary shadow-xs" 
                              : "bg-white/60 border-slate-200"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold text-slate-800">Pending Registration</span>
                            <Badge variant="secondary" className="text-[10px]">
                              {pendingPatients.length}
                            </Badge>
                          </div>
                          <p className="text-[11px] text-muted-foreground">
                            Users who signed up but haven't finished registering.
                          </p>
                        </button>
                      </div>
                    )}

                    {/* Mode D: Custom Numbers */}
                    {recipientMode === "custom" && (
                      <div className="space-y-1.5 p-3 bg-slate-50 border rounded-lg">
                        <Textarea
                          value={customPhonesInput}
                          onChange={(e) => setCustomPhonesInput(e.target.value)}
                          placeholder="Type or paste phone numbers, e.g. 0241234567, 0559876543"
                          rows={2}
                          className="bg-white text-xs font-mono"
                        />
                        <p className="text-[11px] text-muted-foreground">
                          {parsedCustomPhones.length} valid numbers detected (Ghana format: 024X... or 233X...)
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Message Content */}
                  <div className="space-y-3 pt-3 border-t">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                        Message
                      </label>
                      <span className={`text-xs ${messageLength > 160 ? 'text-amber-600 font-semibold' : 'text-muted-foreground'}`}>
                        {messageLength} / 160 characters ({smsUnits} {smsUnits === 1 ? 'credit' : 'credits'})
                      </span>
                    </div>

                    {/* Quick Templates */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-xs text-muted-foreground mr-1">Templates:</span>
                      {MESSAGE_TEMPLATES.map(tpl => (
                        <button
                          key={tpl.id}
                          type="button"
                          onClick={() => applyTemplate(tpl.text)}
                          className="px-2.5 py-1 text-xs rounded border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors"
                        >
                          {tpl.title}
                        </button>
                      ))}
                    </div>

                    <Textarea 
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Write your SMS message here..."
                      rows={4}
                      className="text-sm"
                    />
                  </div>

                  {/* Submit Bar */}
                  <div className="pt-3 border-t flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      Sending via <strong>NovaCare</strong>
                    </p>

                    <div className="flex items-center gap-2">
                      {message && (
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setMessage("")}
                          disabled={sending}
                          className="text-xs"
                        >
                          Clear
                        </Button>
                      )}
                      <Button 
                        type="button"
                        onClick={handleSend} 
                        disabled={sending || !message.trim() || effectiveRecipientCount === 0}
                        className="rounded-xl px-6 font-semibold"
                      >
                        {sending ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4 mr-1.5" />
                            Send ({effectiveRecipientCount})
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Sidebar: Clean Preview & Info */}
              <div className="space-y-4">
                <Card className="p-5 border rounded-xl bg-white shadow-none space-y-3">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                    Message Preview
                  </h3>
                  
                  <div className="p-3.5 bg-slate-50 border rounded-lg text-xs leading-relaxed text-slate-800">
                    {message.trim() ? (
                      message
                    ) : (
                      <span className="text-muted-foreground italic">
                        Type a message to see how it reads...
                      </span>
                    )}
                  </div>

                  <div className="text-[11px] text-muted-foreground space-y-1 pt-2 border-t">
                    <p>• Standard messages are 160 characters per SMS credit.</p>
                    <p>• Recipient phones receive messages from <strong>NovaCare</strong>.</p>
                    <p>• Include the clinic phone (0544172089) for patient enquiries.</p>
                  </div>
                </Card>
              </div>

            </div>
          </TabsContent>

          {/* TAB 2: HISTORY */}
          <TabsContent value="history">
            <Card className="border rounded-xl overflow-hidden bg-white shadow-none">
              
              {/* Header Actions */}
              <div className="p-4 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50/50">
                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input 
                      value={historySearch}
                      onChange={(e) => setHistorySearch(e.target.value)}
                      placeholder="Search phone or text..."
                      className="pl-8 h-9 text-xs bg-white"
                    />
                  </div>

                  <div className="flex items-center bg-white border p-0.5 rounded-lg text-xs">
                    <button
                      type="button"
                      onClick={() => setHistoryStatusFilter("all")}
                      className={`px-2.5 py-1 rounded font-medium ${
                        historyStatusFilter === "all" ? "bg-slate-900 text-white" : "text-slate-600"
                      }`}
                    >
                      All ({logs.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setHistoryStatusFilter("sent")}
                      className={`px-2.5 py-1 rounded font-medium ${
                        historyStatusFilter === "sent" ? "bg-emerald-600 text-white" : "text-slate-600"
                      }`}
                    >
                      Delivered
                    </button>
                    <button
                      type="button"
                      onClick={() => setHistoryStatusFilter("failed")}
                      className={`px-2.5 py-1 rounded font-medium ${
                        historyStatusFilter === "failed" ? "bg-rose-600 text-white" : "text-slate-600"
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
                      className="text-rose-600 border-rose-200 hover:bg-rose-50 h-9 text-xs"
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" /> Clear Failed ({stats.failed})
                    </Button>
                  ) : null}

                  {logs.length > 0 && (
                    <Button 
                      type="button"
                      variant="outline" 
                      onClick={() => openClearConfirm("all")} 
                      size="sm" 
                      className="text-slate-600 h-9 text-xs"
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" /> Clear All
                    </Button>
                  )}

                  <Button 
                    type="button"
                    variant="outline" 
                    onClick={fetchData} 
                    size="sm" 
                    className="h-9 text-xs"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 mr-1 ${loading ? 'animate-spin' : ''}`} /> Refresh
                  </Button>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      <th className="p-3.5">Recipient</th>
                      <th className="p-3.5">Message</th>
                      <th className="p-3.5 text-center">Status</th>
                      <th className="p-3.5 text-right">Sent Date</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loading ? (
                      Array.from({ length: 4 }).map((_, i) => (
                        <tr key={i} className="animate-pulse">
                          <td className="p-3.5"><div className="h-3.5 w-24 bg-slate-200 rounded"></div></td>
                          <td className="p-3.5"><div className="h-3.5 w-60 bg-slate-200 rounded"></div></td>
                          <td className="p-3.5 text-center"><div className="h-3.5 w-16 bg-slate-200 rounded mx-auto"></div></td>
                          <td className="p-3.5 text-right"><div className="h-3.5 w-24 bg-slate-200 rounded ml-auto"></div></td>
                          <td className="p-3.5 text-right"><div className="h-3.5 w-12 bg-slate-200 rounded ml-auto"></div></td>
                        </tr>
                      ))
                    ) : filteredLogs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-12 text-center text-muted-foreground">
                          No messages found.
                        </td>
                      </tr>
                    ) : (
                      filteredLogs.map((log) => {
                        const matchedPatient = profiles.find(p => p.phone && p.phone.trim() === log.phone);

                        return (
                          <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="p-3.5">
                              <p className="font-semibold text-slate-800 font-mono">{log.phone}</p>
                              {matchedPatient && (
                                <p className="text-[11px] text-muted-foreground">
                                  {matchedPatient.fullName}
                                </p>
                              )}
                            </td>
                            <td className="p-3.5 max-w-sm">
                              <p className="text-slate-700 leading-normal">{log.message}</p>
                            </td>
                            <td className="p-3.5 text-center">
                              {log.status === 'sent' ? (
                                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-semibold">
                                  Delivered
                                </Badge>
                              ) : (
                                <div className="space-y-0.5">
                                  <Badge variant="destructive" className="bg-rose-50 text-rose-700 border-rose-200 text-[10px] font-semibold">
                                    Failed
                                  </Badge>
                                  <p className="text-[10px] text-rose-600 max-w-[180px] mx-auto leading-tight">
                                    {getLogFailureReason(log)}
                                  </p>
                                </div>
                              )}
                            </td>
                            <td className="p-3.5 text-right text-muted-foreground">
                              <div>{new Date(log.createdAt).toLocaleDateString()}</div>
                              <div className="text-[10px]">
                                {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </td>
                            <td className="p-3.5 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleResendLog(log)}
                                  className="h-7 px-2 text-xs text-primary hover:bg-primary/10"
                                >
                                  <RotateCcw className="h-3 w-3 mr-1" />
                                  Resend
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteLog(log.id)}
                                  className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                                  title="Delete"
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

        {/* Clear Confirmation Modal */}
        <Dialog open={isClearDialogOpen} onOpenChange={setIsClearDialogOpen}>
          <DialogContent className="max-w-md p-6">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-slate-900">
                {clearType === "failed" ? "Clear Failed Messages" : "Clear All Messages"}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-600 mt-1">
                {clearType === "failed" 
                  ? "Are you sure you want to delete all failed SMS records from the list?"
                  : "Are you sure you want to delete all SMS delivery records?"
                }
              </DialogDescription>
            </DialogHeader>

            <div className="flex justify-end gap-2 pt-4 border-t mt-3">
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                className="text-xs"
                onClick={() => setIsClearDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                type="button" 
                size="sm"
                className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold"
                onClick={handleConfirmClearLogs}
                disabled={clearing}
              >
                {clearing ? "Clearing..." : "Delete"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
