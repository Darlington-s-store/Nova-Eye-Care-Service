import { useEffect, useState, useCallback } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SERVICES, TIME_SLOTS_WEEKDAY, TIME_SLOTS_SATURDAY, CLINIC } from "@/lib/clinic";
import { apiService } from "@/lib/api";
import { CheckCircle2, CalendarCheck, Loader2, Clock, Phone, Mail, Sparkles, ShieldCheck, ArrowRight, ArrowLeft, MapPin, Video, User, FileText } from "lucide-react";
import { z } from "zod";
import { PageHero } from "@/components/PageHero";
import heroBook from "@/assets/ioi.jpeg";
import { getCMSContent, TeamMember } from "@/lib/cms";
import { getGoogleCalendarUrl } from "@/lib/calendar";

const schema = z.object({
  full_name: z.string().trim().min(2, "Please enter your full name").max(100),
  phone: z.string().trim().min(7, "Please enter a valid phone number").max(20),
  email: z.string().trim().email("Please enter a valid email").max(255),
  service: z.string().min(1, "Please select a service"),
  appointment_date: z.string().min(1, "Please select a date"),
  appointment_time: z.string().min(1, "Please select a time"),
  appointment_type: z.enum(["in_person", "virtual"]),
  doctor_name: z.string().optional(),
  notes: z.string().max(1000).optional(),
});

const STEPS = ["Service", "Schedule", "Your details", "Review"] as const;



const ReviewItem = ({ label, value, icon: Icon }: { label: string; value: string; icon: React.ElementType }) => (
  <div className="flex gap-3 text-sm border-b border-border/30 pb-2 last:border-0 last:pb-0">
    <Icon className="h-4 w-4 text-primary mt-0.5 shrink-0" />
    <div>
      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">{label}</span>
      <span className="font-semibold text-foreground">{value}</span>
    </div>
  </div>
);

const Book = () => {
  const [searchParams] = useSearchParams();
  const presetSlug = searchParams.get("service");

  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    full_name: "", phone: "", email: "",
    service: "",
    appointment_date: "", appointment_time: "",
    appointment_type: "in_person" as "in_person" | "virtual",
    doctor_name: "",
    notes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<typeof form | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const [services, setServices] = useState<{name: string, slug: string, short: string}[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [doctors, setDoctors] = useState<TeamMember[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);

  const update = useCallback((k: keyof typeof form, v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: "" }));
  }, []);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const data = await apiService.services.getAll();
        if (data) {
          setServices(data.map((s) => ({ 
            name: s.name, 
            slug: s.slug, 
            short: s.shortDescription 
          })));
        }
      } catch (err) {
        console.error("Failed to fetch services:", err);
      } finally {
        setLoadingServices(false);
      }
    };
    fetchServices();
  }, []);

  useEffect(() => {
    if (!loadingServices && presetSlug) {
      const found = services.find(s => s.slug === presetSlug);
      if (found) update("service", found.name);
    }
  }, [loadingServices, presetSlug, services, update]);

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const data = await getCMSContent<{ members: TeamMember[] }>("team");
        if (data?.members) {
          setDoctors(data.members);
        }
      } catch (err) {
        console.error("Failed to fetch doctors:", err);
      } finally {
        setLoadingDoctors(false);
      }
    };
    fetchDoctors();
  }, []);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const p = await apiService.profiles.getMe();
        if (p) {
          setUserId(p.id);
          setForm((f) => ({
            ...f,
            full_name: f.full_name || p.fullName || "",
            phone: f.phone || p.phone || "",
            email: f.email || p.email || "",
          }));
        }
      } catch (err) {
        // Not logged in or error, ignore
      }
    };
    loadProfile();
  }, []);

  const dayOfWeek = form.appointment_date ? new Date(form.appointment_date).getDay() : null;
  const isSaturday = dayOfWeek === 6;
  const isSunday = dayOfWeek === 0;
  const slots = isSaturday ? TIME_SLOTS_SATURDAY : TIME_SLOTS_WEEKDAY;

  const minDate = new Date().toISOString().split("T")[0];

  const canNext = () => {
    if (step === 0) return !!form.service;
    if (step === 1) return !!form.appointment_date && !!form.appointment_time && !isSunday;
    return true;
  };

  const next = () => {
    if (step === 2) {
      const detailsSchema = z.object({
        full_name: schema.shape.full_name,
        phone: schema.shape.phone,
        email: schema.shape.email,
        notes: schema.shape.notes,
      });
      const parsed = detailsSchema.safeParse(form);
      if (!parsed.success) {
        const fieldErrors: Record<string, string> = {};
        parsed.error.issues.forEach((i) => { fieldErrors[i.path[0] as string] = i.message; });
        setErrors(fieldErrors);
        return;
      }
      setErrors({});
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };
  const prev = () => setStep((s) => Math.max(s - 1, 0));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step < STEPS.length - 1) {
      next();
      return;
    }
    if (isSunday) {
      setErrors({ appointment_date: "We are closed on Sundays. Please pick another day." });
      return;
    }
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.issues.forEach((i) => { fieldErrors[i.path[0] as string] = i.message; });
      setErrors(fieldErrors);
      return;
    }
    setSubmitting(true);
    
    try {
      await apiService.appointments.create({
        fullName: parsed.data.full_name,
        phone: parsed.data.phone,
        email: parsed.data.email,
        service: parsed.data.service,
        appointmentDate: parsed.data.appointment_date,
        appointmentTime: parsed.data.appointment_time,
        appointmentType: parsed.data.appointment_type,
        doctorName: parsed.data.doctor_name || null,
        notes: parsed.data.notes ?? null,
      });
      
      setSuccess(form);
      setForm({ full_name: "", phone: "", email: "", service: "", appointment_date: "", appointment_time: "", appointment_type: "in_person", doctor_name: "", notes: "" });
      setStep(0);
    } catch (err) {
      setErrors({ form: err.response?.data?.message || "Failed to book appointment" });
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <Layout>
        <section className="container py-24">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="max-w-2xl mx-auto p-12 text-center shadow-elegant rounded-[2rem] border-primary/10">
              <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-primary-soft text-primary shadow-sm ring-8 ring-primary-soft/50">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">Appointment requested!</h1>
              <p className="text-muted-foreground text-lg mb-2 leading-relaxed">
                Thank you, <strong className="text-foreground font-bold">{success.full_name}</strong>.
              </p>
              <p className="text-muted-foreground text-lg mb-10 leading-relaxed">
                Your request for a <strong className="text-foreground font-bold">{success.appointment_type === "virtual" ? "Virtual (Online)" : "In-Person (Clinic)"}</strong> appointment
                {success.doctor_name && <> with <strong className="text-foreground font-bold">{success.doctor_name}</strong></>}{" "}
                for <strong className="text-foreground font-bold">{success.service}</strong> on{" "}
                <strong className="text-foreground font-bold">{new Date(success.appointment_date).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</strong>{" "}
                at <strong className="text-foreground font-bold">{success.appointment_time}</strong> has been received.
                We will call <strong className="text-foreground font-bold">{success.phone}</strong> to confirm.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Button 
                  asChild
                  variant="outline" 
                  size="lg" 
                  className="rounded-xl px-8 border-indigo-200 text-indigo-700 hover:bg-indigo-50/50"
                >
                  <a 
                    href={getGoogleCalendarUrl({
                      title: `Eye Exam: ${success.service} - Nova Eye Care`,
                      description: `Consultation Type: ${success.appointment_type === 'virtual' ? 'Virtual (Online)' : 'In-Person (Clinic Visit)'}\nDoctor: ${success.doctor_name || 'Assigned Optometrist'}\nNotes: ${success.notes || 'None'}\n\nNova Eye Care Clinic\nAbuakwa, Kumasi, Ghana\nPhones: +233 544 172 089 / +233 246 613 184`,
                      location: success.appointment_type === 'virtual' ? 'Online (Zoom/Google Meet link will be sent)' : 'Nova Eye Care Clinic, Abuakwa, Kumasi, Ghana',
                      startDateStr: success.appointment_date,
                      startTimeStr: success.appointment_time
                    })}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Add to Google Calendar
                  </a>
                </Button>
                <Button onClick={() => setSuccess(null)} variant="outline" size="lg" className="rounded-xl px-8">Book another</Button>
                {userId ? (
                  <Button asChild variant="hero" size="lg" className="rounded-xl px-8"><Link to="/dashboard">Go to dashboard</Link></Button>
                ) : (
                  <Button asChild variant="hero" size="lg" className="rounded-xl px-8"><Link to="/signup">Create an account</Link></Button>
                )}
              </div>
            </Card>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <PageHero
        image={heroBook}
        eyebrow="Schedule a Visit"
        title="Book an Appointment"
        subtitle="Three quick steps. We'll call to confirm your visit and answer any questions."
      />

      <section className="container py-16 md:py-24">
        <div className="grid gap-12 lg:grid-cols-3">
          {/* Sidebar info */}
          <aside className="lg:col-span-1 space-y-6 order-2 lg:order-1">
            <Card className="p-8 bg-hero-gradient text-primary-foreground border-0 shadow-elegant rounded-3xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-bl-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-700" />
              <h3 className="font-bold text-xl mb-4 flex items-center gap-2"><Sparkles className="h-5 w-5" /> why NOVA?</h3>
              <ul className="space-y-3 text-sm md:text-base opacity-100 font-medium">
                <li className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-white/50" /> Same-week availability</li>
                <li className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-white/50" /> Qualified, licensed optometrists</li>
                <li className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-white/50" /> Comprehensive examinations</li>
                <li className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-white/50" /> Friendly, modern clinic</li>
              </ul>
            </Card>
            <Card className="p-6 rounded-2xl border-border/60">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Clock className="h-5 w-5 text-primary" /> Working hours</h3>
              <ul className="text-sm text-muted-foreground space-y-2 font-medium">
                <li className="flex justify-between"><span>Mon–Fri</span> <span>{CLINIC.hours.weekdays.split(': ')[1]}</span></li>
                <li className="flex justify-between"><span>Saturday</span> <span>{CLINIC.hours.saturday.split(': ')[1]}</span></li>
                <li className="flex justify-between text-destructive"><span>Sunday</span> <span>Closed</span></li>
              </ul>
            </Card>
            <Card className="p-6 rounded-2xl border-border/60">
              <h3 className="font-bold text-lg mb-4">Need help?</h3>
              <a href={`tel:${CLINIC.phones[0]}`} className="flex items-center gap-3 text-sm text-foreground hover:text-primary mb-3 transition-colors font-semibold group">
                <div className="h-9 w-9 rounded-lg bg-primary-soft flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                  <Phone className="h-4 w-4" />
                </div> 
                {CLINIC.phones[0]}
              </a>
              <a href={`mailto:${CLINIC.email}`} className="flex items-center gap-3 text-sm text-foreground hover:text-primary transition-colors font-semibold group">
                <div className="h-9 w-9 rounded-lg bg-primary-soft flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                  <Mail className="h-4 w-4" />
                </div>
                {CLINIC.email}
              </a>
            </Card>
            <p className="text-xs text-muted-foreground flex items-start gap-2 px-1 leading-relaxed">
              <ShieldCheck className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              Your data is encrypted and handled according to healthcare privacy standards.
            </p>
          </aside>

          {/* Form */}
          <div className="lg:col-span-2 order-1 lg:order-2">
            <div>
              <Card className="p-8 md:p-12 shadow-card rounded-[2rem] border-border/60">
                {/* Stepper */}
                <div className="flex items-center justify-between mb-12 relative">
                  <div className="absolute top-1/2 left-0 w-full h-0.5 bg-muted -translate-y-1/2 z-0" />
                  {STEPS.map((label, i) => {
                    const active = i === step;
                    const done = i < step;
                    return (
                      <div key={label} className="relative z-10 flex flex-col items-center gap-3 bg-card px-2">
                        <span 
                          className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold shrink-0 transition-colors duration-500 ${
                            done ? "bg-primary text-primary-foreground shadow-lg" : active ? "bg-primary-soft text-primary ring-2 ring-primary shadow-md" : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {done ? <CheckCircle2 className="h-5 w-5" /> : i + 1}
                        </span>
                        <span className={`text-xs font-bold uppercase tracking-wider ${active ? "text-primary" : "text-muted-foreground"}`}>{label}</span>
                      </div>
                    );
                  })}
                </div>
  
                <form onSubmit={onSubmit} className="space-y-8">
                    {step === 0 && (
                      <div className="space-y-6">
                        <div>
                          <h2 className="font-bold text-2xl mb-2 tracking-tight">Choose a service</h2>
                          <p className="text-muted-foreground">What can we help you with today?</p>
                        </div>
                        <div className="grid gap-3">
                          {loadingServices ? (
                            <div className="py-10 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
                          ) : services.length === 0 ? (
                            <p className="text-center text-muted-foreground p-10 border border-dashed rounded-2xl">No services available currently.</p>
                          ) : (
                            services.map((s) => (
                              <button
                                type="button"
                                key={s.slug}
                                onClick={() => update("service", s.name)}
                                className={`p-6 rounded-2xl border-2 text-left transition-all duration-300 group ${
                                  form.service === s.name ? "border-primary bg-primary-soft/40 shadow-sm" : "border-border hover:border-primary/40 hover:bg-muted/30"
                                }`}
                              >
                                <div className="flex justify-between items-center">
                                  <p className={`font-bold text-lg ${form.service === s.name ? "text-primary" : ""}`}>{s.name}</p>
                                  {form.service === s.name && <CheckCircle2 className="h-5 w-5 text-primary" />}
                                </div>
                                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{s.short}</p>
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    )}
  
                    {step === 1 && (
                      <div className="space-y-8">
                        <div>
                          <h2 className="font-bold text-2xl mb-2 tracking-tight">Pick a date and time</h2>
                          <p className="text-muted-foreground text-base">We're open Monday through Saturday for your convenience.</p>
                        </div>
                        <div className="space-y-3">
                          <Label className="text-sm font-bold">Appointment Type</Label>
                          <div className="grid gap-4 grid-cols-2">
                            <button
                              type="button"
                              onClick={() => update("appointment_type", "in_person")}
                              className={`p-5 rounded-2xl border-2 text-left transition-all duration-300 flex flex-col gap-2 relative ${
                                form.appointment_type === "in_person"
                                  ? "border-primary bg-primary-soft/40 shadow-sm"
                                  : "border-border hover:border-primary/40 hover:bg-muted/30"
                              }`}
                            >
                              <div className="flex justify-between items-center w-full">
                                <span className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                                  form.appointment_type === "in_person" ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                                }`}>
                                  <MapPin className="h-4 w-4" />
                                </span>
                                {form.appointment_type === "in_person" && <CheckCircle2 className="h-4 w-4 text-primary" />}
                              </div>
                              <div>
                                <p className="font-bold text-sm">In-Person</p>
                                <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">Visit our clinic in Abuakwa for a physical consultation.</p>
                              </div>
                            </button>

                            <button
                              type="button"
                              onClick={() => update("appointment_type", "virtual")}
                              className={`p-5 rounded-2xl border-2 text-left transition-all duration-300 flex flex-col gap-2 relative ${
                                form.appointment_type === "virtual"
                                  ? "border-primary bg-primary-soft/40 shadow-sm"
                                  : "border-border hover:border-primary/40 hover:bg-muted/30"
                              }`}
                            >
                              <div className="flex justify-between items-center w-full">
                                <span className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                                  form.appointment_type === "virtual" ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                                }`}>
                                  <Video className="h-4 w-4" />
                                </span>
                                {form.appointment_type === "virtual" && <CheckCircle2 className="h-4 w-4 text-primary" />}
                              </div>
                              <div>
                                <p className="font-bold text-sm">Virtual (Online)</p>
                                <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">Consult with our doctors online via Zoom or Google Meet.</p>
                              </div>
                            </button>
                          </div>
                        </div>
                        <div className="grid gap-6 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="date" className="text-sm font-bold">Preferred date</Label>
                            <Input id="date" type="date" min={minDate} value={form.appointment_date}
                              onChange={(e) => { update("appointment_date", e.target.value); update("appointment_time", ""); }}
                              className="h-14 rounded-xl border-border/60 px-4 focus-visible:ring-primary focus-visible:border-primary" />
                            {isSunday && <p className="text-xs font-medium text-destructive mt-1.5 flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> Closed on Sundays. Please pick another day.</p>}
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm font-bold">Preferred time</Label>
                            <Select value={form.appointment_time} onValueChange={(v) => update("appointment_time", v)} disabled={!form.appointment_date || isSunday}>
                              <SelectTrigger className="h-14 rounded-xl border-border/60 px-4 focus-visible:ring-primary focus-visible:border-primary">
                                <SelectValue placeholder="Select a time" />
                              </SelectTrigger>
                              <SelectContent className="max-h-64 rounded-xl">
                                {slots.map((t) => <SelectItem key={t} value={t} className="rounded-lg">{t}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {/* Doctor Selection */}
                        <div className="space-y-4 pt-4 border-t border-border/40">
                          <div>
                            <Label className="text-sm font-semibold">Select a Doctor (Optional)</Label>
                            <p className="text-xs text-muted-foreground mt-0.5">Choose your preferred doctor for your {form.appointment_type === 'virtual' ? 'Virtual' : 'In-Person'} consultation.</p>
                          </div>
                          
                          {loadingDoctors ? (
                            <div className="py-6 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
                          ) : (
                            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
                              {/* Any Doctor Option */}
                              <button
                                type="button"
                                onClick={() => update("doctor_name", "")}
                                className={`p-4 rounded-2xl border-2 text-left transition-all duration-300 flex flex-col items-center justify-center text-center gap-3 relative ${
                                  form.doctor_name === ""
                                    ? "border-primary bg-primary-soft/40 shadow-sm"
                                    : "border-border hover:border-primary/40 hover:bg-muted/30"
                                }`}
                              >
                                <div className={`h-10 w-10 rounded-full flex items-center justify-center border ${
                                  form.doctor_name === "" ? "bg-primary text-white border-primary" : "bg-muted text-muted-foreground border-slate-200"
                                }`}>
                                  <User className="h-5 w-5" />
                                </div>
                                <div>
                                  <p className="font-bold text-xs">Any Doctor</p>
                                  <p className="text-[9px] text-muted-foreground leading-tight mt-0.5">Assign first available specialist.</p>
                                </div>
                                {form.doctor_name === "" && <CheckCircle2 className="h-4 w-4 text-primary absolute top-3 right-3" />}
                              </button>

                              {doctors.map((doc) => {
                                const isSelected = form.doctor_name === doc.name;
                                return (
                                  <button
                                    type="button"
                                    key={doc.name}
                                    onClick={() => update("doctor_name", doc.name)}
                                    className={`p-4 rounded-2xl border-2 text-left transition-all duration-300 flex flex-col gap-2 relative ${
                                      isSelected
                                        ? "border-primary bg-primary-soft/40 shadow-sm"
                                        : "border-border hover:border-primary/40 hover:bg-muted/30"
                                    }`}
                                  >
                                    <div className="flex items-center gap-3">
                                      {doc.photo ? (
                                        <img src={doc.photo} alt={doc.name} className="h-9 w-9 rounded-full object-cover border border-border" />
                                      ) : (
                                        <div className={`h-9 w-9 rounded-full flex items-center justify-center border ${
                                          isSelected ? "bg-primary text-white border-primary" : "bg-muted text-muted-foreground border-slate-200"
                                        }`}>
                                          <User className="h-4 w-4" />
                                        </div>
                                      )}
                                      <div className="min-w-0">
                                        <p className="font-bold text-xs truncate">{doc.name}</p>
                                        <p className="text-[9px] text-primary font-semibold truncate">{doc.title.split(' & ')[0]}</p>
                                      </div>
                                    </div>
                                    <p className="text-[9px] text-muted-foreground leading-snug line-clamp-2 italic mt-1">"{doc.bio}"</p>
                                    {isSelected && <CheckCircle2 className="h-4 w-4 text-primary absolute top-3 right-3" />}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {form.appointment_date && form.appointment_time && (
                          <div className="rounded-2xl bg-primary-soft p-6 flex items-center gap-4 text-primary shadow-sm">
                            <div className="h-12 w-12 rounded-xl bg-white/50 flex items-center justify-center text-primary shadow-inner">
                              <CalendarCheck className="h-6 w-6" />
                            </div>
                            <p className="text-base">
                              Booking <strong>{form.service}</strong> ({form.appointment_type === "virtual" ? "Virtual" : "In-Person"}) on <br />
                              <span className="font-bold">{new Date(form.appointment_date).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}</span> at <span className="font-bold">{form.appointment_time}</span>
                              {form.doctor_name && <> with <span className="font-bold">{form.doctor_name}</span></>}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
  
                    {step === 2 && (
                      <div className="space-y-8">
                        <div>
                          <h2 className="font-bold text-2xl mb-2 tracking-tight">Your contact details</h2>
                          <p className="text-muted-foreground">Please provide active details so we can call to confirm.</p>
                        </div>
                        <div className="grid gap-6 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="full_name" className="text-sm font-bold">Full name *</Label>
                            <Input id="full_name" value={form.full_name} onChange={(e) => update("full_name", e.target.value)} className="h-14 rounded-xl border-border/60" />
                            {errors.full_name && <p className="text-xs font-semibold text-destructive mt-1">{errors.full_name}</p>}
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="phone" className="text-sm font-bold">Phone number *</Label>
                            <Input id="phone" type="tel" value={form.phone} onChange={(e) => update("phone", e.target.value)} className="h-14 rounded-xl border-border/60" placeholder="0244 000 000" />
                            {errors.phone && <p className="text-xs font-semibold text-destructive mt-1">{errors.phone}</p>}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email" className="text-sm font-bold">Email address *</Label>
                          <Input id="email" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} className="h-14 rounded-xl border-border/60" />
                          {errors.email && <p className="text-xs font-semibold text-destructive mt-1">{errors.email}</p>}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="notes" className="text-sm font-bold">Anything we should know? (optional)</Label>
                          <Textarea id="notes" value={form.notes} onChange={(e) => update("notes", e.target.value)} rows={4} className="rounded-xl border-border/60 px-4 py-3" placeholder="Symptoms, accessibility needs, or prior visits..." />
                        </div>
                        {errors.form && <p className="text-sm font-semibold text-destructive text-center bg-destructive/5 py-3 rounded-lg">{errors.form}</p>}
                      </div>
                    )}

                    {step === 3 && (
                      <div className="space-y-8 animate-in fade-in duration-300">
                        <div>
                          <h2 className="font-bold text-2xl mb-2 tracking-tight">Review your booking</h2>
                          <p className="text-muted-foreground">Please double-check your appointment details before submitting.</p>
                        </div>
                        
                        <div className="grid gap-6 md:grid-cols-2">
                          <Card className="p-6 rounded-2xl border border-border/60 bg-muted/10 space-y-4">
                            <h3 className="font-bold text-sm text-primary uppercase tracking-wider">Appointment Info</h3>
                            <div className="space-y-3">
                              <ReviewItem label="Service" value={form.service} icon={Sparkles} />
                              <ReviewItem label="Date" value={form.appointment_date ? new Date(form.appointment_date).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : ""} icon={CalendarCheck} />
                              <ReviewItem label="Time Slot" value={form.appointment_time} icon={Clock} />
                              <ReviewItem label="Consultation Type" value={form.appointment_type === "virtual" ? "Virtual (Online Consultation)" : "In-Person (Clinic Visit)"} icon={form.appointment_type === "virtual" ? Video : MapPin} />
                              <ReviewItem label="Assigned Doctor" value={form.doctor_name || "Any Available Doctor"} icon={User} />
                            </div>
                          </Card>

                          <Card className="p-6 rounded-2xl border border-border/60 bg-muted/10 space-y-4">
                            <h3 className="font-bold text-sm text-primary uppercase tracking-wider">Your Details</h3>
                            <div className="space-y-3">
                              <ReviewItem label="Full Name" value={form.full_name} icon={User} />
                              <ReviewItem label="Phone Number" value={form.phone} icon={Phone} />
                              <ReviewItem label="Email Address" value={form.email} icon={Mail} />
                              {form.notes && <ReviewItem label="Notes for clinic" value={form.notes} icon={FileText} />}
                            </div>
                          </Card>
                        </div>

                        {errors.form && <p className="text-sm font-semibold text-destructive text-center bg-destructive/5 py-3 rounded-lg">{errors.form}</p>}
                      </div>
                    )}
  
                    <div className="flex gap-4 pt-6">
                      {step > 0 && (
                        <Button type="button" variant="outline" size="lg" onClick={prev} className="flex-1 h-14 rounded-xl font-bold bg-muted/20">
                          <ArrowLeft className="h-4 w-4 mr-2" /> Back
                        </Button>
                      )}
                      {step < STEPS.length - 1 ? (
                        <Button type="button" variant="hero" size="lg" onClick={next} disabled={!canNext()} className="flex-1 h-14 rounded-xl font-bold shadow-lg">
                          Continue <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      ) : (
                        <Button type="submit" variant="hero" size="lg" className="flex-1 h-14 rounded-xl font-bold shadow-lg shadow-primary/20" disabled={submitting}>
                          {submitting ? <><Loader2 className="h-5 w-5 animate-spin mr-2" /> Submitting...</> : "Confirm booking"}
                        </Button>
                      )}
                    </div>
  
                    {!userId && step === STEPS.length - 1 && (
                      <p className="text-center text-sm text-muted-foreground pt-2">
                        Want to track and reschedule? <Link to="/signup" className="text-primary font-bold hover:underline">Create an account</Link>.
                      </p>
                    )}
                  </form>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Book;
