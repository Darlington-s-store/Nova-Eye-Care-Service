import { useEffect, useState, useCallback } from "react";
import { Bell, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { apiService } from "@/lib/api";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";

type Notification = {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  link?: string;
};

interface Props {
  audience: "user" | "admin";
  variant?: "default" | "light";
}

export const NotificationBell = ({ audience, variant = "default" }: Props) => {
  const [items, setItems] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = audience === "admin" 
        ? await apiService.notifications.getAdmin()
        : await apiService.notifications.getMine();
      setItems(data || []);
    } catch (err) {
      console.error("Failed to load notifications", err);
    }
  }, [audience]);

  useEffect(() => {
    load();
    // Simple polling for real-time feel if needed, but for now just load on mount
  }, [audience, load]);

  const unread = items.filter((n) => !n.isRead).length;

  const markAllRead = async () => {
    try {
      await apiService.notifications.markAllAsRead();
      load();
    } catch (err) {
      console.error("Failed to mark all read", err);
    }
  };

  const markRead = async (id: string) => {
    try {
      await apiService.notifications.markAsRead(id);
      load();
    } catch (err) {
      console.error("Failed to mark read", err);
    }
  };

  const triggerClass =
    variant === "light"
      ? "relative h-9 w-9 rounded-md text-primary-foreground hover:bg-white/15 inline-flex items-center justify-center"
      : "relative h-9 w-9 rounded-md text-foreground hover:bg-muted inline-flex items-center justify-center";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className={triggerClass} aria-label="Notifications">
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-destructive text-[10px] font-semibold text-destructive-foreground">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between p-3 border-b">
          <p className="font-semibold text-sm">Notifications</p>
          {unread > 0 && (
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={markAllRead}>
              <Check className="h-3 w-3" /> Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-96">
          {items.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">You're all caught up.</p>
          ) : (
            <ul className="divide-y">
              {items.map((n) => {
                const inner = (
                  <div
                    className={`p-3 hover:bg-muted/50 transition-colors ${!n.isRead ? "bg-primary-soft/40" : ""}`}
                    onClick={() => !n.isRead && markRead(n.id)}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="font-medium text-sm leading-tight">{n.title}</p>
                      {!n.isRead && <Badge variant="secondary" className="bg-primary text-primary-foreground text-[10px] h-4 px-1.5">new</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{n.message}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                );
                return (
                  <li key={n.id}>
                    {n.link ? (
                      <Link to={n.link} onClick={() => setOpen(false)}>{inner}</Link>
                    ) : (
                      inner
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </ScrollArea>
        <div className="p-2 border-t text-center bg-slate-50/50">
          <Link 
            to={audience === "admin" ? "/admin/notifications" : "/notifications"} 
            onClick={() => setOpen(false)}
            className="text-xs font-bold text-primary hover:text-primary/80 transition-colors block py-1"
          >
            {audience === "admin" ? "View all activity feed →" : "View all notifications →"}
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
};
