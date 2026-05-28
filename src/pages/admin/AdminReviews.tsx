import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiService, Review } from "@/lib/api";
import { toast } from "sonner";
import { Loader2, Star, Check, X, Trash2 } from "lucide-react";

const AdminReviews = () => {
  const [items, setItems] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const data = await apiService.reviews.getAll();
      setItems(data || []);
    } catch (err) {
      toast.error("Failed to load reviews");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const approve = async (r: Review) => {
    try {
      await apiService.reviews.approve(r.id);
      toast.success("Review approved");
      load();
    } catch (err) {
      toast.error("Failed to approve review");
    }
  };

  const unapprove = async (r: Review) => {
    try {
      await apiService.reviews.unapprove(r.id);
      toast.success("Review hidden");
      load();
    } catch (err) {
      toast.error("Failed to hide review");
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this review?")) return;
    try {
      await apiService.reviews.delete(id);
      toast.success("Deleted");
      load();
    } catch (err) {
      toast.error("Failed to delete review");
    }
  };

  const pending = items.filter((r) => !r.approved);
  const approved = items.filter((r) => r.approved);

  return (
    <AdminLayout title="Reviews" subtitle="Approve, hide, or remove patient reviews.">
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : (
        <>
          <h2 className="font-semibold text-lg mb-3">Pending approval ({pending.length})</h2>
          {pending.length === 0 ? (
            <Card className="p-6 text-center text-muted-foreground mb-8">Nothing waiting for review.</Card>
          ) : (
            <div className="space-y-3 mb-10">
              {pending.map((r) => <ReviewCard key={r.id} r={r} onApprove={approve} onRemove={remove} />)}
            </div>
          )}

          <h2 className="font-semibold text-lg mb-3">Published ({approved.length})</h2>
          {approved.length === 0 ? (
            <Card className="p-6 text-center text-muted-foreground">No published reviews yet.</Card>
          ) : (
            <div className="space-y-3">
              {approved.map((r) => <ReviewCard key={r.id} r={r} approved onUnapprove={unapprove} onRemove={remove} />)}
            </div>
          )}
        </>
      )}
    </AdminLayout>
  );
};

const ReviewCard = ({ r, approved, onApprove, onUnapprove, onRemove }: {
  r: Review; approved?: boolean;
  onApprove?: (r: Review) => void;
  onUnapprove?: (r: Review) => void;
  onRemove: (id: string) => void;
}) => (
  <Card className="p-5">
    <div className="flex flex-wrap justify-between gap-4 items-start">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-1">
          <p className="font-semibold">{r.authorName}</p>
          <div className="flex">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star key={i} className={`h-3.5 w-3.5 ${i <= r.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`} />
            ))}
          </div>
          {approved && <Badge variant="secondary" className="bg-green-100 text-green-900">Published</Badge>}
        </div>
        <p className="text-sm text-foreground/85 mb-1">{r.content}</p>
        <p className="text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleString("en-GB")}</p>
      </div>
      <div className="flex gap-2 shrink-0">
        {!approved && onApprove && <Button size="sm" onClick={() => onApprove(r)}><Check className="h-4 w-4" /> Approve</Button>}
        {approved && onUnapprove && <Button size="sm" variant="outline" onClick={() => onUnapprove(r)}><X className="h-4 w-4" /> Unpublish</Button>}
        <Button size="sm" variant="outline" className="text-destructive" onClick={() => onRemove(r.id)}><Trash2 className="h-4 w-4" /></Button>
      </div>
    </div>
  </Card>
);

export default AdminReviews;
