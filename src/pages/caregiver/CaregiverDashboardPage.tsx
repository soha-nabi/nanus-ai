import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../features/auth/AuthContext";
import DemoRoleSwitcher from "../../components/DemoRoleSwitcher";
import CaregiverNav from "../../components/CaregiverNav";
import {
  checkInShift,
  checkOutShift,
  completeTask,
  getFamily,
  listAssignedElders,
  listMedicationEvents,
  listMedications,
  listShiftsForCaregiver,
  listTasks,
  recordCaregiverAssistance,
  addCaregiverActivity,
  type TaskView,
} from "../../lib/demoStore";
import type {
  CaregiverAssistance,
  CaregiverShift,
  ElderProfile,
  Medication,
  MedicationEvent,
} from "../../lib/types";
import {
  CheckCircle2,
  Clock,
  User,
  HeartHandshake,
  Pill,
  Send,
  LogOut,
  AlertCircle,
  Sparkles,
  ChevronRight,
} from "lucide-react";

interface ElderView extends ElderProfile {
  familyName: string;
}

function errorMessage(err: unknown): string {
  return err instanceof Error && err.message ? err.message : "Something went wrong. Please try again.";
}

function formatTime(iso: string | null): string {
  if (!iso) return "--:--";
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? iso
    : date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function localDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const QUICK_UPDATE_TAGS = [
  "BP & vitals normal",
  "Ate healthy lunch",
  "Took afternoon walk",
  "Good mood & cheerful",
  "Resting comfortably",
  "Needs grocery restock",
];

export default function CaregiverDashboardPage() {
  const { user } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const [updateText, setUpdateText] = useState("");
  const [checkoutNotes, setCheckoutNotes] = useState("");
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [submittingUpdate, setSubmittingUpdate] = useState(false);

  // Load data for this caregiver
  const userId = user?.id ?? "demo-caregiver-1";
  const assignedElders: ElderView[] = listAssignedElders(userId).map((e) => ({
    ...e,
    familyName: getFamily(e.family_id)?.name ?? "Family",
  }));

  const primaryElder = assignedElders[0] ?? null;
  const familyId = primaryElder?.family_id ?? "demo-family-1";

  // Today's shift
  const shifts: CaregiverShift[] = listShiftsForCaregiver(userId);
  const currentShift =
    shifts.find((s) => s.status === "checked_in") ||
    shifts.find((s) => s.status === "scheduled") ||
    shifts[0] ||
    null;

  // Tasks for this family assigned to caregiver or open
  const tasks: TaskView[] = listTasks(familyId).filter(
    (t) => t.assigned_to === userId || !t.assigned_to || t.status === "open"
  );
  const openTasks = tasks.filter((t) => t.status === "open");
  const completedTasks = tasks.filter((t) => t.status === "completed");

  // Today's medicines & events
  const todayKey = localDateKey(new Date());
  const medications: Medication[] = listMedications(familyId).filter(
    (m) => m.status === "active" && m.start_date <= todayKey && (m.end_date === null || m.end_date >= todayKey)
  );
  const medEvents: MedicationEvent[] = listMedicationEvents(familyId);

  const reload = () => setRefreshKey((k) => k + 1);

  // Handlers for the 6 steps:
  const handleCheckIn = () => {
    if (!currentShift) return;
    setActionError(null);
    try {
      checkInShift(currentShift.id, userId);
      setActionNotice("Checked in successfully! Have a great shift.");
      reload();
    } catch (err) {
      setActionError(errorMessage(err));
    }
  };

  const handleCompleteTask = (taskId: string) => {
    setActionError(null);
    try {
      completeTask(taskId, userId);
      setActionNotice("Task marked as completed.");
      reload();
    } catch (err) {
      setActionError(errorMessage(err));
    }
  };

  const handleRecordAssistance = (medicationId: string, time: string, assistance: CaregiverAssistance) => {
    setActionError(null);
    try {
      const scheduledAt = new Date(`${todayKey}T${time}:00`).toISOString();
      recordCaregiverAssistance({
        medicationId,
        familyId,
        scheduledAt,
        actorId: userId,
        assistance,
      });
      setActionNotice(`Recorded medication assistance: ${assistance.replace("_", " ")}.`);
      reload();
    } catch (err) {
      setActionError(errorMessage(err));
    }
  };

  const handlePostUpdate = () => {
    if (!updateText.trim()) return;
    setSubmittingUpdate(true);
    setActionError(null);
    try {
      addCaregiverActivity({
        familyId,
        caregiverUserId: userId,
        actorId: userId,
        activityType: "report",
        description: updateText.trim(),
      });
      setUpdateText("");
      setActionNotice("Care update shared with the family.");
      reload();
    } catch (err) {
      setActionError(errorMessage(err));
    } finally {
      setSubmittingUpdate(false);
    }
  };

  const handleCheckOut = () => {
    if (!currentShift) return;
    setActionError(null);
    try {
      checkOutShift(currentShift.id, userId, checkoutNotes.trim() || "Shift concluded.");
      setActionNotice("Shift completed and handover recorded. Thank you for your care!");
      setCheckoutNotes("");
      reload();
    } catch (err) {
      setActionError(errorMessage(err));
    }
  };

  const isCheckedIn = currentShift?.status === "checked_in";
  const isCompleted = currentShift?.status === "completed";

  return (
    <div className="min-h-screen bg-ivory text-charcoal" key={refreshKey}>
      <DemoRoleSwitcher />
      <CaregiverNav />

      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6 space-y-6">
        {/* Header Greeting & Elder Context */}
        <header className="rounded-2xl border border-sage/60 bg-white p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-forest animate-pulse" />
                <p className="text-xs font-semibold uppercase tracking-wider text-forest">
                  Today's Care Shift
                </p>
              </div>
              <h1 className="mt-1 text-2xl sm:text-3xl font-bold text-forest">
                Hello, {user?.full_name?.split(" ")[0] || "Caregiver"}
              </h1>
              <p className="mt-1 text-sm text-charcoal/70">
                Assigned to:{" "}
                <strong className="text-charcoal font-semibold">
                  {primaryElder?.display_name ?? "Kamala Sharma"}
                </strong>{" "}
                ({primaryElder?.familyName ?? "Sharma Family"})
              </p>
            </div>

            {/* Shift Status Badge */}
            <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 border-sage/40 pt-2 sm:pt-0">
              <span className="text-xs text-charcoal/60">Shift status</span>
              <span
                className={`mt-0.5 rounded-full px-3 py-1 text-xs font-bold ${
                  isCheckedIn
                    ? "bg-forest text-ivory"
                    : isCompleted
                    ? "bg-sage text-forest"
                    : "bg-coral/20 text-charcoal"
                }`}
              >
                {isCheckedIn ? "Checked In (On Duty)" : isCompleted ? "Shift Completed" : "Scheduled"}
              </span>
            </div>
          </div>
        </header>

        {/* Action alerts */}
        {actionNotice && (
          <div
            role="status"
            className="flex items-center justify-between rounded-xl border border-forest/30 bg-forest/10 p-4 text-sm font-medium text-forest"
          >
            <span>{actionNotice}</span>
            <button
              type="button"
              onClick={() => setActionNotice(null)}
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

        {/* 6-STEP GUIDED DAILY WORKFLOW */}
        <section aria-label="Daily Care Checklist" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-forest">Daily Care Checklist</h2>
            <span className="text-xs text-charcoal/60">6-Step Flow</span>
          </div>

          {/* STEP 1: Check In */}
          <div
            className={`rounded-2xl border p-5 transition-all ${
              isCheckedIn
                ? "border-forest/40 bg-white"
                : "border-forest bg-forest/5 shadow-xs"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                    isCheckedIn ? "bg-forest text-ivory" : "bg-forest/20 text-forest"
                  }`}
                >
                  {isCheckedIn ? <CheckCircle2 size={18} /> : "1"}
                </div>
                <div>
                  <h3 className="text-base font-bold text-charcoal">Step 1: Shift Attendance</h3>
                  <p className="mt-0.5 text-xs sm:text-sm text-charcoal/70">
                    {isCheckedIn
                      ? `Checked in at ${formatTime(currentShift?.check_in_at)}. You are currently on duty.`
                      : isCompleted
                      ? `Shift ended at ${formatTime(currentShift?.check_out_at)}.`
                      : "Check in when you arrive at the parent's residence."}
                  </p>
                </div>
              </div>

              {!isCheckedIn && !isCompleted && currentShift && (
                <button
                  type="button"
                  onClick={handleCheckIn}
                  className="rounded-xl bg-forest px-5 py-2.5 text-sm font-semibold text-ivory hover:bg-forest/90 transition-colors shadow-xs"
                >
                  Check In Now
                </button>
              )}

              {isCheckedIn && (
                <span className="flex items-center gap-1.5 rounded-full bg-forest/10 px-3 py-1 text-xs font-semibold text-forest">
                  <Clock size={13} />
                  Active Shift
                </span>
              )}
            </div>
          </div>

          {/* STEP 2: Today's Responsibilities */}
          <div className="rounded-2xl border border-sage/60 bg-white p-5 shadow-xs">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-forest/20 text-forest text-sm font-bold">
                2
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-charcoal">
                    Step 2: Today's Responsibilities
                  </h3>
                  <span className="text-xs font-semibold text-forest/80">
                    For {primaryElder?.display_name ?? "Parent"}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-charcoal/70">
                  Core care instructions agreed with the family:
                </p>

                <div className="mt-3 grid gap-2 sm:grid-cols-2 text-xs">
                  <div className="flex items-center gap-2 rounded-lg bg-ivory p-2.5 border border-sage/40">
                    <HeartHandshake size={15} className="text-forest shrink-0" />
                    <span>Check morning blood pressure & pulse</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg bg-ivory p-2.5 border border-sage/40">
                    <Pill size={15} className="text-forest shrink-0" />
                    <span>Ensure 11:00 AM Metformin with warm water</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg bg-ivory p-2.5 border border-sage/40">
                    <User size={15} className="text-forest shrink-0" />
                    <span>Post-lunch gentle hallway walk (15 mins)</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg bg-ivory p-2.5 border border-sage/40">
                    <Sparkles size={15} className="text-forest shrink-0" />
                    <span>Hydration: at least 3 cups warm water</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* STEP 3: Complete Tasks */}
          <div className="rounded-2xl border border-sage/60 bg-white p-5 shadow-xs">
            <div className="flex items-start gap-3">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                  openTasks.length === 0 ? "bg-forest text-ivory" : "bg-forest/20 text-forest"
                }`}
              >
                {openTasks.length === 0 ? <CheckCircle2 size={18} /> : "3"}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-charcoal">Step 3: Complete Tasks</h3>
                  <span className="text-xs text-charcoal/60">
                    {completedTasks.length} of {tasks.length} done
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-charcoal/70">
                  Tap to mark assigned duties completed today:
                </p>

                <div className="mt-3 space-y-2">
                  {openTasks.length === 0 && completedTasks.length === 0 && (
                    <p className="rounded-lg bg-ivory p-3 text-xs text-charcoal/70">
                      No specific tasks assigned for today.
                    </p>
                  )}

                  {openTasks.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between rounded-xl border border-sage/60 bg-ivory/50 p-3 hover:border-forest/40 transition-colors"
                    >
                      <div className="pr-2">
                        <p className="text-sm font-medium text-charcoal">{t.title}</p>
                        {t.description && (
                          <p className="text-xs text-charcoal/60 mt-0.5">{t.description}</p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCompleteTask(t.id)}
                        className="shrink-0 rounded-lg bg-forest px-3 py-1.5 text-xs font-semibold text-ivory hover:bg-forest/90 transition-colors shadow-xs"
                      >
                        Mark Done
                      </button>
                    </div>
                  ))}

                  {completedTasks.slice(0, 3).map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between rounded-xl border border-sage/40 bg-white p-2.5 text-xs text-charcoal/60 opacity-80"
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-forest" />
                        <span className="line-through">{t.title}</span>
                      </div>
                      <span className="text-[11px] font-semibold text-forest">Done</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* STEP 4: Record Medicine Assistance */}
          <div className="rounded-2xl border border-sage/60 bg-white p-5 shadow-xs">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-forest/20 text-forest text-sm font-bold">
                4
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-charcoal">
                    Step 4: Record Medicine Assistance
                  </h3>
                  <span className="text-xs text-forest font-semibold">Separate Log</span>
                </div>
                <p className="mt-0.5 text-xs text-charcoal/70">
                  Record assistance independently. Parent's own confirmation is stored separately.
                </p>

                <div className="mt-3 space-y-3">
                  {medications.length === 0 ? (
                    <p className="rounded-lg bg-ivory p-3 text-xs text-charcoal/70">
                      No active medicines scheduled for today.
                    </p>
                  ) : (
                    medications.map((med) => {
                      const doseTime = med.scheduled_times[0] || "11:00";
                      const scheduledAtPrefix = `${todayKey}T${doseTime}`;
                      const event = medEvents.find(
                        (e) => e.medication_id === med.id && e.scheduled_at.startsWith(scheduledAtPrefix)
                      );
                      const currentAssistance = event?.caregiver_assistance;

                      return (
                        <div
                          key={med.id}
                          className="rounded-xl border border-sage/60 bg-ivory/40 p-3.5 space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-bold text-charcoal">{med.name}</p>
                              <p className="text-xs text-charcoal/70">
                                {med.instructions} • Time: {doseTime}
                              </p>
                            </div>
                            {currentAssistance ? (
                              <span className="rounded-full bg-forest/15 px-2.5 py-0.5 text-xs font-semibold text-forest">
                                Logged: {currentAssistance === "assisted" ? "Assisted" : "Not Assisted"}
                              </span>
                            ) : (
                              <span className="rounded-full bg-sage/30 px-2 py-0.5 text-[11px] font-medium text-charcoal/70">
                                Awaiting log
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => handleRecordAssistance(med.id, doseTime, "assisted")}
                              className={`flex-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                                currentAssistance === "assisted"
                                  ? "bg-forest text-ivory font-bold"
                                  : "border border-sage/80 bg-white text-charcoal hover:bg-forest/10"
                              }`}
                            >
                              Assisted
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRecordAssistance(med.id, doseTime, "not_assisted")}
                              className={`flex-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                                currentAssistance === "not_assisted"
                                  ? "bg-coral text-white font-bold"
                                  : "border border-sage/80 bg-white text-charcoal hover:bg-coral/10"
                              }`}
                            >
                              Not Assisted
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <p className="mt-2 text-[11px] text-charcoal/60 italic">
                  * Clinical integrity rule: Caregiver assistance never automatically confirms patient ingestion.
                </p>
              </div>
            </div>
          </div>

          {/* STEP 5: Submit a Short Daily Update */}
          <div className="rounded-2xl border border-sage/60 bg-white p-5 shadow-xs">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-forest/20 text-forest text-sm font-bold">
                5
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-charcoal">
                  Step 5: Submit Daily Update
                </h3>
                <p className="mt-0.5 text-xs text-charcoal/70">
                  Share a quick note with the family about appetite, mood, or vitals:
                </p>

                {/* Quick 1-tap tag chips */}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {QUICK_UPDATE_TAGS.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() =>
                        setUpdateText((prev) => (prev ? `${prev}, ${tag}` : tag))
                      }
                      className="rounded-full border border-sage/80 bg-ivory px-3 py-1 text-xs text-charcoal hover:bg-forest/10 transition-colors"
                    >
                      + {tag}
                    </button>
                  ))}
                </div>

                <div className="mt-3 flex gap-2">
                  <input
                    type="text"
                    value={updateText}
                    onChange={(e) => setUpdateText(e.target.value)}
                    placeholder="e.g. Kamala had light porridge, took her walk, and is resting well."
                    className="flex-1 rounded-xl border border-sage bg-white px-3.5 py-2 text-xs sm:text-sm text-charcoal focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest"
                  />
                  <button
                    type="button"
                    disabled={!updateText.trim() || submittingUpdate}
                    onClick={handlePostUpdate}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-forest px-4 py-2 text-xs font-semibold text-ivory hover:bg-forest/90 disabled:opacity-50 transition-colors shadow-xs"
                  >
                    <Send size={14} />
                    <span>Send</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* STEP 6: Check Out */}
          <div
            className={`rounded-2xl border p-5 transition-all ${
              isCompleted ? "border-sage bg-sage/10" : "border-sage/60 bg-white shadow-xs"
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                  isCompleted ? "bg-forest text-ivory" : "bg-forest/20 text-forest"
                }`}
              >
                {isCompleted ? <CheckCircle2 size={18} /> : "6"}
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-charcoal">Step 6: Shift Check-Out</h3>
                <p className="mt-0.5 text-xs text-charcoal/70">
                  {isCompleted
                    ? `Shift completed at ${formatTime(currentShift?.check_out_at)}. Handover filed.`
                    : "When your shift ends, record handover notes and complete check-out."}
                </p>

                {!isCompleted && isCheckedIn && (
                  <div className="mt-3 space-y-3">
                    <input
                      type="text"
                      value={checkoutNotes}
                      onChange={(e) => setCheckoutNotes(e.target.value)}
                      placeholder="Optional final handover note (e.g. All doors locked, dinner ready)"
                      className="w-full rounded-xl border border-sage bg-white px-3.5 py-2 text-xs sm:text-sm text-charcoal focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest"
                    />
                    <button
                      type="button"
                      onClick={handleCheckOut}
                      className="inline-flex items-center gap-2 rounded-xl bg-charcoal px-5 py-2.5 text-xs sm:text-sm font-semibold text-ivory hover:bg-forest transition-colors shadow-xs"
                    >
                      <LogOut size={15} />
                      <span>Complete Shift & Check Out</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Quick navigation footer to other caregiver views */}
        <div className="flex items-center justify-between border-t border-sage/40 pt-4 text-xs font-medium text-forest">
          <Link to="/app/caregiver/tasks" className="hover:underline flex items-center gap-1">
            <span>View all assigned tasks</span>
            <ChevronRight size={14} />
          </Link>
          <Link to="/app/caregiver/activity" className="hover:underline flex items-center gap-1">
            <span>Caregiver history & expenses</span>
            <ChevronRight size={14} />
          </Link>
        </div>
      </main>
    </div>
  );
}
