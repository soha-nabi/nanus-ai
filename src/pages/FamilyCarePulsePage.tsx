import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useAuth } from "../features/auth/AuthContext";
import FamilyNav from "../components/FamilyNav";
import DemoRoleSwitcher from "../components/DemoRoleSwitcher";
import {
  listTasks,
  listMedications,
  listShifts,
  listAppointments,
  listActivity,
  type TaskView,
} from "../lib/demoStore";
import type { Medication, CaregiverShift, Appointment, ActivityEvent } from "../lib/types";

export default function FamilyCarePulsePage() {
  const { family } = useAuth();

  const [tasks, setTasks] = useState<TaskView[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [shifts, setShifts] = useState<CaregiverShift[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [activity, setActivity] = useState<ActivityEvent[]>([]);

  const familyId = family?.id ?? null;

  useEffect(() => {
    if (!familyId) return;
    setTasks(listTasks(familyId));
    setMedications(listMedications(familyId));
    setShifts(listShifts(familyId));
    setAppointments(listAppointments(familyId));
    setActivity(listActivity(familyId));
  }, [familyId]);

  const completedTasks = tasks.filter((t) => t.status === "completed");
  const openTasks = tasks.filter((t) => t.status === "open");
  const overdueTasks = openTasks.filter((t) => t.is_overdue);
  const activeMedications = medications.filter((m) => m.status === "active");

  const today = new Date();
  const nextAppointments = appointments.filter(
    (a) => a.status === "scheduled" && new Date(a.scheduled_at) >= today
  );

  const completedShifts = shifts.filter((s) => s.status === "completed" || s.status === "checked_in");

  // Weekly coordination activity chart data (Mock/Calculated 7-day trend)
  const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const weeklyTaskData = daysOfWeek.map((day, idx) => ({
    name: day,
    Completed: [2, 3, 2, 4, 3, 2, 1][idx] + (idx === 6 ? completedTasks.length : 0),
    Pending: [1, 0, 1, 0, 1, 0, openTasks.length][idx],
    AssistedCare: [1, 2, 1, 2, 2, 1, 1][idx],
  }));

  // Medication confirmation adherence
  const medicationAdherenceData = [
    { day: "Day 1", confirmed: 100, caregiverAssisted: 100 },
    { day: "Day 2", confirmed: 100, caregiverAssisted: 100 },
    { day: "Day 3", confirmed: 100, caregiverAssisted: 90 },
    { day: "Day 4", confirmed: 90, caregiverAssisted: 95 },
    { day: "Day 5", confirmed: 100, caregiverAssisted: 100 },
    { day: "Day 6", confirmed: 95, caregiverAssisted: 95 },
    { day: "Today", confirmed: 85, caregiverAssisted: 100 },
  ];

  // Task breakdown by category for visual distribution
  const categoryCounts: Record<string, number> = {};
  tasks.forEach((t) => {
    categoryCounts[t.category] = (categoryCounts[t.category] || 0) + 1;
  });
  const taskCategoryData = Object.entries(categoryCounts).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
  }));
  if (taskCategoryData.length === 0) {
    taskCategoryData.push({ name: "General Care", value: 1 });
  }

  const PIE_COLORS = ["#193D32", "#B9C9B5", "#E58D78", "#5A7367", "#8C9D86"];

  const lastEvent = activity.length > 0 ? activity[activity.length - 1] : null;

  return (
    <div className="min-h-screen bg-ivory text-charcoal">
      <DemoRoleSwitcher />
      <FamilyNav />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-sage/60 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-forest animate-pulse" />
              <h1 className="font-serif text-3xl font-bold text-forest sm:text-4xl">
                Family Care Pulse
              </h1>
            </div>
            <p className="mt-2 text-sm sm:text-base text-charcoal/80 max-w-2xl leading-relaxed">
              Real-time operational visibility into parental care. Transparency without surveillance,
              measurable accountability without arbitrary scores.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/app/family/handover"
              className="rounded-lg bg-forest px-4 py-2 text-xs sm:text-sm font-semibold text-ivory hover:bg-forest/90 transition-colors shadow-sm"
            >
              Generate Care Handover
            </Link>
          </div>
        </div>

        {/* 10-SECOND FAMILY VIEW (Core Requirement) */}
        <section aria-labelledby="pulse-10sec-heading" className="mt-8 rounded-xl border-2 border-forest/30 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-sage/40 pb-3">
            <h2 id="pulse-10sec-heading" className="font-serif text-xl font-bold text-forest flex items-center gap-2">
              <span>The 10-Second Family Overview</span>
              <span className="rounded-full bg-forest/10 text-forest text-xs px-2.5 py-0.5 font-sans font-semibold">
                Daily Status
              </span>
            </h2>
            <span className="text-xs text-charcoal/60">
              Updated: {lastEvent ? new Date(lastEvent.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Live"}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5 text-sm">
            <div className="rounded-lg bg-ivory/80 p-3.5 border border-sage/40">
              <span className="text-xs font-semibold text-charcoal/70 uppercase tracking-wider block">
                What happened today?
              </span>
              <p className="mt-1 font-medium text-forest">
                {completedTasks.length > 0
                  ? `${completedTasks.length} task(s) done. Morning check-in confirmed.`
                  : "Morning walk & wellness check-in completed."}
              </p>
            </div>

            <div className="rounded-lg bg-ivory/80 p-3.5 border border-sage/40">
              <span className="text-xs font-semibold text-charcoal/70 uppercase tracking-wider block">
                Is anything pending?
              </span>
              <p className="mt-1 font-medium text-charcoal">
                {openTasks.length > 0
                  ? `${openTasks.length} pending task(s), including ${overdueTasks.length} overdue.`
                  : "All daily responsibilities up to date."}
              </p>
            </div>

            <div className="rounded-lg bg-ivory/80 p-3.5 border border-sage/40">
              <span className="text-xs font-semibold text-charcoal/70 uppercase tracking-wider block">
                Who is responsible?
              </span>
              <p className="mt-1 font-medium text-forest">
                Caregiver Ramesh Kumar on shift (09:00 - 17:00).
              </p>
            </div>

            <div className="rounded-lg bg-ivory/80 p-3.5 border border-sage/40">
              <span className="text-xs font-semibold text-coral uppercase tracking-wider block">
                What needs attention?
              </span>
              <p className="mt-1 font-medium text-charcoal">
                {overdueTasks.length > 0
                  ? overdueTasks[0].title
                  : "Upcoming cardiology review in 3 days."}
              </p>
            </div>

            <div className="rounded-lg bg-ivory/80 p-3.5 border border-sage/40">
              <span className="text-xs font-semibold text-charcoal/70 uppercase tracking-wider block">
                Last update
              </span>
              <p className="mt-1 font-medium text-charcoal">
                {lastEvent ? lastEvent.message : "Ramesh recorded morning BP log."}
              </p>
            </div>
          </div>
        </section>

        {/* KEY PULSE METRICS */}
        <section aria-label="Key Coordination Metrics" className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-sage/80 bg-white p-5 shadow-sm">
            <span className="text-xs font-semibold text-charcoal/70 uppercase tracking-wider">
              Care Tasks Completed
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-serif text-3xl font-bold text-forest sm:text-4xl">
                {completedTasks.length}
              </span>
              <span className="text-xs text-forest font-semibold">of {tasks.length} total</span>
            </div>
            <div className="mt-3 h-2 w-full rounded-full bg-sage/30 overflow-hidden">
              <div
                className="h-full bg-forest rounded-full"
                style={{ width: `${tasks.length ? (completedTasks.length / tasks.length) * 100 : 0}%` }}
              />
            </div>
          </div>

          <div className="rounded-xl border border-sage/80 bg-white p-5 shadow-sm">
            <span className="text-xs font-semibold text-charcoal/70 uppercase tracking-wider">
              Pending / Overdue
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-serif text-3xl font-bold text-coral sm:text-4xl">
                {openTasks.length}
              </span>
              {overdueTasks.length > 0 && (
                <span className="text-xs font-bold text-coral">({overdueTasks.length} overdue)</span>
              )}
            </div>
            <p className="mt-3 text-xs text-charcoal/70">
              {overdueTasks.length > 0 ? "Escalation rules active" : "Within scheduled grace period"}
            </p>
          </div>

          <div className="rounded-xl border border-sage/80 bg-white p-5 shadow-sm">
            <span className="text-xs font-semibold text-charcoal/70 uppercase tracking-wider">
              Active Medications
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-serif text-3xl font-bold text-forest sm:text-4xl">
                {activeMedications.length}
              </span>
              <span className="text-xs text-charcoal/60">prescribed</span>
            </div>
            <p className="mt-3 text-xs text-charcoal/70">
              Independent parent confirmation tracked
            </p>
          </div>

          <div className="rounded-xl border border-sage/80 bg-white p-5 shadow-sm">
            <span className="text-xs font-semibold text-charcoal/70 uppercase tracking-wider">
              Caregiver Attendance
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-serif text-3xl font-bold text-forest sm:text-4xl">
                100%
              </span>
              <span className="text-xs text-forest font-semibold">Punctual</span>
            </div>
            <p className="mt-3 text-xs text-charcoal/70">
              {completedShifts.length} shift(s) verified with consent
            </p>
          </div>
        </section>

        {/* VISUAL CHARTS SECTION */}
        <section className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Chart 1: Weekly Coordination Volume */}
          <div className="rounded-xl border border-sage bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-sage/40 pb-3">
              <div>
                <h3 className="font-serif text-lg font-bold text-forest">
                  Weekly Care Coordination Volume
                </h3>
                <p className="text-xs text-charcoal/70">
                  Completed responsibilities vs pending actions across the past 7 days
                </p>
              </div>
            </div>

            <div className="mt-6 h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyTaskData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#202722" fontSize={12} tickLine={false} />
                  <YAxis stroke="#202722" fontSize={12} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#F7F5EF",
                      borderColor: "#B9C9B5",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                  <Bar dataKey="Completed" fill="#193D32" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Pending" fill="#E58D78" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="AssistedCare" fill="#B9C9B5" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Medication Adherence Trend */}
          <div className="rounded-xl border border-sage bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-sage/40 pb-3">
              <div>
                <h3 className="font-serif text-lg font-bold text-forest">
                  Medication Dual Confirmation Trend (%)
                </h3>
                <p className="text-xs text-charcoal/70">
                  Parent confirmation adherence & caregiver assistance logs
                </p>
              </div>
            </div>

            <div className="mt-6 h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={medicationAdherenceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="day" stroke="#202722" fontSize={12} tickLine={false} />
                  <YAxis domain={[50, 100]} stroke="#202722" fontSize={12} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#F7F5EF",
                      borderColor: "#B9C9B5",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                  <Area
                    type="monotone"
                    dataKey="confirmed"
                    name="Parent Confirmed"
                    stroke="#193D32"
                    fill="#193D32"
                    fillOpacity={0.15}
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="caregiverAssisted"
                    name="Caregiver Assisted"
                    stroke="#B9C9B5"
                    fill="#B9C9B5"
                    fillOpacity={0.25}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* BOTTOM SECTION: TASK CATEGORIES & UPCOMING APPOINTMENTS */}
        <section className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Distribution by Category */}
          <div className="rounded-xl border border-sage bg-white p-6 shadow-sm lg:col-span-1">
            <h3 className="font-serif text-lg font-bold text-forest border-b border-sage/40 pb-3">
              Care Task Categories
            </h3>
            <div className="mt-4 h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={taskCategoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {taskCategoryData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#F7F5EF",
                      borderColor: "#B9C9B5",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 space-y-1 text-xs">
              {taskCategoryData.map((item, idx) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                    />
                    <span>{item.name}</span>
                  </div>
                  <span className="font-semibold text-forest">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Care Calendar */}
          <div className="rounded-xl border border-sage bg-white p-6 shadow-sm lg:col-span-2">
            <div className="flex items-center justify-between border-b border-sage/40 pb-3">
              <h3 className="font-serif text-lg font-bold text-forest">
                Upcoming Healthcare Schedule & Milestones
              </h3>
              <Link
                to="/app/family/appointments"
                className="text-xs font-semibold text-forest hover:underline"
              >
                View all appointments →
              </Link>
            </div>

            <div className="mt-4 space-y-3">
              {nextAppointments.length === 0 ? (
                <p className="text-sm text-charcoal/70 py-4">No upcoming appointments scheduled.</p>
              ) : (
                nextAppointments.map((apt) => (
                  <div
                    key={apt.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between rounded-lg border border-sage/60 bg-ivory/50 p-4 gap-2"
                  >
                    <div>
                      <p className="font-semibold text-forest text-base">{apt.title}</p>
                      <p className="text-xs text-charcoal/80">
                        {apt.provider} • {apt.location}
                      </p>
                      {apt.notes && <p className="text-xs text-charcoal/60 mt-1 italic">{apt.notes}</p>}
                    </div>

                    <div className="text-left sm:text-right shrink-0">
                      <span className="inline-block rounded bg-forest/10 px-2 py-1 text-xs font-semibold text-forest">
                        {new Date(apt.scheduled_at).toLocaleDateString([], {
                          month: "short",
                          day: "numeric",
                          weekday: "short",
                        })}{" "}
                        at{" "}
                        {new Date(apt.scheduled_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
