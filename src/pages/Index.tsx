import { Link } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CLINIC } from "@/lib/clinic";
import { getCMSContent, HeroContent, Announcements, getClinicContact, ClinicContact } from "@/lib/cms";
import { ApprovedReviews } from "@/components/ApprovedReviews";
import { Hero } from "@/components/Hero";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import {
  Eye, CircleDot, Glasses, Building2, Users, Car,
  Clock, Award, HeartHandshake, Microscope, ArrowRight, Phone, MapPin,
  Loader2
} from "lucide-react";
import { apiService, Service } from "@/lib/api";
import { serviceImageMap } from "@/lib/service-images";

const trustPoints = [
  { icon: Award, title: "Qualified Specialists", text: "Licensed optometrists with years of clinical experience." },
  { icon: Microscope, title: "Modern Equipment", text: "Advanced diagnostic technology for precise results." },
  { icon: HeartHandshake, title: "Personalized Care", text: "Tailored treatment plans for every patient's needs." },
  { icon: Clock, title: "Flexible Hours", text: "Weekday and Saturday appointments to fit your schedule." },
];

const Home = () => {
  const [hero, setHero] = useState<HeroContent | null>(null);
  const [announcement, setAnnouncement] = useState<Announcements | null>(null);
  const [hours, setHours] = useState<Record<string, string> | null>(null);
  const [clinic, setClinic] = useState<ClinicContact | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);



  useEffect(() => {
    const fetchContent = async () => {
      const heroData = await getCMSContent<HeroContent>("hero");
      const newsData = await getCMSContent<Announcements>("announcements");
      const hoursData = await getCMSContent<Record<string, string>>("hours");
      const clinicData = await getClinicContact();
      if (heroData) setHero(heroData);
      if (newsData) setAnnouncement(newsData);
      if (hoursData) setHours(hoursData);
      setClinic(clinicData);

      try {
        const servicesData = await apiService.services.getAll();
        setServices(servicesData || []);
      } catch (err) {
        console.error("Failed to fetch services:", err);
      } finally {
        setLoadingServices(false);
      }
    };
    fetchContent();
  }, []);

  return (
    <Layout>
      {/* Announcement Banner */}
      {announcement?.enabled && (
        <div className="bg-primary text-white py-3 px-4 text-center text-sm font-bold border-b border-white/10">
          <p>{announcement.message}</p>
        </div>
      )}

      <Hero hero={hero} />

      {/* Working hours bar */}
      <section className="bg-slate-50 border-b border-slate-200 py-6">
        <div className="container flex flex-wrap items-center justify-center gap-x-12 gap-y-4 text-xs font-bold uppercase tracking-wider text-slate-600">
          <span className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            Mon - Fri: {hours?.Monday || CLINIC.hours.weekdays} {hours?.Monday_to ? `- ${hours.Monday_to}` : ''}
          </span>
          <span className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            Sat: {hours?.Saturday || CLINIC.hours.saturday} {hours?.Saturday_to ? `- ${hours.Saturday_to}` : ''}
          </span>
          <a href={`tel:${CLINIC.phones[0]}`} className="flex items-center gap-2 hover:text-primary transition-colors">
            <Phone className="h-4 w-4 text-primary" />
            Call: {CLINIC.phones[0]}
          </a>
        </div>
      </section>

      {/* Services overview */}
      <section className="relative py-20 md:py-28 overflow-hidden bg-white text-slate-900 border-b border-slate-100">
        <div className="container relative z-10">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <Badge className="mb-4 bg-primary/20 text-primary border border-primary/30 px-4 py-1.5 uppercase tracking-widest text-[10px] md:text-xs font-extrabold shadow-sm">
              Nova Care Options
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">Our Services</h2>
            <p className="text-slate-600 text-base md:text-lg">
              Professional eye care using modern diagnostic technology.
            </p>
          </div>
          {loadingServices ? (
            <div className="py-20 flex flex-col items-center justify-center gap-4 text-slate-500">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm font-medium animate-pulse">Loading clinical services...</p>
            </div>
          ) : services.length === 0 ? (
            <div className="py-20 text-center text-slate-500">
              <p>No services registered currently.</p>
            </div>
          ) : (
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((s) => {
                const sImage = serviceImageMap[s.slug] || s.imageUrl;
                return (
                  <Link key={s.slug} to="/services" className="group">
                    <Card className="h-full bg-slate-50/50 hover:bg-white border border-slate-200/80 rounded-xl overflow-hidden hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
                      <div className="h-48 overflow-hidden relative">
                        <img
                          src={sImage}
                          alt={s.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          onError={(e) => { e.currentTarget.src = "/placeholder.svg"; }}
                        />
                        <div className="absolute inset-0 bg-slate-950/5 group-hover:bg-slate-950/0 transition-colors duration-300" />
                      </div>
                      <div className="p-6">
                        <h3 className="font-bold text-xl mb-2 text-slate-900 group-hover:text-primary transition-colors">{s.name}</h3>
                        <p className="text-sm text-slate-600 mb-4 leading-relaxed line-clamp-3">{s.shortDescription}</p>
                        <span className="text-sm text-primary font-bold inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                          Details <ArrowRight className="h-4 w-4" />
                        </span>
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Why choose us */}
      <section className="bg-slate-50 py-20 md:py-28">
        <div className="container">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose Us</h2>
            <p className="text-muted-foreground text-lg">
              Trusted by patients for compassionate and expert eye care.
            </p>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {trustPoints.map((t) => (
              <Card key={t.title} className="p-6 text-center border border-slate-200 rounded-xl shadow-none bg-white">
                <div className="mx-auto h-14 w-14 flex items-center justify-center rounded-full bg-primary/10 text-primary mb-6">
                  <t.icon className="h-7 w-7" />
                </div>
                <h3 className="font-bold text-lg mb-2">{t.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{t.text}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews */}
      <ApprovedReviews />

      {/* Location Section */}
      <section className="container py-20 md:py-28">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-primary font-bold text-sm uppercase tracking-wider mb-4 block">Visit Us</span>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Located inside Kan Royal Filling Station, Abuakwa</h2>
            <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
              Our modern facility is conveniently situated on GE20 Dolores St (GPS address: AH-1192-7988).
            </p>

            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold">Clinic Address</h4>
                  <p className="text-muted-foreground text-sm">{clinic?.address || CLINIC.address}</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold">Working Hours</h4>
                  <p className="text-sm text-muted-foreground">
                    Mon-Fri: {hours?.Monday || "8am"} - {hours?.Monday_to || "5pm"}<br />
                    Sat: {hours?.Saturday || "9am"} - {hours?.Saturday_to || "2pm"}
                  </p>
                </div>
              </div>
            </div>

            <Button asChild variant="outline" size="lg" className="mt-10 rounded-lg font-bold">
              <Link to="/contact">Get Directions</Link>
            </Button>
          </div>

          <div className="h-[400px] rounded-xl overflow-hidden border border-slate-200 shadow-sm">
            <iframe
              title="Location"
              src={`https://maps.google.com/maps?q=${encodeURIComponent(clinic?.address || CLINIC.address)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container py-20">
        <div className="bg-primary rounded-2xl p-10 md:p-20 text-center text-white shadow-lg">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">Ready to see clearly?</h2>
          <p className="text-lg opacity-90 mb-10 max-w-xl mx-auto">
            Book your appointment today and experience the NOVA difference with our expert care.
          </p>
          <Button asChild size="lg" variant="secondary" className="rounded-lg px-10 h-16 font-bold text-lg">
            <Link to="/book">Book an Appointment</Link>
          </Button>
        </div>
      </section>
    </Layout>
  );
};

export default Home;
