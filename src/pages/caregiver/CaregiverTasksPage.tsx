import { useState } from "react";
import { useAuth } from "../../features/auth/AuthContext";
import { completeTask, getFamily, listAssignedElders, listTasks, type TaskView } from "../../lib/demoStore";

interface TaskRow extends TaskView {
  elderName: string;
  familyName: string;
}

function errorMessage(err: unknown): string {
  return err instanceof Error && err.message ? err.message : "Something went wrong. Please try again.";
}

function formatDateTime(iso: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleString();
}

/** Open tasks assigned to this caregiver across every family that approved them. Overdue tasks come first. */
function loadTasks(userId: string | null): TaskRow[] {
  if (!userId) return [];
  const elders = listAssignedElders(userId);
  const familyIds = Array.from(new Set(elders.map((e) => e.family_id)));
  return familyIds
    .flatMap((familyId) => {
      const familyName = getFamily(familyId)?.name ?? "Family";
      return listTasks(familyId)
        .filter((t) => t.assigned_to === userId && t.status === "open")
        .map((t) => ({
          ...t,
          familyName,
          elderName: elders.find((e) => e.id === t.elder_id)?.display_name ?? "Elder",
        }));
    })
    .sort((a, b) => Number(b.is_overdue) - Number(a.is_overdue));
}

export default function CaregiverTasksPage() {
  const { user, isDemo } = useAuth();
  const [tasks, setTasks] = useState<TaskRow[]>(() => loadTasks(user?.id ?? null));
  const [actionError, setActionError] = useState<string | null>(null);

  if (!user) {
    return (
      <main className="min-h-screen bg-ivory px-4 py-10 text-charcoal">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-3xl font-bold text-forest sm:text-4xl">Assigned tasks</h1>
          <p className="mt-4 text-lg leading-relaxed">Sign in to see your tasks.</p>
        </div>
      </main>
    );
  }

  const reload = () => setTasks(loadTasks(user.id));

  const onComplete = (taskId: string) => {
    setActionError(null);
    try {
      completeTask(taskId, user.id);
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
          <h1 className="text-3xl font-bold text-forest sm:text-4xl">Assigned tasks</h1>
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

        {tasks.length === 0 ? (
          <p className={emptyClass}>No open tasks are assigned to you.</p>
        ) : (
          <ul className="space-y-3">
            {tasks.map((task) => {
              const dueText = formatDateTime(task.due_at);
              return (
                <li
                  key={task.id}
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
                      <dt className="inline font-semibold">Elder: </dt>
                      <dd className="inline">{task.elderName}</dd>
                    </div>
                    <div>
                      <dt className="inline font-semibold">Family: </dt>
                      <dd className="inline">{task.familyName}</dd>
                    </div>
                    <div>
                      <dt className="inline font-semibold">Due: </dt>
                      <dd className="inline">{dueText ?? "No due date"}</dd>
                    </div>
                  </dl>
                  <button
                    type="button"
                    onClick={() => onComplete(task.id)}
                    aria-label={`Mark ${task.title} as complete`}
                    className={buttonClass}
                  >
                    Mark complete
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}
