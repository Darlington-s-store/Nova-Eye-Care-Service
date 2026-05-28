import { Link } from "react-router-dom";
import { Mail, Phone, MapPin, Clock } from "lucide-react";
import logo from "@/assets/logo.jpeg";
import { CLINIC } from "@/lib/clinic";
import { useState, useEffect } from "react";
import { getClinicContact, ClinicContact, getCMSContent } from "@/lib/cms";

export const Footer = () => {
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

  return (
    <footer className="border-t border-[#002f4a] bg-brand-dominant text-white mt-20">
      <div className="container py-16 grid gap-10 md:grid-cols-4">
        <div className="md:col-span-2 space-y-4">
          <Link to="/" className="flex items-center gap-3 font-bold text-white mb-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white overflow-hidden shadow-elegant p-1.5">
              <img src={logo} alt="NOVA Eye Care Logo" className="h-full w-full object-contain" />
            </span>
            <span className="text-xl tracking-tight">NOVA Eye Care Services</span>
          </Link>
          <p className="text-sm text-slate-300 max-w-md leading-relaxed">
            {clinic?.tagline || CLINIC.tagline} Professional optometry care in Ghana. Comprehensive eye exams,
            contact lenses, vision therapy, low vision services, and DVLA testing.
          </p>
        </div>

        <div>
          <h4 className="font-bold mb-4 text-xs uppercase tracking-widest text-[#aebac4]">Quick Links</h4>
          <ul className="space-y-3 text-sm text-slate-300">
            <li><Link to="/services" className="hover:text-white hover:underline transition-colors">Services</Link></li>
            <li><Link to="/book" className="hover:text-white hover:underline transition-colors">Book Appointment</Link></li>
            <li><Link to="/dvla" className="hover:text-white hover:underline transition-colors">DVLA Eye Testing</Link></li>
            <li><Link to="/about" className="hover:text-white hover:underline transition-colors">About Us</Link></li>
            <li><Link to="/contact" className="hover:text-white hover:underline transition-colors">Contact</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold mb-4 text-xs uppercase tracking-widest text-[#aebac4]">Contact Info</h4>
          <ul className="space-y-3 text-sm text-slate-300">
            {[clinic?.phone1 || CLINIC.phones[0], clinic?.phone2].filter(Boolean).map((p) => (
              <li key={p} className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-[#6a8a9d] shrink-0" />
                <a href={`tel:${p}`} className="hover:text-white hover:underline transition-colors">{p}</a>
              </li>
            ))}
            <li className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-[#6a8a9d] shrink-0" />
              <a href={`mailto:${clinic?.email || CLINIC.email}`} className="hover:text-white hover:underline transition-colors break-all">
                {clinic?.email || CLINIC.email}
              </a>
            </li>
            <li className="flex items-start gap-3">
              <Clock className="h-4 w-4 text-[#6a8a9d] shrink-0 mt-0.5" />
              <div className="text-xs space-y-1 text-slate-300">
                <div>Mon - Fri: {hours?.Monday || "8:00 am"} - {hours?.Monday_to || "5:00 pm"}</div>
                <div>Sat: {hours?.Saturday || "9:00 am"} - {hours?.Saturday_to || "2:00 pm"}</div>
                <div>Sun: {hours?.Sunday || "Closed"}</div>
              </div>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-[#002f4a] py-6 bg-black/10">
        <div className="container text-xs text-slate-400 text-center">
          © {new Date().getFullYear()} NOVA Eye Care Services. All rights reserved.
        </div>
      </div>
    </footer>
  );
};
