import { useState } from "react";
import { useAuth } from "../../features/auth/AuthContext";
import DemoRoleSwitcher from "../../components/DemoRoleSwitcher";
import CaregiverNav from "../../components/CaregiverNav";
import { completeTask, getFamily, listAssignedElders, listTasks, type TaskView } from "../../lib/demoStore";
import { CheckCircle2, Clock, AlertCircle } from "lucide-react";

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
        .filter((t) => t.assigned_to === userId || t.status === "open")
        .map((t) => ({
          ...t,
          familyName,
          elderName: elders.find((e) => e.id === t.elder_id)?.display_name ?? "Elder",
        }));
    })
    .sort((a, b) => Number(b.is_overdue) - Number(a.is_overdue));
}

export default function CaregiverTasksPage() {
  const { user } = useAuth();
  const userId = user?.id ?? "demo-caregiver-1";
  const [tasks, setTasks] = useState<TaskRow[]>(() => loadTasks(userId));
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const reload = () => setTasks(loadTasks(userId));

  const onComplete = (taskId: string) => {
    setActionError(null);
    setActionSuccess(null);
    try {
      completeTask(taskId, userId);
      setActionSuccess("Task marked as completed.");
      reload();
    } catch (err) {
      setActionError(errorMessage(err));
    }
  };

  const pendingTasks = tasks.filter((t) => t.status === "open");
  const completedTasks = tasks.filter((t) => t.status === "completed");

  return (
    <div className="min-h-screen bg-ivory text-charcoal">
      <DemoRoleSwitcher />
      <CaregiverNav />

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 space-y-6">
        <header>
          <p className="text-xs font-semibold uppercase tracking-wider text-forest/70">
            Caregiver Responsibilities
          </p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-bold text-forest">My Assigned Tasks</h1>
          <p className="mt-1 text-sm text-charcoal/70">
            Tasks assigned directly to you or open for care assistance.
          </p>
        </header>

        {actionSuccess && (
          <div
            role="status"
            className="flex items-center justify-between rounded-xl border border-forest/30 bg-forest/10 p-4 text-sm font-medium text-forest"
          >
            <span>{actionSuccess}</span>
            <button
              type="button"
              onClick={() => setActionSuccess(null)}
              className="text-xs underline text-forest hover:opacity-80"
            >
              Dismiss
            </button>
          </div>
        )}

        {actionError && (
          <div
            role="alert"
            className="flex items-center gap-2 rounded-xl border border-coral/40 bg-coral/10 p-4 text-sm text-charcoal"
          >
            <AlertCircle size={18} className="shrink-0 text-coral" />
            <span>{actionError}</span>
          </div>
        )}

        {/* Pending Tasks */}
        <section aria-labelledby="pending-heading" className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 id="pending-heading" className="text-base font-bold text-forest">
              Pending Tasks ({pendingTasks.length})
            </h2>
          </div>

          {pendingTasks.length === 0 ? (
            <div className="rounded-2xl border border-sage/60 bg-white p-6 text-center shadow-xs">
              <CheckCircle2 size={32} className="mx-auto text-forest" />
              <p className="mt-2 text-sm font-semibold text-charcoal">All tasks completed!</p>
              <p className="text-xs text-charcoal/70">You have no open tasks at this moment.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingTasks.map((t) => (
                <div
                  key={t.id}
                  className={`rounded-2xl border bg-white p-4 sm:p-5 shadow-xs transition-all ${t.is_overdue ? "border-coral/60 bg-coral/5" : "border-sage/60"
                    }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {t.is_overdue && (
                          <span className="rounded-full bg-coral/20 px-2 py-0.5 text-[11px] font-bold text-charcoal">
                            Overdue
                          </span>
                        )}
                        <span className="text-xs font-semibold text-forest">
                          For: {t.elderName} ({t.familyName})
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-charcoal">{t.title}</h3>
                      {t.description && (
                        <p className="text-xs sm:text-sm text-charcoal/70 leading-relaxed">
                          {t.description}
                        </p>
                      )}
                      {t.due_at && (
                        <p className="flex items-center gap-1 text-xs text-charcoal/60 pt-1">
                          <Clock size={13} />
                          <span>Due: {formatDateTime(t.due_at)}</span>
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => onComplete(t.id)}
                      className="shrink-0 self-start sm:self-center rounded-xl bg-forest px-4 py-2 text-xs sm:text-sm font-semibold text-ivory hover:bg-forest/90 transition-colors shadow-xs"
                    >
                      Mark Completed
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Completed Tasks */}
        {completedTasks.length > 0 && (
          <section aria-labelledby="completed-heading" className="space-y-3 pt-4 border-t border-sage/40">
            <h2 id="completed-heading" className="text-sm font-bold text-charcoal/70">
              Completed Tasks ({completedTasks.length})
            </h2>
            <div className="space-y-2">
              {completedTasks.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between rounded-xl border border-sage/40 bg-white/70 p-3 text-xs text-charcoal/60"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-forest shrink-0" />
                    <span className="line-through">{t.title}</span>
                    <span className="text-charcoal/40">({t.elderName})</span>
                  </div>
                  <span className="text-[11px] font-medium text-forest">Done</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
