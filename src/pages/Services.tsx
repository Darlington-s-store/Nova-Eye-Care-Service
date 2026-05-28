import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { PageHero } from "@/components/PageHero";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { ArrowRight, Loader2 } from "lucide-react";
import { apiService } from "@/lib/api";
import heroServices from "@/assets/nova serv.jpeg";

type Service = {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  imageUrl: string;
  displayOrder: number;
};

import { serviceImageMap } from "@/lib/service-images";

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
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const Services = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const data = await apiService.services.getAll();
        setServices(data || []);
      } catch (err) {
        console.error("Failed to fetch services:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  return (
    <Layout>
      <PageHero
        image={heroServices}
        eyebrow="Our Expertise"
        title="Our Services"
        subtitle="From routine eye exams to specialty vision services, NOVA Eye Care provides comprehensive optometry care tailored to every patient."
      />

      <section className="container py-20 pb-32">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-4 text-muted-foreground animate-fade-in">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm font-medium">Loading clinical services...</p>
          </div>
        ) : (
          <motion.div 
            variants={container}
            initial="hidden"
            animate="show"
            className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3"
          >
            {services.map((s) => (
              <motion.div key={s.slug} variants={item}>
                <Card id={s.slug} className="p-0 overflow-hidden border-orange-50/10 hover:shadow-2xl transition-all duration-500 scroll-mt-24 group h-full flex flex-col rounded-[1.5rem] bg-white">
                  <div className="aspect-[16/10] relative overflow-hidden">
                    <img 
                      src={serviceImageMap[s.slug] || s.imageUrl} 
                      alt={s.name} 
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
                      onError={(e) => { e.currentTarget.src = "/placeholder.svg"; }}
                    />
                    <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  </div>
                  <div className="p-8 flex flex-col flex-grow items-start">
                    <h2 className="font-bold text-xl md:text-2xl text-foreground group-hover:text-primary transition-colors mb-3 tracking-tight">
                      {s.name}
                    </h2>
                    <p className="text-muted-foreground/80 mb-6 leading-relaxed text-sm md:text-base line-clamp-3 flex-grow">
                      {s.shortDescription}
                    </p>
                    <Link 
                      to={`/book?service=${s.slug}`} 
                      className="group/link flex items-center gap-2 text-primary font-bold text-sm hover:underline underline-offset-4"
                    >
                      Book this service
                      <ArrowRight className="h-4 w-4 transition-transform group-hover/link:translate-x-1" />
                    </Link>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </section>
    </Layout>
  );
};

export default Services;
