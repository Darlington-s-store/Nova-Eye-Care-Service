import { useEffect, useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiService } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Loader2, ArrowLeft, ShieldCheck, Mail, CalendarCheck, CheckCircle2, AlertCircle, Smartphone } from "lucide-react";
import logo from "@/assets/logo.jpeg";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

const VerifyOtp = () => {
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [otp, setOtp] = useState("");
  const verificationChannel = 'email';
  
  // Data retrieved from session storage
  const [signupData, setSignupData] = useState<Record<string, string> | null>(null);
  const [otpToken, setOtpToken] = useState("");
  const [devOtp, setDevOtp] = useState("");

  // Timer state (10 minutes = 600 seconds)
  const [timeLeft, setTimeLeft] = useState(600);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Load registration data on mount
  useEffect(() => {
    const dataStr = sessionStorage.getItem("signup_data");
    const token = sessionStorage.getItem("signup_otp_token");
    const dev = sessionStorage.getItem("signup_dev_otp");
    const channel = sessionStorage.getItem("signup_verification_channel") as 'email' | 'sms' || 'email';

    if (!dataStr || !token) {
      toast.error("Registration session expired. Please sign up again.");
      navigate("/signup");
      return;
    }

    try {
      setSignupData(JSON.parse(dataStr));
      setOtpToken(token);
      if (dev) setDevOtp(dev);
    } catch (e) {
      toast.error("Invalid registration session.");
      navigate("/signup");
    }

    // Start timer
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [navigate]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleResendOtp = async () => {
    if (!signupData) return;
    setResending(true);
    try {
      const res = await apiService.auth.sendOtp({
        email: signupData.email,
        phone: signupData.phone,
        channel: verificationChannel
      });
      setOtpToken(res.otpToken);
      sessionStorage.setItem("signup_otp_token", res.otpToken);
      
      if (res.devOtp) {
        setDevOtp(res.devOtp);
        sessionStorage.setItem("signup_dev_otp", res.devOtp);
      } else {
        setDevOtp("");
        sessionStorage.removeItem("signup_dev_otp");
      }
      
      toast.success("A new verification code has been sent!");
      setTimeLeft(600); // Reset timer
      
      // Restart timer
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      const message = error.response?.data?.message || (err as Error).message || "Failed to resend OTP.";
      toast.error(message);
    } finally {
      setResending(false);
    }
  };

  const onVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!signupData || !otpToken) return;
    if (!otp || otp.length < 6) {
      return toast.error("Please enter the 6-digit verification code.");
    }
    setLoading(true);

    try {
      await apiService.auth.register({
        ...signupData,
        otp: otp,
        otpToken: otpToken
      });
      await refresh();
      toast.success("Account created successfully! Welcome to NOVA Eye Care.");
      
      // Clean up session storage
      sessionStorage.removeItem("signup_data");
      sessionStorage.removeItem("signup_otp_token");
      sessionStorage.removeItem("signup_dev_otp");
      
      window.location.href = "/dashboard";
    } catch (err) {
      const error = err as { response?: { data?: { message?: string; errors?: { msg: string }[] } } };
      const message = error.response?.data?.errors?.[0]?.msg || error.response?.data?.message || (err as Error).message || "Verification failed.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    // Save signup data in session storage before going back so Auth.tsx can prefill it
    if (signupData) {
      sessionStorage.setItem("signup_data", JSON.stringify(signupData));
    }
    navigate("/signup");
  };

  if (!signupData) return null;

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white animate-fade-in">
      {/* Brand Panel */}
      <aside className="lg:w-1/2 bg-slate-900 text-white p-12 flex flex-col justify-between overflow-hidden relative">
        <div className="absolute inset-0 opacity-5 pointer-events-none [background-image:radial-gradient(circle_at_30%_30%,white_1px,transparent_1px)] [background-size:24px_24px]" />
        
        <div className="relative z-10">
          <Link to="/" className="inline-flex items-center gap-3 font-bold text-xl mb-12">
            <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-white overflow-hidden border">
              <img src={logo} alt="NOVA Eye Care" className="h-full w-full object-contain p-1" />
            </span>
            NOVA Eye Care
          </Link>
          
          <div className="max-w-md">
            <h2 className="text-4xl md:text-5xl font-bold leading-tight mb-6">Verify Your Account</h2>
            <p className="text-slate-400 text-lg mb-10 leading-relaxed">
              We just need to confirm your contact details to secure your medical record and finalize your registration.
            </p>
            
            <div className="space-y-6">
              {[
                { icon: CalendarCheck, title: "Clinic Portal Integration", desc: "Instantly linked with scheduling system." },
                { icon: ShieldCheck, title: "Encrypted Clinical Data", desc: "Meets global privacy and health compliance guidelines." },
                { icon: Mail, title: "OTP MFA Protection", desc: "Multi-factor verification keeps your account secure." },
              ].map((f) => (
                <div key={f.title} className="flex gap-4">
                  <div className="h-10 w-10 rounded-lg bg-white/10 flex items-center justify-center shrink-0 border border-white/10">
                    <f.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white">{f.title}</h4>
                    <p className="text-sm text-slate-500">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="relative z-10 pt-12 border-t border-white/5 mt-12">
          <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">See Better | Live Brighter</p>
        </div>
      </aside>

      {/* Form Panel */}
      <main className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-slate-50">
        <div className="w-full max-w-md">
          <Card className="p-8 border border-slate-200 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow">
            <div className="text-center mb-6">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <CheckCircle2 className="h-8 w-8 animate-pulse" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight mb-2">
                Check Your Inbox
              </h1>
              <p className="text-sm text-slate-500 font-medium px-4 mb-4">
                We've sent a 6-digit verification code to your chosen contact method.
              </p>
              
              <div className="space-y-2.5 max-w-sm mx-auto">
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100 text-left animate-in fade-in duration-300">
                  <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div className="overflow-hidden flex-1">
                    <p className="text-[10px] uppercase font-bold text-slate-400 leading-none">Email Address</p>
                    <p className="text-xs font-semibold text-slate-700 truncate mt-0.5">{signupData.email}</p>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">Dispatched</span>
                </div>
              </div>
            </div>

            {devOtp && (
              <div className="mb-6 bg-amber-50 border border-amber-200 text-amber-800 text-xs p-3 rounded-lg font-semibold flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-300">
                <span>[Dev Mode] OTP Code: <code className="bg-white px-1.5 py-0.5 rounded border font-mono font-bold text-sm">{devOtp}</code></span>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setOtp(devOtp)}
                  className="h-7 px-3 text-xs font-bold bg-amber-100 hover:bg-amber-200 text-amber-900 rounded"
                >
                  Autofill
                </Button>
              </div>
            )}

            <div className="space-y-6">
              <div className="flex flex-col items-center justify-center py-2">
                <Label className="text-xs font-bold uppercase text-slate-400 mb-3 tracking-wider">Verification Code</Label>
                <InputOTP 
                  maxLength={6} 
                  value={otp} 
                  onChange={(v) => {
                    setOtp(v);
                    if (v.length === 6) {
                      // Trigger submit automatically once 6 digits are entered
                      setTimeout(() => {
                        const submitButton = document.getElementById("submit-otp-btn");
                        if (submitButton) submitButton.click();
                      }, 100);
                    }
                  }}
                >
                  <InputOTPGroup className="gap-2 sm:gap-3">
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                      <InputOTPSlot 
                        key={i} 
                        index={i} 
                        className="h-12 w-10 sm:w-12 text-xl font-bold border border-slate-200 rounded-lg text-slate-900 bg-slate-50 focus:bg-white focus:border-primary focus:ring-1 focus:ring-primary shadow-sm" 
                      />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </div>

              <div className="flex items-center justify-center text-xs font-bold text-slate-400 gap-1.5 py-1">
                <AlertCircle className="h-3.5 w-3.5" />
                <span>Code expires in: <span className="font-mono text-primary font-extrabold">{formatTime(timeLeft)}</span></span>
              </div>

              <div className="text-center py-1">
                <p className="text-sm text-slate-500 font-medium">
                  Didn't get the code?{" "}
                  <button 
                    type="button" 
                    onClick={handleResendOtp} 
                    disabled={timeLeft > 540 || resending}
                    className={`font-bold hover:underline ${timeLeft > 540 || resending ? "text-slate-300 cursor-not-allowed" : "text-primary"}`}
                  >
                    {resending ? "Resending..." : timeLeft > 540 ? `Resend in ${formatTime(timeLeft - 540)}` : "Resend Code"}
                  </button>
                </p>
              </div>

              <div className="flex flex-col gap-3 pt-2">
                <Button 
                  id="submit-otp-btn"
                  onClick={() => onVerify()} 
                  className="w-full h-12 rounded-lg font-bold bg-primary text-white shadow hover:bg-primary/95 transition-all text-base" 
                  disabled={loading || otp.length < 6 || timeLeft === 0}
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Verify & Complete Registration"}
                </Button>

                <button 
                  onClick={handleGoBack} 
                  className="text-sm font-bold text-slate-500 hover:text-primary transition-colors flex items-center justify-center gap-2 mt-2"
                >
                  <ArrowLeft className="h-4 w-4" /> Go back & edit details
                </button>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default VerifyOtp;
