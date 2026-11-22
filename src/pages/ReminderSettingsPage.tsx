import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useAuth } from "../features/auth/AuthContext";
import {
  listMembers,
  listNotificationPreferences,
  listReminderRules,
  setNotificationPreference,
  type MemberView,
  upsertReminderRule,
} from "../lib/demoStore";
import type { ReminderRule } from "../lib/types";

// wellness_missed is deliberately not offered: demo data does not implement it.
const RULE_KINDS = ["medication_unconfirmed", "shift_missed", "task_overdue", "appointment_upcoming"] as const;
type RuleKind = (typeof RULE_KINDS)[number];

const RULE_KIND_LABELS: Record<RuleKind, string> = {
  medication_unconfirmed: "Medicine not confirmed",
  shift_missed: "Missed shift check-in",
  task_overdue: "Overdue task",
  appointment_upcoming: "Upcoming appointment",
};

const NOTIFICATION_EVENT_TYPES = ["task_overdue", "shift_missed", "medication_unconfirmed", "appointment_upcoming"] as const;
type NotificationEventType = (typeof NOTIFICATION_EVENT_TYPES)[number];

const NOTIFICATION_EVENT_LABELS: Record<NotificationEventType, string> = {
  task_overdue: "Overdue tasks",
  shift_missed: "Missed shift check-ins",
  medication_unconfirmed: "Medicine not confirmed",
  appointment_upcoming: "Upcoming appointments",
};

const minutesSchema = z
  .string()
  .trim()
  .regex(/^\d+$/, "Enter whole minutes from 0 to 1440.")
  .refine((value) => Number(value) <= 1440, "Enter whole minutes from 0 to 1440.");

const ruleSchema = z.object({
  kind: z.enum(RULE_KINDS),
  minutes: minutesSchema,
  escalateToUserId: z.string(),
  enabled: z.boolean(),
});

type RuleFormValues = z.infer<typeof ruleSchema>;

function errorMessage(err: unknown): string {
  return err instanceof Error && err.message ? err.message : "Something went wrong. Please try again.";
}

function memberLabel(m: MemberView): string {
  return m.full_name || m.email || "Unnamed member";
}

export default function ReminderSettingsPage() {
  const { user, family, membership, isDemo } = useAuth();
  const [rules, setRules] = useState<ReminderRule[]>([]);
  const [members, setMembers] = useState<MemberView[]>([]);
  const [prefs, setPrefs] = useState<Record<string, boolean>>({});
  const [ruleError, setRuleError] = useState<string | null>(null);
  const [prefError, setPrefError] = useState<string | null>(null);

  const familyId = family?.id ?? null;
  const userId = user?.id ?? null;
  const isOwner = membership?.role === "owner";

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<RuleFormValues>({
    defaultValues: {
      kind: RULE_KINDS[0],
      minutes: "30",
      escalateToUserId: "",
      enabled: true,
    },
  });

  const reload = useCallback(() => {
    if (!familyId || !userId) return;
    try {
      setRules(listReminderRules(familyId));
      setMembers(listMembers(familyId));
      const map: Record<string, boolean> = {};
      for (const p of listNotificationPreferences(userId)) {
        map[p.event_type] = p.enabled;
      }
      setPrefs(map);
    } catch (err) {
      setRuleError(errorMessage(err));
    }
  }, [familyId, userId]);

  useEffect(() => {
    reload();
  }, [reload]);

  if (!family || !user) {
    return (
      <main className="min-h-screen bg-ivory px-4 py-10 text-charcoal">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-3xl font-bold text-forest sm:text-4xl">Reminder settings</h1>
          <p className="mt-4 text-lg leading-relaxed">Create or join a family to see reminder settings.</p>
        </div>
      </main>
    );
  }

  // Escalation targets: the owner and family members only.
  const escalationOptions = members.filter(
    (m) => m.status === "active" && (m.role === "owner" || m.role === "family_member"),
  );

  const memberNameFor = (id: string | null): string => {
    if (!id) return "No one";
    const m = members.find((mv) => mv.user_id === id);
    return m ? memberLabel(m) : "Unknown member";
  };

  const onSaveRule = (values: RuleFormValues) => {
    setRuleError(null);
    if (!isOwner) return;
    const parsed = ruleSchema.safeParse(values);
    if (!parsed.success) {
      setRuleError(parsed.error.issues[0]?.message ?? "Check the form and try again.");
      return;
    }
    try {
      upsertReminderRule({
        familyId: family.id,
        actorId: user.id,
        kind: parsed.data.kind,
        minutesBeforeOrAfter: Number(parsed.data.minutes),
        escalateToUserId: parsed.data.escalateToUserId || null,
        enabled: parsed.data.enabled,
      });
      reset();
      reload();
    } catch (err) {
      setRuleError(errorMessage(err));
    }
  };

  const onTogglePreference = (eventType: NotificationEventType, enabled: boolean) => {
    setPrefError(null);
    try {
      setNotificationPreference(user.id, eventType, enabled);
      reload();
    } catch (err) {
      setPrefError(errorMessage(err));
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
          <h1 className="text-3xl font-bold text-forest sm:text-4xl">Reminder settings</h1>
          <p className="mt-2 text-lg leading-relaxed">{family.name}</p>
          {isDemo && (
            <p className="mt-4 rounded-lg border border-sage bg-white p-4 text-base">
              Demo mode — data is stored only in this browser.
            </p>
          )}
        </header>

        {ruleError && (
          <p role="alert" className="rounded-lg border border-forest bg-white p-4 text-base text-forest">
            {ruleError}
          </p>
        )}

        <section aria-labelledby="rules-heading" className={sectionClass}>
          <h2 id="rules-heading" className="text-2xl font-semibold text-forest">
            Family reminder rules
          </h2>
          {!isOwner && (
            <p className={emptyClass}>Only the family owner can change reminder settings.</p>
          )}
          {rules.length === 0 ? (
            <p className={emptyClass}>No reminder rules yet.</p>
          ) : (
            <ul className="space-y-3">
              {rules.map((rule) => (
                <li key={rule.id} className="space-y-2 rounded-lg border border-sage bg-white p-4">
                  <p className="text-lg font-semibold">
                    {RULE_KIND_LABELS[rule.kind as RuleKind] ?? rule.kind}
                  </p>
                  <dl className="grid grid-cols-1 gap-x-4 gap-y-1 text-base sm:grid-cols-2">
                    <div>
                      <dt className="inline font-semibold">Minutes before or after: </dt>
                      <dd className="inline">{rule.minutes_before_or_after}</dd>
                    </div>
                    <div>
                      <dt className="inline font-semibold">Escalate to: </dt>
                      <dd className="inline">{memberNameFor(rule.escalate_to_user_id)}</dd>
                    </div>
                    <div>
                      <dt className="inline font-semibold">Status: </dt>
                      <dd className="inline">{rule.enabled ? "On" : "Off"}</dd>
                    </div>
                  </dl>
                </li>
              ))}
            </ul>
          )}
        </section>

        {isOwner && (
          <section aria-labelledby="rule-form-heading" className={sectionClass}>
            <h2 id="rule-form-heading" className="text-2xl font-semibold text-forest">
              Add or update a rule
            </h2>
            <form
              onSubmit={handleSubmit(onSaveRule)}
              noValidate
              className="space-y-4 rounded-lg border border-sage bg-white p-4"
            >
              <div>
                <label htmlFor="rule-kind" className="text-lg font-semibold">
                  Reminder type
                </label>
                <select id="rule-kind" className={inputClass} {...register("kind")}>
                  {RULE_KINDS.map((k) => (
                    <option key={k} value={k}>
                      {RULE_KIND_LABELS[k]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="rule-minutes" className="text-lg font-semibold">
                  Minutes before or after (0 to 1440)
                </label>
                <input
                  id="rule-minutes"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  className={inputClass}
                  {...register("minutes")}
                />
              </div>

              <div>
                <label htmlFor="rule-escalate" className="text-lg font-semibold">
                  Escalate to (optional)
                </label>
                <select id="rule-escalate" className={inputClass} {...register("escalateToUserId")}>
                  <option value="">No one</option>
                  {escalationOptions.map((m) => (
                    <option key={m.id} value={m.user_id}>
                      {memberLabel(m)}
                    </option>
                  ))}
                </select>
              </div>

              <label className="flex min-h-12 items-center gap-3 text-lg font-semibold">
                <input type="checkbox" className="h-6 w-6 accent-forest" {...register("enabled")} />
                Rule enabled
              </label>

              <button
                type="submit"
                disabled={isSubmitting}
                className="min-h-12 w-full rounded-lg bg-forest px-6 py-3 text-lg font-semibold text-ivory hover:bg-sage hover:text-charcoal disabled:opacity-60"
              >
                Save rule
              </button>
            </form>
          </section>
        )}

        <section aria-labelledby="prefs-heading" className={sectionClass}>
          <h2 id="prefs-heading" className="text-2xl font-semibold text-forest">
            Your notification preferences
          </h2>
          <p className={emptyClass}>
            Turning a notification off stops new ones of this type for you. It does not change any care record.
          </p>
          {prefError && (
            <p role="alert" className="rounded-lg border border-forest bg-white p-4 text-base text-forest">
              {prefError}
            </p>
          )}
          <ul className="space-y-3">
            {NOTIFICATION_EVENT_TYPES.map((eventType) => {
              const checked = prefs[eventType] ?? true;
              return (
                <li key={eventType} className="rounded-lg border border-sage bg-white p-4">
                  <label className="flex min-h-12 items-center gap-3 text-lg font-semibold">
                    <input
                      type="checkbox"
                      className="h-6 w-6 accent-forest"
                      checked={checked}
                      onChange={(e) => onTogglePreference(eventType, e.target.checked)}
                    />
                    {NOTIFICATION_EVENT_LABELS[eventType]}
                  </label>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </main>
  );
}
