import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiService } from "@/lib/api";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, Save, User as UserIcon, Mail, Phone, ArrowLeft, Globe } from "lucide-react";
import { Link } from "react-router-dom";

const Profile = () => {
  const { user } = useAuth();
  const [form, setForm] = useState({ fullName: "", phone: "", email: "", nationality: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profile = await apiService.profiles.getMe();
        if (profile) {
          setForm({
            fullName: profile.fullName || "",
            phone: profile.phone || "",
            email: profile.email || "",
            nationality: profile.nationality || "",
          });
        }
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.fullName.trim().length < 2) { 
      toast.error("Please enter your full name"); 
      return; 
    }
    
    setSaving(true);
    try {
      await apiService.profiles.updateMe({
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        nationality: form.nationality.trim(),
      });
      toast.success("Profile updated");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <section className="bg-primary text-primary-foreground border-b shadow-sm">
        <div className="container py-12">
          <Link to="/dashboard" className="inline-flex items-center gap-1 text-sm opacity-90 hover:opacity-100 mb-3">
            <ArrowLeft className="h-4 w-4" /> Back to dashboard
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold">Your Profile</h1>
          <p className="text-sm opacity-90 mt-1">Update your personal information.</p>
        </div>
      </section>

      <section className="container py-10 max-w-2xl">
        <Card className="p-6 md:p-8 border shadow-sm rounded-xl">
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : (
            <form onSubmit={onSave} className="space-y-5">
              <div>
                <Label htmlFor="fullName">Full Name</Label>
                <div className="relative mt-1.5">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="fullName" value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                    className="pl-9 h-11" />
                </div>
              </div>
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative mt-1.5">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="phone" type="tel" value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="pl-9 h-11" />
              </div>
            </div>
            <div>
              <Label htmlFor="nationality">Nationality</Label>
              <div className="relative mt-1.5">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="nationality" value={form.nationality}
                  onChange={(e) => setForm({ ...form, nationality: e.target.value })}
                  placeholder="e.g. Ghanaian"
                  className="pl-9 h-11" />
              </div>
            </div>
            <div>
              <Label htmlFor="email">Email Address</Label>
                <div className="relative mt-1.5">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="email" type="email" value={form.email} disabled className="pl-9 h-11 bg-muted" />
                </div>
                <p className="text-xs text-muted-foreground mt-1">Email cannot be changed from here. Contact us if you need to update it.</p>
              </div>
              <Button type="submit" size="lg" disabled={saving} className="rounded-lg font-bold">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4" /> Save changes</>}
              </Button>
            </form>
          )}
        </Card>
      </section>
    </Layout>
  );
};

export default Profile;
