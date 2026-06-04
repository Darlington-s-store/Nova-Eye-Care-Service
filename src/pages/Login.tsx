import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiService } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, ArrowLeft, ArrowRight } from "lucide-react";
import logo from "@/assets/logo.jpeg";
import heroGeneral from "@/assets/hero.jpeg";

const Login = () => {
  const navigate = useNavigate();
  const { user, refresh } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [signin, setSignin] = useState({ email: "", password: "" });

  useEffect(() => {
    if (user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, navigate]);

  const onSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signin.email || !signin.password) {
      return toast.error("Please enter both email and password.");
    }
    setLoading(true);
    try {
      await apiService.auth.login({
        email: signin.email,
        password: signin.password
      });
      await refresh();
      toast.success("Welcome back!");
      window.location.href = "/dashboard";
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      const message = error.response?.data?.message || (err as Error).message || "Invalid email or password.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 font-sans relative overflow-hidden p-6">
      {/* Background Image with Dark Backdrop Filter Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-30 pointer-events-none scale-105 filter blur-[2px]"
        style={{ backgroundImage: `url(${heroGeneral})` }}
      />
      <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-[6px] pointer-events-none" />

      {/* Decorative ambient radial glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none" />
      
      <div className="w-full max-w-md animate-fade-in-up relative z-10">
        <Card className="p-8 lg:p-10 border border-slate-200/80 rounded-2xl bg-white shadow-xl shadow-slate-900/10 relative overflow-hidden group">
          {/* Top decorative gradient line */}
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-primary via-blue-500 to-indigo-600" />
          
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 border border-slate-100 p-1.5 shadow-sm mb-4 transition-transform hover:scale-105 duration-300">
              <img src={logo} alt="NOVA Eye Care" className="h-full w-full object-contain rounded-xl" />
            </Link>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Welcome back</h1>
            <p className="text-sm text-slate-500 mt-2 font-semibold">
              Please enter your credentials to access your portal.
            </p>
          </div>

          <form onSubmit={onSignIn} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Email Address
              </Label>
              <Input 
                id="email" 
                type="email" 
                required 
                autoComplete="email"
                placeholder="you@example.com" 
                value={signin.email} 
                onChange={(e) => setSignin({ ...signin, email: e.target.value })} 
                className="h-12 rounded-xl border-slate-200 focus-visible:ring-primary focus-visible:border-primary text-base font-semibold px-4 transition-all focus:scale-[1.01]" 
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="pw" className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Password
                </Label>
                <Link to="/forgot-password" className="text-xs font-bold text-primary hover:underline hover:text-blue-700 transition-colors">
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <Input 
                  id="pw" 
                  type={showPw ? "text" : "password"} 
                  required 
                  autoComplete="current-password"
                  placeholder="••••••••" 
                  value={signin.password} 
                  onChange={(e) => setSignin({ ...signin, password: e.target.value })} 
                  className="h-12 rounded-xl border-slate-200 focus-visible:ring-primary focus-visible:border-primary text-base font-semibold pl-4 pr-12 transition-all focus:scale-[1.01]" 
                />
                <button 
                  type="button" 
                  onClick={() => setShowPw(!showPw)} 
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
                  aria-label={showPw ? "Hide password" : "Show password"}
                >
                  {showPw ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 rounded-xl font-bold bg-primary text-white hover:bg-primary/95 shadow-md shadow-primary/10 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Signing In...
                </>
              ) : (
                <>
                  Sign In to Portal <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          <div className="relative my-8 text-center">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-200" />
            </div>
            <span className="relative bg-white px-4 text-xs font-bold uppercase text-slate-400">
              New to NOVA?
            </span>
          </div>

          <Button 
            asChild 
            variant="outline" 
            className="w-full h-12 rounded-xl font-bold border-slate-200 text-slate-700 hover:bg-slate-50 transition-all"
          >
            <Link to="/signup">
              Create Patient Account
            </Link>
          </Button>
        </Card>
        
        <div className="mt-8 text-center">
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold text-slate-300 hover:text-primary transition-colors">
            <ArrowLeft className="h-4 w-4" /> Return to Main Website
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
