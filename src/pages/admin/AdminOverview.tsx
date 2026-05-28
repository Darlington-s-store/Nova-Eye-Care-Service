import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { apiService } from "@/lib/api";
import { CalendarDays, Star, Users, Clock, ArrowRight, Loader2 } from "lucide-react";

type Stats = {
  totalAppts: number;
  pendingAppts: number;
  todayAppts: number;
  pendingReviews: number;
  totalUsers: number;
};

const AdminOverview = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recent, setRecent] = useState<{
    id: string;
    fullName: string;
    service: string;
    appointmentDate: string;
    appointmentTime: string;
    status: string;
  }[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await apiService.dashboard.getAdminStats();
        setStats({
          totalAppts: data.summary.totalAppointments,
          pendingAppts: data.summary.pendingAppointments,
          todayAppts: data.summary.todayAppointments,
          pendingReviews: data.summary.pendingReviews,
          totalUsers: data.summary.totalUsers,
        });
        setRecent(data.recentAppointments);
      } catch (err) {
        const error = err as { response?: { data?: { message?: string } } };
        console.error("Failed to fetch admin stats:", error.response?.data?.message || err);
      }
    };
    fetchStats();
  }, []);

  const cards = [
    { label: "Total appointments", value: stats?.totalAppts, icon: CalendarDays, link: "/admin/appointments" },
    { label: "Pending requests", value: stats?.pendingAppts, icon: Clock, link: "/admin/appointments?status=pending" },
    { label: "Today's bookings", value: stats?.todayAppts, icon: CalendarDays, link: "/admin/appointments" },
    { label: "Reviews to approve", value: stats?.pendingReviews, icon: Star, link: "/admin/reviews" },
    { label: "Registered users", value: stats?.totalUsers, icon: Users, link: "/admin/users" },
  ];

  return (
    <AdminLayout title="Overview" subtitle="A quick look at clinic activity.">
      {!stats ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 mb-8">
            {cards.map((c) => (
              <Link key={c.label} to={c.link}>
                <Card className="p-5 border hover:bg-muted/30 transition-colors h-full">
                  <div className="flex items-center justify-between mb-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-primary border">
                      <c.icon className="h-4 w-4" />
                    </span>
                  </div>
                  <p className="text-2xl font-bold">{c.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{c.label}</p>
                </Card>
              </Link>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <Card className="p-5 md:p-6 border shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-lg">Recent appointments</h2>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/admin/appointments">View all <ArrowRight className="h-4 w-4" /></Link>
                </Button>
              </div>
              {recent.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No appointments yet.</p>
              ) : (
                <ul className="divide-y">
                  {recent.map((a) => (
                    <li key={a.id} className="py-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium truncate">{a.fullName}</p>
                        <p className="text-xs text-muted-foreground truncate">{a.service}</p>
                      </div>
                      <div className="text-right text-xs text-muted-foreground shrink-0">
                        <p>{new Date(a.appointmentDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })} · {a.appointmentTime}</p>
                        <Badge variant="secondary" className="mt-1 capitalize">{a.status}</Badge>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <div className="space-y-6">
              <h2 className="font-semibold text-lg ml-1">Quick Actions</h2>
              <div className="grid gap-4">
                <Link to="/admin/cms?tab=hero">
                  <Card className="p-4 border hover:bg-muted/30 transition-all group">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                        <ArrowRight className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm">Manage Homepage Hero</h4>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Change text & background image</p>
                      </div>
                    </div>
                  </Card>
                </Link>
                <Link to="/admin/chatbot">
                  <Card className="p-4 border hover:bg-muted/30 transition-all group">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                        <ArrowRight className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm">Update AI Knowledge</h4>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Train your clinical assistant</p>
                      </div>
                    </div>
                  </Card>
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
};

export default AdminOverview;
