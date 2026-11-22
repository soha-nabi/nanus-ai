import { useState } from "react";
import { useAuth } from "../../features/auth/AuthContext";
import {
  checkInShift,
  checkOutShift,
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

interface ShiftsData {
  elders: ElderProfile[];
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

/** Loads the caregiver's shifts, limited to families that approved this caregiver. */
function loadShifts(userId: string | null): ShiftsData {
  if (!userId) return { elders: [], shifts: [] };
  const elders = listAssignedElders(userId);
  const familyIds = new Set(elders.map((e) => e.family_id));
  const shifts = listShiftsForCaregiver(userId).filter((s) => familyIds.has(s.family_id));
  return { elders, shifts };
}

export default function CaregiverShiftsPage() {
  const { user, isDemo } = useAuth();
  const [data, setData] = useState<ShiftsData>(() => loadShifts(user?.id ?? null));
  const [notes, setNotes] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

  if (!user) {
    return (
      <main className="min-h-screen bg-ivory px-4 py-10 text-charcoal">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-3xl font-bold text-forest sm:text-4xl">My shifts</h1>
          <p className="mt-4 text-lg leading-relaxed">Sign in to see your shifts.</p>
        </div>
      </main>
    );
  }

  const elderName = (elderId: string): string =>
    data.elders.find((e) => e.id === elderId)?.display_name ?? "Elder";
  const hasCheckedIn = data.shifts.some((s) => s.status === "checked_in" && s.caregiver_user_id === user.id);

  const reload = () => setData(loadShifts(user.id));

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
  const buttonClass =
    "min-h-12 w-full rounded-lg bg-forest px-6 py-3 text-lg font-semibold text-ivory hover:bg-sage hover:text-charcoal sm:w-auto";

  return (
    <main className="min-h-screen bg-ivory px-4 py-10 text-charcoal">
      <div className="mx-auto max-w-3xl space-y-10">
        <header>
          <h1 className="text-3xl font-bold text-forest sm:text-4xl">My shifts</h1>
          {isDemo && (
            <p className="mt-4 rounded-lg border border-sage bg-white p-4 text-base">
              Demo mode — data is stored only in this browser.
            </p>
          )}
        </header>

        {actionError && (
          <p role="alert" className="rounded-lg border border-forest bg-white p-4 text-base text-forest">
            {actionError}
          </p>
        )}

        {data.elders.length === 0 ? (
          <p className={emptyClass}>
            You are not assigned to any family yet. Assignments appear once the family approves you.
          </p>
        ) : data.shifts.length === 0 ? (
          <p className={emptyClass}>No shifts have been scheduled for you yet.</p>
        ) : (
          <>
            {hasCheckedIn && (
              <div className="rounded-lg border border-sage bg-white p-4">
                <label htmlFor="shift-checkout-notes" className="text-lg font-semibold">
                  Shift notes for check-out (optional)
                </label>
                <textarea
                  id="shift-checkout-notes"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mt-2 block w-full rounded-lg border border-sage bg-white px-4 py-3 text-lg text-charcoal focus:border-forest focus:outline-none focus:ring-2 focus:ring-forest"
                />
              </div>
            )}

            <ul className="space-y-3">
              {data.shifts.map((shift) => {
                const isOwn = shift.caregiver_user_id === user.id;
                return (
                  <li key={shift.id} className="space-y-3 rounded-lg border border-sage bg-white p-4">
                    <p className="text-lg font-semibold break-words">{elderName(shift.elder_id)}</p>
                    <dl className="grid grid-cols-1 gap-x-4 gap-y-1 text-base sm:grid-cols-2">
                      <div>
                        <dt className="inline font-semibold">Starts: </dt>
                        <dd className="inline">{formatDateTime(shift.scheduled_start)}</dd>
                      </div>
                      <div>
                        <dt className="inline font-semibold">Ends: </dt>
                        <dd className="inline">{formatDateTime(shift.scheduled_end)}</dd>
                      </div>
                      <div>
                        <dt className="inline font-semibold">Checked in: </dt>
                        <dd className="inline">{formatDateTime(shift.check_in_at) ?? "Not yet"}</dd>
                      </div>
                      <div>
                        <dt className="inline font-semibold">Checked out: </dt>
                        <dd className="inline">{formatDateTime(shift.check_out_at) ?? "Not yet"}</dd>
                      </div>
                      <div className="sm:col-span-2">
                        <dt className="inline font-semibold">Status: </dt>
                        <dd className="inline">{SHIFT_STATUS_LABELS[shift.status]}</dd>
                      </div>
                    </dl>

                    {isOwn && shift.status === "scheduled" && (
                      <button type="button" onClick={() => onCheckIn(shift.id)} className={buttonClass}>
                        Check in
                      </button>
                    )}
                    {isOwn && shift.status === "checked_in" && (
                      <button type="button" onClick={() => onCheckOut(shift.id)} className={buttonClass}>
                        Check out
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </main>
  );
}
