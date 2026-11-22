import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../features/auth/AuthContext";
import { listNotifications, markNotificationRead, runAutomationPass } from "../lib/demoStore";
import type { Notification } from "../lib/types";

function errorMessage(err: unknown): string {
  return err instanceof Error && err.message ? err.message : "Something went wrong. Please try again.";
}

function formatDateTime(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleString();
}

function countText(n: number, noun: string): string {
  return `${n} ${n === 1 ? noun : `${noun}s`}`;
}

interface CheckSummary {
  created: number;
  skipped: number;
}

export default function NotificationsPage() {
  const { user, family, isDemo } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [summary, setSummary] = useState<CheckSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const familyId = family?.id ?? null;
  const userId = user?.id ?? null;

  // runCheck = true runs the automation pass first (creates any new notifications), then reloads the list.
  const load = useCallback(
    (runCheck: boolean) => {
      if (!familyId || !userId) return;
      try {
        if (runCheck) {
          const result = runAutomationPass(familyId, new Date());
          setSummary({ created: result.created, skipped: result.skipped_duplicates });
        }
        setNotifications(listNotifications(userId));
        setError(null);
      } catch (err) {
        setError(errorMessage(err));
      }
    },
    [familyId, userId],
  );

  useEffect(() => {
    load(true);
  }, [load]);

  if (!family || !user) {
    return (
      <main className="min-h-screen bg-ivory px-4 py-10 text-charcoal">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-3xl font-bold text-forest sm:text-4xl">Notifications</h1>
          <p className="mt-4 text-lg leading-relaxed">Create or join a family to see notifications.</p>
        </div>
      </main>
    );
  }

  const onMarkRead = (notificationId: string) => {
    try {
      markNotificationRead(notificationId, user.id);
      load(false);
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  const emptyClass = "rounded-lg border border-sage bg-white p-4 text-base";

  return (
    <main className="min-h-screen bg-ivory px-4 py-10 text-charcoal">
      <div className="mx-auto max-w-3xl space-y-10">
        <header>
          <h1 className="text-3xl font-bold text-forest sm:text-4xl">Notifications</h1>
          <p className="mt-2 text-lg leading-relaxed">{family.name}</p>
          {isDemo && (
            <p className="mt-4 rounded-lg border border-sage bg-white p-4 text-base">
              Demo mode — data is stored only in this browser.
            </p>
          )}
          <p className="mt-4 rounded-lg border border-sage bg-white p-4 text-base">
            Notifications are recorded in this app. Email and SMS delivery are not connected.
          </p>
        </header>

        {error && (
          <p role="alert" className="rounded-lg border border-forest bg-white p-4 text-base text-forest">
            {error}
          </p>
        )}

        <section aria-labelledby="check-heading" className="space-y-4">
          <h2 id="check-heading" className="text-2xl font-semibold text-forest">
            Updates
          </h2>
          <button
            type="button"
            onClick={() => load(true)}
            className="min-h-12 w-full rounded-lg bg-forest px-6 py-3 text-lg font-semibold text-ivory hover:bg-sage hover:text-charcoal sm:w-auto"
          >
            Check for updates
          </button>
          {summary && (
            <p role="status" className="text-lg">
              {`${countText(summary.created, "new notification")}, ${summary.skipped} already shown.`}
            </p>
          )}
        </section>

        <section aria-labelledby="list-heading" className="space-y-4">
          <h2 id="list-heading" className="text-2xl font-semibold text-forest">
            Your notifications
          </h2>
          {notifications.length === 0 ? (
            <p className={emptyClass}>No notifications yet.</p>
          ) : (
            <ul className="space-y-3">
              {notifications.map((n) => (
                <li
                  key={n.id}
                  className={`space-y-2 rounded-lg bg-white p-4 ${
                    n.read_at === null ? "border-2 border-forest" : "border border-sage"
                  }`}
                >
                  <p className="text-base font-semibold">{n.read_at === null ? "Unread" : "Read"}</p>
                  <p className="text-lg font-semibold break-words">{n.title}</p>
                  <p className="text-base break-words">{n.message}</p>
                  <dl className="grid grid-cols-1 gap-x-4 gap-y-1 text-base sm:grid-cols-2">
                    <div>
                      <dt className="inline font-semibold">Received: </dt>
                      <dd className="inline">{formatDateTime(n.created_at)}</dd>
                    </div>
                    {n.read_at !== null && (
                      <div>
                        <dt className="inline font-semibold">Read: </dt>
                        <dd className="inline">{formatDateTime(n.read_at)}</dd>
                      </div>
                    )}
                  </dl>
                  {n.read_at === null && (
                    <button
                      type="button"
                      onClick={() => onMarkRead(n.id)}
                      aria-label={`Mark ${n.title} as read`}
                      className="min-h-12 w-full rounded-lg bg-forest px-6 py-3 text-lg font-semibold text-ivory hover:bg-sage hover:text-charcoal sm:w-auto"
                    >
                      Mark as read
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
