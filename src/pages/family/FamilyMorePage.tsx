import { Link } from "react-router-dom";
import DemoRoleSwitcher from "../../components/DemoRoleSwitcher";
import FamilyNav from "../../components/FamilyNav";
import {
  CheckSquare,
  Activity,
  BellRing,
  Bell,
  Settings,
  ChevronRight,
  ShieldAlert,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "../../features/auth/AuthContext";
import { listTasks, listNotifications } from "../../lib/demoStore";

export default function FamilyMorePage() {
  const { family, elder } = useAuth();
  const familyId = family?.id ?? "demo-family-1";

  const pendingTasksCount = listTasks(familyId).filter((t) => t.status === "open").length;
  const unreadNotifsCount = listNotifications(familyId).filter((n) => !n.read_at).length;

  const moreSections = [
    {
      title: "Care Tasks & Responsibilities",
      subtitle: "Assign duties to family members and caregivers",
      to: "/app/family/tasks",
      icon: CheckSquare,
      badge: pendingTasksCount > 0 ? `${pendingTasksCount} pending` : undefined,
      badgeColor: "bg-coral/20 text-charcoal",
      tag: "Action items",
    },
    {
      title: "Care Pulse & Adherence",
      subtitle: "7-day wellness trends, caregiver attendance & med tracking",
      to: "/app/family/pulse",
      icon: Activity,
      badge: "Weekly report",
      badgeColor: "bg-sage/40 text-forest",
      tag: "Analytics",
    },
    {
      title: "Automations & Escalate Rules",
      subtitle: "Missed med alerts, caregiver check-in deadlines & reminders",
      to: "/app/family/reminders",
      icon: BellRing,
      badge: "Automated",
      badgeColor: "bg-forest/10 text-forest",
      tag: "Safeguards",
    },
    {
      title: "Notifications & Incident Log",
      subtitle: "Audit log of all system warnings, acknowledgments & updates",
      to: "/app/family/notifications",
      icon: Bell,
      badge: unreadNotifsCount > 0 ? `${unreadNotifsCount} new` : undefined,
      badgeColor: "bg-coral text-white font-bold",
      tag: "History",
    },
    {
      title: "Parent Profile & Care Information",
      subtitle: "Emergency contacts, address, doctor details & family permissions",
      to: "/app/family/profile",
      icon: Settings,
      badge: undefined,
      badgeColor: "",
      tag: "Configuration",
    },
  ];

  return (
    <div className="min-h-screen bg-ivory text-charcoal">
      <DemoRoleSwitcher />
      <FamilyNav />

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <header className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-forest/70">
            Family Coordination Hub
          </p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-bold text-forest">
            More Options & Settings
          </h1>
          <p className="mt-1 text-sm text-charcoal/70">
            Care tasks, weekly pulse analysis, automated reminders, and family settings for{" "}
            <span className="font-semibold text-charcoal">{elder?.display_name ?? "your parent"}</span>.
          </p>
        </header>

        {/* Essential Quick Cards */}
        <div className="grid gap-4 sm:grid-cols-2">
          {moreSections.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className="group relative flex flex-col justify-between rounded-2xl border border-sage/60 bg-white p-5 shadow-xs transition-all hover:border-forest/50 hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sage/30 text-forest group-hover:bg-forest group-hover:text-ivory transition-colors">
                      <Icon size={20} />
                    </div>
                    <div className="flex items-center gap-2">
                      {item.badge && (
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${item.badgeColor}`}
                        >
                          {item.badge}
                        </span>
                      )}
                      <span className="text-[11px] font-medium uppercase tracking-wide text-charcoal/40">
                        {item.tag}
                      </span>
                    </div>
                  </div>

                  <h2 className="mt-4 text-base font-bold text-charcoal group-hover:text-forest transition-colors">
                    {item.title}
                  </h2>
                  <p className="mt-1 text-xs sm:text-sm text-charcoal/70 leading-relaxed">
                    {item.subtitle}
                  </p>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-sage/30 pt-3 text-xs font-semibold text-forest">
                  <span>Open section</span>
                  <ArrowRight
                    size={14}
                    className="transform transition-transform group-hover:translate-x-1"
                  />
                </div>
              </Link>
            );
          })}
        </div>

        {/* Emergency & Escalation Support Card */}
        <div className="mt-8 rounded-2xl border border-coral/30 bg-coral/10 p-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-coral/20 text-charcoal">
                <ShieldAlert size={22} className="text-coral" />
              </div>
              <div>
                <h3 className="text-base font-bold text-charcoal">
                  Emergency Escalation Protocol
                </h3>
                <p className="text-xs sm:text-sm text-charcoal/80">
                  If your parent presses "Get Help" or misses critical insulin/cardiac doses, all family members receive instant SMS and voice calls.
                </p>
              </div>
            </div>
            <Link
              to="/app/family/profile"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-charcoal/20 bg-white px-3.5 py-2 text-xs font-semibold text-charcoal hover:bg-forest hover:text-ivory transition-colors shadow-xs"
            >
              <span>Manage Contacts</span>
              <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
