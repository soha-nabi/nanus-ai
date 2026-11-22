import { Link, useLocation } from "react-router-dom";
import BrandLogo from "./BrandLogo";
import { useAuth } from "../features/auth/AuthContext";

export default function FamilyNav() {
  const location = useLocation();
  const { user, elder, signOut } = useAuth();

  const links = [
    { to: "/app/family", label: "Dashboard", badge: null },
    { to: "/app/family/pulse", label: "Care Pulse", badge: "Live" },
    { to: "/app/family/medication", label: "Medications", badge: null },
    { to: "/app/family/tasks", label: "Tasks", badge: null },
    { to: "/app/family/appointments", label: "Appointments", badge: null },
    { to: "/app/family/caregivers", label: "Caregivers", badge: null },
    { to: "/app/family/documents", label: "Documents", badge: null },
    { to: "/app/family/journal", label: "Family Journal", badge: null },
    { to: "/app/family/handover", label: "Handovers", badge: null },
    { to: "/app/family/notifications", label: "Alerts", badge: null },
    { to: "/app/family/reminders", label: "Rules", badge: null },
    { to: "/app/family/members", label: "Members", badge: null },
  ];

  return (
    <header className="border-b border-sage/60 bg-ivory">
      {/* Top tier: Brand, Elder indicator, and Profile / Sign out */}
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-4">
          <Link to="/app/family" className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest rounded">
            <BrandLogo size="md" />
          </Link>

          {elder && (
            <div className="hidden sm:flex items-center gap-2 rounded-full border border-sage bg-white px-3 py-1 text-xs">
              <span className="h-2 w-2 rounded-full bg-forest animate-pulse" />
              <span className="text-charcoal/70">Coordinating Care for:</span>
              <strong className="text-forest font-semibold">{elder.display_name}</strong>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 text-xs sm:text-sm">
          <span className="hidden md:inline font-medium text-charcoal">
            {user?.full_name || user?.email}
          </span>
          <button
            type="button"
            onClick={() => signOut()}
            className="rounded border border-forest/30 px-3 py-1.5 font-medium text-forest hover:bg-forest hover:text-ivory transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>

      {/* Sub tier: Horizontal scrolling tab navigation */}
      <nav aria-label="Family Navigation" className="border-t border-sage/40 bg-white/60 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto px-4 py-1.5 sm:px-6 no-scrollbar">
          {links.map((link) => {
            const isActive = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`relative shrink-0 rounded-md px-3 py-1.5 text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 ${
                  isActive
                    ? "bg-forest text-ivory shadow-sm"
                    : "text-charcoal/80 hover:bg-sage/40 hover:text-forest"
                }`}
              >
                <span>{link.label}</span>
                {link.badge && (
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold uppercase tracking-wider ${
                      isActive ? "bg-coral text-charcoal" : "bg-forest/10 text-forest"
                    }`}
                  >
                    {link.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
