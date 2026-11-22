import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useAuth } from "../features/auth/AuthContext";
import {
  createShift,
  listCaregiverActivity,
  listCaregiverProfiles,
  listMembers,
  listShifts,
  markShiftMissed,
  setActivityDisputed,
  setFamilyApproval,
  setVerificationStatus,
  type MemberView,
} from "../lib/demoStore";
import type {
  CaregiverActivityLog,
  CaregiverActivityType,
  CaregiverProfile,
  CaregiverShift,
  CaregiverShiftStatus,
  VerificationStatus,
} from "../lib/types";

type VerificationKind = "identity" | "reference" | "background";

const VERIFICATION_ROWS: {
  kind: VerificationKind;
  label: string;
  field: "identity_status" | "reference_status" | "background_status";
}[] = [
  { kind: "identity", label: "Identity", field: "identity_status" },
  { kind: "reference", label: "Reference", field: "reference_status" },
  { kind: "background", label: "Background verification", field: "background_status" },
];

const VERIFICATION_LABELS: Record<VerificationStatus, string> = {
  not_submitted: "Not submitted",
  submitted: "Submitted",
  pending_review: "Pending review",
  verified: "Verified",
  rejected: "Rejected",
  expired: "Expired",
};

const VERIFICATION_OPTIONS: VerificationStatus[] = [
  "not_submitted",
  "submitted",
  "pending_review",
  "verified",
  "rejected",
  "expired",
];

const APPROVAL_LABELS: Record<CaregiverProfile["family_approval"], string> = {
  pending: "Pending",
  approved: "Approved",
  declined: "Declined",
};

const SHIFT_STATUS_LABELS: Record<CaregiverShiftStatus, string> = {
  scheduled: "Scheduled",
  checked_in: "Checked in",
  completed: "Completed",
  missed: "Missed",
};

const ACTIVITY_TYPE_LABELS: Record<CaregiverActivityType, string> = {
  task_completed: "Task completed",
  medication_assistance: "Medication assistance",
  check_in: "Check in",
  check_out: "Check out",
  report: "Report",
  handover: "Handover",
};

const VERIFICATION_NOTE =
  "Verified means the family has recorded a result from an authorised check. Nanu's AI does not verify identity or background.";
const ATTENDANCE_NOTE = "Attendance is recorded by the caregiver's check-in and is not proof of care on its own.";
const OWNER_ONLY_NOTE = "Only the family owner can change caregiver approval or schedules.";

const shiftSchema = z.object({
  caregiverUserId: z.string().min(1, "Choose an approved caregiver."),
  scheduledStart: z.string().min(1, "Enter a start time."),
  scheduledEnd: z.string().min(1, "Enter an end time."),
});

type ShiftFormValues = z.infer<typeof shiftSchema>;

function errorMessage(err: unknown): string {
  return err instanceof Error && err.message ? err.message : "Something went wrong. Please try again.";
}

function formatDateTime(iso: string | null): string {
  if (!iso) return "Not recorded";
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleString();
}

/** Turns a zod schema for one field into a react-hook-form validate rule. */
function fieldRule(schema: z.ZodTypeAny) {
  return (value: unknown) => {
    const result = schema.safeParse(value);
    return result.success || result.error.issues[0]?.message || "Check this field.";
  };
}

export default function CaregiverManagementPage() {
  const { user, family, membership, elder, isDemo } = useAuth();
  const [profiles, setProfiles] = useState<CaregiverProfile[]>([]);
  const [members, setMembers] = useState<MemberView[]>([]);
  const [shifts, setShifts] = useState<CaregiverShift[]>([]);
  const [activity, setActivity] = useState<CaregiverActivityLog[]>([]);
  // Set on each reload so "now" is read outside render (used to decide when a shift can be marked missed).
  const [nowMs, setNowMs] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [shiftError, setShiftError] = useState<string | null>(null);

  const familyId = family?.id ?? null;
  const isOwner = membership?.role === "owner";
  const canDispute = membership?.role === "owner" || membership?.role === "family_member";

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ShiftFormValues>({
    defaultValues: { caregiverUserId: "", scheduledStart: "", scheduledEnd: "" },
  });

  const reload = useCallback(() => {
    if (!familyId) return;
    setProfiles(listCaregiverProfiles(familyId));
    setMembers(listMembers(familyId));
    setShifts(listShifts(familyId));
    setActivity(listCaregiverActivity(familyId));
    setNowMs(Date.now());
  }, [familyId]);

  useEffect(() => {
    reload();
  }, [reload]);

  if (!family || !user) {
    return (
      <main className="min-h-screen bg-ivory px-4 py-10 text-charcoal">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-3xl font-bold text-forest sm:text-4xl">Caregivers</h1>
          <p className="mt-4 text-lg leading-relaxed">Create or join a family to manage its caregivers.</p>
        </div>
      </main>
    );
  }

  const nameFor = (userId: string): string => {
    const member = members.find((m) => m.user_id === userId);
    return member?.full_name || "Unnamed caregiver";
  };

  const approvedCaregivers = profiles.filter((p) => p.family_approval === "approved");

  const onVerification = (caregiverUserId: string, kind: VerificationKind, status: VerificationStatus) => {
    setActionError(null);
    try {
      setVerificationStatus({
        familyId: family.id,
        caregiverUserId,
        actorId: user.id,
        kind,
        status,
      });
      reload();
    } catch (err) {
      setActionError(errorMessage(err));
    }
  };

  const onApproval = (caregiverUserId: string, decision: "approved" | "declined") => {
    setActionError(null);
    try {
      setFamilyApproval({ familyId: family.id, caregiverUserId, actorId: user.id, decision });
      reload();
    } catch (err) {
      setActionError(errorMessage(err));
    }
  };

  const onMissed = (shiftId: string) => {
    setActionError(null);
    try {
      markShiftMissed(shiftId, user.id);
      reload();
    } catch (err) {
      setActionError(errorMessage(err));
    }
  };

  const onDispute = (activityId: string, disputed: boolean) => {
    setActionError(null);
    try {
      setActivityDisputed(activityId, user.id, disputed);
      reload();
    } catch (err) {
      setActionError(errorMessage(err));
    }
  };

  const onShift = (values: ShiftFormValues) => {
    setShiftError(null);
    if (!elder) {
      setShiftError("No elder profile was found for this family.");
      return;
    }
    try {
      createShift({
        familyId: family.id,
        elderId: elder.id,
        caregiverUserId: values.caregiverUserId,
        actorId: user.id,
        scheduledStart: values.scheduledStart,
        scheduledEnd: values.scheduledEnd,
      });
      reset({ caregiverUserId: "", scheduledStart: "", scheduledEnd: "" });
      reload();
    } catch (err) {
      setShiftError(errorMessage(err));
    }
  };

  const selectClass =
    "mt-2 block min-h-12 w-full rounded-lg border border-sage bg-white px-4 py-3 text-lg text-charcoal focus:border-forest focus:outline-none focus:ring-2 focus:ring-forest";
  const inputClass = selectClass;
  const primaryButton =
    "min-h-12 rounded-lg bg-forest px-6 py-3 text-lg font-semibold text-ivory hover:bg-sage hover:text-charcoal disabled:opacity-60";
  const secondaryButton =
    "min-h-12 rounded-lg border border-forest px-6 py-3 text-lg font-semibold text-forest hover:bg-sage hover:text-charcoal disabled:opacity-60";
  const alertClass = "rounded-lg border border-forest bg-white p-4 text-base text-forest";

  return (
    <main className="min-h-screen bg-ivory px-4 py-10 text-charcoal">
      <div className="mx-auto max-w-3xl space-y-10">
        <header>
          <h1 className="text-3xl font-bold text-forest sm:text-4xl">Caregivers</h1>
          <p className="mt-2 text-lg leading-relaxed">{family.name}</p>
          {isDemo && (
            <p className="mt-4 rounded-lg border border-sage bg-white p-4 text-base">
              Demo mode — data is stored only in this browser.
            </p>
          )}
          {!isOwner && (
            <p className="mt-4 rounded-lg border border-sage bg-white p-4 text-base">{OWNER_ONLY_NOTE}</p>
          )}
          {actionError && (
            <p role="alert" className={`mt-4 ${alertClass}`}>
              {actionError}
            </p>
          )}
        </header>

        <section aria-labelledby="caregivers-heading" className="space-y-4">
          <h2 id="caregivers-heading" className="text-2xl font-semibold text-forest">
            Caregivers
          </h2>
          <p className="rounded-lg border border-sage bg-white p-4 text-base leading-relaxed">{VERIFICATION_NOTE}</p>

          {profiles.length === 0 ? (
            <p className="rounded-lg border border-sage bg-white p-4 text-base">No caregiver profiles yet.</p>
          ) : (
            <ul className="space-y-3">
              {profiles.map((p) => {
                const name = nameFor(p.user_id);
                return (
                  <li key={p.id} className="space-y-4 rounded-lg border border-sage bg-white p-4">
                    <div>
                      <p className="text-lg font-semibold">{name}</p>
                      <p className="text-base">Family approval: {APPROVAL_LABELS[p.family_approval]}</p>
                    </div>

                    <div className="space-y-3">
                      {VERIFICATION_ROWS.map((row) => {
                        const selectId = `${p.id}-${row.kind}`;
                        const current = p[row.field];
                        return (
                          <div key={row.kind}>
                            <label htmlFor={selectId} className="text-base font-semibold">
                              {row.label} check for {name}
                            </label>
                            {isOwner ? (
                              <select
                                id={selectId}
                                value={current}
                                onChange={(e) =>
                                  onVerification(p.user_id, row.kind, e.target.value as VerificationStatus)
                                }
                                className={selectClass}
                              >
                                {VERIFICATION_OPTIONS.map((option) => (
                                  <option key={option} value={option}>
                                    {VERIFICATION_LABELS[option]}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <p id={selectId} className="mt-2 text-base">
                                {VERIFICATION_LABELS[current]}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {isOwner && (
                      <div className="flex flex-col gap-3 sm:flex-row">
                        <button
                          type="button"
                          aria-label={`Approve ${name}`}
                          disabled={p.family_approval === "approved"}
                          onClick={() => onApproval(p.user_id, "approved")}
                          className={primaryButton}
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          aria-label={`Decline ${name}`}
                          disabled={p.family_approval === "declined"}
                          onClick={() => onApproval(p.user_id, "declined")}
                          className={secondaryButton}
                        >
                          Decline
                        </button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section aria-labelledby="shifts-heading" className="space-y-4">
          <h2 id="shifts-heading" className="text-2xl font-semibold text-forest">
            Shifts
          </h2>
          <p className="rounded-lg border border-sage bg-white p-4 text-base leading-relaxed">{ATTENDANCE_NOTE}</p>

          {isOwner ? (
            <form
              onSubmit={handleSubmit(onShift)}
              noValidate
              aria-label="Schedule a shift"
              className="space-y-4 rounded-lg border border-sage bg-white p-4"
            >
              <div>
                <label htmlFor="shift-caregiver" className="text-lg font-semibold">
                  Caregiver
                </label>
                <select
                  id="shift-caregiver"
                  aria-invalid={errors.caregiverUserId ? "true" : "false"}
                  className={selectClass}
                  {...register("caregiverUserId", { validate: fieldRule(shiftSchema.shape.caregiverUserId) })}
                >
                  <option value="">Choose an approved caregiver</option>
                  {approvedCaregivers.map((p) => (
                    <option key={p.id} value={p.user_id}>
                      {nameFor(p.user_id)}
                    </option>
                  ))}
                </select>
                {approvedCaregivers.length === 0 && (
                  <p className="mt-2 text-base">Approve a caregiver above before scheduling a shift.</p>
                )}
                {errors.caregiverUserId && (
                  <p role="alert" className="mt-2 text-base text-forest">
                    {errors.caregiverUserId.message}
                  </p>
                )}
              </div>

              <p className="text-base">
                Elder: <span className="font-semibold">{elder?.display_name ?? "No elder profile"}</span>
              </p>

              <div>
                <label htmlFor="shift-start" className="text-lg font-semibold">
                  Scheduled start
                </label>
                <input
                  id="shift-start"
                  type="datetime-local"
                  aria-invalid={errors.scheduledStart ? "true" : "false"}
                  className={inputClass}
                  {...register("scheduledStart", { validate: fieldRule(shiftSchema.shape.scheduledStart) })}
                />
                {errors.scheduledStart && (
                  <p role="alert" className="mt-2 text-base text-forest">
                    {errors.scheduledStart.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="shift-end" className="text-lg font-semibold">
                  Scheduled end
                </label>
                <input
                  id="shift-end"
                  type="datetime-local"
                  aria-invalid={errors.scheduledEnd ? "true" : "false"}
                  className={inputClass}
                  {...register("scheduledEnd", { validate: fieldRule(shiftSchema.shape.scheduledEnd) })}
                />
                {errors.scheduledEnd && (
                  <p role="alert" className="mt-2 text-base text-forest">
                    {errors.scheduledEnd.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !elder || approvedCaregivers.length === 0}
                className={`${primaryButton} w-full`}
              >
                Schedule shift
              </button>

              {shiftError && (
                <p role="alert" className={alertClass}>
                  {shiftError}
                </p>
              )}
            </form>
          ) : (
            <p className="rounded-lg border border-sage bg-white p-4 text-base">{OWNER_ONLY_NOTE}</p>
          )}

          {shifts.length === 0 ? (
            <p className="rounded-lg border border-sage bg-white p-4 text-base">No shifts scheduled yet.</p>
          ) : (
            <ul className="space-y-3">
              {shifts.map((s) => {
                const ended = nowMs !== null && Date.parse(s.scheduled_end) < nowMs;
                const canMarkMissed = isOwner && s.status === "scheduled" && ended;
                return (
                  <li key={s.id} className="space-y-2 rounded-lg border border-sage bg-white p-4">
                    <p className="text-lg font-semibold">{nameFor(s.caregiver_user_id)}</p>
                    <p className="text-base">Status: {SHIFT_STATUS_LABELS[s.status]}</p>
                    <p className="text-base">
                      Scheduled: {formatDateTime(s.scheduled_start)} to {formatDateTime(s.scheduled_end)}
                    </p>
                    <p className="text-base">Check-in: {formatDateTime(s.check_in_at)}</p>
                    <p className="text-base">Check-out: {formatDateTime(s.check_out_at)}</p>
                    {canMarkMissed && (
                      <button
                        type="button"
                        onClick={() => onMissed(s.id)}
                        className={`${secondaryButton} mt-2`}
                      >
                        Mark missed
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section aria-labelledby="activity-heading" className="space-y-4">
          <h2 id="activity-heading" className="text-2xl font-semibold text-forest">
            Caregiver activity
          </h2>

          {activity.length === 0 ? (
            <p className="rounded-lg border border-sage bg-white p-4 text-base">No caregiver activity yet.</p>
          ) : (
            <ul className="space-y-3">
              {activity.map((a) => (
                <li
                  key={a.id}
                  className="flex flex-col gap-3 rounded-lg border border-sage bg-white p-4 sm:flex-row sm:items-start sm:justify-between"
                >
                  <div className="space-y-1">
                    <p className="text-lg font-semibold">
                      {nameFor(a.caregiver_user_id)} · {ACTIVITY_TYPE_LABELS[a.activity_type]}
                    </p>
                    <p className="text-base">{a.description}</p>
                    <p className="text-base">{formatDateTime(a.created_at)}</p>
                    {a.disputed && <p className="text-base font-semibold text-coral">Disputed</p>}
                  </div>
                  {canDispute && (
                    <button
                      type="button"
                      aria-pressed={a.disputed}
                      onClick={() => onDispute(a.id, !a.disputed)}
                      className={secondaryButton}
                    >
                      {a.disputed ? "Remove dispute" : "Dispute"}
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
