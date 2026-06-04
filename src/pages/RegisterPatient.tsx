import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiService } from "@/lib/api";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { 
  User, 
  MapPin, 
  HeartPulse, 
  PhoneCall, 
  CheckCircle2, 
  Loader2, 
  ArrowRight, 
  ArrowLeft,
  CalendarDays,
  ShieldCheck
} from "lucide-react";

const STEPS = [
  { id: "personal", title: "Personal Details", icon: User },
  { id: "contact", title: "Contact & Address", icon: MapPin },
  { id: "medical", title: "Medical Basics", icon: HeartPulse },
  { id: "emergency", title: "Emergency Contact", icon: PhoneCall },
];

export default function RegisterPatient() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [fetchingProfile, setFetchingProfile] = useState(true);
  
  const [form, setForm] = useState({
    fullName: "",
    dateOfBirth: "",
    gender: "",
    nationality: "",
    phone: "",
    email: "",
    address: "",
    bloodGroup: "",
    region: "",
    medicalHistory: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
  });

  useEffect(() => {
    const checkUser = async () => {
      try {
        const user = await apiService.auth.getMe();
        if (!user) {
          navigate("/login");
          return;
        }
        
        const profile = await apiService.profiles.getMe();
          
        if (profile) {
          if (profile.registrationCompleted) {
            toast.info("Registration already completed!");
            navigate("/dashboard");
            return;
          }
          setForm(f => ({
            ...f,
            fullName: profile.fullName || "",
            phone: profile.phone || "",
            email: user.email || "",
            nationality: profile.nationality || "",
            gender: profile.gender || "",
            dateOfBirth: profile.dateOfBirth || "",
            address: profile.address || "",
            bloodGroup: profile.bloodGroup || "",
            region: profile.region || "",
            medicalHistory: profile.medicalHistory || "",
            emergencyContactName: profile.emergencyContactName || "",
            emergencyContactPhone: profile.emergencyContactPhone || "",
          }));
        }
      } catch (err) {
        navigate("/login");
      } finally {
        setFetchingProfile(false);
      }
    };
    checkUser();
  }, [navigate]);

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await apiService.profiles.updateMe({
        ...form,
        registrationCompleted: true,
      });
      toast.success("Welcome to NOVA Eye Care! Registration complete.");
      navigate("/dashboard");
    } catch (err) {
      toast.error((err as { response?: { data?: { message?: string } } }).response?.data?.message || "Failed to save registration");
    } finally {
      setLoading(false);
    }
  };

  if (fetchingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary opacity-50" />
          <p className="font-medium animate-pulse">Setting up your profile...</p>
        </div>
      </div>
    );
  }

  const StepIcon = STEPS[currentStep].icon;

  return (
    <Layout>
      <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 bg-muted/10">
        <div className="w-full max-w-4xl grid md:grid-cols-12 gap-8 items-start">
          
          {/* Progress Sidebar */}
          <div className="md:col-span-4 space-y-6">
            <div className="bg-background p-8 rounded-xl border shadow-sm">
              <h1 className="text-xl font-bold mb-8">Patient Registration</h1>
              <div className="space-y-8 relative">
                {/* Vertical Line */}
                <div className="absolute left-[17px] top-4 bottom-4 w-0.5 bg-muted/30 -z-10" />
                
                {STEPS.map((s, idx) => (
                  <div key={s.id} className="flex items-center gap-4 group">
                    <div className={`h-9 w-9 rounded-full flex items-center justify-center transition-all duration-300 border-2 ${
                      idx <= currentStep ? "bg-primary border-primary text-white scale-105" : "bg-background border-muted text-muted-foreground"
                    }`}>
                      {idx < currentStep ? <CheckCircle2 className="h-5 w-5" /> : <s.icon className="h-4 w-4" />}
                    </div>
                    <div className="flex flex-col">
                      <span className={`text-xs font-bold uppercase tracking-widest ${idx <= currentStep ? "text-primary" : "text-muted-foreground/60"}`}>Step {idx + 1}</span>
                      <span className={`font-bold transition-all ${idx <= currentStep ? "text-foreground" : "text-muted-foreground/60"}`}>{s.title}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="hidden md:block p-6 bg-muted rounded-xl border">
              <div className="flex items-center gap-3 text-primary font-bold mb-2">
                <ShieldCheck className="h-5 w-5" />
                <span className="text-sm">Secure & Private</span>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Your medical data is encrypted and accessible only by clinical staff. We comply with all data protection standards in Ghana.
              </p>
            </div>
          </div>

          {/* Form Content */}
          <Card className="md:col-span-8 p-8 md:p-12 shadow-sm rounded-xl border relative group">
            
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-8"
              >
                <div className="flex items-center gap-4 mb-2">
                  <div className="h-12 w-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                    <StepIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{STEPS[currentStep].title}</h2>
                    <p className="text-muted-foreground text-sm">Please provide accurate information for your medical record.</p>
                  </div>
                </div>

                <div className="grid gap-6">
                  {currentStep === 0 && (
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <Label className="text-sm font-bold ml-1">Full Name</Label>
                        <Input 
                          value={form.fullName}
                          onChange={(e) => setForm({...form, fullName: e.target.value})}
                          placeholder="Akua Bio"
                          className="h-12 rounded-xl"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-bold ml-1">Date of Birth</Label>
                          <div className="relative">
                            <Input 
                              type="date"
                              value={form.dateOfBirth}
                              onChange={(e) => setForm({...form, dateOfBirth: e.target.value})}
                              className="h-12 rounded-xl pr-10"
                            />
                            <CalendarDays className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-bold ml-1">Gender</Label>
                          <Select 
                            value={form.gender} 
                            onValueChange={(v) => setForm({...form, gender: v})}
                          >
                            <SelectTrigger className="h-12 rounded-xl">
                              <SelectValue placeholder="Select..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="female">Female</SelectItem>
                              <SelectItem value="male">Male</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                              <SelectItem value="prefer-not">Prefer not to say</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-bold ml-1">Nationality</Label>
                          <Select 
                            value={form.nationality} 
                            onValueChange={(v) => setForm({...form, nationality: v})}
                          >
                            <SelectTrigger className="h-12 rounded-xl">
                              <SelectValue placeholder="Select..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Ghanaian">Ghanaian</SelectItem>
                              <SelectItem value="Nigerian">Nigerian</SelectItem>
                              <SelectItem value="Kenyan">Kenyan</SelectItem>
                              <SelectItem value="South African">South African</SelectItem>
                              <SelectItem value="British">British</SelectItem>
                              <SelectItem value="American">American</SelectItem>
                              <SelectItem value="Canadian">Canadian</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-bold ml-1">Region</Label>
                          <Select 
                            value={form.region} 
                            onValueChange={(v) => setForm({...form, region: v})}
                          >
                            <SelectTrigger className="h-12 rounded-xl">
                              <SelectValue placeholder="Select..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Greater Accra">Greater Accra</SelectItem>
                              <SelectItem value="Ashanti">Ashanti</SelectItem>
                              <SelectItem value="Eastern">Eastern</SelectItem>
                              <SelectItem value="Central">Central</SelectItem>
                              <SelectItem value="Western">Western</SelectItem>
                              <SelectItem value="Western North">Western North</SelectItem>
                              <SelectItem value="Volta">Volta</SelectItem>
                              <SelectItem value="Oti">Oti</SelectItem>
                              <SelectItem value="Northern">Northern</SelectItem>
                              <SelectItem value="Savannah">Savannah</SelectItem>
                              <SelectItem value="North East">North East</SelectItem>
                              <SelectItem value="Upper East">Upper East</SelectItem>
                              <SelectItem value="Upper West">Upper West</SelectItem>
                              <SelectItem value="Bono">Bono</SelectItem>
                              <SelectItem value="Bono East">Bono East</SelectItem>
                              <SelectItem value="Ahafo">Ahafo</SelectItem>
                              <SelectItem value="Outside Ghana">Outside Ghana</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  )}

                  {currentStep === 1 && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-bold ml-1">Phone Number</Label>
                          <Input 
                            value={form.phone}
                            onChange={(e) => setForm({...form, phone: e.target.value})}
                            className="h-12 rounded-xl"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-bold ml-1">Email Address</Label>
                          <Input 
                            readOnly
                            disabled
                            value={form.email}
                            className="h-12 rounded-xl bg-muted/50 opacity-60"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-bold ml-1">Residential Address</Label>
                        <Textarea 
                          value={form.address}
                          onChange={(e) => setForm({...form, address: e.target.value})}
                          placeholder="e.g. Hse No. 4, North Legon, Accra"
                          rows={3}
                          className="rounded-2xl"
                        />
                      </div>
                    </div>
                  )}

                  {currentStep === 2 && (
                    <div className="space-y-6">
                      <div className="space-y-2 w-1/2">
                        <Label className="text-sm font-bold ml-1">Blood Group (Optional)</Label>
                        <Select 
                          value={form.bloodGroup} 
                          onValueChange={(v) => setForm({...form, bloodGroup: v})}
                        >
                          <SelectTrigger className="h-12 rounded-xl">
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="A+">A+</SelectItem>
                            <SelectItem value="A-">A-</SelectItem>
                            <SelectItem value="B+">B+</SelectItem>
                            <SelectItem value="B-">B-</SelectItem>
                            <SelectItem value="O+">O+</SelectItem>
                            <SelectItem value="O-">O-</SelectItem>
                            <SelectItem value="AB+">AB+</SelectItem>
                            <SelectItem value="AB-">AB-</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-bold ml-1">Medical Conditions / History</Label>
                        <Textarea 
                          value={form.medicalHistory}
                          onChange={(e) => setForm({...form, medicalHistory: e.target.value})}
                          placeholder="e.g. Glaucoma history in family, Allergies to eye drops..."
                          rows={4}
                          className="rounded-2xl"
                        />
                      </div>
                    </div>
                  )}

                  {currentStep === 3 && (
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <Label className="text-sm font-bold ml-1">Emergency Contact Name</Label>
                        <Input 
                          value={form.emergencyContactName}
                          onChange={(e) => setForm({...form, emergencyContactName: e.target.value})}
                          placeholder="Relation / Full Name"
                          className="h-12 rounded-xl"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-bold ml-1">Emergency Contact Phone</Label>
                        <Input 
                          value={form.emergencyContactPhone}
                          onChange={(e) => setForm({...form, emergencyContactPhone: e.target.value})}
                          placeholder="024 XXX XXXX"
                          className="h-12 rounded-xl"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center pt-8 border-t border-muted">
                  <Button 
                    variant="ghost" 
                    onClick={handleBack} 
                    disabled={currentStep === 0}
                    className="gap-2 rounded-xl px-6 h-12"
                  >
                    <ArrowLeft className="h-4 w-4" /> Back
                  </Button>
                  
                  {currentStep === STEPS.length - 1 ? (
                    <Button 
                      onClick={handleSubmit} 
                      disabled={loading}
                      className="px-10 h-12 rounded-lg font-bold gap-2"
                    >
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                      Complete Registration
                    </Button>
                  ) : (
                    <Button 
                      onClick={handleNext} 
                      className="rounded-xl px-10 h-12 font-bold gap-2"
                    >
                      Continue <ArrowRight className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
