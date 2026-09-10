import { Link } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { PageHero } from "@/components/PageHero";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Car, CheckCircle2, FileCheck, Eye, Scan, ArrowRight } from "lucide-react";
import heroDvla from "@/assets/hero-dvla.jpg";

const Dvla = () => (
  <Layout>
    <PageHero
      image={heroDvla}
      eyebrow="DVLA Certified"
      title="DVLA Eye Testing"
      subtitle="Official, DVLA-compliant eye tests for new and renewing drivers in Ghana."
    />

    <section className="container py-14 grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-8">
        <div>
          <h2 className="text-2xl font-bold mb-3">What is the DVLA eye test?</h2>
          <p className="text-muted-foreground leading-relaxed">
            The DVLA eye test is a mandatory visual assessment required by the Driver and Vehicle
            Licensing Authority before issuing or renewing a driver's license. It confirms that you
            meet the minimum visual standards needed to drive safely in Ghana — covering visual
            acuity (sharpness of sight), field of vision (peripheral vision), and color recognition
            where applicable.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-3">Who needs this test?</h2>
          <ul className="space-y-3">
            {[
              "First-time driver's license applicants",
              "Drivers renewing an expiring license",
              "Commercial vehicle operators (taxi, trotro, truck, bus)",
              "Anyone returning to driving after a vision-related health condition",
            ].map((t) => (
              <li key={t} className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span className="text-muted-foreground">{t}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-3">What to expect</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { icon: Eye, title: "Visual Acuity", text: "Reading a standardised chart at a fixed distance, with and without correction." },
              { icon: Scan, title: "Field of Vision", text: "Quick screening to confirm you have adequate peripheral vision for driving." },
              { icon: FileCheck, title: "DVLA Form", text: "We complete and stamp your official DVLA form for submission." },
            ].map((s) => (
              <Card key={s.title} className="p-5 border border-border/70 rounded-xl hover:border-primary/40 transition-all">
                <div className="h-10 w-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-3">
                  <s.icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold mb-1 text-slate-900">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.text}</p>
              </Card>
            ))}
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            The full appointment takes approximately 15–25 minutes. Bring your existing glasses or
            contact lenses if you wear them, plus a valid form of ID.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-3">How to book</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Booking is quick — choose a time slot that works for you and we'll handle the rest. Walk-ins
            are accepted on weekdays, but appointments are recommended to avoid waiting.
          </p>
        </div>
      </div>

      <aside className="lg:col-span-1">
        <Card className="p-6 sticky top-24 bg-card border border-primary/20 rounded-xl shadow-sm">
          <div className="h-12 w-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-4">
            <Car className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-bold mb-2">Ready for your DVLA test?</h3>
          <p className="text-sm text-muted-foreground mb-5">
            Book today and get your form stamped the same day.
          </p>
          <Button asChild variant="hero" size="lg" className="w-full">
            <Link to="/book?service=dvla">Book Your DVLA Test <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </Card>
      </aside>
    </section>
  </Layout>
);

export default Dvla;
