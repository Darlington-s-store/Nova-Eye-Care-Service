import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiService } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, ArrowLeft, Mail, Smartphone } from "lucide-react";
import logo from "@/assets/logo.jpeg";
import heroGeneral from "@/assets/hero.jpeg";

const Signup = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showPw, setShowPw] = useState(false);
  const [signUpStep, setSignUpStep] = useState(1);
  const [signup, setSignup] = useState({ 
    fullName: "", phone: "", email: "", password: "",
    gender: "", dateOfBirth: "", nationality: "", bloodGroup: "", region: "", address: "", emergencyContactName: "", emergencyContactPhone: "",
    ocularHistory: "", systemicConditions: "", currentMedications: "", familyEyeHistory: "", allergies: ""
  });

  const [sendingOtp, setSendingOtp] = useState(false);
  const verificationChannel = 'email';

  const handleSendOtp = async () => {
    setSendingOtp(true);
    try {
      const res = await apiService.auth.sendOtp({
        email: signup.email,
        phone: signup.phone,
        channel: verificationChannel
      });
      
      sessionStorage.setItem("signup_data", JSON.stringify(signup));
      sessionStorage.setItem("signup_otp_token", res.otpToken);
      sessionStorage.setItem("signup_verification_channel", verificationChannel);
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
    } finally {
      setSendingOtp(false);
    }
  };

  useEffect(() => {
    const savedDataStr = sessionStorage.getItem("signup_data");
    if (savedDataStr) {
      try {
        const savedData = JSON.parse(savedDataStr);
        setSignup((prev) => ({ ...prev, ...savedData }));
        setSignUpStep(4);
        sessionStorage.removeItem("signup_data");
      } catch (e) {
        console.error("Failed to parse saved signup data:", e);
      }
    }
  }, []);

  useEffect(() => {
    if (user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, navigate]);

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
      
      <div className="w-full max-w-4xl animate-fade-in-up relative z-10">
        <Card className="p-8 lg:p-10 border border-slate-200/80 rounded-2xl bg-white shadow-xl shadow-slate-900/10 relative overflow-hidden group">
          {/* Top decorative gradient bar */}
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-primary via-blue-500 to-indigo-600" />
          
          {/* Steps Timeline Indicator */}
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
            {[
              { step: 1, label: "Account" },
              { step: 2, label: "Personal" },
              { step: 3, label: "Contact" },
              { step: 4, label: "Medical" }
            ].map((s) => (
              <div key={s.step} className="flex items-center gap-2">
                <div className={`h-7 w-7 rounded-full flex items-center justify-center font-bold text-xs border transition-colors ${
                  signUpStep === s.step 
                    ? "bg-primary border-primary text-white" 
                    : signUpStep > s.step 
                      ? "bg-emerald-600 border-emerald-600 text-white" 
                      : "bg-slate-50 border-slate-200 text-slate-400"
                }`}>
                  {signUpStep > s.step ? "✓" : s.step}
                </div>
                <span className={`text-xs font-bold ${signUpStep === s.step ? "text-slate-900" : "text-slate-400"} hidden sm:inline`}>
                  {s.label}
                </span>
              </div>
            ))}
          </div>

          <div className="text-center mb-6">
            <Link to="/" className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 border border-slate-100 p-1 shadow-sm mb-4 transition-transform hover:scale-105 duration-300">
              <img src={logo} alt="NOVA Eye Care" className="h-full w-full object-contain rounded-lg" />
            </Link>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Create your account</h1>
            <p className="text-sm text-slate-500 mt-1 font-semibold">
              Register to start managing your eye health visits.
            </p>
          </div>

          {/* Step 1 Form */}
          {signUpStep === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="su-name" className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Full Name <span className="text-red-500">*</span>
                  </Label>
                  <Input 
                    id="su-name" 
                    required 
                    placeholder="Akua Mensah" 
                    value={signup.fullName} 
                    onChange={(e) => setSignup({ ...signup, fullName: e.target.value })} 
                    className="h-12 rounded-xl border-slate-200 focus-visible:ring-primary focus-visible:border-primary text-base font-semibold px-4 transition-all focus:scale-[1.01]" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="su-phone" className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Phone Number <span className="text-red-500">*</span>
                  </Label>
                  <Input 
                    id="su-phone" 
                    type="tel" 
                    required 
                    placeholder="0244 000 000" 
                    value={signup.phone} 
                    onChange={(e) => setSignup({ ...signup, phone: e.target.value })} 
                    className="h-12 rounded-xl border-slate-200 focus-visible:ring-primary focus-visible:border-primary text-base font-semibold px-4 transition-all focus:scale-[1.01]" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="su-email" className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Email Address <span className="text-red-500">*</span>
                  </Label>
                  <Input 
                    id="su-email" 
                    type="email" 
                    required 
                    placeholder="you@example.com" 
                    value={signup.email} 
                    onChange={(e) => setSignup({ ...signup, email: e.target.value })} 
                    className="h-12 rounded-xl border-slate-200 focus-visible:ring-primary focus-visible:border-primary text-base font-semibold px-4 transition-all focus:scale-[1.01]" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="su-pw" className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Password <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input 
                      id="su-pw" 
                      type={showPw ? "text" : "password"} 
                      required 
                      minLength={8} 
                      placeholder="Min. 8 characters" 
                      value={signup.password} 
                      onChange={(e) => setSignup({ ...signup, password: e.target.value })} 
                      className="h-12 rounded-xl border-slate-200 focus-visible:ring-primary focus-visible:border-primary text-base font-semibold pl-4 pr-12 transition-all focus:scale-[1.01]" 
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPw(!showPw)} 
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
                    >
                      {showPw ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
              </div>
              <Button 
                type="button" 
                onClick={() => {
                  if (!signup.fullName || !signup.email || !signup.password || !signup.phone) {
                    return toast.error("Please fill in all required fields (Name, Phone, Email, Password)");
                  }
                  const cleanPhone = signup.phone.replace(/\D/g, "");
                  if (cleanPhone.length < 9) {
                    return toast.error("Please enter a valid phone number (at least 9 digits)");
                  }
                  setSignUpStep(2);
                }} 
                className="w-full h-12 rounded-xl font-bold bg-primary text-white hover:bg-primary/95 shadow-md shadow-primary/10 transition-all hover:scale-[1.01]"
              >
                Continue to Personal Profile
              </Button>
            </div>
          )}

          {/* Step 2 Form */}
          {signUpStep === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Gender <span className="text-red-500">*</span></Label>
                  <select 
                    value={signup.gender} 
                    onChange={(e) => setSignup({ ...signup, gender: e.target.value })} 
                    className="h-12 w-full rounded-xl border border-slate-200 text-base px-4 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white font-semibold text-slate-800 transition-all cursor-pointer"
                  >
                    <option value="" disabled>Select Gender</option>
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Date of Birth <span className="text-red-500">*</span></Label>
                  <Input 
                    type="date" 
                    value={signup.dateOfBirth} 
                    onChange={(e) => setSignup({ ...signup, dateOfBirth: e.target.value })} 
                    className="h-12 rounded-xl border-slate-200 text-base px-4 focus-visible:ring-primary focus-visible:border-primary font-semibold" 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Blood Group <span className="text-red-500">*</span></Label>
                  <select 
                    value={signup.bloodGroup} 
                    onChange={(e) => setSignup({ ...signup, bloodGroup: e.target.value })} 
                    className="h-12 w-full rounded-xl border border-slate-200 text-base px-4 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white font-semibold text-slate-800 transition-all cursor-pointer"
                  >
                    <option value="" disabled>Select Blood Group</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Nationality <span className="text-red-500">*</span></Label>
                  <select 
                    value={signup.nationality} 
                    onChange={(e) => setSignup({ ...signup, nationality: e.target.value })} 
                    className="h-12 w-full rounded-xl border border-slate-200 text-base px-4 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white font-semibold text-slate-800 transition-all cursor-pointer"
                  >
                    <option value="" disabled>Select Nationality</option>
                    <option value="Ghanaian">Ghanaian</option>
                    <option value="Nigerian">Nigerian</option>
                    <option value="Kenyan">Kenyan</option>
                    <option value="South African">South African</option>
                    <option value="British">British</option>
                    <option value="American">American</option>
                    <option value="Canadian">Canadian</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="space-y-2 col-span-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Region <span className="text-red-500">*</span></Label>
                  <select 
                    value={signup.region} 
                    onChange={(e) => setSignup({ ...signup, region: e.target.value })} 
                    className="h-12 w-full rounded-xl border border-slate-200 text-base px-4 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white font-semibold text-slate-800 transition-all cursor-pointer"
                  >
                    <option value="" disabled>Select Region</option>
                    <option value="Greater Accra">Greater Accra</option>
                    <option value="Ashanti">Ashanti</option>
                    <option value="Eastern">Eastern</option>
                    <option value="Central">Central</option>
                    <option value="Western">Western</option>
                    <option value="Western North">Western North</option>
                    <option value="Volta">Volta</option>
                    <option value="Oti">Oti</option>
                    <option value="Northern">Northern</option>
                    <option value="Savannah">Savannah</option>
                    <option value="North East">North East</option>
                    <option value="Upper East">Upper East</option>
                    <option value="Upper West">Upper West</option>
                    <option value="Bono">Bono</option>
                    <option value="Bono East">Bono East</option>
                    <option value="Ahafo">Ahafo</option>
                    <option value="Outside Ghana">Outside Ghana</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setSignUpStep(1)} className="w-1/3 h-12 rounded-xl font-bold border-slate-200 text-slate-700">
                  Back
                </Button>
                <Button 
                  type="button" 
                  onClick={() => {
                    if (!signup.gender || !signup.dateOfBirth || !signup.bloodGroup || !signup.nationality || !signup.region) {
                      return toast.error("Please fill in and select all required personal profile fields (Gender, DOB, Blood Group, Nationality, Region)");
                    }
                    setSignUpStep(3);
                  }} 
                  className="w-2/3 h-12 rounded-xl font-bold bg-primary text-white hover:bg-primary/95"
                >
                  Continue to Contact Details
                </Button>
              </div>
            </div>
          )}

          {/* Step 3 Form */}
          {signUpStep === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Emergency Contact</Label>
                  <Input 
                    placeholder="Name" 
                    value={signup.emergencyContactName} 
                    onChange={(e) => setSignup({ ...signup, emergencyContactName: e.target.value })} 
                    className="h-12 rounded-xl border-slate-200 text-base px-4 focus-visible:ring-primary focus-visible:border-primary" 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Emergency Phone</Label>
                  <Input 
                    placeholder="Phone" 
                    value={signup.emergencyContactPhone} 
                    onChange={(e) => setSignup({ ...signup, emergencyContactPhone: e.target.value })} 
                    className="h-12 rounded-xl border-slate-200 text-base px-4 focus-visible:ring-primary focus-visible:border-primary" 
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Residential Address</Label>
                  <Input 
                    placeholder="Your physical address" 
                    value={signup.address} 
                    onChange={(e) => setSignup({ ...signup, address: e.target.value })} 
                    className="h-12 rounded-xl border-slate-200 text-base px-4 focus-visible:ring-primary focus-visible:border-primary" 
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setSignUpStep(2)} className="w-1/3 h-12 rounded-xl font-bold border-slate-200 text-slate-700">
                  Back
                </Button>
                <Button type="button" onClick={() => setSignUpStep(4)} className="w-2/3 h-12 rounded-xl font-bold bg-primary text-white hover:bg-primary/95">
                  Continue to Medical Setup
                </Button>
              </div>
            </div>
          )}

          {/* Step 4 Form */}
          {signUpStep === 4 && (
            <form onSubmit={(e) => { e.preventDefault(); handleSendOtp(); }} className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Ocular History</Label>
                  <Input 
                    placeholder="Previous eye surgeries or conditions" 
                    value={signup.ocularHistory} 
                    onChange={(e) => setSignup({ ...signup, ocularHistory: e.target.value })} 
                    className="h-12 rounded-xl border-slate-200 text-base px-4 focus-visible:ring-primary focus-visible:border-primary" 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Systemic Conditions</Label>
                  <Input 
                    placeholder="E.g. Diabetes, Hypertension" 
                    value={signup.systemicConditions} 
                    onChange={(e) => setSignup({ ...signup, systemicConditions: e.target.value })} 
                    className="h-12 rounded-xl border-slate-200 text-base px-4 focus-visible:ring-primary focus-visible:border-primary" 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Current Medications</Label>
                  <Input 
                    placeholder="Any medications you are taking" 
                    value={signup.currentMedications} 
                    onChange={(e) => setSignup({ ...signup, currentMedications: e.target.value })} 
                    className="h-12 rounded-xl border-slate-200 text-base px-4 focus-visible:ring-primary focus-visible:border-primary" 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Family Eye History</Label>
                  <Input 
                    placeholder="E.g. Glaucoma in family" 
                    value={signup.familyEyeHistory} 
                    onChange={(e) => setSignup({ ...signup, familyEyeHistory: e.target.value })} 
                    className="h-12 rounded-xl border-slate-200 text-base px-4 focus-visible:ring-primary focus-visible:border-primary" 
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Allergies</Label>
                  <Input 
                    placeholder="Any known allergies" 
                    value={signup.allergies} 
                    onChange={(e) => setSignup({ ...signup, allergies: e.target.value })} 
                    className="h-12 rounded-xl border-slate-200 text-base px-4 focus-visible:ring-primary focus-visible:border-primary" 
                  />
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-slate-100">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Verification Method <span className="text-red-500">*</span>
                </Label>
                <div className="flex items-center gap-4 p-4 rounded-2xl border border-primary bg-primary/[0.03] ring-2 ring-primary/20 shadow-sm shadow-primary/5">
                  <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0 bg-primary text-white">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div className="overflow-hidden flex-1">
                    <p className="text-sm font-bold text-slate-900 leading-tight">Send via Email</p>
                    <p className="text-xs font-semibold text-slate-400 truncate mt-0.5">{signup.email}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <Button type="button" variant="outline" onClick={() => setSignUpStep(3)} className="w-1/3 h-12 rounded-xl font-bold border-slate-200 text-slate-700">
                  Back
                </Button>
                <Button 
                  type="submit" 
                  disabled={sendingOtp} 
                  className="w-2/3 h-12 rounded-xl font-bold bg-primary text-white hover:bg-primary/95 flex items-center justify-center gap-2"
                >
                  {sendingOtp ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send Verification Code"}
                </Button>
              </div>
            </form>
          )}

          <div className="relative my-6 text-center">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-200" />
            </div>
            <span className="relative bg-white px-4 text-xs font-bold uppercase text-slate-400">
              Already registered?
            </span>
          </div>

          <Button 
            asChild 
            variant="outline" 
            className="w-full h-12 rounded-xl font-bold border-slate-200 text-slate-700 hover:bg-slate-50 transition-all"
          >
            <Link to="/login">
              Sign In to Portal
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

export default Signup;
