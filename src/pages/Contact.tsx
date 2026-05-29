import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CLINIC } from "@/lib/clinic";
import { Phone, Mail, Clock, MapPin, Send, CheckCircle2, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { PageHero } from "@/components/PageHero";
import { motion, AnimatePresence } from "framer-motion";
import heroContact from "@/assets/no.jpeg";
import { getClinicContact, ClinicContact, getCMSContent } from "@/lib/cms";

const Contact = () => {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sent, setSent] = useState(false);
  const [clinic, setClinic] = useState<ClinicContact | null>(null);
  const [hours, setHours] = useState<Record<string, string> | null>(null);

  useEffect(() => {
    (async () => {
      const [c, h] = await Promise.all([
        getClinicContact(),
        getCMSContent<Record<string, string>>("hours")
      ]);
      setClinic(c);
      if (h) setHours(h);
    })();
  }, []);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      toast.error("Please fill in all fields");
      return;
    }
    const subject = encodeURIComponent(`Enquiry from ${form.name}`);
    const body = encodeURIComponent(`${form.message}\n\n— ${form.name} (${form.email})`);
    window.location.href = `mailto:${clinic?.email || CLINIC.email}?subject=${subject}&body=${body}`;
    setSent(true);
    toast.success("Opening your email client...");
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  } as const;

  const item = {
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0, transition: { type: "spring", damping: 25, stiffness: 200 } },
  } as const;

  return (
    <Layout>
      <PageHero
        image={heroContact}
        eyebrow="Get in Touch"
        title="Contact Us"
        subtitle={clinic?.tagline || "We'd love to hear from you. Call, email, or visit us in person — our team is here for you."}
      />

      <section className="container py-20 lg:py-24 grid gap-12 lg:grid-cols-2">
        <div className="space-y-8">
          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
          >
            <Card className="p-8 md:p-10 shadow-card border-border/60 rounded-3xl overflow-hidden relative group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-700" />
              <h2 className="font-bold text-2xl mb-8 tracking-tight flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary-soft flex items-center justify-center text-primary group-hover:rotate-12 transition-transform">
                  <MessageSquare className="h-5 w-5" />
                </div>
                Contact Details
              </h2>
              
              <ul className="space-y-6">
                {[clinic?.phone1 || CLINIC.phones[0], clinic?.phone2].filter(Boolean).map((p, idx) => (
                  <motion.li key={p} variants={item} className="flex items-start gap-4 group/item">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary shrink-0 group-hover/item:bg-primary group-hover/item:text-white transition-all shadow-sm">
                      <Phone className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60 mb-1">Phone {idx + 1}</div>
                      <a href={`tel:${p}`} className="font-bold text-lg hover:text-primary transition-colors">{p}</a>
                    </div>
                  </motion.li>
                ))}
                
                <motion.li variants={item} className="flex items-start gap-4 group/item">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary shrink-0 group-hover/item:bg-primary group-hover/item:text-white transition-all shadow-sm">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60 mb-1">Email Support</div>
                    <a href={`mailto:${clinic?.email || CLINIC.email}`} className="font-bold text-lg hover:text-primary break-all transition-colors">{clinic?.email || CLINIC.email}</a>
                  </div>
                </motion.li>

                <motion.li variants={item} className="flex items-start gap-4 group/item">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary shrink-0 group-hover/item:bg-primary group-hover/item:text-white transition-all shadow-sm">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div className="w-full">
                    <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60 mb-2">Clinic Hours</div>
                    <div className="bg-secondary/10 p-4 rounded-xl border border-border/40">
                      <table className="w-full text-sm font-medium">
                        <tbody>
                          <tr className="border-b border-border/40">
                            <td className="py-2 pr-4 opacity-70">Mon – Fri</td>
                            <td className="py-2 font-bold text-right">
                              {hours?.Monday && hours?.Monday_to 
                                ? `${hours.Monday} – ${hours.Monday_to}` 
                                : "8:00 am – 5:00 pm"}
                            </td>
                          </tr>
                          <tr className="border-b border-border/40">
                            <td className="py-2 pr-4 opacity-70">Saturday</td>
                            <td className="py-2 font-bold text-right">
                              {hours?.Saturday && hours?.Saturday_to 
                                ? `${hours.Saturday} – ${hours.Saturday_to}` 
                                : "9:00 am – 2:00 pm"}
                            </td>
                          </tr>
                          <tr>
                            <td className="py-2 pr-4 opacity-70">Sunday</td>
                            <td className="py-2 font-bold text-right text-destructive">
                              {hours?.Sunday || "Closed"}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </motion.li>

                <motion.li variants={item} className="flex items-start gap-4 group/item">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary shrink-0 group-hover/item:bg-primary group-hover/item:text-white transition-all shadow-sm">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60 mb-1">Main Location</div>
                    <div className="font-bold text-lg">{clinic?.address || CLINIC.address}</div>
                  </div>
                </motion.li>
              </ul>
            </Card>
          </motion.div>

          <motion.div
             initial={{ opacity: 0, scale: 0.95 }}
             whileInView={{ opacity: 1, scale: 1 }}
             viewport={{ once: true }}
             transition={{ delay: 0.4 }}
             className="relative group"
          >
            <Card className="overflow-hidden border-border/60 rounded-3xl shadow-elegant h-[400px] relative z-0">
              <iframe
                title="NOVA Eye Care Location"
                src={`https://maps.google.com/maps?q=${encodeURIComponent(clinic?.address || CLINIC.address)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                width="100%"
                height="100%"
                style={{ border: 0, filter: "grayscale(0.2) contrast(1.1) brightness(0.95)" }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
              <div className="absolute bottom-4 left-4 right-4 bg-background/85 backdrop-blur-lg p-4 rounded-2xl border border-border/50 shadow-xl flex items-center justify-between pointer-events-auto md:translate-y-20 md:group-hover:translate-y-0 translate-y-0 transition-all duration-500 ease-out z-10">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-sm shrink-0">
                    <MapPin className="h-5 w-5 animate-bounce" style={{ animationDuration: '3s' }} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest">Visit Us</div>
                    <div className="text-sm font-bold text-foreground line-clamp-1">{clinic?.mapQuery || "Kan Royal Filling Station, Abuakwa"}</div>
                  </div>
                </div>
                <Button size="default" variant="outline" className="rounded-xl h-11 px-5 pointer-events-auto shadow-sm font-bold border-primary/20 hover:bg-primary hover:text-primary-foreground transition-all duration-300 shrink-0" onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(clinic?.mapQuery || clinic?.address || CLINIC.address)}`, '_blank')}>
                  Get Directions
                </Button>
              </div>
            </Card>
          </motion.div>
        </div>

        <motion.div
           initial={{ opacity: 0, y: 20 }}
           whileInView={{ opacity: 1, y: 0 }}
           viewport={{ once: true }}
        >
          <Card className="p-8 md:p-12 shadow-card border-border/60 rounded-[2.5rem] h-fit">
            <AnimatePresence mode="wait">
              {sent ? (
                <motion.div 
                  key="success"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-12"
                >
                  <div className="h-24 w-24 rounded-full bg-primary-soft flex items-center justify-center text-primary mx-auto mb-8 shadow-inner ring-8 ring-primary-soft/50">
                    <CheckCircle2 className="h-12 w-12" />
                  </div>
                  <h3 className="font-bold text-3xl mb-4 tracking-tight">Message prepared!</h3>
                  <p className="text-muted-foreground text-lg mb-10 max-w-sm mx-auto">Your email client should have opened with your message ready to send.</p>
                  <Button variant="outline" size="lg" className="rounded-xl px-10 h-14 font-bold" onClick={() => { setSent(false); setForm({ name: "", email: "", message: "" }); }}>Send Another Message</Button>
                </motion.div>
              ) : (
                <motion.form 
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onSubmit={onSubmit} 
                  className="space-y-8"
                >
                  <div>
                    <h2 className="font-bold text-3xl mb-2 tracking-tight">Send a message</h2>
                    <p className="text-muted-foreground">General inquiries or feedback? We're here to help.</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="c-name" className="text-sm font-bold">Your information</Label>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Input id="c-name" placeholder="Full Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-14 rounded-xl border-border/60 px-4 focus-visible:ring-primary/20" />
                      <Input id="c-email" placeholder="Email Address" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="h-14 rounded-xl border-border/60 px-4 focus-visible:ring-primary/20" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="c-msg" className="text-sm font-bold">Your message</Label>
                    <Textarea id="c-msg" rows={6} placeholder="How can we assist you?" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="rounded-2xl border-border/60 px-4 py-4 focus-visible:ring-primary/20" />
                  </div>
                  
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button type="submit" variant="hero" className="w-full h-16 rounded-2xl font-bold text-lg shadow-lg shadow-primary/20 gap-3">
                      <Send className="h-5 w-5" /> Send Enquiry
                    </Button>
                  </motion.div>
                  
                  <p className="text-center text-xs text-muted-foreground px-4">
                    By clicking send, you agree to our privacy policy and consent to us contacting you regarding your inquiry.
                  </p>
                </motion.form>
              )}
            </AnimatePresence>
          </Card>
        </motion.div>
      </section>
    </Layout>
  );
};

export default Contact;
