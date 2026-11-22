import { NavLink } from "react-router-dom";
import { HeartHandshake, Pill, LifeBuoy, type LucideIcon } from "lucide-react";

interface ElderNavItem {
  to: string;
  label: string;
  labelHi: string;
  icon: LucideIcon;
  end?: boolean;
}

const ITEMS: ElderNavItem[] = [
  { to: "/app/elder", label: "I'm Okay", labelHi: "मैं ठीक हूँ", icon: HeartHandshake, end: true },
  { to: "/app/elder/medicines", label: "My Medicines", labelHi: "मेरी दवाइयाँ", icon: Pill },
  { to: "/app/elder/emergency", label: "Get Help", labelHi: "सहायता", icon: LifeBuoy },
];

export default function ElderNav() {
  return (
    <nav
      aria-label="Parent Navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-forest/30 bg-ivory shadow-lg"
    >
      <ul className="mx-auto grid max-w-2xl grid-cols-3">
        {ITEMS.map(({ to, label, icon: Icon, end }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex min-h-20 flex-col items-center justify-center gap-1.5 px-2 py-3 text-center transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-forest ${
                  isActive
                    ? "bg-forest text-ivory font-bold shadow-inner"
                    : "text-charcoal hover:bg-sage/40 font-semibold"
                } ${to === "/app/elder/emergency" && !isActive ? "text-coral font-bold" : ""}`
              }
            >
              <Icon aria-hidden="true" size={32} />
              <span className="text-lg sm:text-xl tracking-tight leading-tight">{label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
