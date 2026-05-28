import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { apiService } from "@/lib/api";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { Eye, EyeOff, Loader2, ShieldCheck, Lock } from "lucide-react";
import logo from "@/assets/logo.jpeg";
import authBg from "@/assets/hero.jpeg";

const AdminLogin = () => {
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });

  useEffect(() => {
    const check = async () => {
      const token = localStorage.getItem('nova_auth_token');
      if (!token) return;
      try {
        const user = await apiService.auth.getMe();
        if (user && user.role === "admin") {
          navigate("/admin", { replace: true });
        }
      } catch (err) {
        // Token might be invalid, just stay on login
      }
    };
    check();
  }, [navigate]);

  const onSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await apiService.auth.login(form);
      if (data.user.role !== "admin") {
        apiService.auth.logout();
        toast.error("This account does not have admin access.");
        setLoading(false);
        return;
      }
      await refresh();
      toast.success("Welcome, Admin");
      window.location.href = "/admin";
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const onSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password.length < 8) { toast.error("Use at least 8 characters"); return; }
    setLoading(true);
    try {
      // For admin signup, we might need a special flag or the backend might default to patient
      // Assuming register endpoint handles creating admin if first user or via specific logic
      const data = await apiService.auth.register({
        ...form,
        role: 'admin' // Backend should validate if this is allowed
      });
      
      if (data.user.role !== "admin") {
        apiService.auth.logout();
        toast.error("Admin account created but role not assigned. Contact support.");
        setLoading(false);
        return;
      }
      
      await refresh();
      toast.success("Admin account created");
      window.location.href = "/admin";
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative bg-muted/30">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-10 grayscale"
        style={{ backgroundImage: `url(${authBg})` }}
      />

      <div className="relative w-full max-w-md">
        <div className="text-center mb-6">
          <div className="flex flex-col items-center gap-4 mb-6">
            <div className="h-16 w-16 rounded-lg bg-white shadow-sm overflow-hidden p-2 flex items-center justify-center border">
              <img src={logo} alt="NOVA Eye Care Logo" className="h-full w-full object-contain" />
            </div>
            <span className="inline-flex items-center gap-2 px-3 py-1 text-[10px] font-bold rounded bg-primary text-primary-foreground tracking-widest uppercase">
              <ShieldCheck className="h-3.5 w-3.5" /> Restricted Access
            </span>
          </div>
          <h1 className="text-2xl font-bold">Admin Portal</h1>
          <p className="text-sm text-muted-foreground mt-1">Authorized personnel only</p>
        </div>

        <Card className="p-7 md:p-8 shadow-sm border bg-card">
          <form onSubmit={onSignIn} className="space-y-5">
            <div>
              <Label htmlFor="ai-email">Admin Email</Label>
              <Input 
                id="ai-email" 
                type="email" 
                required 
                autoComplete="email"
                placeholder="admin@novaeyecare.com"
                value={form.email} 
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="mt-1.5 h-12 border focus:ring-1 focus:ring-primary" 
              />
            </div>
            <div>
              <Label htmlFor="ai-pw" className="flex justify-between">
                Password
                <Link to="/forgot-password" className="text-xs text-muted-foreground hover:text-primary transition-colors">Forgot?</Link>
              </Label>
              <div className="relative mt-1.5">
                <Input 
                  id="ai-pw" 
                  type={show ? "text" : "password"} 
                  required 
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={form.password} 
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="h-12 border focus:ring-1 focus:ring-primary pr-10" 
                />
                <button 
                  type="button" 
                  onClick={() => setShow(!show)} 
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" 
                  aria-label="Toggle password"
                >
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" size="lg" className="w-full h-12 rounded-lg font-bold" disabled={loading}>
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Lock className="h-4 w-4 mr-2" /> Sign into Dashboard</>}
            </Button>
          </form>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6 uppercase tracking-wider font-bold">
          <Link to="/" className="hover:text-primary transition-colors">← Back to website</Link>
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;
