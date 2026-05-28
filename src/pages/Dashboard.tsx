import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import {
  apiService,
  Appointment,
  Profile as GlobalProfile,
  Screening,
  Prescription,
  Invoice,
  MedicalHistory
} from "@/lib/api";
import { TIME_SLOTS_WEEKDAY, TIME_SLOTS_SATURDAY } from "@/lib/clinic";
import { toast } from "sonner";
import {
  CalendarPlus, CalendarX, Calendar, Clock, FileText, Loader2,
  User, Star, RefreshCw, ShieldCheck, ArrowRight, History, Eye,
  CheckCircle2, ChevronRight, LayoutDashboard, CreditCard, ClipboardList,
  LogOut, Settings, Bell, Menu, X
} from "lucide-react";
import { cn } from "@/lib/utils";

// Using types from api.ts

const statusStyles: Record<Appointment["status"], string> = {
  pending: "bg-yellow-100 text-yellow-900 border-yellow-200",
  confirmed: "bg-blue-100 text-blue-900 border-blue-200",
  cancelled: "bg-slate-100 text-slate-600 border-slate-200",
  completed: "bg-green-100 text-green-900 border-green-200",
};

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<GlobalProfile | null>(null);
  const [medicalHistory, setMedicalHistory] = useState<MedicalHistory | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [screenings, setScreenings] = useState<Screening[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [reschedule, setReschedule] = useState<Appointment | null>(null);
  const [rNew, setRNew] = useState({ date: "", time: "" });
  const [rSaving, setRSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "profile" | "appointments" | "records" | "billing">("overview");

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const [appts, prof, screens, pres, inv, medHist] = await Promise.all([
          apiService.appointments.getAll(),
          apiService.profiles.getMe(),
          apiService.medical.getScreenings(),
          apiService.prescriptions.mine(),
          apiService.invoices.mine(),
          apiService.medical.getHistory()
        ]);
        
        setAppointments(appts || []);
        setProfile(prof || null);
        setScreenings(screens || []);
        setPrescriptions(pres || []);
        setInvoices(inv || []);
        setMedicalHistory((medHist as MedicalHistory) || null);
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
        toast.error("Could not load dashboard information.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const cancelAppointment = async (a: Appointment) => {
    if (!confirm("Cancel this appointment?")) return;
    try {
      await apiService.appointments.updateStatus(a.id, "cancelled");
      toast.success("Appointment cancelled");
      // Refresh local state
      setAppointments(prev => prev.map(apt => apt.id === a.id ? { ...apt, status: "cancelled" } : apt));
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || "Failed to cancel appointment");
    }
  };

  const submitReschedule = async () => {
    if (!reschedule || !rNew.date || !rNew.time) return;
    setRSaving(true);
    try {
      await apiService.appointments.update(reschedule.id, {
        appointmentDate: rNew.date,
        appointmentTime: rNew.time
      });
      toast.success("Rescheduled — awaiting confirmation");
      // Refresh local state or refetch
      setAppointments(prev => prev.map(apt => apt.id === reschedule.id ? { 
        ...apt, 
        appointmentDate: rNew.date, 
        appointmentTime: rNew.time,
        status: "pending" 
      } : apt));
      setReschedule(null);
      setRNew({ date: "", time: "" });
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || "Failed to reschedule");
    } finally {
      setRSaving(false);
    }
  };

  const today = new Date(new Date().toDateString());
  const upcoming = appointments.filter((a) => a.status !== "cancelled" && a.status !== "completed" && new Date(a.appointmentDate) >= today);
  const past = appointments.filter((a) => !upcoming.includes(a));

  const minDate = new Date().toISOString().split("T")[0];
  const rDay = rNew.date ? new Date(rNew.date).getDay() : null;
  const rSlots = rDay === 6 ? TIME_SLOTS_SATURDAY : TIME_SLOTS_WEEKDAY;
  const rSunday = rDay === 0;

  if (authLoading) {
    return (
      <Layout>
        <div className="container py-32 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-slate-300" /></div>
      </Layout>
    );
  }

  const navItems = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "profile", label: "My Profile", icon: User },
    { id: "appointments", label: "Appointments", icon: Calendar },
    { id: "records", label: "Medical Records", icon: ClipboardList },
    { id: "billing", label: "Invoices & Billing", icon: CreditCard },
  ];

  return (
    <Layout>
      <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
        {/* Portal Sidebar */}
        <aside className="lg:w-64 bg-white border-r border-slate-200 flex flex-col shrink-0">
          <div className="p-6 border-b border-slate-100 flex items-center gap-3">
            <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Patient Portal</p>
              <h2 className="font-bold text-slate-900 truncate max-w-[120px]">{profile?.fullName?.split(' ')[0] || "Patient"}</h2>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as typeof activeTab)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all",
                  activeTab === item.id 
                    ? "bg-primary text-white shadow-md shadow-primary/20" 
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </button>
            ))}
          </nav>

          <div className="p-4 border-t border-slate-100 space-y-2">
            <Button asChild variant="ghost" className="w-full justify-start rounded-xl font-bold text-slate-500 hover:text-primary h-11">
              <Link to="/profile"><Settings className="h-4 w-4 mr-3" /> Profile Settings</Link>
            </Button>
            {isAdmin && (
              <Button asChild variant="ghost" className="w-full justify-start rounded-xl font-bold text-slate-500 hover:text-primary h-11">
                <Link to="/admin"><ShieldCheck className="h-4 w-4 mr-3" /> Admin Portal</Link>
              </Button>
            )}
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-6 lg:p-10 max-w-6xl mx-auto w-full">
          {/* Header Row */}
          <div className="flex flex-wrap items-center justify-between gap-6 mb-10">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                {navItems.find(n => n.id === activeTab)?.label}
              </h1>
              <p className="text-slate-500 mt-1">Manage your ocular health journey with NOVA.</p>
            </div>
            <div className="flex gap-3">
              <Button asChild className="rounded-xl font-bold bg-primary hover:bg-primary/90 text-white px-6 h-12 shadow-lg shadow-primary/10">
                <Link to="/book"><CalendarPlus className="h-5 w-5 mr-2" /> Book Appointment</Link>
              </Button>
            </div>
          </div>

          {profile && !profile.registrationCompleted && (
            <Card className="mb-10 p-6 bg-amber-50 border-amber-200 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 shrink-0">
                  <User className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-amber-900">Complete Your Patient Registration</h3>
                  <p className="text-sm text-amber-700">Required for us to process your clinical records correctly.</p>
                </div>
              </div>
              <Button asChild className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl px-6 font-bold h-11 shrink-0">
                <Link to="/register-patient">Complete Now <ArrowRight className="h-4 w-4 ml-2" /></Link>
              </Button>
            </Card>
          )}

          {/* Tab Content */}
          <div className="space-y-8">
            {activeTab === "overview" && (
              <div className="grid gap-8 lg:grid-cols-2">
                <div className="space-y-8">
                  <SectionTitle title="Next Appointment" />
                  {upcoming.length > 0 ? (
                    <AppointmentCard a={upcoming[0]} onCancel={cancelAppointment} onReschedule={(x) => { setReschedule(x); setRNew({ date: x.appointmentDate, time: x.appointmentTime }); }} canManage />
                  ) : (
                    <EmptyState icon={Calendar} title="No upcoming visits" desc="You don't have any appointments scheduled yet." actionLabel="Schedule Now" actionLink="/book" />
                  )}

                  <SectionTitle title="Quick Actions" />
                  <div className="grid grid-cols-2 gap-4">
                    <QuickActionCard icon={History} label="Medical History" sub="Update your profile" link="/medical-history" color="bg-blue-50 text-blue-600" />
                    <QuickActionCard icon={Star} label="Write Review" sub="Share your experience" link="/reviews" color="bg-yellow-50 text-yellow-600" />
                  </div>
                </div>

                <div className="space-y-8">
                  <SectionTitle title="Recent Records" />
                  {screenings.length > 0 ? (
                    <div className="space-y-4">
                      {screenings.slice(0, 2).map(s => <ScreeningCard key={s.id} s={s} />)}
                      <Button variant="ghost" onClick={() => setActiveTab("records")} className="w-full font-bold text-primary">View All Records <ChevronRight className="h-4 w-4 ml-1" /></Button>
                    </div>
                  ) : (
                    <EmptyState icon={ClipboardList} title="No records found" desc="Your clinical reports will appear here after your first visit." />
                  )}
                </div>
              </div>
            )}

            {activeTab === "profile" && (
              <div className="grid gap-8 lg:grid-cols-2 animate-in fade-in duration-500">
                <div className="space-y-6">
                  <SectionTitle title="Personal Information" />
                  <Card className="p-6 rounded-2xl border-slate-200 bg-white">
                    <div className="space-y-4">
                      <ProfileField label="Full Name" value={profile?.fullName} />
                      <ProfileField label="Email Address" value={profile?.email} />
                      <ProfileField label="Phone Number" value={profile?.phone} />
                      <ProfileField label="Gender" value={profile?.gender} />
                      <ProfileField label="Date of Birth" value={profile?.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString('en-GB') : undefined} />
                      <ProfileField label="Nationality" value={profile?.nationality} />
                      <ProfileField label="Blood Group" value={profile?.bloodGroup} />
                      <ProfileField label="Home Address" value={profile?.address} />
                    </div>
                  </Card>
                  
                  <SectionTitle title="Emergency Contact" />
                  <Card className="p-6 rounded-2xl border-slate-200 bg-white">
                    <div className="space-y-4">
                      <ProfileField label="Contact Name" value={profile?.emergencyContactName} />
                      <ProfileField label="Phone Number" value={profile?.emergencyContactPhone} />
                    </div>
                  </Card>
                </div>

                <div className="space-y-6">
                  <SectionTitle title="Medical History" />
                  <Card className="p-6 rounded-2xl border-slate-200 bg-white">
                    {medicalHistory ? (
                      <div className="space-y-4">
                        <ProfileField label="Ocular History" value={medicalHistory.ocularHistory} />
                        <ProfileField label="Systemic Conditions" value={medicalHistory.systemicConditions} />
                        <ProfileField label="Current Medications" value={medicalHistory.currentMedications} />
                        <ProfileField label="Family Eye History" value={medicalHistory.familyEyeHistory} />
                        <ProfileField label="Allergies" value={medicalHistory.allergies} />
                      </div>
                    ) : (
                      <div className="text-sm text-slate-500 italic py-2">No medical history on file.</div>
                    )}
                  </Card>

                  <div className="pt-4">
                    <Button asChild variant="outline" className="w-full h-12 rounded-xl font-bold border-slate-200 hover:border-primary hover:text-primary">
                      <Link to="/profile"><Settings className="h-4 w-4 mr-2" /> Edit Profile Information</Link>
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "appointments" && (
              <div className="space-y-10">
                <div>
                  <SectionTitle title="Upcoming" />
                  {loading ? <Loader /> : upcoming.length === 0 ? <EmptyState icon={Calendar} title="Clear Schedule" desc="No upcoming visits found." /> : (
                    <div className="grid gap-4 md:grid-cols-2">
                      {upcoming.map(a => <AppointmentCard key={a.id} a={a} onCancel={cancelAppointment} onReschedule={(x) => { setReschedule(x); setRNew({ date: x.appointmentDate, time: x.appointmentTime }); }} canManage />)}
                    </div>
                  )}
                </div>
                {past.length > 0 && (
                  <div>
                    <SectionTitle title="Past Visits" />
                    <div className="grid gap-4 md:grid-cols-2 opacity-75">
                      {past.map(a => <AppointmentCard key={a.id} a={a} onCancel={() => {}} onReschedule={() => {}} />)}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "records" && (
              <div className="grid gap-8 lg:grid-cols-2">
                <div>
                  <SectionTitle title="Screening Reports" />
                  {screenings.length === 0 ? <EmptyState icon={Eye} title="No screenings" desc="No diagnostic records available." /> : (
                    <div className="space-y-4">
                      {screenings.map(s => <ScreeningCard key={s.id} s={s} />)}
                    </div>
                  )}
                </div>
                <div>
                  <SectionTitle title="Active Prescriptions" />
                  {prescriptions.length === 0 ? <EmptyState icon={FileText} title="No prescriptions" desc="Your active prescriptions will be listed here." /> : (
                    <div className="space-y-4">
                      {prescriptions.map(p => (
                        <Card key={p.id} className="p-5 rounded-2xl border border-slate-200">
                          <div className="flex justify-between items-start mb-3">
                            <h4 className="font-bold">{p.doctorName}</h4>
                            <span className="text-[10px] font-bold text-slate-400">{new Date(p.issuedAt).toLocaleDateString('en-GB')}</span>
                          </div>
                          <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 whitespace-pre-wrap">{p.prescriptionDetails}</p>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "billing" && (
              <div className="max-w-3xl">
                <SectionTitle title="Invoices" />
                {invoices.length === 0 ? <EmptyState icon={CreditCard} title="Clear Balance" desc="No invoices or pending payments found." /> : (
                  <div className="space-y-4">
                    {invoices.map(inv => (
                      <Card key={inv.id} className="p-5 rounded-2xl border border-slate-200 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500">
                            <FileText className="h-5 w-5" />
                          </div>
                          <div>
                            <h4 className="font-bold">{inv.description}</h4>
                            <p className="text-xs text-slate-400">{new Date(inv.createdAt).toLocaleDateString('en-GB')}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg">GH₵ {inv.amount}</p>
                          <Badge variant={inv.status === 'paid' ? 'secondary' : 'outline'} className={cn("rounded-md uppercase text-[9px] font-bold", inv.status === 'paid' && "bg-green-50 text-green-700 border-green-100")}>
                            {inv.status}
                          </Badge>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Reschedule Dialog (remains same logic) */}
      <Dialog open={!!reschedule} onOpenChange={(o) => !o && setReschedule(null)}>
        <DialogContent className="rounded-2xl p-8 max-w-md border-none shadow-2xl">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl font-bold">Reschedule Visit</DialogTitle>
            <DialogDescription className="text-xs font-bold text-primary uppercase">{reschedule?.service}</DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-slate-500 ml-1">New Date</Label>
              <Input type="date" min={minDate} value={rNew.date} onChange={(e) => setRNew({ ...rNew, date: e.target.value, time: "" })} className="rounded-xl h-12 border-slate-200" />
              {rSunday && <p className="text-[10px] font-bold text-red-500 ml-1">Closed on Sundays</p>}
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-slate-500 ml-1">Available Slots</Label>
              <Select value={rNew.time} onValueChange={(v) => setRNew({ ...rNew, time: v })} disabled={!rNew.date || rSunday}>
                <SelectTrigger className="rounded-xl h-12 border-slate-200"><SelectValue placeholder="Choose a time" /></SelectTrigger>
                <SelectContent className="rounded-xl">
                  {rSlots.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="mt-8 flex flex-col gap-2">
            <Button onClick={submitReschedule} disabled={!rNew.date || !rNew.time || rSaving} className="w-full rounded-xl font-bold h-12">
              {rSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Change"}
            </Button>
            <Button variant="ghost" onClick={() => setReschedule(null)} className="w-full rounded-xl font-bold text-slate-500 h-12">Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

const SectionTitle = ({ title }: { title: string }) => (
  <h2 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-4 ml-1">{title}</h2>
);

const QuickActionCard = ({ icon: Icon, label, sub, link, color }: { icon: React.ElementType, label: string, sub: string, link: string, color: string }) => (
  <Link to={link}>
    <Card className="p-4 rounded-2xl border border-slate-200 hover:border-primary/30 hover:shadow-md transition-all group h-full">
      <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform", color)}>
        <Icon className="h-5 w-5" />
      </div>
      <h4 className="font-bold text-sm text-slate-900">{label}</h4>
      <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">{sub}</p>
    </Card>
  </Link>
);

const EmptyState = ({ icon: Icon, title, desc, actionLabel, actionLink }: { icon: React.ElementType, title: string, desc: string, actionLabel?: string, actionLink?: string }) => (
  <Card className="p-10 text-center border-dashed border-2 rounded-2xl bg-white/50 flex flex-col items-center justify-center">
    <div className="h-12 w-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-4">
      <Icon className="h-6 w-6" />
    </div>
    <h3 className="font-bold text-slate-900 mb-1">{title}</h3>
    <p className="text-xs text-slate-500 mb-6 italic max-w-[200px]">{desc}</p>
    {actionLabel && (
      <Button asChild size="sm" className="rounded-lg font-bold">
        <Link to={actionLink}>{actionLabel}</Link>
      </Button>
    )}
  </Card>
);

const Loader = () => (
  <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-slate-200" /></div>
);

const ScreeningCard = ({ s }: { s: Screening }) => (
  <Card className="p-5 rounded-2xl border border-slate-200 bg-white hover:shadow-md transition-shadow">
    <div className="flex justify-between items-center mb-3">
      <Badge variant="outline" className="rounded-md font-bold text-[10px] uppercase text-slate-500 bg-slate-50 border-slate-100 px-2 py-0.5">
        {new Date(s.screeningDate).toLocaleDateString('en-GB')}
      </Badge>
      <div className="flex gap-2">
        <Badge variant="secondary" className="rounded-md text-[9px] font-bold bg-blue-50 text-blue-600 border-blue-100">R: {s.vaRightEye || '-'}</Badge>
        <Badge variant="secondary" className="rounded-md text-[9px] font-bold bg-purple-50 text-purple-600 border-purple-100">L: {s.vaLeftEye || '-'}</Badge>
      </div>
    </div>
    <h4 className="font-bold text-sm mb-1">Diagnosis</h4>
    <p className="text-sm text-slate-600 italic line-clamp-2 leading-relaxed">"{s.diagnosis || "Consultation record saved."}"</p>
  </Card>
);

const AppointmentCard = ({ a, onCancel, onReschedule, canManage }: {
  a: Appointment;
  onCancel: (a: Appointment) => void;
  onReschedule: (a: Appointment) => void;
  canManage?: boolean;
}) => (
  <Card className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-all">
    <div className="flex items-start justify-between gap-4 mb-4">
      <div className="flex items-center gap-4">
        <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center shrink-0 border", 
          a.status === 'confirmed' ? "bg-blue-50 text-blue-600 border-blue-100" : "bg-slate-50 text-slate-400 border-slate-100")}>
          {a.status === 'confirmed' ? <CheckCircle2 className="h-6 w-6" /> : <Clock className="h-6 w-6" />}
        </div>
        <div>
          <h3 className="font-bold text-slate-900 mb-1">{a.service}</h3>
          <div className="flex flex-wrap gap-x-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-primary" /> {new Date(a.appointmentDate).toLocaleDateString("en-GB")}</span>
            <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-primary" /> {a.appointmentTime}</span>
          </div>
        </div>
      </div>
      <Badge className={cn("rounded-md px-2 py-1 font-bold uppercase text-[8px] tracking-widest", statusStyles[a.status])} variant="secondary">
        {a.status}
      </Badge>
    </div>
    
    {canManage && a.status !== "cancelled" && a.status !== "completed" && (
      <div className="flex gap-2 pt-3 border-t border-slate-50 mt-3">
        <Button size="sm" variant="outline" onClick={() => onReschedule(a)} className="flex-1 rounded-lg font-bold text-[10px] h-9 border-slate-100 text-slate-600 hover:text-primary hover:bg-primary-soft">
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> RESCHEDULE
        </Button>
        <Button size="sm" variant="ghost" className="flex-1 rounded-lg font-bold text-[10px] h-9 text-slate-400 hover:text-red-600 hover:bg-red-50" onClick={() => onCancel(a)}>
          <CalendarX className="h-3.5 w-3.5 mr-1.5" /> CANCEL
        </Button>
      </div>
    )}
  </Card>
);

const ProfileField = ({ label, value }: { label: string; value?: string | null }) => (
  <div className="flex flex-col border-b border-slate-50 pb-3 last:border-0 last:pb-0">
    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</span>
    <span className="text-sm font-medium text-slate-900">{value || <span className="text-slate-300 italic">Not provided</span>}</span>
  </div>
);

export default Dashboard;
