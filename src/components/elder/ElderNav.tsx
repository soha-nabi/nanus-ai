import { NavLink } from "react-router-dom";
import { HeartHandshake, Home, LifeBuoy, Pill, type LucideIcon } from "lucide-react";

interface ElderNavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

const ITEMS: ElderNavItem[] = [
  { to: "/app/elder", label: "Home", icon: Home, end: true },
  { to: "/app/elder/medicines", label: "Medicines", icon: Pill },
  { to: "/app/elder/checkin", label: "Check in", icon: HeartHandshake },
  { to: "/app/elder/emergency", label: "Help", icon: LifeBuoy },
];

export default function ElderNav() {
  return (
    <nav
      aria-label="Elder navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-charcoal bg-ivory"
    >
      <ul className="mx-auto grid max-w-3xl grid-cols-4">
        {ITEMS.map(({ to, label, icon: Icon, end }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex min-h-16 flex-col items-center justify-center gap-1 px-1 py-2 text-center text-xl font-semibold focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-forest ${
                  isActive ? "bg-forest text-ivory" : "text-charcoal hover:bg-sage"
                }`
              }
            >
              <Icon aria-hidden="true" size={28} />
              <span>{label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
