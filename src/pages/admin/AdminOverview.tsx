import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { apiService, AdminStats } from "@/lib/api";
import { cn } from "@/lib/utils";
import { 
  CalendarDays, Star, Users, Clock, ArrowRight, Loader2, 
  Activity, TrendingUp, Sparkles, DollarSign, BarChart2
} from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  ChartTooltip,
  Legend,
  Filler
);

const AdminOverview = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await apiService.dashboard.getAdminStats();
        setStats(data);
      } catch (err) {
        const error = err as { response?: { data?: { message?: string } } };
        console.error("Failed to fetch admin stats:", error.response?.data?.message || err);
      }
    };
    fetchStats();
  }, []);

  const cards = [
    { 
      label: "Total appointments", 
      value: stats?.summary.totalAppointments, 
      icon: CalendarDays, 
      link: "/admin/appointments",
      borderColor: "border-l-indigo-500 hover:border-l-indigo-600",
      iconBg: "bg-indigo-50 text-indigo-600 border-indigo-100"
    },
    { 
      label: "Pending requests", 
      value: stats?.summary.pendingAppointments, 
      icon: Clock, 
      link: "/admin/appointments?status=pending",
      borderColor: "border-l-amber-500 hover:border-l-amber-600",
      iconBg: "bg-amber-50 text-amber-600 border-amber-100"
    },
    { 
      label: "Today's bookings", 
      value: stats?.summary.todayAppointments, 
      icon: CalendarDays, 
      link: "/admin/appointments",
      borderColor: "border-l-emerald-500 hover:border-l-emerald-600",
      iconBg: "bg-emerald-50 text-emerald-600 border-emerald-100"
    },
    { 
      label: "Reviews to approve", 
      value: stats?.summary.pendingReviews, 
      icon: Star, 
      link: "/admin/reviews",
      borderColor: "border-l-violet-500 hover:border-l-violet-600",
      iconBg: "bg-violet-50 text-violet-600 border-violet-100"
    },
    { 
      label: "Registered users", 
      value: stats?.summary.totalUsers, 
      icon: Users, 
      link: "/admin/users",
      borderColor: "border-l-sky-500 hover:border-l-sky-600",
      iconBg: "bg-sky-50 text-sky-600 border-sky-100"
    },
  ];

  // Helper to generate the last 6 months dynamically for trends
  const getPast6Months = () => {
    const months = [];
    const d = new Date();
    for (let i = 5; i >= 0; i--) {
      const date = new Date(d.getFullYear(), d.getMonth() - i, 1);
      months.push({
        period: date.toISOString().slice(0, 7), // "YYYY-MM"
        month: date.toLocaleDateString("en-GB", { month: "short", year: "2-digit" })
      });
    }
    return months;
  };

  const pastMonths = getPast6Months();

  // Map real booking trends, defaulting to 0 for months without bookings
  const bookingData = pastMonths.map(m => {
    const trend = stats?.bookingTrends?.find(t => t.period === m.period);
    return {
      month: m.month,
      Bookings: trend ? trend.count : 0
    };
  });

  // Map real revenue trends, defaulting to 0 for months without invoices
  const revenueData = pastMonths.map(m => {
    const trend = stats?.revenueTrends?.find(t => t.period === m.period);
    return {
      month: m.month,
      Revenue: trend ? trend.revenue : 0
    };
  });

  // Map real service popularity stats
  const serviceData = (stats?.serviceStats || []).map(item => ({
    name: item.service,
    Visits: item.count
  }));

  const genderColors = ["#6366f1", "#ec4899", "#64748b"];
  
  // Map real gender demographics stats
  const genderData = (stats?.genderStats || []).map(item => ({
    name: item.label.charAt(0).toUpperCase() + item.label.slice(1),
    value: item.count
  }));

  // ChartJS configurations
  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: "#94a3b8",
          font: {
            size: 11,
            family: "Inter, sans-serif"
          }
        }
      },
      y: {
        grid: {
          color: "#f8fafc",
        },
        ticks: {
          color: "#94a3b8",
          font: {
            size: 11,
            family: "Inter, sans-serif"
          }
        }
      }
    }
  };

  const bookingChartData = {
    labels: pastMonths.map(m => m.month),
    datasets: [
      {
        label: 'Bookings',
        data: bookingData.map(d => d.Bookings),
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        fill: true,
        tension: 0.4,
        borderWidth: 2,
        pointBackgroundColor: '#6366f1',
        pointHoverRadius: 5
      }
    ]
  };

  const bookingOptions = {
    ...commonOptions,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1e293b',
        titleFont: { family: 'Inter', weight: 'bold' as const, size: 12 },
        bodyFont: { family: 'Inter', size: 12 },
        padding: 10,
        cornerRadius: 8,
        displayColors: false
      }
    }
  };

  const revenueChartData = {
    labels: pastMonths.map(m => m.month),
    datasets: [
      {
        label: 'Revenue',
        data: revenueData.map(d => d.Revenue),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4,
        borderWidth: 2.5,
        pointBackgroundColor: '#10b981',
        pointHoverRadius: 6
      }
    ]
  };

  const revenueOptions = {
    ...commonOptions,
    scales: {
      ...commonOptions.scales,
      y: {
        ...commonOptions.scales.y,
        ticks: {
          ...commonOptions.scales.y.ticks,
          callback: (value: string | number) => `GH₵${value}`
        }
      }
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1e293b',
        titleFont: { family: 'Inter', weight: 'bold' as const, size: 12 },
        bodyFont: { family: 'Inter', size: 12 },
        padding: 10,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          label: (context: { raw: unknown }) => `GH₵ ${context.raw}`
        }
      }
    }
  };

  const serviceChartData = {
    labels: serviceData.map(d => d.name),
    datasets: [
      {
        label: 'Visits',
        data: serviceData.map(d => d.Visits),
        backgroundColor: '#0284c7',
        borderRadius: 6,
        barThickness: 14
      }
    ]
  };

  const serviceOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y' as const,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1e293b',
        titleFont: { family: 'Inter', weight: 'bold' as const, size: 12 },
        bodyFont: { family: 'Inter', size: 12 },
        padding: 10,
        cornerRadius: 8,
        displayColors: false
      }
    },
    scales: {
      x: {
        grid: { color: "#f8fafc" },
        ticks: {
          color: "#94a3b8",
          font: { size: 11, family: "Inter, sans-serif" }
        }
      },
      y: {
        grid: { display: false },
        ticks: {
          color: "#94a3b8",
          font: { size: 11, family: "Inter, sans-serif" }
        }
      }
    }
  };

  const demographicChartData = {
    labels: genderData.map(d => d.name),
    datasets: [
      {
        data: genderData.map(d => d.value),
        backgroundColor: genderColors.slice(0, genderData.length),
        borderWidth: 2,
        borderColor: '#ffffff',
        hoverOffset: 4
      }
    ]
  };

  const demographicOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: '#1e293b',
        titleFont: { family: 'Inter', weight: 'bold' as const, size: 12 },
        bodyFont: { family: 'Inter', size: 12 },
        padding: 10,
        cornerRadius: 8
      }
    },
    cutout: '70%'
  };

  return (
    <AdminLayout title="Overview" subtitle="A quick look at clinic activity.">
      {!stats ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : (
        <div className="space-y-8 animate-in fade-in duration-300">
          
          {/* 1. Cards Section */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {cards.map((c) => (
              <Link key={c.label} to={c.link}>
                <Card className={cn(
                  "p-5 border-y border-r border-l-4 hover:shadow-md transition-all h-full bg-white relative overflow-hidden",
                  c.borderColor
                )}>
                  <div className="flex items-center justify-between mb-3">
                    <span className={cn("flex h-9 w-9 items-center justify-center rounded-lg border", c.iconBg)}>
                      <c.icon className="h-4 w-4" />
                    </span>
                  </div>
                  <p className="text-2xl font-black text-slate-800">{c.value}</p>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1.5">{c.label}</p>
                </Card>
              </Link>
            ))}
          </div>

          {/* 2. Unified Analytics Dashboard Section */}
          <div>
            <div className="flex items-center justify-between mb-6 border-b pb-3 flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <h2 className="font-bold text-slate-800 text-base flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" /> Clinic Analytics
                </h2>
                <Badge className="bg-primary-soft text-primary border-primary/20 gap-1.5 py-1 px-3 rounded-full font-bold text-[10px]">
                  <Sparkles className="h-3 w-3 text-primary animate-pulse" /> CMS Live Analytics
                </Badge>
              </div>
              <Button asChild variant="outline" size="sm" className="h-8 gap-1.5 text-xs font-semibold">
                <Link to="/admin/analytics">
                  <BarChart2 className="h-3.5 w-3.5 text-primary" /> Detailed Reports & Filters
                </Link>
              </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Card 1: Area-style Line Chart */}
              <Card className="p-6 border shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">Appointment Trends</h3>
                    <p className="text-xs text-muted-foreground">Monthly volume of ocular checkups</p>
                  </div>
                  <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Activity className="h-4 w-4" />
                  </div>
                </div>
                <div className="h-72">
                  <Line data={bookingChartData} options={bookingOptions} />
                </div>
              </Card>

              {/* Card 2: Line Chart */}
              <Card className="p-6 border shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">Revenue Performance</h3>
                    <p className="text-xs text-muted-foreground">Earnings from settled billing invoices</p>
                  </div>
                  <div className="h-8 w-8 rounded-lg bg-green-50 text-green-600 flex items-center justify-center">
                    <DollarSign className="h-4 w-4" />
                  </div>
                </div>
                <div className="h-72">
                  <Line data={revenueChartData} options={revenueOptions} />
                </div>
              </Card>

              {/* Card 3: Horizontal Bar Chart */}
              <Card className="p-6 border shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">Service Popularity</h3>
                    <p className="text-xs text-muted-foreground">Patient distribution across eye treatments</p>
                  </div>
                  <div className="h-8 w-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                    <BarChart2 className="h-4 w-4" />
                  </div>
                </div>
                <div className="h-72">
                  <Bar data={serviceChartData} options={serviceOptions} />
                </div>
              </Card>

              {/* Card 4: Doughnut Demographics */}
              <Card className="p-6 border shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">Patient Demographics</h3>
                    <p className="text-xs text-muted-foreground">Distribution of patient genders</p>
                  </div>
                  <div className="h-8 w-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                    <Users className="h-4 w-4" />
                  </div>
                </div>
                <div className="h-72 flex flex-col sm:flex-row items-center justify-center gap-6">
                  <div className="w-44 h-44 shrink-0">
                    <Doughnut data={demographicChartData} options={demographicOptions} />
                  </div>
                  <div className="space-y-3 w-full max-w-[140px]">
                    {genderData.map((entry, idx) => (
                      <div key={entry.name} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: genderColors[idx % genderColors.length] }} />
                          <span className="text-slate-500 font-medium">{entry.name}</span>
                        </div>
                        <span className="font-bold text-slate-800">{entry.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* 3. Feed & Quick Actions Section */}
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="p-5 md:p-6 border shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-lg">Recent appointments</h2>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/admin/appointments">View all <ArrowRight className="h-4 w-4" /></Link>
                </Button>
              </div>
              {stats.recentAppointments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No appointments yet.</p>
              ) : (
                <ul className="divide-y">
                  {stats.recentAppointments.map((a) => (
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
          
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminOverview;
