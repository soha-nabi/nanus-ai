import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../features/auth/AuthContext";
import FamilyNav from "../components/FamilyNav";
import DemoRoleSwitcher from "../components/DemoRoleSwitcher";
import {
  listActivity,
  listAppointments,
  listMedications,
  listMedicationEvents,
  listShifts,
  listTasks,
  listWellnessCheckins,
  type TaskView,
} from "../lib/demoStore";
import type {
  ActivityEvent,
  Appointment,
  CaregiverShift,
  Medication,
  MedicationEvent,
  WellnessCheckin,
} from "../lib/types";
import {
  Heart,
  Pill,
  UserCheck,
  AlertTriangle,
  Calendar,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  Clock,
} from "lucide-react";

export default function FamilyDashboardPage() {
  const { user, family, elder } = useAuth();
  const [tasks, setTasks] = useState<TaskView[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [medEvents, setMedEvents] = useState<MedicationEvent[]>([]);
  const [shifts, setShifts] = useState<CaregiverShift[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [checkins, setCheckins] = useState<WellnessCheckin[]>([]);
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const [showActivity, setShowActivity] = useState(false);

  const familyId = family?.id ?? null;

  useEffect(() => {
    if (!familyId) return;
    setTasks(listTasks(familyId));
    setMedications(listMedications(familyId));
    setMedEvents(listMedicationEvents(familyId));
    setShifts(listShifts(familyId));
    setAppointments(listAppointments(familyId));
    setCheckins(listWellnessCheckins(familyId));
    setActivity(listActivity(familyId));
  }, [familyId]);

  if (!family || !user) {
    return (
      <main className="min-h-screen bg-ivory px-4 py-10 text-charcoal">
        <div className="mx-auto max-w-xl text-center space-y-4">
          <h1 className="font-serif text-3xl font-bold text-forest">Welcome to Nanu&apos;s AI</h1>
          <p className="text-base text-charcoal/80">Please sign in or create a family space to begin.</p>
          <Link
            to="/app/setup"
            className="inline-block rounded-lg bg-forest px-6 py-2.5 text-sm font-semibold text-ivory hover:bg-forest/90"
          >
            Set up Family Space
          </Link>
        </div>
      </main>
    );
  }

  // 1. How is my parent?
  const latestCheckin = checkins[0] || null;
  const isParentOk = latestCheckin?.status === "ok";
  const parentStatusText = latestCheckin
    ? latestCheckin.status === "ok"
      ? "Resting comfortably & in good spirits"
      : latestCheckin.status === "need_assistance"
        ? "Requested assistance"
        : "Requested family call"
    : "No check-in received today yet";

  // 2. Have medicines been confirmed?
  const activeMeds = medications.filter((m) => m.status === "active");
  const confirmedEvents = medEvents.filter((e) => e.parent_confirmation === "taken");
  const pendingEvents = medEvents.filter((e) => e.parent_confirmation === null);
  const totalDosesToday = activeMeds.reduce((acc, m) => acc + (m.scheduled_times?.length || 1), 0);
  const confirmedCount = confirmedEvents.length;

  // 3. Has the caregiver checked in?
  const todayShift = shifts.find((s) => s.status === "checked_in" || s.status === "scheduled") || shifts[0] || null;
  const isCaregiverActive = todayShift?.status === "checked_in";

  // 4. Does anything need my attention?
  const openTasks = tasks.filter((t) => t.status === "open");
  const overdueTasks = openTasks.filter((t) => t.is_overdue);
  const hasUrgentIssue = overdueTasks.length > 0 || pendingEvents.length > 0;

  // Next appointment
  const today = new Date();
  const nextAppointment = appointments.find(
    (a) => a.status === "scheduled" && new Date(a.scheduled_at) >= today
  ) || appointments[0] || null;

  const greetingName = user.full_name?.split(" ")[0] || "there";
  const elderDisplayName = elder?.display_name || "Parent";

  return (
    <div className="min-h-screen bg-ivory text-charcoal">
      <DemoRoleSwitcher />
      <FamilyNav />

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 space-y-8">
        {/* Warm Greeting Header */}
        <header className="space-y-1.5 border-b border-sage/40 pb-6">
          <p className="text-xs uppercase font-bold tracking-wider text-forest/80">
            Family Care Coordinator
          </p>
          <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2">
            <h1 className="font-serif text-3xl font-bold text-forest sm:text-4xl">
              Good day, {greetingName}
            </h1>
            <span className="text-xs text-charcoal/60">
              Coordinating care for <strong className="text-forest font-semibold">{elderDisplayName}</strong>
            </span>
          </div>
        </header>

        {/* THE FOUR IMMEDIATE QUESTIONS (Core UX Requirement) */}
        <section aria-labelledby="status-summary-heading" className="space-y-4">
          <h2 id="status-summary-heading" className="sr-only">
            Parent Status Summary
          </h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Card 1: How is my parent? */}
            <div className="rounded-2xl border border-sage/80 bg-white p-5 shadow-xs transition-shadow hover:shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-charcoal/60 flex items-center gap-1.5">
                  <Heart size={14} className="text-forest" />
                  <span>How is my parent?</span>
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${isParentOk ? "bg-sage/40 text-forest" : "bg-coral/20 text-charcoal"
                    }`}
                >
                  {isParentOk ? "Comfortable & Well" : "Needs Review"}
                </span>
              </div>

              <div>
                <p className="font-serif text-xl font-bold text-forest">{parentStatusText}</p>
                {latestCheckin?.notes && (
                  <p className="mt-1 text-xs text-charcoal/80 italic leading-relaxed">
                    &ldquo;{latestCheckin.notes}&rdquo;
                  </p>
                )}
              </div>

              <div className="pt-2 border-t border-sage/30 flex items-center justify-between text-xs text-charcoal/60">
                <span className="flex items-center gap-1">
                  <Clock size={12} />
                  <span>
                    {latestCheckin
                      ? `Checked in at ${new Date(latestCheckin.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}`
                      : "Awaiting morning check-in"}
                  </span>
                </span>
                <Link
                  to="/app/family/updates"
                  className="font-medium text-forest hover:underline flex items-center gap-0.5"
                >
                  Family notes <ChevronRight size={12} />
                </Link>
              </div>
            </div>

            {/* Card 2: Have medicines been confirmed? */}
            <div className="rounded-2xl border border-sage/80 bg-white p-5 shadow-xs transition-shadow hover:shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-charcoal/60 flex items-center gap-1.5">
                  <Pill size={14} className="text-forest" />
                  <span>Have medicines been confirmed?</span>
                </span>
                <span className="rounded-full bg-forest/10 px-2.5 py-0.5 text-xs font-bold text-forest">
                  {confirmedCount} of {totalDosesToday || 3} Confirmed
                </span>
              </div>

              <div>
                <p className="font-serif text-xl font-bold text-forest">
                  {pendingEvents.length === 0
                    ? "All scheduled medicines taken"
                    : "1 medicine awaiting confirmation"}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <span className="inline-flex items-center gap-1 rounded bg-sage/30 px-2 py-0.5 text-[11px] font-medium text-forest">
                    <span>✓</span> Morning (Telmisartan)
                  </span>
                  {pendingEvents.length > 0 ? (
                    <span className="inline-flex items-center gap-1 rounded bg-coral/20 px-2 py-0.5 text-[11px] font-bold text-charcoal">
                      <span>⚠️</span> Lunch dose pending
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded bg-ivory border border-sage px-2 py-0.5 text-[11px] font-medium text-charcoal/70">
                      <span>⏳</span> Bedtime scheduled
                    </span>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-sage/30 flex items-center justify-between text-xs text-charcoal/60">
                <span>Dual verification recorded</span>
                <Link
                  to="/app/family/health"
                  className="font-medium text-forest hover:underline flex items-center gap-0.5"
                >
                  View Health hub <ChevronRight size={12} />
                </Link>
              </div>
            </div>

            {/* Card 3: Has the caregiver checked in? */}
            <div className="rounded-2xl border border-sage/80 bg-white p-5 shadow-xs transition-shadow hover:shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-charcoal/60 flex items-center gap-1.5">
                  <UserCheck size={14} className="text-forest" />
                  <span>Has the caregiver checked in?</span>
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${isCaregiverActive
                    ? "bg-forest/10 text-forest font-bold"
                    : "bg-ivory border border-sage text-charcoal/70"
                    }`}
                >
                  {isCaregiverActive ? "🟢 On Shift Now" : "Shift Scheduled"}
                </span>
              </div>

              <div>
                <p className="font-serif text-xl font-bold text-forest">
                  {todayShift
                    ? isCaregiverActive
                      ? "Ramesh Kumar is currently on duty"
                      : "Ramesh Kumar scheduled for today"
                    : "No shift scheduled today"}
                </p>
                {todayShift?.shift_notes && (
                  <p className="mt-1 text-xs text-charcoal/80 leading-relaxed truncate">
                    &ldquo;{todayShift.shift_notes}&rdquo;
                  </p>
                )}
              </div>

              <div className="pt-2 border-t border-sage/30 flex items-center justify-between text-xs text-charcoal/60">
                <span>{todayShift?.check_in_at ? "Punctual check-in (09:05 AM)" : "09:00 - 17:00"}</span>
                <Link
                  to="/app/family/caregivers"
                  className="font-medium text-forest hover:underline flex items-center gap-0.5"
                >
                  Care Team <ChevronRight size={12} />
                </Link>
              </div>
            </div>

            {/* Card 4: Does anything need my attention? */}
            <div className="rounded-2xl border border-sage/80 bg-white p-5 shadow-xs transition-shadow hover:shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-charcoal/60 flex items-center gap-1.5">
                  <AlertTriangle size={14} className={hasUrgentIssue ? "text-coral" : "text-forest"} />
                  <span>Does anything need attention?</span>
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${hasUrgentIssue
                    ? "bg-coral/20 text-charcoal font-bold"
                    : "bg-sage/40 text-forest"
                    }`}
                >
                  {hasUrgentIssue ? `${overdueTasks.length} Attention Item` : "All Clear"}
                </span>
              </div>

              <div>
                {overdueTasks.length > 0 ? (
                  <>
                    <p className="font-serif text-lg font-bold text-charcoal">
                      {overdueTasks[0].title}
                    </p>
                    <p className="mt-1 text-xs text-coral font-semibold">
                      Refill needed to prevent therapy gap • Assigned to you
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-serif text-xl font-bold text-forest">
                      Everything is up to date
                    </p>
                    <p className="mt-1 text-xs text-charcoal/70">
                      No overdue tasks or missed check-ins requiring action.
                    </p>
                  </>
                )}
              </div>

              <div className="pt-2 border-t border-sage/30 flex items-center justify-between text-xs text-charcoal/60">
                <span>{openTasks.length} active responsibilities</span>
                <Link
                  to="/app/family/more"
                  className="font-medium text-forest hover:underline flex items-center gap-0.5"
                >
                  Open tasks <ChevronRight size={12} />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* 5. NEXT APPOINTMENT (Essential Highlight) */}
        {nextAppointment && (
          <section aria-labelledby="next-appointment-heading">
            <div className="rounded-2xl border border-sage/80 bg-white p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-forest flex items-center gap-1.5">
                  <Calendar size={14} />
                  <span>Next Healthcare Appointment</span>
                </span>
                <p className="font-serif text-lg font-bold text-forest">
                  {nextAppointment.title}
                </p>
                <p className="text-xs text-charcoal/70">
                  {nextAppointment.provider} • {nextAppointment.location}
                </p>
              </div>

              <div className="shrink-0 flex items-center gap-3">
                <div className="text-left sm:text-right">
                  <span className="block text-xs font-bold text-forest">
                    {new Date(nextAppointment.scheduled_at).toLocaleDateString([], {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                  <span className="block text-[11px] text-charcoal/60">
                    {new Date(nextAppointment.scheduled_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <Link
                  to="/app/family/health"
                  className="rounded-lg bg-forest/10 p-2 text-forest hover:bg-forest hover:text-ivory transition-colors"
                  aria-label="View Appointment details"
                >
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* PROGRESSIVE DISCLOSURE: RECENT ACTIVITY ACCORDION */}
        <section className="border-t border-sage/40 pt-4">
          <button
            type="button"
            onClick={() => setShowActivity(!showActivity)}
            className="w-full flex items-center justify-between py-2 text-left text-xs font-semibold uppercase tracking-wider text-charcoal/70 hover:text-forest transition-colors"
          >
            <span>Recent Activity Stream ({activity.length})</span>
            <ChevronDown
              size={16}
              className={`transition-transform duration-200 ${showActivity ? "rotate-180" : ""}`}
            />
          </button>

          {showActivity && (
            <div className="mt-3 space-y-2 rounded-xl border border-sage/60 bg-white/60 p-4">
              {activity.length === 0 ? (
                <p className="text-xs text-charcoal/60">No activity events recorded yet.</p>
              ) : (
                <ul className="space-y-2 text-xs divide-y divide-sage/20">
                  {activity.slice(0, 5).map((ev) => (
                    <li key={ev.id} className="pt-2 first:pt-0 flex items-start justify-between gap-3">
                      <p className="text-charcoal leading-relaxed">{ev.message}</p>
                      <time className="shrink-0 text-[10px] text-charcoal/50">
                        {new Date(ev.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </time>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
