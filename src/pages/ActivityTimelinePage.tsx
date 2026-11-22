import { useMemo } from "react";
import { useAuth } from "../features/auth/AuthContext";
import { listActivity } from "../lib/demoStore";
import type { ActivityEvent } from "../lib/types";

interface DayGroup {
  key: string;
  label: string;
  events: ActivityEvent[];
}

/** Local calendar date key (YYYY-MM-DD), so grouping follows the user's timezone. */
function localDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function groupByDay(events: ActivityEvent[]): DayGroup[] {
  const groups: DayGroup[] = [];
  const byKey = new Map<string, DayGroup>();
  for (const event of events) {
    const date = new Date(event.created_at);
    if (Number.isNaN(date.getTime())) continue;
    const key = localDateKey(date);
    let group = byKey.get(key);
    if (!group) {
      group = {
        key,
        label: date.toLocaleDateString(undefined, {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        events: [],
      };
      byKey.set(key, group);
      groups.push(group);
    }
    group.events.push(event);
  }
  return groups;
}

function formatTime(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

export default function ActivityTimelinePage() {
  const { family, isDemo } = useAuth();
  const familyId = family?.id ?? null;

  // listActivity returns newest first, so groups and their entries keep that order.
  const groups = useMemo(() => groupByDay(familyId ? listActivity(familyId) : []), [familyId]);

  if (!family) {
    return (
      <main className="min-h-screen bg-ivory px-4 py-10 text-charcoal">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-3xl font-bold text-forest sm:text-4xl">Activity timeline</h1>
          <p className="mt-4 text-lg leading-relaxed">Create or join a family to see its activity.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-ivory px-4 py-10 text-charcoal">
      <div className="mx-auto max-w-3xl space-y-10">
        <header>
          <h1 className="text-3xl font-bold text-forest sm:text-4xl">Activity timeline</h1>
          <p className="mt-2 text-lg leading-relaxed">{family.name}</p>
          {isDemo && (
            <p className="mt-4 rounded-lg border border-sage bg-white p-4 text-base">
              Demo mode — data is stored only in this browser.
            </p>
          )}
        </header>

        {groups.length === 0 ? (
          <p className="rounded-lg border border-sage bg-white p-4 text-base">No activity recorded yet.</p>
        ) : (
          groups.map((group) => (
            <section key={group.key} aria-labelledby={`day-${group.key}`} className="space-y-4">
              <h2 id={`day-${group.key}`} className="text-2xl font-semibold text-forest">
                {group.label}
              </h2>
              <ol className="space-y-3">
                {group.events.map((event) => (
                  <li key={event.id} className="flex flex-col gap-1 rounded-lg border border-sage bg-white p-4 sm:flex-row sm:gap-4">
                    <time dateTime={event.created_at} className="min-w-20 text-base font-semibold text-forest">
                      {formatTime(event.created_at)}
                    </time>
                    <p className="text-base break-words">{event.message}</p>
                  </li>
                ))}
              </ol>
            </section>
          ))
        )}
      </div>
    </main>
  );
}
