import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { apiService, Profile, MedicalHistory } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { 
  Loader2, Search, CheckCircle2, X, Clock, Phone, Mail, Calendar, 
  Plus, Edit, Trash2, FileText, UserCheck, Check, AlertCircle, Eye, Activity,
  ArrowLeft, Printer, User
} from "lucide-react";
import { getCMSContent, TeamMember } from "@/lib/cms";
import { getGoogleCalendarUrl } from "@/lib/calendar";

type Appt = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  service: string;
  appointmentDate: string;
  appointmentTime: string;
  notes: string | null;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  appointmentType?: "in_person" | "virtual";
  doctorName?: string | null;
  userId: string | null;
  createdAt: string;
};

interface PatientProfile {
  id: string;
  fullName?: string;
  userEmail?: string;
  email?: string;
  phone?: string;
}


const statusStyles: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-900 border-yellow-200",
  confirmed: "bg-primary text-white",
  cancelled: "bg-secondary text-secondary-foreground border-border",
  completed: "bg-green-100 text-green-900 border-green-200",
};

const servicesList = [
  "Comprehensive Eye Exam",
  "Contact Lens Fitting",
  "Glaucoma Screening",
  "Diabetic Eye Exam",
  "Pediatric Eye Care",
  "Dry Eye Treatment",
  "LASIK Consultation",
  "Other Consultation"
];

const timeSlots = [
  "08:00 AM", "08:30 AM", "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM",
  "11:00 AM", "11:30 AM", "01:00 PM", "01:30 PM", "02:00 PM", "02:30 PM",
  "03:00 PM", "03:30 PM", "04:00 PM", "04:30 PM"
];

const initialAddFormState = {
  userId: "guest",
  fullName: "",
  email: "",
  phone: "",
  service: "",
  appointmentDate: "",
  appointmentTime: "",
  notes: "",
  status: "confirmed" as Appt["status"],
  appointmentType: "in_person" as "in_person" | "virtual",
  doctorName: ""
};

const AdminAppointments = () => {
  const [searchParams] = useSearchParams();
  const userIdFilter = searchParams.get("user");
  
  const [items, setItems] = useState<Appt[]>([]);
  const [profiles, setProfiles] = useState<PatientProfile[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [addForm, setAddForm] = useState(initialAddFormState);
  const [creatingAppt, setCreatingAppt] = useState(false);

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingAppt, setEditingAppt] = useState<Appt | null>(null);
  const [editForm, setEditForm] = useState<Partial<Appt>>({});
  const [updatingAppt, setUpdatingAppt] = useState(false);
  const [doctors, setDoctors] = useState<string[]>([]);

  // View Details Modal state
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [viewAppt, setViewAppt] = useState<Appt | null>(null);
  const [viewHistoryProfile, setViewHistoryProfile] = useState<Profile | null>(null);
  const [viewHistoryMedical, setViewHistoryMedical] = useState<MedicalHistory | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await apiService.appointments.getAll();
      setItems(data || []);
      
      const patients = await apiService.profiles.getAll();
      setProfiles(patients || []);
    } catch (err) {
      console.error("Failed to load appointments:", err);
      toast.error("Error fetching administrative records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const fetchDoctors = async () => {
      try {
        const data = await getCMSContent<{ members: TeamMember[] }>("team");
        if (data?.members) {
          setDoctors(data.members.map(m => m.name));
        }
      } catch (err) {
        console.error("Failed to load doctors:", err);
      }
    };
    fetchDoctors();
  }, []);

  const updateStatus = async (a: Appt, status: Appt["status"]) => {
    try {
      await apiService.appointments.updateStatus(a.id, status);
      toast.success(`Status updated to ${status}`);
      setItems(prev => prev.map(item => item.id === a.id ? { ...item, status } : item));
      setViewAppt(prev => prev && prev.id === a.id ? { ...prev, status } : prev);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || "Failed to update status");
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.fullName || !addForm.email || !addForm.phone || !addForm.service || !addForm.appointmentDate || !addForm.appointmentTime) {
      toast.error("Please fill in all required fields");
      return;
    }
    setCreatingAppt(true);
    try {
      const payload = {
        ...addForm,
        userId: addForm.userId === "guest" ? null : addForm.userId,
        doctorName: addForm.doctorName || null
      };
      await apiService.appointments.create(payload);
      toast.success("Appointment created successfully!");
      setIsAddDialogOpen(false);
      setAddForm(initialAddFormState);
      load();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Failed to book appointment");
    } finally {
      setCreatingAppt(false);
    }
  };

  const handleEditClick = (appt: Appt) => {
    setEditingAppt(appt);
    setEditForm({
      fullName: appt.fullName,
      email: appt.email,
      phone: appt.phone,
      service: appt.service,
      appointmentDate: appt.appointmentDate.split("T")[0],
      appointmentTime: appt.appointmentTime,
      notes: appt.notes || "",
      status: appt.status,
      appointmentType: appt.appointmentType || "in_person",
      doctorName: appt.doctorName || ""
    });
    setIsEditDialogOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAppt) return;
    setUpdatingAppt(true);
    try {
      await apiService.appointments.update(editingAppt.id, editForm as Record<string, unknown>);
      toast.success("Appointment updated successfully!");
      setIsEditDialogOpen(false);
      setViewAppt(prev => prev && prev.id === editingAppt.id ? { ...prev, ...editForm } as Appt : prev);
      load();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Failed to update appointment");
    } finally {
      setUpdatingAppt(false);
    }
  };

  // Delete Appointment states
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteApptId, setDeleteApptId] = useState("");
  const [deleteApptName, setDeleteApptName] = useState("");
  const [deletingAppt, setDeletingAppt] = useState(false);

  const handleDeleteClick = (id: string, name: string) => {
    setDeleteApptId(id);
    setDeleteApptName(name);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteSubmit = async () => {
    setDeletingAppt(true);
    try {
      await apiService.appointments.delete(deleteApptId);
      toast.success("Appointment deleted successfully");
      setIsDeleteDialogOpen(false);
      load();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Failed to delete appointment");
    } finally {
      setDeletingAppt(false);
    }
  };

  const handleViewClick = async (appt: Appt) => {
    setViewAppt(appt);
    setViewHistoryProfile(null);
    setViewHistoryMedical(null);
    setIsViewDialogOpen(false);
    if (appt.userId) {
      setLoadingHistory(true);
      try {
        const profile = await apiService.profiles.getOne(appt.userId);
        setViewHistoryProfile(profile);
        
        try {
          const history = await apiService.medicalHistory.getByPatient(appt.userId);
          setViewHistoryMedical(history);
        } catch (hErr) {
          console.error("Failed to load patient medical history:", hErr);
        }
      } catch (err: unknown) {
        console.error("Failed to load patient clinical history:", err);
      } finally {
        setLoadingHistory(false);
      }
    }
  };

  const handlePatientSelect = (patientId: string) => {
    if (patientId === "guest") {
      setAddForm(prev => ({
        ...prev,
        userId: "guest",
        fullName: "",
        email: "",
        phone: ""
      }));
    } else {
      const selected = profiles.find(p => p.id === patientId);
      if (selected) {
        setAddForm(prev => ({
          ...prev,
          userId: selected.id,
          fullName: selected.fullName || "",
          email: selected.userEmail || selected.email || "",
          phone: selected.phone || ""
        }));
      }
    }
  };

  const filtered = items.filter((a) => {
    if (userIdFilter && a.userId !== userIdFilter) return false;
    if (filter !== "all" && a.status !== filter) return false;
    if (q && !`${a.fullName} ${a.email} ${a.phone} ${a.service}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  // Calculate statistics
  const total = items.length;
  const pending = items.filter(a => a.status === "pending").length;
  const confirmed = items.filter(a => a.status === "confirmed").length;
  const completed = items.filter(a => a.status === "completed").length;

  if (viewAppt) {
    return (
      <AdminLayout 
        title="Appointment & Clinical Record" 
        subtitle={`Clinical summary and scheduling folder for ${viewAppt.fullName}`}
      >
        <div className="space-y-6">
          {/* Back Action Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
            <Button 
              variant="outline" 
              onClick={() => setViewAppt(null)} 
              className="gap-2 rounded-xl h-10 border-border/60 hover:bg-slate-50"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Appointments
            </Button>
            <div className="flex gap-2">
              <Button 
                asChild
                variant="outline" 
                className="gap-2 rounded-xl h-10 border-border/60 hover:bg-slate-50 cursor-pointer"
              >
                <a
                  href={getGoogleCalendarUrl({
                    title: `Nova Eye Care: ${viewAppt.fullName} - ${viewAppt.service}`,
                    description: `Patient: ${viewAppt.fullName}\nPhone: ${viewAppt.phone}\nEmail: ${viewAppt.email}\nConsultation Type: ${viewAppt.appointmentType === 'virtual' ? 'Virtual (Online)' : 'In-Person (Clinic Visit)'}\nDoctor: ${viewAppt.doctorName || 'Assigned Optometrist'}\nNotes: ${viewAppt.notes || 'None'}\n\nNova Eye Care Clinic\nAbuakwa, Kumasi, Ghana\nPhones: +233 544 172 089 / +233 246 613 184`,
                    location: viewAppt.appointmentType === 'virtual' ? 'Online (Zoom/Google Meet link will be sent)' : 'Nova Eye Care Clinic, Abuakwa, Kumasi, Ghana',
                    startDateStr: viewAppt.appointmentDate,
                    startTimeStr: viewAppt.appointmentTime
                  })}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <Calendar className="h-4 w-4 text-indigo-500" /> Sync to Google Calendar
                </a>
              </Button>
              <Button 
                variant="outline" 
                onClick={() => window.print()} 
                className="gap-2 rounded-xl h-10 border-border/60 hover:bg-slate-50"
              >
                <Printer className="h-4 w-4 text-primary" /> Print Record
              </Button>
            </div>
          </div>

          {/* Main 2-Column Clinical Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column: Demographics & Clinical Folder (spans 2 columns) */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Demographics Card */}
              <Card className="p-6 border-border/40 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-primary" />
                <h3 className="text-sm font-bold text-primary uppercase tracking-widest mb-4 flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-primary" /> Patient Demographics
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6">
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Full Name</span>
                    <p className="font-bold text-base text-foreground mt-0.5">{viewAppt.fullName}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Account Type</span>
                    <div className="mt-1">
                      {viewAppt.userId ? (
                        <Badge className="bg-green-50 text-green-700 border-green-200 text-xs font-bold rounded-md px-2.5 py-0.5">
                          Linked Profile
                        </Badge>
                      ) : (
                        <Badge className="bg-slate-100 text-slate-700 border-slate-200 text-xs font-bold rounded-md px-2.5 py-0.5">
                          Guest Patient (Unlinked)
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Phone</span>
                    <p className="font-semibold text-sm text-foreground mt-0.5">
                      <a href={`tel:${viewAppt.phone}`} className="text-primary hover:underline flex items-center gap-1.5 w-fit">
                        <Phone className="h-4 w-4" /> {viewAppt.phone}
                      </a>
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Email Address</span>
                    <p className="font-semibold text-sm text-foreground mt-0.5">
                      <a href={`mailto:${viewAppt.email}`} className="text-primary hover:underline flex items-center gap-1.5 w-fit">
                        <Mail className="h-4 w-4" /> {viewAppt.email}
                      </a>
                    </p>
                  </div>

                  {viewAppt.userId && viewHistoryProfile && (
                    <>
                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Date of Birth</span>
                        <p className="font-semibold text-sm text-foreground mt-0.5">
                          {viewHistoryProfile.dateOfBirth ? new Date(viewHistoryProfile.dateOfBirth).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "—"}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Gender</span>
                        <p className="font-semibold text-sm text-foreground capitalize mt-0.5">{viewHistoryProfile.gender || "—"}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Blood Group</span>
                        <p className="font-bold text-sm text-primary bg-primary/5 px-2.5 py-0.5 rounded w-fit mt-0.5">{viewHistoryProfile.bloodGroup || "—"}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Nationality</span>
                        <p className="font-semibold text-sm text-foreground capitalize mt-0.5">{viewHistoryProfile.nationality || "—"}</p>
                      </div>
                      {viewHistoryProfile.address && (
                        <div className="md:col-span-2">
                          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Residential Address</span>
                          <p className="font-semibold text-sm text-foreground mt-0.5">{viewHistoryProfile.address}</p>
                        </div>
                      )}
                      {viewHistoryProfile.emergencyContactName && (
                        <div>
                          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Emergency Contact</span>
                          <p className="font-semibold text-sm text-foreground mt-0.5">
                            {viewHistoryProfile.emergencyContactName} ({viewHistoryProfile.emergencyContactPhone || "No Phone"})
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </Card>

              {/* Consultation / Appointment Notes */}
              <Card className="p-6 border-border/40 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500" />
                <h3 className="text-sm font-bold text-indigo-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <FileText className="h-4 w-4" /> Consultation Notes
                </h3>
                {viewAppt.notes ? (
                  <div className="bg-slate-50 border p-4 rounded-xl text-sm text-foreground leading-relaxed italic">
                    "{viewAppt.notes}"
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic bg-slate-50 border p-4 rounded-xl">No consultation notes recorded for this appointment.</p>
                )}
              </Card>

              {/* Patient Clinical History Pillar Folders */}
              {viewAppt.userId && (
                <Card className="p-6 border-border/40 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-teal-500" />
                  <h3 className="text-sm font-bold text-teal-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Activity className="h-4 w-4" /> Clinical & Medical History
                  </h3>
                  
                  {loadingHistory ? (
                    <div className="flex justify-center py-12">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : viewHistoryMedical ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/50">
                          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block mb-1">Ocular History</span>
                          <p className="text-sm font-semibold text-slate-800 leading-relaxed">
                            {viewHistoryMedical.ocularHistory || "No ocular conditions recorded"}
                          </p>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/50">
                          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block mb-1">Systemic Conditions</span>
                          <p className="text-sm font-semibold text-slate-800 leading-relaxed">
                            {viewHistoryMedical.systemicConditions || "No systemic conditions recorded"}
                          </p>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/50">
                          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block mb-1">Current Medications</span>
                          <p className="text-sm font-semibold text-slate-800 leading-relaxed">
                            {viewHistoryMedical.currentMedications || "No ocular or systemic medications listed"}
                          </p>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/50">
                          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block mb-1">Family Eye History</span>
                          <p className="text-sm font-semibold text-slate-800 leading-relaxed">
                            {viewHistoryMedical.familyEyeHistory || "No family eye conditions recorded"}
                          </p>
                        </div>
                      </div>

                      {/* Allergies Card - high contrast */}
                      <div className={`p-4 rounded-xl border ${viewHistoryMedical.allergies ? 'bg-red-50/50 border-red-200' : 'bg-slate-50 border-slate-200/50'}`}>
                        <span className={`text-[10px] uppercase font-bold tracking-wider block mb-1 ${viewHistoryMedical.allergies ? 'text-red-700' : 'text-muted-foreground'}`}>
                          Allergies & Drug Reactions
                        </span>
                        <p className={`text-sm font-bold ${viewHistoryMedical.allergies ? 'text-red-700' : 'text-slate-800'}`}>
                          {viewHistoryMedical.allergies || "No known allergies listed"}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic bg-slate-50 p-4 rounded-xl border">Clinical profile history could not be fetched for this linked patient.</p>
                  )}
                </Card>
              )}
            </div>

            {/* Right Column: Scheduling Information & Controls */}
            <div className="space-y-6">
              
              {/* Scheduling Card */}
              <Card className="p-6 border-border/40 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-violet-500" />
                <h3 className="text-sm font-bold text-violet-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Calendar className="h-4 w-4" /> Booking Summary
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Service Requested</span>
                      <p className="font-bold text-base text-foreground mt-0.5">{viewAppt.service}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Consultation Type</span>
                      <div className="mt-1">
                        <Badge className={cn("text-[10px] font-bold rounded-md px-2 py-0.5 border capitalize", 
                          viewAppt.appointmentType === "virtual" 
                            ? "bg-indigo-50 text-indigo-700 border-indigo-150" 
                            : "bg-teal-50 text-teal-700 border-teal-150"
                        )} variant="outline">
                          {viewAppt.appointmentType === "virtual" ? "Virtual (Online)" : "In-Person (Clinic)"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Date</span>
                      <p className="font-semibold text-sm text-foreground mt-0.5">
                        {new Date(viewAppt.appointmentDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Time Slot</span>
                      <p className="font-semibold text-sm text-foreground mt-0.5">{viewAppt.appointmentTime}</p>
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Assigned Doctor</span>
                    <p className="font-semibold text-sm text-foreground mt-0.5">{viewAppt.doctorName || "Any Available Doctor"}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Reference ID</span>
                    <p className="font-mono text-xs text-foreground/80 bg-slate-100 p-2.5 rounded-lg border border-slate-200/50 mt-1 select-all">{viewAppt.id}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Booking Logged</span>
                    <p className="text-xs font-semibold text-muted-foreground mt-0.5">
                      {new Date(viewAppt.createdAt).toLocaleString("en-GB")}
                    </p>
                  </div>
                </div>
              </Card>

              {/* Workflow Actions Card */}
              <Card className="p-6 border-border/40 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500" />
                <h3 className="text-sm font-bold text-amber-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Activity className="h-4 w-4" /> Clinic Workflow
                </h3>
                
                {/* Active Status Badge */}
                <div className="mb-6 p-4 rounded-xl border bg-slate-50 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Current Status</span>
                  <Badge className={`${statusStyles[viewAppt.status]} capitalize px-3 py-1 font-bold rounded-full border`}>
                    {viewAppt.status}
                  </Badge>
                </div>

                <div className="space-y-3">
                  {viewAppt.status === "pending" && (
                    <Button 
                      onClick={() => updateStatus(viewAppt, "confirmed")} 
                      className="w-full h-11 justify-center rounded-xl bg-primary hover:bg-primary/95 text-white gap-2 font-bold shadow-sm"
                    >
                      <CheckCircle2 className="h-5 w-5" /> Confirm Booking
                    </Button>
                  )}
                  {viewAppt.status === "confirmed" && (
                    <Button 
                      onClick={() => updateStatus(viewAppt, "completed")} 
                      className="w-full h-11 justify-center rounded-xl bg-green-600 hover:bg-green-700 text-white gap-2 font-bold shadow-sm"
                    >
                      <Check className="h-5 w-5" /> Complete Visit
                    </Button>
                  )}
                  {viewAppt.status !== "cancelled" && viewAppt.status !== "completed" && (
                    <Button 
                      variant="outline"
                      onClick={() => updateStatus(viewAppt, "cancelled")} 
                      className="w-full h-11 justify-center rounded-xl text-destructive hover:bg-destructive/5 border-destructive/20 gap-2 font-bold"
                    >
                      <X className="h-5 w-5" /> Cancel Appointment
                    </Button>
                  )}

                  <div className="grid grid-cols-2 gap-3 pt-3 border-t">
                    <Button 
                      variant="outline" 
                      onClick={() => handleEditClick(viewAppt)} 
                      className="h-10 rounded-xl gap-1.5 font-semibold text-slate-700"
                    >
                      <Edit className="h-4 w-4" /> Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => { handleDeleteClick(viewAppt.id, viewAppt.fullName); setViewAppt(null); }} 
                      className="h-10 rounded-xl text-destructive hover:bg-destructive/5 border-destructive/10 gap-1.5 font-semibold"
                    >
                      <Trash2 className="h-4 w-4" /> Delete
                    </Button>
                  </div>
                </div>
              </Card>

            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Appointments" subtitle="Review bookings, manage schedules, update details, or cancel patient appointments.">
      
      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4 border-border/40">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Bookings</p>
          <p className="text-3xl font-black mt-2 text-foreground">{total}</p>
        </Card>
        <Card className="p-4 border-border/40 border-l-4 border-l-yellow-500">
          <p className="text-xs font-bold text-yellow-600 uppercase tracking-wider">Pending Confirmation</p>
          <p className="text-3xl font-black mt-2 text-yellow-700">{pending}</p>
        </Card>
        <Card className="p-4 border-border/40 border-l-4 border-l-primary">
          <p className="text-xs font-bold text-primary uppercase tracking-wider">Confirmed Slots</p>
          <p className="text-3xl font-black mt-2 text-primary">{confirmed}</p>
        </Card>
        <Card className="p-4 border-border/40 border-l-4 border-l-green-500">
          <p className="text-xs font-bold text-green-600 uppercase tracking-wider">Completed Sessions</p>
          <p className="text-3xl font-black mt-2 text-green-700">{completed}</p>
        </Card>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-4">
        <div className="flex flex-1 gap-3 w-full md:w-auto">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email, phone, service..." className="pl-9 h-11" />
          </div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-44 h-11"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <Card className="p-16 text-center text-muted-foreground border-dashed">
          <Calendar className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-foreground mb-1">No bookings match</h3>
          <p className="text-sm">Try adjusting your filters or create a new booking using the button above.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((a) => (
            <Card key={a.id} className="p-5 hover:shadow-md transition-all border-border/40 group">
              <div className="flex flex-wrap gap-4 justify-between items-start">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors">{a.fullName}</h3>
                    <Badge variant="secondary" className={`${statusStyles[a.status]} capitalize px-2 py-0.5 text-xs font-semibold rounded-full border`}>
                      {a.status}
                    </Badge>
                    {a.appointmentType && (
                      <Badge className={cn("text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 border rounded-full", 
                        a.appointmentType === "virtual" 
                          ? "bg-indigo-50 text-indigo-700 border-indigo-200" 
                          : "bg-teal-50 text-teal-700 border-teal-200"
                      )} variant="outline">
                        {a.appointmentType === "virtual" ? "Virtual" : "In-Person"}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm font-medium text-foreground/80">{a.service}</p>
                  
                  <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground mt-3">
                    <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> {new Date(a.appointmentDate).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}</span>
                    <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {a.appointmentTime}</span>
                    <span className="flex items-center gap-1.5"><User className="h-3.5 w-3.5 text-primary" /> {a.doctorName || "Any Doctor"}</span>
                    <a href={`tel:${a.phone}`} className="flex items-center gap-1.5 hover:text-primary transition-colors"><Phone className="h-3.5 w-3.5" /> {a.phone}</a>
                    <a href={`mailto:${a.email}`} className="flex items-center gap-1.5 hover:text-primary transition-colors"><Mail className="h-3.5 w-3.5" /> {a.email}</a>
                  </div>
                  {a.notes && (
                    <div className="bg-muted/30 border p-3 rounded-lg mt-3 text-xs text-muted-foreground flex gap-1.5 items-start">
                      <FileText className="h-4 w-4 text-muted-foreground/60 shrink-0 mt-0.5" />
                      <span className="italic">"{a.notes}"</span>
                    </div>
                  )}
                </div>
                
                <div className="flex flex-wrap gap-2 items-center justify-end w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-border/40 mt-4 md:mt-0">
                  {a.status === "pending" && (
                    <Button size="sm" onClick={() => updateStatus(a, "confirmed")} className="gap-1.5 rounded-lg bg-primary hover:bg-primary/90 text-white">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Confirm
                    </Button>
                  )}
                  {a.status === "confirmed" && (
                    <Button size="sm" variant="outline" onClick={() => updateStatus(a, "completed")} className="gap-1.5 rounded-lg text-green-700 border-green-200 bg-green-50 hover:bg-green-100">
                      <Check className="h-3.5 w-3.5" /> Complete
                    </Button>
                  )}
                  {a.status !== "cancelled" && a.status !== "completed" && (
                    <Button size="sm" variant="outline" className="text-destructive hover:text-destructive gap-1.5 rounded-lg border-destructive/20" onClick={() => updateStatus(a, "cancelled")}>
                      <X className="h-3.5 w-3.5" /> Cancel
                    </Button>
                  )}
                  <Button size="sm" variant="outline" className="gap-1.5 rounded-lg bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100" onClick={() => handleViewClick(a)}>
                    <Eye className="h-3.5 w-3.5 text-primary" /> View
                  </Button>
                  <Button size="sm" variant="outline" className="gap-1.5 rounded-lg" onClick={() => handleEditClick(a)}>
                    <Edit className="h-3.5 w-3.5" /> Edit
                  </Button>
                  <Button size="sm" variant="outline" className="text-destructive hover:bg-destructive/5 gap-1.5 rounded-lg border-destructive/10" onClick={() => handleDeleteClick(a.id, a.fullName)}>
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add Appointment Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-xl rounded-xl p-6 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Plus className="h-6 w-6 text-primary" /> Create Booking
            </DialogTitle>
            <DialogDescription>
              Book an eye appointment for an existing patient or guest customer.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddSubmit} className="space-y-4 mt-3">
            <div className="space-y-2">
              <Label htmlFor="add-patient-link">Link Patient Account</Label>
              <Select value={addForm.userId} onValueChange={handlePatientSelect}>
                <SelectTrigger id="add-patient-link"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="guest">Guest Patient (Unlinked)</SelectItem>
                  {profiles.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.fullName || "Unregistered Patient"} ({p.userEmail || p.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="add-fullName">Full Name *</Label>
                <Input 
                  id="add-fullName"
                  required
                  value={addForm.fullName}
                  onChange={(e) => setAddForm(p => ({ ...p, fullName: e.target.value }))}
                  placeholder="Full Name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-phone">Phone Number *</Label>
                <Input 
                  id="add-phone"
                  required
                  value={addForm.phone}
                  onChange={(e) => setAddForm(p => ({ ...p, phone: e.target.value }))}
                  placeholder="+233 XX XXX XXXX"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="add-email">Email Address *</Label>
              <Input 
                id="add-email"
                type="email"
                required
                value={addForm.email}
                onChange={(e) => setAddForm(p => ({ ...p, email: e.target.value }))}
                placeholder="name@example.com"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="add-service">Service *</Label>
                <Select 
                  value={addForm.service} 
                  onValueChange={(val) => setAddForm(p => ({ ...p, service: val }))}
                >
                  <SelectTrigger id="add-service"><SelectValue placeholder="Select eye service" /></SelectTrigger>
                  <SelectContent>
                    {servicesList.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-type">Appointment Type *</Label>
                <Select 
                  value={addForm.appointmentType} 
                  onValueChange={(val: "in_person" | "virtual") => setAddForm(p => ({ ...p, appointmentType: val }))}
                >
                  <SelectTrigger id="add-type"><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in_person">In-Person</SelectItem>
                    <SelectItem value="virtual">Virtual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="add-doctor">Assigned Doctor (Optional)</Label>
                <Select 
                  value={addForm.doctorName || "any"} 
                  onValueChange={(val) => setAddForm(p => ({ ...p, doctorName: val === "any" ? "" : val }))}
                >
                  <SelectTrigger id="add-doctor"><SelectValue placeholder="Select doctor" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any Available Doctor</SelectItem>
                    {doctors.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="add-date">Appointment Date *</Label>
                <Input 
                  id="add-date"
                  type="date"
                  required
                  value={addForm.appointmentDate}
                  onChange={(e) => setAddForm(p => ({ ...p, appointmentDate: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-time">Time Slot *</Label>
                <Select 
                  value={addForm.appointmentTime} 
                  onValueChange={(val) => setAddForm(p => ({ ...p, appointmentTime: val }))}
                >
                  <SelectTrigger id="add-time"><SelectValue placeholder="Select time" /></SelectTrigger>
                  <SelectContent>
                    {timeSlots.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="add-notes">Consultation Notes (Optional)</Label>
              <Textarea 
                id="add-notes"
                value={addForm.notes}
                onChange={(e) => setAddForm(p => ({ ...p, notes: e.target.value }))}
                placeholder="Patient symptoms, reasons for visit, eye test results, doctor assignments..."
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" className="rounded-xl" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="rounded-xl" disabled={creatingAppt}>
                {creatingAppt ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Booking...
                  </>
                ) : (
                  "Book Appointment"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Appointment Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-xl rounded-xl p-6 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Edit className="h-6 w-6 text-primary" /> Edit Booking Details
            </DialogTitle>
            <DialogDescription>
              Modify date, time, patient details or status for this booking session.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEditSubmit} className="space-y-4 mt-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-fullName">Full Name</Label>
                <Input 
                  id="edit-fullName"
                  value={editForm.fullName || ""}
                  onChange={(e) => setEditForm(p => ({ ...p, fullName: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Phone Number</Label>
                <Input 
                  id="edit-phone"
                  value={editForm.phone || ""}
                  onChange={(e) => setEditForm(p => ({ ...p, phone: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email Address</Label>
                <Input 
                  id="edit-email"
                  type="email"
                  value={editForm.email || ""}
                  onChange={(e) => setEditForm(p => ({ ...p, email: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-status">Appointment Status</Label>
                <Select 
                  value={editForm.status || "pending"} 
                  onValueChange={(val: Appt["status"]) => setEditForm(p => ({ ...p, status: val }))}
                >
                  <SelectTrigger id="edit-status"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-service">Service</Label>
                <Input 
                  id="edit-service"
                  disabled
                  value={editForm.service || ""}
                  className="bg-slate-50 text-muted-foreground border-slate-200"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-type">Appointment Type</Label>
                <Select 
                  value={editForm.appointmentType || "in_person"} 
                  onValueChange={(val: "in_person" | "virtual") => setEditForm(p => ({ ...p, appointmentType: val }))}
                >
                  <SelectTrigger id="edit-type"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in_person">In-Person</SelectItem>
                    <SelectItem value="virtual">Virtual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-doctor">Assigned Doctor (Optional)</Label>
                <Select 
                  value={editForm.doctorName || "any"} 
                  onValueChange={(val) => setEditForm(p => ({ ...p, doctorName: val === "any" ? "" : val }))}
                >
                  <SelectTrigger id="edit-doctor"><SelectValue placeholder="Select doctor" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any Available Doctor</SelectItem>
                    {doctors.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-date">Appointment Date</Label>
                <Input 
                  id="edit-date"
                  type="date"
                  value={editForm.appointmentDate || ""}
                  onChange={(e) => setEditForm(p => ({ ...p, appointmentDate: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-time">Time Slot</Label>
                <Select 
                  value={editForm.appointmentTime || ""} 
                  onValueChange={(val) => setEditForm(p => ({ ...p, appointmentTime: val }))}
                >
                  <SelectTrigger id="edit-time"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {timeSlots.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-notes">Consultation Notes (Optional)</Label>
              <Textarea 
                id="edit-notes"
                value={editForm.notes || ""}
                onChange={(e) => setEditForm(p => ({ ...p, notes: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" className="rounded-xl" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="rounded-xl" disabled={updatingAppt}>
                {updatingAppt ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Appointment Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md rounded-xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5 text-destructive" /> Cancel/Delete Appointment?
            </DialogTitle>
            <DialogDescription className="mt-2 text-foreground/80">
              Are you sure you want to permanently delete the appointment for <strong>{deleteApptName || "this user"}</strong>?
              <br /><br />
              This action cannot be undone and will permanently remove this appointment from the schedules.
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-end gap-3 pt-4 border-t mt-4">
            <Button type="button" variant="outline" className="rounded-xl" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              type="button" 
              className="rounded-xl bg-destructive hover:bg-destructive/90 text-white" 
              onClick={handleDeleteSubmit} 
              disabled={deletingAppt}
            >
              {deletingAppt ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...
                </>
              ) : (
                "Delete Appointment"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminAppointments;
