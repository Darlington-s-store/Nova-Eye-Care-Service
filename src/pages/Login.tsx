import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiService } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, ArrowLeft, ArrowRight, CalendarCheck } from "lucide-react";
import logo from "@/assets/logo.jpeg";
import heroGeneral from "@/assets/hero.jpeg";
import { signInWithGoogleFirebase } from "@/lib/firebase";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, refresh } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [signin, setSignin] = useState({ email: "", password: "" });

  const redirectTarget = (location.state as { from?: string } | undefined)?.from || sessionStorage.getItem("nova_redirect_after_auth");
  const isBookingRedirect = !!(redirectTarget && redirectTarget.startsWith("/book"));

  useEffect(() => {
    if (user) {
      if (user.role === 'admin' || user.role === 'super_admin') {
        navigate("/admin", { replace: true });
      } else {
        if (redirectTarget) {
          sessionStorage.removeItem("nova_redirect_after_auth");
          navigate(redirectTarget, { replace: true });
        } else {
          navigate("/dashboard", { replace: true });
        }
      }
    }
  }, [user, navigate, redirectTarget]);

  const handleFirebaseGoogleLogin = async () => {
    setLoading(true);
    try {
      const { idToken } = await signInWithGoogleFirebase();
      if (!idToken) return;
      const data = await apiService.auth.loginWithGoogle(idToken);
      await refresh();
      toast.success("Welcome back!");
      if (data.user.role === 'admin' || data.user.role === 'super_admin') {
        window.location.href = "/admin";
      } else {
        sessionStorage.removeItem("nova_redirect_after_auth");
        window.location.href = redirectTarget || "/dashboard";
      }
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string; response?: { data?: { message?: string } } };
      if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
        return;
      }
      if (error.code === 'auth/unauthorized-domain') {
        const domain = window.location.hostname;
        toast.error(`Domain "${domain}" is not authorized in Firebase Console. Please add "${domain}" under Firebase Authentication > Settings > Authorized domains.`);
        return;
      }
      const message = error.response?.data?.message || error.message || "Google Authentication failed.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const onSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signin.email || !signin.password) {
      return toast.error("Please enter both email and password.");
    }
    setLoading(true);
    try {
      const res = await apiService.auth.login({
        email: signin.email,
        password: signin.password
      });
      await refresh();
      sessionStorage.setItem("nova_just_logged_in", "true");
      toast.success("Welcome back!");
      if (res.user.role === 'admin' || res.user.role === 'super_admin') {
        window.location.href = "/admin";
      } else {
        sessionStorage.removeItem("nova_redirect_after_auth");
        window.location.href = redirectTarget || "/dashboard";
      }
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
            <Link to="/" className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 border border-slate-200 p-1.5 mb-4 transition-transform hover:scale-105 duration-300">
              <img src={logo} alt="NOVA Eye Care" className="h-full w-full object-contain rounded-xl" />
            </Link>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Welcome back</h1>
            <p className="text-sm text-slate-500 mt-2 font-semibold">
              Please enter your credentials to access your portal.
            </p>
          </div>

          {isBookingRedirect && (
            <div className="mb-6 p-4 rounded-xl bg-blue-50 border border-blue-200 flex items-start gap-3 text-blue-900 animate-in fade-in">
              <CalendarCheck className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
              <div className="text-xs leading-relaxed text-left">
                <strong className="block text-sm font-bold text-blue-950 mb-0.5">Account Required to Book</strong>
                Please log in or create an account to schedule and manage your appointment.
              </div>
            </div>
          )}

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
              className="w-full h-12 rounded-xl font-bold bg-primary text-white hover:bg-primary/95 shadow-sm transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2" 
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

          <div className="relative my-6 text-center">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-200" />
            </div>
            <span className="relative bg-white px-4 text-xs font-bold uppercase text-slate-400">
              Or Connect With
            </span>
          </div>

          <div className="flex justify-center mb-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleFirebaseGoogleLogin}
              disabled={loading}
              className="w-full h-12 rounded-xl font-bold border-slate-200 text-slate-700 hover:bg-slate-50 transition-all flex items-center justify-center gap-3 shadow-sm"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              Sign in with Google
            </Button>
          </div>

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
            <Link to="/signup" state={{ from: redirectTarget }}>
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
