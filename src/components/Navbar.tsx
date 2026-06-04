import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Menu, X, LogOut, User, LayoutDashboard, ChevronDown, ShieldCheck } from "lucide-react";
import logo from "@/assets/logo.jpeg";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { apiService } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationBell } from "@/components/NotificationBell";

const links = [
  { to: "/", label: "Home" },
  { to: "/services", label: "Services" },
  { to: "/about", label: "About" },
  { to: "/dvla", label: "DVLA Test" },
  { to: "/reviews", label: "Reviews" },
  { to: "/contact", label: "Contact" },
];

export const Navbar = () => {
  const [open, setOpen] = useState(false);
  const { session, refresh, isAdmin } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => { setOpen(false); }, [location.pathname]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const handleLogout = async () => {
    try {
      apiService.auth.logout();
      await refresh();
      toast.success("Signed out successfully");
      navigate("/");
    } catch (error) {
      toast.error("Error signing out");
    }
  };

  return (
    <header 
      className={`sticky top-0 z-50 w-full transition-all duration-500 ${
        scrolled 
          ? "border-b border-border/60 bg-white/95 backdrop-blur-xl py-3 shadow-md" 
          : "bg-white/80 backdrop-blur-md py-5 border-b border-border/10 shadow-sm"
      }`}
    >
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-3 group">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-white shadow-card group-hover:shadow-glow transition-all duration-500 border border-border/10"
          >
            <img src={logo} alt="NOVA Eye Care Logo" className="h-full w-full object-contain" />
          </motion.div>
          <div className="flex flex-col -space-y-1">
            <span className="text-xl md:text-2xl font-bold tracking-tight">
              <span className="text-primary italic">NOVA</span> <span className="text-foreground font-semibold">Eye Care</span>
            </span>
            <span className="text-[10px] md:text-[12px] uppercase tracking-[0.2em] font-bold text-muted-foreground/80 pl-0.5">Services</span>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-1.5">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === "/"}
              className={({ isActive }) =>
                `px-4 py-2 text-sm font-bold rounded-xl transition-all duration-300 relative group ${
                  isActive ? "text-primary bg-primary-soft shadow-inner" : "text-foreground/75 hover:text-primary hover:bg-primary-soft"
                }`
              }
            >
              {l.label}
              <motion.div 
                className="absolute bottom-1 left-1/2 -translate-x-1/2 h-0.5 bg-primary rounded-full" 
                initial={{ width: 0 }}
                whileHover={{ width: "40%" }}
              />
            </NavLink>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-3">
          {session && (
            <div className="mr-1">
              <NotificationBell audience="user" />
            </div>
          )}
          {session ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="font-bold hover:bg-primary-soft text-foreground/80 flex items-center gap-2 px-4 rounded-xl">
                  <User className="h-4 w-4 text-primary" />
                  <span>Account</span>
                  <ChevronDown className="h-3 w-3 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 p-2 rounded-xl shadow-elegant border-border/40 backdrop-blur bg-card/95">
                <DropdownMenuLabel className="px-2 py-1.5 text-xs text-muted-foreground font-normal">
                  Manage Account
                </DropdownMenuLabel>
                {isAdmin && (
                  <DropdownMenuItem asChild className="rounded-lg cursor-pointer focus:bg-primary-soft">
                    <Link to="/admin" className="flex items-center w-full">
                      <ShieldCheck className="mr-2 h-4 w-4 text-primary" />
                      <span className="font-bold text-primary">Admin Dashboard</span>
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem asChild className="rounded-lg cursor-pointer focus:bg-primary-soft">
                  <Link to="/dashboard" className="flex items-center w-full">
                    <LayoutDashboard className="mr-2 h-4 w-4 text-primary" />
                    <span>Patient Portal</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="rounded-lg cursor-pointer focus:bg-primary-soft">
                  <Link to="/profile" className="flex items-center w-full">
                    <User className="mr-2 h-4 w-4 text-primary" />
                    <span>My Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-2 bg-border/40" />
                <DropdownMenuItem 
                  onClick={handleLogout}
                  className="rounded-lg cursor-pointer focus:bg-red-50 text-red-600 focus:text-red-700 font-medium"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild variant="ghost" className="font-bold hover:bg-primary-soft text-foreground/80 rounded-xl px-4">
              <Link to="/login">Sign in</Link>
            </Button>
          )}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button asChild className="rounded-xl px-7 font-bold shadow-lg shadow-primary/20 bg-primary text-white hover:bg-primary/90"><Link to="/book">Book Now</Link></Button>
          </motion.div>
        </div>

        <button
          className="lg:hidden p-3 rounded-xl hover:bg-primary-soft transition-colors border border-border/40 bg-background/50 shadow-sm"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          <AnimatePresence mode="wait">
            {open ? (
              <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
                <X className="h-7 w-7 text-primary" />
              </motion.div>
            ) : (
              <motion.div key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
                <Menu className="h-7 w-7 text-foreground" />
              </motion.div>
            )}
          </AnimatePresence>
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="lg:hidden border-t border-border bg-background/95 backdrop-blur-xl overflow-y-auto max-h-[calc(100vh-4.5rem)] shadow-lg"
          >
            <motion.div 
              initial="hidden"
              animate="show"
              variants={{
                show: { transition: { staggerChildren: 0.05 } }
              }}
              className="container py-6 flex flex-col gap-1.5"
            >
              {links.map((l) => (
                <motion.div key={l.to} variants={{ hidden: { x: -20, opacity: 0 }, show: { x: 0, opacity: 1 } }}>
                  <NavLink
                    to={l.to}
                    end={l.to === "/"}
                    onClick={() => setOpen(false)}
                    className={({ isActive }) =>
                      `block w-full px-4 py-3 text-base font-bold rounded-xl transition-all duration-300 ${
                        isActive ? "text-primary bg-primary-soft shadow-inner" : "text-foreground/80 hover:bg-primary-soft"
                      }`
                    }
                  >
                    {l.label}
                  </NavLink>
                </motion.div>
              ))}
              <motion.div variants={{ hidden: { y: 20, opacity: 0 }, show: { y: 0, opacity: 1 } }} className="flex flex-col gap-3 pt-4 border-t border-border/40 mt-2">
                {session ? (
                  <>
                    {isAdmin && (
                      <Button asChild variant="outline" className="w-full rounded-xl h-12 font-bold justify-start px-5 bg-primary/5 border-primary/20" onClick={() => setOpen(false)}>
                        <Link to="/admin" className="flex items-center">
                          <ShieldCheck className="mr-2 h-4 w-4 text-primary" />
                          Admin Dashboard
                        </Link>
                      </Button>
                    )}
                    <Button asChild variant="outline" className="w-full rounded-xl h-12 font-bold justify-start px-5" onClick={() => setOpen(false)}>
                      <Link to="/dashboard" className="flex items-center">
                        <LayoutDashboard className="mr-2 h-4 w-4 text-primary" />
                        Patient Portal
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="w-full rounded-xl h-12 font-bold justify-start px-5" onClick={() => setOpen(false)}>
                      <Link to="/profile" className="flex items-center">
                        <User className="mr-2 h-4 w-4 text-primary" />
                        My Profile
                      </Link>
                    </Button>
                    <div className="px-4 py-2.5 border-y border-border/40 bg-muted/20 rounded-xl my-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Alerts</span>
                        <NotificationBell audience="user" />
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      className="w-full rounded-xl h-12 font-bold justify-start px-5 text-red-600 hover:text-red-700 hover:bg-red-50" 
                      onClick={() => { handleLogout(); setOpen(false); }}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <Button asChild variant="outline" className="w-full rounded-xl h-12 font-bold" onClick={() => setOpen(false)}>
                    <Link to="/login">Sign in</Link>
                  </Button>
                )}
                <Button asChild className="w-full rounded-xl h-12 font-bold shadow-lg shadow-primary/20 bg-primary text-white hover:bg-primary/90" onClick={() => setOpen(false)}>
                  <Link to="/book">Book Now</Link>
                </Button>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
