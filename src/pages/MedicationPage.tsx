import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useAuth } from "../features/auth/AuthContext";
import {
  createMedication,
  listMedicationEvents,
  listMedications,
  listMembers,
  recordCaregiverAssistance,
  recordParentConfirmation,
  stopMedication,
  type MemberView,
} from "../lib/demoStore";
import type { CaregiverAssistance, Medication, MedicationEvent, ParentConfirmation } from "../lib/types";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

const PARENT_LABELS: Record<ParentConfirmation, string> = {
  taken: "Taken",
  skipped: "Skipped",
  unable_to_confirm: "Unable to confirm",
};

const CAREGIVER_LABELS: Record<CaregiverAssistance, string> = {
  assisted: "Assisted",
  not_assisted: "Not assisted",
};

function parseTimes(raw: string): string[] {
  return raw
    .split(",")
    .map((t) => t.trim())
    .filter((t) => t !== "");
}

const medicationSchema = z
  .object({
    name: z.string().trim().min(2, "Medicine name must be at least 2 characters."),
    instructions: z.string(),
    frequency: z.string(),
    scheduledTimes: z
      .string()
      .refine(
        (raw) => {
          const times = parseTimes(raw);
          return times.length > 0 && times.every((t) => TIME_PATTERN.test(t));
        },
        "Enter at least one time as HH:MM, separated by commas.",
      ),
    startDate: z.string().regex(DATE_PATTERN, "Enter a start date."),
    endDate: z
      .string()
      .refine((v) => v === "" || DATE_PATTERN.test(v), "Enter the end date as a full date."),
    prescriber: z.string(),
    refillDate: z
      .string()
      .refine((v) => v === "" || DATE_PATTERN.test(v), "Enter the refill date as a full date."),
    refillResponsible: z.string(),
    notes: z.string(),
  })
  .refine((v) => v.endDate === "" || v.endDate >= v.startDate, {
    message: "End date must be on or after the start date.",
    path: ["endDate"],
  });

type MedicationFormValues = z.infer<typeof medicationSchema>;

interface TodaySlot {
  medication: Medication;
  time: string;
  scheduledAt: string; // ISO
  event: MedicationEvent | null;
  isPast: boolean;
}

function emptyForm(): MedicationFormValues {
  return {
    name: "",
    instructions: "",
    frequency: "",
    scheduledTimes: "",
    startDate: localDateKey(new Date()),
    endDate: "",
    prescriber: "",
    refillDate: "",
    refillResponsible: "",
    notes: "",
  };
}

function errorMessage(err: unknown): string {
  return err instanceof Error && err.message ? err.message : "Something went wrong. Please try again.";
}

/** Local calendar date as YYYY-MM-DD. */
function localDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Local date plus HH:MM as ISO, matching how the demo store normalises scheduled_at. */
function slotIso(dateKey: string, time: string): string {
  return new Date(`${dateKey}T${time}:00`).toISOString();
}

function eventKey(medicationId: string, scheduledAt: string): string {
  return `${medicationId}|${scheduledAt}`;
}

function formatDateTime(iso: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleString();
}

function memberLabel(m: MemberView): string {
  return m.full_name || m.email || "Unnamed member";
}

export default function MedicationPage() {
  const { user, family, elder, membership, isDemo } = useAuth();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [events, setEvents] = useState<MedicationEvent[]>([]);
  const [members, setMembers] = useState<MemberView[]>([]);
  const [createError, setCreateError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const familyId = family?.id ?? null;
  const canRecord = membership?.role === "owner" || membership?.role === "family_member";

  const {
    register,
    handleSubmit,
    reset,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<MedicationFormValues>({
    defaultValues: emptyForm(),
  });

  const reload = useCallback(() => {
    if (!familyId) return;
    setMedications(listMedications(familyId));
    setEvents(listMedicationEvents(familyId));
    setMembers(listMembers(familyId));
  }, [familyId]);

  useEffect(() => {
    reload();
  }, [reload]);

  const memberNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const m of members) map.set(m.user_id, memberLabel(m));
    return map;
  }, [members]);

  const medicationById = useMemo(() => {
    const map = new Map<string, Medication>();
    for (const m of medications) map.set(m.id, m);
    return map;
  }, [medications]);

  const eventByKey = useMemo(() => {
    const map = new Map<string, MedicationEvent>();
    for (const e of events) map.set(eventKey(e.medication_id, e.scheduled_at), e);
    return map;
  }, [events]);

  if (!family || !user) {
    return (
      <main className="min-h-screen bg-ivory px-4 py-10 text-charcoal">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-3xl font-bold text-forest sm:text-4xl">Medication</h1>
          <p className="mt-4 text-lg leading-relaxed">Create or join a family to see its medication records.</p>
        </div>
      </main>
    );
  }

  const todayKey = localDateKey(new Date());
  const nowMs = Date.now();
  const todaySlots: TodaySlot[] = medications
    .filter(
      (m) =>
        m.status === "active" && m.start_date <= todayKey && (m.end_date === null || m.end_date >= todayKey),
    )
    .flatMap((m) =>
      m.scheduled_times.map((time) => {
        const scheduledAt = slotIso(todayKey, time);
        return {
          medication: m,
          time,
          scheduledAt,
          event: eventByKey.get(eventKey(m.id, scheduledAt)) ?? null,
          isPast: Date.parse(scheduledAt) < nowMs,
        };
      }),
    )
    .sort((a, b) => a.time.localeCompare(b.time) || a.medication.name.localeCompare(b.medication.name));

  const onCreate = (values: MedicationFormValues) => {
    clearErrors();
    const result = medicationSchema.safeParse(values);
    if (!result.success) {
      for (const issue of result.error.issues) {
        const field = issue.path[0];
        if (typeof field === "string") {
          setError(field as keyof MedicationFormValues, { type: "validate", message: issue.message });
        }
      }
      return;
    }

    setCreateError(null);
    try {
      if (!elder) {
        throw new Error("Add the elder's profile before adding medicines.");
      }
      createMedication({
        familyId: family.id,
        elderId: elder.id,
        actorId: user.id,
        name: values.name,
        instructions: values.instructions,
        frequency: values.frequency,
        scheduledTimes: parseTimes(values.scheduledTimes),
        startDate: values.startDate,
        endDate: values.endDate || null,
        prescriber: values.prescriber || null,
        refillDate: values.refillDate || null,
        refillResponsible: values.refillResponsible || null,
        notes: values.notes || null,
      });
      reset(emptyForm());
      reload();
    } catch (err) {
      setCreateError(errorMessage(err));
    }
  };

  const onStop = (medicationId: string) => {
    setActionError(null);
    try {
      stopMedication(medicationId, user.id);
      reload();
    } catch (err) {
      setActionError(errorMessage(err));
    }
  };

  const onParentConfirm = (slot: TodaySlot, status: ParentConfirmation) => {
    setActionError(null);
    try {
      recordParentConfirmation({
        medicationId: slot.medication.id,
        familyId: family.id,
        scheduledAt: slot.scheduledAt,
        actorId: user.id,
        status,
      });
      reload();
    } catch (err) {
      setActionError(errorMessage(err));
    }
  };

  const onCaregiverAssist = (slot: TodaySlot, assistance: CaregiverAssistance) => {
    setActionError(null);
    try {
      recordCaregiverAssistance({
        medicationId: slot.medication.id,
        familyId: family.id,
        scheduledAt: slot.scheduledAt,
        actorId: user.id,
        assistance,
        notes: slot.event?.notes ?? null,
      });
      reload();
    } catch (err) {
      setActionError(errorMessage(err));
    }
  };

  const inputClass =
    "mt-2 block min-h-12 w-full rounded-lg border border-sage bg-white px-4 py-3 text-lg text-charcoal focus:border-forest focus:outline-none focus:ring-2 focus:ring-forest";
  const sectionClass = "space-y-4";
  const emptyClass = "rounded-lg border border-sage bg-white p-4 text-base";
  const buttonClass =
    "min-h-12 rounded-lg border border-forest bg-white px-4 py-3 text-base font-semibold text-forest hover:bg-sage hover:text-charcoal";
  const primaryButtonClass =
    "min-h-12 w-full rounded-lg bg-forest px-6 py-3 text-lg font-semibold text-ivory hover:bg-sage hover:text-charcoal disabled:opacity-60";

  return (
    <main className="min-h-screen bg-ivory px-4 py-10 text-charcoal">
      <div className="mx-auto max-w-3xl space-y-10">
        <header>
          <h1 className="text-3xl font-bold text-forest sm:text-4xl">Medication</h1>
          <p className="mt-2 text-lg leading-relaxed">{family.name}</p>
          {isDemo && (
            <p className="mt-4 rounded-lg border border-sage bg-white p-4 text-base">
              Demo mode — data is stored only in this browser.
            </p>
          )}
          <p
            role="note"
            className="mt-4 rounded-lg border-2 border-coral bg-white p-4 text-base font-semibold text-charcoal"
          >
            Medicine recommendations and dosage advice are not provided by Nanu's AI. Follow your prescriber's
            instructions.
          </p>
        </header>

        {actionError && (
          <p role="alert" className="rounded-lg border border-forest bg-white p-4 text-base text-forest">
            {actionError}
          </p>
        )}

        <section aria-labelledby="today-heading" className={sectionClass}>
          <h2 id="today-heading" className="text-2xl font-semibold text-forest">
            Today's medicine status
          </h2>
          <p className="text-base">{new Date().toLocaleDateString()}</p>
          {todaySlots.length === 0 ? (
            <p className={emptyClass}>No scheduled medicines for today.</p>
          ) : (
            <ul className="space-y-3">
              {todaySlots.map((slot) => {
                const parentStatus = slot.event?.parent_confirmation ?? null;
                const caregiverStatus = slot.event?.caregiver_assistance ?? null;
                const awaitingConfirmation = slot.isPast && parentStatus === null;
                const slotName = `${slot.medication.name} at ${slot.time}`;
                return (
                  <li
                    key={`${slot.medication.id}-${slot.time}`}
                    className="space-y-3 rounded-lg border border-sage bg-white p-4"
                  >
                    <p className="text-lg font-semibold break-words">{slotName}</p>
                    {awaitingConfirmation && (
                      <p className="inline-flex items-center gap-2 text-base font-semibold text-charcoal">
                        <span aria-hidden="true" className="inline-block h-3 w-3 rounded-full bg-coral" />
                        No parent confirmation yet
                      </p>
                    )}
                    <dl className="space-y-1 text-base">
                      <div>
                        <dt className="inline font-semibold">Parent confirmation: </dt>
                        <dd className="inline">{parentStatus ? PARENT_LABELS[parentStatus] : "Not yet recorded"}</dd>
                      </div>
                      <div>
                        <dt className="inline font-semibold">Caregiver assistance recorded: </dt>
                        <dd className="inline">
                          {caregiverStatus ? CAREGIVER_LABELS[caregiverStatus] : "Not recorded"}
                        </dd>
                      </div>
                    </dl>
                    <p className="text-sm text-charcoal">
                      Caregiver assistance is not proof that the medicine was taken.
                    </p>

                    {canRecord && (
                      <div className="space-y-3">
                        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                          <button
                            type="button"
                            aria-label={`Record parent confirmation for ${slotName}: taken`}
                            onClick={() => onParentConfirm(slot, "taken")}
                            className={buttonClass}
                          >
                            Taken
                          </button>
                          <button
                            type="button"
                            aria-label={`Record parent confirmation for ${slotName}: skipped`}
                            onClick={() => onParentConfirm(slot, "skipped")}
                            className={buttonClass}
                          >
                            Skipped
                          </button>
                          <button
                            type="button"
                            aria-label={`Record parent confirmation for ${slotName}: unable to confirm`}
                            onClick={() => onParentConfirm(slot, "unable_to_confirm")}
                            className={buttonClass}
                          >
                            Unable to confirm
                          </button>
                        </div>
                        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                          <button
                            type="button"
                            aria-label={`Record caregiver assistance for ${slotName}: assisted`}
                            onClick={() => onCaregiverAssist(slot, "assisted")}
                            className={buttonClass}
                          >
                            Caregiver assisted
                          </button>
                          <button
                            type="button"
                            aria-label={`Record caregiver assistance for ${slotName}: not assisted`}
                            onClick={() => onCaregiverAssist(slot, "not_assisted")}
                            className={buttonClass}
                          >
                            Caregiver did not assist
                          </button>
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section aria-labelledby="list-heading" className={sectionClass}>
          <h2 id="list-heading" className="text-2xl font-semibold text-forest">
            Medicines
          </h2>
          {medications.length === 0 ? (
            <p className={emptyClass}>No medicines added yet.</p>
          ) : (
            <ul className="space-y-3">
              {medications.map((m) => {
                const refillName = m.refill_responsible
                  ? (memberNameById.get(m.refill_responsible) ?? "Unknown member")
                  : "Not set";
                return (
                  <li key={m.id} className="space-y-2 rounded-lg border border-sage bg-white p-4">
                    <p className="text-lg font-semibold break-words">{m.name}</p>
                    <p className="text-base">Status: {m.status === "active" ? "Active" : "Stopped"}</p>
                    <dl className="grid grid-cols-1 gap-x-4 gap-y-1 text-base sm:grid-cols-2">
                      <div>
                        <dt className="inline font-semibold">Instructions: </dt>
                        <dd className="inline break-words">{m.instructions || "None entered"}</dd>
                      </div>
                      <div>
                        <dt className="inline font-semibold">Frequency: </dt>
                        <dd className="inline">{m.frequency || "None entered"}</dd>
                      </div>
                      <div>
                        <dt className="inline font-semibold">Scheduled times: </dt>
                        <dd className="inline">{m.scheduled_times.join(", ")}</dd>
                      </div>
                      <div>
                        <dt className="inline font-semibold">Dates: </dt>
                        <dd className="inline">
                          {m.start_date}
                          {m.end_date ? ` to ${m.end_date}` : " (no end date)"}
                        </dd>
                      </div>
                      <div>
                        <dt className="inline font-semibold">Prescriber: </dt>
                        <dd className="inline">{m.prescriber ?? "Not set"}</dd>
                      </div>
                      <div>
                        <dt className="inline font-semibold">Refill date: </dt>
                        <dd className="inline">{m.refill_date ?? "Not set"}</dd>
                      </div>
                      <div>
                        <dt className="inline font-semibold">Refill responsible: </dt>
                        <dd className="inline">{refillName}</dd>
                      </div>
                      {m.notes && (
                        <div className="sm:col-span-2">
                          <dt className="inline font-semibold">Notes: </dt>
                          <dd className="inline break-words">{m.notes}</dd>
                        </div>
                      )}
                    </dl>
                    {m.status === "active" && canRecord && (
                      <button
                        type="button"
                        onClick={() => onStop(m.id)}
                        aria-label={`Stop ${m.name}`}
                        className={`${buttonClass} w-full sm:w-auto`}
                      >
                        Stop
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          {canRecord ? (
            <form
              onSubmit={handleSubmit(onCreate)}
              noValidate
              aria-labelledby="add-medicine-heading"
              className="space-y-4 rounded-lg border border-sage bg-white p-4"
            >
              <h3 id="add-medicine-heading" className="text-xl font-semibold text-forest">
                Add a medicine
              </h3>

              <div>
                <label htmlFor="med-name" className="text-lg font-semibold">
                  Medicine name
                </label>
                <input
                  id="med-name"
                  type="text"
                  autoComplete="off"
                  className={inputClass}
                  aria-invalid={errors.name ? "true" : "false"}
                  aria-describedby={errors.name ? "med-name-error" : undefined}
                  {...register("name")}
                />
                {errors.name && (
                  <p id="med-name-error" role="alert" className="mt-2 text-base text-forest">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="med-instructions" className="text-lg font-semibold">
                  Instructions (as written on the prescription)
                </label>
                <textarea id="med-instructions" rows={3} className={inputClass} {...register("instructions")} />
              </div>

              <div>
                <label htmlFor="med-frequency" className="text-lg font-semibold">
                  Frequency
                </label>
                <input id="med-frequency" type="text" className={inputClass} {...register("frequency")} />
              </div>

              <div>
                <label htmlFor="med-times" className="text-lg font-semibold">
                  Scheduled times (HH:MM, separated by commas)
                </label>
                <input
                  id="med-times"
                  type="text"
                  placeholder="08:00, 20:00"
                  autoComplete="off"
                  className={inputClass}
                  aria-invalid={errors.scheduledTimes ? "true" : "false"}
                  aria-describedby={errors.scheduledTimes ? "med-times-error" : undefined}
                  {...register("scheduledTimes")}
                />
                {errors.scheduledTimes && (
                  <p id="med-times-error" role="alert" className="mt-2 text-base text-forest">
                    {errors.scheduledTimes.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="med-start" className="text-lg font-semibold">
                  Start date
                </label>
                <input
                  id="med-start"
                  type="date"
                  className={inputClass}
                  aria-invalid={errors.startDate ? "true" : "false"}
                  aria-describedby={errors.startDate ? "med-start-error" : undefined}
                  {...register("startDate")}
                />
                {errors.startDate && (
                  <p id="med-start-error" role="alert" className="mt-2 text-base text-forest">
                    {errors.startDate.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="med-end" className="text-lg font-semibold">
                  End date (optional)
                </label>
                <input
                  id="med-end"
                  type="date"
                  className={inputClass}
                  aria-invalid={errors.endDate ? "true" : "false"}
                  aria-describedby={errors.endDate ? "med-end-error" : undefined}
                  {...register("endDate")}
                />
                {errors.endDate && (
                  <p id="med-end-error" role="alert" className="mt-2 text-base text-forest">
                    {errors.endDate.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="med-prescriber" className="text-lg font-semibold">
                  Prescriber (optional)
                </label>
                <input id="med-prescriber" type="text" className={inputClass} {...register("prescriber")} />
              </div>

              <div>
                <label htmlFor="med-refill-date" className="text-lg font-semibold">
                  Refill date (optional)
                </label>
                <input
                  id="med-refill-date"
                  type="date"
                  className={inputClass}
                  aria-invalid={errors.refillDate ? "true" : "false"}
                  aria-describedby={errors.refillDate ? "med-refill-date-error" : undefined}
                  {...register("refillDate")}
                />
                {errors.refillDate && (
                  <p id="med-refill-date-error" role="alert" className="mt-2 text-base text-forest">
                    {errors.refillDate.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="med-refill-owner" className="text-lg font-semibold">
                  Refill responsible (optional)
                </label>
                <select id="med-refill-owner" className={inputClass} {...register("refillResponsible")}>
                  <option value="">Not set</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.user_id}>
                      {memberLabel(m)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="med-notes" className="text-lg font-semibold">
                  Notes (optional)
                </label>
                <textarea id="med-notes" rows={2} className={inputClass} {...register("notes")} />
              </div>

              <button type="submit" disabled={isSubmitting} className={primaryButtonClass}>
                Add medicine
              </button>

              {createError && (
                <p role="alert" className="rounded-lg border border-forest bg-white p-4 text-base text-forest">
                  {createError}
                </p>
              )}
            </form>
          ) : (
            <p className={emptyClass}>Only the family owner or a family member can manage medicines.</p>
          )}
        </section>

        <section aria-labelledby="history-heading" className={sectionClass}>
          <h2 id="history-heading" className="text-2xl font-semibold text-forest">
            History
          </h2>
          {events.length === 0 ? (
            <p className={emptyClass}>No medicine history yet.</p>
          ) : (
            <ul className="space-y-3">
              {events.map((e) => {
                const medName = medicationById.get(e.medication_id)?.name ?? "Unknown medicine";
                const parentText = e.parent_confirmation ? PARENT_LABELS[e.parent_confirmation] : "Not yet recorded";
                const caregiverText = e.caregiver_assistance
                  ? CAREGIVER_LABELS[e.caregiver_assistance]
                  : "Not recorded";
                const caregiverBy = e.caregiver_user_id
                  ? (memberNameById.get(e.caregiver_user_id) ?? "Unknown member")
                  : null;
                return (
                  <li key={e.id} className="space-y-2 rounded-lg border border-sage bg-white p-4">
                    <p className="text-lg font-semibold break-words">{medName}</p>
                    <p className="text-base">Scheduled: {formatDateTime(e.scheduled_at)}</p>
                    <dl className="space-y-1 text-base">
                      <div>
                        <dt className="inline font-semibold">Parent confirmation: </dt>
                        <dd className="inline">{parentText}</dd>
                        {e.parent_confirmed_at && (
                          <dd className="inline"> (recorded {formatDateTime(e.parent_confirmed_at)})</dd>
                        )}
                      </div>
                      <div>
                        <dt className="inline font-semibold">Caregiver assistance recorded: </dt>
                        <dd className="inline">{caregiverText}</dd>
                        {caregiverBy && (
                          <dd className="inline">
                            {" "}
                            (by {caregiverBy}
                            {e.caregiver_recorded_at ? `, ${formatDateTime(e.caregiver_recorded_at)}` : ""})
                          </dd>
                        )}
                      </div>
                    </dl>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
