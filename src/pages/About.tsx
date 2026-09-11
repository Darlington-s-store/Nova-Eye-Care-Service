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
        title="About Nova Eye Care"
        subtitle="Dedicated eye care in Kumasi. We help you and your family protect your sight with thorough examinations and clear advice."
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
            At Nova Eye Care, our goal is simple: helping you see clearly and keeping your eyes healthy. 
            From your child's first vision screening to prescription glasses and senior eye health checks, 
            we provide friendly, attentive service. We take the time to listen, answer your questions, 
            and recommend treatment options that fit your everyday life.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h2 className="text-3xl font-bold mb-8 tracking-tight">Why Choose Nova Eye Care</h2>
          <motion.div 
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid gap-6 sm:grid-cols-2"
          >
            {[
              { icon: Award, title: "Experienced Doctors", text: "Licensed optometrists who take time to explain your eye health in simple terms." },
              { icon: Microscope, title: "Modern Testing", text: "Up-to-date tools for checking visual acuity, eye pressure, and retina health." },
              { icon: Heart, title: "Personal Attention", text: "We listen to your daily visual needs and recommend practical, honest solutions." },
              { icon: Eye, title: "Complete Eye Care", text: "Eye exams, frames, prescription lenses, low vision care, and DVLA testing." },
            ].map((p) => (
              <motion.div key={p.title} variants={item} whileHover={{ y: -5 }} transition={{ type: "spring", stiffness: 300 }}>
                <Card className="p-8 h-full shadow-card hover:shadow-md transition-shadow duration-500 border-border/60 rounded-[2rem]">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-soft text-primary mb-6 border border-border/40">
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
              <span className="inline-flex items-center gap-2 px-3.5 py-1 text-[11px] font-bold rounded-full bg-primary/10 text-primary border border-primary/20 mb-4 tracking-wider uppercase">
                <Eye className="h-3.5 w-3.5" /> Our Optometrists & Staff
              </span>
              <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">Meet Our Doctors</h2>
              <p className="text-muted-foreground text-lg">
                Our team is committed to giving you friendly and reliable eye care.
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
                  <Card className="overflow-hidden h-full rounded-2xl border border-border/70 shadow-sm hover:shadow-md transition-all duration-300 group bg-white">
                    <div className="aspect-[4/5] bg-muted relative overflow-hidden">
                      {m.photo ? (
                        <img src={m.photo} alt={m.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
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
