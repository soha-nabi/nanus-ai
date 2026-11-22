import { useMemo, useState } from "react";
import { useAuth } from "../../features/auth/AuthContext";
import {
  listMedicationEvents,
  listMedications,
  recordElderMedicineConfirmation,
} from "../../lib/demoStore";
import type { Medication, MedicationEvent, ParentConfirmation } from "../../lib/types";
import ElderNav from "../../components/elder/ElderNav";

/** Local calendar date as YYYY-MM-DD. */
function localDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Active medicines that have not ended yet. */
function currentMedicines(familyId: string): Medication[] {
  const today = localDateKey(new Date());
  return listMedications(familyId).filter(
    (m) => m.status === "active" && (m.end_date === null || m.end_date >= today),
  );
}

const ANSWER_OPTIONS: { status: ParentConfirmation; label: string }[] = [
  { status: "taken", label: "I took it" },
  { status: "skipped", label: "I did not take it" },
  { status: "unable_to_confirm", label: "I am not sure" },
];

const ANSWER_LABELS: Record<ParentConfirmation, string> = {
  taken: "I took it",
  skipped: "I did not take it",
  unable_to_confirm: "I am not sure",
};

interface TodayData {
  medicines: Medication[];
  events: MedicationEvent[];
}

const EMPTY_TODAY: TodayData = { medicines: [], events: [] };

function loadToday(familyId: string): TodayData {
  return { medicines: currentMedicines(familyId), events: listMedicationEvents(familyId) };
}

/** Builds the ISO time for one HH:MM slot on today's local date. */
function scheduledIsoFor(time: string, day: Date): string {
  const [hh, mm] = time.split(":").map(Number);
  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), hh, mm).toISOString();
}

export default function ElderMedicinePage() {
  const { family, user } = useAuth();
  const [version, setVersion] = useState(0);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const data = useMemo<TodayData>(
    () => (family ? loadToday(family.id) : EMPTY_TODAY),
    // version is bumped after each recorded answer to reload the store.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [family, version],
  );

  const today = new Date();

  async function answer(medicationId: string, scheduledAt: string, status: ParentConfirmation): Promise<void> {
    if (!family || !user) return;
    const key = `${medicationId}|${scheduledAt}`;
    setBusyKey(key);
    setError(null);
    setNotice(null);
    try {
      recordElderMedicineConfirmation({
        medicationId,
        familyId: family.id,
        scheduledAt,
        actorId: user.id,
        status,
      });
      setNotice(`Recorded: ${ANSWER_LABELS[status]}.`);
      setVersion((v) => v + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not record your answer. Please try again.");
    } finally {
      setBusyKey(null);
    }
  }

  return (
    <main className="min-h-screen bg-ivory px-4 pb-40 pt-8 text-charcoal">
      <div className="mx-auto max-w-2xl space-y-8">
        <header>
          <h1 className="text-3xl font-bold text-forest sm:text-4xl">My medicines</h1>
          <p className="mt-3 text-xl leading-relaxed">
            Your answer is recorded as your own. Nanu's AI does not record that a medicine was taken unless
            you choose one of these answers.
          </p>
        </header>

        {error && (
          <p role="alert" className="rounded-lg border-2 border-red-700 bg-white p-4 text-xl font-semibold text-red-800">
            {error}
          </p>
        )}
        {notice && (
          <p role="status" className="rounded-lg border-2 border-forest bg-white p-4 text-xl font-semibold text-forest">
            {notice}
          </p>
        )}

        {!family ? (
          <p className="rounded-lg border border-sage bg-white p-4 text-2xl leading-relaxed">
            Your family link is not set up yet. Ask your family to add you in the app.
          </p>
        ) : data.medicines.length === 0 ? (
          <p className="rounded-lg border border-sage bg-white p-4 text-2xl leading-relaxed">
            No medicines are listed right now.
          </p>
        ) : (
          <ul className="space-y-4">
            {data.medicines.map((m) => (
              <li key={m.id} className="space-y-4 rounded-lg border border-sage bg-white p-4">
                <div className="space-y-2">
                  <p className="break-words text-2xl font-semibold">{m.name}</p>
                  {m.instructions && <p className="break-words text-xl leading-relaxed">{m.instructions}</p>}
                </div>

                {m.scheduled_times.length === 0 ? (
                  <p className="text-xl leading-relaxed">
                    <span className="font-semibold">Times: </span>Not set
                  </p>
                ) : (
                  m.scheduled_times.map((time) => {
                    const scheduledAt = scheduledIsoFor(time, today);
                    const existing =
                      data.events.find((e) => e.medication_id === m.id && e.scheduled_at === scheduledAt) ?? null;
                    const key = `${m.id}|${scheduledAt}`;
                    const busy = busyKey === key;
                    return (
                      <section key={time} className="space-y-3 border-t border-sage pt-4">
                        <p className="text-xl font-semibold text-forest">Time: {time}</p>
                        <p className="text-xl leading-relaxed">
                          <span className="font-semibold">Your answer: </span>
                          {existing?.parent_confirmation
                            ? ANSWER_LABELS[existing.parent_confirmation]
                            : "No answer yet"}
                        </p>
                        {existing?.caregiver_assistance && (
                          <p className="text-xl leading-relaxed">
                            <span className="font-semibold">Caregiver helped: </span>
                            {existing.caregiver_assistance === "assisted" ? "yes" : "no"}
                          </p>
                        )}
                        <div className="grid gap-3">
                          {ANSWER_OPTIONS.map((opt) => (
                            <button
                              key={opt.status}
                              type="button"
                              disabled={busy || !user}
                              onClick={() => void answer(m.id, scheduledAt, opt.status)}
                              className="min-h-16 w-full rounded-lg border-2 border-forest bg-white px-4 py-3 text-xl font-semibold text-charcoal disabled:opacity-60"
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </section>
                    );
                  })
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
      <ElderNav />
    </main>
  );
}
