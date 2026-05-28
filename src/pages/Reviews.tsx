import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHero } from "@/components/PageHero";
import { apiService } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Loader2, Star, Quote, MessageSquareQuote } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import heroAbout from "@/assets/nova.jpeg";

type Review = {
  id: string;
  authorName: string;
  rating: number;
  content: string;
  createdAt: string;
};

const Stars = ({ value, onChange, readOnly }: { value: number; onChange?: (v: number) => void; readOnly?: boolean }) => (
  <div className="flex gap-1.5">
    {[1, 2, 3, 4, 5].map((i) => (
      <motion.button
        key={i}
        type="button"
        disabled={readOnly}
        whileHover={readOnly ? {} : { scale: 1.2, rotate: 10 }}
        whileTap={readOnly ? {} : { scale: 0.9 }}
        onClick={() => onChange?.(i)}
        className={`${readOnly ? "cursor-default" : "cursor-pointer"}`}
        aria-label={`${i} stars`}
      >
        <Star className={`h-5 w-5 transition-colors duration-300 ${i <= value ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`} />
      </motion.button>
    ))}
  </div>
);

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
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", damping: 25, stiffness: 200 } },
} as const;

const ReviewsPage = () => {
  const { user, session } = useAuth();
  const [approved, setApproved] = useState<Review[]>([]);
  const [form, setForm] = useState({ authorName: "", rating: 5, content: "" });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchApproved();
  }, []);

  const fetchApproved = async () => {
    try {
      const data = await apiService.reviews.getApproved();
      setApproved(data || []);
    } catch (err) {
      toast.error("Failed to load reviews");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    apiService.profiles.getMe()
      .then((data) => {
        if (data?.fullName) setForm((f) => ({ ...f, authorName: data.fullName }));
      })
      .catch(() => {
        // Fallback or ignore
      });
  }, [user]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please sign in to leave a review");
      return;
    }
    if (form.authorName.trim().length < 2) { toast.error("Please enter your name"); return; }
    if (form.content.trim().length < 10) { toast.error("Please write at least 10 characters"); return; }
    
    setSubmitting(true);
    try {
      await apiService.reviews.create({
        authorName: form.authorName.trim(),
        rating: form.rating,
        content: form.content.trim(),
      });
      toast.success("Thank you! Your review will appear after approval.");
      setForm({ authorName: form.authorName, rating: 5, content: "" });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <PageHero
        image={heroAbout}
        eyebrow="Patient Stories"
        title="Reviews & Testimonials"
        subtitle="Real experiences from patients we've cared for across Ghana. We value your feedback."
      />

      <section className="container py-20 grid gap-16 lg:grid-cols-3">
        {/* Form */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="lg:col-span-1"
        >
          <Card className="p-8 shadow-card border-border/60 sticky top-24 rounded-3xl group">
            <div className="h-12 w-12 rounded-2xl bg-primary-soft flex items-center justify-center text-primary mb-6 transition-transform duration-500 group-hover:rotate-12">
              <MessageSquareQuote className="h-6 w-6" />
            </div>
            <h2 className="font-bold text-2xl mb-2 tracking-tight">Leave a review</h2>
            <p className="text-muted-foreground mb-8 text-sm">Your feedback helps us provide even better care. Reviews appear after admin approval.</p>
            
            <AnimatePresence mode="wait">
              {!session ? (
                <motion.div 
                  key="guest"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  <div className="bg-muted/30 p-6 rounded-2xl text-center border border-dashed border-border">
                    <p className="text-sm text-muted-foreground mb-5">Sign in to share your experience with NOVA Eye Care.</p>
                    <Button asChild variant="hero" className="w-full rounded-xl py-6 font-bold shadow-lg shadow-primary/20">
                      <Link to="/auth">Sign in to Review</Link>
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <motion.form 
                  key="reviewer"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onSubmit={onSubmit} 
                  className="space-y-6"
                >
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-bold">Your name</Label>
                    <Input 
                      id="name" 
                      value={form.authorName}
                      onChange={(e) => setForm({ ...form, authorName: e.target.value })}
                      className="h-12 rounded-xl border-border/60 px-4 focus-visible:ring-primary/20" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-bold block mb-3">Your rating</Label>
                    <div className="bg-secondary/20 p-4 rounded-xl inline-block border border-border/40">
                      <Stars value={form.rating} onChange={(v) => setForm({ ...form, rating: v })} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="content" className="text-sm font-bold">Your review</Label>
                    <Textarea 
                      id="content" 
                      value={form.content} 
                      rows={5}
                      onChange={(e) => setForm({ ...form, content: e.target.value })}
                      className="rounded-xl border-border/60 px-4 py-3 focus-visible:ring-primary/20" 
                      placeholder="Tell us about the care you received..." 
                    />
                  </div>
                  <Button type="submit" variant="hero" className="w-full h-14 rounded-xl font-bold shadow-lg shadow-primary/20" disabled={submitting}>
                    {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Submit Review"}
                  </Button>
                </motion.form>
              )}
            </AnimatePresence>
          </Card>
        </motion.div>

        {/* Approved reviews */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-bold text-3xl tracking-tight">Patient Experiences</h2>
            {approved.length > 0 && <span className="px-4 py-1.5 rounded-full bg-primary/5 text-primary text-sm font-bold border border-primary/10">{approved.length} reviews</span>}
          </div>
          
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4 text-muted-foreground">
              <Loader2 className="h-10 w-10 animate-spin text-primary/40" />
              <p className="font-medium animate-pulse">Loading testimonials...</p>
            </div>
          ) : approved.length === 0 ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              <Card className="p-16 text-center text-muted-foreground rounded-3xl border-dashed border-2 border-border/60 bg-secondary/10">
                <Quote className="mx-auto h-12 w-12 text-primary/10 mb-4" />
                No reviews yet. Be the first to share your NOVA experience!
              </Card>
            </motion.div>
          ) : (
            <motion.div 
              variants={container}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              className="grid gap-6 sm:grid-cols-2"
            >
              {approved.map((r) => (
                <motion.div key={r.id} variants={item} whileHover={{ y: -5 }}>
                  <Card className="p-8 h-full shadow-card hover:shadow-elegant transition-all duration-500 relative border-border/60 rounded-3xl group">
                    <Quote className="absolute top-6 right-8 h-10 w-10 text-primary/5 transition-colors duration-500 group-hover:text-primary/10" />
                    <div className="mb-6">
                      <Stars value={r.rating} readOnly />
                    </div>
                    <p className="text-base text-foreground/80 mb-8 leading-relaxed italic font-medium">"{r.content}"</p>
                    <div className="flex items-center gap-4 mt-auto pt-6 border-t border-border/40">
                      <div className="h-10 w-10 rounded-full bg-primary-soft/50 flex items-center justify-center font-bold text-primary border border-primary/10">
                        {r.authorName[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-foreground leading-none mb-1">{r.authorName}</p>
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{new Date(r.createdAt).toLocaleDateString("en-GB", { month: "short", year: "numeric" })}</p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default ReviewsPage;
