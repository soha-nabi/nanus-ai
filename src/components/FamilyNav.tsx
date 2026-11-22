import { Link, useLocation } from "react-router-dom";
import BrandLogo from "./BrandLogo";
import { useAuth } from "../features/auth/AuthContext";
import { Home, HeartPulse, Users, MessageSquareQuote, MoreHorizontal } from "lucide-react";

export default function FamilyNav() {
  const location = useLocation();
  const { user, elder, signOut } = useAuth();
  const pathname = location.pathname;

  // 5 Intuitive Navigation Sections (Core Requirement)
  const navSections = [
    {
      to: "/app/family",
      label: "Home",
      icon: Home,
      isActive: pathname === "/app/family",
    },
    {
      to: "/app/family/health",
      label: "Parent's Health",
      icon: HeartPulse,
      isActive:
        pathname === "/app/family/health" ||
        pathname.startsWith("/app/family/medication") ||
        pathname.startsWith("/app/family/appointments") ||
        pathname.startsWith("/app/family/documents"),
    },
    {
      to: "/app/family/caregivers",
      label: "Care Team",
      icon: Users,
      isActive:
        pathname === "/app/family/caregivers" ||
        pathname.startsWith("/app/family/members"),
    },
    {
      to: "/app/family/updates",
      label: "Updates",
      icon: MessageSquareQuote,
      isActive:
        pathname === "/app/family/updates" ||
        pathname.startsWith("/app/family/journal") ||
        pathname.startsWith("/app/family/handover") ||
        pathname.startsWith("/app/family/timeline"),
    },
    {
      to: "/app/family/more",
      label: "More",
      icon: MoreHorizontal,
      isActive:
        pathname === "/app/family/more" ||
        pathname.startsWith("/app/family/pulse") ||
        pathname.startsWith("/app/family/tasks") ||
        pathname.startsWith("/app/family/reminders") ||
        pathname.startsWith("/app/family/notifications") ||
        pathname.startsWith("/app/family/profile"),
    },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-sage/60 bg-ivory/95 backdrop-blur-md">
      {/* Top tier: Brand, Care Recipient Indicator & Profile */}
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <Link
            to="/app/family"
            className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest rounded transition-transform hover:opacity-95"
            aria-label="Nanu's AI Family Home"
          >
            <BrandLogo size="sm" />
          </Link>

          {elder && (
            <div className="hidden sm:flex items-center gap-2 rounded-full border border-sage/80 bg-white/80 px-3 py-1 text-xs text-charcoal shadow-xs">
              <span className="h-2 w-2 rounded-full bg-forest animate-pulse" />
              <span className="text-charcoal/70">Care for:</span>
              <strong className="text-forest font-semibold">{elder.display_name}</strong>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 text-xs sm:text-sm">
          <span className="hidden md:inline font-medium text-charcoal/80">
            {user?.full_name?.split(" ")[0] || user?.email}
          </span>
          <button
            type="button"
            onClick={() => signOut()}
            className="rounded-lg border border-forest/20 bg-white px-3 py-1.5 text-xs font-medium text-forest hover:bg-forest hover:text-ivory transition-colors shadow-xs"
          >
            Sign out
          </button>
        </div>
      </div>

      {/* 5-Section Navigation Bar */}
      <nav aria-label="Family Navigation" className="border-t border-sage/40 bg-white/70">
        <div className="mx-auto flex max-w-5xl items-center justify-around sm:justify-start sm:gap-2 px-2 py-1 sm:px-6">
          {navSections.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs sm:text-sm font-medium transition-all ${
                  item.isActive
                    ? "bg-forest text-ivory font-semibold shadow-xs"
                    : "text-charcoal/70 hover:bg-sage/30 hover:text-forest"
                }`}
              >
                <Icon size={16} className={item.isActive ? "text-sage" : "text-charcoal/60"} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
