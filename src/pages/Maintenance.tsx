import { ShieldAlert, Clock, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.jpeg";

const Maintenance = () => {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-soft-gradient p-6">
      <div className="max-w-md w-full text-center space-y-8 animate-fade-in">
        <div className="flex justify-center">
          <div className="h-20 w-20 rounded-2xl bg-white border border-border/60 p-1 overflow-hidden shadow-sm">
            <img src={logo} alt="NOVA Logo" className="h-full w-full object-contain" />
          </div>
        </div>

        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-bold uppercase tracking-wider">
            <ShieldAlert className="h-3 w-3" />
            System Maintenance
          </div>
          <h1 className="text-4xl font-bold text-foreground tracking-tight">We'll be back shortly</h1>
          <p className="text-muted-foreground leading-relaxed">
            NOVA Eye Care is currently undergoing scheduled maintenance to improve our services. 
            We apologize for any inconvenience.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 py-6 border-y border-border/10">
          <div className="space-y-1">
            <div className="flex justify-center mb-1 text-primary">
              <Clock className="h-5 w-5" />
            </div>
            <p className="text-xs font-semibold text-foreground uppercase">Expected Up</p>
            <p className="text-sm text-muted-foreground">Approx. 60 mins</p>
          </div>
          <div className="space-y-1">
            <div className="flex justify-center mb-1 text-primary">
              <Phone className="h-5 w-5" />
            </div>
            <p className="text-xs font-semibold text-foreground uppercase">Urgent Hub</p>
            <p className="text-sm text-muted-foreground">+233 542 737 373</p>
          </div>
        </div>

        <div className="pt-4 flex flex-col gap-4">
          <Button variant="outline" className="gap-2" asChild>
            <a href="mailto:support@novaeyecare.com">
              <Mail className="h-4 w-4" />
              Email Support
            </a>
          </Button>
          <p className="text-[10px] text-muted-foreground/60 uppercase font-medium tracking-widest">
            © 2026 NOVA Eye Care Portal
          </p>
        </div>
      </div>
    </div>
  );
};

export default Maintenance;
