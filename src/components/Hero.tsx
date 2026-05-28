import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CLINIC } from "@/lib/clinic";
import { HeroContent } from "@/lib/cms";
import { CalendarCheck, ArrowRight } from "lucide-react";
import heroHome from "@/assets/hero-home.jpg";
import heroGeneral from "@/assets/hero.jpeg";
import heroHerrr from "@/assets/Herrr.jpeg";

const defaultBgImages = [
  heroHome,
  heroGeneral,
  heroHerrr
];

interface HeroProps {
  hero: HeroContent | null;
}

export const Hero = ({ hero }: HeroProps) => {
  const [bgImages, setBgImages] = useState<string[]>(defaultBgImages);
  const [currentBgIndex, setCurrentBgIndex] = useState(0);

  useEffect(() => {
    if (hero?.backgroundImage) {
      const urls = hero.backgroundImage.split(",")
        .map(url => url.trim())
        .filter(Boolean);
      if (urls.length > 0) {
        setBgImages(urls);
      } else {
        setBgImages(defaultBgImages);
      }
    } else {
      setBgImages(defaultBgImages);
    }
    setCurrentBgIndex(0);
  }, [hero]);

  useEffect(() => {
    if (bgImages.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentBgIndex(prev => (prev + 1) % bgImages.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [bgImages]);

  return (
    <section className="relative bg-slate-950 text-white min-h-[45vh] sm:min-h-[45vh] md:min-h-[50vh] lg:min-h-[55vh] flex items-center justify-center py-10 sm:py-16 md:py-20 lg:py-24 overflow-hidden">
      {/* Fading Background Slideshow */}
      {bgImages.map((image, index) => (
        <div
          key={image + index}
          className={`absolute inset-0 bg-cover bg-center transition-all ease-in-out ${index === currentBgIndex
              ? "opacity-40 scale-105"
              : "opacity-0 scale-100 pointer-events-none"
            }`}
          style={{
            backgroundImage: `url(${image})`,
            transitionDuration: "2000ms",
            transformOrigin: "center center",
            animation: index === currentBgIndex ? "kenburns 30s ease-out infinite alternate" : "none"
          }}
        />
      ))}

      {/* CSS Keyframes for Ken Burns zoom effect */}
      <style>{`
        @keyframes kenburns {
          0% { transform: scale(1.05) translate(0px, 0px); }
          100% { transform: scale(1.15) translate(8px, -5px); }
        }
      `}</style>

      {/* Premium Dark Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/85 via-slate-950/45 to-slate-950/85" />
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/65 via-transparent to-slate-950/65" />

      {/* Subtle grid pattern overlay */}
      <div className="absolute inset-0 opacity-10 [background-image:radial-gradient(circle_at_20%_30%,white_1px,transparent_1px)] [background-size:40px_40px]" />

      <div className="container relative z-10 text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h1 className="text-2xl sm:text-5xl md:text-6xl xl:text-7xl 2xl:text-8xl font-bold mb-3 sm:mb-8 leading-[1.15] tracking-tight text-white drop-shadow-md animate-fade-in-up">
            {hero?.heading || CLINIC.name}
          </h1>
          <p className="text-xs sm:text-lg md:text-xl xl:text-2xl mb-4 sm:mb-12 opacity-95 mx-auto max-w-3xl leading-relaxed font-medium text-slate-100 drop-shadow animate-fade-in-up [animation-delay:200ms]">
            {hero?.subheading || "Comprehensive eye care for every stage of life, from routine exams to specialty vision services and DVLA testing."}
          </p>
          <div className="flex flex-row justify-center gap-2 sm:gap-6 animate-fade-in-up [animation-delay:400ms]">
            <Button asChild className="flex-1 sm:flex-none rounded-xl px-3 sm:px-10 h-11 sm:h-14 md:h-16 text-xs sm:text-base font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all hover:-translate-y-0.5">
              <Link to="/book" className="flex items-center justify-center">
                <CalendarCheck className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2.5" />
                {hero?.cta1 || "Book Appointment"}
              </Link>
            </Button>
            <Button asChild variant="outline" className="flex-1 sm:flex-none rounded-xl px-3 sm:px-10 h-11 sm:h-14 md:h-16 text-xs sm:text-base font-bold border-white/60 hover:bg-white/20 hover:border-white text-white backdrop-blur-md transition-all hover:-translate-y-0.5 bg-white/5 shadow-md">
              <Link to="/services" className="flex items-center justify-center">
                {hero?.cta2 || "Our Services"} <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1.5 sm:ml-2.5" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Slideshow Indicator Dots */}
      {bgImages.length > 1 && (
        <div className="absolute bottom-6 sm:bottom-8 left-0 right-0 flex justify-center gap-2.5 z-20">
          {bgImages.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentBgIndex(idx)}
              className={`h-2.5 w-2.5 rounded-full transition-all duration-300 ${idx === currentBgIndex ? "bg-white scale-125 shadow-sm" : "bg-white/40 hover:bg-white/70"
                }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
};
