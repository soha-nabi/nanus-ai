import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useAuth } from "../../features/auth/AuthContext";
import DemoRoleSwitcher from "../../components/DemoRoleSwitcher";
import CaregiverNav from "../../components/CaregiverNav";
import {
  addCaregiverActivity,
  getFamily,
  listAssignedElders,
  listCaregiverActivity,
  listCaregiverExpenses,
  createCaregiverExpense,
} from "../../lib/demoStore";
import type {
  CaregiverActivityLog,
  CaregiverActivityType,
  CaregiverExpenseRecord,
  CaregiverExpenseCategory,
} from "../../lib/types";

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

function checkDescription(value: string): true | string {
  const result = descriptionSchema.safeParse(value);
  return result.success ? true : (result.error.issues[0]?.message ?? "Enter a description.");
}

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
  const { user } = useAuth();
  const [data, setData] = useState<ActivityData>(() => loadActivity(user?.id ?? null));
  const [expenses, setExpenses] = useState<CaregiverExpenseRecord[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  // Expense form state
  const [expenseAmount, setExpenseAmount] = useState<string>("");
  const [expenseCategory, setExpenseCategory] = useState<CaregiverExpenseCategory>("medication_purchase");
  const [expenseDescription, setExpenseDescription] = useState<string>("");
  const [expenseReceipt, setExpenseReceipt] = useState<string>("");
  const [expenseError, setExpenseError] = useState<string | null>(null);
  const [expenseSuccess, setExpenseSuccess] = useState<string | null>(null);

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

  const reload = () => {
    if (!user) return;
    setData(loadActivity(user.id));
    if (data.families[0]?.id) {
      setExpenses(listCaregiverExpenses(data.families[0].id));
    }
  };

  useEffect(() => {
    if (data.families[0]?.id) {
      setExpenses(listCaregiverExpenses(data.families[0].id));
    }
  }, [data.families]);

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

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    setExpenseError(null);
    setExpenseSuccess(null);

    const activeFamilyId = data.families[0]?.id;
    if (!activeFamilyId) {
      setExpenseError("No approved family assigned.");
      return;
    }

    const amt = parseFloat(expenseAmount);
    if (isNaN(amt) || amt <= 0) {
      setExpenseError("Please enter a valid positive expense amount.");
      return;
    }

    try {
      createCaregiverExpense({
        familyId: activeFamilyId,
        elderId: "demo-elder-rajesh",
        caregiverUserId: user.id,
        category: expenseCategory,
        amount: amt,
        currency: "INR",
        description: expenseDescription,
        receiptName: expenseReceipt || null,
      });

      setExpenseAmount("");
      setExpenseDescription("");
      setExpenseReceipt("");
      setExpenseSuccess("Care expense logged successfully. Family notified for reimbursement.");
      setExpenses(listCaregiverExpenses(activeFamilyId));
    } catch (err) {
      setExpenseError(errorMessage(err));
    }
  };

  const emptyClass = "rounded-lg border border-sage bg-white p-4 text-base";
  const inputClass =
    "mt-2 block min-h-12 w-full rounded-lg border border-sage bg-white px-4 py-3 text-sm text-charcoal focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest";
  const buttonClass =
    "min-h-12 w-full rounded-lg bg-forest px-6 py-3 text-sm font-semibold text-ivory hover:bg-forest/90 disabled:opacity-60 transition-colors shadow-sm sm:w-auto";

  return (
    <div className="min-h-screen bg-ivory text-charcoal">
      <DemoRoleSwitcher />
      <CaregiverNav />

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 space-y-10">
        <header className="border-b border-sage/40 pb-4">
          <h1 className="font-serif text-3xl font-bold text-forest sm:text-4xl">
            Care Activity & Expense Logs
          </h1>
          <p className="mt-1 text-sm text-charcoal/80">
            Log shift tasks, medication assistance, daily observations, and out-of-pocket care expenses.
          </p>
        </header>

        {/* Section 1: Record Care Activity */}
        <section aria-labelledby="record-heading" className="space-y-4">
          <h2 id="record-heading" className="font-serif text-2xl font-bold text-forest">
            Record Daily Care Entry
          </h2>
          <p className="rounded-lg border border-sage bg-white p-3.5 text-xs sm:text-sm text-charcoal/80">
            Caregiver entries represent personal shift logs. They are audited and time-stamped for family transparency.
          </p>

          {data.families.length === 0 ? (
            <p className={emptyClass}>
              You are not assigned to any family yet. Assignments appear once the family approves you.
            </p>
          ) : (
            <form
              onSubmit={handleSubmit(onSubmit)}
              noValidate
              className="space-y-4 rounded-xl border border-sage bg-white p-6 shadow-sm"
            >
              <div>
                <label htmlFor="activity-family" className="text-xs font-semibold text-charcoal uppercase tracking-wider">
                  Assigned Family
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
                <label htmlFor="activity-type" className="text-xs font-semibold text-charcoal uppercase tracking-wider">
                  Care Activity Type
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
                <label htmlFor="activity-description" className="text-xs font-semibold text-charcoal uppercase tracking-wider">
                  Activity Description & Notes
                </label>
                <textarea
                  id="activity-description"
                  rows={3}
                  className={inputClass}
                  aria-invalid={errors.description ? "true" : "false"}
                  aria-describedby={errors.description ? "activity-desc-error" : undefined}
                  {...register("description", { validate: checkDescription })}
                />
                {errors.description && (
                  <p id="activity-desc-error" role="alert" className="mt-1 text-xs text-coral">
                    {errors.description.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="activity-evidence" className="text-xs font-semibold text-charcoal uppercase tracking-wider">
                  Evidence Attachment / Reference Name (Optional)
                </label>
                <input
                  id="activity-evidence"
                  type="text"
                  placeholder="e.g. morning-bp-reading-photo.jpg"
                  className={inputClass}
                  {...register("evidenceName")}
                />
              </div>

              <button type="submit" disabled={isSubmitting} className={buttonClass}>
                Save Care Entry
              </button>

              {formError && (
                <p role="alert" className="rounded-lg border border-coral bg-coral/10 p-3 text-xs text-charcoal">
                  {formError}
                </p>
              )}
              {savedMessage && (
                <p className="rounded-lg border border-forest/30 bg-forest/10 p-3 text-xs text-forest font-semibold">
                  ✓ {savedMessage}
                </p>
              )}
            </form>
          )}
        </section>

        {/* Section 2: Caregiver Expense Reimbursement (Module 3 requirement) */}
        <section aria-labelledby="expense-heading" className="border-t border-sage/60 pt-8 space-y-4">
          <div className="flex items-center justify-between">
            <h2 id="expense-heading" className="font-serif text-2xl font-bold text-forest">
              Log Out-of-Pocket Care Expense
            </h2>
            <span className="text-xs rounded-full bg-forest/10 px-3 py-1 font-semibold text-forest">
              Direct Reimbursement Tracker
            </span>
          </div>

          <form
            onSubmit={handleCreateExpense}
            className="space-y-4 rounded-xl border border-sage bg-white p-6 shadow-sm"
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="expense-amount" className="text-xs font-semibold text-charcoal uppercase tracking-wider">
                  Amount (₹ INR)
                </label>
                <input
                  id="expense-amount"
                  type="number"
                  step="0.01"
                  min="1"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  placeholder="e.g. 450"
                  className={inputClass}
                  required
                />
              </div>

              <div>
                <label htmlFor="expense-cat" className="text-xs font-semibold text-charcoal uppercase tracking-wider">
                  Expense Category
                </label>
                <select
                  id="expense-cat"
                  value={expenseCategory}
                  onChange={(e) => setExpenseCategory(e.target.value as CaregiverExpenseCategory)}
                  className={inputClass}
                >
                  <option value="medication_purchase">Medication / Pharmacy Purchase</option>
                  <option value="groceries_supplies">Groceries & Dietary Supplies</option>
                  <option value="medical_transport">Medical Transport / Cab</option>
                  <option value="clinic_copay">Clinic Consultation Copay</option>
                  <option value="other">Other Incidentals</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="expense-desc" className="text-xs font-semibold text-charcoal uppercase tracking-wider">
                Purpose & Item Details
              </label>
              <input
                id="expense-desc"
                type="text"
                value={expenseDescription}
                onChange={(e) => setExpenseDescription(e.target.value)}
                placeholder="e.g. Purchased bandage rolls and pain relief spray from Apollo Pharmacy"
                className={inputClass}
                required
              />
            </div>

            <div>
              <label htmlFor="expense-receipt" className="text-xs font-semibold text-charcoal uppercase tracking-wider">
                Receipt File Reference (Optional)
              </label>
              <input
                id="expense-receipt"
                type="text"
                value={expenseReceipt}
                onChange={(e) => setExpenseReceipt(e.target.value)}
                placeholder="e.g. apollo-receipt-bill-nov2026.pdf"
                className={inputClass}
              />
            </div>

            <button type="submit" className={buttonClass}>
              Submit Expense for Family Approval
            </button>

            {expenseError && (
              <p role="alert" className="rounded-lg border border-coral bg-coral/10 p-3 text-xs text-charcoal">
                {expenseError}
              </p>
            )}
            {expenseSuccess && (
              <p className="rounded-lg border border-forest/30 bg-forest/10 p-3 text-xs text-forest font-semibold">
                ✓ {expenseSuccess}
              </p>
            )}
          </form>

          {/* List of expenses */}
          <div className="mt-4 space-y-3">
            <h3 className="font-serif text-lg font-bold text-forest">Submitted Expenses</h3>
            {expenses.length === 0 ? (
              <p className={emptyClass}>No out-of-pocket expenses logged yet.</p>
            ) : (
              <ul className="space-y-3">
                {expenses.map((exp) => (
                  <li
                    key={exp.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between rounded-xl border border-sage bg-white p-4 gap-2"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-base text-forest">
                          ₹{exp.amount.toFixed(2)}
                        </span>
                        <span className="rounded bg-sage/30 px-2 py-0.5 text-xs capitalize text-charcoal">
                          {exp.category.replace("_", " ")}
                        </span>
                      </div>
                      <p className="text-sm text-charcoal mt-1">{exp.description}</p>
                      {exp.receipt_name && (
                        <p className="text-xs text-charcoal/60 mt-0.5">Receipt: {exp.receipt_name}</p>
                      )}
                    </div>

                    <div className="shrink-0 text-left sm:text-right">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          exp.status === "reimbursed"
                            ? "bg-forest/10 text-forest"
                            : exp.status === "disputed"
                            ? "bg-coral/20 text-coral"
                            : "bg-amber-100 text-amber-900"
                        }`}
                      >
                        {exp.status.replace("_", " ")}
                      </span>
                      <p className="text-[11px] text-charcoal/50 mt-1">
                        {formatDateTime(exp.created_at)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* Section 3: Care Activity History */}
        <section aria-labelledby="log-heading" className="border-t border-sage/60 pt-8 space-y-4">
          <h2 id="log-heading" className="font-serif text-2xl font-bold text-forest">
            Care Activity History ({data.logs.length})
          </h2>
          {data.logs.length === 0 ? (
            <p className={emptyClass}>No entries yet.</p>
          ) : (
            <ul className="space-y-3">
              {data.logs.map((log) => (
                <li key={log.id} className="space-y-2 rounded-xl border border-sage bg-white p-5 shadow-sm">
                  {log.disputed && (
                    <p className="inline-flex items-center gap-2 text-xs font-semibold text-coral">
                      <span aria-hidden="true" className="inline-block h-2.5 w-2.5 rounded-full bg-coral" />
                      Disputed by family
                    </p>
                  )}
                  <div className="flex items-center justify-between border-b border-sage/30 pb-2">
                    <p className="text-base font-bold text-forest">{ACTIVITY_LABELS[log.activity_type]}</p>
                    <span className="text-xs text-charcoal/60">{formatDateTime(log.created_at)}</span>
                  </div>
                  <p className="text-sm text-charcoal leading-relaxed">{log.description}</p>
                  {log.evidence_name && (
                    <div className="text-xs text-charcoal/70 bg-ivory/50 p-2 rounded border border-sage/40">
                      Evidence reference: <span className="font-mono text-forest">{log.evidence_name}</span>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
