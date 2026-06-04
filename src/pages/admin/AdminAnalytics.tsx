import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { apiService, Appointment } from "@/lib/api";
import { cn } from "@/lib/utils";
import { 
  TrendingUp, Calendar, Users, Activity, BarChart2, 
  Sparkles, CheckCircle2, Clock, XCircle, AlertCircle, RefreshCw,
  Loader2, Download, Printer, FileText
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
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

const AdminAnalytics = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Timezone-safe date helper to parse YYYY-MM-DD strings
  const parseLocalDate = (dateStr: string) => {
    if (!dateStr) return null;
    const parts = dateStr.split(/[-T]/);
    if (parts.length >= 3) {
      return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    }
    return new Date(dateStr);
  };

  const formatDateStr = (dateStr: string) => {
    if (!dateStr) return "N/A";
    const parts = dateStr.split(/[-T]/);
    if (parts.length >= 3) {
      return `${parts[2].slice(0, 2)}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  // Filters State
  const [filterService, setFilterService] = useState("all");
  const [filterDoctor, setFilterDoctor] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [dateRange, setDateRange] = useState("all-time"); // 7-days, 30-days, this-month, this-year, custom, all-time
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await apiService.appointments.getAll();
      setAppointments(data);
    } catch (err) {
      console.error("Failed to fetch appointments for analytics:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handlePrint = () => {
    window.print();
  };

  const exportToExcel = () => {
    const headers = ["Appointment Date", "Patient Name", "Service", "Doctor", "Type", "Status"];
    const rows = filteredAppointments.map(appt => [
      appt.appointmentDate ? formatDateStr(appt.appointmentDate) : "N/A",
      appt.fullName || "N/A",
      appt.service || "N/A",
      appt.doctorName || "Unassigned",
      appt.appointmentType === "virtual" ? "Virtual" : "In-Person",
      appt.status ? appt.status.toUpperCase() : "PENDING"
    ]);

    const worksheetData = [headers, ...rows];
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Appointments Report");

    XLSX.writeFile(workbook, `Nova_Analytics_Report_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const exportToPDF = () => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header - Clinic Branding
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(0, 59, 92); // Nova Dark Blue
    doc.text("NOVA EYE CARE", pageWidth / 2, 20, { align: "center" });
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text("Professional Optometry & Clinical Excellence", pageWidth / 2, 26, { align: "center" });
    doc.line(15, 30, pageWidth - 15, 30);
    
    // Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text("CLINIC ANALYTICS REPORT", 15, 40);

    // Filters Metadata
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(80, 80, 80);
    
    const dateStr = dateRange === "custom" 
      ? `${startDate || 'Start'} to ${endDate || 'End'}` 
      : dateRange.toUpperCase().replace("-", " ");

    const filterText = [
      `Service: ${filterService === 'all' ? 'All Services' : filterService}`,
      `Doctor: ${filterDoctor === 'all' ? 'All Doctors' : filterDoctor === 'unassigned' ? 'Unassigned' : filterDoctor}`,
      `Status: ${filterStatus.toUpperCase()}`,
      `Type: ${filterType === 'all' ? 'All' : filterType === 'virtual' ? 'Virtual' : 'In-Person'}`,
      `Range: ${dateStr}`
    ].join("  |  ");

    doc.text(filterText, 15, 46);
    doc.text(`Generated: ${new Date().toLocaleString("en-GB")}`, pageWidth - 15, 40, { align: "right" });
    doc.line(15, 50, pageWidth - 15, 50);

    // Summary Metrics Section
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(0, 59, 92);
    doc.text("Key Performance Metrics", 15, 58);

    autoTable(doc, {
      startY: 62,
      head: [["Filtered Bookings", "Completed", "Active Bookings", "Cancelled", "Cancellation Rate"]],
      body: [[
        total.toString(),
        completed.toString(),
        activeBookings.toString(),
        cancelled.toString(),
        `${cancellationRate}%`
      ]],
      theme: 'grid',
      headStyles: { fillColor: [0, 59, 92], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' },
      styles: { fontSize: 9.5, halign: 'center' }
    });

    // Appointments Table Section
    const nextY = (doc as any).lastAutoTable.finalY + 12;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(0, 59, 92);
    doc.text("Appointments Data Summary", 15, nextY);

    const tableRows = filteredAppointments.map(appt => [
      appt.appointmentDate ? formatDateStr(appt.appointmentDate) : "N/A",
      appt.fullName || "N/A",
      appt.service || "N/A",
      appt.doctorName || "Unassigned",
      appt.appointmentType === "virtual" ? "Virtual" : "In-Person",
      appt.status ? appt.status.toUpperCase() : "PENDING"
    ]);

    autoTable(doc, {
      startY: nextY + 4,
      head: [["Date", "Patient Name", "Ocular Service", "Doctor", "Type", "Status"]],
      body: tableRows,
      theme: 'striped',
      headStyles: { fillColor: [0, 59, 92], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 8.5 }
    });

    // Add page numbers
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: "center" });
      doc.text("Nova Eye Care Portal | Clinic Management System", 15, doc.internal.pageSize.getHeight() - 10);
    }

    doc.save(`Nova_Analytics_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  // Derive unique services and doctors from raw appointments list
  const uniqueServices = Array.from(new Set(appointments.map(a => a.service))).filter(Boolean);
  const uniqueDoctors = Array.from(new Set(appointments.map(a => a.doctorName))).filter(Boolean) as string[];

  // Filtering Logic
  const filteredAppointments = appointments.filter(appt => {
    if (filterService !== "all" && appt.service !== filterService) return false;
    
    if (filterDoctor !== "all") {
      if (filterDoctor === "unassigned" && appt.doctorName) return false;
      if (filterDoctor !== "unassigned" && appt.doctorName !== filterDoctor) return false;
    }
    
    if (filterStatus !== "all" && appt.status !== filterStatus) return false;
    if (filterType !== "all" && appt.appointmentType !== filterType) return false;
    
    // Date bounds checks
    if (appt.appointmentDate) {
      const apptDate = parseLocalDate(appt.appointmentDate);
      if (apptDate) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (dateRange === "7-days") {
          const limit = new Date();
          limit.setDate(today.getDate() - 7);
          limit.setHours(0, 0, 0, 0);
          if (apptDate < limit || apptDate > today) return false;
        } else if (dateRange === "30-days") {
          const limit = new Date();
          limit.setDate(today.getDate() - 30);
          limit.setHours(0, 0, 0, 0);
          if (apptDate < limit || apptDate > today) return false;
        } else if (dateRange === "this-month") {
          const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
          if (apptDate < startOfMonth) return false;
        } else if (dateRange === "this-year") {
          const startOfYear = new Date(today.getFullYear(), 0, 1);
          if (apptDate < startOfYear) return false;
        } else if (dateRange === "custom") {
          if (startDate) {
            const start = parseLocalDate(startDate);
            if (start && apptDate < start) return false;
          }
          if (endDate) {
            const end = parseLocalDate(endDate);
            if (end && apptDate > end) return false;
          }
        }
      }
    }
    return true;
  });

  // Calculate Metrics
  const total = filteredAppointments.length;
  const completed = filteredAppointments.filter(a => a.status === 'completed').length;
  const pending = filteredAppointments.filter(a => a.status === 'pending').length;
  const confirmed = filteredAppointments.filter(a => a.status === 'confirmed').length;
  const cancelled = filteredAppointments.filter(a => a.status === 'cancelled').length;
  const activeBookings = pending + confirmed;
  const cancellationRate = total > 0 ? ((cancelled / total) * 100).toFixed(1) : "0.0";

  // Reusable Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: "#94a3b8", font: { size: 10, family: "Inter" } }
      },
      y: {
        grid: { color: "#f8fafc" },
        ticks: { color: "#94a3b8", font: { size: 10, family: "Inter" }, precision: 0 }
      }
    }
  };

  // 1. Booking volume over time (Trend Line)
  const getTrendData = () => {
    if (dateRange === "7-days" || dateRange === "30-days") {
      const days = dateRange === "7-days" ? 7 : 30;
      const dataMap: { [key: string]: number } = {};
      const today = new Date();
      
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        const key = d.toISOString().split('T')[0];
        dataMap[key] = 0;
      }
      
      filteredAppointments.forEach(a => {
        if (a.appointmentDate) {
          const key = a.appointmentDate.split('T')[0];
          if (dataMap[key] !== undefined) dataMap[key]++;
        }
      });
      
      const labels = Object.keys(dataMap).map(k => {
        const d = new Date(k);
        return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
      });
      
      return {
        labels,
        datasets: [{
          label: 'Bookings',
          data: Object.values(dataMap),
          borderColor: '#6366f1',
          backgroundColor: 'rgba(99, 102, 241, 0.08)',
          fill: true,
          tension: 0.35,
          borderWidth: 2,
          pointBackgroundColor: '#6366f1',
          pointHoverRadius: 5
        }]
      };
    } else {
      // Group by Month (last 6 months)
      const dataMap: { [key: string]: number } = {};
      const today = new Date();
      
      for (let i = 5; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const key = d.toISOString().slice(0, 7);
        dataMap[key] = 0;
      }
      
      filteredAppointments.forEach(a => {
        if (a.appointmentDate) {
          const key = a.appointmentDate.slice(0, 7);
          if (dataMap[key] !== undefined) dataMap[key]++;
        }
      });
      
      const labels = Object.keys(dataMap).map(k => {
        const d = new Date(k + "-02");
        return d.toLocaleDateString("en-GB", { month: "short", year: "2-digit" });
      });
      
      return {
        labels,
        datasets: [{
          label: 'Bookings',
          data: Object.values(dataMap),
          borderColor: '#6366f1',
          backgroundColor: 'rgba(99, 102, 241, 0.08)',
          fill: true,
          tension: 0.35,
          borderWidth: 2,
          pointBackgroundColor: '#6366f1',
          pointHoverRadius: 5
        }]
      };
    }
  };

  // 2. Service Popularity (Horizontal Bar Chart)
  const getServiceData = () => {
    const counts: { [key: string]: number } = {};
    uniqueServices.forEach(s => { counts[s] = 0; });
    filteredAppointments.forEach(a => {
      if (a.service) counts[a.service] = (counts[a.service] || 0) + 1;
    });

    const sorted = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5); // top 5

    return {
      labels: sorted.map(x => x[0]),
      datasets: [{
        label: 'Visits',
        data: sorted.map(x => x[1]),
        backgroundColor: '#0ea5e9',
        borderRadius: 5,
        barThickness: 12
      }]
    };
  };

  // 3. Status Ratios (Doughnut Chart)
  const getStatusData = () => {
    return {
      labels: ['Pending', 'Confirmed', 'Completed', 'Cancelled'],
      datasets: [{
        data: [pending, confirmed, completed, cancelled],
        backgroundColor: ['#f59e0b', '#3b82f6', '#10b981', '#ef4444'],
        borderWidth: 1.5,
        borderColor: '#ffffff'
      }]
    };
  };

  // 4. Doctor Workload (Vertical Bar Chart)
  const getDoctorData = () => {
    const counts: { [key: string]: number } = { 'Unassigned': 0 };
    uniqueDoctors.forEach(d => { counts[d] = 0; });
    
    filteredAppointments.forEach(a => {
      const doc = a.doctorName || 'Unassigned';
      counts[doc]++;
    });

    return {
      labels: Object.keys(counts),
      datasets: [{
        label: 'Appointments',
        data: Object.values(counts),
        backgroundColor: '#8b5cf6',
        borderRadius: 5,
        barThickness: 16
      }]
    };
  };

  const statusColors = ['#f59e0b', '#3b82f6', '#10b981', '#ef4444'];

  return (
    <AdminLayout title="Clinic Analytics" subtitle="Interactive database filters & visual performance metrics.">
      <div className="space-y-8 animate-in fade-in duration-300">
        
        {/* Print-Only Header */}
        <div className="hidden print:block border-b-2 border-slate-800 pb-4 mb-6">
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">NOVA EYE CARE</h1>
              <p className="text-sm text-slate-500 font-semibold mt-1">Clinical Analytics & Performance Report</p>
            </div>
            <div className="text-right text-xs text-slate-400">
              <p className="font-bold text-slate-600">Generated: {new Date().toLocaleString("en-GB")}</p>
              <p className="mt-1">
                Active Parameters: {filterService === 'all' ? 'All Services' : filterService} | {filterDoctor === 'all' ? 'All Doctors' : filterDoctor === 'unassigned' ? 'Unassigned' : filterDoctor} | Status: {filterStatus.toUpperCase()}
              </p>
            </div>
          </div>
        </div>

        {/* Filters Panel Card */}
        <Card className="p-6 border shadow-sm bg-white print:hidden">
          <div className="flex items-center justify-between mb-4 pb-2 border-b flex-wrap gap-3">
            <span className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" /> Filter Diagnostics
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2 text-xs font-semibold h-8"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                <RefreshCw className={cn("h-3 w-3", refreshing && "animate-spin")} /> Refresh
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2 text-xs font-semibold h-8 text-indigo-600 hover:text-indigo-700 border-indigo-200 hover:bg-indigo-50/50"
                onClick={exportToExcel}
              >
                <Download className="h-3.5 w-3.5" /> Export Excel
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2 text-xs font-semibold h-8 text-emerald-600 hover:text-emerald-700 border-emerald-200 hover:bg-emerald-50/50"
                onClick={exportToPDF}
              >
                <FileText className="h-3.5 w-3.5" /> Export PDF
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2 text-xs font-semibold h-8 text-slate-600 hover:text-slate-700 border-slate-200 hover:bg-slate-50/50"
                onClick={handlePrint}
              >
                <Printer className="h-3.5 w-3.5" /> Print Report
              </Button>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            {/* Service Filter */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Ocular Service</label>
              <select 
                value={filterService}
                onChange={(e) => setFilterService(e.target.value)}
                className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              >
                <option value="all">All Services</option>
                {uniqueServices.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Doctor Filter */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Consulting Doctor</label>
              <select 
                value={filterDoctor}
                onChange={(e) => setFilterDoctor(e.target.value)}
                className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              >
                <option value="all">All Doctors</option>
                <option value="unassigned">Unassigned</option>
                {uniqueDoctors.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Outcome Status</label>
              <select 
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Type Filter */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Consult Type</label>
              <select 
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              >
                <option value="all">All Types</option>
                <option value="in_person">In-Person</option>
                <option value="virtual">Virtual</option>
              </select>
            </div>

            {/* Date Preset Filter */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Date Filter</label>
              <select 
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              >
                <option value="all-time">All Time</option>
                <option value="7-days">Last 7 Days</option>
                <option value="30-days">Last 30 Days</option>
                <option value="this-month">This Month</option>
                <option value="this-year">This Year</option>
                <option value="custom">Custom Date Range</option>
              </select>
            </div>
          </div>

          {/* Custom Date Inputs (only shown when custom preset selected) */}
          {dateRange === "custom" && (
            <div className="grid gap-4 sm:grid-cols-2 mt-4 pt-4 border-t border-slate-100 max-w-md animate-in slide-in-from-top-2 duration-200">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Start Date</label>
                <input 
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full h-9 px-3 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase">End Date</label>
                <input 
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full h-9 px-3 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                />
              </div>
            </div>
          )}
        </Card>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : (
          <>
            {/* KPI Cards Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              
              {/* Card 1: Total Appointments */}
              <Card className="p-5 border bg-white shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Filtered Bookings</span>
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
                    <Activity className="h-4 w-4" />
                  </span>
                </div>
                <div>
                  <p className="text-2xl font-black text-slate-800">{total}</p>
                  <p className="text-[11px] text-slate-400 mt-1">Total matching records</p>
                </div>
              </Card>

              {/* Card 2: Completed */}
              <Card className="p-5 border bg-white shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Completed</span>
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
                    <CheckCircle2 className="h-4 w-4" />
                  </span>
                </div>
                <div>
                  <p className="text-2xl font-black text-slate-800">{completed}</p>
                  <p className="text-[11px] text-slate-400 mt-1">Successfully examined</p>
                </div>
              </Card>

              {/* Card 3: Active */}
              <Card className="p-5 border bg-white shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Active Bookings</span>
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600 border border-amber-100">
                    <Clock className="h-4 w-4" />
                  </span>
                </div>
                <div>
                  <p className="text-2xl font-black text-slate-800">{activeBookings}</p>
                  <p className="text-[11px] text-slate-400 mt-1">Pending & confirmed</p>
                </div>
              </Card>

              {/* Card 4: Cancelled */}
              <Card className="p-5 border bg-white shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Cancelled</span>
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-50 text-red-600 border border-red-100">
                    <XCircle className="h-4 w-4" />
                  </span>
                </div>
                <div>
                  <p className="text-2xl font-black text-slate-800">{cancelled}</p>
                  <p className="text-[11px] text-slate-400 mt-1">Failed to materialize</p>
                </div>
              </Card>

              {/* Card 5: Cancellation Rate */}
              <Card className="p-5 border bg-white shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Cancellation Rate</span>
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-50 text-slate-600 border">
                    <AlertCircle className="h-4 w-4" />
                  </span>
                </div>
                <div>
                  <p className="text-2xl font-black text-slate-800">{cancellationRate}%</p>
                  <p className="text-[11px] text-slate-400 mt-1">Ratio of cancelled tasks</p>
                </div>
              </Card>
            </div>

            {total === 0 ? (
              <Card className="p-12 border shadow-sm text-center bg-white">
                <BarChart2 className="h-10 w-10 text-slate-300 mx-auto mb-4" />
                <h3 className="font-bold text-slate-700 text-lg">No Data Matches Filter</h3>
                <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
                  Try widening your date range presets or adjusting your service/doctor selectors to query database rows.
                </p>
              </Card>
            ) : (
              /* Charts Grid */
              <div className="grid gap-6 md:grid-cols-2">
                
                {/* Chart 1: Volume Trend */}
                <Card className="p-6 border bg-white shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="font-bold text-slate-800 text-sm">Volume Trend Analysis</h3>
                      <p className="text-xs text-muted-foreground">Historical appointment flow over time</p>
                    </div>
                    <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                      <TrendingUp className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="h-72">
                    <Line data={getTrendData()} options={chartOptions} />
                  </div>
                </Card>

                {/* Chart 2: Status Breakdown */}
                <Card className="p-6 border bg-white shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-slate-800 text-sm">Status Ratios</h3>
                      <p className="text-xs text-muted-foreground">Visual breakdown of booking states</p>
                    </div>
                    <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="h-72 flex flex-col sm:flex-row items-center justify-center gap-6">
                    <div className="w-40 h-40 shrink-0">
                      <Doughnut 
                        data={getStatusData()} 
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: { legend: { display: false } },
                          cutout: '70%'
                        }} 
                      />
                    </div>
                    <div className="space-y-3 w-full max-w-[140px]">
                      {['Pending', 'Confirmed', 'Completed', 'Cancelled'].map((name, idx) => {
                        const val = [pending, confirmed, completed, cancelled][idx];
                        const pct = total > 0 ? ((val / total) * 100).toFixed(0) : "0";
                        return (
                          <div key={name} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: statusColors[idx] }} />
                              <span className="text-slate-500 font-semibold">{name}</span>
                            </div>
                            <span className="font-bold text-slate-800">{val} ({pct}%)</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </Card>

                {/* Chart 3: Service Popularity */}
                <Card className="p-6 border bg-white shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="font-bold text-slate-800 text-sm">Services Breakdown</h3>
                      <p className="text-xs text-muted-foreground">Visits per ocular care category</p>
                    </div>
                    <div className="h-8 w-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100">
                      <BarChart2 className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="h-72">
                    <Bar 
                      data={getServiceData()} 
                      options={{
                        ...chartOptions,
                        indexAxis: 'y' as const,
                        scales: {
                          x: { grid: { color: "#f8fafc" }, ticks: { color: "#94a3b8", font: { size: 10, family: "Inter" } } },
                          y: { grid: { display: false }, ticks: { color: "#94a3b8", font: { size: 10, family: "Inter" } } }
                        }
                      }} 
                    />
                  </div>
                </Card>

                {/* Chart 4: Doctor Workload */}
                <Card className="p-6 border bg-white shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="font-bold text-slate-800 text-sm">Staff Workload Distribution</h3>
                      <p className="text-xs text-muted-foreground">Appointments assigned per physician</p>
                    </div>
                    <div className="h-8 w-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
                      <Users className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="h-72">
                    <Bar data={getDoctorData()} options={chartOptions} />
                  </div>
                </Card>

              </div>
            )}
          </>
        )}

      </div>
    </AdminLayout>
  );
};

export default AdminAnalytics;
