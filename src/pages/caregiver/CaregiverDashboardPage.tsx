import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../features/auth/AuthContext";
import DemoRoleSwitcher from "../../components/DemoRoleSwitcher";
import BrandLogo from "../../components/BrandLogo";
import {
  checkInShift,
  checkOutShift,
  getFamily,
  listAssignedElders,
  listShiftsForCaregiver,
} from "../../lib/demoStore";
import type { CaregiverShift, CaregiverShiftStatus, ElderProfile } from "../../lib/types";

const SHIFT_STATUS_LABELS: Record<CaregiverShiftStatus, string> = {
  scheduled: "Scheduled",
  checked_in: "Checked in",
  completed: "Completed",
  missed: "Missed",
};

interface ElderView extends ElderProfile {
  familyName: string;
}

interface DashboardData {
  elders: ElderView[];
  shifts: CaregiverShift[];
}

function errorMessage(err: unknown): string {
  return err instanceof Error && err.message ? err.message : "Something went wrong. Please try again.";
}

function formatDateTime(iso: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleString();
}

/** Loads only the elders from families that approved this caregiver, and only shifts in those families. */
function loadDashboard(userId: string | null): DashboardData {
  if (!userId) return { elders: [], shifts: [] };
  const elders = listAssignedElders(userId).map((e) => ({
    ...e,
    familyName: getFamily(e.family_id)?.name ?? "Family",
  }));
  const familyIds = new Set(elders.map((e) => e.family_id));
  const shifts = listShiftsForCaregiver(userId).filter((s) => familyIds.has(s.family_id));
  return { elders, shifts };
}

export default function CaregiverDashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData>(() => loadDashboard(user?.id ?? null));
  const [notes, setNotes] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

  const nextShift = data.shifts.find((s) => s.status === "scheduled" || s.status === "checked_in") ?? null;
  const elderName = (elderId: string): string =>
    data.elders.find((e) => e.id === elderId)?.display_name ?? "Elder";

  if (!user) {
    return (
      <main className="min-h-screen bg-ivory px-4 py-10 text-charcoal">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-3xl font-bold text-forest sm:text-4xl">Caregiver dashboard</h1>
          <p className="mt-4 text-lg leading-relaxed">Sign in to see your assignments.</p>
        </div>
      </main>
    );
  }

  const reload = () => setData(loadDashboard(user.id));

  const onCheckIn = (shiftId: string) => {
    setActionError(null);
    try {
      checkInShift(shiftId, user.id);
      reload();
    } catch (err) {
      setActionError(errorMessage(err));
    }
  };

  const onCheckOut = (shiftId: string) => {
    setActionError(null);
    try {
      checkOutShift(shiftId, user.id, notes);
      setNotes("");
      reload();
    } catch (err) {
      setActionError(errorMessage(err));
    }
  };

  const emptyClass = "rounded-lg border border-sage bg-white p-4 text-base";
  const sectionClass = "space-y-4";
  const buttonClass =
    "min-h-12 w-full rounded-lg bg-forest px-6 py-3 text-lg font-semibold text-ivory hover:bg-sage hover:text-charcoal sm:w-auto";

  return (
    <div className="min-h-screen bg-ivory text-charcoal">
      <DemoRoleSwitcher />

      <header className="border-b border-sage/60 bg-white/80">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Link to="/app/caregiver">
              <BrandLogo size="sm" />
            </Link>
            <span className="rounded-full bg-sage/30 px-2.5 py-0.5 text-xs font-semibold text-charcoal">
              Caregiver Workspace
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/app/caregiver/shifts"
              className="text-xs sm:text-sm font-medium text-forest hover:underline px-2 py-1"
            >
              Shifts
            </Link>
            <Link
              to="/app/caregiver/tasks"
              className="text-xs sm:text-sm font-medium text-forest hover:underline px-2 py-1"
            >
              Tasks
            </Link>
            <Link
              to="/app/caregiver/activity"
              className="text-xs sm:text-sm font-medium text-forest hover:underline px-2 py-1"
            >
              Activity Log
            </Link>
            <Link
              to="/app/caregiver/handover"
              className="text-xs sm:text-sm font-medium text-forest hover:underline px-2 py-1"
            >
              Handover
            </Link>
            <Link
              to="/app/caregiver/profile"
              className="text-xs sm:text-sm font-medium text-forest hover:underline px-2 py-1"
            >
              Profile
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 space-y-8">
        <header className="border-b border-sage/40 pb-4">
          <h1 className="font-serif text-3xl font-bold text-forest sm:text-4xl">
            Caregiver Workspace
          </h1>
          <p className="mt-1 text-sm text-charcoal/80">
            Assigned elder coordination, shift check-in, care activity logging and handover submission.
          </p>
        </header>

        {actionError && (
          <p role="alert" className="rounded-lg border border-forest bg-white p-4 text-base text-forest">
            {actionError}
          </p>
        )}

        <section aria-labelledby="elders-heading" className={sectionClass}>
          <h2 id="elders-heading" className="text-2xl font-semibold text-forest">
            Assigned elders
          </h2>
          {data.elders.length === 0 ? (
            <p className={emptyClass}>
              You are not assigned to any family yet. Assignments appear once the family approves you.
            </p>
          ) : (
            <ul className="space-y-3">
              {data.elders.map((elder) => (
                <li key={elder.id} className="space-y-1 rounded-lg border border-sage bg-white p-4">
                  <p className="text-lg font-semibold break-words">{elder.display_name}</p>
                  <p className="text-base break-words">Family: {elder.familyName}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="next-shift-heading" className={sectionClass}>
          <h2 id="next-shift-heading" className="text-2xl font-semibold text-forest">
            Next shift
          </h2>
          {!nextShift ? (
            <p className={emptyClass}>No upcoming shifts.</p>
          ) : (
            <div className="space-y-4 rounded-lg border border-sage bg-white p-4">
              <dl className="grid grid-cols-1 gap-x-4 gap-y-1 text-base sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <dt className="inline font-semibold">Elder: </dt>
                  <dd className="inline">{elderName(nextShift.elder_id)}</dd>
                </div>
                <div>
                  <dt className="inline font-semibold">Starts: </dt>
                  <dd className="inline">{formatDateTime(nextShift.scheduled_start)}</dd>
                </div>
                <div>
                  <dt className="inline font-semibold">Ends: </dt>
                  <dd className="inline">{formatDateTime(nextShift.scheduled_end)}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="inline font-semibold">Status: </dt>
                  <dd className="inline">{SHIFT_STATUS_LABELS[nextShift.status]}</dd>
                </div>
              </dl>

              {nextShift.status === "scheduled" && (
                <button type="button" onClick={() => onCheckIn(nextShift.id)} className={buttonClass}>
                  Check in
                </button>
              )}

              {nextShift.status === "checked_in" && (
                <div className="space-y-4">
                  <div>
                    <label htmlFor="checkout-notes" className="text-lg font-semibold">
                      Shift notes (optional)
                    </label>
                    <textarea
                      id="checkout-notes"
                      rows={3}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="mt-2 block w-full rounded-lg border border-sage bg-white px-4 py-3 text-lg text-charcoal focus:border-forest focus:outline-none focus:ring-2 focus:ring-forest"
                    />
                  </div>
                  <button type="button" onClick={() => onCheckOut(nextShift.id)} className={buttonClass}>
                    Check out
                  </button>
                </div>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
