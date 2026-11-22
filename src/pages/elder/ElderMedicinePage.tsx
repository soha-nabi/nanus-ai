import { useMemo } from "react";
import { useAuth } from "../../features/auth/AuthContext";
import { listMedications } from "../../lib/demoStore";
import type { Medication } from "../../lib/types";
import ElderNav from "../../components/elder/ElderNav";

/** Local calendar date as YYYY-MM-DD. */
function localDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Active medicines that have not ended yet. Read-only: nothing is recorded on this page. */
function currentMedicines(familyId: string): Medication[] {
  const today = localDateKey(new Date());
  return listMedications(familyId).filter(
    (m) => m.status === "active" && (m.end_date === null || m.end_date >= today),
  );
}

export default function ElderMedicinePage() {
  const { family } = useAuth();
  const medicines = useMemo(() => (family ? currentMedicines(family.id) : []), [family]);

  return (
    <main className="min-h-screen bg-ivory px-4 pb-40 pt-8 text-charcoal">
      <div className="mx-auto max-w-2xl space-y-8">
        <header>
          <h1 className="text-3xl font-bold text-forest sm:text-4xl">My medicines</h1>
        </header>

        {!family ? (
          <p className="rounded-lg border border-sage bg-white p-4 text-2xl leading-relaxed">
            Your family link is not set up yet. Ask your family to add you in the app.
          </p>
        ) : medicines.length === 0 ? (
          <p className="rounded-lg border border-sage bg-white p-4 text-2xl leading-relaxed">
            No medicines are listed right now.
          </p>
        ) : (
          <ul className="space-y-4">
            {medicines.map((m) => (
              <li key={m.id} className="space-y-2 rounded-lg border border-sage bg-white p-4">
                <p className="break-words text-2xl font-semibold">{m.name}</p>
                {m.instructions && <p className="break-words text-xl leading-relaxed">{m.instructions}</p>}
                <p className="text-xl leading-relaxed">
                  <span className="font-semibold">Times: </span>
                  {m.scheduled_times.length > 0 ? m.scheduled_times.join(", ") : "Not set"}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
      <ElderNav />
    </main>
  );
}
