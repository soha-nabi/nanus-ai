import { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { Link } from "react-router-dom";
import { useAuth } from "../features/auth/AuthContext";
import { listActivity, listMembers, listTasks, type MemberView, type TaskView } from "../lib/demoStore";
import type { ActivityEvent } from "../lib/types";

function memberLabel(m: MemberView): string {
  return m.full_name || m.email || "Unnamed member";
}

function isSameLocalDay(iso: string, reference: Date): boolean {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return false;
  return (
    date.getFullYear() === reference.getFullYear() &&
    date.getMonth() === reference.getMonth() &&
    date.getDate() === reference.getDate()
  );
}

function formatTime(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDateTime(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleString();
}

export default function FamilyDashboardPage() {
  const { user, family, elder, isDemo } = useAuth();
  const [tasks, setTasks] = useState<TaskView[]>([]);
  const [members, setMembers] = useState<MemberView[]>([]);
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const reduceMotion = useReducedMotion();

  const familyId = family?.id ?? null;

  useEffect(() => {
    if (!familyId) return;
    setTasks(listTasks(familyId));
    setMembers(listMembers(familyId));
    setActivity(listActivity(familyId));
  }, [familyId]);

  const nameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const m of members) map.set(m.user_id, memberLabel(m));
    return map;
  }, [members]);

  const openTasks = tasks.filter((t) => t.status === "open");
  const overdueTasks = openTasks.filter((t) => t.is_overdue);

  const today = new Date();
  const todaysActivity = activity
    .filter((e) => isSameLocalDay(e.created_at, today))
    .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));

  const lastUpdate = activity.reduce<string | null>((latest, e) => {
    if (latest === null) return e.created_at;
    return Date.parse(e.created_at) > Date.parse(latest) ? e.created_at : latest;
  }, null);

  if (!family || !user) {
    return (
      <main className="min-h-screen bg-ivory px-4 py-10 text-charcoal">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-3xl font-bold text-forest sm:text-4xl">Family dashboard</h1>
          <p className="mt-4 text-lg leading-relaxed">Create or join a family to see its dashboard.</p>
        </div>
      </main>
    );
  }

  const assigneeNameFor = (assignedTo: string | null): string => {
    if (!assignedTo) return "Unassigned";
    return nameById.get(assignedTo) ?? "Unknown member";
  };

  const container: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.08 } },
  };
  const item: Variants = {
    hidden: { opacity: 0, y: 8 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  const sectionClass = "space-y-4";
  const emptyClass = "rounded-lg border border-sage bg-white p-4 text-base";
  const linkClass =
    "inline-flex min-h-12 items-center rounded-lg bg-forest px-6 py-3 text-lg font-semibold text-ivory hover:bg-sage hover:text-charcoal";

  return (
    <main className="min-h-screen bg-ivory px-4 py-10 text-charcoal">
      <motion.div
        className="mx-auto max-w-3xl space-y-10"
        variants={container}
        initial={reduceMotion ? false : "hidden"}
        animate="visible"
      >
        <motion.header variants={reduceMotion ? undefined : item}>
          <h1 className="text-3xl font-bold text-forest sm:text-4xl">Family dashboard</h1>
          <p className="mt-2 text-lg leading-relaxed">{family.name}</p>
          {elder && <p className="mt-2 text-xl font-semibold">{elder.display_name}</p>}
          {isDemo && (
            <p className="mt-4 rounded-lg border border-sage bg-white p-4 text-base">
              Demo mode — data is stored only in this browser.
            </p>
          )}
          <nav aria-label="Family shortcuts" className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link to="/app/family/tasks" className={linkClass}>
              Care tasks
            </Link>
            <Link to="/app/family/members" className={linkClass}>
              Members and invitations
            </Link>
          </nav>
        </motion.header>

        <motion.section
          aria-labelledby="today-heading"
          className={sectionClass}
          variants={reduceMotion ? undefined : item}
        >
          <h2 id="today-heading" className="text-2xl font-semibold text-forest">
            What happened today?
          </h2>
          {todaysActivity.length === 0 ? (
            <p className={emptyClass}>No activity recorded today yet.</p>
          ) : (
            <ul className="space-y-3">
              {todaysActivity.map((event) => (
                <li key={event.id} className="rounded-lg border border-sage bg-white p-4 text-base">
                  <p className="font-semibold">
                    <time dateTime={event.created_at}>{formatTime(event.created_at)}</time>
                  </p>
                  <p className="break-words">{event.message}</p>
                </li>
              ))}
            </ul>
          )}
        </motion.section>

        <motion.section
          aria-labelledby="pending-heading"
          className={sectionClass}
          variants={reduceMotion ? undefined : item}
        >
          <h2 id="pending-heading" className="text-2xl font-semibold text-forest">
            Is anything pending?
          </h2>
          <p className={emptyClass}>
            {openTasks.length === 0
              ? "No open care tasks."
              : `${openTasks.length} open ${openTasks.length === 1 ? "care task" : "care tasks"}.`}
          </p>
        </motion.section>

        <motion.section
          aria-labelledby="responsible-heading"
          className={sectionClass}
          variants={reduceMotion ? undefined : item}
        >
          <h2 id="responsible-heading" className="text-2xl font-semibold text-forest">
            Who is responsible?
          </h2>
          {openTasks.length === 0 ? (
            <p className={emptyClass}>No open care tasks to assign.</p>
          ) : (
            <ul className="space-y-3">
              {openTasks.map((task) => (
                <li key={task.id} className="rounded-lg border border-sage bg-white p-4 text-base">
                  <span className="font-semibold break-words">{task.title}</span>
                  <span>: {assigneeNameFor(task.assigned_to)}</span>
                </li>
              ))}
            </ul>
          )}
        </motion.section>

        <motion.section
          aria-labelledby="attention-heading"
          className={sectionClass}
          variants={reduceMotion ? undefined : item}
        >
          <h2 id="attention-heading" className="text-2xl font-semibold text-forest">
            What needs attention?
          </h2>
          {overdueTasks.length === 0 ? (
            <p className={emptyClass}>Nothing overdue.</p>
          ) : (
            <ul className="space-y-3">
              {overdueTasks.map((task) => (
                <li key={task.id} className="space-y-2 rounded-lg border-2 border-coral bg-white p-4 text-base">
                  <p className="inline-flex items-center gap-2 font-semibold text-charcoal">
                    <span aria-hidden="true" className="inline-block h-3 w-3 rounded-full bg-coral" />
                    Overdue
                  </p>
                  <p className="break-words">{task.title}</p>
                  <p>Assignee: {assigneeNameFor(task.assigned_to)}</p>
                </li>
              ))}
            </ul>
          )}
        </motion.section>

        <motion.section
          aria-labelledby="last-update-heading"
          className={sectionClass}
          variants={reduceMotion ? undefined : item}
        >
          <h2 id="last-update-heading" className="text-2xl font-semibold text-forest">
            When was the last confirmed update?
          </h2>
          <p className={emptyClass}>
            {lastUpdate ? <time dateTime={lastUpdate}>{formatDateTime(lastUpdate)}</time> : "No updates recorded yet."}
          </p>
        </motion.section>
      </motion.div>
    </main>
  );
}
