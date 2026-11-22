import { Link, useLocation } from "react-router-dom";
import BrandLogo from "./BrandLogo";
import { useAuth } from "../features/auth/AuthContext";
import { CalendarCheck, CheckSquare, FileText, User } from "lucide-react";

export default function CaregiverNav() {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const pathname = location.pathname;

  const caregiverSections = [
    {
      to: "/app/caregiver",
      label: "Today",
      icon: CalendarCheck,
      isActive: pathname === "/app/caregiver",
    },
    {
      to: "/app/caregiver/tasks",
      label: "My Tasks",
      icon: CheckSquare,
      isActive: pathname === "/app/caregiver/tasks",
    },
    {
      to: "/app/caregiver/activity",
      label: "Updates",
      icon: FileText,
      isActive:
        pathname === "/app/caregiver/activity" ||
        pathname === "/app/caregiver/handover" ||
        pathname === "/app/caregiver/shifts",
    },
    {
      to: "/app/caregiver/profile",
      label: "Profile",
      icon: User,
      isActive: pathname === "/app/caregiver/profile",
    },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-sage/60 bg-ivory/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <Link to="/app/caregiver" className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest rounded">
            <BrandLogo size="sm" />
          </Link>
          <span className="rounded-full bg-forest/10 px-2.5 py-0.5 text-xs font-semibold text-forest">
            Caregiver Mode
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs sm:text-sm">
          <span className="hidden sm:inline font-medium text-charcoal">
            {user?.full_name?.split(" ")[0] || "Caregiver"}
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

      <nav aria-label="Caregiver Navigation" className="border-t border-sage/40 bg-white/70">
        <div className="mx-auto flex max-w-5xl items-center justify-around sm:justify-start sm:gap-2 px-2 py-1 sm:px-6">
          {caregiverSections.map((item) => {
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
