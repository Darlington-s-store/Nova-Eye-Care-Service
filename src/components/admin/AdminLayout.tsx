import { ReactNode, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  SidebarProvider, Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarTrigger, useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { apiService } from "@/lib/api";
import {
  LayoutDashboard, CalendarDays, Users, Star, MessageSquare, BookOpen,
  Home as HomeIcon, Settings, Briefcase, Eye, FileText, Settings2, ChevronLeft, User, LogOut
} from "lucide-react";
import logo from "@/assets/logo.jpeg";
import { NotificationBell } from "@/components/NotificationBell";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const allItems = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/admin/appointments", label: "Appointments", icon: CalendarDays },
  { to: "/admin/reviews", label: "Reviews", icon: Star },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/services", label: "Services", icon: Briefcase },
  { to: "/admin/screenings", label: "Eye Screenings", icon: Eye },
  { to: "/admin/notifications", label: "Notifications", icon: MessageSquare },
  { to: "/admin/sms", label: "SMS Management", icon: MessageSquare },
  { to: "/admin/chatbot", label: "Chatbot KB", icon: BookOpen },
  { to: "/admin/cms", label: "Website CMS", icon: FileText },
  { to: "/admin/settings", label: "Settings", icon: Settings2 },
];

const AdminSidebarInner = () => {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

  return (
    <Sidebar collapsible="icon" className="border-r border-border bg-white">
      <SidebarContent className="bg-white">
        <div className={`px-6 py-6 border-b border-border ${collapsed ? "px-2" : ""}`}>
          <Link to="/admin" className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg overflow-hidden shrink-0 border border-border">
              <img src={logo} alt="NOVA Logo" className="h-full w-full object-contain" />
            </div>
            {!collapsed && (
              <span className="text-xl font-bold tracking-tight text-foreground">NOVA Admin</span>
            )}
          </Link>
        </div>
        <SidebarGroup className="px-3 py-4">
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {allItems.map((it) => {
                const isActive = it.end ? location.pathname === it.to : location.pathname.startsWith(it.to);
                return (
                  <SidebarMenuItem key={it.to}>
                    <SidebarMenuButton asChild className="h-12 rounded-lg">
                      <NavLink
                        to={it.to}
                        end={it.end}
                        className={`flex items-center gap-3 px-4 w-full transition-colors ${
                          isActive 
                            ? "bg-primary text-white" 
                            : "text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        <it.icon className={`h-5 w-5 shrink-0 ${isActive ? "text-white" : "text-primary"}`} />
                        {!collapsed && <span className="font-semibold text-[15px]">{it.label}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};

interface AdminLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export const AdminLayout = ({ children, title, subtitle }: AdminLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const signOut = () => {
    apiService.auth.logout();
    navigate("/admin/login", { replace: true });
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-slate-50">
        <AdminSidebarInner />

        <div className="flex-1 flex flex-col min-w-0">
          {/* Topbar */}
          <header className="h-16 sticky top-0 z-30 border-b border-border bg-white flex items-center justify-between px-6 shadow-sm">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="h-9 w-9 border border-border rounded-md hover:bg-muted transition-colors" />
              <div className="h-6 w-[1px] bg-border hidden sm:block" />
              <span className="hidden sm:block text-sm font-medium text-muted-foreground">Nova Eye Care Administration</span>
            </div>
            
            <div className="flex items-center gap-3">
              <NotificationBell audience="admin" />
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="h-10 px-3 flex items-center gap-2 rounded-lg border-border hover:bg-muted transition-colors">
                    <User className="h-4 w-4 text-primary" />
                    <span className="hidden sm:block text-sm font-semibold">Administrator</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 p-1 rounded-lg shadow-lg border-border">
                  <DropdownMenuLabel className="px-3 py-2 text-xs font-bold text-muted-foreground uppercase">
                    Account Actions
                  </DropdownMenuLabel>
                  <DropdownMenuItem asChild className="cursor-pointer focus:bg-muted py-2 px-3 rounded-md">
                    <Link to="/" className="flex items-center w-full gap-2">
                      <HomeIcon className="h-4 w-4" />
                      <span className="text-sm font-medium">View Website</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer focus:bg-muted py-2 px-3 rounded-md">
                    <Link to="/admin/settings" className="flex items-center w-full gap-2">
                      <Settings className="h-4 w-4" />
                      <span className="text-sm font-medium">Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="my-1" />
                  <DropdownMenuItem 
                    onClick={signOut}
                    className="cursor-pointer focus:bg-red-50 text-red-600 focus:text-red-700 font-medium py-2 px-3 rounded-md flex items-center gap-2"
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="text-sm">Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          <main className="flex-1 p-6 lg:p-10">
            <div className="max-w-6xl mx-auto">
              <div className="mb-8">
                {location.pathname !== "/admin" && (
                  <Button 
                    variant="link" 
                    size="sm" 
                    className="p-0 h-auto text-primary mb-4 flex items-center gap-1 hover:no-underline font-semibold"
                    onClick={() => navigate("/admin")}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Back to Dashboard
                  </Button>
                )}
                <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">{title}</h1>
                {subtitle && <p className="text-lg text-slate-500 mt-2 font-medium">{subtitle}</p>}
              </div>
              
              <div className="animate-fade-in">
                {children}
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};
