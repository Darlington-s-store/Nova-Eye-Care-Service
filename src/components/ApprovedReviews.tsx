import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, Quote, Loader2, ArrowRight } from "lucide-react";
import { apiService } from "@/lib/api";
import { Link } from "react-router-dom";

type Review = {
  id: string;
  authorName: string;
  rating: number;
  content: string;
  createdAt: string;
};

export const ApprovedReviews = () => {
  const [items, setItems] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await apiService.reviews.getApproved();
        setItems(data ?? []);
      } catch (err) {
        console.error("Failed to fetch reviews:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <section className="container py-12 flex justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
      </section>
    );
  }

  if (items.length === 0) return null;

  return (
    <section className="container py-16 md:py-20">
      <div className="text-center mb-10 max-w-2xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold mb-3">Patient Testimonials</h2>
        <p className="text-muted-foreground">
          Real experiences from people we've cared for.
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {items.map((r) => (
          <Card key={r.id} className="p-6 border border-slate-200 rounded-xl relative hover:border-primary/20 transition-colors">
            <Quote className="absolute top-4 right-4 h-7 w-7 text-slate-100" />
            <div className="flex gap-0.5 mb-3 relative z-10">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} className={`h-4 w-4 ${i <= r.rating ? "fill-yellow-400 text-yellow-400" : "text-slate-200"}`} />
              ))}
            </div>
            <p className="text-sm text-slate-700 mb-6 leading-relaxed relative z-10">"{r.content}"</p>
            <div className="text-xs mt-auto">
              <p className="font-bold text-slate-900">{r.authorName}</p>
              <p className="text-slate-500">{new Date(r.createdAt).toLocaleDateString("en-GB", { month: "long", year: "numeric" })}</p>
            </div>
          </Card>
        ))}
      </div>
      <div className="text-center mt-10">
        <Button asChild variant="outline" className="rounded-lg font-bold">
          <Link to="/reviews" className="flex items-center gap-2">View All Reviews <ArrowRight className="h-4 w-4" /></Link>
        </Button>
      </div>
    </section>
  );
};
