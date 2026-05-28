import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { apiService } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, CalendarCheck, ShieldCheck, Mail } from "lucide-react";
import logo from "@/assets/logo.jpeg";
import heroGeneral from "@/assets/hero.jpeg";

const Auth = () => {
  const navigate = useNavigate();
  const { user, refresh } = useAuth();
  const [tab, setTab] = useState("signin");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [signin, setSignin] = useState({ email: "", password: "" });
  const [signUpStep, setSignUpStep] = useState(1);
  const [signup, setSignup] = useState({ 
    fullName: "", phone: "", email: "", password: "",
    gender: "", dateOfBirth: "", nationality: "", bloodGroup: "", address: "", emergencyContactName: "", emergencyContactPhone: "",
    ocularHistory: "", systemicConditions: "", currentMedications: "", familyEyeHistory: "", allergies: ""
  });

  const [captcha, setCaptcha] = useState<{ question: string; captchaToken: string } | null>(null);
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);

  const fetchCaptcha = async () => {
    try {
      const data = await apiService.auth.getCaptcha();
      setCaptcha(data);
      setCaptchaAnswer("");
    } catch (err) {
      toast.error("Failed to load human verification captcha");
    }
  };

  const handleSendOtp = async () => {
    if (!captchaAnswer) {
      return toast.error("Please answer the human verification question first");
    }
    setSendingOtp(true);
    try {
      const res = await apiService.auth.sendOtp({
        email: signup.email,
        phone: signup.phone,
        captchaToken: captcha?.captchaToken || "",
        captchaAnswer: captchaAnswer
      });
      
      // Store state in sessionStorage for separate OTP verification page
      sessionStorage.setItem("signup_data", JSON.stringify(signup));
      sessionStorage.setItem("signup_otp_token", res.otpToken);
      if (res.devOtp) {
        sessionStorage.setItem("signup_dev_otp", res.devOtp);
      } else {
        sessionStorage.removeItem("signup_dev_otp");
      }

      toast.success("Verification code sent! Please verify your account.");
      navigate("/verify-otp");
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      const message = error.response?.data?.message || (err as Error).message || "Failed to send OTP.";
      toast.error(message);
      fetchCaptcha();
    } finally {
      setSendingOtp(false);
    }
  };

  // Prefill signup details if redirected back from verify-otp
  useEffect(() => {
    const savedDataStr = sessionStorage.getItem("signup_data");
    if (savedDataStr) {
      try {
        const savedData = JSON.parse(savedDataStr);
        setSignup((prev) => ({ ...prev, ...savedData }));
        setTab("signup");
        setSignUpStep(3);
        // Clean up so it doesn't linger
        sessionStorage.removeItem("signup_data");
      } catch (e) {
        console.error("Failed to parse saved signup data:", e);
      }
    }
  }, []);

  useEffect(() => {
    if (signUpStep === 3) {
      fetchCaptcha();
    }
  }, [signUpStep]);

  useEffect(() => {
    if (user) navigate("/dashboard", { replace: true });
  }, [user, navigate]);

  const onSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
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
    <div className="min-h-screen flex flex-col lg:flex-row bg-white">
      {/* Brand Panel */}
      <aside className="lg:w-1/2 bg-slate-900 text-white p-12 flex flex-col justify-between overflow-hidden relative">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-15 pointer-events-none"
          style={{ backgroundImage: `url(${heroGeneral})` }}
        />
        <div className="absolute inset-0 opacity-5 pointer-events-none [background-image:radial-gradient(circle_at_30%_30%,white_1px,transparent_1px)] [background-size:24px_24px]" />
        
        <div className="relative z-10">
          <Link to="/" className="inline-flex items-center gap-3 font-bold text-xl mb-12">
            <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-white overflow-hidden border">
              <img src={logo} alt="NOVA Eye Care" className="h-full w-full object-contain p-1" />
            </span>
            NOVA Eye Care
          </Link>
          
          <div className="max-w-md">
            <h2 className="text-4xl md:text-5xl font-bold leading-tight mb-6">Patient Portal Access</h2>
            <p className="text-slate-400 text-lg mb-10 leading-relaxed">
              Your gateway to comprehensive vision care. Book exams, view clinical reports, and manage your ocular health in one secure place.
            </p>
            
            <div className="space-y-6">
              {[
                { icon: CalendarCheck, title: "Self-Service Booking", desc: "Schedule or reschedule visits instantly." },
                { icon: ShieldCheck, title: "Secure Records", desc: "Access your clinical reports safely." },
                { icon: Mail, title: "Direct Communication", desc: "Stay informed about your eye care journey." },
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
          <Card className="p-8 border border-slate-200 rounded-xl bg-white shadow-sm">
            <div className="mb-8">
              <h1 className="text-2xl font-bold mb-2">
                {tab === "signin" ? "Welcome back" : "Create your account"}
              </h1>
              <p className="text-sm text-slate-500 font-medium leading-relaxed">
                {tab === "signin" ? "Please enter your credentials to access your portal." : "Register to start managing your eye health visits."}
              </p>
            </div>

            <Tabs value={tab} onValueChange={setTab}>
              <TabsList className="grid grid-cols-2 w-full mb-8 bg-slate-100 p-1 rounded-lg">
                <TabsTrigger value="signin" className="rounded-md font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">Sign In</TabsTrigger>
                <TabsTrigger value="signup" className="rounded-md font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="signin" className="space-y-6">
                <form onSubmit={onSignIn} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="si-email" className="text-xs font-bold uppercase text-slate-500">Email Address</Label>
                    <Input id="si-email" type="email" required placeholder="you@example.com" value={signin.email} onChange={(e) => setSignin({ ...signin, email: e.target.value })} className="h-12 rounded-lg" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="si-pw" className="text-xs font-bold uppercase text-slate-500">Password</Label>
                      <Link to="/forgot-password" className="text-xs font-bold text-primary hover:underline">Forgot?</Link>
                    </div>
                    <div className="relative">
                      <Input id="si-pw" type={showPw ? "text" : "password"} required placeholder="••••••••" value={signin.password} onChange={(e) => setSignin({ ...signin, password: e.target.value })} className="h-12 rounded-lg pr-12" />
                      <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        {showPw ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                  <Button type="submit" className="w-full h-12 rounded-lg font-bold bg-primary text-white" disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign In to Portal"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="space-y-6">
                {signUpStep === 1 && (
                  <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-bold text-lg">Step 1: Account Info</h3>
                      <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded">1 of 3</span>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="su-name" className="text-xs font-bold uppercase text-slate-500">Full Name</Label>
                      <Input id="su-name" required placeholder="Akua Mensah" value={signup.fullName} onChange={(e) => setSignup({ ...signup, fullName: e.target.value })} className="h-12 rounded-lg" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="su-phone" className="text-xs font-bold uppercase text-slate-500">Phone Number</Label>
                      <Input id="su-phone" type="tel" required placeholder="0244 000 000" value={signup.phone} onChange={(e) => setSignup({ ...signup, phone: e.target.value })} className="h-12 rounded-lg" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="su-email" className="text-xs font-bold uppercase text-slate-500">Email Address</Label>
                      <Input id="su-email" type="email" required placeholder="you@example.com" value={signup.email} onChange={(e) => setSignup({ ...signup, email: e.target.value })} className="h-12 rounded-lg" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="su-pw" className="text-xs font-bold uppercase text-slate-500">Password</Label>
                      <div className="relative">
                        <Input id="su-pw" type={showPw ? "text" : "password"} required minLength={8} placeholder="Min. 8 characters" value={signup.password} onChange={(e) => setSignup({ ...signup, password: e.target.value })} className="h-12 rounded-lg pr-12" />
                        <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                          {showPw ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>
                    <Button type="button" onClick={() => {
                      if (!signup.fullName || !signup.email || !signup.password) return toast.error("Please fill required fields");
                      setSignUpStep(2);
                    }} className="w-full h-12 rounded-lg font-bold bg-primary text-white">
                      Next Step
                    </Button>
                  </div>
                )}

                {signUpStep === 2 && (
                  <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-bold text-lg">Step 2: Personal Profile</h3>
                      <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded">2 of 3</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase text-slate-500">Gender</Label>
                        <Input placeholder="e.g. Female" value={signup.gender} onChange={(e) => setSignup({ ...signup, gender: e.target.value })} className="h-12 rounded-lg" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase text-slate-500">Date of Birth</Label>
                        <Input type="date" value={signup.dateOfBirth} onChange={(e) => setSignup({ ...signup, dateOfBirth: e.target.value })} className="h-12 rounded-lg" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase text-slate-500">Nationality</Label>
                        <Input placeholder="e.g. Ghanaian" value={signup.nationality} onChange={(e) => setSignup({ ...signup, nationality: e.target.value })} className="h-12 rounded-lg" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase text-slate-500">Blood Group</Label>
                        <Input placeholder="e.g. O+" value={signup.bloodGroup} onChange={(e) => setSignup({ ...signup, bloodGroup: e.target.value })} className="h-12 rounded-lg" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase text-slate-500">Residential Address</Label>
                      <Input placeholder="Your physical address" value={signup.address} onChange={(e) => setSignup({ ...signup, address: e.target.value })} className="h-12 rounded-lg" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase text-slate-500">Emergency Contact</Label>
                        <Input placeholder="Name" value={signup.emergencyContactName} onChange={(e) => setSignup({ ...signup, emergencyContactName: e.target.value })} className="h-12 rounded-lg" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase text-slate-500">Emergency Phone</Label>
                        <Input placeholder="Phone" value={signup.emergencyContactPhone} onChange={(e) => setSignup({ ...signup, emergencyContactPhone: e.target.value })} className="h-12 rounded-lg" />
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Button type="button" variant="outline" onClick={() => setSignUpStep(1)} className="w-1/3 h-12 rounded-lg font-bold">Back</Button>
                      <Button type="button" onClick={() => setSignUpStep(3)} className="w-2/3 h-12 rounded-lg font-bold bg-primary text-white">Next Step</Button>
                    </div>
                  </div>
                )}

                {signUpStep === 3 && (
                  <form onSubmit={(e) => { e.preventDefault(); handleSendOtp(); }} className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-bold text-lg">Step 3: Medical History</h3>
                      <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded">3 of 3</span>
                    </div>
                    <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase text-slate-500">Ocular History</Label>
                        <Input placeholder="Previous eye surgeries or conditions" value={signup.ocularHistory} onChange={(e) => setSignup({ ...signup, ocularHistory: e.target.value })} className="h-10 rounded-lg" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase text-slate-500">Systemic Conditions</Label>
                        <Input placeholder="E.g. Diabetes, Hypertension" value={signup.systemicConditions} onChange={(e) => setSignup({ ...signup, systemicConditions: e.target.value })} className="h-10 rounded-lg" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase text-slate-500">Current Medications</Label>
                        <Input placeholder="Any medications you are taking" value={signup.currentMedications} onChange={(e) => setSignup({ ...signup, currentMedications: e.target.value })} className="h-10 rounded-lg" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase text-slate-500">Family Eye History</Label>
                        <Input placeholder="E.g. Glaucoma in family" value={signup.familyEyeHistory} onChange={(e) => setSignup({ ...signup, familyEyeHistory: e.target.value })} className="h-10 rounded-lg" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase text-slate-500">Allergies</Label>
                        <Input placeholder="Any known allergies" value={signup.allergies} onChange={(e) => setSignup({ ...signup, allergies: e.target.value })} className="h-10 rounded-lg" />
                      </div>
                    </div>

                    {/* Human Verification */}
                    <div className="border-t border-slate-100 pt-4 mt-2 space-y-3">
                      <h4 className="text-xs font-bold uppercase text-slate-400">Security Verification</h4>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase text-slate-500">Solve this math problem to continue</Label>
                        <div className="flex gap-2">
                          <div className="flex items-center justify-between bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 text-sm font-semibold text-slate-700 flex-1">
                            <span>{captcha ? captcha.question : "Loading verification..."}</span>
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="sm" 
                              onClick={fetchCaptcha} 
                              className="text-xs font-bold text-primary hover:text-primary/80 h-7 px-2"
                            >
                              Refresh
                            </Button>
                          </div>
                          <Input 
                            type="number" 
                            placeholder="Answer" 
                            value={captchaAnswer} 
                            onChange={(e) => setCaptchaAnswer(e.target.value)} 
                            className="h-11 rounded-lg w-1/3"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <Button type="button" variant="outline" onClick={() => setSignUpStep(2)} className="w-1/3 h-12 rounded-lg font-bold">Back</Button>
                      <Button 
                        type="submit" 
                        disabled={sendingOtp || !captchaAnswer || !captcha} 
                        className="w-2/3 h-12 rounded-lg font-bold bg-primary text-white"
                      >
                        {sendingOtp ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify & Send OTP"}
                      </Button>
                    </div>
                  </form>
                )}
              </TabsContent>
            </Tabs>
          </Card>
          <div className="mt-8 text-center">
            <Link to="/" className="text-sm font-bold text-slate-500 hover:text-primary transition-colors">← Return to Main Website</Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Auth;
