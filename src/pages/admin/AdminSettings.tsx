import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiService } from "@/lib/api";
import { toast } from "sonner";
import { Shield, Lock, Mail, User, Loader2, Save, Clock, ShieldAlert, MessageSquare, Globe, Edit } from "lucide-react";
import { ClinicContact } from "@/lib/cms";

const AdminSettings = () => {
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({ fullName: "", email: "" });
  const [passwords, setPasswords] = useState({ current: "", new: "", confirm: "" });
  const [websiteInfo, setWebsiteInfo] = useState<ClinicContact | null>(null);
  const [clinic, setClinic] = useState({
    id: "",
    clinicName: "",
    contactPhone: "",
    address: "",
    openingHours: "",
    socialFacebook: "",
    socialInstagram: "",
    socialTwitter: "",
    announcementTitle: "",
    announcementBody: "",
    showAnnouncement: false,
    maintenanceMode: false,
    chatbotEnabled: true
  });

  const fetchData = useCallback(async () => {
    try {
      const user = await apiService.auth.getMe();
      if (user) {
        setProfile({
          fullName: user.fullName || "Admin User",
          email: user.email || "",
        });
      }

      const settings = await apiService.settings.get();
      if (settings) {
        setClinic(prev => ({
          ...prev,
          ...settings,
          clinicName: settings.clinicName || "",
          contactPhone: settings.contactPhone || "",
          address: settings.address || "",
          openingHours: settings.openingHours || "",
          socialFacebook: settings.socialFacebook || "",
          socialInstagram: settings.socialInstagram || "",
          socialTwitter: settings.socialTwitter || "",
          announcementTitle: settings.announcementTitle || "",
          announcementBody: settings.announcementBody || "",
          showAnnouncement: !!settings.showAnnouncement,
          maintenanceMode: !!settings.maintenanceMode,
          chatbotEnabled: settings.chatbotEnabled !== undefined ? !!settings.chatbotEnabled : true
        }) as typeof clinic);
      }

      const cmsClinic = await apiService.cms.getSection("clinic");
      if (cmsClinic) {
        const content = (cmsClinic.contentJson || cmsClinic) as ClinicContact;
        setWebsiteInfo(content);
      }
    } catch (err) {
      toast.error("Failed to load settings");
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiService.profiles.updateMe({ fullName: profile.fullName });
      toast.success("Profile updated successfully");
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateClinic = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiService.settings.update(clinic);
      toast.success("Clinic settings updated");
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || "Failed to update clinic settings");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      toast.error("New passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await apiService.auth.updatePassword({
        currentPassword: passwords.current,
        newPassword: passwords.new
      });
      toast.success("Password updated successfully");
      setPasswords({ current: "", new: "", confirm: "" });
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout title="Admin Settings" subtitle="Configure your administrative account and clinic-wide settings.">
      <div className="grid gap-8 pb-12 w-full">
        {/* Clinic Information Segment */}
        <section className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Clinic & App Data
            </h2>
            <p className="text-sm text-muted-foreground mt-1">Manage global details and social presence.</p>
          </div>
          <Card className="lg:col-span-2 p-6 border">
            <form onSubmit={handleUpdateClinic} className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Clinic Name</Label>
                  <Input 
                    value={clinic.clinicName} 
                    onChange={(e) => setClinic({ ...clinic, clinicName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Support Phone</Label>
                  <Input 
                    value={clinic.contactPhone} 
                    onChange={(e) => setClinic({ ...clinic, contactPhone: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Opening Hours</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    className="pl-10"
                    placeholder="e.g. Mon-Fri: 8am - 5pm, Sat: 9am - 2pm"
                    value={clinic.openingHours} 
                    onChange={(e) => setClinic({ ...clinic, openingHours: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Clinic Address</Label>
                <Textarea 
                  placeholder="e.g. GE20 Dolores St, AH-1192-8485, Abuakwa"
                  value={clinic.address} 
                  onChange={(e) => setClinic({ ...clinic, address: e.target.value })}
                  rows={2}
                  className="rounded-xl border-slate-200"
                />
              </div>

              <div className="space-y-4 pt-4 border-t">
                <Label className="text-sm font-semibold">Social Media Links</Label>
                <div className="grid sm:grid-cols-3 gap-3">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground/50">FB</span>
                    <Input 
                      className="pl-9 text-xs" 
                      placeholder="Facebook URL"
                      value={clinic.socialFacebook}
                      onChange={(e) => setClinic({ ...clinic, socialFacebook: e.target.value })}
                    />
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground/50">IG</span>
                    <Input 
                      className="pl-9 text-xs" 
                      placeholder="Instagram URL"
                      value={clinic.socialInstagram}
                      onChange={(e) => setClinic({ ...clinic, socialInstagram: e.target.value })}
                    />
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground/50">X</span>
                    <Input 
                      className="pl-9 text-xs" 
                      placeholder="Twitter URL"
                      value={clinic.socialTwitter}
                      onChange={(e) => setClinic({ ...clinic, socialTwitter: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <Label className="text-base">Public Announcement</Label>
                    <p className="text-xs text-muted-foreground">Broadcast an alert to all registered patients.</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      id="show_ann"
                      className="h-4 w-4 accent-primary" 
                      checked={clinic.showAnnouncement}
                      onChange={(e) => setClinic({ ...clinic, showAnnouncement: e.target.checked })}
                    />
                    <Label htmlFor="show_ann" className="cursor-pointer">Active</Label>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs">Announcement Title</Label>
                    <Input 
                      value={clinic.announcementTitle} 
                      onChange={(e) => setClinic({ ...clinic, announcementTitle: e.target.value })}
                      placeholder="e.g. Easter Holiday Notice"
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Announcement Message</Label>
                    <textarea 
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={clinic.announcementBody} 
                      onChange={(e) => setClinic({ ...clinic, announcementBody: e.target.value })}
                      placeholder="Tell your patients something important..."
                    />
                  </div>
                </div>
              </div>

              <div className="pt-6 mt-6 border-t">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="font-bold flex items-center gap-2 text-base">
                      <MessageSquare className="h-5 w-5 text-primary" />
                      Live Chatbot Assistant
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Enable or disable the floating AI assistant widget on the public website pages.
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      id="chatbot_enabled"
                      className="h-5 w-5 accent-primary rounded cursor-pointer" 
                      checked={clinic.chatbotEnabled}
                      onChange={(e) => setClinic({ ...clinic, chatbotEnabled: e.target.checked })}
                    />
                    <Label htmlFor="chatbot_enabled" className="font-bold cursor-pointer">
                      {clinic.chatbotEnabled ? "ENABLED" : "DISABLED"}
                    </Label>
                  </div>
                </div>
              </div>

              <div className="pt-6 mt-6 border-t bg-muted/20 -mx-6 px-6 py-4 rounded-b-xl">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="font-bold flex items-center gap-2 text-base">
                      <ShieldAlert className="h-5 w-5 text-muted-foreground" />
                      Maintenance Mode
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      When active, the entire website will be hidden behind a maintenance screen. 
                      Only Admins can still access the dashboard.
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      id="maint_mode"
                      className="h-5 w-5 accent-primary rounded" 
                      checked={clinic.maintenanceMode}
                      onChange={(e) => setClinic({ ...clinic, maintenanceMode: e.target.checked })}
                    />
                    <Label htmlFor="maint_mode" className="font-bold cursor-pointer">
                      {clinic.maintenanceMode ? "ENABLED" : "OFF"}
                    </Label>
                  </div>
                </div>
              </div>

              <Button type="submit" disabled={loading} className="w-full sm:w-auto h-11 px-8 shadow-lg shadow-primary/10" variant="hero">
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Apply All Settings
              </Button>
            </form>
          </Card>
        </section>

        <section className="grid lg:grid-cols-3 gap-6 pt-8 border-t">
          <div className="lg:col-span-1">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Admin Profile
            </h2>
            <p className="text-sm text-muted-foreground mt-1">Your personal identity in the admin center.</p>
          </div>
          <Card className="lg:col-span-2 p-6 border shadow-sm">
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="full_name"
                    value={profile.fullName}
                    onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                    className="pl-10"
                    placeholder="Administrator Name"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="email"
                    value={profile.email}
                    disabled
                    className="pl-10 bg-muted/50 cursor-not-allowed opacity-70"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Shield className="h-3 w-3" /> Email is locked for security. Contact technical support to change.
                </p>
              </div>
              <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Save Changes
              </Button>
            </form>
          </Card>
        </section>

        <section className="grid md:grid-cols-3 gap-6 pt-6 border-t">
          <div className="md:col-span-1">
            <h2 className="text-lg font-semibold mb-1">Security</h2>
            <p className="text-sm text-muted-foreground">Manage your access credentials.</p>
          </div>
          <Card className="md:col-span-2 p-6 border shadow-sm">
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new_password">New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="new_password"
                    type="password"
                    value={passwords.new}
                    onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                    className="pl-10"
                    placeholder="Enter at least 8 characters"
                    minLength={8}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm_password">Confirm New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="confirm_password"
                    type="password"
                    value={passwords.confirm}
                    onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                    className="pl-10"
                    placeholder="Verify new password"
                    minLength={8}
                    required
                  />
                </div>
              </div>
              <Button type="submit" variant="hero" disabled={loading} className="w-full sm:w-auto">
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Lock className="h-4 w-4 mr-2" />}
                Update Security Credentials
              </Button>
            </form>
          </Card>
        </section>

        {/* Public Website Contact Information */}
        {websiteInfo && (
          <section className="grid lg:grid-cols-3 gap-6 pt-8 border-t">
            <div className="lg:col-span-1">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                Public Website Info
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Contact and branding details currently displayed on the public landing page and footer.
              </p>
              <Button asChild variant="outline" size="sm" className="mt-4 font-bold border-primary/20 text-primary hover:bg-primary-soft">
                <Link to="/admin/cms">
                  <Edit className="h-4 w-4 mr-2" /> Edit Website Content
                </Link>
              </Button>
            </div>
            <Card className="lg:col-span-2 p-6 border shadow-sm bg-slate-50/50">
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Website Name</span>
                  <p className="text-sm font-semibold text-slate-900">{websiteInfo.name || "Nova Eye Care"}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tagline</span>
                  <p className="text-sm font-semibold text-slate-900">{websiteInfo.tagline || "See Better, Live Brighter"}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Public Email</span>
                  <p className="text-sm font-semibold text-slate-900">{websiteInfo.email || "info@novaeyecare.com"}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Public Phone Numbers</span>
                  <p className="text-sm font-semibold text-slate-900">
                    {websiteInfo.phone1} {websiteInfo.phone2 ? ` / ${websiteInfo.phone2}` : ""}
                  </p>
                </div>
                <div className="sm:col-span-2 space-y-1 border-t pt-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Public Address</span>
                  <p className="text-sm font-semibold text-slate-900 whitespace-pre-line">{websiteInfo.address}</p>
                </div>
                <div className="sm:col-span-2 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Google Maps Landmark</span>
                  <p className="text-sm font-semibold text-slate-900">{websiteInfo.mapQuery}</p>
                </div>
              </div>
            </Card>
          </section>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminSettings;
