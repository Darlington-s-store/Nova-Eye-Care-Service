import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiService } from "@/lib/api";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { Eye, EyeOff, Loader2, ShieldCheck, Lock, ArrowLeft } from "lucide-react";
import logo from "@/assets/logo.jpeg";
import authBg from "@/assets/hero.jpeg";

const AdminLogin = () => {
  const navigate = useNavigate();
  const { refresh } = useAuth();
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
    if (!form.email || !form.password) {
      return toast.error("Please enter both email and password.");
    }
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
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || (err as Error).message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 font-sans relative overflow-hidden p-6">
      {/* Background Image with Dark Backdrop Filter Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-30 pointer-events-none scale-105 filter blur-[2px]"
        style={{ backgroundImage: `url(${authBg})` }}
      />
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-[6px] pointer-events-none" />

      {/* Decorative ambient radial glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-red-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-amber-500/5 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md animate-fade-in-up relative z-10">
        <Card className="p-8 lg:p-10 border border-slate-200/80 rounded-2xl bg-white shadow-xl shadow-slate-900/10 relative overflow-hidden group">
          {/* Top decorative gradient line */}
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-red-600 via-orange-500 to-amber-500" />

          <div className="text-center mb-8">
            <Link to="/" className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 border border-slate-100 p-1.5 shadow-sm mb-4 transition-transform hover:scale-105 duration-300">
              <img src={logo} alt="NOVA Eye Care" className="h-full w-full object-contain rounded-xl" />
            </Link>
            
            <div className="flex justify-center mb-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold rounded-full bg-red-50 text-red-600 border border-red-100 tracking-wider uppercase">
                <ShieldCheck className="h-3.5 w-3.5 animate-pulse" /> Restricted Access
              </span>
            </div>

            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Admin Portal</h1>
            <p className="text-sm text-slate-500 mt-2 font-semibold">
              Authorized personnel only
            </p>
          </div>

          <form onSubmit={onSignIn} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="ai-email" className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Admin Email
              </Label>
              <Input 
                id="ai-email" 
                type="email" 
                required 
                autoComplete="email"
                placeholder="admin@novaeyecare.com" 
                value={form.email} 
                onChange={(e) => setForm({ ...form, email: e.target.value })} 
                className="h-12 rounded-xl border-slate-200 focus-visible:ring-red-500 focus-visible:border-red-500 text-base font-semibold px-4 transition-all focus:scale-[1.01]" 
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="ai-pw" className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Password
                </Label>
                <Link to="/forgot-password" className="text-xs font-bold text-red-600 hover:underline hover:text-red-700 transition-colors">
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <Input 
                  id="ai-pw" 
                  type={show ? "text" : "password"} 
                  required 
                  autoComplete="current-password"
                  placeholder="••••••••" 
                  value={form.password} 
                  onChange={(e) => setForm({ ...form, password: e.target.value })} 
                  className="h-12 rounded-xl border-slate-200 focus-visible:ring-red-500 focus-visible:border-red-500 text-base font-semibold pl-4 pr-12 transition-all focus:scale-[1.01]" 
                />
                <button 
                  type="button" 
                  onClick={() => setShow(!show)} 
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
                  aria-label={show ? "Hide password" : "Show password"}
                >
                  {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 rounded-xl font-bold bg-gradient-to-r from-red-600 to-orange-600 text-white hover:from-red-600/95 hover:to-orange-600/95 shadow-md shadow-red-500/10 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Signing In...
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" /> Sign In to Dashboard
                </>
              )}
            </Button>
          </form>
        </Card>
        
        <div className="mt-8 text-center">
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold text-slate-300 hover:text-red-400 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Return to Main Website
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;

