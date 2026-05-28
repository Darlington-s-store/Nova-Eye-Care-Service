import { Layout } from "@/components/Layout";
import { PageHero } from "@/components/PageHero";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Award, Heart, Microscope, Eye, User, Sparkles } from "lucide-react";
import heroAbout from "@/assets/nova.jpeg";
import { useState, useEffect } from "react";
import { getCMSContent, TeamMember } from "@/lib/cms";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, scale: 0.95 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.4 } },
};

const About = () => {
  const [team, setTeam] = useState<TeamMember[]>([]);

  useEffect(() => {
    const fetchTeam = async () => {
      const data = await getCMSContent<{ members: TeamMember[] }>("team");
      if (data?.members) setTeam(data.members);
    };
    fetchTeam();
  }, []);

  return (
    <Layout>
      <PageHero
        image={heroAbout}
        eyebrow="Who We Are"
        title="About NOVA Eye Care"
        subtitle="Compassionate, expert optometry care — committed to helping every Ghanaian see better and live brighter."
      />

      <section className="container py-20 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl font-bold mb-6 tracking-tight">Our Mission</h2>
          <p className="text-muted-foreground leading-relaxed mb-16 text-lg">
            At NOVA Eye Care Services, we believe great vision changes lives. Our mission is to make
            high-quality eye care accessible across Ghana through patient-centred service, modern
            technology, and community outreach. From a child's first eye exam to specialty low-vision
            rehabilitation, every patient receives the same standard of attention and respect.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h2 className="text-3xl font-bold mb-8 tracking-tight">What sets us apart</h2>
          <motion.div 
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid gap-6 sm:grid-cols-2"
          >
            {[
              { icon: Award, title: "Qualified Specialists", text: "Licensed optometrists with years of clinical experience." },
              { icon: Microscope, title: "Modern Equipment", text: "Up-to-date diagnostic technology for accurate, fast results." },
              { icon: Heart, title: "Personalized Care", text: "Treatment plans tailored to each patient's lifestyle and needs." },
              { icon: Eye, title: "Full Spectrum of Services", text: "From routine exams to vision therapy, low vision, and DVLA testing." },
            ].map((p) => (
              <motion.div key={p.title} variants={item} whileHover={{ y: -5 }} transition={{ type: "spring", stiffness: 300 }}>
                <Card className="p-8 h-full shadow-card hover:shadow-elegant transition-shadow duration-500 border-border/60 rounded-[2rem]">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-soft text-primary mb-6 shadow-sm">
                    <p.icon className="h-7 w-7" />
                  </div>
                  <h3 className="font-bold text-xl mb-3">{p.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{p.text}</p>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* Team Section */}
      {team.length > 0 && (
        <section className="bg-primary-soft relative py-24 md:py-32 overflow-hidden">
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, black 1px, transparent 0)', backgroundSize: '40px 40px' }} />
          <div className="container relative">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="text-center mb-16 max-w-2xl mx-auto"
            >
              <span className="inline-flex items-center gap-2 px-3 py-1 text-[10px] font-bold rounded-full bg-primary/10 text-primary mb-4 tracking-[0.2em] uppercase">
                <Sparkles className="h-3 w-3" /> Our Medical Experts
              </span>
              <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">The Team Behind Your Care</h2>
              <p className="text-muted-foreground text-lg">
                Meet our licensed optometrists and specialists dedicated to your vision health.
              </p>
            </motion.div>
            
            <motion.div 
              variants={container}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto"
            >
              {team.map((m, idx) => (
                <motion.div key={idx} variants={item}>
                  <Card className="overflow-hidden h-full rounded-[2.5rem] border-0 shadow-card hover:shadow-elegant transition-all duration-500 group">
                    <div className="aspect-[4/5] bg-muted relative overflow-hidden">
                      {m.photo ? (
                        <img src={m.photo} alt={m.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          <User className="h-16 w-16 opacity-20" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    </div>
                    <div className="p-8">
                      <h3 className="font-bold text-2xl mb-1 group-hover:text-primary transition-colors">{m.name}</h3>
                      <p className="text-primary font-bold text-xs tracking-widest uppercase mb-4">{m.title}</p>
                      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 italic">"{m.bio}"</p>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      )}
    </Layout>
  );
};

export default About;
