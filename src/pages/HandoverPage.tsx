import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useAuth } from "../features/auth/AuthContext";
import {
  acknowledgeHandover,
  generateCareHandover,
  listHandovers,
  listMembers,
  type MemberView,
} from "../lib/demoStore";
import type { CareHandover, CareHandoverStatus } from "../lib/types";

const createSchema = z.object({
  toUserId: z.string(),
});

type CreateValues = z.infer<typeof createSchema>;

const STATUS_LABELS: Record<CareHandoverStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  acknowledged: "Acknowledged",
};

const PARENT_LABELS: Record<string, string> = {
  taken: "Taken",
  skipped: "Skipped",
  unable_to_confirm: "Unable to confirm",
};

const ASSISTANCE_LABELS: Record<string, string> = {
  assisted: "Assisted",
  not_assisted: "Not assisted",
};

function errorMessage(err: unknown): string {
  return err instanceof Error && err.message ? err.message : "Something went wrong. Please try again.";
}

function formatDateTime(iso: string | null): string {
  if (!iso) return "Time not recorded";
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleString();
}

function memberLabel(m: MemberView): string {
  return m.full_name || m.email || "Unnamed member";
}

function parentLabel(value: string | null): string {
  if (value === null) return "Not recorded";
  return PARENT_LABELS[value] ?? value;
}

function assistanceLabel(value: string | null): string {
  if (value === null) return "Not recorded";
  return ASSISTANCE_LABELS[value] ?? value;
}

function SummarySection({
  id,
  title,
  isEmpty,
  children,
}: {
  id: string;
  title: string;
  isEmpty: boolean;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="space-y-2">
      <h3 id={id} className="text-lg font-semibold text-forest">
        {title}
      </h3>
      {isEmpty ? <p className="text-base">Nothing recorded</p> : children}
    </section>
  );
}

interface HandoverCardProps {
  handover: CareHandover;
  nameFor: (userId: string | null) => string;
  onAcknowledge: (handoverId: string) => void;
}

function HandoverCard({ handover, nameFor, onAcknowledge }: HandoverCardProps) {
  const summary = handover.summary_json;
  const isAcknowledged = handover.status === "acknowledged";

  return (
    <li className="space-y-5 rounded-lg border border-sage bg-white p-4">
      <dl className="grid grid-cols-1 gap-x-4 gap-y-1 text-base sm:grid-cols-2">
        <div>
          <dt className="inline font-semibold">Generated: </dt>
          <dd className="inline">{formatDateTime(handover.created_at)}</dd>
        </div>
        <div>
          <dt className="inline font-semibold">Status: </dt>
          <dd className="inline">{STATUS_LABELS[handover.status]}</dd>
        </div>
        <div>
          <dt className="inline font-semibold">Next caregiver: </dt>
          <dd className="inline">{handover.to_user_id ? nameFor(handover.to_user_id) : "Not named"}</dd>
        </div>
        {isAcknowledged && (
          <div className="sm:col-span-2">
            <dt className="inline font-semibold">Acknowledged by: </dt>
            <dd className="inline">
              {nameFor(handover.acknowledged_by)} on {formatDateTime(handover.acknowledged_at)}
            </dd>
          </div>
        )}
      </dl>

      <SummarySection
        id={`${handover.id}-completed`}
        title="Completed tasks"
        isEmpty={summary.completed_tasks.length === 0}
      >
        <ul className="list-disc space-y-1 pl-6 text-base">
          {summary.completed_tasks.map((t) => (
            <li key={t.id} className="break-words">
              {t.title}
            </li>
          ))}
        </ul>
      </SummarySection>

      <SummarySection
        id={`${handover.id}-medication`}
        title="Medication confirmations"
        isEmpty={summary.medication_confirmations.length === 0}
      >
        <ul className="space-y-3 text-base">
          {summary.medication_confirmations.map((m, index) => (
            <li key={`${m.scheduled_at}-${index}`} className="space-y-1 rounded-lg border border-sage p-3">
              <p className="font-semibold break-words">{m.medicine || "Medicine not recorded"}</p>
              <p>Scheduled: {formatDateTime(m.scheduled_at)}</p>
              <p>Parent confirmation: {parentLabel(m.parent_confirmation)}</p>
              <p>Caregiver assistance: {assistanceLabel(m.caregiver_assistance)}</p>
            </li>
          ))}
        </ul>
      </SummarySection>

      <SummarySection
        id={`${handover.id}-pending`}
        title="Pending tasks"
        isEmpty={summary.pending_tasks.length === 0}
      >
        <ul className="space-y-1 text-base">
          {summary.pending_tasks.map((t) => (
            <li key={t.id} className="break-words">
              {t.title}
              {t.overdue && <span className="ml-2 font-semibold text-forest">Overdue</span>}
            </li>
          ))}
        </ul>
      </SummarySection>

      <SummarySection
        id={`${handover.id}-appointments`}
        title="Upcoming appointments"
        isEmpty={summary.upcoming_appointments.length === 0}
      >
        <ul className="list-disc space-y-1 pl-6 text-base">
          {summary.upcoming_appointments.map((a) => (
            <li key={a.id} className="break-words">
              {a.title} — {formatDateTime(a.scheduled_at)}
            </li>
          ))}
        </ul>
      </SummarySection>

      <SummarySection
        id={`${handover.id}-notes`}
        title="Caregiver notes"
        isEmpty={summary.caregiver_notes.length === 0}
      >
        <ul className="list-disc space-y-1 pl-6 text-base">
          {summary.caregiver_notes.map((note, index) => (
            <li key={index} className="break-words">
              {note}
            </li>
          ))}
        </ul>
      </SummarySection>

      <SummarySection
        id={`${handover.id}-issues`}
        title="Unresolved issues"
        isEmpty={summary.unresolved_issues.length === 0}
      >
        <ul className="list-disc space-y-1 pl-6 text-base">
          {summary.unresolved_issues.map((issue, index) => (
            <li key={index} className="break-words">
              {issue}
            </li>
          ))}
        </ul>
      </SummarySection>

      {handover.status === "sent" && (
        <button
          type="button"
          onClick={() => onAcknowledge(handover.id)}
          aria-label={`Acknowledge handover from ${formatDateTime(handover.created_at)}`}
          className="min-h-12 w-full rounded-lg bg-forest px-6 py-3 text-lg font-semibold text-ivory hover:bg-sage hover:text-charcoal sm:w-auto"
        >
          Acknowledge
        </button>
      )}
    </li>
  );
}

export default function HandoverPage() {
  const { user, family, elder, membership } = useAuth();
  const [handovers, setHandovers] = useState<CareHandover[]>([]);
  const [members, setMembers] = useState<MemberView[]>([]);
  const [createError, setCreateError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const familyId = family?.id ?? null;
  const canCreate = membership?.role === "owner" || membership?.role === "family_member";

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<CreateValues>({
    defaultValues: { toUserId: "" },
  });

  const load = useCallback(() => {
    if (!familyId) return;
    try {
      setHandovers(listHandovers(familyId));
      setMembers(listMembers(familyId));
    } catch (err) {
      setActionError(errorMessage(err));
    }
  }, [familyId]);

  useEffect(() => {
    load();
  }, [load]);

  const nameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const m of members) map.set(m.user_id, memberLabel(m));
    return map;
  }, [members]);

  const nextCaregivers = members.filter((m) => m.role === "caregiver" && m.status === "active");

  if (!family || !user) {
    return (
      <main className="min-h-screen bg-ivory px-4 py-10 text-charcoal">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-3xl font-bold text-forest sm:text-4xl">Care handover</h1>
          <p className="mt-4 text-lg leading-relaxed">Create or join a family to see care handovers.</p>
        </div>
      </main>
    );
  }

  const nameFor = (userId: string | null): string => {
    if (!userId) return "Unknown";
    return nameById.get(userId) ?? "Unknown member";
  };

  const onCreate = (values: CreateValues) => {
    setCreateError(null);
    const parsed = createSchema.safeParse(values);
    if (!parsed.success) {
      setCreateError(parsed.error.issues[0]?.message ?? "Check the form and try again.");
      return;
    }
    try {
      if (!elder) {
        throw new Error("Add the elder's profile before creating a handover.");
      }
      generateCareHandover({
        familyId: family.id,
        elderId: elder.id,
        fromUserId: user.id,
        toUserId: parsed.data.toUserId || null,
      });
      reset();
      load();
    } catch (err) {
      setCreateError(errorMessage(err));
    }
  };

  const onAcknowledge = (handoverId: string) => {
    setActionError(null);
    try {
      acknowledgeHandover(handoverId, user.id);
      load();
    } catch (err) {
      setActionError(errorMessage(err));
    }
  };

  const inputClass =
    "mt-2 block min-h-12 w-full rounded-lg border border-sage bg-white px-4 py-3 text-lg text-charcoal focus:border-forest focus:outline-none focus:ring-2 focus:ring-forest";
  const sectionClass = "space-y-4";
  const emptyClass = "rounded-lg border border-sage bg-white p-4 text-base";

  return (
    <main className="min-h-screen bg-ivory px-4 py-10 text-charcoal">
      <div className="mx-auto max-w-3xl space-y-10">
        <header>
          <h1 className="text-3xl font-bold text-forest sm:text-4xl">Care handover</h1>
          <p className="mt-2 text-lg leading-relaxed">{family.name}</p>
          <p className="mt-4 rounded-lg border border-sage bg-white p-4 text-base">
            This summary is built only from recorded entries. It does not confirm that any care happened beyond
            what was recorded.
          </p>
        </header>

        {actionError && (
          <p role="alert" className="rounded-lg border border-forest bg-white p-4 text-base text-forest">
            {actionError}
          </p>
        )}

        <section aria-labelledby="list-heading" className={sectionClass}>
          <h2 id="list-heading" className="text-2xl font-semibold text-forest">
            Handovers
          </h2>
          {handovers.length === 0 ? (
            <p className={emptyClass}>No care handovers yet.</p>
          ) : (
            <ul className="space-y-6">
              {handovers.map((handover) => (
                <HandoverCard
                  key={handover.id}
                  handover={handover}
                  nameFor={nameFor}
                  onAcknowledge={onAcknowledge}
                />
              ))}
            </ul>
          )}
        </section>

        {canCreate && (
          <section aria-labelledby="create-heading" className={sectionClass}>
            <h2 id="create-heading" className="text-2xl font-semibold text-forest">
              Create handover
            </h2>
            <form
              onSubmit={handleSubmit(onCreate)}
              noValidate
              className="space-y-4 rounded-lg border border-sage bg-white p-4"
            >
              <div>
                <label htmlFor="handover-next-caregiver" className="text-lg font-semibold">
                  Next caregiver (optional)
                </label>
                <select id="handover-next-caregiver" className={inputClass} {...register("toUserId")}>
                  <option value="">Not named</option>
                  {nextCaregivers.map((m) => (
                    <option key={m.id} value={m.user_id}>
                      {memberLabel(m)}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="min-h-12 w-full rounded-lg bg-forest px-6 py-3 text-lg font-semibold text-ivory hover:bg-sage hover:text-charcoal disabled:opacity-60"
              >
                Create handover
              </button>

              {createError && (
                <p role="alert" className="rounded-lg border border-forest bg-white p-4 text-base text-forest">
                  {createError}
                </p>
              )}
            </form>
          </section>
        )}
      </div>
    </main>
  );
}
