import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useAuth } from "../features/auth/AuthContext";
import { completeTask, createTask, listMembers, listTasks, type MemberView, type TaskView } from "../lib/demoStore";
import type { CareTaskCategory, CareTaskPriority } from "../lib/types";

const CATEGORIES = ["medication", "appointment", "household", "health", "other"] as const;
const PRIORITIES = ["low", "normal", "high"] as const;

const CATEGORY_LABELS: Record<CareTaskCategory, string> = {
  medication: "Medication",
  appointment: "Appointment",
  household: "Household",
  health: "Health",
  other: "Other",
};

const PRIORITY_LABELS: Record<CareTaskPriority, string> = {
  low: "Low priority",
  normal: "Normal priority",
  high: "High priority",
};

const titleSchema = z.string().trim().min(3, "Title must be at least 3 characters.");

const taskSchema = z.object({
  title: titleSchema,
  description: z.string(),
  category: z.enum(CATEGORIES),
  assignedTo: z.string(),
  dueAt: z.string(),
  priority: z.enum(PRIORITIES),
});

type TaskFormValues = z.infer<typeof taskSchema>;

function errorMessage(err: unknown): string {
  return err instanceof Error && err.message ? err.message : "Something went wrong. Please try again.";
}

function formatDateTime(iso: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleString();
}

function memberLabel(m: MemberView): string {
  return m.full_name || m.email || "Unnamed member";
}

interface TaskItemProps {
  task: TaskView;
  assigneeName: string;
  onComplete?: (taskId: string) => void;
}

function TaskItem({ task, assigneeName, onComplete }: TaskItemProps) {
  const dueText = formatDateTime(task.due_at);
  const completedText = formatDateTime(task.completed_at);
  const isCompleted = task.status === "completed";

  return (
    <li
      className={`space-y-2 rounded-lg bg-white p-4 ${
        task.is_overdue ? "border-2 border-coral" : "border border-sage"
      }`}
    >
      {task.is_overdue && (
        <p className="inline-flex items-center gap-2 text-base font-semibold text-charcoal">
          <span aria-hidden="true" className="inline-block h-3 w-3 rounded-full bg-coral" />
          Overdue
        </p>
      )}
      <p className="text-lg font-semibold break-words">{task.title}</p>
      {task.description && <p className="text-base break-words">{task.description}</p>}
      <dl className="grid grid-cols-1 gap-x-4 gap-y-1 text-base sm:grid-cols-2">
        <div>
          <dt className="inline font-semibold">Category: </dt>
          <dd className="inline">{CATEGORY_LABELS[task.category]}</dd>
        </div>
        <div>
          <dt className="inline font-semibold">Priority: </dt>
          <dd className="inline">{PRIORITY_LABELS[task.priority]}</dd>
        </div>
        <div>
          <dt className="inline font-semibold">Assignee: </dt>
          <dd className="inline">{assigneeName}</dd>
        </div>
        <div>
          <dt className="inline font-semibold">Due: </dt>
          <dd className="inline">{dueText ?? "No due date"}</dd>
        </div>
        {isCompleted && (
          <div className="sm:col-span-2">
            <dt className="inline font-semibold">Completed: </dt>
            <dd className="inline">{completedText ?? "Time not recorded"}</dd>
          </div>
        )}
      </dl>
      {!isCompleted && onComplete && (
        <button
          type="button"
          onClick={() => onComplete(task.id)}
          aria-label={`Mark ${task.title} as complete`}
          className="min-h-12 w-full rounded-lg bg-forest px-6 py-3 text-lg font-semibold text-ivory hover:bg-sage hover:text-charcoal sm:w-auto"
        >
          Complete
        </button>
      )}
    </li>
  );
}

export default function CareTasksPage() {
  const { user, family, elder, membership, isDemo } = useAuth();
  const [tasks, setTasks] = useState<TaskView[]>([]);
  const [members, setMembers] = useState<MemberView[]>([]);
  const [createError, setCreateError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const familyId = family?.id ?? null;
  const canCreate = membership?.role === "owner" || membership?.role === "family_member";

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TaskFormValues>({
    defaultValues: {
      title: "",
      description: "",
      category: "other",
      assignedTo: "",
      dueAt: "",
      priority: "normal",
    },
  });

  const reload = useCallback(() => {
    if (!familyId) return;
    setTasks(listTasks(familyId));
    setMembers(listMembers(familyId));
  }, [familyId]);

  useEffect(() => {
    reload();
  }, [reload]);

  const nameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const m of members) map.set(m.user_id, memberLabel(m));
    return map;
  }, [members]);

  const overdueTasks = tasks.filter((t) => t.status === "open" && t.is_overdue);
  const openTasks = tasks.filter((t) => t.status === "open" && !t.is_overdue);
  const completedTasks = tasks.filter((t) => t.status === "completed");

  if (!family || !user) {
    return (
      <main className="min-h-screen bg-ivory px-4 py-10 text-charcoal">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-3xl font-bold text-forest sm:text-4xl">Care tasks</h1>
          <p className="mt-4 text-lg leading-relaxed">Create or join a family to see its care tasks.</p>
        </div>
      </main>
    );
  }

  const assigneeNameFor = (assignedTo: string | null): string => {
    if (!assignedTo) return "Unassigned";
    return nameById.get(assignedTo) ?? "Unknown member";
  };

  const onCreate = (values: TaskFormValues) => {
    setCreateError(null);
    try {
      if (!elder) {
        throw new Error("Add the elder's profile before creating care tasks.");
      }
      const dueAt = values.dueAt.trim() ? new Date(values.dueAt).toISOString() : null;
      createTask({
        familyId: family.id,
        elderId: elder.id,
        actorId: user.id,
        title: values.title,
        description: values.description,
        category: values.category,
        assignedTo: values.assignedTo || null,
        dueAt,
        priority: values.priority,
      });
      reset();
      reload();
    } catch (err) {
      setCreateError(errorMessage(err));
    }
  };

  const onComplete = (taskId: string) => {
    setActionError(null);
    try {
      completeTask(taskId, user.id);
      reload();
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
          <h1 className="text-3xl font-bold text-forest sm:text-4xl">Care tasks</h1>
          <p className="mt-2 text-lg leading-relaxed">{family.name}</p>
          {isDemo && (
            <p className="mt-4 rounded-lg border border-sage bg-white p-4 text-base">
              Demo mode: care tasks are stored only in this browser.
            </p>
          )}
        </header>

        {actionError && (
          <p role="alert" className="rounded-lg border border-forest bg-white p-4 text-base text-forest">
            {actionError}
          </p>
        )}

        <section aria-labelledby="overdue-heading" className={sectionClass}>
          <h2 id="overdue-heading" className="text-2xl font-semibold text-forest">
            Overdue
          </h2>
          {overdueTasks.length === 0 ? (
            <p className={emptyClass}>No overdue tasks.</p>
          ) : (
            <ul className="space-y-3">
              {overdueTasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  assigneeName={assigneeNameFor(task.assigned_to)}
                  onComplete={onComplete}
                />
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="open-heading" className={sectionClass}>
          <h2 id="open-heading" className="text-2xl font-semibold text-forest">
            Open
          </h2>
          {openTasks.length === 0 ? (
            <p className={emptyClass}>No open tasks.</p>
          ) : (
            <ul className="space-y-3">
              {openTasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  assigneeName={assigneeNameFor(task.assigned_to)}
                  onComplete={onComplete}
                />
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="completed-heading" className={sectionClass}>
          <h2 id="completed-heading" className="text-2xl font-semibold text-forest">
            Completed
          </h2>
          {completedTasks.length === 0 ? (
            <p className={emptyClass}>No completed tasks yet.</p>
          ) : (
            <ul className="space-y-3">
              {completedTasks.map((task) => (
                <TaskItem key={task.id} task={task} assigneeName={assigneeNameFor(task.assigned_to)} />
              ))}
            </ul>
          )}
        </section>

        {tasks.length === 0 && (
          <p className="rounded-lg border border-sage bg-white p-4 text-lg">
            No care tasks yet. Use the form below to create the first one.
          </p>
        )}

        {canCreate ? (
          <section aria-labelledby="create-heading" className={sectionClass}>
            <h2 id="create-heading" className="text-2xl font-semibold text-forest">
              Create a task
            </h2>
            <form
              onSubmit={handleSubmit(onCreate)}
              noValidate
              className="space-y-4 rounded-lg border border-sage bg-white p-4"
            >
              <div>
                <label htmlFor="task-title" className="text-lg font-semibold">
                  Title
                </label>
                <input
                  id="task-title"
                  type="text"
                  autoComplete="off"
                  className={inputClass}
                  aria-invalid={errors.title ? "true" : "false"}
                  aria-describedby={errors.title ? "task-title-error" : undefined}
                  {...register("title", {
                    validate: (value) => {
                      const result = titleSchema.safeParse(value);
                      return result.success || result.error.issues[0]?.message || "Enter a task title.";
                    },
                  })}
                />
                {errors.title && (
                  <p id="task-title-error" role="alert" className="mt-2 text-base text-forest">
                    {errors.title.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="task-description" className="text-lg font-semibold">
                  Description (optional)
                </label>
                <textarea
                  id="task-description"
                  rows={3}
                  className={inputClass}
                  {...register("description")}
                />
              </div>

              <div>
                <label htmlFor="task-category" className="text-lg font-semibold">
                  Category
                </label>
                <select id="task-category" className={inputClass} {...register("category")}>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {CATEGORY_LABELS[c]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="task-assignee" className="text-lg font-semibold">
                  Assignee
                </label>
                <select id="task-assignee" className={inputClass} {...register("assignedTo")}>
                  <option value="">Unassigned</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.user_id}>
                      {memberLabel(m)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="task-due" className="text-lg font-semibold">
                  Due date and time (optional)
                </label>
                <input
                  id="task-due"
                  type="datetime-local"
                  className={inputClass}
                  {...register("dueAt")}
                />
              </div>

              <div>
                <label htmlFor="task-priority" className="text-lg font-semibold">
                  Priority
                </label>
                <select id="task-priority" className={inputClass} {...register("priority")}>
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {PRIORITY_LABELS[p]}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="min-h-12 w-full rounded-lg bg-forest px-6 py-3 text-lg font-semibold text-ivory hover:bg-sage hover:text-charcoal disabled:opacity-60"
              >
                Create task
              </button>

              {createError && (
                <p role="alert" className="rounded-lg border border-forest bg-white p-4 text-base text-forest">
                  {createError}
                </p>
              )}
            </form>
          </section>
        ) : (
          <p className={emptyClass}>Only the family owner or a family member can create care tasks.</p>
        )}
      </div>
    </main>
  );
}
