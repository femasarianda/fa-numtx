import { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { Icon } from "@iconify/react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const navItems = [
  { label: "Dashboard", path: "/dashboard", icon: "mdi:view-dashboard-outline" },
  { label: "Historical Report", path: "/historical-report", icon: "mdi:clipboard-text-outline" },
  { label: "Export Report", path: "/export-report", icon: "mdi:download-box-outline" },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const [logoutOpen, setLogoutOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-[220px] min-h-screen bg-card border-r border-border fixed left-0 top-0 z-30">
        <div className="flex items-center gap-2 px-5 pt-8 pb-16">
          <img
            src="https://res.cloudinary.com/dvdtjfcgg/image/upload/v1771552062/logo_dolan_sawah_e5ue30.jpg"
            alt="Logo"
            className="w-8 h-8 rounded-lg object-cover"
          />
          <span className="font-bold text-lg text-foreground">Fa-NumTX</span>
        </div>

        <div className="px-5 mb-6">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Menu</p>
          <div className="border-b border-border" />
        </div>

        <nav className="flex flex-col gap-4 px-3">
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <Icon icon={item.icon} className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 mt-16">
          <button
            onClick={() => setLogoutOpen(true)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors w-full"
          >
            <Icon icon="mdi:logout" className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 md:ml-[220px] pb-20 md:pb-0 min-h-screen">
        {/* Sticky Header */}
        <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border px-4 md:px-6 py-3 flex items-center gap-3">
          <div className="flex items-center gap-2 md:hidden">
            <img
              src="https://res.cloudinary.com/dvdtjfcgg/image/upload/v1771552062/logo_dolan_sawah_e5ue30.jpg"
              alt="Logo"
              className="w-7 h-7 rounded-lg object-cover"
            />
            <span className="font-bold text-foreground">Fa-NumTX</span>
          </div>
          <div className="hidden md:flex items-center">
            <span className="text-sm text-muted-foreground">
              {profile?.full_name || profile?.email || "User"}
            </span>
          </div>
        </div>
        {/* Main content with transition */}
        <div className="p-4 md:p-6 max-w-7xl mx-auto animate-in fade-in-0 duration-300">{children}</div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border flex items-center justify-around py-2 z-30">
        {navItems.map((item) => {
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-xs font-medium transition-colors",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon icon={item.icon} className="w-5 h-5" />
              <span className="truncate max-w-[70px]">{item.label.split(" ")[0]}</span>
            </Link>
          );
        })}
        <button
          onClick={() => setLogoutOpen(true)}
          className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-xs font-medium text-muted-foreground"
        >
          <Icon icon="mdi:logout" className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </nav>

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={logoutOpen} onOpenChange={setLogoutOpen}>
        <AlertDialogContent className="rounded-2xl max-w-xs">
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Logout</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin keluar dari akun ini?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Logout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
