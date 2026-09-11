import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiService } from "@/lib/api";
import { Loader2, Bell, Check, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

type N = {
  id: string;
  title: string;
  message: string;
  link?: string | null;
  isRead: boolean;
  createdAt: string;
};

const AdminNotifications = () => {
  const [items, setItems] = useState<N[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const data = await apiService.notifications.getAdmin();
      setItems(data || []);
    } catch (err) {
      console.error("Failed to load notifications", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const markAllRead = async () => {
    try {
      await apiService.notifications.markAllAsRead();
      toast.success("All notifications marked as read");
      load();
    } catch (err) {
      console.error("Failed to mark all read", err);
      toast.error("Failed to mark notifications as read");
    }
  };

  const clearAll = async () => {
    if (!window.confirm("Are you sure you want to clear all notifications?")) return;
    try {
      await apiService.notifications.clearAll();
      toast.success("All notifications cleared");
      setItems([]);
    } catch (err) {
      console.error("Failed to clear notifications", err);
      toast.error("Failed to clear notifications");
    }
  };

  const deleteItem = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await apiService.notifications.delete(id);
      toast.success("Notification deleted");
      setItems(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      console.error("Failed to delete notification", err);
      toast.error("Failed to delete notification");
    }
  };

  return (
    <AdminLayout title="Activity feed" subtitle="Everything happening on the site.">
      <div className="flex justify-end gap-2 mb-4">
        {items.length > 0 && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={clearAll} 
            className="text-rose-600 border-rose-200 hover:bg-rose-50 rounded-xl h-9 text-xs"
          >
            <Trash2 className="h-3.5 w-3.5 mr-1" /> Clear all
          </Button>
        )}
        <Button 
          variant="outline" 
          size="sm" 
          onClick={markAllRead} 
          className="rounded-xl h-9 text-xs"
        >
          <Check className="h-3.5 w-3.5 mr-1" /> Mark all read
        </Button>
      </div>
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : items.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground rounded-2xl"><Bell className="h-8 w-8 mx-auto mb-3 opacity-50" /> No activity yet.</Card>
      ) : (
        <div className="space-y-2">
          {items.map((n) => {
            const inner = (
              <Card className={`p-4 hover:bg-muted/30 transition-smooth group rounded-xl ${!n.isRead ? "border-primary/40 bg-muted/50" : ""}`}>
                <div className="flex justify-between items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold">{n.title}</p>
                      {!n.isRead && <Badge className="bg-primary text-primary-foreground text-[10px]">new</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">{n.message}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                    </p>
                    <button
                      type="button"
                      onClick={(e) => deleteItem(e, n.id)}
                      className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 p-1 transition-all rounded"
                      title="Delete notification"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </Card>
            );
            return n.link ? <Link key={n.id} to={n.link}>{inner}</Link> : <div key={n.id}>{inner}</div>;
          })}
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminNotifications;
