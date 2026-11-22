import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useAuth } from "../../features/auth/AuthContext";
import {
  addCaregiverActivity,
  getFamily,
  listAssignedElders,
  listCaregiverActivity,
} from "../../lib/demoStore";
import type { CaregiverActivityLog, CaregiverActivityType } from "../../lib/types";

const FORM_ACTIVITY_TYPES = ["task_completed", "medication_assistance", "report", "handover"] as const;

const ACTIVITY_LABELS: Record<CaregiverActivityType, string> = {
  task_completed: "Task completed",
  medication_assistance: "Medication assistance",
  check_in: "Check in",
  check_out: "Check out",
  report: "Daily care report",
  handover: "Handover note",
};

const descriptionSchema = z.string().trim().min(3, "Description must be at least 3 characters.");

const activitySchema = z.object({
  familyId: z.string().min(1, "Choose a family."),
  activityType: z.enum(FORM_ACTIVITY_TYPES),
  description: descriptionSchema,
  evidenceName: z.string(),
});

type ActivityFormValues = z.infer<typeof activitySchema>;

interface FamilyOption {
  id: string;
  name: string;
}

interface ActivityData {
  families: FamilyOption[];
  logs: Array<CaregiverActivityLog & { familyName: string }>;
}

function errorMessage(err: unknown): string {
  return err instanceof Error && err.message ? err.message : "Something went wrong. Please try again.";
}

function formatDateTime(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleString();
}

/** Returns true when the description is valid, otherwise the first zod message. */
function checkDescription(value: string): true | string {
  const result = descriptionSchema.safeParse(value);
  return result.success ? true : (result.error.issues[0]?.message ?? "Enter a description.");
}

/** Loads the families this caregiver is approved for, and only this caregiver's own entries. */
function loadActivity(userId: string | null): ActivityData {
  if (!userId) return { families: [], logs: [] };
  const familyIds = Array.from(new Set(listAssignedElders(userId).map((e) => e.family_id)));
  const families = familyIds.map((id) => ({ id, name: getFamily(id)?.name ?? "Family" }));
  const logs = families
    .flatMap((f) =>
      listCaregiverActivity(f.id)
        .filter((log) => log.caregiver_user_id === userId)
        .map((log) => ({ ...log, familyName: f.name })),
    )
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
  return { families, logs };
}

export default function CaregiverActivityPage() {
  const { user, isDemo } = useAuth();
  const [data, setData] = useState<ActivityData>(() => loadActivity(user?.id ?? null));
  const [formError, setFormError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ActivityFormValues>({
    defaultValues: {
      familyId: data.families[0]?.id ?? "",
      activityType: "report",
      description: "",
      evidenceName: "",
    },
  });

  if (!user) {
    return (
      <main className="min-h-screen bg-ivory px-4 py-10 text-charcoal">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-3xl font-bold text-forest sm:text-4xl">Care activity</h1>
          <p className="mt-4 text-lg leading-relaxed">Sign in to record care activity.</p>
        </div>
      </main>
    );
  }

  const reload = () => setData(loadActivity(user.id));

  const onSubmit = (values: ActivityFormValues) => {
    setFormError(null);
    setSavedMessage(null);
    try {
      addCaregiverActivity({
        familyId: values.familyId,
        caregiverUserId: user.id,
        actorId: user.id,
        activityType: values.activityType,
        description: values.description,
        evidenceName: values.evidenceName.trim() || null,
      });
      reset({ ...values, description: "", evidenceName: "" });
      setSavedMessage("Entry saved.");
      reload();
    } catch (err) {
      setFormError(errorMessage(err));
    }
  };

  const inputClass =
    "mt-2 block min-h-12 w-full rounded-lg border border-sage bg-white px-4 py-3 text-lg text-charcoal focus:border-forest focus:outline-none focus:ring-2 focus:ring-forest";
  const emptyClass = "rounded-lg border border-sage bg-white p-4 text-base";
  const buttonClass =
    "min-h-12 w-full rounded-lg bg-forest px-6 py-3 text-lg font-semibold text-ivory hover:bg-sage hover:text-charcoal disabled:opacity-60 sm:w-auto";

  return (
    <main className="min-h-screen bg-ivory px-4 py-10 text-charcoal">
      <div className="mx-auto max-w-3xl space-y-10">
        <header>
          <h1 className="text-3xl font-bold text-forest sm:text-4xl">Care activity</h1>
          {isDemo && (
            <p className="mt-4 rounded-lg border border-sage bg-white p-4 text-base">
              Demo mode — data is stored only in this browser.
            </p>
          )}
        </header>

        <section aria-labelledby="record-heading" className="space-y-4">
          <h2 id="record-heading" className="text-2xl font-semibold text-forest">
            Record an entry
          </h2>
          <p className="rounded-lg border border-sage bg-white p-4 text-base">
            Your entries are recorded as your own report. They are not proof of care on their own.
          </p>

          {data.families.length === 0 ? (
            <p className={emptyClass}>
              You are not assigned to any family yet. Assignments appear once the family approves you.
            </p>
          ) : (
            <form
              onSubmit={handleSubmit(onSubmit)}
              noValidate
              className="space-y-4 rounded-lg border border-sage bg-white p-4"
            >
              <div>
                <label htmlFor="activity-family" className="text-lg font-semibold">
                  Family
                </label>
                <select id="activity-family" className={inputClass} {...register("familyId")}>
                  {data.families.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="activity-type" className="text-lg font-semibold">
                  Type
                </label>
                <select id="activity-type" className={inputClass} {...register("activityType")}>
                  {FORM_ACTIVITY_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {ACTIVITY_LABELS[t]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="activity-description" className="text-lg font-semibold">
                  Description
                </label>
                <textarea
                  id="activity-description"
                  rows={4}
                  className={inputClass}
                  aria-invalid={errors.description ? "true" : "false"}
                  aria-describedby={errors.description ? "activity-description-error" : undefined}
                  {...register("description", { validate: checkDescription })}
                />
                {errors.description && (
                  <p id="activity-description-error" role="alert" className="mt-2 text-base text-forest">
                    {errors.description.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="activity-evidence" className="text-lg font-semibold">
                  Evidence file name (optional)
                </label>
                <input
                  id="activity-evidence"
                  type="text"
                  autoComplete="off"
                  className={inputClass}
                  {...register("evidenceName")}
                />
                <p className="mt-2 text-base">
                  Demo mode does not keep the file. Only the file name is recorded.
                </p>
              </div>

              <button type="submit" disabled={isSubmitting} className={buttonClass}>
                Save entry
              </button>

              {formError && (
                <p role="alert" className="rounded-lg border border-forest bg-white p-4 text-base text-forest">
                  {formError}
                </p>
              )}
              {savedMessage && <p className="text-base">{savedMessage}</p>}
            </form>
          )}
        </section>

        <section aria-labelledby="log-heading" className="space-y-4">
          <h2 id="log-heading" className="text-2xl font-semibold text-forest">
            Your entries
          </h2>
          {data.logs.length === 0 ? (
            <p className={emptyClass}>No entries yet.</p>
          ) : (
            <ul className="space-y-3">
              {data.logs.map((log) => (
                <li key={log.id} className="space-y-2 rounded-lg border border-sage bg-white p-4">
                  {log.disputed && (
                    <p className="inline-flex items-center gap-2 text-base font-semibold text-charcoal">
                      <span aria-hidden="true" className="inline-block h-3 w-3 rounded-full bg-coral" />
                      Disputed
                    </p>
                  )}
                  <p className="text-lg font-semibold">{ACTIVITY_LABELS[log.activity_type]}</p>
                  <p className="text-base break-words">{log.description}</p>
                  <dl className="grid grid-cols-1 gap-x-4 gap-y-1 text-base sm:grid-cols-2">
                    <div>
                      <dt className="inline font-semibold">Family: </dt>
                      <dd className="inline">{log.familyName}</dd>
                    </div>
                    <div>
                      <dt className="inline font-semibold">Recorded: </dt>
                      <dd className="inline">{formatDateTime(log.created_at)}</dd>
                    </div>
                    {log.evidence_name && (
                      <div className="sm:col-span-2">
                        <dt className="inline font-semibold">Evidence file name: </dt>
                        <dd className="inline break-words">{log.evidence_name}</dd>
                      </div>
                    )}
                  </dl>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
