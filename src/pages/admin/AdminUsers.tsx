import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiService } from "@/lib/api";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { 
  Search, User, Mail, Phone, ArrowRight, Loader2, KeyRound, 
  MapPin, HeartPulse, PhoneCall, Info, Edit3, Trash2, Save, Undo, Plus, Shield, Eye,
  ArrowLeft, Printer, UserCheck, AlertTriangle, FileText
} from "lucide-react";

type UserProfile = {
  id: string;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  createdAt: string;
  role?: string;
  appointmentCount?: number;
  registrationCompleted?: boolean;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  bloodGroup?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  medicalHistory?: string;
  nationality?: string;
  ocularHistory?: string;
  systemicConditions?: string;
  currentMedications?: string;
  familyEyeHistory?: string;
  allergies?: string;
};

const initialNewUserState = {
  email: "",
  password: "",
  role: "user",
  fullName: "",
  phone: "",
  nationality: "",
  gender: "",
  dateOfBirth: "",
  address: "",
  bloodGroup: "",
  emergencyContactName: "",
  emergencyContactPhone: "",
  ocularHistory: "",
  systemicConditions: "",
  currentMedications: "",
  familyEyeHistory: "",
  allergies: "",
};

const AdminUsers = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  
  // Editing states
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<UserProfile>>({});
  const [saving, setSaving] = useState(false);

  // Add User states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newUserForm, setNewUserForm] = useState(initialNewUserState);
  const [creatingUser, setCreatingUser] = useState(false);

  // Reset Password states
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [resetUserId, setResetUserId] = useState("");
  const [resetUserEmail, setResetUserEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [resettingPassword, setResettingPassword] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await apiService.profiles.getAll();
      setUsers(data || []);
    } catch (error) {
      toast.error("Failed to load patient records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSelectUser = async (user: UserProfile) => {
    setSelectedUser(user);
    setIsEditing(false);
    setEditForm(user);

    try {
      const history = await apiService.medicalHistory.getByPatient(user.id);
      if (history) {
        const mergedUser = {
          ...user,
          ocularHistory: history.ocularHistory || "",
          systemicConditions: history.systemicConditions || "",
          currentMedications: history.currentMedications || "",
          familyEyeHistory: history.familyEyeHistory || "",
          allergies: history.allergies || "",
        };
        setSelectedUser(mergedUser);
        setEditForm(mergedUser);
      }
    } catch (error) {
      console.error("Failed to fetch patient medical history:", error);
    }
  };

  const handleSaveProfile = async () => {
    if (!selectedUser) return;
    setSaving(true);
    try {
      await apiService.profiles.updateByAdmin(selectedUser.id, editForm as Record<string, unknown>);
      
      await apiService.medical.updateHistory({
        ocularHistory: editForm.ocularHistory || "",
        systemicConditions: editForm.systemicConditions || "",
        currentMedications: editForm.currentMedications || "",
        familyEyeHistory: editForm.familyEyeHistory || "",
        allergies: editForm.allergies || ""
      }, selectedUser.id);

      toast.success("Patient profile and clinical history updated successfully!");
      setIsEditing(false);
      
      // Update local states immediately
      setUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, ...editForm } : u));
      setSelectedUser(prev => prev ? { ...prev, ...editForm } : null);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  // Delete User states
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState("");
  const [deleteUserName, setDeleteUserName] = useState("");
  const [deletingUser, setDeletingUser] = useState(false);

  const handleDeleteUser = (id: string, name: string) => {
    setDeleteUserId(id);
    setDeleteUserName(name || "Guest User");
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteUserSubmit = async () => {
    setDeletingUser(true);
    try {
      await apiService.profiles.delete(deleteUserId);
      toast.success("Patient account and profile deleted successfully");
      setIsDeleteDialogOpen(false);
      setSelectedUser(null);
      fetchData(); // Refresh list
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Failed to delete patient account");
    } finally {
      setDeletingUser(false);
    }
  };

  const handleCreateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserForm.email || !newUserForm.password) {
      toast.error("Email and Password are required");
      return;
    }
    setCreatingUser(true);
    try {
      await apiService.auth.adminCreateUser(newUserForm);
      toast.success("User account and profile created successfully!");
      setIsAddDialogOpen(false);
      setNewUserForm(initialNewUserState);
      fetchData();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Failed to create user account");
    } finally {
      setCreatingUser(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }
    setResettingPassword(true);
    try {
      await apiService.auth.adminResetPassword({ userId: resetUserId, newPassword });
      toast.success(`Password for ${resetUserEmail} has been reset successfully!`);
      setIsResetDialogOpen(false);
      setNewPassword("");
      setResetUserId("");
      setResetUserEmail("");
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Failed to reset password");
    } finally {
      setResettingPassword(false);
    }
  };

  const openResetPasswordDialog = (id: string, email: string) => {
    setResetUserId(id);
    setResetUserEmail(email);
    setNewPassword("");
    setIsResetDialogOpen(true);
  };

  const filteredUsers = users.filter(u => 
    u.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.phone?.includes(search)
  );

  if (selectedUser) {
    return (
      <AdminLayout 
        title="Patient EHR & Clinical Profile" 
        subtitle={`Electronic Health Record folder for ${selectedUser.fullName || "Guest User"}`}
      >
        <div className="space-y-6">
          {/* Back Action Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-2 print:hidden animate-in fade-in slide-in-from-top-4 duration-300">
            <Button 
              variant="outline" 
              onClick={() => { setSelectedUser(null); setIsEditing(false); }} 
              className="gap-2 rounded-xl h-10 border-border/60 hover:bg-slate-50 transition-all"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Patients
            </Button>
            
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                onClick={() => window.print()} 
                className="gap-2 rounded-xl h-10 border-border/60 hover:bg-slate-50 transition-all"
              >
                <Printer className="h-4 w-4 text-primary" /> Print Patient Folder
              </Button>

              {isEditing ? (
                <>
                  <Button 
                    variant="ghost" 
                    onClick={() => setIsEditing(false)} 
                    className="gap-2 rounded-xl h-10 transition-all"
                  >
                    <Undo className="h-4 w-4" /> Cancel
                  </Button>
                  <Button 
                    onClick={handleSaveProfile} 
                    disabled={saving} 
                    className="gap-2 rounded-xl h-10 shadow-lg shadow-primary/10 transition-all"
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Save Changes
                  </Button>
                </>
              ) : (
                <Button 
                  onClick={() => setIsEditing(true)} 
                  className="gap-2 rounded-xl h-10 shadow-lg shadow-primary/10 transition-all"
                >
                  <Edit3 className="h-4 w-4" /> Edit Profile
                </Button>
              )}
            </div>
          </div>

          {isEditing ? (
            /* Editing EHR Content */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
              {/* Left Form: Basic & Address & Clinical History */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Basic Demographics Form Card */}
                <Card className="p-6 border-border/40 shadow-sm relative overflow-hidden transition-all duration-300">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-primary" />
                  <h3 className="text-sm font-bold text-primary uppercase tracking-widest mb-4 flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-primary" /> Edit Patient Demographics
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-fullName">Full Name</Label>
                      <Input 
                        id="edit-fullName"
                        value={editForm.fullName || ""} 
                        onChange={(e) => setEditForm(prev => ({ ...prev, fullName: e.target.value }))}
                        placeholder="Full Name"
                        className="rounded-xl focus:ring-primary focus:border-primary"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-phone">Phone Number</Label>
                      <Input 
                        id="edit-phone"
                        value={editForm.phone || ""} 
                        onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="Phone Number"
                        className="rounded-xl focus:ring-primary focus:border-primary"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-dob">Date of Birth</Label>
                      <Input 
                        id="edit-dob"
                        type="date"
                        value={editForm.dateOfBirth ? editForm.dateOfBirth.split('T')[0] : ""} 
                        onChange={(e) => setEditForm(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                        className="rounded-xl focus:ring-primary focus:border-primary"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-gender">Gender</Label>
                      <Select 
                        value={editForm.gender || ""} 
                        onValueChange={(val) => setEditForm(prev => ({ ...prev, gender: val }))}
                      >
                        <SelectTrigger id="edit-gender" className="rounded-xl"><SelectValue placeholder="Select gender" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-nationality">Nationality</Label>
                      <Input 
                        id="edit-nationality"
                        value={editForm.nationality || ""} 
                        onChange={(e) => setEditForm(prev => ({ ...prev, nationality: e.target.value }))}
                        placeholder="Nationality"
                        className="rounded-xl focus:ring-primary focus:border-primary"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-blood">Blood Group</Label>
                      <Select 
                        value={editForm.bloodGroup || ""} 
                        onValueChange={(val) => setEditForm(prev => ({ ...prev, bloodGroup: val }))}
                      >
                        <SelectTrigger id="edit-blood" className="rounded-xl"><SelectValue placeholder="Select blood group" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="A+">A+</SelectItem>
                          <SelectItem value="A-">A-</SelectItem>
                          <SelectItem value="B+">B+</SelectItem>
                          <SelectItem value="B-">B-</SelectItem>
                          <SelectItem value="AB+">AB+</SelectItem>
                          <SelectItem value="AB-">AB-</SelectItem>
                          <SelectItem value="O+">O+</SelectItem>
                          <SelectItem value="O-">O-</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </Card>

                {/* Emergency Contact & Address Details Form */}
                <Card className="p-6 border-border/40 shadow-sm relative overflow-hidden transition-all duration-300">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-slate-500" />
                  <h3 className="text-sm font-bold text-slate-700 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-slate-500" /> Address & Emergency Contacts
                  </h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-ec-name">Emergency Contact Name</Label>
                        <Input 
                          id="edit-ec-name"
                          value={editForm.emergencyContactName || ""} 
                          onChange={(e) => setEditForm(prev => ({ ...prev, emergencyContactName: e.target.value }))}
                          placeholder="Contact Name"
                          className="rounded-xl focus:ring-primary focus:border-primary"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-ec-phone">Emergency Contact Phone</Label>
                        <Input 
                          id="edit-ec-phone"
                          value={editForm.emergencyContactPhone || ""} 
                          onChange={(e) => setEditForm(prev => ({ ...prev, emergencyContactPhone: e.target.value }))}
                          placeholder="Contact Phone"
                          className="rounded-xl focus:ring-primary focus:border-primary"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-address">Residential Address</Label>
                      <Textarea 
                        id="edit-address"
                        value={editForm.address || ""} 
                        onChange={(e) => setEditForm(prev => ({ ...prev, address: e.target.value }))}
                        placeholder="Street name, City, Region"
                        className="rounded-xl min-h-[80px]"
                      />
                    </div>
                  </div>
                </Card>

                {/* Clinical History Form Card */}
                <Card className="p-6 border-border/40 shadow-sm relative overflow-hidden transition-all duration-300">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500" />
                  <h3 className="text-sm font-bold text-indigo-700 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-indigo-500" /> Clinical Records & Medical History
                  </h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-ocular">Ocular History</Label>
                      <Textarea 
                        id="edit-ocular"
                        value={editForm.ocularHistory || ""} 
                        onChange={(e) => setEditForm(prev => ({ ...prev, ocularHistory: e.target.value }))}
                        placeholder="Eye conditions, past treatments/surgeries..."
                        className="rounded-xl min-h-[85px]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-systemic">Systemic Conditions</Label>
                      <Textarea 
                        id="edit-systemic"
                        value={editForm.systemicConditions || ""} 
                        onChange={(e) => setEditForm(prev => ({ ...prev, systemicConditions: e.target.value }))}
                        placeholder="Diabetes, Hypertension, etc."
                        className="rounded-xl min-h-[85px]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-family">Family Eye History</Label>
                      <Textarea 
                        id="edit-family"
                        value={editForm.familyEyeHistory || ""} 
                        onChange={(e) => setEditForm(prev => ({ ...prev, familyEyeHistory: e.target.value }))}
                        placeholder="Glaucoma, blindness, etc. in family..."
                        className="rounded-xl min-h-[85px]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-history">General Medical History Notes</Label>
                      <Textarea 
                        id="edit-history"
                        value={editForm.medicalHistory || ""} 
                        onChange={(e) => setEditForm(prev => ({ ...prev, medicalHistory: e.target.value }))}
                        placeholder="General clinical background notes..."
                        className="rounded-xl min-h-[85px]"
                      />
                    </div>
                  </div>
                </Card>
              </div>

              {/* Right Form: Critical Medical Alerts & Settings */}
              <div className="space-y-6">
                
                {/* Alerts & Critical Pharmacy Details Form */}
                <Card className="p-6 border-destructive/20 shadow-sm relative overflow-hidden bg-destructive/5">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-destructive" />
                  <h3 className="text-sm font-bold text-destructive uppercase tracking-widest mb-4 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-destructive" /> Critical Pharmacy & Alerts
                  </h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-allergies" className="text-destructive font-bold">Allergies (Warning)</Label>
                      <Textarea 
                        id="edit-allergies"
                        value={editForm.allergies || ""} 
                        onChange={(e) => setEditForm(prev => ({ ...prev, allergies: e.target.value }))}
                        placeholder="Drug, food, or contact allergies..."
                        className="rounded-xl min-h-[100px] border-destructive/20 focus-visible:ring-destructive bg-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-meds" className="font-semibold text-foreground">Current Medications</Label>
                      <Textarea 
                        id="edit-meds"
                        value={editForm.currentMedications || ""} 
                        onChange={(e) => setEditForm(prev => ({ ...prev, currentMedications: e.target.value }))}
                        placeholder="Current systemic or ocular medications..."
                        className="rounded-xl min-h-[100px] bg-white"
                      />
                    </div>
                  </div>
                </Card>

                {/* System Settings & Administrative Details */}
                <Card className="p-6 border-border/40 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-slate-800" />
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Shield className="h-4 w-4 text-slate-800" /> System Account Settings
                  </h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-role">User Role</Label>
                      <Select 
                        value={editForm.role || "user"} 
                        onValueChange={(val) => setEditForm(prev => ({ ...prev, role: val }))}
                      >
                        <SelectTrigger id="edit-role" className="rounded-xl"><SelectValue placeholder="Select role" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">Patient (User)</SelectItem>
                          <SelectItem value="admin">Administrator</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="p-4 bg-muted/40 rounded-xl border border-muted/50 text-xs text-muted-foreground leading-relaxed">
                      Changing a user's role to <strong>Administrator</strong> will grant them access to this Admin Dashboard, clinical patient folders, and system notifications. Please exercise high administrative caution.
                    </div>
                  </div>
                </Card>

                {/* Save and Cancel Quick Actions in Sidebar */}
                <div className="flex gap-3 justify-end">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsEditing(false)} 
                    className="flex-1 rounded-xl h-11 border-border/60"
                  >
                    <Undo className="h-4 w-4 mr-2" /> Cancel
                  </Button>
                  <Button 
                    onClick={handleSaveProfile} 
                    disabled={saving} 
                    className="flex-1 rounded-xl h-11 shadow-lg shadow-primary/10"
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Save Records
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            /* Viewing EHR Content */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
              
              {/* Left Column: Demographics & Clinical Records */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Visual Demographics Banner Card */}
                <Card className="border-border/40 shadow-sm overflow-hidden relative">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-primary" />
                  
                  {/* Header/Banner block */}
                  <div className="bg-slate-50 p-6 border-b border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary border border-primary/20 shadow-inner">
                        <User className="h-8 w-8" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="text-2xl font-bold text-foreground tracking-tight">
                            {selectedUser.fullName || "Guest User"}
                          </h2>
                          {selectedUser.role === "admin" && (
                            <Badge className="bg-primary/10 text-primary border-primary/20 text-xs font-semibold py-0.5 rounded-full">
                              Admin
                            </Badge>
                          )}
                          {selectedUser.registrationCompleted && (
                            <Badge className="bg-green-50 text-green-700 border-green-200 text-xs font-semibold py-0.5 rounded-full">
                              Registered Profile
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5 font-medium">
                          Patient Folder ID: <span className="font-mono text-xs text-foreground bg-muted py-0.5 px-1.5 rounded">{selectedUser.id}</span>
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-left md:text-right">
                      <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Record Created</p>
                      <p className="text-sm font-bold text-foreground mt-0.5">
                        {new Date(selectedUser.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                      </p>
                    </div>
                  </div>

                  {/* Demographics details block */}
                  <div className="p-6">
                    <h3 className="text-xs font-bold text-primary uppercase tracking-widest mb-4 flex items-center gap-2 border-b pb-2">
                      <UserCheck className="h-4 w-4 text-primary" /> Demographics & Contact details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-5 gap-x-6">
                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Email Address</span>
                        <p className="font-semibold text-sm mt-0.5">
                          <a href={`mailto:${selectedUser.email}`} className="text-primary hover:underline flex items-center gap-1.5 w-fit">
                            <Mail className="h-4 w-4" /> {selectedUser.email || "—"}
                          </a>
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Phone Number</span>
                        <p className="font-semibold text-sm mt-0.5">
                          {selectedUser.phone ? (
                            <a href={`tel:${selectedUser.phone}`} className="text-primary hover:underline flex items-center gap-1.5 w-fit">
                              <Phone className="h-4 w-4" /> {selectedUser.phone}
                            </a>
                          ) : "—"}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Date of Birth</span>
                        <p className="font-semibold text-sm text-foreground mt-0.5">
                          {selectedUser.dateOfBirth ? new Date(selectedUser.dateOfBirth).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "Not specified"}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Gender</span>
                        <p className="font-semibold text-sm text-foreground capitalize mt-0.5">{selectedUser.gender || "—"}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Nationality</span>
                        <p className="font-semibold text-sm text-foreground capitalize mt-0.5">{selectedUser.nationality || "—"}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Blood Group</span>
                        <p className="font-bold text-sm text-primary bg-primary/10 px-2.5 py-0.5 rounded w-fit mt-1">{selectedUser.bloodGroup || "—"}</p>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Emergency Contact & Address Details */}
                <Card className="p-6 border-border/40 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-slate-500" />
                  <h3 className="text-sm font-bold text-slate-700 uppercase tracking-widest mb-4 flex items-center gap-2 border-b pb-2">
                    <MapPin className="h-4 w-4 text-slate-500" /> Residential Address & Emergency Contacts
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Residential Address</span>
                      <p className="text-sm font-medium leading-relaxed text-foreground mt-1.5 bg-muted/20 p-4 rounded-xl border">
                        {selectedUser.address || "No residential address on file."}
                      </p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 space-y-2">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider flex items-center gap-1.5">
                        <PhoneCall className="h-3.5 w-3.5 text-slate-500" /> Emergency Contact Person
                      </span>
                      <p className="font-bold text-sm text-foreground">
                        {selectedUser.emergencyContactName || "Not provided"}
                      </p>
                      {selectedUser.emergencyContactPhone && (
                        <p className="text-sm text-primary font-semibold flex items-center gap-1.5 mt-1">
                          <Phone className="h-3.5 w-3.5" /> {selectedUser.emergencyContactPhone}
                        </p>
                      )}
                    </div>
                  </div>
                </Card>

                {/* Clinical History & Records */}
                <Card className="p-6 border-border/40 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500" />
                  <h3 className="text-sm font-bold text-indigo-700 uppercase tracking-widest mb-4 flex items-center gap-2 border-b pb-2">
                    <Eye className="h-4 w-4 text-indigo-500" /> Eye & Systemic Clinical Records
                  </h3>
                  <div className="space-y-4">
                    <div className="p-4 bg-muted/20 rounded-xl border border-muted/20 space-y-1">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Ocular History</span>
                      <p className="text-sm font-semibold text-foreground leading-relaxed">
                        {selectedUser.ocularHistory || "No ocular history recorded."}
                      </p>
                    </div>
                    <div className="p-4 bg-muted/20 rounded-xl border border-muted/20 space-y-1">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Systemic Conditions</span>
                      <p className="text-sm font-semibold text-foreground leading-relaxed">
                        {selectedUser.systemicConditions || "No systemic conditions recorded."}
                      </p>
                    </div>
                    <div className="p-4 bg-muted/20 rounded-xl border border-muted/20 space-y-1">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Family Eye History</span>
                      <p className="text-sm font-semibold text-foreground leading-relaxed">
                        {selectedUser.familyEyeHistory || "No family eye history recorded."}
                      </p>
                    </div>
                    <div className="p-4 bg-muted/20 rounded-xl border border-muted/20 space-y-1">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">General Clinical History Notes</span>
                      <p className="text-sm font-semibold text-foreground leading-relaxed">
                        {selectedUser.medicalHistory || "No general clinical history notes on file."}
                      </p>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Right Column: Alerts, Quick Stats & Clinical Actions */}
              <div className="space-y-6">
                
                {/* Allergy & Pharmacy Alerts Card */}
                <Card className="p-6 border-destructive/20 shadow-sm relative overflow-hidden bg-destructive/5">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-destructive" />
                  <h3 className="text-sm font-bold text-destructive uppercase tracking-widest mb-4 flex items-center gap-2 border-b pb-2">
                    <AlertTriangle className="h-4 w-4 text-destructive animate-pulse" /> Critical Medical Alerts
                  </h3>
                  <div className="space-y-4">
                    <div className="p-4 bg-white/70 border border-destructive/10 rounded-xl space-y-1.5">
                      <span className="text-[10px] text-destructive uppercase font-bold tracking-wider">Allergies</span>
                      <p className="text-sm font-bold text-destructive leading-relaxed">
                        {selectedUser.allergies || "No known allergies on file."}
                      </p>
                    </div>
                    <div className="p-4 bg-white/70 border border-muted/20 rounded-xl space-y-1.5">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Current Medications</span>
                      <p className="text-sm font-bold text-foreground leading-relaxed">
                        {selectedUser.currentMedications || "No current medications on file."}
                      </p>
                    </div>
                  </div>
                </Card>

                {/* Patient Actions and Appointments summary */}
                <Card className="p-6 border-border/40 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-slate-800" />
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2 border-b pb-2">
                    <Info className="h-4 w-4 text-slate-800" /> Patient Analytics & Quick Actions
                  </h3>
                  <div className="space-y-5">
                    
                    {/* Stats */}
                    <div className="flex items-center justify-between p-4 bg-muted/40 rounded-xl border border-muted/20">
                      <div>
                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Bookings</p>
                        <p className="text-2xl font-black text-foreground mt-0.5">{selectedUser.appointmentCount || 0}</p>
                      </div>
                      <Badge variant="secondary" className="px-3 py-1 font-bold">
                        Appointments
                      </Badge>
                    </div>

                    {/* Actions List */}
                    <div className="flex flex-col gap-2 pt-2">
                      <Button variant="outline" className="w-full justify-start rounded-xl gap-2 h-11 border-border/60 hover:bg-slate-50 transition-all" asChild>
                        <Link to={`/admin/appointments?user=${selectedUser.id}`}>
                          <ArrowRight className="h-4 w-4 text-primary" /> View Appointment History
                        </Link>
                      </Button>
                      
                      <Button variant="outline" className="w-full justify-start rounded-xl gap-2 h-11 border-border/60 hover:bg-slate-50 transition-all" onClick={() => {
                        const mailto = `mailto:${selectedUser.email}`;
                        window.location.href = mailto;
                      }}>
                        <Mail className="h-4 w-4 text-primary" /> Email Patient Profile
                      </Button>

                      <Button 
                        variant="outline" 
                        onClick={() => openResetPasswordDialog(selectedUser.id, selectedUser.email || "")}
                        disabled={!selectedUser.email}
                        className="w-full justify-start rounded-xl gap-2 h-11 text-warning border-warning/20 hover:bg-warning/5 hover:text-warning transition-all"
                      >
                        <KeyRound className="h-4 w-4" /> Reset Patient Password
                      </Button>

                      <div className="border-t border-muted/50 my-2" />

                      <Button 
                        variant="outline" 
                        className="w-full justify-start rounded-xl text-destructive border-destructive/20 hover:bg-destructive/5 hover:text-destructive gap-2 h-11 transition-all"
                        onClick={() => handleDeleteUser(selectedUser.id, selectedUser.fullName || "Guest User")}
                      >
                        <Trash2 className="h-4 w-4" /> Delete Patient Folder
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="User Management" subtitle="Manage patient accounts, create new accounts, change roles, and reset credentials.">
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by name, email or phone..." 
              className="pl-10 h-11"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
            <p className="text-sm text-muted-foreground font-medium">
              Showing {filteredUsers.length} of {users.length} patients
            </p>
            <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2 rounded-xl h-11 px-5 shadow-lg shadow-primary/10">
              <Plus className="h-5 w-5" />
              Add User
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredUsers.length === 0 ? (
              <Card className="p-12 text-center border-dashed">
                <User className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                <h3 className="text-lg font-semibold">No users found</h3>
                <p className="text-muted-foreground">Try adjusting your search criteria.</p>
              </Card>
            ) : (
              filteredUsers.map((user) => (
                <Card key={user.id} className="p-5 hover:shadow-md transition-all border-border/40 group">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                      <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center text-primary border border-border relative">
                        <User className="h-6 w-6" />
                        {user.role === "admin" && (
                          <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground p-1 rounded-full border border-background">
                            <Shield className="h-3 w-3" />
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">
                            {user.fullName || "Guest User"}
                          </h3>
                          {user.role === "admin" && (
                            <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-primary/20 text-[10px] h-5 rounded-full px-2">
                              Admin
                            </Badge>
                          )}
                          {user.registrationCompleted && (
                            <Badge variant="secondary" className="bg-green-50 text-green-700 hover:bg-green-100 border-green-200 text-[10px] h-5 rounded-full px-2">
                              Registered
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> {user.email || "No email"}</span>
                          {user.phone && <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> {user.phone}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 md:gap-8">
                      <div className="text-center">
                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-1">Bookings</p>
                        <Badge variant="secondary" className="px-3 py-1 font-bold">
                          {user.appointmentCount || 0} Appointments
                        </Badge>
                      </div>
                      
                      <div className="text-center hidden sm:block">
                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-1">Joined</p>
                        <p className="text-sm font-medium">
                          {new Date(user.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      </div>

                      <div className="flex gap-2 ml-auto">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-10 px-4 gap-2 border-border/60"
                          onClick={() => handleSelectUser(user)}
                        >
                          <Info className="h-4 w-4" />
                          <span className="hidden lg:inline">Details</span>
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-10 px-4 gap-2 text-warning border-warning/20 hover:bg-warning/5"
                          onClick={() => user.email && openResetPasswordDialog(user.id, user.email)}
                        >
                          <KeyRound className="h-4 w-4" />
                          <span className="hidden lg:inline">Reset Pass</span>
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-10 px-4 gap-2 text-destructive border-destructive/20 hover:bg-destructive/5"
                          onClick={() => handleDeleteUser(user.id, user.fullName || "Guest User")}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="hidden lg:inline">Delete</span>
                        </Button>
                        <Button asChild size="sm" className="h-10 px-4 gap-2">
                          <Link to={`/admin/appointments?user=${user.id}`}>
                            History
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}
      </div>

      {/* Add User Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto rounded-xl p-6">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Plus className="h-6 w-6 text-primary" /> Create User Account
            </DialogTitle>
            <DialogDescription>
              Create a new user/patient or admin account. Complete all registration, profile, and clinical details at once.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateUserSubmit} className="space-y-6 mt-4">
            {/* Account Credentials */}
            <div className="space-y-4">
              <h4 className="font-bold text-sm text-primary uppercase tracking-wider border-b pb-1">1. Authentication Credentials</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="add-email">Email Address *</Label>
                  <Input 
                    id="add-email"
                    type="email"
                    required
                    value={newUserForm.email}
                    onChange={(e) => setNewUserForm(p => ({ ...p, email: e.target.value }))}
                    placeholder="name@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="add-password">Password *</Label>
                  <Input 
                    id="add-password"
                    type="password"
                    required
                    value={newUserForm.password}
                    onChange={(e) => setNewUserForm(p => ({ ...p, password: e.target.value }))}
                    placeholder="••••••••"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="add-role">System Role</Label>
                  <Select 
                    value={newUserForm.role}
                    onValueChange={(val) => setNewUserForm(p => ({ ...p, role: val }))}
                  >
                    <SelectTrigger id="add-role"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">Patient (User)</SelectItem>
                      <SelectItem value="admin">Administrator</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Profile Info */}
            <div className="space-y-4">
              <h4 className="font-bold text-sm text-primary uppercase tracking-wider border-b pb-1">2. Basic Profile Info</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="add-fullName">Full Name</Label>
                  <Input 
                    id="add-fullName"
                    value={newUserForm.fullName}
                    onChange={(e) => setNewUserForm(p => ({ ...p, fullName: e.target.value }))}
                    placeholder="John Doe"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="add-phone">Phone Number</Label>
                  <Input 
                    id="add-phone"
                    value={newUserForm.phone}
                    onChange={(e) => setNewUserForm(p => ({ ...p, phone: e.target.value }))}
                    placeholder="+233 XX XXX XXXX"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="add-dob">Date of Birth</Label>
                  <Input 
                    id="add-dob"
                    type="date"
                    value={newUserForm.dateOfBirth}
                    onChange={(e) => setNewUserForm(p => ({ ...p, dateOfBirth: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="add-gender">Gender</Label>
                  <Select 
                    value={newUserForm.gender}
                    onValueChange={(val) => setNewUserForm(p => ({ ...p, gender: val }))}
                  >
                    <SelectTrigger id="add-gender"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="add-nationality">Nationality</Label>
                  <Input 
                    id="add-nationality"
                    value={newUserForm.nationality}
                    onChange={(e) => setNewUserForm(p => ({ ...p, nationality: e.target.value }))}
                    placeholder="Ghanaian"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="add-blood">Blood Group</Label>
                  <Select 
                    value={newUserForm.bloodGroup}
                    onValueChange={(val) => setNewUserForm(p => ({ ...p, bloodGroup: val }))}
                  >
                    <SelectTrigger id="add-blood"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A+">A+</SelectItem>
                      <SelectItem value="A-">A-</SelectItem>
                      <SelectItem value="B+">B+</SelectItem>
                      <SelectItem value="B-">B-</SelectItem>
                      <SelectItem value="AB+">AB+</SelectItem>
                      <SelectItem value="AB-">AB-</SelectItem>
                      <SelectItem value="O+">O+</SelectItem>
                      <SelectItem value="O-">O-</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="add-ecName">Emergency Contact Name</Label>
                  <Input 
                    id="add-ecName"
                    value={newUserForm.emergencyContactName}
                    onChange={(e) => setNewUserForm(p => ({ ...p, emergencyContactName: e.target.value }))}
                    placeholder="Emergency Contact Name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="add-ecPhone">Emergency Contact Phone</Label>
                  <Input 
                    id="add-ecPhone"
                    value={newUserForm.emergencyContactPhone}
                    onChange={(e) => setNewUserForm(p => ({ ...p, emergencyContactPhone: e.target.value }))}
                    placeholder="Emergency Contact Phone"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="add-address">Residential Address</Label>
                <Textarea 
                  id="add-address"
                  value={newUserForm.address}
                  onChange={(e) => setNewUserForm(p => ({ ...p, address: e.target.value }))}
                  placeholder="Street name, City, Region"
                />
              </div>
            </div>

            {/* Medical History */}
            <div className="space-y-4">
              <h4 className="font-bold text-sm text-primary uppercase tracking-wider border-b pb-1">3. Clinical & Medical History</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="add-ocular">Ocular History</Label>
                  <Textarea 
                    id="add-ocular"
                    value={newUserForm.ocularHistory}
                    onChange={(e) => setNewUserForm(p => ({ ...p, ocularHistory: e.target.value }))}
                    placeholder="Eye surgeries, trauma, diagnoses (e.g. Glaucoma, Cataract)..."
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="add-systemic">Systemic Conditions</Label>
                  <Textarea 
                    id="add-systemic"
                    value={newUserForm.systemicConditions}
                    onChange={(e) => setNewUserForm(p => ({ ...p, systemicConditions: e.target.value }))}
                    placeholder="Diabetes, Hypertension, Cardiovascular conditions, etc."
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="add-meds">Current Medications</Label>
                  <Textarea 
                    id="add-meds"
                    value={newUserForm.currentMedications}
                    onChange={(e) => setNewUserForm(p => ({ ...p, currentMedications: e.target.value }))}
                    placeholder="List currently prescribed drugs or eye drops..."
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="add-family">Family Eye History</Label>
                  <Textarea 
                    id="add-family"
                    value={newUserForm.familyEyeHistory}
                    onChange={(e) => setNewUserForm(p => ({ ...p, familyEyeHistory: e.target.value }))}
                    placeholder="Family history of blindness, myopia, glaucoma, macular degeneration..."
                    rows={2}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-allergies">Allergies</Label>
                <Textarea 
                  id="add-allergies"
                  value={newUserForm.allergies}
                  onChange={(e) => setNewUserForm(p => ({ ...p, allergies: e.target.value }))}
                  placeholder="Drug allergies, food allergies, environmental allergies..."
                  rows={2}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" className="rounded-xl" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="rounded-xl" disabled={creatingUser}>
                {creatingUser ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...
                  </>
                ) : (
                  "Create Account & Profile"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
        <DialogContent className="max-w-md rounded-xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-warning" /> Reset Account Password
            </DialogTitle>
            <DialogDescription>
              Enter a new secure password for <strong>{resetUserEmail}</strong>.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleResetPasswordSubmit} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input 
                id="new-password"
                type="password"
                required
                placeholder="At least 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" className="rounded-xl" onClick={() => setIsResetDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="rounded-xl bg-warning hover:bg-warning/90 text-black font-semibold" disabled={resettingPassword}>
                {resettingPassword ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Resetting...
                  </>
                ) : (
                  "Update Password"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md rounded-xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5 text-destructive" /> Delete Patient Folder?
            </DialogTitle>
            <DialogDescription className="mt-2 text-foreground/80">
              Are you sure you want to permanently delete patient <strong>{deleteUserName || "this user"}</strong>?
              <br /><br />
              This will permanently delete all associated medical history, prescriptions, notifications, invoices, and clinical records.
              <br /><br />
              <span className="text-destructive font-semibold">This action cannot be undone and will delete the authentication credentials as well.</span>
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-end gap-3 pt-4 border-t mt-4">
            <Button type="button" variant="outline" className="rounded-xl" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              type="button" 
              className="rounded-xl bg-destructive hover:bg-destructive/90 text-white" 
              onClick={handleDeleteUserSubmit} 
              disabled={deletingUser}
            >
              {deletingUser ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...
                </>
              ) : (
                "Delete Patient Folder"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminUsers;
