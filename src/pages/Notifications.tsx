import { useEffect, useState, useCallback } from "react";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiService, Notification } from "@/lib/api";
import { formatDistanceToNow } from "date-fns";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { 
  Bell, Check, Loader2, Calendar, CreditCard, 
  FileText, Inbox, ChevronRight
} from "lucide-react";

const getNotificationIcon = (type: string) => {
  switch (type?.toLowerCase()) {
    case "appointment":
    case "booking":
      return <Calendar className="h-5 w-5 text-blue-500 animate-pulse" />;
    case "invoice":
    case "billing":
    case "payment":
      return <CreditCard className="h-5 w-5 text-green-500" />;
    case "prescription":
    case "record":
    case "medical":
    case "screening":
      return <FileText className="h-5 w-5 text-purple-500" />;
    default:
      return <Bell className="h-5 w-5 text-amber-500" />;
  }
};

const Notifications = () => {
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "unread" | "read">("all");
  const navigate = useNavigate();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiService.notifications.getMine();
      setItems(data || []);
    } catch (err) {
      console.error("Failed to load notifications", err);
      toast.error("Could not load notifications.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

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

  const handleMarkRead = async (id: string, link?: string | null) => {
    try {
      await apiService.notifications.markAsRead(id);
      load();
      if (link) {
        navigate(link);
      }
    } catch (err) {
      console.error("Failed to mark read", err);
    }
  };

  const filteredItems = items.filter((n) => {
    if (activeTab === "unread") return !n.isRead;
    if (activeTab === "read") return n.isRead;
    return true;
  });

  const unreadCount = items.filter((n) => !n.isRead).length;

  return (
    <Layout>
      <div className="min-h-screen bg-slate-50 py-10 px-4 md:px-8">
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                  <Bell className="h-5 w-5" />
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Notifications</h1>
              </div>
              <p className="text-sm text-slate-500 mt-2 ml-1">
                Stay updated with your appointments, prescriptions, invoices, and clinic news.
              </p>
            </div>
            {unreadCount > 0 && (
              <Button 
                variant="outline" 
                onClick={markAllRead}
                className="rounded-xl font-bold text-slate-700 hover:text-primary hover:border-primary border-slate-200 shadow-sm self-start md:self-auto h-11"
              >
                <Check className="h-4 w-4 mr-2" /> Mark all as read
              </Button>
            )}
          </div>

          {/* Main Card */}
          <Card className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow duration-300">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="w-full">
              <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4 flex items-center justify-between">
                <TabsList className="bg-slate-100 rounded-xl p-1 gap-1 border border-slate-200/50">
                  <TabsTrigger value="all" className="rounded-lg font-bold text-xs py-2 px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                    All
                  </TabsTrigger>
                  <TabsTrigger value="unread" className="rounded-lg font-bold text-xs py-2 px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm flex items-center gap-1.5">
                    Unread
                    {unreadCount > 0 && (
                      <Badge className="bg-primary text-white hover:bg-primary text-[10px] h-5 px-1.5 min-w-5 flex justify-center rounded-full">
                        {unreadCount}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="read" className="rounded-lg font-bold text-xs py-2 px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                    Read
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="p-0">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Loading your notifications...</p>
                  </div>
                ) : filteredItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                    <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-4 border border-dashed border-slate-300">
                      <Inbox className="h-7 w-7 animate-bounce" />
                    </div>
                    <h3 className="font-bold text-slate-800 text-lg mb-1">No notifications here</h3>
                    <p className="text-sm text-slate-500 max-w-sm italic">
                      {activeTab === "unread" 
                        ? "You have read all of your notifications." 
                        : activeTab === "read" 
                        ? "You have no read notifications." 
                        : "You're all caught up! There are no notifications to show."}
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {filteredItems.map((n) => (
                      <div 
                        key={n.id} 
                        onClick={() => handleMarkRead(n.id, n.link)}
                        className={`p-5 transition-all duration-300 flex items-start gap-4 cursor-pointer hover:bg-slate-50/80 ${
                          !n.isRead ? "bg-primary-soft/30 border-l-4 border-l-primary" : "border-l-4 border-l-transparent"
                        }`}
                      >
                        <div className="h-11 w-11 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center justify-center shrink-0">
                          {getNotificationIcon(n.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-4 flex-wrap mb-1">
                            <h4 className={`text-sm font-bold text-slate-900 ${!n.isRead ? "font-extrabold" : ""}`}>
                              {n.title}
                            </h4>
                            <span className="text-[11px] text-slate-400 font-medium shrink-0">
                              {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed mb-2 max-w-2xl">
                            {n.message}
                          </p>
                          <div className="flex items-center justify-between">
                            {n.link ? (
                              <span className="text-[11px] font-bold text-primary flex items-center hover:underline">
                                View Details <ChevronRight className="h-3 w-3 ml-0.5" />
                              </span>
                            ) : (
                              <div />
                            )}
                            {!n.isRead && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMarkRead(n.id);
                                }}
                                className="h-6 px-2 text-[10px] text-slate-500 hover:text-primary font-bold hover:bg-primary-soft"
                              >
                                Mark read
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Tabs>
          </Card>
          
          <div className="text-center pt-2">
            <Link to="/dashboard" className="text-sm font-bold text-slate-500 hover:text-primary transition-colors">
              ← Return to Patient Portal
            </Link>
          </div>

        </div>
      </div>
    </Layout>
  );
};

export default Notifications;
